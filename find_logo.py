import urllib.request, re, ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
html = urllib.request.urlopen('https://rvils.edu.in', context=ctx).read().decode('utf-8')
logos = re.findall(r'src=[\"\']([^\"\']*(?:logo|rvils|header)[^\"\']*\.(?:png|jpg|jpeg|svg|webp))[\"\']', html, re.I)
for l in set(logos):
    print("Logo candidate:", l)

