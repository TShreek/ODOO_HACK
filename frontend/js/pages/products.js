import { api } from '../api.js';

export function render(container) {
    container.innerHTML = `
        <h2>Products</h2>
        <button id="new-product-btn">New Product</button>
        <div id="product-form-container"></div>
        <input type="text" id="product-search" placeholder="Search products...">
        <table id="products-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Sale Price</th>
                    <th>Purchase Price</th>
                    <th>HSN Code</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    document.getElementById('new-product-btn').addEventListener('click', () => {
        renderProductForm(document.getElementById('product-form-container'));
    });

    document.getElementById('product-search').addEventListener('input', (e) => {
        loadProducts(e.target.value);
    });

    loadProducts();
}

async function loadProducts(search = '') {
    try {
        const products = await api.get('/masters/products', { search });
        const tableBody = document.querySelector('#products-table tbody');
        tableBody.innerHTML = products.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>${product.sale_price}</td>
                <td>${product.purchase_price}</td>
                <td>${product.hsn_code || ''}</td>
                <td>
                    <button class="edit-btn" data-id="${product.id}">Edit</button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const product = products.find(p => p.id == id);
                renderProductForm(document.getElementById('product-form-container'), product);
            });
        });
    } catch (error) {
        console.error('Failed to load products:', error);
        alert('Could not load products.');
    }
}

function renderProductForm(container, product = {}) {
    container.innerHTML = `
        <form id="product-form">
            <h3>${product.id ? 'Edit' : 'New'} Product</h3>
            <input type="hidden" name="id" value="${product.id || ''}">
            <label for="name">Name</label>
            <input type="text" name="name" value="${product.name || ''}" required>
            
            <label for="product_type">Type</label>
            <select name="product_type" required>
                <option value="storable" ${product.product_type === 'storable' ? 'selected' : ''}>Storable</option>
                <option value="service" ${product.product_type === 'service' ? 'selected' : ''}>Service</option>
            </select>

            <label for="sale_price">Sale Price</label>
            <input type="number" name="sale_price" value="${product.sale_price || 0}" required>
            
            <label for="purchase_price">Purchase Price</label>
            <input type="number" name="purchase_price" value="${product.purchase_price || 0}" required>

            <label for="hsn_code">HSN Code</label>
            <input type="text" id="hsn-search" name="hsn_code" value="${product.hsn_code || ''}" autocomplete="off">
            <div id="hsn-results"></div>

            <button type="submit">Save</button>
            <button type="button" id="cancel-btn">Cancel</button>
        </form>
    `;

    const hsnSearchInput = document.getElementById('hsn-search');
    const hsnResults = document.getElementById('hsn-results');

    hsnSearchInput.addEventListener('input', async (e) => {
        const query = e.target.value;
        if (query.length < 2) {
            hsnResults.innerHTML = '';
            return;
        }
        try {
            const results = await api.get('/masters/hsn', { q: query });
            hsnResults.innerHTML = results.map(r => `<div class="hsn-result-item" data-code="${r.code}">${r.code} - ${r.description}</div>`).join('');
            
            document.querySelectorAll('.hsn-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    hsnSearchInput.value = item.dataset.code;
                    hsnResults.innerHTML = '';
                });
            });
        } catch (error) {
            console.error('HSN search failed:', error);
        }
    });

    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            if (data.id) {
                await api.put(`/masters/products/${data.id}`, data);
            } else {
                await api.post('/masters/products', data);
            }
            container.innerHTML = '';
            loadProducts();
        } catch (error) {
            console.error('Failed to save product:', error);
            alert(`Error: ${error.message}`);
        }
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
        container.innerHTML = '';
    });
}