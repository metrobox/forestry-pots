import api from './api';

export const getProducts = async (search = '', page = 1, limit = 12, filters = null) => {
  const params = { search, page, limit };
  
  // Add dimension filters if provided
  if (filters) {
    if (filters.topDia) {
      params.topDiaMin = filters.topDia[0];
      params.topDiaMax = filters.topDia[1];
    }
    if (filters.height) {
      params.heightMin = filters.height[0];
      params.heightMax = filters.height[1];
    }
    if (filters.bottomDia) {
      params.bottomDiaMin = filters.bottomDia[0];
      params.bottomDiaMax = filters.bottomDia[1];
    }
  }
  
  const response = await api.get('/products', { params });
  return response.data;
};

export const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const downloadFile = async (productId, type) => {
  const response = await api.get(`/files/${productId}/${type}/download`, {
    responseType: 'blob',
  });
  return response;
};
