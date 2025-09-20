import pytest
from decimal import Decimal
from services import accounting_engine as ae


def test_purchase_entries_balanced():
    po = {
        "items": [
            {"product_id": "p1", "qty": 2, "unit_price": "100.00", "tax_percent": "5"},
            {"product_id": "p2", "qty": 1, "unit_price": "50.00", "tax_percent": "5"},
        ]
    }
    entries = ae.generate_purchase_entries(po)
    summary = ae.summarize_entries(entries)
    assert summary["balanced"]
    assert summary["total_debit"] == summary["total_credit"]


def test_sales_entries_discount_rounding():
    so = {
        "items": [
            {"product_id": "p1", "qty": 3, "unit_price": "19.99", "tax_percent": "10", "discount": "1.00"},
        ]
    }
    entries = ae.generate_sales_entries(so)
    summary = ae.summarize_entries(entries)
    assert summary["balanced"]


def test_payment_in():
    data = {"amount": "250.00", "direction": "in"}
    entries = ae.generate_payment_entries(data)
    summary = ae.summarize_entries(entries)
    assert summary["balanced"]


def test_payment_out():
    data = {"amount": "125.55", "direction": "out"}
    entries = ae.generate_payment_entries(data)
    summary = ae.summarize_entries(entries)
    assert summary["balanced"]


def test_unbalanced_error():
    # Force error by tampering with summarize wrapper (simulate) - easier: directly call private if exposed
    with pytest.raises(ae.AccountingError):
        ae._ensure_balanced([
            {"account_code": "1000", "debit": Decimal("10.00"), "credit": Decimal("0.00")},
            {"account_code": "2000", "debit": Decimal("0.00"), "credit": Decimal("9.00")},
        ])
