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

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json, io, pdfplumber, os, re, glob, base64

from retriever import retrieve
from generator import generate
from exporter import export, export_teaching_note
from scraper import scrape_multiple

app = FastAPI(title="CaseIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/health")
async def health():
    """Quick check that API is running."""
    return {"status": "ok", "message": "CaseIQ backend is running"}


@app.post("/generate-case/")
async def generate_case(
    company_name: str = Form(...),
    challenge_text: str = Form(""),
    protagonist_name: str = Form(""),
    protagonist_title: str = Form(""),
    preferences: str = Form("{}"),
    urls: str = Form("[]"),
    file: UploadFile = File(None)
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

    # 1. Extract PDF text
    pdf_text = ""
    if file and file.filename:
        content = await file.read()
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    pdf_text += page.extract_text() or ""
        except Exception as e:
            print(f"[app] PDF extraction failed: {e}")

    # 2. Scrape URLs
    url_content = ""
    try:
        url_list = json.loads(urls) if urls else []
        if url_list:
            url_content = scrape_multiple(url_list)
    except Exception as e:
        print(f"[app] URL scraping failed: {e}")

    # 3. ChromaDB retrieval
    query = challenge_text or pdf_text[:500] or company_name
    context = retrieve(query)

    # 4. Parse preferences and add protagonist
    prefs = json.loads(preferences) if preferences else {}
    prefs['challengeText'] = challenge_text
    prefs['protagonist'] = f"{protagonist_name}, {protagonist_title}".strip(', ')

    # 5. Generate via Gemini
    case_text = generate(
        company_name=company_name,
        context=context,
        url_content=url_content,
        pdf_text=pdf_text[:2000],
        preferences=prefs
    )

    # 6. Export to Word
    citation_style = prefs.get('citationStyle', 'apa7')
    path = export(company_name, case_text, citation_style)

    teaching_note_path = None
    if prefs.get('includeTeachingNote'):
        tn_content = f"LEARNING OUTCOMES\n• Understand strategic transformation at {company_name}.\n• Analyze key decision points and business challenges.\n\nDISCUSSION QUESTIONS\n1. What were the primary drivers for {company_name}'s strategy?\n2. How should leadership address operational risks?\n\nTEACHING PLAN\n• Introduction (15 mins)\n• Case Analysis (45 mins)\n• Conclusion (15 mins)\n\nKEY CONCEPTS\n• Strategic Resilience\n• Market Positioning\n\nSYNOPSIS\nThis case study examines {company_name}'s operational and strategic challenges."
        teaching_note_path = export_teaching_note(company_name, tn_content, citation_style)

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


@app.post("/export-pdf/")
async def export_pdf(data: dict):
    """Convert the most recently generated Word doc to PDF and return it."""
    company_name = data.get('company_name', 'case_study')
    safe_name = re.sub(r'[^\w\s-]', '', company_name).strip().replace(' ', '_')

    # Absolute path to outputs/ regardless of working directory
    outputs_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'outputs'))

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
        from docx2pdf import convert
        convert(docx_path, pdf_path)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF conversion failed: {str(e)}. Make sure Microsoft Word is installed."
        )

    return FileResponse(
        pdf_path,
        filename=f'{safe_name}_case_study.pdf',
        media_type='application/pdf'
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
