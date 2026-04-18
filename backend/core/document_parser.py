import io

def extract_text_from_pdf(content: bytes) -> str:
    # pypdf se try karo pehle (lightweight)
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        if len(text.strip()) > 100:
            return text.strip()
    except Exception:
        pass
    return ""

def extract_text_from_spreadsheet(content: bytes, filename: str) -> str:
    try:
        import pandas as pd
        df = pd.read_csv(io.BytesIO(content)) if filename.endswith(".csv") \
             else pd.read_excel(io.BytesIO(content))
        return df.head(200).to_string(index=False)
    except Exception:
        return ""