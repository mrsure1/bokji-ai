import glob
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

files = glob.glob(r"C:\Users\LJY\Downloads\*바우처*") + glob.glob(
    r"C:\Users\LJY\Downloads\OpenAPI*.docx"
)
print("files:", files[:10])
path = files[0] if files else None
if not path:
    sys.exit("docx not found")

with zipfile.ZipFile(path) as z:
    root = ET.fromstring(z.read("word/document.xml"))

texts = []
for t in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t"):
    if t.text:
        texts.append(t.text)
    if t.tail:
        texts.append(t.tail)

text = "".join(texts)
out = r"D:\MrSure\bokji-ai\scripts\ssis-commoncode-guide.txt"
with open(out, "w", encoding="utf-8") as f:
    f.write(text)

print("written", out, "len", len(text))
for pat in [
    r"https?://apis\.data\.go\.kr[^\s\"]+",
    r"[A-Za-z]+V00\d",
    r"get[A-Za-z0-9]+",
    r"B554287/[A-Za-z0-9]+",
]:
    found = sorted(set(re.findall(pat, text)))
    if found:
        print("---", pat, "---")
        for item in found[:40]:
            print(item)

idx = text.find("apis.data.go.kr")
if idx < 0:
    idx = text.find("공통코드")
print("\n--- sample ---\n")
print(text[max(0, idx - 200) : idx + 5000])
