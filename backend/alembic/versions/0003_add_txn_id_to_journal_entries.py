"""add txn_id to journal_entries

Revision ID: 0003_add_txn_id
Revises: 0002_add_refresh_tokens
Create Date: 2025-09-20
"""
from alembic import op
import sqlalchemy as sa

revision = '0003_add_txn_id'
down_revision = '0002_add_refresh_tokens'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('journal_entries', sa.Column('txn_id', sa.String(length=100), nullable=True))
    op.create_index('ix_journal_entries_txn_id', 'journal_entries', ['txn_id'])
    op.create_unique_constraint('uq_journal_entries_txn_id', 'journal_entries', ['txn_id'])


def downgrade() -> None:
    op.drop_constraint('uq_journal_entries_txn_id', 'journal_entries', type_='unique')
    op.drop_index('ix_journal_entries_txn_id', table_name='journal_entries')
    op.drop_column('journal_entries', 'txn_id')
