# backend/api/chat.py
from fastapi import APIRouter
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain.agents import create_tool_calling_agent, AgentExecutor
from services.llm.tools import create_customer_invoice  # Import your new tool
from config import settings

router = APIRouter()

# Pydantic model for the incoming chat request.
class ChatRequest(BaseModel):
    user_message: str

# Initialize the LLM with your Groq API key from your config.
# uv.lock and pyproject.toml should have `groq` listed as a dependency.
llm = ChatGroq(temperature=0, model="openai/gpt-oss-20b", groq_api_key=settings.GROQ_API_KEY)

# List of all available tools for the agent.
tools = [create_customer_invoice]

# Define the agent's instructions (system prompt).
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an AI assistant for Shiv Accounts Cloud. Your role is to help users by performing accounting tasks. You can call the provided tools to assist with tasks."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

# Create the agent and the executor that runs it.
agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

@router.post("/chat")
async def chat_with_agent(request: ChatRequest):
    response = agent_executor.invoke({"input": request.user_message})
    return {"response": response["output"]}