# generator.py — Single responsibility: build prompt and call Gemini API

from openai import OpenAI
from config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_BASE_URL
from citation_formats import (
    CITATION_FORMATS, LENGTH_TARGETS,
    CASE_FORMAT_PROMPTS, TONE_PROMPTS, HOOK_PROMPTS
)

client = OpenAI(
    api_key=GEMINI_API_KEY,
    base_url=GEMINI_BASE_URL
)

SYSTEM_PROMPT = """You are an expert academic case writer with 20 years of experience writing
business school case studies for IFQM, Harvard Business School, IIM Ahmedabad, and Ivey.

Your case studies are:
- Written in clear, professional prose paragraphs — NEVER in JSON, bullet lists, or code
- Grounded in real facts from the provided context
- Structured with clear section headers
- Analytically rich but never prescriptive — you describe what happened, never what should have happened
- The analysis always belongs to the student, not the case

You always follow the exact format, tone, citation style, and length instructions provided."""


def generate(
    company_name: str,
    context: str,
    url_content: str,
    pdf_text: str,
    preferences: dict
) -> str:
    """
    Generate a complete case study using Gemini API.
    
    Args:
        company_name: Name of the company
        context: Retrieved context from ChromaDB RAG
        url_content: Scraped text from user-provided URLs
        pdf_text: Extracted text from uploaded PDFs
        preferences: formState.step4 dict with tone, caseLength, etc.
    
    Returns:
        Generated case study as clean prose string
    """

    # Extract preferences with defaults
    tone = preferences.get('tone', 'academic')
    case_length = preferences.get('caseLength', 'standard')
    hook_style = preferences.get('hookStyle', 'cinematic')
    citation_style = preferences.get('citationStyle', 'apa7')
    case_format = preferences.get('caseFormat', 'ifqm')
    protagonist = preferences.get('protagonist', '')
    challenge_text = preferences.get('challengeText', '')

    # Get format instructions
    length_config = LENGTH_TARGETS.get(case_length, LENGTH_TARGETS['standard'])
    format_instruction = CASE_FORMAT_PROMPTS.get(case_format, CASE_FORMAT_PROMPTS['ifqm'])
    tone_instruction = TONE_PROMPTS.get(tone, TONE_PROMPTS['academic'])
    hook_instruction = HOOK_PROMPTS.get(hook_style, HOOK_PROMPTS['cinematic'])
    citation_instruction = CITATION_FORMATS.get(citation_style, CITATION_FORMATS['apa7'])

    # Build context block
    context_parts = []
    if context:
        context_parts.append(f"SIMILAR CASE STUDIES FROM DATABASE:\n{context}")
    if url_content:
        context_parts.append(f"CONTENT FROM PROVIDED URLs:\n{url_content}")
    if pdf_text:
        context_parts.append(f"CONTENT FROM UPLOADED DOCUMENTS:\n{pdf_text}")
    if challenge_text:
        context_parts.append(f"USER-DESCRIBED THEME/CONTEXT:\n{challenge_text}")

    context_block = "\n\n---\n\n".join(context_parts) if context_parts else "No additional context provided."

    # Build the full prompt
    prompt = f"""
COMPANY: {company_name}
{f'PROTAGONIST: {protagonist}' if protagonist else ''}

CASE FORMAT INSTRUCTIONS:
{format_instruction}

TONE INSTRUCTIONS:
{tone_instruction}

OPENING HOOK STYLE:
{hook_instruction}

CITATION STYLE:
{citation_instruction}

LENGTH REQUIREMENT — THIS IS MANDATORY:
Write exactly {length_config['total_words']} words total. This must produce {length_config['pages']}.
- BACKGROUND section: write AT LEAST {length_config['background']} words. Use multiple paragraphs.
- THEMES section: write AT LEAST {length_config['themes']} words. Discuss each theme in depth.
- INTERVENTION section: write AT LEAST {length_config['intervention']} words. Be detailed and specific.
- RESULTS section: write AT LEAST {length_config['results']} words. Cover all outcomes thoroughly.
- LEARNING OUTCOMES section: write AT LEAST {length_config['learning']} words with 5-6 detailed points.

Do not write short sections. Every section must meet its minimum word count.
If a section feels complete, add more analytical depth, context, and detail.

SOURCE CONTEXT (use this to ground your writing in real facts):
{context_block}

---

IMPORTANT RULES:
1. Write entirely in prose paragraphs — no JSON, no code, no bullet lists except in Learning Outcomes
2. Every factual claim should be grounded in the source context above
3. Never prescribe what the company should have done — only describe what happened
4. Use the exact section headers specified in the case format instructions
5. Write the opening hook exactly as instructed above

Now write the complete case study for {company_name}:"""

    response = client.chat.completions.create(
        model=GEMINI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=8000
    )

    return response.choices[0].message.content
