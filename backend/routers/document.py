import base64
from fastapi import APIRouter, HTTPException, UploadFile, File
from config import groq_client, GROQ_MODEL
from core.document_parser import extract_text_from_pdf, extract_text_from_spreadsheet
import json, re

router = APIRouter()

def extract_with_groq_vision(content: bytes, filename: str) -> dict:
    """PDF bytes base64 mein convert karke Groq ko directly bhejo"""
    if not groq_client:
        raise HTTPException(503, "Groq API Key missing")
    
    # Pehle normal text extraction try karo
    raw_text = extract_text_from_pdf(content)
    
    if raw_text and len(raw_text.strip()) > 100:
        # Text mila — Groq se parse karo
        prompt = f"""Extract financial data from this document: {filename}

Content:
{raw_text[:8000]}

Return ONLY this JSON, no extra text:
{{"companyName":"","revenue":0,"prevRevenue":0,"netProfit":0,"totalAssets":0,"totalLiabilities":0,"currentAssets":0,"currentLiabilities":0,"inventory":0,"operatingExpenses":0}}"""
    else:
        # Text nahi mila — PDF content as base64 bhejo
        b64 = base64.b64encode(content).decode('utf-8')
        prompt = f"""This is a base64 encoded financial document: {filename}
        
The document data (first 10000 chars): {b64[:10000]}

Extract ALL financial figures from this document and return ONLY this JSON:
{{"companyName":"","revenue":0,"prevRevenue":0,"netProfit":0,"totalAssets":0,"totalLiabilities":0,"currentAssets":0,"currentLiabilities":0,"inventory":0,"operatingExpenses":0}}"""

    try:
        res = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=500
        )
        text = res.choices[0].message.content
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError("No JSON in response")
    except Exception as e:
        raise HTTPException(502, f"AI extraction failed: {str(e)}")

@router.post("/api/extract-document")
async def extract_document(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        parsed = extract_with_groq_vision(content, file.filename)
        method = "Groq AI"
    elif filename.endswith((".xlsx", ".xls", ".csv")):
        from core.document_parser import extract_text_from_spreadsheet
        from core.ai_utils import parse_financials_with_groq
        raw_text = extract_text_from_spreadsheet(content, filename)
        if not raw_text or len(raw_text.strip()) < 20:
            raise HTTPException(422, "Could not extract spreadsheet data.")
        parsed = parse_financials_with_groq(raw_text, file.filename)
        method = "Pandas + Groq"
    else:
        raise HTTPException(415, "Unsupported file type. Use PDF, Excel, or CSV.")

    fields_found = sum(1 for v in parsed.values() if v and v != 0 and v != "")

    return {
        "success": True,
        "extractionMethod": method,
        "data": {
            **parsed,
            "confidence": min(98, 60 + fields_found * 4),
            "fieldsExtracted": fields_found
        }
    }