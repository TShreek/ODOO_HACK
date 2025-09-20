# ODOO Hackathon Frontend

This is a plain HTML/CSS/JS frontend for the ODOO Hackathon project. It is designed to be a drop-in client for the FastAPI backend.

## How to Run

1.  **Prerequisites**: You need a modern web browser and a local web server. `python -m http.server` is a good choice. You also need the backend server running.

2.  **Configure API Base URL**:
    *   Open `js/api.js`.
    *   Change the `BASE_URL` constant to match your backend server's address. The default is `http://localhost:8000`.

3.  **Start the Frontend Server**:
    *   Navigate to the `frontend/public` directory in your terminal.
    *   Run a static file server. For example, with Python 3:
        ```bash
        python -m http.server 8080
        ```
    *   Or using `npx`:
        ```bash
        npx http-server -p 8080
        ```

4.  **Access the Application**:
    *   Open your web browser and go to `http://localhost:8080`.

## Testing & Verification

Here are some example `curl` commands and JS console snippets to test critical flows.

### 1. Login and Store Token

**JS Console (in browser):**
```javascript
// Use the login form on the page, then check for the token
localStorage.getItem('access_token'); 
// Should return a long JWT string
```

### 2. Create and List a Contact

**JS Console:**
```javascript
// Use the UI on the "Contacts" page to create a contact.
// Then, to verify via console:
import { api } from './js/api.js';
api.get('/masters/contacts').then(console.log);
// Should show a list of contacts including the one you created.
```

### 3. Create a Product with HSN Search

**JS Console:**
```javascript
// Use the UI on the "Products" page.
// 1. Type "96" into the HSN search box.
// 2. Select an HSN code from the dropdown.
// 3. Fill out the rest of the product details and save.
// To verify:
api.get('/masters/products?search=YourProductName').then(console.log);
```

### 4. Full Purchase Flow (PO -> Bill -> Payment)

This is best tested through the UI.

**Test Plan for Demo:**

1.  **Register a new user** using the "Register" page.
2.  **Login** with the new user credentials.
3.  Navigate to **Contacts** and create a new Vendor (e.g., "Awesome Supplies").
4.  Navigate to **Products** and create a new "Storable" product (e.g., "Laptop Stand", with a purchase price).
5.  Go to **Purchase Orders** and create a new PO for "Awesome Supplies" with the "Laptop Stand" product.
6.  From the PO list, click **"Create Bill"**. You will be redirected to the Vendor Bills page.
7.  On the **Vendor Bills** page, find the new bill in "draft" status and click **"Confirm"**. The status should change to "open".
8.  Click the **"Pay"** button on the open bill. You will be redirected to the Payment form with details pre-filled.
9.  **Record the payment**.
10. Navigate to the **Dashboard**. The "Total Purchases" and "Total Payments" cards should reflect the new transaction.

## Screenshots

*To generate screenshots, run the application and follow the test plan above.*

1.  **Login Screen**: Take a screenshot of the login page at `http://localhost:8080/#/login`.
2.  **Master Data Page**: After creating a product, take a screenshot of the Products page (`/#/products`) showing the table with the new product.
3.  **Dashboard**: After completing the full purchase flow, take a screenshot of the dashboard (`/#/dashboard`) showing updated summary cards.
