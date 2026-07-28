import os
import re
import json
import pdfplumber

def clean_text(text):
    if not text:
        return ""
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_heuristics(pdf_path):
    print(f"Parsing: {os.path.basename(pdf_path)}...")
    
    text_content = ""
    pages_text = []
    metadata = {}
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            metadata = pdf.metadata or {}
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text() or ""
                pages_text.append(page_text)
                text_content += "\n" + page_text
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
        return None

    # Try to find a good title
    title = metadata.get("Title")
    if not title or title.strip() == "" or title.lower().endswith(".pdf"):
        # Look at the first page non-empty lines
        if pages_text:
            lines = [line.strip() for line in pages_text[0].split('\n') if line.strip()]
            for line in lines[:5]:
                # If a line seems like a title, use it
                if len(line) > 10 and not any(kw in line.lower() for kw in ["abstract", "introduction", "journal", "volume", "issn"]):
                    title = line
                    break
            if not title and lines:
                title = lines[0]
    
    if not title:
        title = os.path.splitext(os.path.basename(pdf_path))[0].replace("-", " ").replace("_", " ").title()

    title = clean_text(title)

    # Heuristic Protagonists (Look for Mr./Ms./Dr./Prof. followed by Name)
    protagonist_matches = re.findall(r'\b(Mr\.|Ms\.|Dr\.|Mrs\.|Prof\.)[ \t]+([A-Z][a-zA-Z]+(?:[ \t]+[A-Z][a-zA-Z]+)*)\b', text_content)
    protagonists = []
    for salutation, name in protagonist_matches:
        cleaned_name = clean_text(name)
        full_name = f"{salutation} {cleaned_name}"
        if full_name not in protagonists:
            protagonists.append(full_name)
    
    # Try to find protagonist candidate (first matched name, or placeholder)
    protagonist_name = protagonists[0] if protagonists else "[Insert Protagonist Name]"
    
    # Heuristic Organization: look for words ending in Ltd., Inc., Corp., Co.
    org_matches = re.findall(r'\b([A-Z][a-zA-Z0-9]+(?:[ \t]+[A-Z][a-zA-Z0-9]+)*)[ \t]+(Ltd|Inc|Corp|Co|Limited|Corporation|Company)\b', text_content)
    organizations = []
    for org_name, suffix in org_matches:
        cleaned_org = clean_text(org_name)
        full_org = f"{cleaned_org} {suffix}"
        if full_org not in organizations:
            organizations.append(full_org)
            
    # Also scan for some known company names in the case study names
    known_companies = ["Infosys", "Wipro", "Zomato", "Tata", "Reliance", "Lloyd Business School"]
    for company in known_companies:
        if company.lower() in text_content.lower() and company not in organizations:
            organizations.append(company)
            
    org_name = organizations[0] if organizations else "[Insert Organization Name]"

    # Heuristic Setting / Time Period: Look for years (1990 - 2026)
    years = re.findall(r'\b(199\d|20[0-2]\d)\b', text_content)
    time_period = f"Around {max(set(years), key=years.count)}" if years else "[Insert Setting/Time Period]"

    # Heuristic Opening Crisis & Core Challenge snippets
    # Scan first 3 pages (where hook usually is) for challenge/crisis sentences
    crisis_snippet = "[Insert the Opening Crisis / Hook]"
    challenge_snippet = "[Insert the Core Challenge / Strategic Dilemma]"
    
    crisis_keywords = ["crisis", "critical", "struggle", "deadline", "urgency", "confront", "sudden", "drop", "loss"]
    challenge_keywords = ["challenge", "problem", "dilemma", "issue", "decision", "faced", "strategic", "objective"]
    
    found_crisis = False
    found_challenge = False
    
    # Parse sentences from first few pages
    sentence_regex = re.compile(r'[^.!?]*[.!?]')
    
    for page_idx, page_text in enumerate(pages_text[:3]):
        if found_crisis and found_challenge:
            break
        sentences = sentence_regex.findall(page_text)
        for sentence in sentences:
            sentence = clean_text(sentence)
            if len(sentence) < 30 or len(sentence) > 200:
                continue
                
            if not found_crisis and any(kw in sentence.lower() for kw in crisis_keywords):
                crisis_snippet = f"[Suggested from Page {page_idx+1}]: \"{sentence}\""
                found_crisis = True
            elif not found_challenge and any(kw in sentence.lower() for kw in challenge_keywords):
                challenge_snippet = f"[Suggested from Page {page_idx+1}]: \"{sentence}\""
                found_challenge = True

    # Identify potential stakeholders (names that are not the primary protagonist)
    stakeholders_list = []
    for p in protagonists[:4]:
        if p != protagonist_name:
            stakeholders_list.append({
                "name": p,
                "role": "[Insert Role for " + p + "]",
                "perspective_or_concern": "[Insert Perspective for " + p + "]"
            })
            
    if not stakeholders_list:
        stakeholders_list.append({
            "name": "[Insert Stakeholder Name]",
            "role": "[Insert Stakeholder Role]",
            "perspective_or_concern": "[Insert Stakeholder's main concern or viewpoint]"
        })

    # Heuristic Exhibits: search for words "Exhibit X" or "Table X"
    exhibit_matches = re.findall(r'\b(Exhibit\s+\d+|Table\s+\d+)\b', text_content, re.IGNORECASE)
    exhibits_list = []
    seen_exhibits = set()
    for ex in exhibit_matches:
        ex_normalized = ex.title()
        if ex_normalized not in seen_exhibits:
            seen_exhibits.add(ex_normalized)
            exhibits_list.append({
                "exhibit_identifier": ex_normalized,
                "exhibit_title": "[Insert title of exhibit]",
                "key_insights": "[Insert key insights derived from this exhibit]"
            })
            
    if not exhibits_list:
        exhibits_list.append({
            "exhibit_identifier": "[e.g., Exhibit 1]",
            "exhibit_title": "[Insert title of exhibit]",
            "key_insights": "[Insert key insights derived from this exhibit]"
        })

    # Heuristic Academic Themes: search for common topics in case studies
    theme_map = {
        "work-life balance": "Work-Life Balance & Stress Management",
        "corporate governance": "Corporate Governance & Ethics",
        "customer service": "Customer Service Excellence",
        "digital transformation": "Digital Transformation & Business Re-engineering",
        "retention": "Employee Retention & HR Strategy",
        "leadership": "Strategic Leadership & Management",
        "marketing": "Marketing Strategy & Brand Positioning"
    }
    detected_themes = []
    for kw, theme in theme_map.items():
        if kw in text_content.lower():
            detected_themes.append(theme)
            
    if not detected_themes:
        detected_themes.append("[Insert academic/theoretical theme]")

    # Build final structured dict
    case_json = {
        "case_study_id": os.path.splitext(os.path.basename(pdf_path))[0],
        "source_filename": os.path.basename(pdf_path),
        "title": title,
        "protagonist": {
            "name": protagonist_name,
            "role": "[Insert Protagonist Role/Title - e.g., CEO, Manager]",
            "organization": org_name,
            "key_decisions": [
                "[Insert Key Decision 1 that protagonist needs to make]"
            ]
        },
        "context": {
            "industry": "[Insert Industry - e.g., Information Technology, Manufacturing]",
            "geography": "[Insert Geographic Location]",
            "time_period": time_period,
            "company_background": "[Insert brief company background context]"
        },
        "narrative_arc": {
            "opening_crisis": crisis_snippet,
            "core_challenge": challenge_snippet,
            "key_events_timeline": [
                {
                    "date_or_period": "[Insert Date/Period]",
                    "event_description": "[Insert Event Description]"
                }
            ]
        },
        "stakeholders": stakeholders_list,
        "exhibits_and_data": exhibits_list,
        "discussion_questions": [
            "[Insert discussion question 1 used for classroom analysis]"
        ],
        "academic_themes": detected_themes
    }
    
    return case_json

def main():
    raw_dir = os.path.join(".", "data", "raw_cases")
    structured_dir = os.path.join(".", "data", "structured")
    
    # Create structured directory if it doesn't exist
    os.makedirs(structured_dir, exist_ok=True)
    
    if not os.path.exists(raw_dir):
        print(f"Error: Raw cases directory '{raw_dir}' does not exist.")
        return
        
    pdf_files = [f for f in os.listdir(raw_dir) if f.lower().endswith(".pdf")]
    
    if not pdf_files:
        print(f"No PDF files found in '{raw_dir}'.")
        return
        
    print(f"Found {len(pdf_files)} PDFs in '{raw_dir}'. Starting parsing...\n")
    
    success_count = 0
    for pdf_file in pdf_files:
        pdf_path = os.path.join(raw_dir, pdf_file)
        case_data = extract_heuristics(pdf_path)
        
        if case_data:
            out_filename = os.path.splitext(pdf_file)[0] + ".json"
            out_path = os.path.join(structured_dir, out_filename)
            try:
                with open(out_path, 'w', encoding='utf-8') as f:
                    json.dump(case_data, f, indent=2, ensure_ascii=False)
                print(f"Successfully generated template: {out_filename}\n")
                success_count += 1
            except Exception as e:
                print(f"Error writing output to {out_path}: {e}\n")
                
    print(f"Parsing complete. Successfully generated templates for {success_count}/{len(pdf_files)} cases.")

if __name__ == "__main__":
    main()
