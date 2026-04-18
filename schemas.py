from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class FinancialData(BaseModel):
    companyName: Optional[str] = "SME Company"
    industry: Optional[str] = "General"
    revenue: float
    prevRevenue: Optional[float] = None
    netProfit: float
    totalAssets: float
    totalLiabilities: float
    currentAssets: float
    currentLiabilities: float
    inventory: Optional[float] = 0.0
    operatingExpenses: Optional[float] = 0.0

class YearlyEntry(BaseModel):
    year: str
    revenue: Optional[float] = 0
    netProfit: Optional[float] = 0
    totalAssets: Optional[float] = 0
    totalLiabilities: Optional[float] = 0
    currentAssets: Optional[float] = 0
    currentLiabilities: Optional[float] = 1
    inventory: Optional[float] = 0
    operatingExpenses: Optional[float] = 0

class AnalyzeRequest(BaseModel):
    financialData: FinancialData
    yearlyData: Optional[List[YearlyEntry]] = []

class ReportRequest(BaseModel):
    results: dict
    formData: dict
    charts: Optional[dict] = None

class ScenarioData(BaseModel):
    revenueChange: float
    expenseChange: float
    debtChange: float

class SimulateRequest(BaseModel):
    financialData: FinancialData
    scenarios: ScenarioData

class ChatRequest(BaseModel):
    message: str
    analysisContext: Dict[str, Any]