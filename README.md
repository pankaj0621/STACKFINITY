For Stage 1: The Bulletproof Core, the focus is on reliability, data validation, and ensuring the AI communication is structured and predictable.

Here is the professional README.md specifically tailored for Stage 1.

FinSight — Stage 1: The Bulletproof Core
Overview
Stage 1 focuses on transforming the prototype into a production-ready engine. The primary objectives are to implement Strict JSON Schema validation for AI responses, Data Integrity Checks to ensure financial accuracy, and a Robust OCR Pipeline that validates mathematical consistency before analysis.

Core Objectives
Structured AI Communication: Transitioning from raw text prompts to Groq JSON Mode using Pydantic schemas.

Financial Math Validation: Implementing a logic layer to verify Balance Sheet and P&L consistency (e.g., Assets=Liabilities+Equity).

Error Resiliency: Graceful handling of OCR failures and malformed financial documents.

Demo Stability: Implementation of a "Safe-Fail" demo mode for presentation reliability.

Folder Structure (Stage 1)
The project is split into a modern React frontend and a FastAPI backend, now including a dedicated schemas/ and utils/ layer for data validation.

Plaintext
finsight/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point & routes
│   │   ├── core/
│   │   │   ├── config.py        # Environment & API settings
│   │   │   └── security.py      # Rate limiting & API keys
│   │   ├── schemas/
│   │   │   ├── request.py       # Pydantic models for incoming SME data
│   │   │   └── response.py      # Pydantic models for structured AI output
│   │   ├── services/
│   │   │   ├── ai_engine.py     # Groq LLaMA 3.3 wrapper (JSON Mode)
│   │   │   ├── extractor.py     # OCR & Document parsing logic
│   │   │   └── analyzer.py      # Deterministic financial ratio calculations
│   │   └── utils/
│   │       ├── math_check.py    # Consistency checks (Accounting logic)
│   │       └── exceptions.py    # Custom error handlers for UI feedback
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── forms/           # Validated data entry components
│   │   │   ├── feedback/        # Error boundaries and status alerts
│   │   │   └── shared/          # Reusable UI elements (Buttons, Inputs)
│   │   ├── hooks/               # Custom API fetching & state logic
│   │   ├── context/             # Global state (Financial Data Context)
│   │   ├── FinSight.jsx         # Main Dashboard Layout
│   │   └── theme.js             # Styling constants
│   ├── package.json
│   └── vite.config.js
│
└── README.md
Stage 1 Development Checklist
1. Backend: The Validation Layer
[ ] Define Pydantic Schemas for the 0-100 Health Score, SHAP drivers, and Forecast points.

[ ] Implement check_accounting_integrity() utility to catch OCR errors (e.g., total assets not matching).

[ ] Set up Groq JSON Mode system prompts to ensure 100% parseable responses.

2. Frontend: User Experience & Feedback
[ ] Add Form Validation (Zod/Yup) to prevent negative values or empty fields.

[ ] Create an OCR Review Step: Allow users to edit extracted data before sending it for AI analysis.

[ ] Implement Loading States: Detailed progress indicators (e.g., "Extracting text...", "Validating Math...", "AI Analysis in progress...").

3. API Reliability
[ ] Implement Standardized Error Responses: Ensure the frontend knows exactly why a call failed (Math Error vs. API Timeout).

[ ] Create a demo_preset.json for instant, error-free testing during the hackathon pitch.

Tech Stack (Stage 1)
Backend: FastAPI, Groq SDK, Pydantic v2, PyMuPDF.

Frontend: React 18, Vite, Axios.

Validation: Pydantic (Backend), Zod (Frontend).

How to use this structure
Initialize the backend with the app/ directory pattern to keep logic separated from routes.

Define your Schemas before writing your AI prompts; this forces you to decide exactly what the "Bulletproof" output looks like.

Prioritize Math Checks; if the numbers don't add up, even the best AI will give a bad health score.
