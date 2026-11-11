import urllib.request
import urllib.parse
import re
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'Mozilla/5.0'}

def get_html(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
        return r.read().decode('utf-8', errors='ignore')

homepage = get_html("https://rvils.edu.in/")
links = set(re.findall(r'href=[\"\'](https?://rvils\.edu\.in/[^\"\'#\s]*)[\"\']', homepage))
internal_rel = set(re.findall(r'href=[\"\'](/[^\"\'#\s]+)[\"\']', homepage))
for r_url in internal_rel:
    links.add(urllib.parse.urljoin("https://rvils.edu.in/", r_url))

valid_links = []
for l in links:
    path = urllib.parse.urlparse(l).path.lower()
    if not any(path.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.docx', '.zip', '.css', '.js', '.svg', '.webp']):
        valid_links.append(l)

print(f"Found {len(valid_links)} valid pages on homepage.", flush=True)
for vl in sorted(valid_links):
    print(" - ", vl, flush=True)

with open("d:/hemanth bv/RVILS/found_links.json", "w") as f:
    json.dump(sorted(valid_links), f, indent=2)

