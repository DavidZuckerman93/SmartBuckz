import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Modal, Image, FlatList, TextInput, Switch, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme/colors';
import { useUser, USER_TYPES } from '../context/UserContext';
import { Bell, User, X, AlertCircle, Info, Search, Phone, Power, Clock, Check, ShieldCheck, QrCode, ShoppingBag, AlertTriangle, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import ReportUserModal from './ReportUserModal';

const GlobalHeader = ({ navigation, showSearch = true, onSearchChange }) => {
  const { user, userType, notifications, logout, sellerData, toggleAvailability, updateOrderStatus, orders, fetchOrders, registeredSellers, updateProfileImage, fetchSellers, showNotificationsModal, setShowNotificationsModal } = useUser();
  const [showProfile, setShowProfile] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const isSeller = userType === USER_TYPES.SELLER;

  React.useEffect(() => {
    if (showSearch && registeredSellers.length === 0) {
      fetchSellers();
    }
  }, [showSearch]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (onSearchChange) onSearchChange(text);

    if (text.trim().length > 0) {
      const filtered = registeredSellers.filter(s => 
        s.name.toLowerCase().includes(text.toLowerCase()) ||
        s.address.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectResult = (sellerId) => {
    setSearchQuery('');
    setSearchResults([]);
    
    // Check if we can navigate to SellerDetails
    // If we are in a stack that has SellerDetails, this works directly
    // Otherwise, we might need to switch tabs for buyers
    if (userType === USER_TYPES.BUYER) {
      navigation.navigate('Explore', { 
        screen: 'SellerDetails', 
        params: { sellerId } 
      });
    } else {
      // For sellers, they might not have a dedicated "SellerDetails" view in their tabs
      // but we can try to navigate if it's registered in their stack
      navigation.navigate('SellerDetails', { sellerId });
    }
  };

  const getBadgeColor = () => {
    if (isSeller) {
      return orders.some(o => o.status === 'PENDING') ? COLORS.success : null;
    } else {
      if (orders.some(o => o.status === 'DECLINED')) return COLORS.danger;
      if (orders.some(o => o.status === 'ACCEPTED' || o.status === 'READY')) return COLORS.success;
      return null;
    }
  };

  const badgeColor = getBadgeColor();

  const handleAcceptOrder = async (orderId) => {
    await updateOrderStatus(orderId, 'ACCEPTED');
    Alert.alert('Order Accepted', 'The customer has been notified and the timer has started.');
  };

  const handleDeclineOrder = (orderId) => {
    Alert.alert(
      'Decline Order',
      'Are you sure you want to decline this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: async () => await updateOrderStatus(orderId, 'DECLINED') }
      ]
    );
  };

  const handleMarkReady = async (orderId) => {
    await updateOrderStatus(orderId, 'READY');
    Alert.alert('Order Ready', 'The customer has been notified to pick up their order.');
  };

  const handleMarkCompleted = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order);
    setShowCompletionModal(true);
  };

  const confirmCompletion = async () => {
    // if (!selectedOrder) return;
    
    setIsCompleting(true);
    try {
      const result = await updateOrderStatus(selectedOrder.id, 'COMPLETED');
      if (result.success) {
        setShowCompletionModal(false);
        setSelectedOrder(null);
        Alert.alert('Order Completed', 'The transaction has been finalized and payment processed.');
      } else {
        Alert.alert('Completion Failed', result.message || 'There was an error finalizing the transaction.');
      }
    } catch (err) {
      console.error('Completion error:', err);
      Alert.alert('Error', 'An unexpected error occurred during completion.');
    } finally {
      setIsCompleting(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleUpdateImage(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleUpdateImage = async (imageAsset) => {
    try {
      setIsUpdatingImage(true);
      await updateProfileImage(imageAsset);
      setShowImageModal(false);
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile photo.');
    } finally {
      setIsUpdatingImage(false);
    }
  };

  const renderNotification = ({ item }) => (
    <View style={styles.notifItem}>
      <View style={[styles.notifIcon, { backgroundColor: item.type === 'error' || item.type === 'DANGER' ? '#FFEBEE' : '#E8F5E9' }]}>
        <MaterialIcons 
          name={item.type === 'error' || item.type === 'DANGER' ? 'sentiment-very-dissatisfied' : 'sentiment-satisfied-alt'} 
          size={20} 
          color={item.type === 'error' || item.type === 'DANGER' ? COLORS.danger : COLORS.success} 
        />
      </View>
      <View style={styles.notifText}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifMessage}>{item.message}</Text>
        <Text style={styles.notifDate}>{item.date}</Text>
      </View>
    </View>
  );

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <View style={styles.orderIcon}>
          <MaterialIcons 
            name={item.status === 'PENDING' ? 'sentiment-satisfied-alt' : item.status === 'DECLINED' ? 'thumb-down' : 'thumb-up'} 
            size={18} 
            color={COLORS.primary} 
          />
        </View>
        <View style={styles.orderDetails}>
          <Text style={styles.orderBuyer}>{isSeller ? (item.buyer_name || item.buyer) : (item.seller_name || 'Vendor')}</Text>
          <Text style={styles.orderTime}>{new Date(item.created_at).toLocaleTimeString()}</Text>
        </View>
        <View style={[styles.statusBadge, styles[`status${item.status}`]]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.orderItemsText}>{item.items}</Text>
      
      {isSeller && item.status === 'PENDING' && (
        <View style={styles.orderActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={() => handleDeclineOrder(item.id)}
          >
            <MaterialIcons name="thumb-down" size={16} color={COLORS.danger} />
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => handleAcceptOrder(item.id)}
          >
            <MaterialIcons name="thumb-up" size={16} color={COLORS.white} />
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {isSeller && item.status === 'ACCEPTED' && (
        <TouchableOpacity 
          style={[styles.actionBtn, styles.readyBtn]}
          onPress={() => handleMarkReady(item.id)}
        >
          <MaterialIcons name="thumb-up" size={16} color={COLORS.white} />
          <Text style={styles.readyBtnText}>Mark as Ready</Text>
        </TouchableOpacity>
      )}

      {isSeller && item.status === 'READY' && (
        <View style={styles.orderActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.chargeBtn]}
            onPress={() => {
              setShowNotificationsModal(false);
              navigation.navigate('Scan', { orderId: item.id, amount: item.amount });
            }}
          >
            <MaterialIcons name="sentiment-satisfied-alt" size={16} color={COLORS.primary} />
            <Text style={styles.chargeBtnText}>Scan to Charge</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.completeBtn]}
            onPress={() => handleMarkCompleted(item.id)}
          >
            <MaterialIcons name="thumb-up" size={16} color={COLORS.white} />
            <Text style={styles.completeBtnText}>Completed</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const combinedNotifsAndOrders = isSeller 
    ? [...orders.filter(o => ['PENDING', 'ACCEPTED', 'READY'].includes(o.status)).map(o => ({ ...o, isOrder: true })), ...notifications.map(n => ({ ...n, isOrder: false }))]
    : [...orders.filter(o => ['ACCEPTED', 'READY', 'DECLINED'].includes(o.status)).map(o => ({ ...o, isOrder: true })), ...notifications.map(n => ({ ...n, isOrder: false }))];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => navigation.navigate('HomeMain')} style={styles.logoBtn}>
            <Image 
              source={require('../res/Logo2.png')} 
              style={styles.headerLogo} 
              resizeMode="contain" 
            />
          </TouchableOpacity>
          <Text style={styles.brand}>SmartBuckz</Text>
        </View>

        {showSearch && (
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <Search size={18} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stores..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <X size={16} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>

            {searchResults.length > 0 && (
              <View style={styles.searchResultsDropdown}>
                {searchResults.map(seller => (
                  <TouchableOpacity 
                    key={seller.id} 
                    style={styles.searchResultItem}
                    onPress={() => handleSelectResult(seller.id)}
                  >
                    <View style={styles.searchResultImage}>
                      {seller.profile_image ? (
                        <Image source={{ uri: seller.profile_image }} style={styles.resultImage} />
                      ) : (
                        <User size={16} color={COLORS.primary} />
                      )}
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{seller.name}</Text>
                      <Text style={styles.resultAddress} numberOfLines={1}>{seller.address}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        
        <View style={styles.rightIcons}>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => setShowNotificationsModal(true)}
          >
            <Bell size={24} color={COLORS.white} />
            {badgeColor && <View style={[styles.badge, { backgroundColor: badgeColor }]} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.profileBtn}
            onPress={() => setShowProfile(true)}
          >
            {user?.profile_image ? (
              <Image source={{ uri: user.profile_image }} style={styles.profileImage} />
            ) : (
              <User size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications & Orders Modal */}
      <Modal visible={showNotificationsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isSeller ? 'Orders & Alerts' : 'Notifications'}</Text>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                <X size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={combinedNotifsAndOrders}
              renderItem={({ item }) => item.isOrder ? renderOrderItem({ item }) : renderNotification({ item })}
              keyExtractor={item => item.isOrder ? `order-${item.id}` : `notif-${item.id}`}
              contentContainerStyle={styles.notifList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Bell size={48} color={COLORS.gray} />
                  <Text style={styles.emptyText}>Nothing new here!</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Profile Summary Modal */}
      <Modal visible={showProfile} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.profileModal}>
            <LinearGradient
              colors={[COLORS.primary, '#004080']}
              style={styles.profileHeader}
            >
              <TouchableOpacity style={styles.largeProfileIcon} onPress={() => setShowImageModal(true)}>
                {user?.profile_image ? (
                  <Image source={{ uri: user.profile_image }} style={styles.profileImage} />
                ) : (
                  <User size={40} color={COLORS.primary} />
                )}
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.white, borderRadius: 12, padding: 4, elevation: 2 }}>
                  <Camera size={14} color={COLORS.primary} />
                </View>
                {isSeller && sellerData.isVerified && (
                  <View style={styles.verifiedBadgeLarge}>
                    <ShieldCheck size={20} color={COLORS.secondary} fill={COLORS.secondary} />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.profileName}>{user?.name || 'Guest User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
              <View style={styles.phoneRow}>
                <Phone size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.profilePhone}>{user?.phone || 'No phone'}</Text>
              </View>
            </LinearGradient>
            
            {isSeller && (
              <View style={styles.availabilitySection}>
                <View style={styles.availabilityText}>
                  <Text style={styles.availabilityLabel}>Store Status</Text>
                  <Text style={[styles.availabilityStatus, { color: sellerData.isAvailable ? COLORS.success : COLORS.danger }]}>
                    {sellerData.isAvailable ? 'Online / Open' : 'Offline / Closed'}
                  </Text>
                </View>
                <Switch
                  value={sellerData.isAvailable}
                  onValueChange={toggleAvailability}
                  trackColor={{ false: '#D1D1D1', true: COLORS.success }}
                  thumbColor={COLORS.white}
                />
              </View>
            )}

            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{isSeller ? sellerData.sales.length : '12'}</Text>
                <Text style={styles.statLabel}>{isSeller ? 'Sales' : 'Orders'}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>Verified</Text>
                <Text style={styles.statLabel}>Status</Text>
              </View>
            </View>

            <View style={styles.profileActions}>
              {isSeller && !sellerData.isVerified && (
                <TouchableOpacity 
                  style={[styles.editBtn, { backgroundColor: COLORS.secondary, marginBottom: 10 }]}
                  onPress={() => {
                    setShowProfile(false);
                    navigation.navigate('Verification');
                  }}
                >
                  <Text style={[styles.editBtnText, { color: COLORS.primary }]}>Get Verified</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.editBtn} onPress={() => setShowImageModal(true)}>
                <Text style={styles.editBtnText}>Update Profile Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setShowProfile(false);
                if (isSeller) {
                  navigation.navigate("SellerProfile");
                } else {
                  navigation.navigate("BuyerProfile");
                }
              }}>
                <Text style={styles.visitProfileText}>Visit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.logoutBtn, { flexDirection: 'row', gap: 10, justifyContent: 'center' }]}
                onPress={() => {
                  setShowProfile(false);
                  logout();
                }}
              >
                <Power size={18} color={COLORS.danger} />
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.logoutBtn, { marginTop: 10, flexDirection: 'row', gap: 10, justifyContent: 'center' }]}
                onPress={() => {
                  setShowProfile(false);
                  setShowReportModal(true);
                }}
              >
                <AlertTriangle size={18} color={COLORS.danger} />
                <Text style={[styles.logoutBtnText, { color: COLORS.danger }]}>Report a User</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.closeProfile}
                onPress={() => setShowProfile(false)}
              >
                <Text style={styles.closeProfileText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ReportUserModal 
        visible={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />

      {/* Order Completion Confirmation Modal */}
      <Modal visible={showCompletionModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmHeader}>
              <View style={styles.warningIconContainer}>
                <AlertTriangle size={32} color={COLORS.secondary} />
              </View>
              <Text style={styles.confirmTitle}>Complete Order?</Text>
            </View>
            
            <View style={styles.confirmBody}>
              <Text style={styles.confirmText}>
                Are you sure you want to mark this order as completed?
              </Text>
              <View style={styles.orderSummaryCard}>
                <Text style={styles.summaryLabel}>Order Items:</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>{selectedOrder?.items}</Text>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount:</Text>
                  <Text style={styles.summaryTotal}>₦{selectedOrder?.amount}</Text>
                </View>
              </View>
              <Text style={styles.confirmSubText}>
                This will finalize the payment and credit your wallet. This action cannot be undone.
              </Text>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.cancelConfirmBtn]} 
                onPress={() => {
                  setShowCompletionModal(false);
                  setSelectedOrder(null);
                }}
                disabled={isCompleting}
              >
                <Text style={styles.cancelConfirmText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.saveConfirmBtn]} 
                onPress={confirmCompletion}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveConfirmText}>Yes, Complete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Image Update Modal */}
      <Modal visible={showImageModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmHeader}>
              <View style={styles.warningIconContainer}>
                <Camera size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.confirmTitle}>Update Profile Photo</Text>
            </View>
            
            <View style={styles.confirmBody}>
              <Text style={styles.confirmText}>
                Choose a new profile photo from your device gallery.
              </Text>
              
              <TouchableOpacity 
                style={styles.pickImageBtn} 
                onPress={pickImage}
                disabled={isUpdatingImage}
              >
                <View style={styles.pickImageContent}>
                  <Image size={24} color={COLORS.primary} />
                  <Text style={styles.pickImageText}>Select Image from Gallery</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.modalHelpText}>
                Supported formats: JPEG, PNG. Max size: 5MB.
              </Text>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.cancelConfirmBtn]} 
                onPress={() => setShowImageModal(false)}
                disabled={isUpdatingImage}
              >
                <Text style={styles.cancelConfirmText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.primary,
    zIndex: 1000,
  },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    zIndex: 1001,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 32,
    height: 32,
    padding: 10,
    borderRadius: 10
  },
  brand: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  searchWrapper: {
    flex: 1,
    marginHorizontal: 15,
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  searchResultsDropdown: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1001,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    gap: 10,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  resultAddress: {
    fontSize: 11,
    color: COLORS.darkGray,
  },
  searchResultImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    marginLeft: 8,
    fontSize: 14,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'flex-end',
  },
  iconBtn: {
    position: 'relative',
    padding: 5,
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  notifUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: '90%',
    padding: 20,
    marginTop: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  notifList: {
    paddingBottom: 20,
  },
  notifItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    marginBottom: 10,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notifText: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  notifMessage: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  notifDate: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 5,
  },
  orderItem: {
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,51,102,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  orderDetails: {
    flex: 1,
    marginLeft: 10,
  },
  orderBuyer: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  orderTime: {
    fontSize: 11,
    color: COLORS.darkGray,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusPENDING: {
    backgroundColor: '#FFF3E0',
  },
  statusACCEPTED: {
    backgroundColor: '#E8F5E9',
  },
  statusREADY: {
    backgroundColor: '#E3F2FD',
  },
  statusDECLINED: {
    backgroundColor: '#FFEBEE',
  },
  statusCOMPLETED: {
    backgroundColor: '#F5F5F5',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  orderItemsText: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  acceptBtn: {
    backgroundColor: COLORS.success,
  },
  acceptBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  readyBtn: {
    backgroundColor: COLORS.primary,
  },
  readyBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  chargeBtn: {
    backgroundColor: COLORS.secondary,
  },
  chargeBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  completeBtn: {
    backgroundColor: COLORS.success,
  },
  completeBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  declineBtn: {
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  declineBtnText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  profileModal: {
    backgroundColor: COLORS.white,
    borderRadius: 0,
    margin: 0,
    overflow: 'hidden',
    alignSelf: 'flex-end',
    width: '70%',
    height: '100%',
  },
  profileHeader: {
    padding: 30,
    alignItems: 'center',
  },
  largeProfileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  profilePhone: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  availabilitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  availabilityText: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  availabilityStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  profileStats: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 4,
  },
  profileActions: {
    padding: 20,
    gap: 10,
  },
  editBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  editBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  visitProfileText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontWeight: 'bold',
  },
  closeProfile: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeProfileText: {
    color: COLORS.darkGray,
  },
  verifiedBadgeLarge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 2,
  },
  confirmModal: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  confirmBody: {
    marginBottom: 24,
  },
  confirmText: {
    fontSize: 16,
    color: COLORS.black,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  orderSummaryCard: {
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  confirmSubText: {
    fontSize: 13,
    color: COLORS.danger,
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelConfirmBtn: {
    backgroundColor: COLORS.gray,
  },
  saveConfirmBtn: {
    backgroundColor: COLORS.primary,
  },
  cancelConfirmText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  saveConfirmText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  modalInput: {
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: COLORS.black,
    marginTop: 10,
  },
  modalHelpText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 8,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 5,
  },
  pickImageBtn: {
    backgroundColor: COLORS.gray,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 10,
  },
  pickImageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default GlobalHeader;
