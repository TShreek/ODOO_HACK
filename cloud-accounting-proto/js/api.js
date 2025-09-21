// API simulation for Cloud Accounting app
// This simulates backend API calls using localStorage for data persistence

class APIService {
    constructor() {
        this.initializeStorage();
    }

    // Initialize localStorage with default data
    initializeStorage() {
        if (!localStorage.getItem('accounting_data')) {
            const defaultData = {
                users: [],
                contacts: [],
                products: [],
                taxes: [
                    { id: 'tax-1', name: 'GST 18%', rate: 18, type: 'percentage' },
                    { id: 'tax-2', name: 'GST 5%', rate: 5, type: 'percentage' },
                    { id: 'tax-3', name: 'GST 12%', rate: 12, type: 'percentage' }
                ],
                accounts: [
                    { id: 'acc-1', name: 'Cash', type: 'asset', code: '1000' },
                    { id: 'acc-2', name: 'Bank', type: 'asset', code: '1100' },
                    { id: 'acc-3', name: 'Accounts Receivable', type: 'asset', code: '1200' },
                    { id: 'acc-4', name: 'Accounts Payable', type: 'liability', code: '2000' },
                    { id: 'acc-5', name: 'Sales Income', type: 'income', code: '4000' },
                    { id: 'acc-6', name: 'Purchase Expense', type: 'expense', code: '5000' }
                ],
                purchaseOrders: [],
                vendorBills: [],
                salesOrders: [],
                customerInvoices: [],
                payments: [],
                journals: [],
                activity: []
            };
            localStorage.setItem('accounting_data', JSON.stringify(defaultData));
        }
    }

    // Get all data
    getData() {
        return JSON.parse(localStorage.getItem('accounting_data'));
    }

    // Save data
    saveData(data) {
        localStorage.setItem('accounting_data', JSON.stringify(data));
    }

    // Add activity log
    addActivity(type, description, amount = 0) {
        const data = this.getData();
        const activity = {
            id: Utils.generateId(),
            type,
            description,
            amount,
            timestamp: new Date().toISOString()
        };
        data.activity.unshift(activity);
        this.saveData(data);
        return activity;
    }

    // Authentication APIs
    async login(email, password) {
        const data = this.getData();
        const user = data.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            Utils.setCurrentUser(user);
            this.addActivity('login', `User ${user.email} logged in`);
            return { success: true, user };
        }
        
        return { success: false, error: 'Invalid email or password' };
    }

    async signup(userData) {
        const data = this.getData();
        
        // Check if user already exists
        if (data.users.find(u => u.email === userData.email)) {
            return { success: false, error: 'User already exists' };
        }

        const user = {
            id: Utils.generateId(),
            ...userData,
            createdAt: new Date().toISOString()
        };

        data.users.push(user);
        this.saveData(data);
        Utils.setCurrentUser(user);
        this.addActivity('signup', `New user ${user.email} registered`);
        
        return { success: true, user };
    }

    // Contacts APIs
    async getContacts() {
        const data = this.getData();
        return data.contacts;
    }

    async createContact(contactData) {
        const data = this.getData();
        const contact = {
            id: Utils.generateId(),
            ...contactData,
            createdAt: new Date().toISOString()
        };
        
        data.contacts.push(contact);
        this.saveData(data);
        this.addActivity('contact_created', `Contact ${contact.name} created`);
        return contact;
    }

    async updateContact(id, contactData) {
        const data = this.getData();
        const index = data.contacts.findIndex(c => c.id === id);
        
        if (index !== -1) {
            data.contacts[index] = { ...data.contacts[index], ...contactData };
            this.saveData(data);
            this.addActivity('contact_updated', `Contact ${data.contacts[index].name} updated`);
            return data.contacts[index];
        }
        
        throw new Error('Contact not found');
    }

    async deleteContact(id) {
        const data = this.getData();
        const index = data.contacts.findIndex(c => c.id === id);
        
        if (index !== -1) {
            const contact = data.contacts[index];
            data.contacts.splice(index, 1);
            this.saveData(data);
            this.addActivity('contact_deleted', `Contact ${contact.name} deleted`);
            return true;
        }
        
        throw new Error('Contact not found');
    }

    // Products APIs
    async getProducts() {
        const data = this.getData();
        return data.products;
    }

    async createProduct(productData) {
        const data = this.getData();
        const product = {
            id: Utils.generateId(),
            hsnCode: Utils.generateHSNCode(),
            ...productData,
            createdAt: new Date().toISOString()
        };
        
        data.products.push(product);
        this.saveData(data);
        this.addActivity('product_created', `Product ${product.name} created`);
        return product;
    }

    async updateProduct(id, productData) {
        const data = this.getData();
        const index = data.products.findIndex(p => p.id === id);
        
        if (index !== -1) {
            data.products[index] = { ...data.products[index], ...productData };
            this.saveData(data);
            this.addActivity('product_updated', `Product ${data.products[index].name} updated`);
            return data.products[index];
        }
        
        throw new Error('Product not found');
    }

    // Purchase Orders APIs
    async getPurchaseOrders() {
        const data = this.getData();
        return data.purchaseOrders;
    }

    async createPurchaseOrder(poData) {
        const data = this.getData();
        const po = {
            id: Utils.generateId(),
            number: Utils.generateDocumentNumber('PO'),
            status: 'draft',
            ...poData,
            createdAt: new Date().toISOString()
        };
        
        data.purchaseOrders.push(po);
        this.saveData(data);
        this.addActivity('po_created', `Purchase Order ${po.number} created`);
        return po;
    }

    async confirmPurchaseOrder(id) {
        const data = this.getData();
        const index = data.purchaseOrders.findIndex(po => po.id === id);
        
        if (index !== -1) {
            data.purchaseOrders[index].status = 'confirmed';
            data.purchaseOrders[index].confirmedAt = new Date().toISOString();
            this.saveData(data);
            this.addActivity('po_confirmed', `Purchase Order ${data.purchaseOrders[index].number} confirmed`);
            return data.purchaseOrders[index];
        }
        
        throw new Error('Purchase Order not found');
    }

    // Vendor Bills APIs
    async getVendorBills() {
        const data = this.getData();
        return data.vendorBills;
    }

    async createVendorBill(billData) {
        const data = this.getData();
        const bill = {
            id: Utils.generateId(),
            number: Utils.generateDocumentNumber('BILL'),
            status: 'draft',
            ...billData,
            createdAt: new Date().toISOString()
        };
        
        data.vendorBills.push(bill);
        this.saveData(data);
        this.addActivity('bill_created', `Vendor Bill ${bill.number} created`);
        return bill;
    }

    async confirmVendorBill(id) {
        const data = this.getData();
        const index = data.vendorBills.findIndex(bill => bill.id === id);
        
        if (index !== -1) {
            data.vendorBills[index].status = 'confirmed';
            data.vendorBills[index].confirmedAt = new Date().toISOString();
            
            // Create journal entry
            this.createJournalEntry('purchase', data.vendorBills[index]);
            
            this.saveData(data);
            this.addActivity('bill_confirmed', `Vendor Bill ${data.vendorBills[index].number} confirmed`);
            return data.vendorBills[index];
        }
        
        throw new Error('Vendor Bill not found');
    }

    // Sales Orders APIs
    async getSalesOrders() {
        const data = this.getData();
        return data.salesOrders;
    }

    async createSalesOrder(soData) {
        const data = this.getData();
        const so = {
            id: Utils.generateId(),
            number: Utils.generateDocumentNumber('SO'),
            status: 'draft',
            ...soData,
            createdAt: new Date().toISOString()
        };
        
        data.salesOrders.push(so);
        this.saveData(data);
        this.addActivity('so_created', `Sales Order ${so.number} created`);
        return so;
    }

    // Customer Invoices APIs
    async getCustomerInvoices() {
        const data = this.getData();
        return data.customerInvoices;
    }

    async createCustomerInvoice(invoiceData) {
        const data = this.getData();
        const invoice = {
            id: Utils.generateId(),
            number: Utils.generateDocumentNumber('INV'),
            status: 'draft',
            ...invoiceData,
            createdAt: new Date().toISOString()
        };
        
        data.customerInvoices.push(invoice);
        this.saveData(data);
        this.addActivity('invoice_created', `Customer Invoice ${invoice.number} created`);
        return invoice;
    }

    async confirmCustomerInvoice(id) {
        const data = this.getData();
        const index = data.customerInvoices.findIndex(inv => inv.id === id);
        
        if (index !== -1) {
            data.customerInvoices[index].status = 'confirmed';
            data.customerInvoices[index].confirmedAt = new Date().toISOString();
            
            // Create journal entry
            this.createJournalEntry('sales', data.customerInvoices[index]);
            
            this.saveData(data);
            this.addActivity('invoice_confirmed', `Customer Invoice ${data.customerInvoices[index].number} confirmed`);
            return data.customerInvoices[index];
        }
        
        throw new Error('Customer Invoice not found');
    }

    // Payments APIs
    async getPayments() {
        const data = this.getData();
        return data.payments;
    }

    async createPayment(paymentData) {
        const data = this.getData();
        const payment = {
            id: Utils.generateId(),
            number: Utils.generateDocumentNumber('PAY'),
            ...paymentData,
            createdAt: new Date().toISOString()
        };
        
        data.payments.push(payment);
        this.saveData(data);
        this.addActivity('payment_created', `Payment ${payment.number} created`);
        return payment;
    }

    // Journal Entry creation
    createJournalEntry(type, document) {
        const data = this.getData();
        const journal = {
            id: Utils.generateId(),
            type,
            documentId: document.id,
            documentNumber: document.number,
            entries: [],
            createdAt: new Date().toISOString()
        };

        if (type === 'purchase') {
            // Debit: Purchase Expense, Credit: Accounts Payable
            journal.entries.push({
                account: 'Purchase Expense',
                debit: document.total,
                credit: 0
            });
            journal.entries.push({
                account: 'Accounts Payable',
                debit: 0,
                credit: document.total
            });
        } else if (type === 'sales') {
            // Debit: Accounts Receivable, Credit: Sales Income
            journal.entries.push({
                account: 'Accounts Receivable',
                debit: document.total,
                credit: 0
            });
            journal.entries.push({
                account: 'Sales Income',
                debit: 0,
                credit: document.total
            });
        }

        data.journals.push(journal);
        this.saveData(data);
    }

    // Dashboard APIs
    async getDashboardData(period = '30d') {
        const data = this.getData();
        const { start, end } = Utils.getDateRange(period);
        
        const invoices = data.customerInvoices.filter(inv => {
            const date = new Date(inv.createdAt);
            return date >= start && date <= end && inv.status === 'confirmed';
        });
        
        const purchases = data.vendorBills.filter(bill => {
            const date = new Date(bill.createdAt);
            return date >= start && date <= end && bill.status === 'confirmed';
        });
        
        const payments = data.payments.filter(pay => {
            const date = new Date(pay.createdAt);
            return date >= start && date <= end;
        });

        const invoicesTotal = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const purchasesTotal = purchases.reduce((sum, pur) => sum + (pur.total || 0), 0);
        const paymentsTotal = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);

        return {
            invoices: {
                total: invoicesTotal,
                count: invoices.length
            },
            purchases: {
                total: purchasesTotal,
                count: purchases.length
            },
            payments: {
                total: paymentsTotal,
                count: payments.length
            },
            recentActivity: data.activity.slice(0, 10)
        };
    }

    // Reports APIs
    async getPartnerLedger(partnerId) {
        const data = this.getData();
        const partner = data.contacts.find(c => c.id === partnerId);
        if (!partner) throw new Error('Partner not found');

        const invoices = data.customerInvoices.filter(inv => inv.customerId === partnerId);
        const bills = data.vendorBills.filter(bill => bill.vendorId === partnerId);
        const payments = data.payments.filter(pay => pay.partnerId === partnerId);

        return {
            partner,
            invoices,
            bills,
            payments
        };
    }

    async getProfitLoss() {
        const data = this.getData();
        const confirmedInvoices = data.customerInvoices.filter(inv => inv.status === 'confirmed');
        const confirmedBills = data.vendorBills.filter(bill => bill.status === 'confirmed');

        const totalIncome = confirmedInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalExpenses = confirmedBills.reduce((sum, bill) => sum + (bill.total || 0), 0);
        const netProfit = totalIncome - totalExpenses;

        return {
            income: totalIncome,
            expenses: totalExpenses,
            netProfit
        };
    }

    async getBalanceSheet() {
        const data = this.getData();
        const confirmedInvoices = data.customerInvoices.filter(inv => inv.status === 'confirmed');
        const confirmedBills = data.vendorBills.filter(bill => bill.status === 'confirmed');

        const accountsReceivable = confirmedInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const accountsPayable = confirmedBills.reduce((sum, bill) => sum + (bill.total || 0), 0);

        return {
            assets: {
                cash: 10000, // Placeholder
                bank: 50000, // Placeholder
                accountsReceivable
            },
            liabilities: {
                accountsPayable
            },
            equity: {
                retainedEarnings: 60000 // Placeholder
            }
        };
    }
}

// Create global API instance
window.API = new APIService();
