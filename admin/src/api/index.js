import api from './http';

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name) => api.post('/auth/register', { email, password, name }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const products = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
};

export const collections = {
  list: (params) => api.get('/collections', { params }),
  get: (id) => api.get(`/collections/${id}`),
  create: (data) => api.post('/collections', data),
  update: (id, data) => api.put(`/collections/${id}`, data),
  remove: (id) => api.delete(`/collections/${id}`),
  addProduct: (id, productId, sortOrder, note) => api.post(`/collections/${id}/products`, { productId, sortOrder, note }),
  removeProduct: (id, productId) => api.delete(`/collections/${id}/products/${productId}`),
};

export const admin = {
  stats: () => api.get('/admin/stats'),
  users: () => api.get('/admin/users'),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export const apiKeys = {
  list: () => api.get('/api-keys'),
  create: (name) => api.post('/api-keys', { name }),
  revoke: (id) => api.put(`/api-keys/${id}/revoke`),
  remove: (id) => api.delete(`/api-keys/${id}`),
};

export const pub = {
  settings: () => api.get('/public/settings'),
};
