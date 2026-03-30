import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper for cross-platform storage
const storage = {
  getItem: async (key) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }
};

// Add interceptor to include token
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('userToken');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export const authService = {
  signup: async (userData) => {
    const res = await api.post('auth/signup', userData);
    if (res.data.token) {
      await storage.setItem('userToken', res.data.token);
    }
    return res.data;
  },
  login: async (email, password) => {
    const res = await api.post('auth/login', { email, password });
    if (res.data.token) {
      await storage.setItem('userToken', res.data.token);
    }
    return res.data;
  },
  getNotifications: async () => {
    const res = await api.get('auth/notifications');
    return res.data;
  },
  forgotPassword: async (email) => {
    const res = await api.post('auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (email, code, newPassword) => {
    const res = await api.post('auth/reset-password', { email, code, newPassword });
    return res.data;
  },
  logout: async () => {
    await storage.deleteItem('userToken');
   
    try {
    await AsyncStorage.removeItem('user');
  } catch (e) {
    console.log('Error removing data', e);
  }
  }
};

export const walletService = {
  getWallet: async () => {
    const res = await api.get('wallet');
    return res.data;
  },
  fundWallet: async (amount) => {
    const res = await api.post('wallet/fund', { amount });
    return res.data;
  },
  chargeCard: async (qrData, amount) => {
    const res = await api.post('wallet/charge', { qrData, amount });
    return res.data;
  },
  verifyPayment: async (reference) => {
    const res = await api.post('wallet/verify-payment', { reference });
    return res.data;
  },
  initializePayment: async (amount, callback_url) => {
    const res = await api.post('wallet/initialize-payment', { amount, callback_url });
    return res.data;
  },
  refundPayment: async (refundData) => {
    const res = await api.post('wallet/refund', refundData);
    return res.data;
  },
  withdraw: async (amount) => {
    const res = await api.post('wallet/withdraw', { amount });
    return res.data;
  }
};


export const virtualCardService = {
  addUserCard: async (user_id, card_alias, card_color) => {
    const res = await api.post('virtual_cards/create', { user_id, card_alias, card_color });
    return res.data;
  },

  getVirtualCards: async (user_id, limit, offset) => {
    const res = await api.get('virtual_cards/', { params: { user_id, limit, offset } });
    return res.data;
  },
  chargeCard: async (orderData) => {
    const res = await api.post('virtual_cards/bill-card/', orderData);
    return res.data;
  },
  withdrawSellerBalance: async (orderData) => {
    const res = await api.post('virtual_cards/withdraw', orderData);
    return res.data;
  },
  setDefaultCard: async (card_id) => {
    const res = await api.put(`virtual_cards/${card_id}/default`);
    return res.data;
  },
  fundCard: async (card_id, amount, bankName) => {
    const res = await api.put(`virtual_cards/${card_id}/fund`, { amount, bankName });
    return res.data;
  },
  getDefaultCard: async (user_id) => {
    const res = await api.get(`virtual_cards/default/${user_id}`);
    return res.data;
  },
  initializeCardFunding: async (cardId, amount, callback_url) => {
    const res = await api.post('virtual_cards/initialize-funding', { cardId, amount, callback_url });
    return res.data;
  },
  verifyCardFunding: async (reference, cardId) => {
    const res = await api.post('virtual_cards/verify-funding', { reference, cardId });
    return res.data;
  }
}

export const bankAccountService = {
  registerBank: async (bankData) => {
    const res = await api.post('bank_accounts', bankData);
    return res.data;
  },
  getBanks: async () => {
    const res = await api.get('bank_accounts');
    return res.data;
  },
  updateBank: async (id, bankData) => {
    const res = await api.put(`bank_accounts/${id}`, bankData);
    return res.data;
  },
  deleteBank: async (id) => {
    const res = await api.delete(`bank_accounts/${id}`);
    return res.data;
  },
  setDefaultBank: async (id) => {
    const res = await api.put(`bank_accounts/${id}/default`);
    return res.data;
  }
};
export const orderService = {
  placeOrder: async (orderData) => {
    const res = await api.post('orders', orderData);
    return res.data;
  },
  getOrders: async () => {
    const res = await api.get('orders');
    return res.data;
  },
  updateStatus: async (orderId, status) => {
    const res = await api.patch(`orders/${orderId}/status`, { status });
    return res.data;
  },
  chargeOrder: async (orderId, amount) => {
    const res = await api.post(`orders/${orderId}/charge`, { amount });
    return res.data;
  }
};

export const sellerService = {
  getSellers: async (limit = 10, offset = 0, search = '') => {
    const res = await api.get('sellers', { params: { limit, offset, search } });
    return res.data;
  },
  getSellerDetails: async (id) => {
    const res = await api.get(`sellers/${id}`);
    return res.data;
  },
  getSellerReviews: async (id, limit = 16, offset = 0) => {
    const res = await api.get(`sellers/${id}/reviews`, { params: { limit, offset } });
    return res.data;
  },
  addReview: async (id, reviewData) => {
    const res = await api.post(`sellers/${id}/reviews`, reviewData);
    return res.data;
  },
  getSellerMenu: async (id) => {
    const res = await api.get(`sellers/${id}/menu`);
    return res.data;
  },
  addMenuItem: async (menuData) => {
    const res = await api.post('sellers/menu', menuData);
    return res.data;
  },
  updateMenuItem: async (id, menuData) => {
    const res = await api.put(`sellers/menu/${id}`, menuData);
    return res.data;
  },
  deleteMenuItem: async (id) => {
    const res = await api.delete(`sellers/menu/${id}`);
    return res.data;
  },
  updateProfile: async (profileData) => {
    const res = await api.put('sellers/profile', profileData);
    return res.data;
  },
  submitVerification: async (verificationData) => {
    const res = await api.post('sellers/verify', verificationData);
    return res.data;
  }
};

export const userService = {
  reportUser: async (reportData) => {
    const res = await api.post('users/report', reportData);
    return res.data;
  },
  updateProfileImage: async (formData) => {
    const res = await api.post('users/upload-profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  searchUsers: async (query) => {
    const res = await api.get('users/search', { params: { query } });
    return res.data;
  }
};

export default api;
