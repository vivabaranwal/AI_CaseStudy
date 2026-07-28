from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json, io, pdfplumber, os
from retriever import retrieve
from generator import generate, load_model
from exporter import export

model_ref = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading base Llama 2 + LoRA adapter... this may take a few minutes.")
    model, tokenizer = load_model()
    model_ref['model'] = model
    model_ref['tokenizer'] = tokenizer
    print("Model loaded and ready.")
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def parse_and_map_sections(case_text: str, prefs: dict) -> dict:
    """Parse Llama 2 output and structure it into UI sections."""
    sections = {
        'BACKGROUND': '',
        'THEMES': '',
        'INTERVENTION': '',
        'RESULTS': '',
        'LEARNING OUTCOMES': ''
    }
    keywords = ['BACKGROUND', 'THEMES', 'INTERVENTION', 'RESULTS', 'LEARNING OUTCOMES']
    
    indices = {}
    for kw in keywords:
        pos = case_text.upper().find(kw)
        if pos != -1:
            indices[kw] = pos
            
    sorted_keywords = sorted(indices.keys(), key=lambda k: indices[k])
    
    for i, kw in enumerate(sorted_keywords):
        start = indices[kw]
        start_idx = start + len(kw)
        if start_idx < len(case_text) and case_text[start_idx] == ':':
            start_idx += 1
        
        if i + 1 < len(sorted_keywords):
            end = indices[sorted_keywords[i+1]]
        else:
            end = len(case_text)
            
        sections[kw] = case_text[start_idx:end].strip()

    # Split BACKGROUND into Opening Hook, Company Background, Industry Context
    bg = sections.get('BACKGROUND', '')
    bg_paragraphs = [p.strip() for p in bg.split('\n\n') if p.strip()]
    
    opening_hook = ""
    company_background = ""
    industry_context = ""
    
    if len(bg_paragraphs) >= 3:
        opening_hook = bg_paragraphs[0]
        company_background = bg_paragraphs[1]
        industry_context = "\n\n".join(bg_paragraphs[2:])
    elif len(bg_paragraphs) == 2:
        opening_hook = bg_paragraphs[0]
        company_background = bg_paragraphs[1]
        industry_context = f"The competitive landscape in the {prefs.get('industry', 'business')} sector remains highly contested, requiring key strategic decisions to ensure operational viability."
    else:
        sentences = bg.split('. ')
        if len(sentences) > 1:
            opening_hook = sentences[0] + "."
            company_background = ". ".join(sentences[1:])
        else:
            opening_hook = bg
            company_background = "Company operational profiles and details are detailed inside the teaching note."
        industry_context = f"The competitive landscape in the {prefs.get('industry', 'business')} sector remains highly contested."

    citations_style = prefs.get('citationStyle', 'APA')
    sources_citations = f"This case study was generated using Retrieval-Augmented Generation (RAG) based on primary company data and public filings. Citations are compiled in accordance with the {citations_style} citation style guide."

    return {
        'Opening Hook': opening_hook,
        'Company Background': company_background,
        'Industry & Competitive Context': industry_context,
        'The Challenge': sections.get('THEMES', 'Strategic operational challenges and market alignment issues.'),
        'Intervention': sections.get('INTERVENTION', 'Specific strategic shift launched to consolidate the brand\'s market position.'),
        'Results & Outcomes': sections.get('RESULTS', 'Operational margins and EBITDA growth observed within two quarters post-consolidation.'),
        'Sources & Citations': sources_citations,
        'Learning Outcomes': sections.get('LEARNING OUTCOMES', 'Key strategic takeaways surrounding unit economics and market positioning.')
    }

@app.post("/generate-case/")
async def generate_case(
    company_name: str = Form(...),
    challenge_text: str = Form(""),
    preferences: str = Form("{}"),
    file: UploadFile = File(None)
):
    pdf_text = ""
    if file:
        content = await file.read()
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                pdf_text += page.extract_text() or ""

    query = challenge_text or pdf_text or company_name
    context = retrieve(query)

    prefs = json.loads(preferences)
    case_text = generate(company_name, context, prefs, model_ref['model'], model_ref['tokenizer'])

    # Export document and store under outputs/
    file_path = export(company_name, case_text, prefs.get('citationStyle', 'APA'))
    
    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=f"{company_name}_case_study.docx"
    )

@app.get("/download-case/")
async def download_case(filename: str):
    path = f"../outputs/{filename}"
    if os.path.exists(path):
        return FileResponse(path, filename=filename, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    return {"error": "File not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
