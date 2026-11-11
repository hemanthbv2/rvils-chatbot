import urllib.request
import re
import json
import ssl
# No external libraries needed

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

TARGET_URLS = [
    "https://rvils.edu.in/",
    "https://rvils.edu.in/about_college/",
    "https://rvils.edu.in/accreditations_affiliations/",
    "https://rvils.edu.in/board_of_management/",
    "https://rvils.edu.in/faculty/",
    "https://rvils.edu.in/programmes/5_year_b_a_ll_b/",
    "https://rvils.edu.in/programmes/5_year_b_b_a_ll_b/",
    "https://rvils.edu.in/programmes/5_year_b_com_ll_b/",
    "https://rvils.edu.in/programmes/3_year_ll_b/",
    "https://rvils.edu.in/admissions/",
    "https://rvils.edu.in/campus_facilities/",
    "https://rvils.edu.in/library/",
    "https://rvils.edu.in/placements/",
    "https://rvils.edu.in/legal_services_clinic/",
    "https://rvils.edu.in/life_at_rvils/cultural_activities/",
    "https://rvils.edu.in/life_at_rvils/sports_activities/",
    "https://rvils.edu.in/life_at_rvils/student_activities/",
    "https://rvils.edu.in/life_at_rvils/youth_red_cross_unit/",
    "https://rvils.edu.in/research/publications/rv_law_journal/",
    "https://rvils.edu.in/contact_us/",
    "https://rvils.edu.in/alumni/",
    "https://rvils.edu.in/academic_calender/",
    "https://rvils.edu.in/circular_and_notification/"
]

def clean_html_to_text(html):
    html = re.sub(r'<(script|style|noscript|header|footer|nav).*?</\1>', ' ', html, flags=re.DOTALL | re.IGNORECASE)
    # Extract headings, paragraphs, list items
    lines = []
    # Replace block tags with newline
    html = re.sub(r'</?(p|div|h1|h2|h3|h4|h5|h6|li|tr|td|th|br|table)[^>]*>', '\n', html, flags=re.IGNORECASE)
    # Strip remaining tags
    text = re.sub(r'<[^>]+>', ' ', html)
    for line in text.split('\n'):
        line = re.sub(r'\s+', ' ', line).strip()
        if len(line) > 2:
            lines.append(line)
    return '\n'.join(lines)

scraped_data = {}

for url in TARGET_URLS:
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=12) as r:
            html = r.read().decode('utf-8', errors='ignore')
            title_m = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
            title = title_m.group(1).strip() if title_m else url
            text = clean_html_to_text(html)
            scraped_data[url] = {
                'url': url,
                'title': title,
                'content': text
            }
            print(f"Scraped {url} ({len(text)} chars)", flush=True)
    except Exception as e:
        print(f"Failed {url}: {e}", flush=True)

with open("d:/hemanth bv/RVILS/rvils_content.json", "w", encoding="utf-8") as f:
    json.dump(scraped_data, f, indent=2, ensure_ascii=False)

print("Saved all pages to rvils_content.json", flush=True)
