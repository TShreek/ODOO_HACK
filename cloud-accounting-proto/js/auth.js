// Authentication module for Cloud Accounting app

class AuthService {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', this.handleSignup.bind(this));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Password strength checker
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', this.checkPasswordStrength.bind(this));
        }

        // Email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', this.validateEmail.bind(this));
        }

        // Check authentication on page load
        this.checkAuthentication();
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Clear previous errors
        Utils.hideError('emailError');
        Utils.hideError('passwordError');

        // Validate inputs
        if (!this.validateLoginForm(email, password)) {
            return;
        }

        try {
            const result = await API.login(email, password);
            
            if (result.success) {
                Utils.showSuccess('Login successful!');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                Utils.showError('passwordError', result.error);
            }
        } catch (error) {
            Utils.showError('passwordError', 'Login failed. Please try again.');
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const formData = {
            companyName: document.getElementById('companyName').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value
        };

        // Clear previous errors
        this.clearAllErrors();

        // Validate form
        if (!this.validateSignupForm(formData)) {
            return;
        }

        try {
            const result = await API.signup(formData);
            
            if (result.success) {
                Utils.showSuccess('Account created successfully!');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                Utils.showError('emailError', result.error);
            }
        } catch (error) {
            Utils.showError('emailError', 'Signup failed. Please try again.');
        }
    }

    handleLogout() {
        Utils.clearCurrentUser();
        Utils.showSuccess('Logged out successfully!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    validateLoginForm(email, password) {
        let isValid = true;

        if (!email) {
            Utils.showError('emailError', 'Email is required');
            isValid = false;
        } else if (!Utils.validateEmail(email)) {
            Utils.showError('emailError', 'Please enter a valid email address');
            isValid = false;
        }

        if (!password) {
            Utils.showError('passwordError', 'Password is required');
            isValid = false;
        }

        return isValid;
    }

    validateSignupForm(formData) {
        let isValid = true;

        // Company name validation
        if (!formData.companyName) {
            Utils.showError('companyNameError', 'Company name is required');
            isValid = false;
        } else if (formData.companyName.length < 2) {
            Utils.showError('companyNameError', 'Company name must be at least 2 characters');
            isValid = false;
        }

        // Email validation
        if (!formData.email) {
            Utils.showError('emailError', 'Email is required');
            isValid = false;
        } else if (!Utils.validateEmail(formData.email)) {
            Utils.showError('emailError', 'Please enter a valid email address');
            isValid = false;
        }

        // Password validation
        if (!formData.password) {
            Utils.showError('passwordError', 'Password is required');
            isValid = false;
        } else {
            const strength = Utils.checkPasswordStrength(formData.password);
            if (strength.score < 3) {
                Utils.showError('passwordError', 'Password is too weak. ' + strength.feedback.join(', '));
                isValid = false;
            }
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            Utils.showError('confirmPasswordError', 'Please confirm your password');
            isValid = false;
        } else if (formData.password !== formData.confirmPassword) {
            Utils.showError('confirmPasswordError', 'Passwords do not match');
            isValid = false;
        }

        // Terms validation
        const termsCheckbox = document.getElementById('terms');
        if (!termsCheckbox.checked) {
            Utils.showError('termsError', 'You must agree to the terms and conditions');
            isValid = false;
        }

        return isValid;
    }

    checkPasswordStrength() {
        const password = document.getElementById('password').value;
        const strengthIndicator = document.getElementById('strengthIndicator');
        const strengthText = document.getElementById('strengthText');

        if (!password) {
            strengthIndicator.className = 'strength-fill';
            strengthText.textContent = 'Password strength';
            return;
        }

        const strength = Utils.checkPasswordStrength(password);
        
        // Update visual indicator
        strengthIndicator.className = `strength-fill strength-${strength.strength}`;
        
        // Update text
        const strengthMessages = {
            weak: 'Weak password',
            fair: 'Fair password',
            good: 'Good password',
            strong: 'Strong password'
        };
        strengthText.textContent = strengthMessages[strength.strength];
    }

    validateEmail() {
        const email = document.getElementById('email').value.trim();
        const emailError = document.getElementById('emailError');
        
        if (email && !Utils.validateEmail(email)) {
            Utils.showError('emailError', 'Please enter a valid email address');
        } else {
            Utils.hideError('emailError');
        }
    }

    clearAllErrors() {
        const errorIds = ['companyNameError', 'emailError', 'passwordError', 'confirmPasswordError', 'termsError'];
        errorIds.forEach(id => Utils.hideError(id));
    }

    checkAuthentication() {
        // If on login/signup pages and already authenticated, redirect to dashboard
        if (Utils.isAuthenticated() && (window.location.pathname.includes('index.html') || window.location.pathname.includes('signup.html'))) {
            window.location.href = 'dashboard.html';
            return;
        }

        // If on protected pages and not authenticated, redirect to login
        if (!Utils.isAuthenticated() && !window.location.pathname.includes('index.html') && !window.location.pathname.includes('signup.html')) {
            window.location.href = 'index.html';
            return;
        }

        // Update user info in header if authenticated
        if (Utils.isAuthenticated()) {
            const user = Utils.getCurrentUser();
            const userEmailElement = document.getElementById('userEmail');
            if (userEmailElement) {
                userEmailElement.textContent = user.email;
            }
        }
    }
}

// Initialize authentication service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthService();
});
