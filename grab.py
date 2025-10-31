# save as download_wikimedia_ilfracombe.py
import requests, os, time

OUTDIR = "ilfracombe_wikimedia"
os.makedirs(OUTDIR, exist_ok=True)

# Step 1: get image files in Category:Ilfracombe (continues if many pages)
S = requests.Session()
params = {
    "action":"query",
    "format":"json",
    "generator":"categorymembers",
    "gcmtitle":"Category:Ilfracombe",
    "gcmnamespace":"6",     # namespace 6 = files
    "gcmlimit":"50",
    "prop":"imageinfo",
    "iiprop":"url|extmetadata",
}
print("Querying Wikimedia API...")
while True:
    r = S.get("https://commons.wikimedia.org/w/api.php", params=params).json()
    pages = r.get("query", {}).get("pages", {})
    for pid, info in pages.items():
        title = info.get("title")
        ii = info.get("imageinfo", [{}])[0]
        url = ii.get("url")
        license = ii.get("extmetadata", {}).get("LicenseShortName", {}).get("value")
        if not url:
            continue
        fname = os.path.join(OUTDIR, title.replace("File:", "").replace("/", "_"))
        if os.path.exists(fname):
            print("exists:", title); continue
        try:
            print("Downloading:", title, "->", fname)
            with S.get(url, stream=True) as r2:
                r2.raise_for_status()
                with open(fname, "wb") as f:
                    for chunk in r2.iter_content(1024*16):
                        f.write(chunk)
            # save license info next to file
            with open(fname + ".license.txt", "w", encoding="utf-8") as lf:
                lf.write(f"Source: {url}\nTitle: {title}\nLicense: {license}\nAPI page: https://commons.wikimedia.org/wiki/{title.replace(' ','_')}\n")
        except Exception as e:
            print("FAILED:", title, e)
        time.sleep(0.8)
    if 'continue' in r:
        params.update(r['continue'])
    else:
        break
print("Done.")

