from fastapi import APIRouter
from schemas import SimulateRequest, FinancialData
from core.finance_utils import compute_ratios, compute_scores, compute_total

router = APIRouter()

@router.post("/api/simulate")
async def simulate(req: SimulateRequest):
    d, scen = req.financialData, req.scenarios
    sim_revenue = d.revenue * (1 + scen.revenueChange / 100)
    sim_expenses = d.operatingExpenses * (1 + scen.expenseChange / 100) if d.operatingExpenses else 0
    sim_net_profit = d.netProfit + (sim_revenue - d.revenue) - (sim_expenses - (d.operatingExpenses or 0))
    sim_liab = d.totalLiabilities * (1 + scen.debtChange / 100)
    
    sim_d = FinancialData(
        companyName=d.companyName, industry=d.industry, revenue=sim_revenue, prevRevenue=d.prevRevenue,
        netProfit=sim_net_profit, totalAssets=d.totalAssets, totalLiabilities=sim_liab,
        currentAssets=d.currentAssets, currentLiabilities=d.currentLiabilities,
        inventory=d.inventory, operatingExpenses=sim_expenses
    )
    
    ratios = compute_ratios(sim_d)
    scores = compute_scores(ratios)
    total = compute_total(scores)
    grade = "A" if total >= 80 else "B" if total >= 65 else "C" if total >= 45 else "D"
    equity = (sim_d.totalAssets - sim_d.totalLiabilities) / (sim_d.totalAssets or 1)
    
    return {
        "totalScore": round(total), "grade": grade, 
        "investScore": min(100, round(total * 0.9 + equity * 10)),
        "metrics": {"currentRatio": str(ratios["currentRatio"]), "debtRatio": f"{ratios['debtRatio']}%", "netProfitMargin": f"{ratios['netProfitMargin']}%"}
    }