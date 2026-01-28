import api from './api';

export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post('/admin/users', data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/admin/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

export const getAllProducts = async () => {
  const response = await api.get('/admin/products');
  return response.data;
};

export const createProduct = async (formData) => {
  const response = await api.post('/admin/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateProduct = async (id, formData) => {
  const response = await api.put(`/admin/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/admin/products/${id}`);
  return response.data;
};

export const getAllRFPs = async (status) => {
  const response = await api.get('/admin/rfps', {
    params: status ? { status } : {},
  });
  return response.data;
};

export const updateRFPStatus = async (id, status) => {
  const response = await api.put(`/admin/rfps/${id}/status`, { status });
  return response.data;
};

export const getAccessLogs = async (filters) => {
  const response = await api.get('/admin/access-logs', { params: filters });
  return response.data;
};

export const getAccessRequests = async () => {
  const response = await api.get('/admin/access-requests');
  return response.data;
};
