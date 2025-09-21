// Razorpay Payment Simulator for Cloud Accounting app

class RazorpaySimulator {
    constructor() {
        this.paymentMethods = [
            { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
            { id: 'upi', name: 'UPI', icon: '📱' },
            { id: 'netbanking', name: 'Net Banking', icon: '🏦' },
            { id: 'wallet', name: 'Digital Wallet', icon: '💰' }
        ];
    }

    // Simulate Razorpay checkout
    openCheckout(options) {
        return new Promise((resolve, reject) => {
            // Show payment modal
            this.showPaymentModal(options, resolve, reject);
        });
    }

    showPaymentModal(options, resolve, reject) {
        const modal = document.getElementById('paymentModal');
        const content = document.getElementById('paymentContent');
        
        content.innerHTML = `
            <div class="space-y-6">
                <div class="text-center">
                    <h4 class="text-lg font-semibold text-gray-900">Complete Your Payment</h4>
                    <p class="text-gray-600">Amount: ${Utils.formatCurrency(options.amount / 100)}</p>
                </div>

                <div class="space-y-4">
                    <h5 class="font-medium text-gray-900">Select Payment Method</h5>
                    <div class="grid grid-cols-2 gap-3">
                        ${this.paymentMethods.map(method => `
                            <button class="payment-method-btn" data-method="${method.id}">
                                <span class="text-2xl mb-2">${method.icon}</span>
                                <span class="text-sm">${method.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div id="paymentForm" class="hidden">
                    <div class="space-y-4">
                        <div class="form-group">
                            <label class="form-label">Card Number / UPI ID / Account Number</label>
                            <input type="text" id="paymentDetails" class="form-input" placeholder="Enter payment details">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Name on Card / Account</label>
                            <input type="text" id="paymentName" class="form-input" placeholder="Enter name">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="form-group">
                                <label class="form-label">Expiry Date</label>
                                <input type="text" id="paymentExpiry" class="form-input" placeholder="MM/YY">
                            </div>
                            <div class="form-group">
                                <label class="form-label">CVV</label>
                                <input type="text" id="paymentCvv" class="form-input" placeholder="123">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button id="cancelPayment" class="btn-secondary">Cancel</button>
                    <button id="processPayment" class="btn-primary hidden">Pay Now</button>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachPaymentListeners(resolve, reject);
        
        modal.classList.remove('hidden');
    }

    attachPaymentListeners(resolve, reject) {
        let selectedMethod = null;

        // Payment method selection
        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedMethod = btn.dataset.method;
                
                document.getElementById('paymentForm').classList.remove('hidden');
                document.getElementById('processPayment').classList.remove('hidden');
            });
        });

        // Process payment
        document.getElementById('processPayment').addEventListener('click', () => {
            if (!selectedMethod) {
                Utils.showSuccess('Please select a payment method', 3000);
                return;
            }

            const details = document.getElementById('paymentDetails').value.trim();
            const name = document.getElementById('paymentName').value.trim();

            if (!details || !name) {
                Utils.showSuccess('Please fill in all required fields', 3000);
                return;
            }

            // Simulate payment processing
            this.processPayment(selectedMethod, details, name, resolve, reject);
        });

        // Cancel payment
        document.getElementById('cancelPayment').addEventListener('click', () => {
            document.getElementById('paymentModal').classList.add('hidden');
            reject(new Error('Payment cancelled by user'));
        });
    }

    processPayment(method, details, name, resolve, reject) {
        // Show loading
        const processBtn = document.getElementById('processPayment');
        const originalText = processBtn.textContent;
        processBtn.textContent = 'Processing...';
        processBtn.disabled = true;

        // Simulate API call delay
        setTimeout(() => {
            // Simulate success (90% success rate)
            if (Math.random() > 0.1) {
                const paymentId = 'pay_' + Math.random().toString(36).substr(2, 9);
                const response = {
                    razorpay_payment_id: paymentId,
                    razorpay_order_id: 'order_' + Math.random().toString(36).substr(2, 9),
                    razorpay_signature: 'signature_' + Math.random().toString(36).substr(2, 16)
                };
                
                this.showPaymentSuccess();
                resolve(response);
            } else {
                // Simulate failure
                Utils.showSuccess('Payment failed. Please try again.', 5000);
                processBtn.textContent = originalText;
                processBtn.disabled = false;
                reject(new Error('Payment failed'));
            }
        }, 2000);
    }

    showPaymentSuccess() {
        document.getElementById('paymentModal').classList.add('hidden');
        document.getElementById('paymentSuccessModal').classList.remove('hidden');
        
        // Auto close after 3 seconds
        setTimeout(() => {
            document.getElementById('paymentSuccessModal').classList.add('hidden');
        }, 3000);
    }
}

// Add CSS for payment method buttons
const style = document.createElement('style');
style.textContent = `
    .payment-method-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .payment-method-btn:hover {
        border-color: #3b82f6;
        background: #f8fafc;
    }
    
    .payment-method-btn.selected {
        border-color: #3b82f6;
        background: #eff6ff;
    }
`;
document.head.appendChild(style);

// Create global Razorpay simulator
window.Razorpay = new RazorpaySimulator();
