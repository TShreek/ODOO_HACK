"""baseline schema

Revision ID: 0001_baseline
Revises: 
Create Date: 2025-09-20
"""
from alembic import op
import sqlalchemy as sa
import uuid

# revision identifiers, used by Alembic.
revision = '0001_baseline'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Example tables subset; full metadata would be reflected if autogenerate used.
    # Contacts
    op.create_table(
        'contacts',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255)),
        sa.Column('phone', sa.String(50)),
        sa.Column('address', sa.Text()),
        sa.Column('gstin', sa.String(15)),
        sa.Column('contact_type', sa.String(20), nullable=False, server_default='customer'),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )
    # Products
    op.create_table(
        'products',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('sku', sa.String(100)),
        sa.Column('description', sa.Text()),
        sa.Column('unit_price', sa.Numeric(14,2), nullable=False, server_default='0.00'),
        sa.Column('hsn_code', sa.String(20)),
        sa.Column('unit_of_measurement', sa.String(20), nullable=False, server_default='pcs'),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )
    # Taxes
    op.create_table(
        'taxes',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('tax_type', sa.String(20), nullable=False),
        sa.Column('rate', sa.Numeric(10,4), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )
    # Chart of Accounts
    op.create_table(
        'chart_of_accounts',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('account_code', sa.String(20), nullable=False),
        sa.Column('account_name', sa.String(255), nullable=False),
        sa.Column('account_type', sa.String(50), nullable=False),
        sa.Column('parent_account_id', sa.dialects.postgresql.UUID(as_uuid=True)),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )


def downgrade():
    op.drop_table('chart_of_accounts')
    op.drop_table('taxes')
    op.drop_table('products')
    op.drop_table('contacts')
