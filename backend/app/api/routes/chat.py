from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ChatMessage(BaseModel):
    thread_id: str
    message: str

@router.post("/")
async def chat_with_assistant(req: ChatMessage):
    """
    Placeholder endpoint for the 'Analysis Assistant' chat interface.
    Currently returns a static response. In the future, this can be wired
    up to a LangChain agent with access to the specific thread's LangGraph state.
    """
    return {
        "reply": f"I am analyzing the data for pipeline run {req.thread_id}. "
                 "Currently, this chat is a placeholder. Soon I will be able to answer "
                 f"specific questions about: '{req.message}'"
    }
