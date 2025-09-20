# Accounting Frontend (Minimal SPA)

A lightweight React (Vite) application for interacting with the FastAPI accounting backend.

## Features
- Master Data: Contacts, Products, Chart of Accounts CRUD
- Transactions: Purchase Orders, Sales Orders
- Reports: Profit & Loss, Balance Sheet
- Simple layout with Tailwind CSS
- Environment-configurable API base URL

## Getting Started
```bash
cd frontend
cp .env.example .env   # adjust if backend not on localhost:8000
npm install
npm run dev
```
Open http://localhost:3000

## Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_BASE` / `VITE_API_BASE` | Backend base URL | http://localhost:8000 |
| `REACT_APP_STATIC_TOKEN` / `VITE_STATIC_TOKEN` | Optional static bearer token | (empty) |

## Scripts
```bash
npm run dev       # start dev server
npm run build     # production build (dist/)
npm run preview   # preview production build
npm run test      # unit tests (Jest + RTL skeleton)
```

## API Usage (Assumed)
| Action | Endpoint |
|--------|----------|
| List Contacts | GET /api/contacts |
| Create Contact | POST /api/contacts |
| List Products | GET /api/products |
| Create Product | POST /api/products |
| List CoA | GET /api/coa |
| Create CoA | POST /api/coa |
| Create Purchase Order | POST /transactions/purchase_order |
| Create Sales Order | POST /transactions/sales_order |
| Profit & Loss | GET /reports/pnl?start=YYYY-MM-DD&end=YYYY-MM-DD |
| Balance Sheet | GET /reports/balance_sheet?as_of=YYYY-MM-DD |

## Testing
Run unit tests:
```bash
npm test
```

(Optionally) add Cypress for end-to-end flows later.

## Folder Structure
```
frontend/
  src/
    components/    # Layout + reusable components
    pages/         # Route pages
    lib/           # api client + utils
    test/          # test setup
```

## Future Enhancements
- Pagination/search (React Query)
- Draft transactions & autosave
- Dashboard metrics from backend
- CSV export for reports
- Role-based UI
- E2E tests with Cypress/Playwright

## License
Internal / Prototype
