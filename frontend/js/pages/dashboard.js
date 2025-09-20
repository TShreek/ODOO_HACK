import { api } from '../api.js';

let intervalId;

export function render(container) {
    container.innerHTML = `
        <h2>Dashboard</h2>
        <div class="dashboard-summary">
            <div class="summary-card">
                <h3>Total Invoiced</h3>
                <p id="total-invoiced">Loading...</p>
            </div>
            <div class="summary-card">
                <h3>Total Purchases</h3>
                <p id="total-purchases">Loading...</p>
            </div>
            <div class="summary-card">
                <h3>Total Payments</h3>
                <p id="total-payments">Loading...</p>
            </div>
        </div>
    `;

    loadDashboardData();
    // Clear previous interval if it exists
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(loadDashboardData, 10000); // Poll every 10 seconds
}

async function loadDashboardData() {
    try {
        // These endpoints are hypothetical based on the prompt.
        // You may need to adjust them or compute the values from other endpoints.
        const summary = await api.get('/reports/summary');
        
        document.getElementById('total-invoiced').textContent = formatCurrency(summary.total_invoiced);
        document.getElementById('total-purchases').textContent = formatCurrency(summary.total_purchases);
        document.getElementById('total-payments').textContent = formatCurrency(summary.total_payments);

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        const errorText = 'Not available';
        document.getElementById('total-invoiced').textContent = errorText;
        document.getElementById('total-purchases').textContent = errorText;
        document.getElementById('total-payments').textContent = errorText;
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

// Add a cleanup function for when the user navigates away
export function cleanup() {
    if (intervalId) {
        clearInterval(intervalId);
    }
}