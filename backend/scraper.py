# scraper.py — Single responsibility: fetch and clean text from URLs

import httpx
from bs4 import BeautifulSoup
from config import MAX_URL_CHARS

def scrape_url(url: str) -> str:
    """
    Fetch a URL and return clean extracted text.
    Strips HTML, scripts, navigation, ads.
    Truncates to MAX_URL_CHARS to avoid context overflow.
    Returns empty string on failure — never raises.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = httpx.get(url, timeout=15, follow_redirects=True, headers=headers)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        # Remove noise elements
        for tag in soup(['script', 'style', 'nav', 'footer', 'header',
                        'aside', 'advertisement', 'iframe', 'noscript']):
            tag.decompose()

        # Extract clean text
        text = soup.get_text(separator=' ', strip=True)

        # Collapse whitespace
        import re
        text = re.sub(r'\s+', ' ', text).strip()

        return text[:MAX_URL_CHARS]

    except Exception as e:
        print(f"[scraper] Failed to fetch {url}: {e}")
        return ""


def scrape_multiple(urls: list) -> str:
    """Scrape multiple URLs and combine results."""
    results = []
    for url in urls:
        if url and url.startswith('http'):
            content = scrape_url(url)
            if content:
                results.append(f"[Source: {url}]\n{content}")
    return "\n\n".join(results)
