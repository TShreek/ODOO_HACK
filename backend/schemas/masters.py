# Pydantic schemas for Master Data API
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr


# Base schemas for common fields
class TimestampMixin(BaseModel):
    """Mixin for created_at timestamp."""
    created_at: datetime


class TenantMixin(BaseModel):
    """Mixin for tenant_id field."""
    tenant_id: uuid.UUID


# Contact Schemas
class ContactBase(BaseModel):
    """Base schema for contact data."""
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    contact_type: str = "customer"  # customer, vendor, both
    is_active: bool = True


class ContactCreate(ContactBase):
    """Schema for creating a new contact."""
    pass


class ContactUpdate(BaseModel):
    """Schema for updating a contact. All fields optional."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    contact_type: Optional[str] = None
    is_active: Optional[bool] = None


class ContactRead(ContactBase, TenantMixin, TimestampMixin):
    """Schema for reading contact data."""
    id: uuid.UUID
    
    model_config = ConfigDict(from_attributes=True)


# Product Schemas
class ProductBase(BaseModel):
    """Base schema for product data."""
    name: str
    sku: Optional[str] = None
    description: Optional[str] = None
    unit_price: Decimal
    hsn_code: Optional[str] = None
    unit_of_measurement: str = "pcs"
    is_active: bool = True


class ProductCreate(ProductBase):
    """Schema for creating a new product."""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating a product. All fields optional."""
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    unit_price: Optional[Decimal] = None
    hsn_code: Optional[str] = None
    unit_of_measurement: Optional[str] = None
    is_active: Optional[bool] = None


class ProductRead(ProductBase, TenantMixin, TimestampMixin):
    """Schema for reading product data."""
    id: uuid.UUID
    
    model_config = ConfigDict(from_attributes=True)


# Tax Schemas
class TaxBase(BaseModel):
    """Base schema for tax data."""
    name: str
    tax_type: str
    rate: Decimal
    description: Optional[str] = None
    is_active: bool = True


class TaxCreate(TaxBase):
    """Schema for creating a new tax."""
    pass


class TaxUpdate(BaseModel):
    """Schema for updating a tax. All fields optional."""
    name: Optional[str] = None
    tax_type: Optional[str] = None
    rate: Optional[Decimal] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TaxRead(TaxBase, TenantMixin, TimestampMixin):
    """Schema for reading tax data."""
    id: uuid.UUID
    
    model_config = ConfigDict(from_attributes=True)


# Chart of Accounts Schemas
class ChartOfAccountsBase(BaseModel):
    """Base schema for chart of accounts data."""
    account_code: str
    account_name: str
    account_type: str
    parent_account_id: Optional[uuid.UUID] = None
    is_active: bool = True


class ChartOfAccountsCreate(ChartOfAccountsBase):
    """Schema for creating a new account."""
    pass


class ChartOfAccountsUpdate(BaseModel):
    """Schema for updating an account. All fields optional."""
    account_code: Optional[str] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    parent_account_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class ChartOfAccountsRead(ChartOfAccountsBase, TenantMixin, TimestampMixin):
    """Schema for reading chart of accounts data."""
    id: uuid.UUID
    
    model_config = ConfigDict(from_attributes=True)


# HSN API Schemas
class HSNItem(BaseModel):
    """Schema for HSN code item from external API or fallback."""
    hsn_code: str
    description: str
    gst_rate: Optional[Decimal] = None


class HSNSearchResult(BaseModel):
    """Schema for HSN search response."""
    query: str
    items: List[HSNItem]
    source: str  # "external_api" or "fallback"


# Pagination and List Response Schemas
class PaginationParams(BaseModel):
    """Schema for pagination parameters."""
    page: int = 1
    per_page: int = 50

    @property
    def offset(self) -> int:
        """Calculate offset from page and per_page."""
        return (self.page - 1) * self.per_page

    @property
    def limit(self) -> int:
        """Return limit (same as per_page)."""
        return self.per_page


class PaginatedResponse(BaseModel):
    """Generic paginated response schema."""
    items: List[BaseModel]
    total: int
    page: int
    per_page: int
    total_pages: int

    @classmethod
    def create(cls, items: List[BaseModel], total: int, page: int, per_page: int):
        """Create paginated response with calculated total_pages."""
        total_pages = (total + per_page - 1) // per_page
        return cls(
            items=items,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )


# Specific paginated responses
class PaginatedContactsResponse(PaginatedResponse):
    """Paginated response for contacts."""
    items: List[ContactRead]


class PaginatedProductsResponse(PaginatedResponse):
    """Paginated response for products."""
    items: List[ProductRead]


class PaginatedTaxesResponse(PaginatedResponse):
    """Paginated response for taxes."""
    items: List[TaxRead]


class PaginatedAccountsResponse(PaginatedResponse):
    """Paginated response for chart of accounts."""
    items: List[ChartOfAccountsRead]