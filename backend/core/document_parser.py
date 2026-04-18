import io
from config import PYMUPDF_AVAILABLE, TESSERACT_AVAILABLE, PANDAS_AVAILABLE

if PYMUPDF_AVAILABLE: import fitz
if TESSERACT_AVAILABLE: 
    import pytesseract
    from pdf2image import convert_from_bytes
if PANDAS_AVAILABLE: import pandas as pd

def extract_text_from_pdf(content: bytes) -> str:
    if PYMUPDF_AVAILABLE:
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            text = "".join(page.get_text() for page in doc)
            doc.close()
            if len(text.strip()) > 100: return text.strip()
        except Exception: pass

    if TESSERACT_AVAILABLE:
        try:
            images = convert_from_bytes(content, dpi=200)
            return "".join(pytesseract.image_to_string(img, lang="eng") for img in images).strip()
        except Exception: pass
    return ""

def extract_text_from_spreadsheet(content: bytes, filename: str) -> str:
    if not PANDAS_AVAILABLE: return ""
    try:
        df = pd.read_csv(io.BytesIO(content)) if filename.endswith(".csv") else pd.read_excel(io.BytesIO(content))
        return df.head(200).to_string(index=False)
    except Exception: return ""