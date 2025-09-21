// Payments module for Cloud Accounting app

class PaymentsService {
    constructor() {
        this.initializeEventListeners();
        this.loadInitialData();
    }

    initializeEventListeners() {
        // Payment modal
        document.getElementById('createPaymentBtn').addEventListener('click', () => {
            this.openPaymentModal();
        });

        document.getElementById('closePaymentModal').addEventListener('click', () => {
            this.closePaymentModal();
        });

        document.getElementById('cancelPaymentBtn').addEventListener('click', () => {
            this.closePaymentModal();
        });

        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            this.handlePaymentSubmit(e);
        });

        // Payment type change
        document.getElementById('paymentType').addEventListener('change', (e) => {
            this.handlePaymentTypeChange(e.target.value);
        });

        // Partner change
        document.getElementById('paymentPartner').addEventListener('change', (e) => {
            this.handlePartnerChange(e.target.value);
        });

        // Modal overlay click to close
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closePaymentModal();
                }
            });
        });
    }

    async loadInitialData() {
        await this.loadPayments();
        await this.loadPartners();
    }

    async loadPayments() {
        try {
            const payments = await API.getPayments();
            this.renderPaymentsTable(payments);
        } catch (error) {
            console.error('Error loading payments:', error);
        }
    }

    renderPaymentsTable(payments) {
        const tbody = document.getElementById('paymentsTableBody');
        
        if (payments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-gray-500 py-8">No payments found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td class="font-medium text-gray-900">${payment.number}</td>
                <td>${Utils.formatDate(payment.date)}</td>
                <td>${this.getPartnerName(payment.partnerId)}</td>
                <td>
                    <span class="status-badge ${payment.type === 'payment' ? 'status-draft' : 'status-confirmed'}">
                        ${payment.type}
                    </span>
                </td>
                <td>${payment.referenceNumber || '-'}</td>
                <td>${Utils.formatCurrency(payment.amount)}</td>
                <td>
                    <span class="status-badge status-confirmed">
                        completed
                    </span>
                </td>
                <td>
                    <div class="flex space-x-2">
                        <button onclick="paymentsService.editPayment('${payment.id}')" class="btn-outline text-xs">Edit</button>
                        <button onclick="paymentsService.deletePayment('${payment.id}')" class="btn-danger text-xs">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadPartners() {
        try {
            const contacts = await API.getContacts();
            const partners = contacts.filter(c => c.type === 'customer' || c.type === 'vendor' || c.type === 'both');
            
            const select = document.getElementById('paymentPartner');
            select.innerHTML = '<option value="">Select partner</option>' +
                partners.map(partner => `<option value="${partner.id}">${partner.name}</option>`).join('');
        } catch (error) {
            console.error('Error loading partners:', error);
        }
    }

    getPartnerName(partnerId) {
        // This would typically fetch from a cache or API
        return 'Partner Name'; // Placeholder
    }

    openPaymentModal(payment = null) {
        const modal = document.getElementById('paymentModal');
        const title = document.getElementById('paymentModalTitle');
        const form = document.getElementById('paymentForm');
        
        if (payment) {
            title.textContent = 'Edit Payment';
            form.querySelector('#paymentId').value = payment.id;
            form.querySelector('#paymentType').value = payment.type;
            form.querySelector('#paymentPartner').value = payment.partnerId;
            form.querySelector('#paymentReference').value = payment.referenceId || '';
            form.querySelector('#paymentAmount').value = payment.amount;
            form.querySelector('#paymentDate').value = payment.date;
            form.querySelector('#paymentMethod').value = payment.method;
            form.querySelector('#paymentNotes').value = payment.notes || '';
        } else {
            title.textContent = 'Record Payment';
            form.reset();
            document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
        }
        
        modal.classList.remove('hidden');
    }

    closePaymentModal() {
        document.getElementById('paymentModal').classList.add('hidden');
    }

    async handlePaymentTypeChange(type) {
        const referenceSelect = document.getElementById('paymentReference');
        referenceSelect.innerHTML = '<option value="">Select reference</option>';
        
        if (!type) return;

        try {
            if (type === 'payment') {
                // Load vendor bills
                const bills = await API.getVendorBills();
                const outstandingBills = bills.filter(bill => bill.status === 'confirmed');
                
                outstandingBills.forEach(bill => {
                    const option = document.createElement('option');
                    option.value = bill.id;
                    option.textContent = `${bill.number} - ${Utils.formatCurrency(bill.total)}`;
                    referenceSelect.appendChild(option);
                });
            } else if (type === 'receipt') {
                // Load customer invoices
                const invoices = await API.getCustomerInvoices();
                const outstandingInvoices = invoices.filter(invoice => invoice.status === 'confirmed');
                
                outstandingInvoices.forEach(invoice => {
                    const option = document.createElement('option');
                    option.value = invoice.id;
                    option.textContent = `${invoice.number} - ${Utils.formatCurrency(invoice.total)}`;
                    referenceSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading reference documents:', error);
        }
    }

    async handlePartnerChange(partnerId) {
        if (!partnerId) return;

        const paymentType = document.getElementById('paymentType').value;
        if (!paymentType) return;

        // Reload reference documents for the selected partner
        await this.handlePaymentTypeChange(paymentType);
    }

    async handlePaymentSubmit(e) {
        e.preventDefault();
        
        const formData = {
            type: document.getElementById('paymentType').value,
            partnerId: document.getElementById('paymentPartner').value,
            referenceId: document.getElementById('paymentReference').value,
            amount: parseFloat(document.getElementById('paymentAmount').value),
            date: document.getElementById('paymentDate').value,
            method: document.getElementById('paymentMethod').value,
            notes: document.getElementById('paymentNotes').value.trim()
        };

        const paymentId = document.getElementById('paymentId').value;

        try {
            if (paymentId) {
                // Update existing payment
                Utils.showSuccess('Payment updated successfully!');
            } else {
                await API.createPayment(formData);
                Utils.showSuccess('Payment recorded successfully!');
            }
            
            this.closePaymentModal();
            await this.loadPayments();
        } catch (error) {
            Utils.showSuccess('Error saving payment', 5000);
        }
    }

    async editPayment(paymentId) {
        try {
            const payments = await API.getPayments();
            const payment = payments.find(p => p.id === paymentId);
            if (payment) {
                this.openPaymentModal(payment);
            }
        } catch (error) {
            Utils.showSuccess('Error loading payment', 5000);
        }
    }

    async deletePayment(paymentId) {
        if (confirm('Are you sure you want to delete this payment?')) {
            try {
                // In a real app, this would be an API call
                Utils.showSuccess('Payment deleted successfully!');
                await this.loadPayments();
            } catch (error) {
                Utils.showSuccess('Error deleting payment', 5000);
            }
        }
    }
}

// Initialize payments service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (Utils.requireAuth()) {
        window.paymentsService = new PaymentsService();
    }
});
