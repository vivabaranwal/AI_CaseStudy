# scraper.py — Single responsibility: fetch and clean text from URLs

import ipaddress
import socket
from urllib.parse import urlparse

import httpx
import urllib.request
from bs4 import BeautifulSoup
from .config import MAX_URL_CHARS

_ALLOWED_SCHEMES = {"http", "https"}


def _is_public_host(hostname: str) -> bool:
    """
    Resolve hostname and reject anything pointing at a private, loopback,
    link-local (incl. cloud metadata at 169.254.169.254), or reserved
    address, so the scraper can't be used to reach internal services.
    """
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private or ip.is_loopback or ip.is_link_local
            or ip.is_reserved or ip.is_multicast or ip.is_unspecified
        ):
            return False
    return True


def _is_safe_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in _ALLOWED_SCHEMES or not parsed.hostname:
        return False
    return _is_public_host(parsed.hostname)


def scrape_url(url: str) -> str:
    """
    Fetch a URL and return clean extracted text.
    Strips HTML, scripts, navigation, ads.
    Truncates to MAX_URL_CHARS to avoid context overflow.
    Returns empty string on failure — never raises.
    """
    if not _is_safe_url(url):
        print(f"[scraper] Refusing to fetch unsafe/internal URL: {url}")
        return ""

    try:
        # A current browser UA plus the headers real browsers send. Some sites
        # (Wikipedia among them) return 403 for stale or bare user agents.
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
        # Redirects are followed manually (rather than via follow_redirects=True)
        # so each hop's host is re-validated — otherwise a public URL could
        # redirect to an internal address and bypass the check above (SSRF).
        try:
            current_url = url
            with httpx.Client(timeout=15, follow_redirects=False, headers=headers) as hclient:
                for _ in range(5):
                    response = hclient.get(current_url)
                    if response.is_redirect:
                        next_url = str(response.next_request.url)
                        if not _is_safe_url(next_url):
                            print(f"[scraper] Refusing redirect to unsafe URL: {next_url}")
                            return ""
                        current_url = next_url
                        continue
                    response.raise_for_status()
                    html = response.text
                    break
                else:
                    raise RuntimeError("Too many redirects")
        except Exception as primary_err:
            # Some sites (e.g. Wikipedia) fingerprint httpx and return 403 even
            # with browser headers, while urllib succeeds. Retry once via urllib.
            # urllib follows redirects internally, so re-validate the final URL.
            print(f"[scraper] httpx failed for {url} ({primary_err}); retrying with urllib")
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as resp:
                if not _is_safe_url(resp.geturl()):
                    print(f"[scraper] Refusing unsafe redirect target: {resp.geturl()}")
                    return ""
                raw = resp.read()
                charset = resp.headers.get_content_charset() or 'utf-8'
            html = raw.decode(charset, errors='replace')

        soup = BeautifulSoup(html, 'html.parser')

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
