# services/accounting_engine.py
from datetime import datetime
from decimal import Decimal
from typing import Dict, List
from config import settings  # <-- important

def _totals_from_lines(lines):
    net = Decimal("0")
    tax = Decimal("0")
    for ln in lines:
        qty = Decimal(str(ln.get("qty", 1)))
        price = Decimal(str(ln["unit_price"]))
        rate = Decimal(str(ln.get("tax_rate", 0)))
        line_net = qty * price
        line_tax = line_net * rate
        net += line_net
        tax += line_tax
    return net, tax

def generate_entries(event: Dict) -> List[Dict]:
    t = event["type"]
    tenant_id = event["tenant_id"]
    tx_id = event.get("transaction_id")  # may be NULL in journals; FK is nullable
    payload = event["payload"]
    entry_date = datetime.fromisoformat(event["occurred_at"].replace("Z",""))

    entries: list[dict] = []

    if t == "invoice_created":
        net, tax = _totals_from_lines(payload["lines"])
        gross = net + tax
        AR = payload.get("ar_account_id") or "00000000-0000-0000-0000-000000000001"
        REV = payload.get("revenue_account_id") or "00000000-0000-0000-0000-000000000002"
        TAX = payload.get("tax_payable_account_id") or "00000000-0000-0000-0000-000000000003"
        desc = f"Invoice {payload.get('invoice_number','')}"
        entries += [
            dict(tenant_id=tenant_id, transaction_id=tx_id, account_id=AR,
                 entry_number="auto", entry_date=entry_date, description=desc,
                 debit_amount=gross, credit_amount=Decimal("0.00")),
            dict(tenant_id=tenant_id, transaction_id=tx_id, account_id=REV,
                 entry_number="auto", entry_date=entry_date, description=desc,
                 debit_amount=Decimal("0.00"), credit_amount=net),
        ]
        if tax != 0:
            entries.append(dict(
                tenant_id=tenant_id, transaction_id=tx_id, account_id=TAX,
                entry_number="auto", entry_date=entry_date, description=desc,
                debit_amount=Decimal("0.00"), credit_amount=tax
            ))
        return entries

    if t == "payment_recorded":
        amt = Decimal(str(payload["amount"]))
        method = payload.get("method", "bank")
        cash_id = payload.get("cash_account_id")
        bank_id = payload.get("bank_account_id")
        AR = payload["ar_account_id"]
        CR_ACC = bank_id if method == "bank" else cash_id
        desc = payload.get("note", "Customer payment")
        entries += [
            # DR Cash/Bank
            dict(tenant_id=tenant_id, transaction_id=tx_id, account_id=CR_ACC,
                 entry_number="auto", entry_date=entry_date, description=desc,
                 debit_amount=amt, credit_amount=Decimal("0.00")),
            # CR Accounts Receivable
            dict(tenant_id=tenant_id, transaction_id=tx_id, account_id=AR,
                 entry_number="auto", entry_date=entry_date, description=desc,
                 debit_amount=Decimal("0.00"), credit_amount=amt),
        ]
        return entries

    if t == "bill_created":
        net, tax = _totals_from_lines(payload["lines"])
        gross = net + tax
        EXP = payload["expense_account_id"]
        AP = payload["ap_account_id"]
        ITX = payload["input_tax_account_id"]
        desc = f"Bill {payload.get('bill_number','')}"
        entries += [
            # DR Expense
            dict(tenant_id=tenant_id, transaction_id=tx_id, account_id=EXP,
                 entry_number="auto", entry_date=entry_date, description=desc,
                 debit_amount=net, credit_amount=Decimal("0.00")),
        ]
        if tax != 0:
            entries.append(dict(
                tenant_id=tenant_id, transaction_id=tx_id, account_id=ITX,
                entry_number="auto", entry_date=entry_date, description=desc,
                debit_amount=tax, credit_amount=Decimal("0.00"),
            ))
        # CR AP
        entries.append(dict(
            tenant_id=tenant_id, transaction_id=tx_id, account_id=AP,
            entry_number="auto", entry_date=entry_date, description=desc,
            debit_amount=Decimal("0.00"), credit_amount=gross,
        ))
        return entries

    if t == "vendor_payment_recorded":
        amt = Decimal(str(payload["amount"]))
        method = payload.get("method", "bank")
        cash_id = payload.get("cash_account_id")
        bank_id = payload.get("bank_account_id")
        AP = payload["ap_account_id"]
        CR_ACC = bank_id if method == "bank" else cash_id
        desc = payload.get("note", "Vendor payment")
        entries += [
            # DR AP
            dict(tenant_id=tenant_id, transaction_id=tx_id, account_id=AP,
                 entry_number="auto", entry_date=entry_date, description=desc,
                 debit_amount=amt, credit_amount=Decimal("0.00")),
            # CR Cash/Bank
            dict(tenant_id=tenant_id, transaction_id=tx_id, account_id=CR_ACC,
                 entry_number="auto", entry_date=entry_date, description=desc,
                 debit_amount=Decimal("0.00"), credit_amount=amt),
        ]
        return entries

    # default: unknown type
    return []
