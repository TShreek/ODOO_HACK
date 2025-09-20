# CRUD operations for Master Data
import uuid
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.exc import NoResultFound

from models.masters import Contact, Product, Tax, ChartOfAccounts
from schemas.masters import (
    ContactCreate, ContactUpdate,
    ProductCreate, ProductUpdate,
    TaxCreate, TaxUpdate,
    ChartOfAccountsCreate, ChartOfAccountsUpdate
)


# Contact CRUD Operations
async def create_contact(
    db: AsyncSession, 
    contact_data: ContactCreate, 
    tenant_id: uuid.UUID
) -> Contact:
    """
    Create a new contact for the specified tenant.
    """
    db_contact = Contact(
        tenant_id=tenant_id,
        **contact_data.model_dump()
    )
    db.add(db_contact)
    await db.commit()
    await db.refresh(db_contact)
    return db_contact


async def get_contact(
    db: AsyncSession, 
    contact_id: uuid.UUID, 
    tenant_id: uuid.UUID
) -> Optional[Contact]:
    """
    Get a specific contact by ID, scoped to tenant.
    """
    result = await db.execute(
        select(Contact).where(
            Contact.id == contact_id,
            Contact.tenant_id == tenant_id
        )
    )
    return result.scalar_one_or_none()


async def list_contacts(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0
) -> Tuple[List[Contact], int]:
    """
    List contacts for a tenant with pagination.
    Returns tuple of (contacts, total_count).
    """
    # Get contacts with pagination
    result = await db.execute(
        select(Contact)
        .where(Contact.tenant_id == tenant_id)
        .order_by(Contact.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    contacts = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(
        select(func.count(Contact.id))
        .where(Contact.tenant_id == tenant_id)
    )
    total_count = count_result.scalar()
    
    return list(contacts), total_count


async def update_contact(
    db: AsyncSession,
    contact_id: uuid.UUID,
    tenant_id: uuid.UUID,
    contact_update: ContactUpdate
) -> Optional[Contact]:
    """
    Update a contact by ID, scoped to tenant.
    """
    # Get existing contact
    result = await db.execute(
        select(Contact).where(
            Contact.id == contact_id,
            Contact.tenant_id == tenant_id
        )
    )
    db_contact = result.scalar_one_or_none()
    
    if not db_contact:
        return None
    
    # Update fields that are provided
    update_data = contact_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_contact, field, value)
    
    await db.commit()
    await db.refresh(db_contact)
    return db_contact


# Product CRUD Operations
async def create_product(
    db: AsyncSession, 
    product_data: ProductCreate, 
    tenant_id: uuid.UUID
) -> Product:
    """
    Create a new product for the specified tenant.
    """
    db_product = Product(
        tenant_id=tenant_id,
        **product_data.model_dump()
    )
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product


async def get_product(
    db: AsyncSession, 
    product_id: uuid.UUID, 
    tenant_id: uuid.UUID
) -> Optional[Product]:
    """
    Get a specific product by ID, scoped to tenant.
    """
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.tenant_id == tenant_id
        )
    )
    return result.scalar_one_or_none()


async def list_products(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> Tuple[List[Product], int]:
    """
    List products for a tenant with optional search and pagination.
    Search looks for matches in name, sku, or hsn_code using ilike.
    Returns tuple of (products, total_count).
    """
    # Base query
    query = select(Product).where(Product.tenant_id == tenant_id)
    count_query = select(func.count(Product.id)).where(Product.tenant_id == tenant_id)
    
    # Add search filter if provided
    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.sku.ilike(f"%{search}%"),
            Product.hsn_code.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Get products with pagination
    result = await db.execute(
        query.order_by(Product.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    products = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(count_query)
    total_count = count_result.scalar()
    
    return list(products), total_count


async def update_product(
    db: AsyncSession,
    product_id: uuid.UUID,
    tenant_id: uuid.UUID,
    product_update: ProductUpdate
) -> Optional[Product]:
    """
    Update a product by ID, scoped to tenant.
    """
    # Get existing product
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.tenant_id == tenant_id
        )
    )
    db_product = result.scalar_one_or_none()
    
    if not db_product:
        return None
    
    # Update fields that are provided
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    await db.commit()
    await db.refresh(db_product)
    return db_product


# Tax CRUD Operations
async def create_tax(
    db: AsyncSession, 
    tax_data: TaxCreate, 
    tenant_id: uuid.UUID
) -> Tax:
    """
    Create a new tax for the specified tenant.
    """
    db_tax = Tax(
        tenant_id=tenant_id,
        **tax_data.model_dump()
    )
    db.add(db_tax)
    await db.commit()
    await db.refresh(db_tax)
    return db_tax


async def get_tax(
    db: AsyncSession, 
    tax_id: uuid.UUID, 
    tenant_id: uuid.UUID
) -> Optional[Tax]:
    """
    Get a specific tax by ID, scoped to tenant.
    """
    result = await db.execute(
        select(Tax).where(
            Tax.id == tax_id,
            Tax.tenant_id == tenant_id
        )
    )
    return result.scalar_one_or_none()


async def list_taxes(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0
) -> Tuple[List[Tax], int]:
    """
    List taxes for a tenant with pagination.
    Returns tuple of (taxes, total_count).
    """
    # Get taxes with pagination
    result = await db.execute(
        select(Tax)
        .where(Tax.tenant_id == tenant_id)
        .order_by(Tax.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    taxes = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(
        select(func.count(Tax.id))
        .where(Tax.tenant_id == tenant_id)
    )
    total_count = count_result.scalar()
    
    return list(taxes), total_count


async def update_tax(
    db: AsyncSession,
    tax_id: uuid.UUID,
    tenant_id: uuid.UUID,
    tax_update: TaxUpdate
) -> Optional[Tax]:
    """
    Update a tax by ID, scoped to tenant.
    """
    # Get existing tax
    result = await db.execute(
        select(Tax).where(
            Tax.id == tax_id,
            Tax.tenant_id == tenant_id
        )
    )
    db_tax = result.scalar_one_or_none()
    
    if not db_tax:
        return None
    
    # Update fields that are provided
    update_data = tax_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tax, field, value)
    
    await db.commit()
    await db.refresh(db_tax)
    return db_tax


# Chart of Accounts CRUD Operations
async def create_chart_of_accounts(
    db: AsyncSession, 
    coa_data: ChartOfAccountsCreate, 
    tenant_id: uuid.UUID
) -> ChartOfAccounts:
    """
    Create a new chart of accounts entry for the specified tenant.
    """
    db_coa = ChartOfAccounts(
        tenant_id=tenant_id,
        **coa_data.model_dump()
    )
    db.add(db_coa)
    await db.commit()
    await db.refresh(db_coa)
    return db_coa


async def get_chart_of_accounts(
    db: AsyncSession, 
    coa_id: uuid.UUID, 
    tenant_id: uuid.UUID
) -> Optional[ChartOfAccounts]:
    """
    Get a specific chart of accounts entry by ID, scoped to tenant.
    """
    result = await db.execute(
        select(ChartOfAccounts).where(
            ChartOfAccounts.id == coa_id,
            ChartOfAccounts.tenant_id == tenant_id
        )
    )
    return result.scalar_one_or_none()


async def list_chart_of_accounts(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0
) -> Tuple[List[ChartOfAccounts], int]:
    """
    List chart of accounts entries for a tenant with pagination.
    Returns tuple of (accounts, total_count).
    """
    # Get accounts with pagination
    result = await db.execute(
        select(ChartOfAccounts)
        .where(ChartOfAccounts.tenant_id == tenant_id)
        .order_by(ChartOfAccounts.account_code)
        .offset(offset)
        .limit(limit)
    )
    accounts = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(
        select(func.count(ChartOfAccounts.id))
        .where(ChartOfAccounts.tenant_id == tenant_id)
    )
    total_count = count_result.scalar()
    
    return list(accounts), total_count


async def update_chart_of_accounts(
    db: AsyncSession,
    coa_id: uuid.UUID,
    tenant_id: uuid.UUID,
    coa_update: ChartOfAccountsUpdate
) -> Optional[ChartOfAccounts]:
    """
    Update a chart of accounts entry by ID, scoped to tenant.
    """
    # Get existing account
    result = await db.execute(
        select(ChartOfAccounts).where(
            ChartOfAccounts.id == coa_id,
            ChartOfAccounts.tenant_id == tenant_id
        )
    )
    db_coa = result.scalar_one_or_none()
    
    if not db_coa:
        return None
    
    # Update fields that are provided
    update_data = coa_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_coa, field, value)
    
    await db.commit()
    await db.refresh(db_coa)
    return db_coa