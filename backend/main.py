from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import GROQ_MODEL, groq_client
from routers import analysis, simulate, chat, report, document

app = FastAPI(
    title="FinSight API (Modular)",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(analysis.router)
app.include_router(simulate.router)
app.include_router(chat.router)
app.include_router(report.router)
app.include_router(document.router)

@app.get("/")
def root():
    return {
        "status": "FinSight API Running",
        "ai_engine": f"Groq {GROQ_MODEL}",
        "groq_ready": groq_client is not None
    }

@app.get("/health")
def health():
    return {"status": "ok"}