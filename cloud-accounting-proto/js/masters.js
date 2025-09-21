// Masters module for Cloud Accounting app

class MastersService {
    constructor() {
        this.currentTab = 'contacts';
        this.editingContact = null;
        this.editingProduct = null;
        this.initializeEventListeners();
        this.loadInitialData();
    }

    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.master-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Contact modal
        document.getElementById('addContactBtn').addEventListener('click', () => {
            this.openContactModal();
        });

        document.getElementById('closeContactModal').addEventListener('click', () => {
            this.closeContactModal();
        });

        document.getElementById('cancelContactBtn').addEventListener('click', () => {
            this.closeContactModal();
        });

        document.getElementById('contactForm').addEventListener('submit', (e) => {
            this.handleContactSubmit(e);
        });

        // Product modal
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.openProductModal();
        });

        document.getElementById('closeProductModal').addEventListener('click', () => {
            this.closeProductModal();
        });

        document.getElementById('cancelProductBtn').addEventListener('click', () => {
            this.closeProductModal();
        });

        document.getElementById('productForm').addEventListener('submit', (e) => {
            this.handleProductSubmit(e);
        });

        // Modal overlay click to close
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeAllModals();
                }
            });
        });
    }

    async loadInitialData() {
        await this.loadContacts();
        await this.loadProducts();
        await this.loadTaxes();
        await this.loadAccounts();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.master-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.master-tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');

        this.currentTab = tabName;
    }

    // Contact Management
    async loadContacts() {
        try {
            const contacts = await API.getContacts();
            this.renderContactsTable(contacts);
        } catch (error) {
            console.error('Error loading contacts:', error);
            Utils.showSuccess('Error loading contacts', 5000);
        }
    }

    renderContactsTable(contacts) {
        const tbody = document.getElementById('contactsTableBody');
        
        if (contacts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-gray-500 py-8">No contacts found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = contacts.map(contact => `
            <tr>
                <td class="font-medium text-gray-900">${Utils.sanitizeInput(contact.name)}</td>
                <td>${Utils.sanitizeInput(contact.email)}</td>
                <td>${contact.phone ? Utils.formatPhoneNumber(contact.phone) : '-'}</td>
                <td>
                    <span class="status-badge ${contact.type === 'customer' ? 'status-confirmed' : contact.type === 'vendor' ? 'status-draft' : 'status-cancelled'}">
                        ${contact.type}
                    </span>
                </td>
                <td>
                    <div class="flex space-x-2">
                        <button onclick="mastersService.editContact('${contact.id}')" class="btn-outline text-xs">Edit</button>
                        <button onclick="mastersService.deleteContact('${contact.id}')" class="btn-danger text-xs">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    openContactModal(contact = null) {
        this.editingContact = contact;
        const modal = document.getElementById('contactModal');
        const title = document.getElementById('contactModalTitle');
        const form = document.getElementById('contactForm');
        
        if (contact) {
            title.textContent = 'Edit Contact';
            form.querySelector('#contactId').value = contact.id;
            form.querySelector('#contactName').value = contact.name;
            form.querySelector('#contactEmail').value = contact.email;
            form.querySelector('#contactPhone').value = contact.phone || '';
            form.querySelector('#contactType').value = contact.type;
            form.querySelector('#contactAddress').value = contact.address || '';
        } else {
            title.textContent = 'Add Contact';
            form.reset();
        }
        
        modal.classList.remove('hidden');
    }

    closeContactModal() {
        document.getElementById('contactModal').classList.add('hidden');
        this.editingContact = null;
    }

    async handleContactSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('contactName').value.trim(),
            email: document.getElementById('contactEmail').value.trim(),
            phone: document.getElementById('contactPhone').value.trim(),
            type: document.getElementById('contactType').value,
            address: document.getElementById('contactAddress').value.trim()
        };

        const contactId = document.getElementById('contactId').value;

        try {
            if (contactId) {
                await API.updateContact(contactId, formData);
                Utils.showSuccess('Contact updated successfully!');
            } else {
                await API.createContact(formData);
                Utils.showSuccess('Contact created successfully!');
            }
            
            this.closeContactModal();
            await this.loadContacts();
        } catch (error) {
            Utils.showSuccess('Error saving contact', 5000);
        }
    }

    async editContact(contactId) {
        try {
            const contacts = await API.getContacts();
            const contact = contacts.find(c => c.id === contactId);
            if (contact) {
                this.openContactModal(contact);
            }
        } catch (error) {
            Utils.showSuccess('Error loading contact', 5000);
        }
    }

    async deleteContact(contactId) {
        if (confirm('Are you sure you want to delete this contact?')) {
            try {
                await API.deleteContact(contactId);
                Utils.showSuccess('Contact deleted successfully!');
                await this.loadContacts();
            } catch (error) {
                Utils.showSuccess('Error deleting contact', 5000);
            }
        }
    }

    // Product Management
    async loadProducts() {
        try {
            const products = await API.getProducts();
            this.renderProductsTable(products);
        } catch (error) {
            console.error('Error loading products:', error);
            Utils.showSuccess('Error loading products', 5000);
        }
    }

    renderProductsTable(products) {
        const tbody = document.getElementById('productsTableBody');
        
        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-gray-500 py-8">No products found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td class="font-medium text-gray-900">${Utils.sanitizeInput(product.name)}</td>
                <td>${Utils.sanitizeInput(product.sku)}</td>
                <td>${product.hsnCode}</td>
                <td>${Utils.formatCurrency(product.price)}</td>
                <td>
                    <div class="flex space-x-2">
                        <button onclick="mastersService.editProduct('${product.id}')" class="btn-outline text-xs">Edit</button>
                        <button onclick="mastersService.deleteProduct('${product.id}')" class="btn-danger text-xs">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    openProductModal(product = null) {
        this.editingProduct = product;
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');
        const form = document.getElementById('productForm');
        
        if (product) {
            title.textContent = 'Edit Product';
            form.querySelector('#productId').value = product.id;
            form.querySelector('#productName').value = product.name;
            form.querySelector('#productSku').value = product.sku;
            form.querySelector('#productHsnCode').value = product.hsnCode;
            form.querySelector('#productPrice').value = product.price;
            form.querySelector('#productDescription').value = product.description || '';
        } else {
            title.textContent = 'Add Product';
            form.reset();
            // Auto-generate HSN code for new products
            form.querySelector('#productHsnCode').value = Utils.generateHSNCode();
        }
        
        modal.classList.remove('hidden');
    }

    closeProductModal() {
        document.getElementById('productModal').classList.add('hidden');
        this.editingProduct = null;
    }

    async handleProductSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('productName').value.trim(),
            sku: document.getElementById('productSku').value.trim(),
            hsnCode: document.getElementById('productHsnCode').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            description: document.getElementById('productDescription').value.trim()
        };

        const productId = document.getElementById('productId').value;

        try {
            if (productId) {
                await API.updateProduct(productId, formData);
                Utils.showSuccess('Product updated successfully!');
            } else {
                await API.createProduct(formData);
                Utils.showSuccess('Product created successfully!');
            }
            
            this.closeProductModal();
            await this.loadProducts();
        } catch (error) {
            Utils.showSuccess('Error saving product', 5000);
        }
    }

    async editProduct(productId) {
        try {
            const products = await API.getProducts();
            const product = products.find(p => p.id === productId);
            if (product) {
                this.openProductModal(product);
            }
        } catch (error) {
            Utils.showSuccess('Error loading product', 5000);
        }
    }

    async deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await API.deleteProduct(productId);
                Utils.showSuccess('Product deleted successfully!');
                await this.loadProducts();
            } catch (error) {
                Utils.showSuccess('Error deleting product', 5000);
            }
        }
    }

    // Tax Management
    async loadTaxes() {
        try {
            const data = API.getData();
            this.renderTaxesTable(data.taxes);
        } catch (error) {
            console.error('Error loading taxes:', error);
        }
    }

    renderTaxesTable(taxes) {
        const tbody = document.getElementById('taxesTableBody');
        
        if (taxes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-gray-500 py-8">No taxes found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = taxes.map(tax => `
            <tr>
                <td class="font-medium text-gray-900">${tax.name}</td>
                <td>${tax.rate}%</td>
                <td>
                    <span class="status-badge status-confirmed">
                        ${tax.type}
                    </span>
                </td>
                <td>
                    <div class="flex space-x-2">
                        <button onclick="mastersService.editTax('${tax.id}')" class="btn-outline text-xs">Edit</button>
                        <button onclick="mastersService.deleteTax('${tax.id}')" class="btn-danger text-xs">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Account Management
    async loadAccounts() {
        try {
            const data = API.getData();
            this.renderAccountsTable(data.accounts);
        } catch (error) {
            console.error('Error loading accounts:', error);
        }
    }

    renderAccountsTable(accounts) {
        const tbody = document.getElementById('accountsTableBody');
        
        if (accounts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-gray-500 py-8">No accounts found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = accounts.map(account => `
            <tr>
                <td class="font-medium text-gray-900">${account.code}</td>
                <td>${account.name}</td>
                <td>
                    <span class="status-badge ${account.type === 'asset' ? 'status-confirmed' : account.type === 'liability' ? 'status-draft' : 'status-cancelled'}">
                        ${account.type}
                    </span>
                </td>
                <td>
                    <div class="flex space-x-2">
                        <button onclick="mastersService.editAccount('${account.id}')" class="btn-outline text-xs">Edit</button>
                        <button onclick="mastersService.deleteAccount('${account.id}')" class="btn-danger text-xs">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
}

// Initialize masters service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (Utils.requireAuth()) {
        window.mastersService = new MastersService();
    }
});
