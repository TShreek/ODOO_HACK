# services/accounting_engine.py
from datetime import datetime
from decimal import Decimal
from typing import Dict, List
from config import settings  # <-- add this

def generate_entries(event: Dict) -> List[Dict]:
    # pull fields
    tenant_id = event["tenant_id"]
    tx_id = event["transaction_id"]
    payload = event["payload"]
    entry_date = datetime.fromisoformat(event["occurred_at"].replace("Z",""))

    # compute totals
    net = Decimal("0")
    tax = Decimal("0")
    for ln in payload["lines"]:
        line_net = Decimal(str(ln["unit_price"])) * Decimal(str(ln.get("qty", 1)))
        line_tax = line_net * Decimal(str(ln.get("tax_rate", 0)))
        net += line_net
        tax += line_tax
    gross = net + tax

    # use env-configured accounts (seeded for TEST_TENANT_ID)
    AR  = payload.get("ar_account_id")        or settings.AR_ACCOUNT_ID
    REV = payload.get("revenue_account_id")   or settings.REVENUE_ACCOUNT_ID
    TAX = payload.get("tax_payable_account_id") or settings.TAX_ACCOUNT_ID

    desc = f"Invoice {payload.get('invoice_number','')}"
    creator = settings.SYSTEM_USER_ID  # NOT NULL fix

    rows: List[Dict] = [
        # DR Accounts Receivable (gross)
        dict(tenant_id=tenant_id, transaction_id=tx_id, account_id=AR,
             entry_number="auto", entry_date=entry_date, description=desc,
             debit_amount=gross, credit_amount=Decimal("0.00"),
             created_by=creator),
        # CR Revenue (net)
        dict(tenant_id=tenant_id, transaction_id=tx_id, account_id=REV,
             entry_number="auto", entry_date=entry_date, description=desc,
             debit_amount=Decimal("0.00"), credit_amount=net,
             created_by=creator),
    ]
    if tax != 0:
        rows.append(
            dict(tenant_id=tenant_id, transaction_id=tx_id, account_id=TAX,
                 entry_number="auto", entry_date=entry_date, description=desc,
                 debit_amount=Decimal("0.00"), credit_amount=tax,
                 created_by=creator)
        )
    return rows
