# services/llm/tools_sql.py
from pydantic import BaseModel, Field
from langchain_core.tools import tool
from services.llm.sql_agent import run_nl_query, run_sql_raw, describe_schema

class NLQueryInput(BaseModel):
    """Ask a question in natural language about the accounting database."""
    question: str = Field(..., example="Show total revenue for Sept 2025 for tenant X")

@tool(args_schema=NLQueryInput)
def sql_ask(question: str) -> str:
    """Use when the user asks about data and doesn't provide raw SQL."""
    return run_nl_query(question)

class RawSQLInput(BaseModel):
    """Run a raw SQL query. Return rows/columns. Use only if user explicitly gives SQL."""
    sql: str = Field(..., example="SELECT * FROM chart_of_accounts LIMIT 5")

@tool(args_schema=RawSQLInput)
def sql_run(sql: str) -> dict:
    """Execute raw SQL and return results."""
    return run_sql_raw(sql)

@tool
def sql_describe() -> str:
    """Return a concise schema of the allowed tables and columns."""
    return describe_schema()
