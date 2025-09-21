# Shiv Accounts Cloud

A modern, event-driven accounting system built with FastAPI, Kafka, and PostgreSQL, featuring AI-powered natural language querying through LangChain integration.

## Overview

Shiv Accounts Cloud is a microservices-based accounting platform designed for learning and experimentation with modern financial technology patterns. It demonstrates real-time transaction processing, automated journal entry generation, and intelligent reporting capabilities.

### Key Features

- **Event-Driven Architecture**: Real-time transaction processing using Apache Kafka
- **RESTful API**: FastAPI-based endpoints for transaction management and reporting
- **Automated Accounting**: Intelligent journal entry generation from business transactions
- **AI-Powered Insights**: Natural language querying of financial data using LangChain
- **Scalable Data Layer**: Async SQLAlchemy with PostgreSQL and Alembic migrations
- **Idempotent Processing**: Robust event handling with duplicate detection
- **Comprehensive Reporting**: Built-in P&L and financial reporting capabilities

## Demo

View the system in action: [YouTube Demo](https://youtu.be/hyw7n2wjiMQ)



## System Architecture

![System Architecture](https://github.com/TShreek/ODOO_HACK/blob/main/Untitled%20diagram%20%7C%20Mermaid%20Chart-2025-09-21-055332.png)

The system follows a microservices architecture with event-driven communication:

- **Client Layer**: API clients and LangChain chatbot for natural language queries
- **API Gateway**: FastAPI application handling HTTP requests and event publishing
- **Message Broker**: Kafka for reliable transaction event streaming
- **Processing Engine**: Transaction consumer with automated journal entry generation
- **Data Layer**: PostgreSQL with async SQLAlchemy ORM
- **Reporting Layer**: Real-time financial reports (P&L, Balance Sheet, Journals)

## Prerequisites

- **Operating System**: macOS or Linux
- **Runtime**: Python 3.11+
- **Package Manager**: [uv](https://github.com/astral-sh/uv) (`pip install uv`)
- **Containerization**: Docker and Docker Compose
- **Database Client**: psql CLI or pgAdmin (optional)

### Port Requirements

| Service | Port | Description |
|---------|------|-------------|
| FastAPI | 8000 | Main API server |
| Kafka | 9092 | Message broker |
| Kafka UI | 8080 | Management interface |
| PostgreSQL | 5432 | Database server |

## Quick Start

### 1. Project Setup

```bash
git clone <repository-url>
cd shiv-accounts-cloud/backend
uv venv
source .venv/bin/activate
uv sync
```

### 2. Infrastructure Services

Start Kafka and related services:

```bash
docker compose -f docker-compose.kafka.yml up -d
```

Start PostgreSQL (if not running locally):

```bash
docker compose -f docker-compose.db.yml up -d
```

### 3. Database Configuration

Create database and user:

```bash
psql postgres -c "
CREATE ROLE appuser WITH LOGIN PASSWORD 'app_pw';
ALTER ROLE appuser CREATEDB;
CREATE DATABASE accounts_db OWNER appuser;
GRANT ALL PRIVILEGES ON DATABASE accounts_db TO appuser;
"
```

### 4. Environment Configuration

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://appuser:app_pw@localhost:5432/accounts_db

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_FINANCIAL_TRANSACTIONS_TOPIC=financial_transactions
KAFKA_CONSUMER_GROUP_ID=accounting_consumer_group_v2

# System Configuration
SYSTEM_USER_ID=00000000-0000-0000-0000-000000000001
TEST_TENANT_ID=11111111-1111-1111-1111-111111111111
DEV_CONTACT_ID=<your-contact-uuid>

# Chart of Accounts (example UUIDs)
AR_ACCOUNT_ID=3ca3cd4e-ef07-4bd8-8c93-b5a3cdca6de5
REVENUE_ACCOUNT_ID=9f90bba8-ff00-441d-a554-3400860e085f
TAX_ACCOUNT_ID=254acdad-cfff-47d9-baed-e6b21034cd6e
CASH_ACCOUNT_ID=7b71c318-53d0-4da8-b4c3-bfb8615b8282
BANK_ACCOUNT_ID=fac1cc27-6a58-4a21-a02d-aad832e59eae
AP_ACCOUNT_ID=4cc41db8-d61b-45b1-8b9c-dca2cfcce0e7
EXPENSE_ACCOUNT_ID=04a32f47-231c-4c2d-8109-5c2ff74cad5b
INPUT_TAX_ACCOUNT_ID=d8025083-2831-495f-b058-c887999f2d11
```

### 5. Database Migration

```bash
uv run alembic upgrade head
```

### 6. Master Data Setup

Initialize required master data:

```bash
psql -U appuser -d accounts_db -c "
INSERT INTO contacts (id, tenant_id, name, contact_type, is_active, created_at)
VALUES ('<your-DEV_CONTACT_ID>', '11111111-1111-1111-1111-111111111111', 'Dev Customer', 'customer', true, now())
ON CONFLICT DO NOTHING;
"
```

### 7. Start Services

**Terminal 1 - API Server:**
```bash
uv run uvicorn main:app --reload --port 8000
```

**Terminal 2 - Kafka Consumer:**
```bash
uv run python -m consumers.transaction_consumer
```

## API Usage

### Health Checks

```bash
# Database connectivity
curl http://localhost:8000/health/db

# Kafka connectivity
curl http://localhost:8000/health/kafka
```

### Transaction Processing

**Create Sales Invoice:**
```bash
curl -X POST http://localhost:8000/transactions/invoice/publish
```

**Process Customer Payment:**
```bash
curl -X POST http://localhost:8000/transactions/customer-payment/publish \
  -H "Content-Type: application/json" \
  -d '{"amount": 1180, "method": "bank", "note": "Payment for INV-0001"}'
```

### Financial Reporting

**Profit & Loss Statement:**
```bash
curl "http://localhost:8000/reports/pl?from_date=2025-09-01&to_date=2025-09-30&tenant_id=11111111-1111-1111-1111-111111111111"
```

## Project Structure

```
backend/
├── api/                    # FastAPI route handlers
├── consumers/              # Kafka message consumers
├── services/               # Business logic and external integrations
├── models/                 # SQLAlchemy data models
├── alembic/               # Database migrations
├── config.py              # Application configuration
├── database.py            # Database connection management
└── main.py               # Application entry point

docker-compose.kafka.yml   # Kafka infrastructure
docker-compose.db.yml      # PostgreSQL infrastructure
```

## Monitoring and Verification

### Event Processing Status

```sql
SELECT * FROM processed_events 
ORDER BY processed_at DESC 
LIMIT 10;
```

### Journal Entries with Account Details

```sql
SELECT 
    je.created_at,
    je.transaction_id,
    coa.account_code,
    coa.account_name,
    je.debit_amount,
    je.credit_amount
FROM journal_entries je
JOIN chart_of_accounts coa ON coa.id = je.account_id
ORDER BY je.created_at DESC
LIMIT 10;
```

## Troubleshooting

### Common Issues

**Kafka Bootstrap Server Configuration**
- Use: `KAFKA_BOOTSTRAP_SERVERS=localhost:9092`
- Avoid JSON format: `["localhost:9092"]`

**Event Processing Failures**
- Check `processed_events` table for failed events
- Review consumer logs for error details
- Ensure master data exists before processing transactions

**Database Connection Issues**
- Verify PostgreSQL is running and accessible
- Confirm database credentials in `.env`
- Check network connectivity on port 5432

## Development Roadmap

- [ ] Balance Sheet reporting endpoint
- [ ] Materialized views for performance optimization
- [ ] Enhanced schema validation with Pydantic
- [ ] Dead Letter Queue replay functionality
- [ ] Authentication and role-based access control
- [ ] Persistent transaction headers
- [ ] Multi-tenant support enhancements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support, please open an issue in the GitHub repository.
