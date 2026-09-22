# 1. Add your Gemini API key to backend/.env
# GEMINI_API_KEY=your_key_here

# 2. Install dependencies
# pip install -r requirements.txt

# 3. Start backend
# cd backend
# uvicorn app:app --reload
# Runs at http://localhost:8000

# 4. Open frontend
# Open ai_casestudy/index.html in Chrome

# 5. Verify backend health
# Visit http://localhost:8000/health in browser
# Should return {"status": "ok"}

# app.py — Orchestration only. No business logic here.

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import json, io, pdfplumber, os, re, glob, base64, shutil, subprocess

from .retriever import retrieve
from .generator import generate, generate_teaching_note
from .exporter import export, export_teaching_note
from .scraper import scrape_multiple
from .config import OUTPUTS_DIR, MAX_DOC_CHARS, MAX_UPLOAD_BYTES, MAX_PDF_PAGES

app = FastAPI(title="CaseIQ API")

# Basic per-IP abuse protection on the expensive (Gemini/scrape) endpoints.
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Restrict origins via CORS_ORIGINS (comma-separated). Falls back to a
# localhost-only allowlist so an unconfigured deployment fails closed
# instead of accepting requests from any origin.
_origins_env = os.environ.get("CORS_ORIGINS", "").strip()
_allow_origins = (
    [o.strip() for o in _origins_env.split(",") if o.strip()]
    if _origins_env
    else ["http://localhost:5500", "http://127.0.0.1:5500"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"]
)


def _extract_text(filename: str, content: bytes) -> str:
    """
    Extract plain text from an uploaded document.

    Supports PDF, plain text and .docx. Audio/video are not transcribed and are
    reported to the caller rather than silently ignored.
    """
    name = (filename or "").lower()
    try:
        if name.endswith(".pdf"):
            out = []
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                if len(pdf.pages) > MAX_PDF_PAGES:
                    print(f"[app] {filename} exceeds {MAX_PDF_PAGES} pages; truncating")
                for page in pdf.pages[:MAX_PDF_PAGES]:
                    out.append(page.extract_text() or "")
            return "".join(out)

        if name.endswith((".txt", ".md", ".csv")):
            return content.decode("utf-8", errors="replace")

        if name.endswith(".docx"):
            from docx import Document as _Docx
            return chr(10).join(p.text for p in _Docx(io.BytesIO(content)).paragraphs)

        if name.endswith((".mp3", ".mp4", ".wav", ".m4a", ".webm")):
            print(f"[app] Audio/video transcription is not supported: {filename}")
            return ""

        print(f"[app] Unsupported file type: {filename}")
        return ""
    except Exception as e:
        print(f"[app] Text extraction failed for {filename}: {e}")
        return ""


@app.get("/health")
async def health():
    """Quick check that API is running."""
    return {"status": "ok", "message": "CaseIQ backend is running"}


@app.post("/generate-case/")
@limiter.limit("5/minute")
async def generate_case(
    request: Request,
    company_name: str = Form(...),
    challenge_text: str = Form(""),
    protagonist_name: str = Form(""),
    protagonist_title: str = Form(""),
    preferences: str = Form("{}"),
    urls: str = Form("[]"),
    file: UploadFile = File(None),
    files: list[UploadFile] = File(None)
):
    """
    Main generation endpoint.
    1. Extract text from uploaded PDF if provided
    2. Scrape any provided URLs
    3. Retrieve similar context from ChromaDB
    4. Generate case study via Gemini
    5. Export to Word document
    6. Return file download
    """

    # 1. Extract text from every uploaded document.
    # `files` carries the full list; `file` is kept for backward compatibility.
    uploads = [f for f in (files or []) if f and f.filename]
    if file and file.filename and not any(f.filename == file.filename for f in uploads):
        uploads.insert(0, file)

    extracted = []
    for upload in uploads:
        content = await upload.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"{upload.filename} exceeds the {MAX_UPLOAD_BYTES // (1024*1024)}MB upload limit."
            )
        text = _extract_text(upload.filename, content)
        if text:
            extracted.append(f"[Document: {upload.filename}]" + chr(10) + text)
        else:
            print(f"[app] No text extracted from {upload.filename}")

    pdf_text = (chr(10) * 2).join(extracted)

    # 2. Scrape URLs (blocking network I/O — run off the event loop)
    url_content = ""
    try:
        url_list = json.loads(urls) if urls else []
        if url_list:
            url_content = await run_in_threadpool(scrape_multiple, url_list)
    except Exception as e:
        print(f"[app] URL scraping failed: {e}")

    # 3. ChromaDB retrieval (blocking embedding + disk I/O)
    query = challenge_text or pdf_text[:500] or company_name
    context = await run_in_threadpool(retrieve, query)

    # 4. Parse preferences and add protagonist
    prefs = json.loads(preferences) if preferences else {}
    prefs['challengeText'] = challenge_text
    prefs['protagonist'] = f"{protagonist_name}, {protagonist_title}".strip(', ')

    # 5. Generate via Gemini (blocking SDK call — run off the event loop)
    case_text = await run_in_threadpool(
        generate,
        company_name=company_name,
        context=context,
        url_content=url_content,
        pdf_text=pdf_text[:MAX_DOC_CHARS],
        preferences=prefs
    )

    # 6. Export to Word
    citation_style = prefs.get('citationStyle', 'apa7')
    path = export(company_name, case_text, citation_style)

    teaching_note_path = None
    if prefs.get('includeTeachingNote'):
        try:
            tn_content = await run_in_threadpool(
                generate_teaching_note,
                company_name=company_name,
                case_text=case_text,
                preferences=prefs
            )
            teaching_note_path = export_teaching_note(company_name, tn_content, citation_style)
        except Exception as e:
            # The case study itself succeeded; don't fail the whole request
            # just because the supplementary note could not be written.
            print(f"[app] Teaching note generation failed: {e}")

    with open(path, 'rb') as f:
        docx_bytes = base64.b64encode(f.read()).decode('utf-8')

    response_data = {
        "case_text": case_text,
        "docx_base64": docx_bytes,
        "filename": os.path.basename(path),
        "teaching_note_base64": None,
        "teaching_note_filename": None
    }

    if teaching_note_path and os.path.exists(teaching_note_path):
        with open(teaching_note_path, 'rb') as f:
            tn_bytes = base64.b64encode(f.read()).decode('utf-8')
        response_data["teaching_note_base64"] = tn_bytes
        response_data["teaching_note_filename"] = os.path.basename(teaching_note_path)

    return JSONResponse(content=response_data)


def _convert_to_pdf(docx_path: str, pdf_path: str) -> None:
    """
    Convert .docx -> .pdf.

    Uses LibreOffice when available (Linux/containers, i.e. production) and
    falls back to docx2pdf, which requires Microsoft Word (Windows/macOS only).
    """
    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    if soffice:
        subprocess.run(
            [soffice, "--headless", "--convert-to", "pdf",
             "--outdir", os.path.dirname(pdf_path), docx_path],
            check=True, capture_output=True, timeout=120,
        )
        return

    try:
        from docx2pdf import convert
    except ImportError:
        raise RuntimeError(
            "No PDF converter available. Install LibreOffice on the server "
            "or Microsoft Word locally."
        )
    convert(docx_path, pdf_path)


@app.post("/export-pdf/")
@limiter.limit("10/minute")
async def export_pdf(request: Request, data: dict):
    """Convert the most recently generated Word doc to PDF and return it."""
    company_name = data.get('company_name', 'case_study')
    safe_name = re.sub(r'[^\w\s-]', '', company_name).strip().replace(' ', '_')

    # Configured outputs dir (absolute, and overridable via OUTPUTS_DIR env)
    outputs_dir = OUTPUTS_DIR

    # Find all matching .docx files (handles timestamp suffixes like Company_143022_case_study.docx)
    matching = glob.glob(os.path.join(outputs_dir, f'{safe_name}*.docx'))

    if not matching:
        raise HTTPException(
            status_code=404,
            detail=f"No Word document found for '{company_name}'. Generate a case study first."
        )

    # Use most recently created file
    docx_path = max(matching, key=os.path.getctime)
    pdf_path = docx_path.replace('.docx', '.pdf')

    try:
        await run_in_threadpool(_convert_to_pdf, docx_path, pdf_path)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="PDF conversion failed. Check server logs for details."
        )

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail="PDF conversion produced no output file.")

    return FileResponse(
        pdf_path,
        filename=f'{safe_name}_case_study.pdf',
        media_type='application/pdf'
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
