import { api } from '../api.js';

let products = [];
let contacts = [];

export async function render(container) {
    await loadInitialData();
    container.innerHTML = `
        <h2>Purchase Orders</h2>
        <div id="po-form-container"></div>
        <table id="po-table">
            <thead>
                <tr>
                    <th>PO Number</th>
                    <th>Vendor</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;
    renderPOForm(document.getElementById('po-form-container'));
    loadPurchaseOrders();
}

async function loadInitialData() {
    try {
        [products, contacts] = await Promise.all([
            api.get('/masters/products'),
            api.get('/masters/contacts')
        ]);
    } catch (error) {
        console.error('Failed to load initial data for POs:', error);
        alert('Could not load necessary data. Please try again.');
    }
}

async function loadPurchaseOrders() {
    try {
        const purchaseOrders = await api.get('/transactions/purchase-orders');
        const tableBody = document.querySelector('#po-table tbody');
        tableBody.innerHTML = purchaseOrders.map(po => `
            <tr>
                <td>${po.po_number}</td>
                <td>${po.vendor_name}</td>
                <td>${po.total_amount}</td>
                <td>${po.status}</td>
                <td>
                    ${po.status === 'draft' ? `<button class="confirm-po-btn" data-id="${po.id}">Confirm</button>` : ''}
                    ${po.status === 'confirmed' ? `<button class="create-bill-btn" data-id="${po.id}">Create Bill</button>` : ''}
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.create-bill-btn').forEach(btn => {
            btn.addEventListener('click', handleCreateBill);
        });
    } catch (error) {
        console.error('Failed to load purchase orders:', error);
    }
}

function renderPOForm(container) {
    const vendorOptions = contacts.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    container.innerHTML = `
        <form id="po-form">
            <h3>New Purchase Order</h3>
            <label for="vendor_id">Vendor</label>
            <select name="vendor_id" required>${vendorOptions}</select>
            
            <h4>Line Items</h4>
            <div id="po-lines"></div>
            <button type="button" id="add-po-line">Add Line</button>
            
            <button type="submit">Create Purchase Order</button>
        </form>
    `;

    document.getElementById('add-po-line').addEventListener('click', addPOLine);
    document.getElementById('po-form').addEventListener('submit', handlePOSubmit);
    addPOLine(); // Add one line by default
}

function addPOLine() {
    const lineContainer = document.createElement('div');
    lineContainer.classList.add('po-line-item');
    const productOptions = products.map(p => `<option value="${p.id}" data-price="${p.purchase_price}">${p.name}</option>`).join('');

    lineContainer.innerHTML = `
        <select name="product_id" class="product-select" required>${productOptions}</select>
        <input type="number" name="quantity" value="1" min="1" class="quantity-input" required>
        <input type="number" name="price" class="price-input" required>
        <button type="button" class="remove-line-btn">Remove</button>
    `;
    document.getElementById('po-lines').appendChild(lineContainer);

    const productSelect = lineContainer.querySelector('.product-select');
    const priceInput = lineContainer.querySelector('.price-input');
    
    // Set initial price
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    if(selectedOption) {
        priceInput.value = selectedOption.dataset.price;
    }


    productSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        priceInput.value = selectedOption.dataset.price;
    });

    lineContainer.querySelector('.remove-line-btn').addEventListener('click', () => {
        lineContainer.remove();
    });
}

async function handlePOSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const vendorId = form.querySelector('[name="vendor_id"]').value;
    const lines = [];
    document.querySelectorAll('.po-line-item').forEach(line => {
        lines.push({
            product_id: line.querySelector('[name="product_id"]').value,
            quantity: parseFloat(line.querySelector('[name="quantity"]').value),
            price: parseFloat(line.querySelector('[name="price"]').value),
        });
    });

    try {
        await api.post('/transactions/purchase-orders', {
            vendor_id: vendorId,
            lines: lines
        });
        alert('Purchase Order created successfully!');
        loadPurchaseOrders();
        form.reset();
        document.getElementById('po-lines').innerHTML = '';
        addPOLine();
    } catch (error) {
        console.error('Failed to create PO:', error);
        alert(`Error: ${error.message}`);
    }
}

async function handleCreateBill(e) {
    const poId = e.target.dataset.id;
    try {
        const bill = await api.post(`/transactions/purchase-orders/${poId}/create-bill`);
        alert(`Bill ${bill.bill_number} created successfully!`);
        window.location.hash = `/vendor-bills`; // Navigate to bills page
    } catch (error) {
        console.error('Failed to create bill:', error);
        alert(`Error: ${error.message}`);
    }
}