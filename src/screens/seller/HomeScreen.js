import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, FlatList, Alert, Modal, ActivityIndicator, TextInput, Image, RefreshControl } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { LayoutDashboard, TrendingUp, Users, AlertTriangle, Download, QrCode, Clock, Check, X, RefreshCcw, Search, User, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalHeader from '../../components/GlobalHeader';
import { userService } from '../../services/api';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const SellerHomeScreen = ({ navigation }) => {
  const { sellerData, user, notifications, refundPayment, fetchNotifications, fetchOrders, fetchUserData } = useUser();
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // General Refund State
  const [generalRefundModalVisible, setGeneralRefundModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');

  const recentNotifications = notifications.slice(0, 3);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchNotifications(),
      fetchOrders(),
      fetchUserData()
    ]);
    setRefreshing(false);
  }, [fetchNotifications, fetchOrders, fetchUserData]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      fetchOrders();
      fetchUserData();
    }, [])
  );

  // Handle Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const results = await userService.searchUsers(searchQuery);
          setSearchResults(results.filter(u => u.role === 'BUYER'));
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRefundPress = (sale) => {
    setSelectedSale(sale);
    setRefundModalVisible(true);
  };

  const handleGeneralRefundPress = () => {
    setGeneralRefundModalVisible(true);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setRefundAmount('');
  };

  const processRefund = async () => {
    if (!selectedSale) return;

    setIsRefunding(true);
    try {
      await refundPayment({
        transactionId: selectedSale.id,
        amount: selectedSale.amount,
        buyerId: selectedSale.buyer_id,
        cardId: selectedSale.card_id
      });

      Alert.alert('Success', `Refund of ₦${selectedSale.amount.toLocaleString()} to ${selectedSale.buyer} processed successfully.`);
      setRefundModalVisible(false);
    } catch (err) {
      console.error('Refund error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to process refund. Check your balance.');
    } finally {
      setIsRefunding(false);
      setSelectedSale(null);
    }
  };

  const processGeneralRefund = async () => {
    if (!selectedUser || !refundAmount || isNaN(refundAmount)) {
      Alert.alert('Error', 'Please select a user and enter a valid amount.');
      return;
    }

    if (parseFloat(refundAmount) > sellerData.balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds for this refund.');
      return;
    }

    setIsRefunding(true);
    try {
      await refundPayment({
        amount: parseFloat(refundAmount),
        buyerId: selectedUser.id,
        // No cardId means it goes to main wallet
      });

      Alert.alert('Success', `Refund of ₦${parseFloat(refundAmount).toLocaleString()} to ${selectedUser.name} processed successfully.`);
      setGeneralRefundModalVisible(false);
    } catch (err) {
      console.error('General refund error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to process refund.');
    } finally {
      setIsRefunding(false);
    }
  };

  const StatsCard = ({ title, value, icon, color }) => (
    <View style={styles.statsCard}>
      <View style={[styles.statsIcon, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statsTitle}>{title}</Text>
        <Text style={styles.statsValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader navigation={navigation} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <LinearGradient
          colors={[COLORS.secondary, '#FFC107']}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.balanceLabel}>Withdrawable Balance</Text>
          <Text style={styles.balanceAmount}>₦{sellerData.balance.toLocaleString()}</Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity 
              style={styles.withdrawBtn}
              onPress={() => navigation.navigate('Withdraw')}
            >
              <Text style={styles.withdrawText}>Withdraw Funds</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.homeRefundBtn}
              onPress={handleGeneralRefundPress}
            >
              <MaterialIcons name="sentiment-satisfied-alt" size={16} color={COLORS.primary} />
              <Text style={styles.homeRefundText}>Refund User</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatsCard 
            title="Today's Sales" 
            value={`₦${sellerData.sales.reduce((acc, s) => acc + s.amount, 0).toLocaleString()}`} 
            icon="thumb-up" 
            color={COLORS.success} 
          />
          <StatsCard 
            title="Reports" 
            value={sellerData.reports.length.toString()} 
            icon="sentiment-very-dissatisfied" 
            color={COLORS.danger} 
          />
        </View>

        <TouchableOpacity 
          style={styles.scanActionCard}
          onPress={() => navigation.navigate('Scan')}
        >
          <LinearGradient
            colors={[COLORS.primary, '#004080']}
            style={styles.scanGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.scanInfo}>
              <Text style={styles.scanTitle}>Charge a Card</Text>
              <Text style={styles.scanSubtitle}>Scan customer QR code to receive payment</Text>
            </View>
            <View style={styles.scanIconContainer}>
              <QrCode size={32} color={COLORS.secondary} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Recent Notifications */}
        {recentNotifications.length > 0 && (
          <View style={styles.notificationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Notifications</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.notifList}>
              {recentNotifications.map((notif) => (
                <View key={notif.id} style={styles.miniNotifItem}>
                  <View style={[styles.miniNotifIcon, { backgroundColor: notif.type === 'error' || notif.type === 'DANGER' ? '#FFEBEE' : '#E8F5E9' }]}>
                    <MaterialIcons 
                      name={notif.type === 'error' || notif.type === 'DANGER' ? 'sentiment-very-dissatisfied' : 'sentiment-satisfied-alt'} 
                      size={16} 
                      color={notif.type === 'error' || notif.type === 'DANGER' ? COLORS.danger : COLORS.success} 
                    />
                  </View>
                  <View style={styles.miniNotifContent}>
                    <Text style={styles.miniNotifTitle} numberOfLines={1}>{notif.title}</Text>
                    <Text style={styles.miniNotifMessage} numberOfLines={1}>{notif.message}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Sales')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {sellerData.sales.slice(0, 5).map((item) => (
          <View key={item.id} style={styles.saleItem}>
            <View style={styles.saleIcon}>
              <MaterialIcons name="thumb-up" size={20} color={COLORS.success} />
            </View>
            <View style={styles.saleDetails}>
              <Text style={styles.saleBuyer}>{item.buyer}</Text>
              <Text style={styles.saleDate}>{item.date}</Text>
            </View>
            <View style={styles.saleAction}>
              <Text style={styles.saleAmount}>+₦{item.amount.toLocaleString()}</Text>
              <TouchableOpacity 
                style={styles.refundLink}
                onPress={() => handleRefundPress(item)}
              >
                <MaterialIcons name="sentiment-satisfied-alt" size={12} color={COLORS.primary} />
                <Text style={styles.refundLinkText}>Refund</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Refund Confirmation Modal */}
      <Modal
        visible={refundModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRefundModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.refundIconContainer}>
              <MaterialIcons name="sentiment-satisfied-alt" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Confirm Refund</Text>
            <Text style={styles.modalSubtitle}>
              You are about to refund <Text style={{fontWeight: 'bold'}}>₦{selectedSale?.amount.toLocaleString()}</Text> to <Text style={{fontWeight: 'bold'}}>{selectedSale?.buyer}</Text>.
            </Text>
            <Text style={styles.modalWarning}>
              This action will deduct the amount from your withdrawable balance and credit it back to the customer's card.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setRefundModalVisible(false)}
                disabled={isRefunding}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmBtn]} 
                onPress={processRefund}
                disabled={isRefunding}
              >
                {isRefunding ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Refund</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* General User Refund Modal */}
      <Modal
        visible={generalRefundModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setGeneralRefundModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%', padding: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Refund a Customer</Text>
              <TouchableOpacity onPress={() => setGeneralRefundModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <MaterialIcons name="search" size={20} color={COLORS.darkGray} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
              </View>
            </View>

            {!selectedUser ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.userResult}
                    onPress={() => setSelectedUser(item)}
                  >
                    <View style={styles.userAvatar}>
                      {item.profile_image ? (
                        <Image source={{ uri: item.profile_image }} style={styles.avatarImg} />
                      ) : (
                        <MaterialIcons name="person" size={20} color={COLORS.primary} />
                      )}
                    </View>
                    <View>
                      <Text style={styles.userName}>{item.name}</Text>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyResults}>
                    <Text style={styles.emptyResultsText}>
                      {searchQuery.length < 2 ? 'Enter at least 2 characters to search' : 'No customers found'}
                    </Text>
                  </View>
                }
              />
            ) : (
              <View style={styles.refundForm}>
                <View style={styles.selectedUserCard}>
                  <Text style={styles.selectedLabel}>Refunding to:</Text>
                  <View style={styles.userResult}>
                    <View style={styles.userAvatar}>
                      <MaterialIcons name="person" size={20} color={COLORS.primary} />
                    </View>
                    <View>
                      <Text style={styles.userName}>{selectedUser.name}</Text>
                      <Text style={styles.userEmail}>{selectedUser.email}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.changeUserBtn}
                      onPress={() => setSelectedUser(null)}
                    >
                      <Text style={styles.changeUserText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.amountInputSection}>
                  <Text style={styles.inputLabel}>Enter Refund Amount</Text>
                  <View style={styles.amountInputBox}>
                    <Text style={styles.currencyPrefix}>₦</Text>
                    <TextInput
                      style={styles.amountTextInput}
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={refundAmount}
                      onChangeText={setRefundAmount}
                      autoFocus
                    />
                  </View>
                  <Text style={styles.balanceHint}>Available: ₦{sellerData.balance.toLocaleString()}</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.processRefundBtn, isRefunding && styles.disabledBtn]}
                  onPress={processGeneralRefund}
                  disabled={isRefunding}
                >
                  {isRefunding ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.processRefundText}>Complete Refund</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: 20,
  },
  balanceCard: {
    padding: 25,
    borderRadius: 24,
    marginBottom: 25,
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(0,51,102,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    color: COLORS.primary,
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  withdrawBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  withdrawText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  homeRefundBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  homeRefundText: {
    color: COLORS.primary,
    fontWeight: 'bold',    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statsCard: {
    width: '48%',
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  scanActionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
  },
  scanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 25,
  },
  scanInfo: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scanSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  scanIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationsSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  notifList: {
    backgroundColor: COLORS.gray,
    borderRadius: 20,
    padding: 10,
  },
  miniNotifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  miniNotifIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  miniNotifContent: {
    flex: 1,
  },
  miniNotifTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  miniNotifMessage: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  saleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.gray,
    borderRadius: 16,
    marginBottom: 12,
  },
  saleIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saleDetails: {
    flex: 1,
    marginLeft: 15,
  },
  saleBuyer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  saleDate: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  saleAction: {
    alignItems: 'flex-end',
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  saleStatus: {
    fontSize: 10,
    color: COLORS.darkGray,
    marginTop: 4,
  },
  refundLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  refundLinkText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 30,
    width: '100%',
    alignItems: 'center',
  },
  refundIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  modalWarning: {
    fontSize: 13,
    color: COLORS.danger,
    textAlign: 'center',
    backgroundColor: '#FFF1F0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 25,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.gray,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
  },
  cancelBtnText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  searchSection: {
    width: '100%',
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    gap: 10,
  },
  userResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    width: '100%',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  emptyResults: {
    padding: 20,
    alignItems: 'center',
  },
  emptyResultsText: {
    color: COLORS.darkGray,
    fontSize: 14,
  },
  refundForm: {
    width: '100%',
    gap: 20,
  },
  selectedUserCard: {
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 16,
  },
  selectedLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  changeUserBtn: {
    marginLeft: 'auto',
    padding: 8,
  },
  changeUserText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  amountInputSection: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingVertical: 10,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 10,
  },
  amountTextInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.black,
    flex: 1,
  },
  balanceHint: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'right',
  },
  processRefundBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  processRefundText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});

export default SellerHomeScreen;
