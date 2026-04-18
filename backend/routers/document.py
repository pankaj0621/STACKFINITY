from fastapi import APIRouter, HTTPException, UploadFile, File
from core.document_parser import extract_text_from_pdf, extract_text_from_spreadsheet
from core.ai_utils import parse_financials_with_groq

router = APIRouter()

@router.post("/api/extract-document")
async def extract_document(file: UploadFile = File(...)):
    content, filename = await file.read(), file.filename.lower()
    method = "unknown"

    if filename.endswith(".pdf"):
        raw_text, method = extract_text_from_pdf(content), "PDF Extraction"
    elif filename.endswith((".xlsx", ".xls", ".csv")):
        raw_text, method = extract_text_from_spreadsheet(content, filename), "Pandas"
    else:
        raise HTTPException(415, "Unsupported file type.")

    if not raw_text or len(raw_text.strip()) < 20:
        raise HTTPException(422, "Could not extract text.")

    parsed = parse_financials_with_groq(raw_text, file.filename)
    fields_found = sum(1 for v in parsed.values() if v and v != 0 and v != "")
    
    return {"success": True, "extractionMethod": method, "data": {**parsed, "confidence": min(98, 60 + fields_found * 4), "fieldsExtracted": fields_found}}