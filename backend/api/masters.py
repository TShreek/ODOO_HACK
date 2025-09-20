# Master Data API Router
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db_session
from schemas.masters import (
    # Contact schemas
    ContactCreate, ContactUpdate, ContactRead,
    # Product schemas  
    ProductCreate, ProductUpdate, ProductRead,
    # Tax schemas
    TaxCreate, TaxUpdate, TaxRead,
    # Chart of Accounts schemas
    ChartOfAccountsCreate, ChartOfAccountsUpdate, ChartOfAccountsRead,
    # HSN schemas
    HSNSearchResult,
    # Pagination schemas
    PaginatedContactsResponse, PaginatedProductsResponse, 
    PaginatedTaxesResponse, PaginatedAccountsResponse
)
from crud.masters import (
    # Contact CRUD
    create_contact, get_contact, list_contacts, update_contact,
    # Product CRUD
    create_product, get_product, list_products, update_product,
    # Tax CRUD
    create_tax, get_tax, list_taxes, update_tax,
    # Chart of Accounts CRUD
    create_chart_of_accounts, get_chart_of_accounts, 
    list_chart_of_accounts, update_chart_of_accounts
)
from services.hsn_api_proxy import search_hsn


# Create router with prefix
router = APIRouter(prefix="/masters", tags=["Master Data"])


# Import the real authentication dependency
from dependencies import get_current_user, CurrentUser


# Contact Endpoints
@router.post("/contacts", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
async def create_contact_endpoint(
    contact_data: ContactCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Create a new contact for the authenticated user's tenant.
    """
    return await create_contact(db, contact_data, current_user.tenant_id)


@router.get("/contacts", response_model=PaginatedContactsResponse)
async def list_contacts_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    List contacts for the authenticated user's tenant with pagination.
    """
    offset = (page - 1) * per_page
    contacts, total_count = await list_contacts(
        db, current_user.tenant_id, limit=per_page, offset=offset
    )
    
    return PaginatedContactsResponse.create(
        items=contacts, total=total_count, page=page, per_page=per_page
    )


@router.get("/contacts/{contact_id}", response_model=ContactRead)
async def get_contact_endpoint(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get a specific contact by ID.
    """
    contact = await get_contact(db, contact_id, current_user.tenant_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    return contact


@router.put("/contacts/{contact_id}", response_model=ContactRead)
async def update_contact_endpoint(
    contact_id: uuid.UUID,
    contact_update: ContactUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Update a contact by ID.
    """
    contact = await update_contact(db, contact_id, current_user.tenant_id, contact_update)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    return contact


# Product Endpoints
@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product_endpoint(
    product_data: ProductCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Create a new product for the authenticated user's tenant.
    """
    return await create_product(db, product_data, current_user.tenant_id)


@router.get("/products", response_model=PaginatedProductsResponse)
async def list_products_endpoint(
    search: Optional[str] = Query(None, description="Search products by name, SKU, or HSN code"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    List products for the authenticated user's tenant with optional search and pagination.
    """
    offset = (page - 1) * per_page
    products, total_count = await list_products(
        db, current_user.tenant_id, search=search, limit=per_page, offset=offset
    )
    
    return PaginatedProductsResponse.create(
        items=products, total=total_count, page=page, per_page=per_page
    )


@router.get("/products/{product_id}", response_model=ProductRead)
async def get_product_endpoint(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get a specific product by ID.
    """
    product = await get_product(db, product_id, current_user.tenant_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product


@router.put("/products/{product_id}", response_model=ProductRead)
async def update_product_endpoint(
    product_id: uuid.UUID,
    product_update: ProductUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Update a product by ID.
    """
    product = await update_product(db, product_id, current_user.tenant_id, product_update)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product


# Tax Endpoints
@router.post("/taxes", response_model=TaxRead, status_code=status.HTTP_201_CREATED)
async def create_tax_endpoint(
    tax_data: TaxCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Create a new tax for the authenticated user's tenant.
    """
    return await create_tax(db, tax_data, current_user.tenant_id)


@router.get("/taxes", response_model=PaginatedTaxesResponse)
async def list_taxes_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    List taxes for the authenticated user's tenant with pagination.
    """
    offset = (page - 1) * per_page
    taxes, total_count = await list_taxes(
        db, current_user.tenant_id, limit=per_page, offset=offset
    )
    
    return PaginatedTaxesResponse.create(
        items=taxes, total=total_count, page=page, per_page=per_page
    )


@router.get("/taxes/{tax_id}", response_model=TaxRead)
async def get_tax_endpoint(
    tax_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get a specific tax by ID.
    """
    tax = await get_tax(db, tax_id, current_user.tenant_id)
    if not tax:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax not found"
        )
    return tax


@router.put("/taxes/{tax_id}", response_model=TaxRead)
async def update_tax_endpoint(
    tax_id: uuid.UUID,
    tax_update: TaxUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Update a tax by ID.
    """
    tax = await update_tax(db, tax_id, current_user.tenant_id, tax_update)
    if not tax:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax not found"
        )
    return tax


# Chart of Accounts Endpoints
@router.post("/accounts", response_model=ChartOfAccountsRead, status_code=status.HTTP_201_CREATED)
async def create_account_endpoint(
    account_data: ChartOfAccountsCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Create a new chart of accounts entry for the authenticated user's tenant.
    """
    return await create_chart_of_accounts(db, account_data, current_user.tenant_id)


@router.get("/accounts", response_model=PaginatedAccountsResponse)
async def list_accounts_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    List chart of accounts entries for the authenticated user's tenant with pagination.
    """
    offset = (page - 1) * per_page
    accounts, total_count = await list_chart_of_accounts(
        db, current_user.tenant_id, limit=per_page, offset=offset
    )
    
    return PaginatedAccountsResponse.create(
        items=accounts, total=total_count, page=page, per_page=per_page
    )


@router.get("/accounts/{account_id}", response_model=ChartOfAccountsRead)
async def get_account_endpoint(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get a specific chart of accounts entry by ID.
    """
    account = await get_chart_of_accounts(db, account_id, current_user.tenant_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    return account


@router.put("/accounts/{account_id}", response_model=ChartOfAccountsRead)
async def update_account_endpoint(
    account_id: uuid.UUID,
    account_update: ChartOfAccountsUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Update a chart of accounts entry by ID.
    """
    account = await update_chart_of_accounts(
        db, account_id, current_user.tenant_id, account_update
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    return account


# HSN Search Endpoint
@router.get("/hsn", response_model=HSNSearchResult)
async def search_hsn_endpoint(
    q: str = Query(..., min_length=1, description="Search query for HSN codes or descriptions"),
    selectedType: Optional[str] = Query(None, pattern="^(byCode|byDesc)$", description="Search mode: byCode or byDesc"),
    category: Optional[str] = Query(None, pattern="^(P|S)$", description="Product (P) or Service (S) category filter"),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Search HSN codes/descriptions.

    Parameters:
      q: user input (code fragment or description text)
      selectedType: byCode | byDesc (optional). If omitted we infer: all digits -> byCode else byDesc.
      category: P | S optional. If omitted we leave None (external API may broaden search).

    Backwards compatibility: Existing callers only providing q still work; heuristics supply selectedType.
    """
    inferred_type = selectedType
    if inferred_type is None:
        if q.isdigit():
            inferred_type = "byCode"
        else:
            inferred_type = "byDesc"

    # Pass through; category may remain None
    return await search_hsn(q, selected_type=inferred_type, category=category)