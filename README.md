# 🚀 FinSight — SME Financial Health Analyzer (Stage 1)

## 📌 Overview

**FinSight** is an AI-powered financial analysis platform designed to evaluate the financial health of Small and Medium Enterprises (SMEs).

In **Stage 1**, the focus is on building a working prototype that:

* Extracts financial data from uploaded documents
* Validates basic accounting consistency
* Computes key financial ratios
* Generates a simple financial health overview

---

## 🎯 Problem Statement

SMEs often struggle with:

* Understanding financial health
* Access to structured financial insights
* Manual and error-prone financial analysis

FinSight solves this by automating extraction + analysis using AI.

---

## 🧠 Stage 1 Features

### ✅ Document Processing

* Upload financial documents (PDF/Image)
* Extract structured financial data using OCR

### ✅ Data Validation

* Basic accounting check:

  * Assets = Liabilities + Equity

### ✅ Financial Analysis

* Key ratio calculations:

  * Profit Margin
  * Debt-to-Equity Ratio
  * Current Ratio

### ✅ AI Integration (Basic)

* Structured response using Groq (LLaMA)
* JSON-based output

### ✅ Simple Dashboard

* Upload → View extracted data → See results

---

## 🏗️ Project Structure

```
finsight/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/routes.py
│   │   ├── core/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── FinSight.jsx
│   │   └── theme.js
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## ⚙️ Tech Stack

### Backend

* FastAPI
* Python
* Pydantic
* OCR (Tesseract / equivalent)
* Groq API (LLaMA 3)

### Frontend

* React (Vite)
* JavaScript
* Context API

---

## 🚀 Getting Started

### 🔧 Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# or
source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
```

Create a `.env` file:

```
GROQ_API_KEY=your_api_key_here
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

---

### 💻 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔌 API Endpoints (Stage 1)

### 📤 Upload & Extract

```
POST /extract
```

* Input: File (PDF/Image)
* Output: Extracted structured financial data

---

### 📊 Analyze Financial Data

```
POST /analyze
```

* Input: JSON financial data
* Output: Financial ratios + basic score

---

## 🧪 Sample Workflow

1. Upload financial document
2. Extract data via OCR
3. Verify/correct data (optional UI)
4. Run analysis
5. View financial insights

---

## ⚠️ Limitations (Stage 1)

* Basic OCR accuracy (no advanced correction yet)
* Rule-based analysis (no ML models)
* Limited financial metrics
* No historical trend analysis

---

## 🔮 Future Improvements

* ML-based financial scoring (XGBoost/Random Forest)
* SHAP explainability
* Industry benchmarking
* Forecasting (12-month projections)
* PDF report generation

---

## 👨‍💻 Team Notes (Hackathon Strategy)

* Focus on working prototype over perfection
* Ensure:

  * End-to-end flow works ✅
  * UI is clean and simple ✅
  * Demo is smooth ✅

---

## 📜 License

This project is for educational and hackathon purposes.

---

## ⭐ Final Note

FinSight is built to simplify financial intelligence for SMEs using AI.

**Stage 1 = Foundation. Execution matters more than complexity.**
