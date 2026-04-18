from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from config import GROQ_MODEL, groq_client
from routers import analysis, simulate, chat, report, document

app = FastAPI(title="FinSight API", version="4.0.0")

# CORS — explicitly har response pe header lagao
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
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