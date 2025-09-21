// Customer Portal module for Cloud Accounting app

class CustomerPortalService {
    constructor() {
        this.customerId = this.getCustomerId();
        this.initializeEventListeners();
        this.loadCustomerData();
    }

    getCustomerId() {
        // In a real app, this would come from authentication
        // For demo purposes, we'll use a hardcoded customer ID
        return 'customer-1';
    }

    initializeEventListeners() {
        // Payment modal
        document.getElementById('closePaymentModal').addEventListener('click', () => {
            this.closePaymentModal();
        });

        document.getElementById('closeSuccessModal').addEventListener('click', () => {
            this.closeSuccessModal();
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

    async loadCustomerData() {
        try {
            const invoices = await this.getCustomerInvoices();
            this.renderInvoicesTable(invoices);
            this.updateSummaryCards(invoices);
        } catch (error) {
            console.error('Error loading customer data:', error);
        }
    }

    async getCustomerInvoices() {
        // In a real app, this would be an API call
        // For demo purposes, we'll return mock data
        return [
            {
                id: 'inv-1',
                number: 'INV-001',
                date: '2024-01-15',
                dueDate: '2024-02-15',
                amount: 1500.00,
                status: 'outstanding',
                description: 'Web Development Services'
            },
            {
                id: 'inv-2',
                number: 'INV-002',
                date: '2024-01-20',
                dueDate: '2024-02-20',
                amount: 2500.00,
                status: 'paid',
                description: 'Mobile App Development'
            },
            {
                id: 'inv-3',
                number: 'INV-003',
                date: '2024-01-25',
                dueDate: '2024-02-25',
                amount: 800.00,
                status: 'outstanding',
                description: 'Consulting Services'
            }
        ];
    }

    renderInvoicesTable(invoices) {
        const tbody = document.getElementById('invoicesTableBody');
        
        if (invoices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-gray-500 py-8">No invoices found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = invoices.map(invoice => `
            <tr>
                <td class="font-medium text-gray-900">${invoice.number}</td>
                <td>${Utils.formatDate(invoice.date)}</td>
                <td>${Utils.formatDate(invoice.dueDate)}</td>
                <td>${Utils.formatCurrency(invoice.amount)}</td>
                <td>
                    <span class="status-badge ${invoice.status === 'paid' ? 'status-confirmed' : 'status-draft'}">
                        ${invoice.status}
                    </span>
                </td>
                <td>
                    ${invoice.status === 'outstanding' ? `
                        <button onclick="customerPortalService.payInvoice('${invoice.id}')" class="btn-primary text-xs">
                            Pay Now
                        </button>
                    ` : `
                        <span class="text-green-600 text-sm">Paid</span>
                    `}
                </td>
            </tr>
        `).join('');
    }

    updateSummaryCards(invoices) {
        const totalInvoices = invoices.length;
        const paidInvoices = invoices.filter(inv => inv.status === 'paid');
        const outstandingInvoices = invoices.filter(inv => inv.status === 'outstanding');
        
        const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

        document.getElementById('totalInvoices').textContent = totalInvoices;
        document.getElementById('paidAmount').textContent = Utils.formatCurrency(paidAmount);
        document.getElementById('outstandingAmount').textContent = Utils.formatCurrency(outstandingAmount);
    }

    async payInvoice(invoiceId) {
        try {
            const invoices = await this.getCustomerInvoices();
            const invoice = invoices.find(inv => inv.id === invoiceId);
            
            if (!invoice) {
                Utils.showSuccess('Invoice not found', 3000);
                return;
            }

            if (invoice.status === 'paid') {
                Utils.showSuccess('Invoice already paid', 3000);
                return;
            }

            this.openPaymentModal(invoice);
        } catch (error) {
            Utils.showSuccess('Error loading invoice', 5000);
        }
    }

    openPaymentModal(invoice) {
        const modal = document.getElementById('paymentModal');
        const content = document.getElementById('paymentContent');
        
        content.innerHTML = `
            <div class="space-y-6">
                <div class="text-center">
                    <h4 class="text-lg font-semibold text-gray-900">Payment for ${invoice.number}</h4>
                    <p class="text-gray-600">${invoice.description}</p>
                    <div class="text-2xl font-bold text-gray-900 mt-2">${Utils.formatCurrency(invoice.amount)}</div>
                </div>

                <div class="bg-gray-50 rounded-lg p-4">
                    <h5 class="font-medium text-gray-900 mb-2">Invoice Details</h5>
                    <div class="space-y-1 text-sm text-gray-600">
                        <div class="flex justify-between">
                            <span>Invoice Date:</span>
                            <span>${Utils.formatDate(invoice.date)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Due Date:</span>
                            <span>${Utils.formatDate(invoice.dueDate)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Amount:</span>
                            <span class="font-medium">${Utils.formatCurrency(invoice.amount)}</span>
                        </div>
                    </div>
                </div>

                <div class="text-center">
                    <button id="proceedToPayment" class="btn-primary w-full">
                        Proceed to Payment
                    </button>
                </div>
            </div>
        `;

        // Add event listener for payment button
        document.getElementById('proceedToPayment').addEventListener('click', () => {
            this.initiatePayment(invoice);
        });
        
        modal.classList.remove('hidden');
    }

    async initiatePayment(invoice) {
        try {
            // Simulate Razorpay checkout
            const options = {
                amount: Math.round(invoice.amount * 100), // Convert to paise
                currency: 'INR',
                name: 'Cloud Accounting',
                description: `Payment for ${invoice.number}`,
                order_id: 'order_' + Math.random().toString(36).substr(2, 9),
                handler: (response) => {
                    this.handlePaymentSuccess(invoice, response);
                }
            };

            await window.Razorpay.openCheckout(options);
        } catch (error) {
            if (error.message !== 'Payment cancelled by user') {
                Utils.showSuccess('Payment failed. Please try again.', 5000);
            }
        }
    }

    async handlePaymentSuccess(invoice, response) {
        try {
            // In a real app, this would send the payment details to your backend
            console.log('Payment successful:', response);
            
            // Update invoice status locally
            await this.updateInvoiceStatus(invoice.id, 'paid');
            
            Utils.showSuccess('Payment successful!', 3000);
            
            // Reload data
            await this.loadCustomerData();
            
        } catch (error) {
            Utils.showSuccess('Error processing payment', 5000);
        }
    }

    async updateInvoiceStatus(invoiceId, status) {
        // In a real app, this would be an API call
        // For demo purposes, we'll just show a success message
        console.log(`Invoice ${invoiceId} status updated to ${status}`);
    }

    closePaymentModal() {
        document.getElementById('paymentModal').classList.add('hidden');
    }

    closeSuccessModal() {
        document.getElementById('paymentSuccessModal').classList.add('hidden');
    }

    closeAllModals() {
        this.closePaymentModal();
        this.closeSuccessModal();
    }
}

// Initialize customer portal service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.customerPortalService = new CustomerPortalService();
});
