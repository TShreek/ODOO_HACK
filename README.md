# Shiv Accounts Cloud — Local Runbook (Kafka + FastAPI + Postgres)

## What you get

Event-driven accounting skeleton with:

- **FastAPI app** (publishes events, exposes reports & health)
- **Kafka producer/consumer pipeline**
- **Async SQLAlchemy** (Postgres) with Alembic migrations
- **Idempotency** via `processed_events`
- **Minimal accounting engine** that writes `journal_entries`

## Directory highlights

```
backend/
  api/ (transactions, reports, health)
  consumers/transaction_consumer.py
  services/kafka_producer.py, accounting_engine.py
  models/ (transactions, masters, events)
  alembic/ (migrations)
  main.py, config.py, database.py

docker-compose.kafka.yml, docker-compose.db.yml
.env (you create this)
```

## Prerequisites

macOS/Linux with:

- **Docker & Docker Compose**
- **Python 3.11**
- **uv** (Python package manager) → `pip install uv` (or follow uv docs)
- **psql CLI** (or pgAdmin if you prefer UI)

### Ports used:

- **FastAPI**: 8000
- **Kafka**: 9092 (and UI 8080 if you run it)
- **Postgres**: 5432

---

## Clone & bootstrap the Python env

```bash
cd backend
uv venv
source .venv/bin/activate
uv sync # installs deps from pyproject.toml
```

## Start Kafka locally

Brings up Zookeeper + Kafka + (optional) Kafka-UI:

```bash
docker compose -f docker-compose.kafka.yml up -d
```

Validate broker is up with Kafka-UI at [http://localhost:8080](http://localhost:8080) (if included in compose).

---

## Prepare Postgres

### Option A — local service already running

Ensure a Postgres server is running on `127.0.0.1:5432`.

### Option B — run via Docker (example)

```bash
docker compose -f docker-compose.db.yml up -d
```

### Create DB & app user (if you haven’t already)

```bash
psql postgres
-- inside psql:
CREATE ROLE appuser WITH LOGIN PASSWORD 'app_pw';
ALTER ROLE appuser CREATEDB;
CREATE DATABASE accounts_db OWNER appuser;
GRANT ALL PRIVILEGES ON DATABASE accounts_db TO appuser;
\q
```

---

## Create your `.env`

Create `backend/.env` with these (use YOUR UUIDs for accounts; shown are examples):

```env
--- Core ---
DATABASE_URL=postgresql+asyncpg://appuser:app_pw@localhost:5432/accounts_db
SECRET_KEY=dev-secret-key-for-testing
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

--- Kafka ---
IMPORTANT: plain comma-separated, no brackets/quotes:
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_FINANCIAL_TRANSACTIONS_TOPIC=financial_transactions
KAFKA_CONSUMER_GROUP_ID=accounting_consumer_group_v2

--- System / Tenant ---
SYSTEM_USER_ID=00000000-0000-0000-0000-000000000001
TEST_TENANT_ID=11111111-1111-1111-1111-111111111111
DEV_CONTACT_ID=<uuid of your dev customer>

--- Sales CoA (examples) ---
AR_ACCOUNT_ID=3ca3cd4e-ef07-4bd8-8c93-b5a3cdca6de5
REVENUE_ACCOUNT_ID=9f90bba8-ff00-441d-a554-3400860e085f
TAX_ACCOUNT_ID=254acdad-cfff-47d9-baed-e6b21034cd6e

--- Payments CoA ---
CASH_ACCOUNT_ID=7b71c318-53d0-4da8-b4c3-bfb8615b8282
BANK_ACCOUNT_ID=fac1cc27-6a58-4a21-a02d-aad832e59eae

--- Purchase/AP CoA ---
AP_ACCOUNT_ID=4cc41db8-d61b-45b1-8b9c-dca2cfcce0e7
EXPENSE_ACCOUNT_ID=04a32f47-231c-4c2d-8109-5c2ff74cad5b
INPUT_TAX_ACCOUNT_ID=d8025083-2831-495f-b058-c887999f2d11
```

### Tip: confirm settings load

```bash
uv run python - <<'PY'
from config import settings
print("BOOTSTRAPS =", settings.KAFKA_BOOTSTRAP_SERVERS)
print("DB =", settings.DATABASE_URL)
print("AR =", settings.AR_ACCOUNT_ID)
PY
```

---

## Run migrations (create tables)

```bash
uv run alembic revision --autogenerate -m "init" # first time only; if already present, skip
uv run alembic upgrade head
```

### Verify:

```bash
psql -U appuser -d accounts_db -c "\dt"
```

You should see tables: `users`, `contacts`, `products`, `taxes`, `chart_of_accounts`, `transactions`, `transaction_lines`, `journal_entries`, `processed_events`, `alembic_version`.

---

## Seed minimal masters (one-time)

Create a Dev Customer contact (must include `contact_type`):

```bash
psql -U appuser -d accounts_db -c "
INSERT INTO contacts (id, tenant_id, name, contact_type, is_active, created_at)
VALUES ('<your DEV_CONTACT_ID>', '11111111-1111-1111-1111-111111111111', 'Dev Customer', 'customer', true, now())
ON CONFLICT DO NOTHING;"
```

Ensure the Chart of Accounts has the UUIDs you placed in `.env` (use your own seed scripts/SQL if needed).

---

## Start the FastAPI app

From `backend/`:

```bash
uv run uvicorn main:app --reload --port 8000
```

---

## Health checks

- **DB**: `curl http://localhost:8000/health/db`
- **Kafka**: `curl http://localhost:8000/health/kafka`

---

## Start the Kafka consumer (separate terminal)

New terminal, from `backend/`:

```bash
source .venv/bin/activate
uv run python -m consumers.transaction_consumer
```

You should see logs like:

```bash
[consumer] committed offset N on p0
or
[consumer] error, NOT committing: ...
```

---

## Publish test transactions (from API)

### A) Sales Invoice → journals (DR AR, CR Revenue, CR Tax)

```bash
curl -X POST http://localhost:8000/transactions/invoice/publish
```

### B) Customer Payment → journals (DR Bank/Cash, CR AR)

```bash
curl -X POST http://localhost:8000/transactions/customer-payment/publish \
  -H "Content-Type: application/json" \
  -d '{"amount":1180,"method":"bank","note":"Payment for INV-0001"}'
```

### C) Vendor Bill & Vendor Payment (optional if wired in your repo)

#### Bill

```bash
curl -X POST http://localhost:8000/transactions/bill/publish
```

#### Vendor Payment

```bash
curl -X POST http://localhost:8000/transactions/vendor-payment/publish \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"method":"cash","note":"Pay vendor ABC"}'
```

---

## Verify results in DB

### Processed/failed events

```bash
psql -U appuser -d accounts_db -c "SELECT * FROM processed_events ORDER BY processed_at DESC LIMIT 5;"
```

### Latest journals (map to CoA for readability)

```bash
psql -U appuser -d accounts_db -c "SELECT je.created_at, je.transaction_id, coa.account_code, coa.account_name,
je.debit_amount, je.credit_amount
FROM journal_entries je
JOIN chart_of_accounts coa ON coa.id = je.account_id
ORDER BY je.created_at DESC
LIMIT 10;"
```

### Profit & Loss report (current month window example)

```bash
curl "http://localhost:8000/reports/pl?from_date=2025-09-01&to_date=2025-09-30&tenant_id=11111111-1111-1111-1111-111111111111"
```

Expected JSON:

```json
{"total_income":1000.0,"total_expense":0.0,"net_profit":1000.0}
```

---

## Common pitfalls & fixes

### KAFKA_BOOTSTRAP_SERVERS format

- Must be: `KAFKA_BOOTSTRAP_SERVERS=localhost:9092`
- NOT JSON: `KAFKA_BOOTSTRAP_SERVERS=["localhost:9092"]`

If wrong, you’ll see errors like:

```bash
ValueError: invalid literal for int() with base 10: '9092"'
```

### Old bad messages causing errors

Consumer writes `status='failed'` in `processed_events` and sends to DLQ.

Fix data/IDs, re-publish new events; consumer skips duplicates via `event_id` / `event_hash`.

### FK violation on `journal_entries.transaction_id`

If your event’s `transaction_id` has no header in DB, consumer nulls the FK (expected in this skeleton).

### P&L 500 error on dates

We use “`< to_date + 1 day`” semantics—ensure query params are correct & ISO dates.

---

## Stop everything

### API

Ctrl+C in the `uvicorn` terminal

### Consumer

Ctrl+C in the consumer terminal

### Kafka & DB (if using compose)

```bash
docker compose -f docker-compose.kafka.yml down
docker compose -f docker-compose.db.yml down
```

---

## What to change next (quick backlog)

- Add Balance Sheet endpoint similar to P&L
- Materialized views for faster reports
- Stronger schema validation on envelopes (Pydantic)
- DLQ replay utility
- Auth/RBAC middleware
- Real transaction headers persisted on API side (optional, when moving beyond publish-only)