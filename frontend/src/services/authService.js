import api from './api';

export const registerUser = async (userData) => {
    const response = await api.post('/register', userData);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await api.post('/login', credentials);
    return response.data;
};