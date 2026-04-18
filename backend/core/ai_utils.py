import json
from fastapi import HTTPException
from config import groq_client, GROQ_MODEL
from schemas import FinancialData

def parse_financials_with_groq(raw_text: str, filename: str) -> dict:
    if not groq_client: raise HTTPException(status_code=503, detail="Groq API Key missing")
    prompt = f"""Extract financial figures as JSON from {filename}. Content: {raw_text[:4000]}
    Use schema: {{"companyName":"","revenue":0,"prevRevenue":0,"netProfit":0,"totalAssets":0,"totalLiabilities":0,"currentAssets":0,"currentLiabilities":0,"inventory":0,"operatingExpenses":0}}"""
    try:
        res = groq_client.chat.completions.create(model=GROQ_MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.1)
        text = res.choices[0].message.content.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Parsing error: {str(e)}")

def groq_analyze(d: FinancialData, ratios: dict, altman: dict, total_score: int, grade: str) -> dict:
    if not groq_client: raise HTTPException(status_code=503, detail="Groq API Key missing")
    prompt = f"""Analyze SME: {d.companyName}, Industry: {d.industry}, Score: {total_score}/100.
    Return ONLY JSON: {{"summary":"2 sentences","insights":[{{"type":"good/warn","title":"","text":""}}],"bankruptcyRisk":"","investmentVerdict":""}}"""
    try:
        res = groq_client.chat.completions.create(model=GROQ_MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.3)
        text = res.choices[0].message.content.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Analysis error: {str(e)}")

def groq_chat_response(message: str, context: dict) -> str:
    if not groq_client: return "AI is offline."
    prompt = f"Context: {json.dumps(context)}. Question: {message}. Reply in 2-3 short sentences."
    try:
        res = groq_client.chat.completions.create(model=GROQ_MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.5)
        return res.choices[0].message.content.strip()
    except Exception as e:
        return f"Error: {str(e)}"