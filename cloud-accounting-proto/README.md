# Cloud Accounting Web App

A comprehensive cloud accounting web application built with HTML, CSS, and vanilla JavaScript. This prototype demonstrates a full-featured accounting system with modern UI/UX design inspired by Apple's design language.

## Features

### 🔐 Authentication
- **Login & Signup** with validation
- Unique email validation
- Password strength checking
- Form validation with error messages
- Session management

### 📊 Dashboard
- Real-time financial overview
- Time-based filtering (24h, 7d, 30d)
- Key metrics: Invoices, Purchases, Payments
- Quick action buttons
- Recent activity feed

### 📋 Master Data Management
- **Contacts**: Customers, Vendors, Both
- **Products**: With HSN code auto-generation
- **Taxes**: Configurable tax rates
- **Chart of Accounts**: Asset, Liability, Income, Expense accounts
- Full CRUD operations with form validation

### 💼 Transaction Flows
- **Purchase Order → Vendor Bill → Bill Payment**
- **Sales Order → Customer Invoice → Invoice Payment**
- Auto-generated document numbers
- Document state management (Draft → Confirmed → Cancelled)
- Copy details between related documents
- Real-time total calculations

### 📈 Financial Reports
- **Partner Ledger**: Detailed transaction history per partner
- **Profit & Loss**: Income vs Expenses analysis
- **Balance Sheet**: Assets, Liabilities, and Equity
- Real-time updates when confirming transactions

### 💳 Customer Portal
- Customer-specific invoice view
- "Pay Now" functionality
- Razorpay payment simulation
- Payment success/failure handling

### 💰 Payment Management
- Record bill payments and invoice receipts
- Multiple payment methods
- Reference document linking
- Payment history tracking

## Technical Architecture

### Frontend Structure
```
cloud-accounting-proto/
├── index.html                 # Login page
├── signup.html               # Registration page
├── dashboard.html            # Main dashboard
├── masters.html              # Master data management
├── purchase.html             # Purchase orders & vendor bills
├── sales.html                # Sales orders & customer invoices
├── payments.html             # Payment management
├── reports.html              # Financial reports
├── customer_portal.html      # Customer-facing portal
├── vendor_bill.html          # Vendor bills page
├── invoice.html              # Customer invoices page
├── css/
│   └── style.css            # Apple-style CSS framework
└── js/
    ├── utils.js             # Utility functions
    ├── api.js               # API simulation layer
    ├── auth.js              # Authentication module
    ├── dashboard.js         # Dashboard functionality
    ├── masters.js           # Master data management
    ├── transactions.js      # Transaction flows
    ├── reports.js           # Reports generation
    ├── payments.js          # Payment management
    ├── customer-portal.js   # Customer portal
    └── vendor-razorpay-sim.js # Payment simulation
```

### Design System
- **Apple-inspired UI**: Clean, modern design with rounded corners and soft shadows
- **Responsive Layout**: Mobile-first design with responsive grid system
- **Color Palette**: Professional blue/gray theme with status-based color coding
- **Typography**: System fonts for optimal performance and readability
- **Interactive Elements**: Hover effects, smooth transitions, and loading states

### Data Management
- **In-Memory Storage**: Uses localStorage for data persistence
- **Modular API Layer**: Simulates backend API calls
- **Data Validation**: Client-side validation with error handling
- **State Management**: Document states and business rules enforcement

## Business Logic

### Document States
- **Draft**: Editable, not yet confirmed
- **Confirmed**: Locked, creates journal entries
- **Cancelled**: Voided, no financial impact

### Double-Entry Accounting
- **Purchase Bills**: Debit Purchase Expense, Credit Accounts Payable
- **Sales Invoices**: Debit Accounts Receivable, Credit Sales Income
- **Payments**: Debit/Credit appropriate accounts based on type
- **Journal Balancing**: Ensures debits equal credits

### Auto-Generation
- **Document Numbers**: PO-{timestamp}-{random}, INV-{timestamp}-{random}
- **HSN Codes**: Auto-generated for products
- **Reference Linking**: Automatic linking between related documents

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server setup required - runs entirely in the browser

### Installation
1. Clone or download the project files
2. Open `index.html` in your web browser
3. The app will initialize with sample data

### First Steps
1. **Sign Up**: Create a new account
2. **Add Master Data**: 
   - Create contacts (customers/vendors)
   - Add products with pricing
   - Configure tax rates
3. **Create Transactions**:
   - Start with a Purchase Order
   - Convert to Vendor Bill
   - Record payment
4. **View Reports**: Check financial reports for real-time updates

## Usage Guide

### Creating a Complete Transaction Flow

#### Purchase Flow
1. Go to **Purchase Orders** page
2. Click **Create Purchase Order**
3. Select vendor, add items, set quantities and prices
4. Save as draft, then **Confirm** the PO
5. Click **Create Bill** to convert PO to Vendor Bill
6. Confirm the bill to create journal entries
7. Go to **Payments** to record bill payment

#### Sales Flow
1. Go to **Sales Orders** page
2. Click **Create Sales Order**
3. Select customer, add items, set quantities and prices
4. Save as draft, then **Confirm** the SO
5. Click **Create Invoice** to convert SO to Customer Invoice
6. Confirm the invoice to create journal entries
7. Go to **Payments** to record invoice receipt

### Master Data Management
- **Contacts**: Add customers, vendors, or both
- **Products**: Include SKU, pricing, and HSN codes
- **Taxes**: Configure different tax rates
- **Accounts**: Set up chart of accounts structure

### Reports
- **Partner Ledger**: Select a partner to view their transaction history
- **Profit & Loss**: View income vs expenses for selected period
- **Balance Sheet**: See assets, liabilities, and equity position

### Customer Portal
- Customers can view their invoices
- Click **Pay Now** to simulate payment processing
- Payment success/failure feedback

## Technical Features

### Form Validation
- Real-time validation with error messages
- Password strength checking
- Email format validation
- Required field validation

### Responsive Design
- Mobile-first approach
- Flexible grid system
- Touch-friendly interface
- Optimized for all screen sizes

### Performance
- Modular JavaScript architecture
- Efficient DOM manipulation
- Minimal external dependencies
- Fast loading and rendering

### Security
- Input sanitization
- XSS prevention
- Secure data handling
- Session management

## Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Future Enhancements
- Backend API integration
- Real payment gateway integration
- Advanced reporting features
- Multi-currency support
- Inventory management
- User role management
- Audit trails
- Data export/import

## Contributing
This is a prototype application. For production use, consider:
- Backend API development
- Database integration
- Security hardening
- Performance optimization
- Testing framework implementation

## License
This project is for demonstration purposes. Please ensure proper licensing for commercial use.

---

**Note**: This is a frontend prototype that simulates backend functionality using localStorage. For production deployment, integrate with a proper backend API and database system.
