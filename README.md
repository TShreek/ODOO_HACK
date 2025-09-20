# Shiv Accounts Cloud

## 🚀 Overview
Shiv Accounts Cloud is a modern, cloud-based accounting system for small-to-midsize businesses. It provides a real-time, multi-tenant platform for managing financial operations, including sales, purchases, and payments. The system is built for performance and reliability, leveraging an event-driven architecture to ensure data integrity and provide real-time reporting.

---

## 🌟 Core Features
- **Master Data Management**: Centralized management of contacts, products, taxes, and a chart of accounts.
- **Transaction Processing**: A full-featured flow for sales and purchases, from orders to invoices and payments.
- **Automated Financial Reporting**: Real-time generation of key financial reports like the Balance Sheet, Profit & Loss, and Stock Statement.
- **Role-Based Access Control**: Secure user roles for business owners, accountants, and contacts.

---

## ⚙️ Technology Stack

### Backend
- **Framework**: FastAPI (Python) - For building a high-performance, asynchronous API.
- **Database**: PostgreSQL - A robust, ACID-compliant relational database.
- **Event Bus**: Apache Kafka - An event-driven core for reliable, asynchronous transaction processing.
- **Package Management**: uv - A fast, next-generation Python package manager for reliable builds.
- **Containerization**: Docker & Docker Compose - For a consistent development and production environment.

### Frontend
- **Framework**: React - A declarative JavaScript library for building user interfaces.
- **Styling**: Tailwind CSS - A utility-first CSS framework for rapid styling.
- **Components**: ShadCN/UI - A customizable component library for a modern and polished UI.

---

## 🤝 Architecture
Our system uses a hybrid microservices architecture with an event-driven core. The frontend communicates with a fast, non-blocking FastAPI service. For every financial transaction, the API service publishes an event to a Kafka topic. A separate Kafka consumer service then processes these events asynchronously, ensuring that data is written to the PostgreSQL database reliably and without impacting API responsiveness. This approach guarantees data integrity, scalability, and high performance.
