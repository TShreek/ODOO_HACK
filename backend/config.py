# configuration settings
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List, Union
from pydantic import Field

class Settings(BaseSettings):
    # Core
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/odoo_hack"
    SECRET_KEY: str = "ODOO_IS_AWESOME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str  # plain "host:port"
    KAFKA_FINANCIAL_TRANSACTIONS_TOPIC: str = "financial_transactions"
    KAFKA_CONSUMER_GROUP_ID: str = "accounting_consumer_group"

    # System / Tenant
    SYSTEM_USER_ID: str
    TEST_TENANT_ID: str
    DEV_CONTACT_ID: str

    # CoA (sales side)
    AR_ACCOUNT_ID: str
    REVENUE_ACCOUNT_ID: str
    TAX_ACCOUNT_ID: str

    # Payments
    CASH_ACCOUNT_ID: str
    BANK_ACCOUNT_ID: str

    # Purchase/AP
    AP_ACCOUNT_ID: str
    EXPENSE_ACCOUNT_ID: str
    INPUT_TAX_ACCOUNT_ID: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,   # <— IMPORTANT: only exact UPPERCASE names are accepted
        extra="forbid"         # <— reject any unknown/lowercase keys
    )

settings = Settings()