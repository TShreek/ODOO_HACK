import { api } from './api.js';

export function saveToken(token) {
    localStorage.setItem('access_token', token);
}

export function clearToken() {
    localStorage.removeItem('access_token');
}

export function isLoggedIn() {
    return !!localStorage.getItem('access_token');
}

export function getUserRoles() {
    const token = localStorage.getItem('access_token');
    if (!token) return [];
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.roles || [];
    } catch (e) {
        console.error('Failed to parse token for roles:', e);
        return [];
    }
}

export async function login(login_id, password, tenant_id) {
    const response = await api.post('/auth/login_with_tenant', { login_id, password, tenant_id });
    if (response.access_token) {
        saveToken(response.access_token);
    }
    return response;
}

export async function register(userData) {
    return api.post('/auth/register', userData);
}

export function logout() {
    clearToken();
    window.location.hash = '/login';
    updateUI();
}

export function updateUI() {
    const loggedIn = isLoggedIn();
    const navLinks = document.querySelector('.nav-links');
    const logoutBtn = document.getElementById('logout-btn');

    if (loggedIn) {
        navLinks.style.display = 'flex';
        logoutBtn.style.display = 'block';
        document.querySelector('a[href="#/login"]').parentElement.style.display = 'none';
        document.querySelector('a[href="#/register"]').parentElement.style.display = 'none';
    } else {
        logoutBtn.style.display = 'none';
        document.querySelector('a[href="#/login"]').parentElement.style.display = 'block';
        document.querySelector('a[href="#/register"]').parentElement.style.display = 'block';
    }
}