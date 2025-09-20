import { api } from '../api.js';

export function render(container) {
    container.innerHTML = `
        <h2>Customer Invoices</h2>
        <table id="invoices-table">
            <thead>
                <tr>
                    <th>Invoice Number</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;
    loadInvoices();
}

async function loadInvoices() {
    try {
        // Assuming a similar endpoint for customer invoices
        const invoices = await api.get('/transactions/customer-invoices');
        const tableBody = document.querySelector('#invoices-table tbody');
        tableBody.innerHTML = invoices.map(invoice => `
            <tr>
                <td>${invoice.invoice_number}</td>
                <td>${invoice.customer_name}</td>
                <td>${invoice.total_amount}</td>
                <td>${invoice.status}</td>
                <td>
                    ${invoice.status === 'draft' ? `<button class="confirm-invoice-btn" data-id="${invoice.id}">Confirm</button>` : ''}
                    ${invoice.status === 'open' ? `<button class="pay-invoice-btn" data-id="${invoice.id}" data-amount="${invoice.total_amount}" data-partner="${invoice.customer_id}">Receive Payment</button>` : ''}
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.confirm-invoice-btn').forEach(btn => {
            btn.addEventListener('click', handleConfirmInvoice);
        });
        document.querySelectorAll('.pay-invoice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { id, amount, partner } = e.target.dataset;
                window.location.hash = `/payments?invoice_id=${id}&amount=${amount}&partner_id=${partner}&type=customer`;
            });
        });
    } catch (error) {
        console.error('Failed to load invoices:', error);
        // Mocking this endpoint as it might not exist yet
        if (error.message.includes('404')) {
             document.querySelector('#invoices-table tbody').innerHTML = '<tr><td colspan="5">Customer Invoices API not available yet.</td></tr>';
        } else {
            alert('Could not load invoices.');
        }
    }
}

async function handleConfirmInvoice(e) {
    const invoiceId = e.target.dataset.id;
    try {
        await api.post(`/transactions/customer-invoices/${invoiceId}/confirm`);
        alert('Invoice confirmed successfully!');
        loadInvoices();
    } catch (error) {
        console.error('Failed to confirm invoice:', error);
        alert(`Error: ${error.message}`);
    }
}