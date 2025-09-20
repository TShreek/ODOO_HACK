import { updateUI, logout } from './auth.js';
import { render as renderLogin } from './pages/login.js';
import { render as renderRegister } from './pages/register.js';
import { render as renderDashboard } from './pages/dashboard.js';
import { render as renderContacts } from './pages/contacts.js';
import { render as renderProducts } from './pages/products.js';
import { render as renderPurchaseOrder } from './pages/purchase_order.js';
import { render as renderVendorBill } from './pages/vendor_bill.js';
import { render as renderCustomerInvoice } from './pages/customer_invoice.js';
import { render as renderReports } from './pages/reports.js';

const routes = {
    '/': renderDashboard,
    '/login': renderLogin,
    '/register': renderRegister,
    '/dashboard': renderDashboard,
    '/contacts': renderContacts,
    '/products': renderProducts,
    '/purchase-orders': renderPurchaseOrder,
    '/vendor-bills': renderVendorBill,
    '/invoices': renderCustomerInvoice,
    '/payments': renderPayment,
    '/reports': renderReports,
};

const appRoot = document.getElementById('app-root');

let currentPageCleanup = null;

function router() {
    // Run cleanup for the previous page
    if (currentPageCleanup) {
        currentPageCleanup();
        currentPageCleanup = null;
    }

    const path = window.location.hash.slice(1).split('?')[0] || '/';
    const routeHandler = routes[path] || routes['/']; // Default to dashboard
    
    if (path !== '/login' && path !== '/register' && !localStorage.getItem('access_token')) {
        window.location.hash = '/login';
        return;
    }

    appRoot.innerHTML = ''; // Clear previous content
    routeHandler(appRoot);

    // Check if the new page has a cleanup function
    const pageModule = `./pages${path}.js`;
    import(pageModule).then(module => {
        if (module.cleanup) {
            currentPageCleanup = module.cleanup;
        }
    }).catch(err => {
        // This is expected for pages without cleanup, so we can ignore the error
    });

    updateUI();
}


// Listen on hash change
window.addEventListener('hashchange', router);

// Listen on page load
window.addEventListener('load', router);

// Logout button
document.getElementById('logout-btn').addEventListener('click', logout);