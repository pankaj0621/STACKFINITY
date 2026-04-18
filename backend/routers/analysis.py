from fastapi import APIRouter
from schemas import AnalyzeRequest
from core.finance_utils import *
from core.ai_utils import groq_analyze

router = APIRouter()

@router.post("/api/analyze")
async def analyze(req: AnalyzeRequest):
    d = req.financialData
    ratios = compute_ratios(d)
    scores = compute_scores(ratios)
    total = compute_total(scores)
    grade = "A" if total >= 80 else "B" if total >= 65 else "C" if total >= 45 else "D"
    risk = "Low Risk" if total >= 80 else "High Risk"
    equity = (d.totalAssets - d.totalLiabilities) / (d.totalAssets or 1)
    invest = min(100, round(total * 0.9 + equity * 10))
    
    altman = compute_altman_z(d)
    shap = compute_shap(scores, total)
    forecast = generate_forecast(req.yearlyData or [], scores)
    benchmarks = generate_benchmarks(ratios, d.industry)
    recommendations = generate_recommendations(scores, ratios)
    
    ai_data = groq_analyze(d, ratios, altman, round(total), grade)

    return {
        "companyName": d.companyName, "industry": d.industry, "totalScore": round(total),
        "grade": grade, "riskLevel": risk, "investScore": invest, "metrics": ratios,
        "scores": scores, "altman": altman, "shapValues": shap, "forecastData": forecast,
        "benchmarks": benchmarks, "recommendations": recommendations, **ai_data
    }