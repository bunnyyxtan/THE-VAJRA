from pypdf import PdfReader
import sys

src = r"C:\monad hackathon\certa\Vajra_PRD_TRD_Security_Blueprint.pdf"
out = r"C:\monad hackathon\certa\vajra_blueprint_extracted.txt"

r = PdfReader(src)
print("PAGES:", len(r.pages))
with open(out, "w", encoding="utf-8") as f:
    for i, p in enumerate(r.pages, 1):
        f.write(f"\n===== PAGE {i} =====\n")
        f.write(p.extract_text() or "")
print("done")
