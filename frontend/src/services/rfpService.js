import api from './api';

export const createRFP = async (product_ids, message) => {
  const response = await api.post('/rfps', { product_ids, message });
  return response.data;
};

export const getUserRFPs = async () => {
  const response = await api.get('/rfps/my-rfps');
  return response.data;
};
