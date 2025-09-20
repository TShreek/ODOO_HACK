import { login } from '../auth.js';

export function render(container) {
    container.innerHTML = `
        <form id="login-form">
            <h2>Login</h2>
            <label for="login_id">Email or Username</label>
            <input type="text" id="login_id" name="login_id" required>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
            <label for="tenant_id">Tenant ID (optional)</label>
            <input type="text" id="tenant_id" name="tenant_id">
            <button type="submit">Login</button>
            <p class="error-message" id="login-error"></p>
        </form>
    `;

    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const errorEl = document.getElementById('login-error');

        try {
            await login(data.login_id, data.password, data.tenant_id);
            window.location.hash = '/dashboard';
        } catch (error) {
            errorEl.textContent = error.message;
        }
    });
}