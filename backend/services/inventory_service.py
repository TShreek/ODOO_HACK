import uuid
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models.ledger import StockMove


async def record_purchase_receipt(
    session: AsyncSession,
    tenant_id: uuid.UUID,
    product_id: uuid.UUID,
    quantity: Decimal,
    total_cost: Decimal,
    ref_doc_type: str,
    ref_doc_id: uuid.UUID | None = None,
):
    if quantity <= 0:
        raise ValueError("Quantity must be positive for purchase receipt")
    unit_cost = (total_cost / quantity).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    move = StockMove(
        tenant_id=tenant_id,
        product_id=product_id,
        qty_in=quantity,
        qty_out=Decimal("0"),
        unit_cost=unit_cost,
        total_cost=total_cost,
        ref_doc_type=ref_doc_type,
        ref_doc_id=ref_doc_id,
    )
    session.add(move)
    await session.flush()
    return move


async def compute_moving_average_cost(session: AsyncSession, tenant_id: uuid.UUID, product_id: uuid.UUID) -> Decimal:
    q = select(func.sum(StockMove.qty_in * StockMove.unit_cost) - func.sum(StockMove.qty_out * StockMove.unit_cost)).where(StockMove.tenant_id == tenant_id, StockMove.product_id == product_id)
    # Simplified: if no moves return 0
    total_cost = await session.scalar(q) or Decimal("0")
    q_qty = select(func.sum(StockMove.qty_in - StockMove.qty_out)).where(StockMove.tenant_id == tenant_id, StockMove.product_id == product_id)
    qty_on_hand = await session.scalar(q_qty) or Decimal("0")
    if qty_on_hand <= 0:
        return Decimal("0")
    return (total_cost / qty_on_hand).quantize(Decimal("0.0001"))


async def record_sale_issue(
    session: AsyncSession,
    tenant_id: uuid.UUID,
    product_id: uuid.UUID,
    quantity: Decimal,
    ref_doc_type: str,
    ref_doc_id: uuid.UUID | None = None,
):
    if quantity <= 0:
        raise ValueError("Quantity must be positive for sale issue")
    avg_cost = await compute_moving_average_cost(session, tenant_id, product_id)
    move = StockMove(
        tenant_id=tenant_id,
        product_id=product_id,
        qty_in=Decimal("0"),
        qty_out=quantity,
        unit_cost=avg_cost,
        total_cost=(avg_cost * quantity).quantize(Decimal("0.0001")),
        ref_doc_type=ref_doc_type,
        ref_doc_id=ref_doc_id,
    )
    session.add(move)
    await session.flush()
    return move
