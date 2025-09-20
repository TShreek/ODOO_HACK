# configuration settings
from pydantic_settings import BaseSettings
from typing import Optional, List, Union

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/odoo_hack"
    
    # Authentication
    SECRET_KEY: str = "ODOO_IS_AWESOME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # HSN API Configuration
    HSN_API_URL: Optional[str] = None
    HSN_API_KEY: Optional[str] = None
    
    # Kafka Configuration
    KAFKA_BOOTSTRAP_SERVERS: Union[str, List[str]] = "localhost:9092"
    KAFKA_FINANCIAL_TRANSACTIONS_TOPIC: str = "financial_transactions"
    KAFKA_CONSUMER_GROUP_ID: str = "accounting_consumer_group"
    KAFKA_AUTO_OFFSET_RESET: str = "earliest"
    KAFKA_ENABLE_AUTO_COMMIT: bool = True
    KAFKA_AUTO_COMMIT_INTERVAL_MS: int = 1000
    KAFKA_SESSION_TIMEOUT_MS: int = 30000
    KAFKA_MAX_POLL_RECORDS: int = 500
    
    # System Configuration
    SYSTEM_USER_ID: str = "00000000-0000-0000-0000-000000000001"
    TEST_TENANT_ID: str = "11111111-1111-1111-1111-111111111111"
    AR_ACCOUNT_ID: str
    REVENUE_ACCOUNT_ID: str
    TAX_ACCOUNT_ID: str
    DEV_CONTACT_ID: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()