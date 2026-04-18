# =============================================================================
#  FinSight — FastAPI Backend
#  AI-Driven Financial Health Scoring for SMEs
#  Document extraction: PyMuPDF (PDF) + Tesseract (scanned) + pandas (Excel/CSV)
#  AI analysis: Groq (llama-3.3-70b-versatile) — Free & Fast
#  UPDATED: Added endpoints & logic for V4 UI (Simulator, Chat, Benchmarks)
# =============================================================================

import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Poppler path for pdf2image
POPPLER_PATH = r'C:\Users\nandl\Downloads\Release-25.12.0-0.zip\poppler-25.12.0\Library\bin'
import os
import io
import json
import random
import base64
import datetime
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Optional Imports
# ---------------------------------------------------------------------------
try:
    from fpdf import FPDF
    FPDF_AVAILABLE = True
except ImportError:
    FPDF_AVAILABLE = False

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

# ---------------------------------------------------------------------------
load_dotenv()

# =============================================================================
# Gemini Client Setup (for Document Extraction)
# =============================================================================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_model = None

try:
    if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-2.0-flash-lite")
        print("INFO: Gemini client initialized successfully.")
    else:
        print("WARNING: GEMINI_API_KEY is not set in .env — Document extraction will fail.")
except Exception as e:
    print(f"ERROR: Gemini setup failed: {e}")

# =============================================================================
# Groq Client Setup
# =============================================================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client  = None
GROQ_MODEL   = "llama-3.3-70b-versatile"

try:
    from groq import Groq
    if GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here":
        groq_client = Groq(api_key=GROQ_API_KEY)
    else:
        print("WARNING: GROQ_API_KEY is not set in .env — AI analysis will fail.")
except ImportError:
    print("ERROR: 'groq' package not installed. Run: pip install groq")

# =============================================================================
# FastAPI Application
# ==============================================================================
app = FastAPI(
    title="FinSight API",
    version="4.0.0",
    description="AI-powered financial health scoring for SMEs using Groq LLaMA.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://stackfinity.vercel.app", 
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Request / Response Schemas
# =============================================================================

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

# --- New Schemas for Frontend Features ---
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

# =============================================================================
# PDF Generator Class
# =============================================================================

if FPDF_AVAILABLE:
    class FinSightPDF(FPDF):

        def clean(self, text: str) -> str:
            replacements = {
                '\u2013': '-', '\u2014': '-', '\u2015': '-', '\u2018': "'", '\u2019': "'",
                '\u201a': ',', '\u201c': '"', '\u201d': '"', '\u201e': '"', '\u2022': '*',
                '\u2026': '...', '\u2032': "'", '\u2033': '"', '\u00b7': '*', '\u00e2': 'a',
                '\u20ac': 'EUR', '\u00a0': ' ',
            }
            s = str(text)
            for char, rep in replacements.items():
                s = s.replace(char, rep)
            return s.encode('latin-1', 'replace').decode('latin-1')

        def header(self):
            self.set_font("Helvetica", "B", 22)
            self.set_text_color(100, 180, 20)
            self.cell(0, 15, "FinSight Financial Report", ln=True, align="L")
            self.set_font("Helvetica", "I", 10)
            self.set_text_color(100, 100, 100)
            self.cell(0, 5, f"Date: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True)
            self.ln(6)

        def footer(self):
            self.set_y(-15)
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(120, 120, 120)
            self.cell(0, 10, f"Page {self.page_no()} | AI Powered by Groq LLaMA", align="C")

        def section_header(self, label: str):
            self.set_font("Helvetica", "B", 12)
            self.set_text_color(255, 255, 255)
            self.set_fill_color(25, 25, 40)
            self.cell(0, 10, f"  {self.clean(label)}", ln=True, fill=True)
            self.set_text_color(40, 40, 40)
            self.ln(4)

        def two_col_row(self, label: str, value: str, fill: bool = False):
            self.set_fill_color(245, 245, 245)
            self.set_font("Helvetica", "", 10)
            self.set_text_color(60, 60, 60)
            self.cell(95, 9, f"  {self.clean(label)}", border=1, fill=fill)
            self.set_font("Helvetica", "B", 10)
            self.set_text_color(30, 30, 30)
            self.cell(95, 9, f"  {self.clean(value)}", border=1, fill=False)
            self.ln()

        def shap_bar_row(self, label: str, contribution: float, max_contrib: float):
            bar_max_w = 80
            bar_w     = min(bar_max_w, abs(contribution) / max(max_contrib, 1) * bar_max_w)
            is_pos    = contribution >= 0

            self.set_font("Helvetica", "", 9)
            self.set_text_color(60, 60, 60)
            self.cell(50, 8, self.clean(label), border=0)

            x = self.get_x()
            y = self.get_y()

            if is_pos:
                self.set_fill_color(150, 210, 30)
                self.rect(x + 40, y + 1, bar_w, 6, "F")
            else:
                self.set_fill_color(220, 60, 60)
                self.rect(x + 40 - bar_w, y + 1, bar_w, 6, "F")

            self.set_draw_color(180, 180, 180)
            self.line(x + 40, y, x + 40, y + 8)

            self.set_xy(x + 125, y)
            sign  = "+" if is_pos else ""
            color = (80, 150, 10) if is_pos else (180, 40, 40)
            self.set_text_color(*color)
            self.set_font("Helvetica", "B", 9)
            self.cell(30, 8, f"{sign}{contribution} pts", border=0)
            self.ln(9)
            self.set_text_color(40, 40, 40)


# =============================================================================
# Financial Computation Functions
# =============================================================================

def compute_ratios(d: FinancialData) -> dict:
    revenue      = d.revenue if d.revenue != 0 else 1
    prev_revenue = d.prevRevenue if (d.prevRevenue is not None and d.prevRevenue != 0) else revenue
    current_liab = d.currentLiabilities if d.currentLiabilities != 0 else 1
    total_assets = d.totalAssets if d.totalAssets != 0 else 1
    total_liab   = d.totalLiabilities if d.totalLiabilities != 0 else 0
    inventory    = d.inventory if d.inventory != 0 else 0
    op_expenses  = d.operatingExpenses or (revenue * 0.8)

    # Naye metrics frontend ke liye (Working Capital, EBITDA Margin, Burn Rate)
    working_capital = d.currentAssets - current_liab
    ebitda_proxy = d.netProfit + (op_expenses * 0.1) # Proxy estimation
    burn_rate = op_expenses / 12 if op_expenses > 0 else 0

    return {
        "currentRatio":    round(d.currentAssets / current_liab, 2),
        "quickRatio":      round((d.currentAssets - inventory) / current_liab, 2),
        "debtRatio":       round((total_liab / total_assets) * 100, 1),
        "netProfitMargin": round((d.netProfit / revenue) * 100, 1),
        "revenueGrowth":   round(((revenue - prev_revenue) / prev_revenue) * 100, 1),
        "assetTurnover":   round(revenue / total_assets, 2),
        "equityRatio":     round((total_assets - total_liab) / total_assets, 3),
        "expenseRatio":    round((op_expenses / revenue) * 100, 1),
        # Extra metrics
        "ebitdaMargin":    round((ebitda_proxy / revenue) * 100, 1),
        "workingCapital":  f"₹{int(working_capital):,}",
        "burnRate":        f"₹{int(burn_rate):,}/mo"
    }


def compute_scores(ratios: dict) -> dict:
    cr = ratios["currentRatio"]
    qr = ratios["quickRatio"]
    dr = ratios["debtRatio"] / 100
    nm = ratios["netProfitMargin"]
    rg = ratios["revenueGrowth"]
    at = ratios["assetTurnover"]

    return {
        "liquidity":     min(100, max(0, 100 if cr >= 2   else 80 if cr >= 1.5 else 55 if cr >= 1   else 20)),
        "quickRatio":    min(100, max(0, 100 if qr >= 1.5 else 75 if qr >= 1   else 50 if qr >= 0.7 else 20)),
        "debtHealth":    min(100, max(0, 100 if dr <= 0.3 else 80 if dr <= 0.5 else 50 if dr <= 0.7 else 15)),
        "profitability": min(100, max(0, 100 if nm >= 20  else 75 if nm >= 10  else 55 if nm >= 5   else 35 if nm >= 0 else 0)),
        "growth":        min(100, max(0, 100 if rg >= 20  else 80 if rg >= 10  else 60 if rg >= 0   else 30 if rg >= -10 else 0)),
        "efficiency":    min(100, max(0, 100 if at >= 1.5 else 75 if at >= 1   else 50 if at >= 0.5 else 25)),
    }


def compute_total(scores: dict) -> float:
    weights = {
        "liquidity": 0.20, "quickRatio": 0.15, "debtHealth": 0.25,
        "profitability": 0.20, "growth": 0.10, "efficiency": 0.10,
    }
    return sum(scores[k] * weights[k] for k in weights)


def compute_altman_z(d: FinancialData) -> dict:
    ta     = d.totalAssets or 1
    tl     = d.totalLiabilities or 0
    equity = ta - tl

    x1 = (d.currentAssets - d.currentLiabilities) / ta
    x2 = (d.netProfit or 0) / ta
    x3 = (d.netProfit or 0) / ta
    x4 = equity / (tl or 1)
    x5 = (d.revenue or 0) / ta

    z = round(0.717*x1 + 0.847*x2 + 3.107*x3 + 0.420*x4 + 0.998*x5, 2)

    if z >= 2.9:
        zone, color = "Safe Zone", "#a3e635"
    elif z >= 1.23:
        zone, color = "Grey Zone", "#fb923c"
    else:
        zone, color = "Distress Zone", "#f87171"

    percent = min(100, max(0, ((z + 1) / 5) * 100))
    return {"Z": z, "zone": zone, "zoneColor": color, "percent": round(percent, 1)}


def compute_shap(scores: dict, total: float) -> list:
    weights = {
        "liquidity": 0.20, "quickRatio": 0.15, "debtHealth": 0.25,
        "profitability": 0.20, "growth": 0.10, "efficiency": 0.10,
    }
    labels = {
        "liquidity": "Liquidity", "quickRatio": "Quick Ratio",
        "debtHealth": "Debt Health", "profitability": "Profitability",
        "growth": "Revenue Growth", "efficiency": "Efficiency",
    }
    result = [
        {
            "key": k, "label": labels[k],
            "contribution": round((v - 50) * weights[k], 1),
            "val": v,
        }
        for k, v in scores.items()
    ]
    return sorted(result, key=lambda x: abs(x["contribution"]), reverse=True)


def generate_forecast(yearly_data: list, scores: dict) -> list:
    weights = {
        "liquidity": 0.20, "quickRatio": 0.15, "debtHealth": 0.25,
        "profitability": 0.20, "growth": 0.10, "efficiency": 0.10,
    }
    last_score = round(sum(scores[k] * weights[k] for k in weights))

    historical = []
    for i, y in enumerate(yearly_data):
        rev      = y.revenue or 0
        prev_rev = yearly_data[i - 1].revenue if i > 0 else rev
        gf       = ((rev - prev_rev) / (prev_rev or 1)) * 30
        approx   = min(95, max(20, last_score - (len(yearly_data) - 1 - i) * 5 + gf))
        historical.append({
            "period": y.year, "score": round(approx),
            "type": "historical", "confidence_hi": None, "confidence_lo": None,
        })

    forecast, prev = [], last_score
    for i in range(1, 9):
        q     = i % 4 or 4
        yr    = 26 + (i - 1) // 4
        label = f"Q{q} '{yr:02d}"
        nxt   = min(98, max(15, prev + (random.random() - 0.45) * 5))
        forecast.append({
            "period": label, "score": round(nxt, 1), "type": "forecast",
            "confidence_hi": round(min(100, nxt + 8 + i * 1.5), 1),
            "confidence_lo": round(max(0,   nxt - 8 - i * 1.5), 1),
        })
        prev = nxt

    return historical + forecast

# --- Frontend Benchmarks Generate karne ka logic ---
def generate_benchmarks(ratios: dict, industry: str) -> dict:
    avgs = {
        "Technology":    {"currentRatio": 1.8, "quickRatio": 1.5, "debtRatio": 30.0, "netProfitMargin": 18.0, "revenueGrowth": 25.0, "assetTurnover": 1.2},
        "Manufacturing": {"currentRatio": 1.4, "quickRatio": 0.9, "debtRatio": 50.0, "netProfitMargin": 8.0,  "revenueGrowth": 8.0,  "assetTurnover": 0.8},
        "Retail":        {"currentRatio": 1.2, "quickRatio": 0.6, "debtRatio": 45.0, "netProfitMargin": 5.0,  "revenueGrowth": 10.0, "assetTurnover": 1.8},
    }
    ind_avg = avgs.get(industry, {"currentRatio": 1.5, "quickRatio": 1.0, "debtRatio": 40.0, "netProfitMargin": 12.0, "revenueGrowth": 12.0, "assetTurnover": 1.0})
    
    benchmarks = {}
    for key, avg in ind_avg.items():
        yours = ratios.get(key, 0)
        if key == "debtRatio":
            status = "better" if yours < avg * 0.9 else "worse" if yours > avg * 1.1 else "onpar"
        else:
            status = "better" if yours > avg * 1.1 else "worse" if yours < avg * 0.9 else "onpar"
        benchmarks[key] = {"yours": yours, "industry": avg, "status": status}
    return benchmarks

# --- Frontend Recommendations Generate karne ka logic ---
def generate_recommendations(scores: dict, ratios: dict) -> list:
    recs = []
    
    if scores["liquidity"] < 50:
        recs.append({
            "priority": "high", "action": "Improve Working Capital",
            "detail": f"Your current ratio is {ratios['currentRatio']}, which is below the safe threshold of 1.5. Focus on converting short-term assets to cash or reducing short-term liabilities.",
            "impact": "Boosts Liquidity Score by ~20 pts"
        })
    elif scores["liquidity"] < 80:
        recs.append({
            "priority": "medium", "action": "Optimize Inventory Flow",
            "detail": "Liquidity is stable, but optimizing inventory turnover will improve cash flow further.",
            "impact": "Improves Quick Ratio"
        })
        
    if scores["debtHealth"] < 50:
        recs.append({
            "priority": "high", "action": "Restructure High-Interest Debt",
            "detail": f"Debt ratio is {ratios['debtRatio']}%. Strategize to bring this below 40% to reduce interest burden and bankruptcy risk.",
            "impact": "Reduces Bankruptcy Risk significantly"
        })
        
    if scores["profitability"] < 60:
        recs.append({
            "priority": "medium", "action": "Reduce Operating Expenses",
            "detail": f"Net profit margin is only {ratios['netProfitMargin']}%. Analyze fixed costs and target a 10-15% reduction.",
            "impact": "Increases Net Margin by 3-5%"
        })
        
    if scores["growth"] >= 80:
        recs.append({
            "priority": "low", "action": "Explore Expansion Opportunities",
            "detail": "Strong revenue growth detected. This is a favorable time to invest in new markets or product lines.",
            "impact": "Sustains long-term growth trajectory"
        })
        
    if len(recs) == 0:
        recs.append({
            "priority": "low", "action": "Maintain Current Strategy",
            "detail": "All key financial metrics are highly robust. Continue building cash reserves.",
            "impact": "Maintains Grade A standing"
        })
        
    return sorted(recs, key=lambda x: 0 if x["priority"] == "high" else 1 if x["priority"] == "medium" else 2)


# =============================================================================
# Document Text Extraction
# Strategy 1: PyMuPDF  — fast, works on text-based PDFs
# Strategy 2: Gemini Vision — handles scanned/image PDFs natively (if API key set)
# Strategy 3: Tesseract OCR — local fallback for scanned PDFs (if installed)
# =============================================================================

def _pymupdf_extract(content: bytes) -> str:
    """Strategy 1: Extract text from a text-based PDF using PyMuPDF."""
    try:
        import fitz
        doc = fitz.open(stream=content, filetype="pdf")
        text = "".join(page.get_text() for page in doc)
        doc.close()
        return text.strip()
    except ImportError:
        print("[PyMuPDF] Not installed — skipping.")
        return ""
    except Exception as e:
        print(f"[PyMuPDF] Failed: {e}")
        return ""


def _gemini_ocr_extract(content: bytes) -> str:
    """Strategy 2: Send PDF bytes to Gemini Vision and get text back."""
    if not gemini_model:
        print("[Gemini OCR] Gemini not configured — skipping.")
        return ""
    try:
        print("[Gemini OCR] Sending scanned PDF to Gemini Vision...")
        response = gemini_model.generate_content(
            [
                {"mime_type": "application/pdf", "data": content},
                "Extract ALL text content from this document exactly as it appears. "
                "Return only the raw text, no formatting or explanation.",
            ],
            request_options={"timeout": 60},
        )
        text = response.text.strip()
        print(f"[Gemini OCR] Extracted {len(text)} characters via Vision.")
        return text
    except Exception as e:
        print(f"[Gemini OCR] Failed: {e}")
        return ""


def _tesseract_ocr_extract(content: bytes) -> str:
    """Strategy 3: Tesseract OCR with PyMuPDF rendering (no Poppler needed)."""
    try:
        import pytesseract
        import fitz
        from PIL import Image
        import io as _io

        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

        print("[Tesseract] Rendering PDF pages via PyMuPDF...")
        doc = fitz.open(stream=content, filetype="pdf")
        all_text = []

        for i, page in enumerate(doc):
            if i >=3:
                break  # Limit to first 3 pages for speed
            mat = fitz.Matrix(1.5, 1.5)  # 2x se 1.5x — OCR accuracy thodi kam but 2x fast
            pix = page.get_pixmap(matrix=mat)
            img = Image.open(_io.BytesIO(pix.tobytes("png")))
            text = pytesseract.image_to_string(img, lang="eng")
            all_text.append(text)
            print(f"[Tesseract] Page {i+1}: {len(text)} chars")

        doc.close()
        result = "\n".join(all_text).strip()
        print(f"[Tesseract] Total: {len(result)} chars")
        return result

    except Exception as e:
        print(f"[Tesseract] Failed: {e}")
        return ""


def extract_text_from_pdf(content: bytes) -> tuple[str, str]:
    """
    Try all strategies in order until one returns usable text.
    Returns (extracted_text, method_name).
    """
    # Strategy 1: PyMuPDF (fast — text-based PDFs)
    text = _pymupdf_extract(content)
    if len(text) >= 50:
        print(f"[PDF] Strategy 1 (PyMuPDF) succeeded: {len(text)} chars")
        return text, "PyMuPDF"

    print(f"[PDF] PyMuPDF returned only {len(text)} chars — trying OCR strategies...")

    # Strategy 2: Gemini Vision (best for scanned PDFs, needs API key)
    text = _gemini_ocr_extract(content)
    if len(text) >= 50:
        print(f"[PDF] Strategy 2 (Gemini Vision) succeeded: {len(text)} chars")
        return text, "Gemini Vision OCR"

    # Strategy 3: Tesseract (local OCR, needs binary installed)
    text = _tesseract_ocr_extract(content)
    if len(text) >= 50:
        print(f"[PDF] Strategy 3 (Tesseract) succeeded: {len(text)} chars")
        return text, "Tesseract OCR"

    return "", "none"


def extract_text_from_spreadsheet(content: bytes, filename: str) -> str:
    """Extract text from Excel/CSV using Pandas."""
    if not PANDAS_AVAILABLE:
        raise HTTPException(status_code=503, detail="pandas is not installed. Run: pip install pandas openpyxl")
    try:
        fname_lower = filename.lower()
        df = pd.read_csv(io.BytesIO(content)) if fname_lower.endswith(".csv") \
             else pd.read_excel(io.BytesIO(content))
        return df.head(200).to_string(index=False)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Spreadsheet read error: {str(e)}")


def extract_document_and_parse(content: bytes, filename: str) -> tuple[dict, str]:
    """Extract text from file and parse financial data using Groq."""
    fname_lower = filename.lower()

    if fname_lower.endswith(".pdf"):
        raw_text, ocr_method = extract_text_from_pdf(content)
        method = f"{ocr_method} + Groq LLaMA"
    elif fname_lower.endswith((".xlsx", ".xls", ".csv")):
        raw_text = extract_text_from_spreadsheet(content, filename)
        method = "Pandas + Groq LLaMA"
    else:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Please upload a PDF, Excel (.xlsx/.xls), or CSV file."
        )

    print(f"[Extraction] Raw text length: {len(raw_text.strip()) if raw_text else 0} chars")

    if not raw_text or len(raw_text.strip()) < 10:
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not extract any text from this document. "
                "Fixes: (1) Set GEMINI_API_KEY in .env for scanned PDFs, "
                "(2) Install Tesseract OCR for local processing, "
                "(3) Enter data manually."
            )
        )

    print(f"[Extraction] {method} — {len(raw_text)} chars extracted, sending to Groq...")
    parsed = parse_financials_with_groq(raw_text, filename)
    return parsed, method


# =============================================================================
# Groq AI Functions
# =============================================================================

def parse_financials_with_groq(raw_text: str, filename: str) -> dict:
    if not groq_client:
        raise HTTPException(status_code=503, detail="Groq client not initialized. Check GROQ_API_KEY in .env")

    # Truncate large text but keep more context for better parsing
    truncated = raw_text[:6000]

    prompt = f"""You are a financial document parser. Extract financial figures from the document below.

Document: {filename}
---
{truncated}
---

Instructions:
- Return ONLY a valid JSON object. No markdown, no explanation, no extra text.
- All numeric values must be plain numbers only (no Rs, INR, commas, Lakhs, Crores — convert to absolute rupee values).
- If Lakhs: multiply by 100000. If Crores: multiply by 10000000.
- If a field cannot be found, use 0.
- companyName should be a string, all others must be numbers.

Return exactly this JSON structure:
{{
  "companyName": "",
  "revenue": 0,
  "prevRevenue": 0,
  "netProfit": 0,
  "totalAssets": 0,
  "totalLiabilities": 0,
  "currentAssets": 0,
  "currentLiabilities": 0,
  "inventory": 0,
  "operatingExpenses": 0
}}"""

    try:
        print(f"[Groq] Sending {len(truncated)} chars to Groq for parsing...")
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=512,
        )
        raw_response = response.choices[0].message.content.strip()
        print(f"[Groq] Raw response: {raw_response[:300]}")

        # Clean up response — strip markdown fences, leading/trailing text
        cleaned = raw_response
        if "```" in cleaned:
            # Extract content between first ``` and last ```
            parts = cleaned.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    cleaned = part
                    break

        # Find JSON object boundaries in case there is surrounding text
        start = cleaned.find("{")
        end   = cleaned.rfind("}") + 1
        if start != -1 and end > start:
            cleaned = cleaned[start:end]

        parsed = json.loads(cleaned)

        # Ensure all numeric fields are actually numbers
        numeric_fields = [
            "revenue", "prevRevenue", "netProfit", "totalAssets",
            "totalLiabilities", "currentAssets", "currentLiabilities",
            "inventory", "operatingExpenses"
        ]
        for field in numeric_fields:
            val = parsed.get(field, 0)
            try:
                parsed[field] = float(str(val).replace(",", "").replace(" ", "")) if val else 0.0
            except (ValueError, TypeError):
                parsed[field] = 0.0

        print(f"[Groq] Parsed successfully: {parsed}")
        return parsed

    except json.JSONDecodeError as e:
        print(f"[Groq] JSON decode failed. Raw response was: {raw_response}")
        raise HTTPException(status_code=502, detail=f"Groq returned invalid JSON: {str(e)}. Response: {raw_response[:200]}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Groq document parsing error: {str(e)}")


def groq_analyze(d: FinancialData, ratios: dict, altman: dict, total_score: int, grade: str) -> dict:
    if not groq_client:
        raise HTTPException(status_code=503, detail="Groq client not initialized. Check GROQ_API_KEY in .env")

    prompt = f"""You are FinSight AI, an expert financial analyst specializing in SME evaluation.

Company: {d.companyName}
Industry: {d.industry}

Computed Financial Ratios:
- Current Ratio: {ratios['currentRatio']}
- Quick Ratio: {ratios['quickRatio']}
- Debt Ratio: {ratios['debtRatio']}%
- Net Profit Margin: {ratios['netProfitMargin']}%
- Revenue Growth (YoY): {ratios['revenueGrowth']}%
- Asset Turnover: {ratios['assetTurnover']}

Risk Indicators:
- Altman Z-Score: {altman['Z']} - {altman['zone']}
- Overall Health Score: {total_score}/100 (Grade {grade})

Respond with ONLY valid JSON. No markdown. No text outside the JSON object.
Use only simple ASCII characters in your response - avoid dashes like - or -- use plain hyphen - instead.

{{
  "summary": "2 sentences executive-level analysis specific to these numbers",
  "insights": [
    {{"type": "good", "title": "Max 5 words", "text": "1-2 sentences with specific numbers"}},
    {{"type": "warn", "title": "Max 5 words", "text": "1-2 sentences with specific numbers"}},
    {{"type": "good", "title": "Max 5 words", "text": "1-2 sentences with specific numbers"}},
    {{"type": "warn", "title": "Max 5 words", "text": "1-2 sentences with specific numbers"}}
  ],
  "bankruptcyRisk": "2 sentences referencing the Altman Z-Score of {altman['Z']}",
  "investmentVerdict": "1 sentence investment recommendation"
}}"""

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        text = response.choices[0].message.content.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"Groq returned invalid JSON for analysis: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Groq API error: {str(e)}")


# =============================================================================
# API Routes
# =============================================================================

@app.get("/")
def root():
    return {
        "status": "FinSight API is running",
        "version": "4.0.0",
        "ai_engine": f"Groq {GROQ_MODEL}",
        "groq_ready": groq_client is not None,
        "gemini_ready": gemini_model is not None,
        "document_extraction": "Gemini 1.5 Flash (Native Vision — PDF, Images, Excel, CSV)",
    }

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(req: AnalyzeRequest):
    d        = req.financialData
    ratios   = compute_ratios(d)
    scores   = compute_scores(ratios)
    total    = compute_total(scores)
    grade    = "A" if total >= 80 else "B" if total >= 65 else "C" if total >= 45 else "D"
    risk     = "Low Risk" if total >= 80 else "Moderate Risk" if total >= 65 else "High Risk" if total >= 45 else "Critical Risk"
    equity   = (d.totalAssets - d.totalLiabilities) / (d.totalAssets or 1)
    invest   = min(100, round(total * 0.9 + equity * 10))
    altman   = compute_altman_z(d)
    shap     = compute_shap(scores, total)
    forecast = generate_forecast(req.yearlyData or [], scores)
    
    benchmarks = generate_benchmarks(ratios, d.industry)
    recommendations = generate_recommendations(scores, ratios)
    
    ai_data  = groq_analyze(d, ratios, altman, round(total), grade)

    return {
        "companyName":       d.companyName,
        "industry":          d.industry,
        "totalScore":        round(total),
        "grade":             grade,
        "riskLevel":         risk,
        "investScore":       invest,
        "metrics": {
            "currentRatio":    str(ratios["currentRatio"]),
            "quickRatio":      str(ratios["quickRatio"]),
            "debtRatio":       f"{ratios['debtRatio']}%",
            "netProfitMargin": f"{ratios['netProfitMargin']}%",
            "revenueGrowth":   f"{ratios['revenueGrowth']}%",
            "assetTurnover":   str(ratios["assetTurnover"]),
            "ebitdaMargin":    f"{ratios['ebitdaMargin']}%",
            "workingCapital":  str(ratios["workingCapital"]),
            "burnRate":        str(ratios["burnRate"]),
        },
        "scores":            scores,
        "altman":            altman,
        "shapValues":        shap,
        "forecastData":      forecast,
        "benchmarks":        benchmarks,
        "recommendations":   recommendations,
        "summary":           ai_data.get("summary", ""),
        "insights":          ai_data.get("insights", []),
        "bankruptcyRisk":    ai_data.get("bankruptcyRisk", ""),
        "investmentVerdict": ai_data.get("investmentVerdict", ""),
    }

# --- NEW ENDPOINT: Scenario Simulator ---
@app.post("/api/simulate")
async def simulate(req: SimulateRequest):
    d = req.financialData
    scen = req.scenarios
    
    sim_revenue = d.revenue * (1 + scen.revenueChange / 100)
    sim_expenses = d.operatingExpenses * (1 + scen.expenseChange / 100) if d.operatingExpenses else 0
    sim_net_profit = d.netProfit + (sim_revenue - d.revenue) - (sim_expenses - (d.operatingExpenses or 0))
    sim_liab = d.totalLiabilities * (1 + scen.debtChange / 100)
    
    sim_d = FinancialData(
        companyName=d.companyName,
        industry=d.industry,
        revenue=sim_revenue,
        prevRevenue=d.prevRevenue,
        netProfit=sim_net_profit,
        totalAssets=d.totalAssets,
        totalLiabilities=sim_liab,
        currentAssets=d.currentAssets,
        currentLiabilities=d.currentLiabilities,
        inventory=d.inventory,
        operatingExpenses=sim_expenses
    )
    
    ratios = compute_ratios(sim_d)
    scores = compute_scores(ratios)
    total = compute_total(scores)
    grade = "A" if total >= 80 else "B" if total >= 65 else "C" if total >= 45 else "D"
    equity = (sim_d.totalAssets - sim_d.totalLiabilities) / (sim_d.totalAssets or 1)
    invest = min(100, round(total * 0.9 + equity * 10))
    
    return {
        "totalScore": round(total),
        "grade": grade,
        "investScore": invest,
        "metrics": {
            "currentRatio": str(ratios["currentRatio"]),
            "debtRatio": f"{ratios['debtRatio']}%",
            "netProfitMargin": f"{ratios['netProfitMargin']}%",
        }
    }

# --- NEW ENDPOINT: AI Chat Widget ---
@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not groq_client:
        return {"answer": "AI is currently offline. Please configure Groq API Key in your backend."}
        
    context_str = json.dumps(req.analysisContext)
    prompt = f"""You are an expert AI Financial Advisor integrated into the FinSight app. 
You are currently chatting directly with the user about their company's financial report. 
Here is the context of their financial data: {context_str}

User's Message/Question: {req.message}

Respond concisely, professionally, and directly reference their specific financial numbers where applicable. Limit your response to 2-3 short sentences for quick reading."""

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
        )
        return {"answer": response.choices[0].message.content.strip()}
    except Exception as e:
        return {"answer": f"Sorry, I encountered an error while analyzing your data. ({str(e)})"}


# =============================================================================
# PDF Report Generator — ALL ORIGINAL SECTIONS RETAINED + RECOMMENDATIONS ADDED
# =============================================================================
@app.post("/api/generate-report")
async def generate_report(req: ReportRequest):
    if not FPDF_AVAILABLE:
        raise HTTPException(status_code=501, detail="fpdf2 not installed. Run: pip install fpdf2")

    res    = req.results
    form   = req.formData
    charts = req.charts or {}

    pdf = FinSightPDF()
    pdf.add_page()

    company_name = pdf.clean(form.get("companyName", "SME"))
    industry     = pdf.clean(form.get("industry", "General"))
    grade        = res.get("grade", "N/A")
    total_score  = res.get("totalScore", 0)
    risk_level   = pdf.clean(res.get("riskLevel", "N/A"))
    invest_score = res.get("investScore", 0)

    # ── 1. Executive Summary ─────────────────────────────────────────────────
    pdf.section_header("EXECUTIVE SUMMARY")
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 9, f"Company: {company_name}  |  Industry: {industry}", ln=True)
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(80, 140, 10)
    pdf.cell(0, 10, f"Overall Health Score: {total_score}/100  (Grade {grade})", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(0, 6, pdf.clean(res.get("summary", "No summary available.")))
    pdf.ln(6)

    # ── 2. Score Overview ────────────────────────────────────────────────────
    pdf.section_header("SCORE OVERVIEW")
    fill = False
    for label, val in [
        ("Overall Health Score", f"{total_score}/100"),
        ("Grade",                grade),
        ("Risk Level",           risk_level),
        ("Investment Score",     f"{invest_score}/100"),
        ("Investment Verdict",   pdf.clean(res.get("investmentVerdict", "N/A"))),
    ]:
        pdf.two_col_row(label, str(val), fill)
        fill = not fill
    pdf.ln(6)

    # ── 3. Radar Chart ───────────────────────────────────────────────────────
    if charts.get("radar"):
        pdf.section_header("FINANCIAL HEALTH RADAR")
        try:
            img_data   = base64.b64decode(charts["radar"].split(",")[1])
            img_buffer = io.BytesIO(img_data)
            pdf.image(img_buffer, x=50, w=110)
        except Exception as e:
            print(f"[PDF] Radar chart error: {e}")
        pdf.ln(4)

    # ── 4. Bar Chart ─────────────────────────────────────────────────────────
    if charts.get("bar"):
        pdf.section_header("COMPONENT SCORE BREAKDOWN")
        try:
            img_data   = base64.b64decode(charts["bar"].split(",")[1])
            img_buffer = io.BytesIO(img_data)
            pdf.image(img_buffer, x=20, w=170)
        except Exception as e:
            print(f"[PDF] Bar chart error: {e}")
        pdf.ln(4)

    # ── 5. Detailed Financial Metrics ────────────────────────────────────────
    pdf.add_page()
    pdf.section_header("DETAILED FINANCIAL METRICS")
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(220, 220, 220)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(95, 9, "  Metric", border=1, fill=True)
    pdf.cell(95, 9, "  Value",  border=1, fill=True)
    pdf.ln()

    metric_labels = {
        "currentRatio":    "Current Ratio",
        "quickRatio":      "Quick Ratio",
        "debtRatio":       "Debt Ratio",
        "netProfitMargin": "Net Profit Margin",
        "revenueGrowth":   "Revenue Growth (YoY)",
        "assetTurnover":   "Asset Turnover",
        "ebitdaMargin":    "EBITDA Margin",
        "workingCapital":  "Working Capital",
        "burnRate":        "Monthly Burn Rate"
    }
    fill = False
    for key, val in res.get("metrics", {}).items():
        pdf.two_col_row(metric_labels.get(key, key), str(val), fill)
        fill = not fill
    pdf.ln(6)

    # ── 6. Component Scores ───────────────────────────────────────────────────
    pdf.section_header("COMPONENT SCORES (0-100)")
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(220, 220, 220)
    pdf.cell(95, 9, "  Component", border=1, fill=True)
    pdf.cell(95, 9, "  Score",     border=1, fill=True)
    pdf.ln()

    score_labels = {
        "liquidity":     "Liquidity",
        "quickRatio":    "Quick Ratio",
        "debtHealth":    "Debt Health",
        "profitability": "Profitability",
        "growth":        "Revenue Growth",
        "efficiency":    "Efficiency",
    }
    fill = False
    for key, val in res.get("scores", {}).items():
        pdf.two_col_row(score_labels.get(key, key), f"{val}/100", fill)
        fill = not fill
    pdf.ln(6)

    # ── 7. SHAP Attribution ───────────────────────────────────────────────────
    shap_values = res.get("shapValues", [])
    if shap_values:
        pdf.section_header("SHAP EXPLAINABILITY - SCORE DRIVERS")
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(80, 80, 80)
        pdf.multi_cell(0, 5,
            "Each bar shows how much a factor added (+) or reduced (-) "
            "the total score relative to a neutral baseline of 50 pts."
        )
        pdf.ln(4)
        max_contrib = max((abs(s.get("contribution", 0)) for s in shap_values), default=1)
        for sv in shap_values:
            pdf.shap_bar_row(
                pdf.clean(sv.get("label", "")),
                sv.get("contribution", 0),
                max_contrib
            )
        pdf.ln(4)

    # ── 8. Altman Z-Score ─────────────────────────────────────────────────────
    pdf.add_page()
    pdf.section_header("SOLVENCY AND BANKRUPTCY RISK")
    altman = res.get("altman", {})
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 9,
        pdf.clean(f"Altman Z-Score: {altman.get('Z', 'N/A')}  ({altman.get('zone', 'N/A')})"),
        ln=True
    )

    z_pct = altman.get("percent", 50)
    pdf.set_fill_color(220, 220, 220)
    pdf.rect(20, pdf.get_y() + 2, 170, 8, "F")
    bar_color = (163, 230, 53) if altman.get("zone") == "Safe Zone" else \
                (251, 146, 60) if altman.get("zone") == "Grey Zone" else (248, 113, 113)
    pdf.set_fill_color(*bar_color)
    pdf.rect(20, pdf.get_y() + 2, max(4, 170 * z_pct / 100), 8, "F")
    pdf.ln(14)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(56, 6, "Distress  Z<1.23",  border=0)
    pdf.cell(58, 6, "Grey Zone  1.23-2.9", border=0, align="C")
    pdf.cell(56, 6, "Safe Zone  Z>2.9",   border=0, align="R")
    pdf.ln(8)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(50, 50, 50)
    pdf.multi_cell(0, 6, pdf.clean(res.get("bankruptcyRisk", "")))
    pdf.ln(6)

    # ── 9. Risk and Investment ────────────────────────────────────────────────
    pdf.section_header("RISK AND INVESTMENT ASSESSMENT")
    fill = False
    for label, val in [
        ("Risk Level",       risk_level),
        ("Investment Score", f"{invest_score}/100"),
        ("Verdict",          pdf.clean(res.get("investmentVerdict", "N/A"))),
    ]:
        pdf.two_col_row(label, str(val), fill)
        fill = not fill
    pdf.ln(6)

    # ── 10. AI Strategic Insights ─────────────────────────────────────────────
    pdf.section_header("AI STRATEGIC INSIGHTS")
    type_colors = {"good": (60, 140, 10), "warn": (180, 100, 10), "bad": (180, 30, 30)}
    for ins in res.get("insights", []):
        ins_type = ins.get("type", "good")
        color    = type_colors.get(ins_type, (60, 60, 60))
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(*color)
        pdf.cell(0, 7, f"  > {pdf.clean(ins.get('title', '')).upper()}", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(50, 50, 50)
        pdf.multi_cell(0, 5, f"  {pdf.clean(ins.get('text', ''))}")
        pdf.ln(3)
    pdf.ln(4)
    
    # ── 11. Recommendations (NEW) ─────────────────────────────────────────────
    recs = res.get("recommendations", [])
    if recs:
        pdf.section_header("PRIORITY ACTION PLAN")
        for rec in recs:
            pdf.set_font("Helvetica", "B", 10)
            if rec["priority"] == "high":
                pdf.set_text_color(220, 60, 60)
            elif rec["priority"] == "medium":
                pdf.set_text_color(220, 120, 20)
            else:
                pdf.set_text_color(60, 140, 10)
            
            pdf.cell(0, 7, f"[{rec['priority'].upper()}] {pdf.clean(rec['action'])}", ln=True)
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(60, 60, 60)
            pdf.multi_cell(0, 5, f"Detail: {pdf.clean(rec['detail'])}")
            pdf.ln(3)
        pdf.ln(4)

    # ── 12. Forecast Table ────────────────────────────────────────────────────
    forecast_data = res.get("forecastData", [])
    if forecast_data:
        pdf.add_page()
        pdf.section_header("12-MONTH HEALTH SCORE FORECAST")
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_fill_color(220, 220, 220)
        pdf.cell(46, 8, "  Period", border=1, fill=True)
        pdf.cell(46, 8, "  Score",  border=1, fill=True)
        pdf.cell(46, 8, "  High",   border=1, fill=True)
        pdf.cell(46, 8, "  Low",    border=1, fill=True)
        pdf.ln()
        pdf.set_font("Helvetica", "", 9)
        fill = False
        for row in forecast_data:
            pdf.set_fill_color(248, 248, 248) if fill else pdf.set_fill_color(255, 255, 255)
            hi  = str(row.get("confidence_hi", "-")) if row.get("confidence_hi") is not None else "-"
            lo  = str(row.get("confidence_lo", "-")) if row.get("confidence_lo") is not None else "-"
            tag = " (F)" if row.get("type") == "forecast" else ""
            pdf.cell(46, 7, f"  {pdf.clean(str(row.get('period', '')))}{tag}", border=1, fill=fill)
            pdf.cell(46, 7, f"  {row.get('score', '')}",                       border=1, fill=fill)
            pdf.cell(46, 7, f"  {hi}",                                         border=1, fill=fill)
            pdf.cell(46, 7, f"  {lo}",                                         border=1, fill=fill)
            pdf.ln()
            fill = not fill
        pdf.set_font("Helvetica", "I", 8)
        pdf.set_text_color(120, 120, 120)
        pdf.cell(0, 6, "  (F) = Groq AI Forecasted quarter", ln=True)

    # ── Output ────────────────────────────────────────────────────────────────
    pdf_output = io.BytesIO()
    pdf_output.write(pdf.output())
    pdf_output.seek(0)

    safe_name = company_name.replace(" ", "_")
    return StreamingResponse(
        pdf_output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=FinSight_Report_{safe_name}.pdf"}
    )


@app.post("/api/extract-document")
async def extract_document(file: UploadFile = File(...)):
    file_bytes = await file.read()
    filename   = file.filename

    print(f"[extract-document] File received: {filename}, size: {len(file_bytes)} bytes")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="File is empty. Please upload a valid file.")

    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File is too large. Please upload a file smaller than 20MB.")

    try:
        parsed, method = extract_document_and_parse(file_bytes, filename)
        print(f"[extract-document] Success via {method}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[extract-document] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

    fields_found = sum(1 for v in parsed.values() if v and v != 0 and v != "")
    confidence   = min(98, 60 + fields_found * 4)

    return {
        "success":          True,
        "extractionMethod": method,
        "data": {
            **parsed,
            "confidence":      confidence,
            "fieldsExtracted": fields_found,
        },
    }