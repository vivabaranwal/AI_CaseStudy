# citation_formats.py — All citation format templates

CITATION_FORMATS = {
    "general": """No formal citation style. Do not include in-text citations or reference numbers.
Write in clean narrative prose without any citation markers.
At the end, include a simple 'Sources' section listing the main references used, formatted as plain text bullet points.""",

    "apa7": """Use APA 7th Edition for all citations.
In-text format: (Author, Year)
Reference list format: Author, A. A. (Year). Title of work. Publisher. DOI/URL
Example in-text: (Goyal & Sharma, 2023)
Example reference: Goyal, D., & Sharma, R. (2023). Digital transformation in Indian retail. Journal of Business Strategy, 14(2), 45–62.""",

    "apa6": """Use APA 6th Edition format for all citations.
In-text format: (Author, Year)
Reference list format: Author, A. A. (Year). Title of work. Publisher.
Example in-text: (Tata Motors, 2023)
Example reference: Tata Motors. (2023). Annual report 2023. Tata Motors Limited. Retrieved from https://www.tatamotors.com""",

    "harv": """Use Harvard referencing format throughout.
In-text format: (Author Year, p.XX)
Reference list format: Author (Year) Title. Place of publication: Publisher.
Example in-text: (Narayana Murthy 2021, p.34)
Example reference: Narayana Murthy, N. (2021) Building Infosys. Bangalore: Infosys Press.""",

    "harvard": """Use Harvard referencing format throughout.
In-text format: (Author Year, p.XX)
Reference list format: Author (Year) Title. Place of publication: Publisher.
Example in-text: (Narayana Murthy 2021, p.34)
Example reference: Narayana Murthy, N. (2021) Building Infosys. Bangalore: Infosys Press.""",

    "chicago": """Use Chicago 17th Edition with footnotes.
Place numbered footnotes inline in text like this: word.¹
Footnote format: Firstname Lastname, "Article Title," Publication Name, Date, page number.
Example footnote: 1. Deepinder Goyal, "Zomato's Expansion Strategy," Economic Times, March 2023, 12.
Bibliography at end in Chicago format.""",

    "hbs": """Use Harvard Business School citation style.
Footnotes only, numbered sequentially starting at 1.
Format: Author Name, "Title," Publication/Source, Date, page.
Example: 1. Salil Parekh, "Infosys Annual Report 2023," Infosys Limited, April 2023, 14.
No in-text author-date citations. Footnotes appear at bottom of each page.""",

    "mla": """Use MLA 9th Edition format.
In-text format: (Author page)
Works Cited format: Last, First. Title. Publisher, Year.
Example in-text: (Tata 45)
Example Works Cited: Tata, Ratan. Leadership at Scale. Penguin India, 2022.""",

    "none": "Do not include any citations or references in the output."
}

SECTION_STRUCTURES = {
    "general": [
        "BACKGROUND",
        "CHALLENGE",
        "ROOT CAUSE ANALYSIS",
        "INTERVENTION / APPROACH",
        "IMPLEMENTATION",
        "RESULTS AND IMPACT",
        "RECOMMENDATIONS",
        "FUTURE SCOPE"
    ],
    "apa7": [
        "BACKGROUND",
        "THEMES",
        "INTERVENTION",
        "RESULTS",
    ],
    "apa6": [
        "BACKGROUND",
        "THEMES",
        "INTERVENTION",
        "RESULTS",
    ],
    "harvard": [
        "BACKGROUND",
        "THEMES",
        "INTERVENTION",
        "RESULTS",
    ],
    "chicago": [
        "BACKGROUND",
        "THEMES",
        "INTERVENTION",
        "RESULTS",
    ],
    "mla": [
        "BACKGROUND",
        "THEMES",
        "INTERVENTION",
        "RESULTS",
    ]
}

LENGTH_TARGETS = {
    "short": {
        "total_words": 1500,
        "background": 250,
        "themes": 200,
        "intervention": 300,
        "results": 200,
        "learning": 150,
        "pages": "4–6 pages"
    },
    "standard": {
        "total_words": 6000,
        "background": 1200,
        "themes": 1000,
        "intervention": 1400,
        "results": 1000,
        "learning": 600,
        "pages": "14–16 pages"
    },
    "long": {
        "total_words": 9000,
        "background": 1800,
        "themes": 1500,
        "intervention": 2000,
        "results": 1500,
        "learning": 800,
        "pages": "20–24 pages"
    }
}

CASE_FORMAT_PROMPTS = {
    "ifqm": """Follow IFQM Standard case format.
Sections in order: BACKGROUND, THEMES, INTERVENTION, RESULTS.
Open with a brief situational overview.""",

    "hbs": """Follow Harvard Business School case format.
Open with a named protagonist facing a specific decision at a precise moment in time.
Example opening: 'In March 2023, Deepinder Goyal, CEO of Zomato, stared at the quarterly numbers...'
Sections: BACKGROUND, INDUSTRY CONTEXT, THE CHALLENGE, INTERVENTION, RESULTS, EXHIBITS, TEACHING NOTE.
Place all data tables in numbered Exhibits at the end.
End with an open question the protagonist must now answer — do not resolve it.""",

    "ivey": """Follow Ivey Business School case format.
Ground the case in emerging market or cross-cultural business context.
Sections: BACKGROUND, COMPETITIVE LANDSCAPE, THE DECISION, ANALYSIS, RESULTS.
Include a clear decision point that students must evaluate.
Use Harvard citation style.""",

    "iima": """Follow IIM Ahmedabad case format.
Use a structured analytical approach with formal academic tone.
Sections: INTRODUCTION, COMPANY OVERVIEW, INDUSTRY ANALYSIS, THE PROBLEM, STRATEGIC OPTIONS, OUTCOMES, DISCUSSION QUESTIONS.
Include 4–6 discussion questions at the end for classroom use.
Use APA 7th citation style.""",

    "custom": """Follow standard academic case writing format.
Sections: BACKGROUND, THEMES, INTERVENTION, RESULTS.
Use clear section headers and professional prose throughout."""
}

TONE_PROMPTS = {
    "academic": "Write in formal academic prose. Use passive voice where appropriate. Maintain analytical distance. Avoid contractions.",
    "semi-academic": "Write in clear, readable academic prose. Active voice preferred. Accessible to advanced undergraduates.",
    "consulting": "Write in structured consulting style. Use clear section headers, concise paragraphs, and data-driven observations. Think McKinsey case document.",
    "business style": "Write in professional business narrative style. Engaging, clear, direct. Suitable for executive education.",
    "none": "Write in clear neutral prose appropriate for the subject matter."
}

HOOK_PROMPTS = {
    "cinematic": "Open with a vivid, specific scene — place the protagonist in a room, at a moment, facing a decision. Name them. Give the exact date or quarter.",
    "statistical": "Open with a striking number or data point that immediately establishes the scale of the situation.",
    "question": "Open with a provocative rhetorical question that frames the central dilemma of the case."
}
