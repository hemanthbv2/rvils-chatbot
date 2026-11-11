import urllib.request
import urllib.parse
import re
import json
import ssl
from html.parser import HTMLParser

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def fetch_url(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            content_type = resp.headers.get('content-type', '')
            if 'text/html' in content_type:
                return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
    return None

class LinkExtractor(HTMLParser):
    def __init__(self, base_url):
        super().__init__()
        self.base_url = base_url
        self.links = set()
        self.text_parts = []
    
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            for k, v in attrs:
                if k == 'href' and v:
                    clean_v = v.split('#')[0].strip()
                    if clean_v:
                        full_url = urllib.parse.urljoin(self.base_url, clean_v)
                        parsed = urllib.parse.urlparse(full_url)
                        if 'rvils.edu.in' in parsed.netloc and not any(full_url.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.docx', '.zip']):
                            self.links.add(full_url)
                            
    def handle_data(self, data):
        text = data.strip()
        if text:
            self.text_parts.append(text)

def clean_text(html):
    # Remove script and style elements
    html = re.sub(r'<script.*?</script>', ' ', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style.*?</style>', ' ', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<noscript.*?</noscript>', ' ', html, flags=re.DOTALL | re.IGNORECASE)
    parser = LinkExtractor("")
    parser.feed(html)
    return ' '.join(parser.text_parts)

visited = set()
to_visit = ["https://rvils.edu.in/"]
site_data = {}

print("Starting RVILS scrape...")
while to_visit and len(visited) < 40:
    current = to_visit.pop(0)
    if current in visited:
        continue
    visited.add(current)
    print(f"Crawling ({len(visited)}): {current}")
    
    html = fetch_url(current)
    if not html:
        continue
    
    parser = LinkExtractor(current)
    parser.feed(html)
    
    cleaned = clean_text(html)
    # Extract title
    title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    title = title_match.group(1).strip() if title_match else current
    
    site_data[current] = {
        'url': current,
        'title': title,
        'text_snippet': cleaned[:2000],
        'full_text': cleaned
    }
    
    for l in parser.links:
        if l not in visited and l not in to_visit:
            to_visit.append(l)

print(f"Scraped {len(site_data)} pages.")
with open("d:/hemanth bv/RVILS/rvils_raw_scraped.json", "w", encoding="utf-8") as f:
    json.dump(site_data, f, indent=2, ensure_ascii=False)

print("Saved raw scraped data to rvils_raw_scraped.json")

