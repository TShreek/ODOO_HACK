"""add transactions table

Revision ID: 0004_add_transactions_table
Revises: 0003_add_txn_id_to_journal_entries
Create Date: 2025-09-20
"""
from alembic import op
import sqlalchemy as sa
import uuid

# revision identifiers, used by Alembic.
revision = '0004_add_transactions_table'
down_revision = '0003_add_txn_id_to_journal_entries'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'transactions',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('txn_id', sa.String(length=100), nullable=False, unique=True),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('ref_id', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('total_amount', sa.Numeric(14, 2), nullable=False, server_default='0'),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='INR'),
        sa.Column('meta', sa.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_transactions_type_status', 'transactions', ['type', 'status'])


def downgrade() -> None:
    op.drop_index('ix_transactions_type_status', table_name='transactions')
    op.drop_table('transactions')
