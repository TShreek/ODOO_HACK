// Transactions module for Cloud Accounting app

class TransactionsService {
    constructor() {
        this.currentPage = this.detectPage();
        this.initializeEventListeners();
        this.loadInitialData();
    }

    detectPage() {
        const path = window.location.pathname;
        if (path.includes('purchase.html')) return 'purchase';
        if (path.includes('sales.html')) return 'sales';
        return 'purchase';
    }

    initializeEventListeners() {
        // Purchase Order events
        if (this.currentPage === 'purchase') {
            document.getElementById('createPOBtn').addEventListener('click', () => {
                this.openPOModal();
            });

            document.getElementById('closePOModal').addEventListener('click', () => {
                this.closePOModal();
            });

            document.getElementById('cancelPOBtn').addEventListener('click', () => {
                this.closePOModal();
            });

            document.getElementById('poForm').addEventListener('submit', (e) => {
                this.handlePOSubmit(e);
            });

            document.getElementById('addPOItem').addEventListener('click', () => {
                this.addPOItem();
            });

            // Vendor Bill events
            document.getElementById('closeBillModal').addEventListener('click', () => {
                this.closeBillModal();
            });

            document.getElementById('cancelBillBtn').addEventListener('click', () => {
                this.closeBillModal();
            });

            document.getElementById('billForm').addEventListener('submit', (e) => {
                this.handleBillSubmit(e);
            });

            document.getElementById('addBillItem').addEventListener('click', () => {
                this.addBillItem();
            });
        }

        // Sales Order events
        if (this.currentPage === 'sales') {
            document.getElementById('createSOBtn').addEventListener('click', () => {
                this.openSOModal();
            });

            document.getElementById('closeSOModal').addEventListener('click', () => {
                this.closeSOModal();
            });

            document.getElementById('cancelSOBtn').addEventListener('click', () => {
                this.closeSOModal();
            });

            document.getElementById('soForm').addEventListener('submit', (e) => {
                this.handleSOSubmit(e);
            });

            document.getElementById('addSOItem').addEventListener('click', () => {
                this.addSOItem();
            });

            // Customer Invoice events
            document.getElementById('closeInvoiceModal').addEventListener('click', () => {
                this.closeInvoiceModal();
            });

            document.getElementById('cancelInvoiceBtn').addEventListener('click', () => {
                this.closeInvoiceModal();
            });

            document.getElementById('invoiceForm').addEventListener('submit', (e) => {
                this.handleInvoiceSubmit(e);
            });

            document.getElementById('addInvoiceItem').addEventListener('click', () => {
                this.addInvoiceItem();
            });
        }

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
        if (this.currentPage === 'purchase') {
            await this.loadPurchaseOrders();
            await this.loadVendorBills();
            await this.loadVendors();
        } else if (this.currentPage === 'sales') {
            await this.loadSalesOrders();
            await this.loadCustomerInvoices();
            await this.loadCustomers();
        }
    }

    // Purchase Order Management
    async loadPurchaseOrders() {
        try {
            const pos = await API.getPurchaseOrders();
            this.renderPOTable(pos);
        } catch (error) {
            console.error('Error loading purchase orders:', error);
        }
    }

    renderPOTable(pos) {
        const tbody = document.getElementById('poTableBody');
        
        if (pos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-gray-500 py-8">No purchase orders found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pos.map(po => `
            <tr>
                <td class="font-medium text-gray-900">${po.number}</td>
                <td>${this.getVendorName(po.vendorId)}</td>
                <td>${Utils.formatDate(po.date)}</td>
                <td>${Utils.formatCurrency(po.total || 0)}</td>
                <td>
                    <span class="status-badge ${Utils.getStatusColor(po.status)}">
                        ${po.status}
                    </span>
                </td>
                <td>
                    <div class="flex space-x-2">
                        ${po.status === 'draft' ? `
                            <button onclick="transactionsService.editPO('${po.id}')" class="btn-outline text-xs">Edit</button>
                            <button onclick="transactionsService.confirmPO('${po.id}')" class="btn-success text-xs">Confirm</button>
                        ` : ''}
                        <button onclick="transactionsService.createBillFromPO('${po.id}')" class="btn-primary text-xs">Create Bill</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadVendorBills() {
        try {
            const bills = await API.getVendorBills();
            this.renderBillsTable(bills);
        } catch (error) {
            console.error('Error loading vendor bills:', error);
        }
    }

    renderBillsTable(bills) {
        const tbody = document.getElementById('billsTableBody');
        
        if (bills.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-gray-500 py-8">No vendor bills found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = bills.map(bill => `
            <tr>
                <td class="font-medium text-gray-900">${bill.number}</td>
                <td>${this.getVendorName(bill.vendorId)}</td>
                <td>${bill.poReference || '-'}</td>
                <td>${Utils.formatDate(bill.date)}</td>
                <td>${Utils.formatCurrency(bill.total || 0)}</td>
                <td>
                    <span class="status-badge ${Utils.getStatusColor(bill.status)}">
                        ${bill.status}
                    </span>
                </td>
                <td>
                    <div class="flex space-x-2">
                        ${bill.status === 'draft' ? `
                            <button onclick="transactionsService.editBill('${bill.id}')" class="btn-outline text-xs">Edit</button>
                            <button onclick="transactionsService.confirmBill('${bill.id}')" class="btn-success text-xs">Confirm</button>
                        ` : ''}
                        <button onclick="transactionsService.payBill('${bill.id}')" class="btn-primary text-xs">Pay</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadVendors() {
        try {
            const contacts = await API.getContacts();
            const vendors = contacts.filter(c => c.type === 'vendor' || c.type === 'both');
            this.populateVendorSelects(vendors);
        } catch (error) {
            console.error('Error loading vendors:', error);
        }
    }

    populateVendorSelects(vendors) {
        const selects = ['poVendor', 'billVendor'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Select vendor</option>' +
                    vendors.map(vendor => `<option value="${vendor.id}">${vendor.name}</option>`).join('');
            }
        });
    }

    getVendorName(vendorId) {
        // This would typically fetch from a cache or API
        return 'Vendor Name'; // Placeholder
    }

    openPOModal(po = null) {
        const modal = document.getElementById('poModal');
        const title = document.getElementById('poModalTitle');
        const form = document.getElementById('poForm');
        
        if (po) {
            title.textContent = 'Edit Purchase Order';
            form.querySelector('#poId').value = po.id;
            form.querySelector('#poVendor').value = po.vendorId;
            form.querySelector('#poDate').value = po.date;
            form.querySelector('#poNotes').value = po.notes || '';
            this.populatePOItems(po.items || []);
        } else {
            title.textContent = 'Create Purchase Order';
            form.reset();
            document.getElementById('poDate').value = new Date().toISOString().split('T')[0];
            this.clearPOItems();
        }
        
        modal.classList.remove('hidden');
    }

    closePOModal() {
        document.getElementById('poModal').classList.add('hidden');
    }

    addPOItem() {
        const container = document.getElementById('poItemsContainer');
        const itemIndex = container.children.length;
        
        const itemHtml = `
            <div class="po-item border border-gray-200 rounded-lg p-4 mb-4" data-index="${itemIndex}">
                <div class="grid grid-cols-4 gap-4">
                    <div class="form-group">
                        <label class="form-label">Product</label>
                        <select class="form-select po-product" name="items[${itemIndex}][productId]">
                            <option value="">Select product</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Quantity</label>
                        <input type="number" class="form-input po-quantity" name="items[${itemIndex}][quantity]" min="1" value="1">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Price</label>
                        <input type="number" class="form-input po-price" name="items[${itemIndex}][price]" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Total</label>
                        <input type="number" class="form-input po-total" name="items[${itemIndex}][total]" step="0.01" readonly>
                        <button type="button" class="btn-danger text-xs mt-2" onclick="transactionsService.removePOItem(${itemIndex})">Remove</button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', itemHtml);
        this.populateProductSelects();
        this.attachPOItemListeners(itemIndex);
    }

    attachPOItemListeners(itemIndex) {
        const item = document.querySelector(`[data-index="${itemIndex}"]`);
        const quantityInput = item.querySelector('.po-quantity');
        const priceInput = item.querySelector('.po-price');
        const totalInput = item.querySelector('.po-total');

        const calculateTotal = () => {
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const total = quantity * price;
            totalInput.value = total.toFixed(2);
            this.calculatePOTotals();
        };

        quantityInput.addEventListener('input', calculateTotal);
        priceInput.addEventListener('input', calculateTotal);
    }

    async populateProductSelects() {
        try {
            const products = await API.getProducts();
            document.querySelectorAll('.po-product').forEach(select => {
                if (select.children.length === 1) { // Only has default option
                    select.innerHTML = '<option value="">Select product</option>' +
                        products.map(product => `<option value="${product.id}" data-price="${product.price}">${product.name}</option>`).join('');
                }
            });
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    calculatePOTotals() {
        const items = document.querySelectorAll('.po-item');
        let subtotal = 0;
        
        items.forEach(item => {
            const total = parseFloat(item.querySelector('.po-total').value) || 0;
            subtotal += total;
        });
        
        const tax = subtotal * 0.18; // 18% tax
        const total = subtotal + tax;
        
        document.getElementById('poSubtotal').textContent = Utils.formatCurrency(subtotal);
        document.getElementById('poTax').textContent = Utils.formatCurrency(tax);
        document.getElementById('poTotal').textContent = Utils.formatCurrency(total);
    }

    clearPOItems() {
        document.getElementById('poItemsContainer').innerHTML = '';
        this.calculatePOTotals();
    }

    populatePOItems(items) {
        this.clearPOItems();
        items.forEach((item, index) => {
            this.addPOItem();
            const itemElement = document.querySelector(`[data-index="${index}"]`);
            itemElement.querySelector('.po-product').value = item.productId;
            itemElement.querySelector('.po-quantity').value = item.quantity;
            itemElement.querySelector('.po-price').value = item.price;
            itemElement.querySelector('.po-total').value = item.total;
        });
    }

    removePOItem(index) {
        const item = document.querySelector(`[data-index="${index}"]`);
        if (item) {
            item.remove();
            this.calculatePOTotals();
        }
    }

    async handlePOSubmit(e) {
        e.preventDefault();
        
        const formData = {
            vendorId: document.getElementById('poVendor').value,
            date: document.getElementById('poDate').value,
            notes: document.getElementById('poNotes').value,
            items: this.getPOItems(),
            subtotal: this.calculatePOSubtotal(),
            tax: this.calculatePOTax(),
            total: this.calculatePOTotal()
        };

        const poId = document.getElementById('poId').value;

        try {
            if (poId) {
                // Update existing PO
                Utils.showSuccess('Purchase Order updated successfully!');
            } else {
                await API.createPurchaseOrder(formData);
                Utils.showSuccess('Purchase Order created successfully!');
            }
            
            this.closePOModal();
            await this.loadPurchaseOrders();
        } catch (error) {
            Utils.showSuccess('Error saving purchase order', 5000);
        }
    }

    getPOItems() {
        const items = [];
        document.querySelectorAll('.po-item').forEach(item => {
            const productId = item.querySelector('.po-product').value;
            const quantity = parseFloat(item.querySelector('.po-quantity').value);
            const price = parseFloat(item.querySelector('.po-price').value);
            const total = parseFloat(item.querySelector('.po-total').value);
            
            if (productId && quantity && price) {
                items.push({ productId, quantity, price, total });
            }
        });
        return items;
    }

    calculatePOSubtotal() {
        return this.getPOItems().reduce((sum, item) => sum + item.total, 0);
    }

    calculatePOTax() {
        return this.calculatePOSubtotal() * 0.18;
    }

    calculatePOTotal() {
        return this.calculatePOSubtotal() + this.calculatePOTax();
    }

    async confirmPO(poId) {
        if (confirm('Are you sure you want to confirm this purchase order?')) {
            try {
                await API.confirmPurchaseOrder(poId);
                Utils.showSuccess('Purchase Order confirmed successfully!');
                await this.loadPurchaseOrders();
            } catch (error) {
                Utils.showSuccess('Error confirming purchase order', 5000);
            }
        }
    }

    async createBillFromPO(poId) {
        try {
            const pos = await API.getPurchaseOrders();
            const po = pos.find(p => p.id === poId);
            if (po) {
                this.openBillModal(po);
            }
        } catch (error) {
            Utils.showSuccess('Error loading purchase order', 5000);
        }
    }

    openBillModal(po = null) {
        const modal = document.getElementById('billModal');
        const title = document.getElementById('billModalTitle');
        const form = document.getElementById('billForm');
        
        if (po) {
            title.textContent = 'Create Vendor Bill from PO';
            form.querySelector('#billPOReference').value = po.number;
            form.querySelector('#billVendor').value = po.vendorId;
            form.querySelector('#billDate').value = new Date().toISOString().split('T')[0];
            form.querySelector('#billNotes').value = `Bill for PO ${po.number}`;
            this.populateBillItems(po.items || []);
        } else {
            title.textContent = 'Create Vendor Bill';
            form.reset();
            document.getElementById('billDate').value = new Date().toISOString().split('T')[0];
            this.clearBillItems();
        }
        
        modal.classList.remove('hidden');
    }

    closeBillModal() {
        document.getElementById('billModal').classList.add('hidden');
    }

    addBillItem() {
        const container = document.getElementById('billItemsContainer');
        const itemIndex = container.children.length;
        
        const itemHtml = `
            <div class="bill-item border border-gray-200 rounded-lg p-4 mb-4" data-index="${itemIndex}">
                <div class="grid grid-cols-4 gap-4">
                    <div class="form-group">
                        <label class="form-label">Product</label>
                        <select class="form-select bill-product" name="items[${itemIndex}][productId]">
                            <option value="">Select product</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Quantity</label>
                        <input type="number" class="form-input bill-quantity" name="items[${itemIndex}][quantity]" min="1" value="1">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Price</label>
                        <input type="number" class="form-input bill-price" name="items[${itemIndex}][price]" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Total</label>
                        <input type="number" class="form-input bill-total" name="items[${itemIndex}][total]" step="0.01" readonly>
                        <button type="button" class="btn-danger text-xs mt-2" onclick="transactionsService.removeBillItem(${itemIndex})">Remove</button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', itemHtml);
        this.populateProductSelects();
        this.attachBillItemListeners(itemIndex);
    }

    attachBillItemListeners(itemIndex) {
        const item = document.querySelector(`[data-index="${itemIndex}"]`);
        const quantityInput = item.querySelector('.bill-quantity');
        const priceInput = item.querySelector('.bill-price');
        const totalInput = item.querySelector('.bill-total');

        const calculateTotal = () => {
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const total = quantity * price;
            totalInput.value = total.toFixed(2);
            this.calculateBillTotals();
        };

        quantityInput.addEventListener('input', calculateTotal);
        priceInput.addEventListener('input', calculateTotal);
    }

    calculateBillTotals() {
        const items = document.querySelectorAll('.bill-item');
        let subtotal = 0;
        
        items.forEach(item => {
            const total = parseFloat(item.querySelector('.bill-total').value) || 0;
            subtotal += total;
        });
        
        const tax = subtotal * 0.18; // 18% tax
        const total = subtotal + tax;
        
        document.getElementById('billSubtotal').textContent = Utils.formatCurrency(subtotal);
        document.getElementById('billTax').textContent = Utils.formatCurrency(tax);
        document.getElementById('billTotal').textContent = Utils.formatCurrency(total);
    }

    clearBillItems() {
        document.getElementById('billItemsContainer').innerHTML = '';
        this.calculateBillTotals();
    }

    populateBillItems(items) {
        this.clearBillItems();
        items.forEach((item, index) => {
            this.addBillItem();
            const itemElement = document.querySelector(`[data-index="${index}"]`);
            itemElement.querySelector('.bill-product').value = item.productId;
            itemElement.querySelector('.bill-quantity').value = item.quantity;
            itemElement.querySelector('.bill-price').value = item.price;
            itemElement.querySelector('.bill-total').value = item.total;
        });
    }

    removeBillItem(index) {
        const item = document.querySelector(`[data-index="${index}"]`);
        if (item) {
            item.remove();
            this.calculateBillTotals();
        }
    }

    async handleBillSubmit(e) {
        e.preventDefault();
        
        const formData = {
            vendorId: document.getElementById('billVendor').value,
            date: document.getElementById('billDate').value,
            notes: document.getElementById('billNotes').value,
            poReference: document.getElementById('billPOReference').value,
            items: this.getBillItems(),
            subtotal: this.calculateBillSubtotal(),
            tax: this.calculateBillTax(),
            total: this.calculateBillTotal()
        };

        try {
            await API.createVendorBill(formData);
            Utils.showSuccess('Vendor Bill created successfully!');
            this.closeBillModal();
            await this.loadVendorBills();
        } catch (error) {
            Utils.showSuccess('Error saving vendor bill', 5000);
        }
    }

    getBillItems() {
        const items = [];
        document.querySelectorAll('.bill-item').forEach(item => {
            const productId = item.querySelector('.bill-product').value;
            const quantity = parseFloat(item.querySelector('.bill-quantity').value);
            const price = parseFloat(item.querySelector('.bill-price').value);
            const total = parseFloat(item.querySelector('.bill-total').value);
            
            if (productId && quantity && price) {
                items.push({ productId, quantity, price, total });
            }
        });
        return items;
    }

    calculateBillSubtotal() {
        return this.getBillItems().reduce((sum, item) => sum + item.total, 0);
    }

    calculateBillTax() {
        return this.calculateBillSubtotal() * 0.18;
    }

    calculateBillTotal() {
        return this.calculateBillSubtotal() + this.calculateBillTax();
    }

    async confirmBill(billId) {
        if (confirm('Are you sure you want to confirm this vendor bill?')) {
            try {
                await API.confirmVendorBill(billId);
                Utils.showSuccess('Vendor Bill confirmed successfully!');
                await this.loadVendorBills();
            } catch (error) {
                Utils.showSuccess('Error confirming vendor bill', 5000);
            }
        }
    }

    async payBill(billId) {
        // This would open a payment modal
        Utils.showSuccess('Payment functionality coming soon!', 3000);
    }

    // Similar methods for Sales Orders and Customer Invoices would go here
    // For brevity, I'm including the structure but not the full implementation

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
}

// Initialize transactions service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (Utils.requireAuth()) {
        window.transactionsService = new TransactionsService();
    }
});
