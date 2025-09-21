# services/llm/sql_agent.py
import os
from typing import Dict, Any, List
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.utilities import SQLDatabase
from langchain.agents.agent_toolkits import create_sql_agent
from langchain.agents import AgentType

load_dotenv()

PG_SYNC_URL = os.getenv("PG_SYNC_URL")  # psycopg2 DSN
if not PG_SYNC_URL:
    raise RuntimeError("PG_SYNC_URL not set in .env")

# restrict what the model can see
INCLUDE_TABLES = [
    "journal_entries",
    "transactions",
    "transaction_lines",
    "chart_of_accounts",
    "contacts",
    "taxes",
    "processed_events",
]

db = SQLDatabase.from_uri(
    PG_SYNC_URL,
    include_tables=INCLUDE_TABLES,
    sample_rows_in_table_info=2,
)

llm = ChatGroq(
    groq_api_key=os.environ["GROQ_API_KEY"],
    model_name="mixtral-8x7b-32768",
    temperature=0.1,
)

# Agent that plans -> writes SQL -> executes -> returns result
_sql_agent = create_sql_agent(
    llm=llm,
    db=db,
    agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=False,
    top_k=5,
)

def run_nl_query(question: str) -> str:
    """Ask a natural-language question; returns a string answer (with rows if any)."""
    return _sql_agent.run(question)

def run_sql_raw(sql: str) -> Dict[str, Any]:
    """Run a raw SQL string and return columns + rows."""
    result = db.run(sql)
    # db.run returns a pretty string; if you prefer structured JSON, you can re-run via engine.
    return {"result": result}

def describe_schema() -> str:
    """Return a concise schema summary for included tables."""
    return db.get_table_info()
