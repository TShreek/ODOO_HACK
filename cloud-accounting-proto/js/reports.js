// Reports module for Cloud Accounting app

class ReportsService {
    constructor() {
        this.currentTab = 'partner-ledger';
        this.initializeEventListeners();
        this.loadInitialData();
    }

    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.report-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Partner Ledger
        document.getElementById('generatePartnerLedger').addEventListener('click', () => {
            this.generatePartnerLedger();
        });

        // Profit & Loss
        document.getElementById('generatePL').addEventListener('click', () => {
            this.generateProfitLoss();
        });

        // Balance Sheet
        document.getElementById('generateBS').addEventListener('click', () => {
            this.generateBalanceSheet();
        });

        // Set default date for balance sheet
        document.getElementById('bsDate').value = new Date().toISOString().split('T')[0];
    }

    async loadInitialData() {
        await this.loadPartners();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.report-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.report-tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');

        this.currentTab = tabName;
    }

    async loadPartners() {
        try {
            const contacts = await API.getContacts();
            const partners = contacts.filter(c => c.type === 'customer' || c.type === 'vendor' || c.type === 'both');
            
            const select = document.getElementById('partnerSelect');
            select.innerHTML = '<option value="">Select Partner</option>' +
                partners.map(partner => `<option value="${partner.id}">${partner.name}</option>`).join('');
        } catch (error) {
            console.error('Error loading partners:', error);
        }
    }

    async generatePartnerLedger() {
        const partnerId = document.getElementById('partnerSelect').value;
        if (!partnerId) {
            Utils.showSuccess('Please select a partner', 3000);
            return;
        }

        try {
            const data = await API.getPartnerLedger(partnerId);
            this.renderPartnerLedger(data);
        } catch (error) {
            console.error('Error generating partner ledger:', error);
            Utils.showSuccess('Error generating partner ledger', 5000);
        }
    }

    renderPartnerLedger(data) {
        const container = document.getElementById('partnerLedgerContent');
        const { partner, invoices, bills, payments } = data;

        let totalDebit = 0;
        let totalCredit = 0;

        // Calculate totals
        invoices.forEach(invoice => {
            if (invoice.status === 'confirmed') {
                totalDebit += invoice.total || 0;
            }
        });

        bills.forEach(bill => {
            if (bill.status === 'confirmed') {
                totalCredit += bill.total || 0;
            }
        });

        payments.forEach(payment => {
            if (payment.type === 'receipt') {
                totalCredit += payment.amount || 0;
            } else if (payment.type === 'payment') {
                totalDebit += payment.amount || 0;
            }
        });

        const balance = totalDebit - totalCredit;

        container.innerHTML = `
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-900">${partner.name}</h4>
                <p class="text-gray-600">${partner.email}</p>
            </div>

            <div class="grid grid-cols-3 gap-6 mb-6">
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">${Utils.formatCurrency(totalDebit)}</div>
                    <div class="text-sm text-gray-600">Total Debit</div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">${Utils.formatCurrency(totalCredit)}</div>
                    <div class="text-sm text-gray-600">Total Credit</div>
                </div>
                <div class="text-center p-4 ${balance >= 0 ? 'bg-purple-50' : 'bg-red-50'} rounded-lg">
                    <div class="text-2xl font-bold ${balance >= 0 ? 'text-purple-600' : 'text-red-600'}">${Utils.formatCurrency(Math.abs(balance))}</div>
                    <div class="text-sm text-gray-600">${balance >= 0 ? 'Outstanding' : 'Overpaid'}</div>
                </div>
            </div>

            <div class="space-y-4">
                <h5 class="font-semibold text-gray-900">Transaction History</h5>
                
                ${this.renderTransactionHistory(invoices, bills, payments)}
            </div>
        `;
    }

    renderTransactionHistory(invoices, bills, payments) {
        const allTransactions = [];

        // Add invoices
        invoices.forEach(invoice => {
            if (invoice.status === 'confirmed') {
                allTransactions.push({
                    date: invoice.date,
                    description: `Invoice ${invoice.number}`,
                    debit: invoice.total,
                    credit: 0,
                    type: 'invoice'
                });
            }
        });

        // Add bills
        bills.forEach(bill => {
            if (bill.status === 'confirmed') {
                allTransactions.push({
                    date: bill.date,
                    description: `Bill ${bill.number}`,
                    debit: 0,
                    credit: bill.total,
                    type: 'bill'
                });
            }
        });

        // Add payments
        payments.forEach(payment => {
            allTransactions.push({
                date: payment.date,
                description: `Payment ${payment.number}`,
                debit: payment.type === 'payment' ? payment.amount : 0,
                credit: payment.type === 'receipt' ? payment.amount : 0,
                type: 'payment'
            });
        });

        // Sort by date
        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (allTransactions.length === 0) {
            return '<p class="text-gray-500 text-center py-4">No transactions found</p>';
        }

        return `
            <div class="overflow-x-auto">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            <th>Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allTransactions.map(transaction => `
                            <tr>
                                <td>${Utils.formatDate(transaction.date)}</td>
                                <td>${transaction.description}</td>
                                <td>${transaction.debit > 0 ? Utils.formatCurrency(transaction.debit) : '-'}</td>
                                <td>${transaction.credit > 0 ? Utils.formatCurrency(transaction.credit) : '-'}</td>
                                <td>
                                    <span class="status-badge ${transaction.type === 'invoice' ? 'status-confirmed' : transaction.type === 'bill' ? 'status-draft' : 'status-cancelled'}">
                                        ${transaction.type}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async generateProfitLoss() {
        try {
            const data = await API.getProfitLoss();
            this.renderProfitLoss(data);
        } catch (error) {
            console.error('Error generating profit & loss:', error);
            Utils.showSuccess('Error generating profit & loss report', 5000);
        }
    }

    renderProfitLoss(data) {
        const container = document.getElementById('profitLossContent');
        const { income, expenses, netProfit } = data;

        container.innerHTML = `
            <div class="space-y-6">
                <div class="text-center">
                    <h4 class="text-xl font-bold text-gray-900 mb-2">Profit & Loss Statement</h4>
                    <p class="text-gray-600">For the selected period</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="text-center p-6 bg-green-50 rounded-lg">
                        <div class="text-3xl font-bold text-green-600 mb-2">${Utils.formatCurrency(income)}</div>
                        <div class="text-sm text-gray-600">Total Income</div>
                    </div>
                    <div class="text-center p-6 bg-red-50 rounded-lg">
                        <div class="text-3xl font-bold text-red-600 mb-2">${Utils.formatCurrency(expenses)}</div>
                        <div class="text-sm text-gray-600">Total Expenses</div>
                    </div>
                    <div class="text-center p-6 ${netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-lg">
                        <div class="text-3xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'} mb-2">${Utils.formatCurrency(netProfit)}</div>
                        <div class="text-sm text-gray-600">Net ${netProfit >= 0 ? 'Profit' : 'Loss'}</div>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-lg p-6">
                    <h5 class="font-semibold text-gray-900 mb-4">Summary</h5>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Gross Income:</span>
                            <span class="font-medium">${Utils.formatCurrency(income)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Total Expenses:</span>
                            <span class="font-medium">${Utils.formatCurrency(expenses)}</span>
                        </div>
                        <div class="flex justify-between border-t border-gray-200 pt-2">
                            <span class="font-semibold text-gray-900">Net ${netProfit >= 0 ? 'Profit' : 'Loss'}:</span>
                            <span class="font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}">${Utils.formatCurrency(netProfit)}</span>
                        </div>
                    </div>
                </div>

                <div class="text-center">
                    <p class="text-sm text-gray-500">
                        Profit Margin: ${income > 0 ? ((netProfit / income) * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>
        `;
    }

    async generateBalanceSheet() {
        try {
            const data = await API.getBalanceSheet();
            this.renderBalanceSheet(data);
        } catch (error) {
            console.error('Error generating balance sheet:', error);
            Utils.showSuccess('Error generating balance sheet', 5000);
        }
    }

    renderBalanceSheet(data) {
        const container = document.getElementById('balanceSheetContent');
        const { assets, liabilities, equity } = data;

        const totalAssets = assets.cash + assets.bank + assets.accountsReceivable;
        const totalLiabilities = liabilities.accountsPayable;
        const totalEquity = equity.retainedEarnings;
        const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

        container.innerHTML = `
            <div class="space-y-6">
                <div class="text-center">
                    <h4 class="text-xl font-bold text-gray-900 mb-2">Balance Sheet</h4>
                    <p class="text-gray-600">As of ${Utils.formatDate(document.getElementById('bsDate').value)}</p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Assets -->
                    <div class="bg-green-50 rounded-lg p-6">
                        <h5 class="text-lg font-semibold text-gray-900 mb-4">Assets</h5>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Cash:</span>
                                <span class="font-medium">${Utils.formatCurrency(assets.cash)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Bank:</span>
                                <span class="font-medium">${Utils.formatCurrency(assets.bank)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Accounts Receivable:</span>
                                <span class="font-medium">${Utils.formatCurrency(assets.accountsReceivable)}</span>
                            </div>
                            <div class="flex justify-between border-t border-gray-200 pt-2">
                                <span class="font-semibold text-gray-900">Total Assets:</span>
                                <span class="font-bold text-green-600">${Utils.formatCurrency(totalAssets)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Liabilities & Equity -->
                    <div class="bg-blue-50 rounded-lg p-6">
                        <h5 class="text-lg font-semibold text-gray-900 mb-4">Liabilities & Equity</h5>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Accounts Payable:</span>
                                <span class="font-medium">${Utils.formatCurrency(liabilities.accountsPayable)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Retained Earnings:</span>
                                <span class="font-medium">${Utils.formatCurrency(equity.retainedEarnings)}</span>
                            </div>
                            <div class="flex justify-between border-t border-gray-200 pt-2">
                                <span class="font-semibold text-gray-900">Total Liabilities & Equity:</span>
                                <span class="font-bold text-blue-600">${Utils.formatCurrency(totalLiabilitiesAndEquity)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="text-center">
                    <div class="inline-flex items-center space-x-2 ${totalAssets === totalLiabilitiesAndEquity ? 'text-green-600' : 'text-red-600'}">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="font-medium">
                            ${totalAssets === totalLiabilitiesAndEquity ? 'Balance Sheet is Balanced' : 'Balance Sheet is NOT Balanced'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize reports service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (Utils.requireAuth()) {
        new ReportsService();
    }
});
