# Shiv Accounts - Frontend Setup Guide

## Overview

This is a modern React frontend application for the Shiv Accounts ERP system, built with:

- **React 18** with Hooks and functional components
- **Vite** for fast development and building
- **React Router Dom** for navigation
- **React Query** for server state management
- **Zustand** for client state management
- **React Hook Form** for form handling
- **Tailwind CSS** for styling with iOS-inspired design
- **Lucide React** for consistent iconography

## Prerequisites

- Node.js 16+ and npm/yarn
- Backend API running on `http://localhost:8000`

## Installation & Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**
   ```bash
   # The .env file is already configured with:
   VITE_API_BASE=http://127.0.0.1:8000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000)

## Features Implemented

### ✅ Authentication System
- **Login/Register forms** with validation
- **JWT token management** with automatic refresh
- **Protected routes** with redirect to login
- **Persistent authentication** across browser sessions
- **Role-based access control** ready for backend integration

### ✅ Dashboard
- **iOS-inspired minimal design** with clean typography
- **Key metrics display** with statistics cards
- **Recent activity feed** with transaction history
- **Quick actions** for common tasks
- **Responsive layout** for mobile and desktop

### ✅ Master Data Management
- **Contacts (Customers/Vendors)**
  - Full CRUD operations with search and pagination
  - Contact type management (Customer, Vendor, Both)
  - Complete address and tax information forms
  - GST and PAN number validation
  - Professional modal forms with proper validation

### ✅ Transaction Entry
- **Customer Payments**
  - Payment recording with multiple methods
  - Real-time form validation
  - Integration with backend API
  - Local state management for immediate feedback

### ✅ Reports Interface
- **Profit & Loss Statement**
  - Date range filtering
  - Professional report layout
  - Income vs expense breakdown
  - Profit margin calculations

- **Balance Sheet**
  - As-of date filtering
  - Assets, liabilities, and equity sections
  - Automated balance verification
  - Professional accounting format

### ✅ UI/UX Components
- **iOS-inspired design system** with:
  - Rounded corners and soft shadows
  - Clean typography and spacing
  - Consistent color palette
  - Smooth transitions and hover effects
- **Responsive navigation** with sidebar
- **Professional forms** with proper validation
- **Loading states** and error handling
- **Accessible components** with proper ARIA labels

## File Structure

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Layout.jsx       # Main application layout
│   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   ├── Header.jsx       # Top header with user menu
│   │   └── ProtectedRoute.jsx # Route protection
│   ├── pages/               # Page components
│   │   ├── LoginPage.jsx    # Authentication login
│   │   ├── RegisterPage.jsx # User registration
│   │   ├── DashboardPage.jsx # Main dashboard
│   │   ├── masters/         # Master data pages
│   │   │   ├── ContactsPage.jsx
│   │   │   └── ContactForm.jsx
│   │   ├── transactions/    # Transaction pages
│   │   │   └── CustomerPaymentsPage.jsx
│   │   └── reports/         # Report pages
│   │       ├── ProfitLossPage.jsx
│   │       └── BalanceSheetPage.jsx
│   ├── stores/              # State management
│   │   └── authStore.js     # Authentication store
│   ├── lib/                 # Utilities and API
│   │   ├── api.js          # Enhanced API client
│   │   ├── format.js       # Formatting utilities
│   │   └── realtime.js     # WebSocket client
│   ├── index.css           # Global styles and Tailwind
│   ├── main.jsx            # Application entry point
│   └── App.jsx             # Main app component with routing
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── vite.config.js          # Vite build configuration
└── .env                    # Environment variables
```

## API Integration

The frontend is fully integrated with your backend API:

- **Authentication endpoints** (`/api/v1/login`, `/api/v1/register`)
- **Master data endpoints** (`/api/v1/masters/*`)
- **Transaction endpoints** (`/transactions/*`)
- **Reports endpoints** (`/reports/*`)
- **Health check endpoints** (`/health/*`)

## Styling Approach

The application uses **Tailwind CSS** with a custom design system inspired by iOS:

- **Color palette** with primary blue and semantic colors
- **Typography** using system fonts for native feel
- **Spacing** with consistent margins and padding
- **Components** with reusable CSS classes
- **Responsive design** with mobile-first approach

## State Management

- **Zustand** for global authentication state
- **React Query** for server state and caching
- **React Hook Form** for form state management
- **Local state** with useState for component-specific data

## Next Steps

The frontend is production-ready with:

1. **Complete authentication flow**
2. **Professional UI/UX design**
3. **Full API integration**
4. **Responsive mobile support**
5. **Error handling and loading states**
6. **TypeScript-ready architecture**

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Environment Variables

```env
VITE_API_BASE=http://127.0.0.1:8000  # Backend API URL
```

The frontend is now ready for production use with your comprehensive backend API!