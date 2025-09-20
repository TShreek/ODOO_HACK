import { api } from '../api.js';

let contacts = [];

export async function render(container) {
    await loadContacts();
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    
    const partnerOptions = contacts.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    container.innerHTML = `
        <form id="payment-form">
            <h2>Record a Payment</h2>
            
            <label for="payment_type">Payment Type</label>
            <select name="payment_type" required>
                <option value="send" ${params.get('type') === 'vendor' ? 'selected' : ''}>Send Money</option>
                <option value="receive" ${params.get('type') === 'customer' ? 'selected' : ''}>Receive Money</option>
            </select>

            <label for="partner_id">Partner</label>
            <select name="partner_id" required>
                ${partnerOptions}
            </select>

            <label for="amount">Amount</label>
            <input type="number" name="amount" value="${params.get('amount') || ''}" required>

            <input type="hidden" name="invoice_id" value="${params.get('invoice_id') || ''}">
            <input type="hidden" name="bill_id" value="${params.get('bill_id') || ''}">

            <button type="submit">Record Payment</button>
        </form>
    `;

    const partnerSelect = container.querySelector('[name="partner_id"]');
    if (params.get('partner_id')) {
        partnerSelect.value = params.get('partner_id');
    }

    document.getElementById('payment-form').addEventListener('submit', handlePaymentSubmit);
}

async function loadContacts() {
    try {
        contacts = await api.get('/masters/contacts');
    } catch (error) {
        console.error('Failed to load contacts for payments:', error);
    }
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Clean up data
    data.amount = parseFloat(data.amount);
    if (!data.invoice_id) delete data.invoice_id;
    if (!data.bill_id) delete data.bill_id;


    try {
        await api.post('/transactions/payments', data);
        alert('Payment recorded successfully!');
        window.location.hash = '/dashboard'; // Or back to the previous page
    } catch (error) {
        console.error('Failed to record payment:', error);
        alert(`Error: ${error.message}`);
    }
}