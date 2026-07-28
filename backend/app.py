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
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import json, io, pdfplumber, os, re

from retriever import retrieve
from generator import generate
from exporter import export
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

    return FileResponse(
        path,
        filename=f"{company_name}_case_study.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )


@app.post("/export-pdf/")
async def export_pdf(data: dict):
    """Convert the last generated Word doc to PDF and return it."""
    import subprocess
    company_name = data.get('company_name', 'case_study')
    safe_name = re.sub(r'[^\w\s-]', '', company_name).strip().replace(' ', '_')
    
    docx_path = os.path.join('../outputs/', f'{safe_name}_case_study.docx')
    pdf_path = os.path.join('../outputs/', f'{safe_name}_case_study.pdf')
    
    if not os.path.exists(docx_path):
        raise HTTPException(status_code=404, detail="Word document not found. Generate case first.")
    
    # Convert using LibreOffice (cross-platform)
    try:
        subprocess.run([
            'soffice', '--headless', '--convert-to', 'pdf',
            '--outdir', '../outputs/', docx_path
        ], check=True, timeout=30)
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Fallback: use python-docx2pdf if LibreOffice not available
        try:
            from docx2pdf import convert
            convert(docx_path, pdf_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF conversion failed: {str(e)}")
    
    return FileResponse(
        pdf_path,
        filename=f'{safe_name}_case_study.pdf',
        media_type='application/pdf'
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
