import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL
});

api.interceptors.request.use((config) => {
    if (config.url.includes('/api/auth/login') || config.url.includes('/api/auth/register')) {
        return config;
    }

    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;