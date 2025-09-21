// Utility functions for the Cloud Accounting app

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

// Format date with time
function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate document number
function generateDocumentNumber(prefix) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Check password strength
function checkPasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    if (password.length >= 8) score++;
    else feedback.push('At least 8 characters');
    
    if (/[a-z]/.test(password)) score++;
    else feedback.push('Lowercase letter');
    
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Uppercase letter');
    
    if (/[0-9]/.test(password)) score++;
    else feedback.push('Number');
    
    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('Special character');
    
    return {
        score: score,
        strength: score < 2 ? 'weak' : score < 3 ? 'fair' : score < 4 ? 'good' : 'strong',
        feedback: feedback
    };
}

// Show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

// Hide error message
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

// Show success message
function showSuccess(message, duration = 3000) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 fade-in';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, duration);
}

// Show loading spinner
function showLoading(element) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.id = 'loading-spinner';
    element.appendChild(spinner);
}

// Hide loading spinner
function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Calculate tax amount
function calculateTax(amount, taxRate) {
    return (amount * taxRate) / 100;
}

// Calculate total with tax
function calculateTotal(amount, taxRate) {
    const tax = calculateTax(amount, taxRate);
    return amount + tax;
}

// Calculate percentage change
function calculatePercentageChange(current, previous) {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

// Deep clone object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Get date range for period
function getDateRange(period) {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
        case '24h':
            start.setHours(now.getHours() - 24);
            break;
        case '7d':
            start.setDate(now.getDate() - 7);
            break;
        case '30d':
            start.setDate(now.getDate() - 30);
            break;
        default:
            start.setDate(now.getDate() - 30);
    }
    
    return { start, end: now };
}

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('user') !== null;
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// Clear current user
function clearCurrentUser() {
    localStorage.removeItem('user');
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Format phone number
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
}

// Validate phone number
function validatePhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
}

// Generate HSN code (placeholder)
function generateHSNCode() {
    const codes = ['1234', '5678', '9012', '3456', '7890'];
    return codes[Math.floor(Math.random() * codes.length)];
}

// Calculate outstanding amount
function calculateOutstanding(total, paid) {
    return Math.max(0, total - paid);
}

// Check if document can be edited
function canEditDocument(document) {
    return document.status === 'draft';
}

// Check if document can be cancelled
function canCancelDocument(document) {
    return document.status === 'draft' || document.status === 'confirmed';
}

// Check if document can be confirmed
function canConfirmDocument(document) {
    return document.status === 'draft';
}

// Get document status color
function getStatusColor(status) {
    switch (status) {
        case 'draft':
            return 'status-draft';
        case 'confirmed':
            return 'status-confirmed';
        case 'cancelled':
            return 'status-cancelled';
        default:
            return 'status-draft';
    }
}

// Validate required fields
function validateRequired(fields) {
    const errors = {};
    fields.forEach(field => {
        if (!field.value || field.value.trim() === '') {
            errors[field.name] = `${field.label} is required`;
        }
    });
    return errors;
}

// Sanitize input
function sanitizeInput(input) {
    return input.replace(/[<>]/g, '');
}

// Export functions for use in other modules
window.Utils = {
    formatCurrency,
    formatDate,
    formatDateTime,
    generateId,
    generateDocumentNumber,
    validateEmail,
    checkPasswordStrength,
    showError,
    hideError,
    showSuccess,
    showLoading,
    hideLoading,
    debounce,
    calculateTax,
    calculateTotal,
    calculatePercentageChange,
    deepClone,
    getDateRange,
    isAuthenticated,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    requireAuth,
    formatPhoneNumber,
    validatePhoneNumber,
    generateHSNCode,
    calculateOutstanding,
    canEditDocument,
    canCancelDocument,
    canConfirmDocument,
    getStatusColor,
    validateRequired,
    sanitizeInput
};
