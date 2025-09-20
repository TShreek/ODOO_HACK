from __future__ import annotations
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any
import json, os

class AccountingError(Exception):
    pass

Entry = Dict[str, Any]

DEFAULT_ACCOUNT_MAPPINGS = {
    "inventory_account": "1200",
    "ap_account": "2000",  # Payables
    "ar_account": "1100",  # Receivables
    "sales_account": "4000",
    "purchases_account": "5000",
    "cogs_account": "5100",
    "cash_account": "1000",
    "input_gst_account": "2100",
    "output_gst_account": "4100",
}

_account_cache: Dict[str, str] | None = None

def load_account_mappings() -> Dict[str, str]:
    global _account_cache
    if _account_cache is not None:
        return _account_cache
    # Look for config/account_mappings.json relative to backend root
    root = os.path.dirname(os.path.abspath(__file__))
    root = os.path.dirname(root)  # up to services parent
    config_path = os.path.join(root, "config", "account_mappings.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    _account_cache = {**DEFAULT_ACCOUNT_MAPPINGS, **data}
                    return _account_cache
        except Exception:
            pass
    _account_cache = DEFAULT_ACCOUNT_MAPPINGS
    return _account_cache


def _money(val) -> Decimal:
    if not isinstance(val, Decimal):
        val = Decimal(str(val))
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def summarize_entries(entries: List[Entry]) -> Dict[str, Decimal]:
    total_debit = sum(_money(e.get("debit", 0)) for e in entries)
    total_credit = sum(_money(e.get("credit", 0)) for e in entries)
    return {"total_debit": total_debit, "total_credit": total_credit, "balanced": total_debit == total_credit}


def _ensure_balanced(entries: List[Entry]):
    summary = summarize_entries(entries)
    if not summary["balanced"]:
        raise AccountingError(f"Entries not balanced {summary['total_debit']} != {summary['total_credit']}")


def generate_purchase_entries(purchase_order: Dict[str, Any]) -> List[Entry]:
    accounts = load_account_mappings()
    items = purchase_order["items"]
    subtotal = Decimal("0")
    tax_total = Decimal("0")

    for it in items:
        qty = _money(it["qty"])  # simplified
        unit_price = _money(it["unit_price"])
        discount = _money(it.get("discount", 0))
        line_base = qty * unit_price - discount
        subtotal += line_base
        tax_percent = _money(it.get("tax_percent", 0))
        tax_total += (line_base * tax_percent / Decimal("100")).quantize(Decimal("0.01"))

    entries: List[Entry] = []
    # Inventory or expense
    entries.append({"account_code": accounts["inventory_account"], "debit": subtotal, "credit": Decimal("0.00"), "description": "Inventory acquisition"})
    if tax_total > 0:
        entries.append({"account_code": accounts["input_gst_account"], "debit": tax_total, "credit": Decimal("0.00"), "description": "Input GST"})
    total = subtotal + tax_total
    entries.append({"account_code": accounts["ap_account"], "debit": Decimal("0.00"), "credit": total, "description": "Accounts Payable"})

    _ensure_balanced(entries)
    return entries


def generate_sales_entries(sales_order: Dict[str, Any]) -> List[Entry]:
    accounts = load_account_mappings()
    items = sales_order["items"]
    subtotal = Decimal("0")
    tax_total = Decimal("0")

    for it in items:
        qty = _money(it["qty"])  # simplified
        unit_price = _money(it["unit_price"])
        discount = _money(it.get("discount", 0))
        line_base = qty * unit_price - discount
        subtotal += line_base
        tax_percent = _money(it.get("tax_percent", 0))
        tax_total += (line_base * tax_percent / Decimal("100")).quantize(Decimal("0.01"))

    total = subtotal + tax_total
    entries: List[Entry] = []
    entries.append({"account_code": accounts["ar_account"], "debit": total, "credit": Decimal("0.00"), "description": "Accounts Receivable"})
    entries.append({"account_code": accounts["sales_account"], "debit": Decimal("0.00"), "credit": subtotal, "description": "Sales Revenue"})
    if tax_total > 0:
        entries.append({"account_code": accounts["output_gst_account"], "debit": Decimal("0.00"), "credit": tax_total, "description": "Output GST"})

    _ensure_balanced(entries)
    return entries


def generate_payment_entries(payment_data: Dict[str, Any]) -> List[Entry]:
    accounts = load_account_mappings()
    amount = _money(payment_data["amount"])
    direction = payment_data.get("direction", "in")
    entries: List[Entry] = []

    if direction == "in":
        entries.append({"account_code": accounts["cash_account"], "debit": amount, "credit": Decimal("0.00"), "description": "Cash Receipt"})
        entries.append({"account_code": accounts["ar_account"], "debit": Decimal("0.00"), "credit": amount, "description": "Settle AR"})
    else:
        entries.append({"account_code": accounts["ap_account"], "debit": amount, "credit": Decimal("0.00"), "description": "Settle AP"})
        entries.append({"account_code": accounts["cash_account"], "debit": Decimal("0.00"), "credit": amount, "description": "Cash Payment"})

    _ensure_balanced(entries)
    return entries
