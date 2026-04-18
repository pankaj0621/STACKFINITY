from fastapi import APIRouter
from schemas import ChatRequest
from core.ai_utils import groq_chat_response

router = APIRouter()

@router.post("/api/chat")
async def chat(req: ChatRequest):
    answer = groq_chat_response(req.message, req.analysisContext)
    return {"answer": answer}