const BASE_URL = 'http://localhost:8000';

function getAuthToken() {
    return localStorage.getItem('access_token');
}

function getTenantId() {
    // Try to get tenant from JWT first, then from manual input
    const token = getAuthToken();
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.tenant_id) {
                return payload.tenant_id;
            }
        } catch (e) {
            console.error('Error parsing JWT:', e);
        }
    }
    return document.getElementById('tenant-id')?.value || '';
}

async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const token = getAuthToken();
    const tenantId = getTenantId();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenantId) {
        headers['X-Tenant-ID'] = tenantId;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

export const api = {
    get: (endpoint, params) => {
        const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
        return request(url);
    },
    post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
    put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};