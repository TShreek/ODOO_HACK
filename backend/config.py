# configuration settings
from pydantic_settings import BaseSettings
from typing import Optional, List

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
    KAFKA_BOOTSTRAP_SERVERS: List[str] = ["localhost:9092"]
    KAFKA_FINANCIAL_TRANSACTIONS_TOPIC: str = "financial_transactions"
    KAFKA_CONSUMER_GROUP_ID: str = "accounting_consumer_group"
    KAFKA_AUTO_OFFSET_RESET: str = "earliest"
    KAFKA_ENABLE_AUTO_COMMIT: bool = True
    KAFKA_AUTO_COMMIT_INTERVAL_MS: int = 1000
    KAFKA_SESSION_TIMEOUT_MS: int = 30000
    KAFKA_MAX_POLL_RECORDS: int = 500
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()