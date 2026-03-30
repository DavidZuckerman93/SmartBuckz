import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, walletService, orderService, virtualCardService, bankAccountService, sellerService, userService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';


const UserContext = createContext();

export const USER_TYPES = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
};

export const UserProvider = ({ children }) => {
  const [userType, setUserType] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  
  // Buyer State
  const [wallet, setWallet] = useState({
    balance: 0,
    currency: 'NGN',
    history: [],
  });
  const [cards, setCards] = useState([
    { id: '1', cardNumber: '**** **** **** 1234', isDefault: true, dailyLimit: 2000, spentToday: 500 },
  ]);
  const [registeredBanks, setRegisteredBanks] = useState([]);

  const fetchBanks = async () => {
    try {
      const data = await bankAccountService.getBanks();
      setRegisteredBanks(data);
    } catch (err) {
      console.error('Error fetching banks:', err);
    }
  };

  const addRegisteredBank = async (bank) => {
    try {
      const res = await bankAccountService.registerBank(bank);
      setRegisteredBanks(prev => [res.bank, ...prev]);
      return res;
    } catch (err) {
      console.error('Error adding bank:', err);
      throw err;
    }
  };

  const updateRegisteredBank = async (id, bankData) => {
    try {
      const res = await bankAccountService.updateBank(id, bankData);
      setRegisteredBanks(prev => prev.map(b => b.id === id ? res.bank : b));
      return res;
    } catch (err) {
      console.error('Error updating bank:', err);
      throw err;
    }
  };

  const deleteBank = async (id) => {
    try {
      await bankAccountService.deleteBank(id);
      setRegisteredBanks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error deleting bank:', err);
      throw err;
    }
  };

  const setDefaultBank = async (id) => {
    try {
      await bankAccountService.setDefaultBank(id);
      setRegisteredBanks(prev => prev.map(b => ({
        ...b,
        is_default: b.id === id ? 1 : 0
      })));
    } catch (err) {
      console.error('Error setting default bank:', err);
      throw err;
    }
  };

  // Seller State
  const [sellerData, setSellerData] = useState({
    balance: 0,
    isAvailable: true,
    isVerified: false,
    verificationStatus: 'Pending',
    businessMedia: { photos: [], video: null },
    sales: [],
    reports: [],
    orders: []
  });

  // Global App Data
  const [notifications, setNotifications] = useState([]);
  const [registeredSellers, setRegisteredSellers] = useState([]);
  const [orders, setOrders] = useState([]);

  const fetchSellers = async () => {
    try {
      const data = await sellerService.getSellers();
      setRegisteredSellers(data);
    } catch (err) {
      console.error('Error fetching sellers:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await authService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Fetch data from backend on login
  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchSellers();
      fetchOrders();
      fetchNotifications();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      if (userType === USER_TYPES.BUYER) {
        const data = await walletService.getWallet();
        setWallet(prev => ({ ...prev, balance: data.balance, history: data.history }));
        await fetchBanks();
        
        // Also fetch cards to find the default one for the home screen balance
        const cardData = await virtualCardService.getVirtualCards(user.id, 50, 0);
        if (Array.isArray(cardData)) {
          setCards(cardData);
          const defaultCard = cardData.find(c => c.is_default === 1);
          if (defaultCard) {
            setWallet(prev => ({ ...prev, balance: parseFloat(defaultCard.card_balance || 0) }));
          }
        }
      } else if (userType === USER_TYPES.SELLER) {
        const data = await walletService.getWallet();
        setSellerData(prev => ({ 
          ...prev, 
          balance: parseFloat(data.balance || 0), 
          sales: data.history.filter(h => h.type === 'SALE').map(item => ({
            id: item.id,
            buyer: item.merchant_name || 'Customer',
            amount: parseFloat(item.amount),
            date: new Date(item.created_at).toLocaleDateString(),
            status: item.status,
            buyer_id: item.buyer_id, // Ensure this is captured from backend
            card_id: item.card_id    // Ensure this is captured from backend
          }))
        }));
        await fetchBanks();
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const saveUData = async (dataToSave) => {
 

  try {
    await AsyncStorage.setItem('user', JSON.stringify(dataToSave));
  } catch (e) {
    console.log('Error saving data');
  }
};

const removeData = async () => {
  try {
    await AsyncStorage.removeItem('user');
  } catch (e) {
    console.log('Error removing data');
  }
};

const getUData = async () => {
  try {
    const value = await AsyncStorage.getItem('user');
    if (value !== null) {
      const parsed = JSON.parse(value);
      return parsed;
    }
  } catch (e) {
    console.log('Error reading data');
  }
};

  const selectUserType = (type) => {
    setUserType(type);
  };

  const fundWallet = async (amount) => {
    try {
      const res = await walletService.fundWallet(amount);
      setWallet(prev => ({
        ...prev,
        balance: res.newBalance,
        history: [{ id: Date.now(), amount, type: 'FUNDING', status: 'SUCCESS', created_at: new Date() }, ...prev.history]
      }));
    } catch (err) {
      console.error('Funding failed:', err);
    }
  };

  const chargeCard = async (amount, qrData) => {
    try {
      const res = await walletService.chargeCard(qrData, amount);
      await fetchUserData(); // Refresh balance and history
      return res;
    } catch (err) {
      console.error('Charge card failed:', err);
      throw err;
    }
  };

  const withdrawSellerBalance = async (amount) => {
    try {
      const res = await walletService.withdraw(amount);
      setSellerData((prev) => ({
        ...prev,
        balance: parseFloat(res.newBalance),
      }));
      await fetchNotifications(); // Refresh notifications to show the withdrawal alert
      return { success: true, message: res.message };
    } catch (err) {
      console.error('Withdrawal failed:', err);
      const message = err.response?.data?.message || 'Withdrawal failed. Please try again.';
      return { success: false, message };
    }
  };

  const toggleAvailability = () => {
    setSellerData(prev => ({ ...prev, isAvailable: !prev.isAvailable }));
  };

  const login = async (email, password) => {
    try {
      const res = await authService.login(email, password);
      setUser(res.user);
      setUserType(res.user.role);
      await saveUData(res.user);
      return res;
    } catch (err) {
      throw err;
    }
  };

  const signup = async (userData) => {
    try {
      const res = await authService.signup(userData);
      setUser(res.user);
      setUserType(res.user.role);
      await saveUData(res.user);
      return res;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setUserType(null);
  };

  const updateProfileImage = async (imageSource) => {
    try {
      let imageUrl = imageSource;

      // Check if it's a local file URI (from image picker)
      if (typeof imageSource === 'object' && imageSource.uri) {
        const formData = new FormData();
        const uri = imageSource.uri;
        
        // Handle file name and type for web/native compatibility
        const fileName = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(fileName);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('profileImage', {
          uri: uri,
          name: fileName,
          type: type,
        });

        const res = await userService.uploadProfileImage(formData);
        imageUrl = res.profile_image;
      } else {
        // Fallback for direct URL update if needed
        await userService.updateProfileImage(imageUrl);
      }

      setUser(prev => ({ ...prev, profile_image: imageUrl }));
      return { success: true, profile_image: imageUrl };
    } catch (err) {
      console.error('Update profile image failed:', err);
      throw err;
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await orderService.updateStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      
      // If completed or status changed, refresh relevant data
      fetchOrders();
      fetchUserData(); 

      return { success: true, message: response.message };
    } catch (err) {
      console.error('Update status failed:', err);
      const message = err.response?.data?.message || 'Failed to update order status';
      return { success: false, message };
    }
  };

  const placeOrder = async (orderData) => {
    try {
      const res = await orderService.placeOrder(orderData);
      await fetchOrders();
      return res;
    } catch (err) {
      console.error('Place order failed:', err);
      throw err;
    }
  };

  const chargeOrder = async (orderId, amount) => {
    try {
      const res = await orderService.chargeOrder(orderId, amount);
      await fetchOrders();
      await fetchUserData(); // Refresh wallet balance
      return res;
    } catch (err) {
      console.error('Charge order failed:', err);
      throw err;
    }
  };

  const updateVerificationStatus = async (status, media = {}) => {
    try {
      if (status === 'Verified') {
        await sellerService.submitVerification({
          photos: media.photos || [],
          video: media.video || null
        });
        
        // Update local user state
        setUser(prev => ({ ...prev, is_verified: 1 }));
      }

      setSellerData(prev => ({
        ...prev,
        verificationStatus: status,
        isVerified: status === 'Verified',
        businessMedia: { ...prev.businessMedia, ...media }
      }));
    } catch (err) {
      console.error('Error submitting verification status:', err);
      throw err;
    }
  };

  const addUserCard = async(user_id) =>{
    try {
      const res = await walletService.addUserCard(user_id);
      setCards(res.cards);
    } catch (err) {
      console.error('Add user card failed:', err);
    }
  }

  const virtualCardOperations = {
    createNewCard: async (user_id, card_alias, card_color) => {
      try{
        const res = await virtualCardService.addUserCard(user_id, card_alias, card_color);
        // console.log(`Response is : ${JSON.stringify(res)}`);
      }catch(err){
        console.error('Create card failed because', err);
      }
    },

    fetchAllCards: async ($user_id, $limit, $offset) =>{
      try{
        const $results = await virtualCardService.getVirtualCards($user_id, $limit, $offset);
        if (Array.isArray($results)) {
          setCards($results);
          const defaultCard = $results.find(c => c.is_default === 1);
          if (defaultCard) {
            setWallet(prev => ({ ...prev, balance: parseFloat(defaultCard.card_balance || 0) }));
          }
        }
        return $results;
      }catch(err){
      console.log(`Could not complete due to: ${err}`);
      }
    },

    setDefaultCard: async (card_id) => {
      try {
        await virtualCardService.setDefaultCard(card_id);
        const data = await virtualCardService.getVirtualCards(user.id, 50, 0);
        if (Array.isArray(data)) {
          setCards(data);
          const defaultCard = data.find(c => c.is_default === 1);
          if (defaultCard) {
            setWallet(prev => ({ ...prev, balance: parseFloat(defaultCard.card_balance || 0) }));
          }
        }
        return true;
      } catch (err) {
        console.error('Set default card failed:', err);
        throw err;
      }
    },

    fundCard: async (card_id, amount, bankName) => {
      try {
        const res = await virtualCardService.fundCard(card_id, amount, bankName);
        
        // Refresh everything to ensure sync
        const data = await walletService.getWallet();
        setWallet(prev => ({ ...prev, balance: data.balance, history: data.history }));
        
        const cardData = await virtualCardService.getVirtualCards(user.id, 50, 0);
        if (Array.isArray(cardData)) {
          setCards(cardData);
        }
        return res;
      } catch (err) {
        console.error('Fund card failed:', err);
        throw err;
      }
    }
  }

  const refundPayment = async (refundData) => {
    try {
      const res = await walletService.refundPayment(refundData);
      await fetchUserData(); // Refresh balances and history
      return res;
    } catch (err) {
      console.error('Refund failed:', err);
      throw err;
    }
  };

  return (
    <UserContext.Provider
      value={{
        userType,
        user,
        wallet,
        cards,
        registeredBanks,
        addRegisteredBank,
        updateRegisteredBank,
        deleteBank,
        setDefaultBank,
        fetchBanks,
        sellerData,
        notifications,
        registeredSellers,
        orders,
        virtualCardOperations,
        selectUserType,
        fundWallet,
        chargeCard,
        refundPayment,
        withdrawSellerBalance,
        toggleAvailability,
        login,
        signup,
        logout,
        updateProfileImage,
        saveUData,
        getUData,
        updateOrderStatus,
        placeOrder,
        chargeOrder,
        fetchOrders,
        fetchNotifications,
        fetchUserData,
        updateVerificationStatus,
        showNotificationsModal,
        setShowNotificationsModal,
        setCards,
        setSellerData,
        setNotifications,
        setRegisteredSellers,
        setUser,
        setUserType,
        removeData,
        fetchSellers
        
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
