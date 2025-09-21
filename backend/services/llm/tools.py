# backend/services/llm/tools.py
from services.kafka_producer import publish_financial_event
import requests
from pydantic import BaseModel, Field
from langchain_core.tools import tool
import uuid

# Define the schema for the invoice tool's input.
# The docstring is critical as it guides the LLM on how to use the tool.
class CreateInvoiceInput(BaseModel):
    """Input schema for creating a new customer invoice."""
    customer_id: str = Field(..., description="The unique identifier for the customer.")
    amount: float = Field(..., description="The total amount of the invoice, e.g., 500.50.")
    # Add other fields as needed, matching your existing event payload
    
@tool(args_schema=CreateInvoiceInput)
def create_customer_invoice(customer_id: str, amount: float) -> dict:
    """
    Creates and publishes a new invoice for a customer.
    The invoice will be processed in the accounting system via a Kafka event.
    """
    payload = {
        "event_id": str(uuid.uuid4()),
        "schema_version": 1,
        "tenant_id": "your-default-tenant-id",  # Use your config variable
        "type": "invoice_created",
        "occurred_at": "2025-09-20T17:40:22Z",  # Use datetime.now()
        "payload": {
            "customer_id": customer_id,
            "amount": amount
        }
    }

    try:
        publish_financial_event(payload)
        return {"status": "success", "message": "Invoice published successfully!"}
    except Exception as e:
        return {"status": "failure", "message": f"Failed to publish invoice: {e}"}