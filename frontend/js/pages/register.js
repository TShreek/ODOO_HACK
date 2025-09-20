import { register } from '../auth.js';

export function render(container) {
    container.innerHTML = `
        <form id="register-form">
            <h2>Create Account</h2>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
            <label for="full_name">Full Name</label>
            <input type="text" id="full_name" name="full_name">
            <button type="submit">Register</button>
            <p class="error-message" id="register-error"></p>
        </form>
    `;

    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const errorEl = document.getElementById('register-error');

        try {
            await register(data);
            alert('Registration successful! Please log in.');
            window.location.hash = '/login';
        } catch (error) {
            errorEl.textContent = error.message;
        }
    });
}