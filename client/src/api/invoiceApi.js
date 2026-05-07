import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const user = localStorage.getItem('invoice_user');
    if (user) {
        const { token } = JSON.parse(user);
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const invoiceApi = {
    // Create invoice
    create: (data) => api.post('/invoices', data).then(r => r.data),

    // List invoices with filters
    list: (params = {}) => api.get('/invoices', { params }).then(r => r.data),

    // Get single invoice
    get: (id) => api.get(`/invoices/${id}`).then(r => r.data),

    // Update invoice
    update: (id, data) => api.put(`/invoices/${id}`, data).then(r => r.data),

    // Delete invoice
    delete: (id) => api.delete(`/invoices/${id}`).then(r => r.data),

    // Download PDF
    downloadPdf: async (id, invoiceNumber) => {
        const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice_${invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    // Verify GSTIN (API method)
    verifyGst: (gstin) => api.post('/gst/verify', { gstin }).then(r => r.data),

    // CAPTCHA method
    getCaptcha: () => api.get('/gst/captcha').then(r => r.data),
    verifyWithCaptcha: (sessionId, gstin, captcha) =>
        api.post('/gst/verify-captcha', { sessionId, gstin, captcha }).then(r => r.data),
};

export const businessApi = {
    list: () => api.get('/businesses').then(r => r.data),
    create: (data) => api.post('/businesses', data).then(r => r.data),
    update: (id, data) => api.put(`/businesses/${id}`, data).then(r => r.data),
    delete: (id) => api.delete(`/businesses/${id}`).then(r => r.data),
    setDefault: (id) => api.put(`/businesses/${id}/default`).then(r => r.data),
};

export const receiverApi = {
    list: (search = '') => api.get('/receivers', { params: { search } }).then(r => r.data),
    delete: (id) => api.delete(`/receivers/${id}`).then(r => r.data),
};

export default api;
