# FinSight — AI-Driven Financial Health Scoring for SMEs

> **Innovathon 2026 · BIT Sindri E-Summit · Problem Statement PS-9**

FinSight is a full-stack AI-powered financial analysis platform that evaluates the financial health of Small and Medium Enterprises (SMEs) using balance sheet and P&L data. It generates a comprehensive health score, explainable AI insights, bankruptcy risk assessment, and a downloadable PDF report — all powered by Groq LLaMA 3.3 70B.

---

## Live Demo

| Service | URL |
|---|---|
| Frontend | `https://finsight.vercel.app` |
| Backend API | `https://finsight-backend.onrender.com` |

---

## Features

- **AI-Powered Scoring** — Multi-factor weighted algorithm producing a 0–100 financial health score with Grade A/B/C/D
- **Altman Z-Score** — Industry-standard bankruptcy risk model (Safe / Grey / Distress zones)
- **SHAP Explainability** — Shows exactly which financial factors are driving the score up or down
- **12-Month Forecast** — Groq AI-projected quarterly health score trajectory with confidence bands
- **Document OCR** — Upload PDF, Excel, or CSV financial statements for automatic data extraction
- **PDF Report Generation** — Full professional report with charts, metrics, insights, and forecast table
- **Multi-Year Analysis** — Enter data for multiple years to track financial trends
- **3 Demo Presets** — Healthy SME, Struggling Co, Growth Stage for instant testing

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool |
| Recharts | Charts (Radar, Bar, Area) |
| html-to-image | Chart capture for PDF |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Groq (LLaMA 3.3 70B) | AI analysis and insights |
| fpdf2 | PDF report generation |
| PyMuPDF | PDF text extraction (OCR) |
| pandas | Excel/CSV parsing |
| python-dotenv | Environment variable management |

---

## Project Structure

```
finsight/
├── frontend/
│   ├── src/
│   │   ├── FinSight.jsx       # Main React component
│   │   └── main.jsx           # Entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env                   # VITE_API_URL
│
├── backend/
│   ├── main.py                # FastAPI app + all endpoints
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # GROQ_API_KEY
│
└── README.md
```

---

## Getting Started (Local Setup)

### Prerequisites

- Node.js 18+
- Python 3.10+
- Groq API Key (free at [console.groq.com](https://console.groq.com))

### Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo GROQ_API_KEY=your_groq_api_key_here > .env

# Start backend server
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create .env file
echo VITE_API_URL=http://localhost:8000 > .env

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Backend health check |
| POST | `/api/analyze` | Run full financial analysis |
| POST | `/api/generate-report` | Generate PDF report |
| POST | `/api/extract-document` | Extract data from PDF/Excel/CSV |

### Sample Request — `/api/analyze`

```json
{
  "financialData": {
    "companyName": "TechVentures Pvt Ltd",
    "industry": "Technology",
    "revenue": 5000000,
    "prevRevenue": 4200000,
    "netProfit": 750000,
    "totalAssets": 8000000,
    "totalLiabilities": 2400000,
    "currentAssets": 3200000,
    "currentLiabilities": 1500000,
    "inventory": 400000,
    "operatingExpenses": 3800000
  },
  "yearlyData": []
}
```

### Sample Response

```json
{
  "totalScore": 82,
  "grade": "A",
  "riskLevel": "Low Risk",
  "investScore": 79,
  "metrics": {
    "currentRatio": "2.13",
    "quickRatio": "1.87",
    "debtRatio": "30.0%",
    "netProfitMargin": "15.0%",
    "revenueGrowth": "19.0%",
    "assetTurnover": "0.63"
  },
  "altman": {
    "Z": 3.12,
    "zone": "Safe Zone"
  },
  "summary": "AI-generated executive summary...",
  "insights": [...],
  "forecastData": [...]
}
```

---

## Scoring Algorithm

The health score is computed using a weighted multi-factor model:

| Factor | Weight | Metric Used |
|---|---|---|
| Debt Health | 25% | Debt-to-Asset Ratio |
| Liquidity | 20% | Current Ratio |
| Profitability | 20% | Net Profit Margin |
| Quick Ratio | 15% | Quick Ratio |
| Growth | 10% | Revenue Growth YoY |
| Efficiency | 10% | Asset Turnover |

Each factor is scored 0–100 using industry-standard SME thresholds, then combined into a final weighted score.

---

## Deployment

### Backend — Render (Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port 10000`
5. Add environment variable: `GROQ_API_KEY`

### Frontend — Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Settings:
   - Root Directory: `frontend`
   - Framework: Vite
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`

---

## Problem Statement

**PS-9: AI-Driven Financial Health Scoring for SMEs**

> Investors and banks struggle to assess SME creditworthiness using traditional analysis. FinSight automates financial evaluation to assess stability, predict risks, and support informed investment or lending decisions.

**Requirements Met:**

- Financial Data Analysis — Balance sheet and P&L processing
- Core Metrics — Liquidity ratios, debt ratios, revenue growth, expense volatility
- Multi-Factor Scoring — Weighted algorithm integrating 6 financial metrics
- Explainable AI — SHAP-style attribution showing score drivers
- Risk Assessment — Altman Z-Score bankruptcy prediction
- Investment Insights — Investment attractiveness score with AI verdict

---

## Team

Built for **Innovathon 2026** at BIT Sindri E-Summit '26

---

## License

MIT License — Free to use and modify.
