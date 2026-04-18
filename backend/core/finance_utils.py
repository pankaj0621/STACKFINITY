import random
from schemas import FinancialData

def compute_ratios(d: FinancialData) -> dict:
    revenue = d.revenue if d.revenue != 0 else 1
    prev_revenue = d.prevRevenue if d.prevRevenue != 0 else revenue
    current_liab = d.currentLiabilities if d.currentLiabilities != 0 else 1
    total_assets = d.totalAssets if d.totalAssets != 0 else 1
    total_liab = d.totalLiabilities if d.totalLiabilities != 0 else 0
    inventory = d.inventory if d.inventory != 0 else 0
    op_expenses = d.operatingExpenses or (revenue * 0.8)

    working_capital = d.currentAssets - current_liab
    ebitda_proxy = d.netProfit + (op_expenses * 0.1) 
    burn_rate = op_expenses / 12 if op_expenses > 0 else 0

    return {
        "currentRatio": round(d.currentAssets / current_liab, 2),
        "quickRatio": round((d.currentAssets - inventory) / current_liab, 2),
        "debtRatio": round((total_liab / total_assets) * 100, 1),
        "netProfitMargin": round((d.netProfit / revenue) * 100, 1),
        "revenueGrowth": round(((revenue - prev_revenue) / prev_revenue) * 100, 1),
        "assetTurnover": round(revenue / total_assets, 2),
        "equityRatio": round((total_assets - total_liab) / total_assets, 3),
        "expenseRatio": round((op_expenses / revenue) * 100, 1),
        "ebitdaMargin": round((ebitda_proxy / revenue) * 100, 1),
        "workingCapital": f"₹{int(working_capital):,}",
        "burnRate": f"₹{int(burn_rate):,}/mo"
    }

def compute_scores(ratios: dict) -> dict:
    cr = ratios["currentRatio"]
    qr = ratios["quickRatio"]
    dr = ratios["debtRatio"] / 100
    nm = ratios["netProfitMargin"]
    rg = ratios["revenueGrowth"]
    at = ratios["assetTurnover"]

    return {
        "liquidity": min(100, max(0, 100 if cr >= 2 else 80 if cr >= 1.5 else 55 if cr >= 1 else 20)),
        "quickRatio": min(100, max(0, 100 if qr >= 1.5 else 75 if qr >= 1 else 50 if qr >= 0.7 else 20)),
        "debtHealth": min(100, max(0, 100 if dr <= 0.3 else 80 if dr <= 0.5 else 50 if dr <= 0.7 else 15)),
        "profitability": min(100, max(0, 100 if nm >= 20 else 75 if nm >= 10 else 55 if nm >= 5 else 35 if nm >= 0 else 0)),
        "growth": min(100, max(0, 100 if rg >= 20 else 80 if rg >= 10 else 60 if rg >= 0 else 30 if rg >= -10 else 0)),
        "efficiency": min(100, max(0, 100 if at >= 1.5 else 75 if at >= 1 else 50 if at >= 0.5 else 25)),
    }

def compute_total(scores: dict) -> float:
    weights = {"liquidity": 0.20, "quickRatio": 0.15, "debtHealth": 0.25, "profitability": 0.20, "growth": 0.10, "efficiency": 0.10}
    return sum(scores[k] * weights[k] for k in weights)

def compute_altman_z(d: FinancialData) -> dict:
    ta = d.totalAssets or 1
    tl = d.totalLiabilities or 0
    equity = ta - tl

    x1 = (d.currentAssets - d.currentLiabilities) / ta
    x2 = (d.netProfit or 0) / ta
    x3 = (d.netProfit or 0) / ta
    x4 = equity / (tl or 1)
    x5 = (d.revenue or 0) / ta

    z = round(0.717*x1 + 0.847*x2 + 3.107*x3 + 0.420*x4 + 0.998*x5, 2)

    if z >= 2.9: zone, color = "Safe Zone", "#a3e635"
    elif z >= 1.23: zone, color = "Grey Zone", "#fb923c"
    else: zone, color = "Distress Zone", "#f87171"

    percent = min(100, max(0, ((z + 1) / 5) * 100))
    return {"Z": z, "zone": zone, "zoneColor": color, "percent": round(percent, 1)}

def compute_shap(scores: dict, total: float) -> list:
    weights = {"liquidity": 0.20, "quickRatio": 0.15, "debtHealth": 0.25, "profitability": 0.20, "growth": 0.10, "efficiency": 0.10}
    labels = {"liquidity": "Liquidity", "quickRatio": "Quick Ratio", "debtHealth": "Debt Health", "profitability": "Profitability", "growth": "Revenue Growth", "efficiency": "Efficiency"}
    result = [{"key": k, "label": labels[k], "contribution": round((v - 50) * weights[k], 1), "val": v} for k, v in scores.items()]
    return sorted(result, key=lambda x: abs(x["contribution"]), reverse=True)

def generate_forecast(yearly_data: list, scores: dict) -> list:
    last_score = round(compute_total(scores))
    historical = []
    for i, y in enumerate(yearly_data):
        rev = y.revenue or 0
        prev_rev = yearly_data[i - 1].revenue if i > 0 else rev
        gf = ((rev - prev_rev) / (prev_rev or 1)) * 30
        approx = min(95, max(20, last_score - (len(yearly_data) - 1 - i) * 5 + gf))
        historical.append({"period": y.year, "score": round(approx), "type": "historical", "confidence_hi": None, "confidence_lo": None})

    forecast, prev = [], last_score
    for i in range(1, 9):
        q = i % 4 or 4
        yr = 26 + (i - 1) // 4
        nxt = min(98, max(15, prev + (random.random() - 0.45) * 5))
        forecast.append({
            "period": f"Q{q} '{yr:02d}", "score": round(nxt, 1), "type": "forecast",
            "confidence_hi": round(min(100, nxt + 8 + i * 1.5), 1),
            "confidence_lo": round(max(0, nxt - 8 - i * 1.5), 1),
        })
        prev = nxt
    return historical + forecast

def generate_benchmarks(ratios: dict, industry: str) -> dict:
    avgs = {
        "Technology": {"currentRatio": 1.8, "quickRatio": 1.5, "debtRatio": 30.0, "netProfitMargin": 18.0, "revenueGrowth": 25.0, "assetTurnover": 1.2},
        "Manufacturing": {"currentRatio": 1.4, "quickRatio": 0.9, "debtRatio": 50.0, "netProfitMargin": 8.0, "revenueGrowth": 8.0, "assetTurnover": 0.8},
        "Retail": {"currentRatio": 1.2, "quickRatio": 0.6, "debtRatio": 45.0, "netProfitMargin": 5.0, "revenueGrowth": 10.0, "assetTurnover": 1.8},
    }
    ind_avg = avgs.get(industry, {"currentRatio": 1.5, "quickRatio": 1.0, "debtRatio": 40.0, "netProfitMargin": 12.0, "revenueGrowth": 12.0, "assetTurnover": 1.0})
    benchmarks = {}
    for key, avg in ind_avg.items():
        yours = ratios.get(key, 0)
        if key == "debtRatio": status = "better" if yours < avg * 0.9 else "worse" if yours > avg * 1.1 else "onpar"
        else: status = "better" if yours > avg * 1.1 else "worse" if yours < avg * 0.9 else "onpar"
        benchmarks[key] = {"yours": yours, "industry": avg, "status": status}
    return benchmarks

def generate_recommendations(scores: dict, ratios: dict) -> list:
    recs = []
    if scores["liquidity"] < 50:
        recs.append({"priority": "high", "action": "Improve Working Capital", "detail": f"Current ratio is {ratios['currentRatio']}.", "impact": "Boosts Liquidity"})
    elif scores["liquidity"] < 80:
        recs.append({"priority": "medium", "action": "Optimize Inventory Flow", "detail": "Optimize inventory turnover.", "impact": "Improves Quick Ratio"})
    if scores["debtHealth"] < 50:
        recs.append({"priority": "high", "action": "Restructure Debt", "detail": f"Debt ratio is {ratios['debtRatio']}%", "impact": "Reduces Risk"})
    if len(recs) == 0:
        recs.append({"priority": "low", "action": "Maintain Strategy", "detail": "Metrics are robust.", "impact": "Maintains Grade A"})
    return sorted(recs, key=lambda x: 0 if x["priority"] == "high" else 1 if x["priority"] == "medium" else 2)