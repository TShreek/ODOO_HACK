import { api } from '../api.js';

export function render(container) {
    container.innerHTML = `
        <h2>Vendor Bills</h2>
        <table id="vendor-bills-table">
            <thead>
                <tr>
                    <th>Bill Number</th>
                    <th>Vendor</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;
    loadVendorBills();
}

async function loadVendorBills() {
    try {
        const bills = await api.get('/transactions/vendor-bills');
        const tableBody = document.querySelector('#vendor-bills-table tbody');
        tableBody.innerHTML = bills.map(bill => `
            <tr>
                <td>${bill.bill_number}</td>
                <td>${bill.vendor_name}</td>
                <td>${bill.total_amount}</td>
                <td>${bill.status}</td>
                <td>
                    ${bill.status === 'draft' ? `<button class="confirm-bill-btn" data-id="${bill.id}">Confirm</button>` : ''}
                    ${bill.status === 'open' ? `<button class="pay-bill-btn" data-id="${bill.id}" data-amount="${bill.total_amount}" data-partner="${bill.vendor_id}">Pay</button>` : ''}
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.confirm-bill-btn').forEach(btn => {
            btn.addEventListener('click', handleConfirmBill);
        });
        document.querySelectorAll('.pay-bill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { id, amount, partner } = e.target.dataset;
                // Redirect to payment page with pre-filled data
                window.location.hash = `/payments?bill_id=${id}&amount=${amount}&partner_id=${partner}&type=vendor`;
            });
        });
    } catch (error) {
        console.error('Failed to load vendor bills:', error);
        alert('Could not load vendor bills.');
    }
}

async function handleConfirmBill(e) {
    const billId = e.target.dataset.id;
    try {
        await api.post(`/transactions/vendor-bills/${billId}/confirm`);
        alert('Bill confirmed successfully!');
        loadVendorBills();
    } catch (error) {
        console.error('Failed to confirm bill:', error);
        alert(`Error: ${error.message}`);
    }
}