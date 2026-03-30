import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, FlatList, Image, RefreshControl } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { Plus, CreditCard, History, Send, Search, MapPin, Star, Clock, CheckCircle2, QrCode, User, Bell } from 'lucide-react-native';
import QRCodeModal from '../../components/QRCodeModal';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalHeader from '../../components/GlobalHeader';
import QRCode from 'react-native-qrcode-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const ActiveOrderCard = ({ order, navigation }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const startTime = order.accepted_at ? new Date(order.accepted_at) : null;
    if (!startTime) {
      setElapsed('Awaiting Acceptance');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = Math.floor((now - startTime) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setElapsed(`${mins}m ${secs}s since accepted`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [order.accepted_at]);

  return (
    <TouchableOpacity 
      style={styles.activeOrderCard}
      onPress={() => navigation.navigate('SellerDetails', { sellerId: order.seller_id })}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderSellerInfo}>
          {order.seller_image ? (
            <Image source={{ uri: order.seller_image }} style={styles.orderSellerImage} />
          ) : (
            <View style={styles.orderSellerPlaceholder}>
              <User size={12} color={COLORS.primary} />
            </View>
          )}
          <Text style={styles.orderSeller}>{order.seller_name}</Text>
        </View>
        <View style={[styles.orderStatusBadge, styles[`status${order.status}`]]}>
          <Text style={styles.orderStatusText}>{order.status}</Text>
        </View>
      </View>
      <Text style={styles.orderItems} numberOfLines={1}>{order.items}</Text>
      <View style={styles.orderFooter}>
        <Clock size={14} color={COLORS.primary} />
        <Text style={styles.orderTimer}>{elapsed}</Text>
      </View>
      {order.status === 'READY' && (
        <View style={styles.readyBanner}>
          <MaterialIcons name="thumb-up" size={14} color={COLORS.white} />
          <Text style={styles.readyText}>Ready for Pickup!</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const BuyerHomeScreen = ({ navigation }) => {
  const { wallet, cards, user, registeredSellers, orders, notifications, fetchOrders, fetchNotifications, fetchUserData, setShowNotificationsModal } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const activeOrders = orders.filter(o => ['PENDING', 'ACCEPTED', 'READY'].includes(o.status));
  const recentNotifications = notifications.slice(0, 3);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOrders(),
      fetchNotifications(),
      fetchUserData()
    ]);
    setRefreshing(false);
  }, [fetchOrders, fetchNotifications, fetchUserData]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
      fetchNotifications();
      fetchUserData();
    }, [])
  );

  const defaultCard = cards.find(c => c.is_default === 1) || cards[0];

  const filteredSellers = registeredSellers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popularSellers = registeredSellers.slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader 
        navigation={navigation} 
        showSearch={true} 
        onSearchChange={setSearchQuery}
      />
      
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
          colors={['#0e1822ff', '#436892ff', '#02070eff']}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <View style = {{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={styles.balanceAmount}>₦{wallet.balance.toLocaleString()}</Text>
              <View style={{padding: 8, background: 'white', borderWidth: 0, borderRadius: 10, marginTop: -10, marginBottom: 10, marginRight: 10}}>
                 <QRCode value={user.qr_code_path} size={90} color={COLORS.primary} />
              </View>
             
          </View>
        
          <View style={styles.balanceFooter}>
            <Text style={styles.walletId}>Wallet ID: SB-9901</Text>
            <TouchableOpacity 
              style={styles.fundBtn}
              onPress={() => navigation.navigate('Funding')}
            >
              <MaterialIcons name="thumb-up" size={16} color={COLORS.primary} />
              <Text style={styles.fundText}>Fund Wallet</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('Funding')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <MaterialIcons name="thumb-up" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Fund Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF9C4' }]}>
              <MaterialIcons name="thumb-down" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.actionLabel}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('History')}>
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <MaterialIcons name="sentiment-satisfied-alt" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>
        </View>

        {activeOrders.length > 0 && (
          <View style={styles.activeOrdersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Orders</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeOrdersScroll}>
              {activeOrders.map(order => (
                <ActiveOrderCard key={order.id} order={order} navigation={navigation} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Default Card</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Cards')}>
            <Text style={styles.seeAll}>Manage</Text>
          </TouchableOpacity>
        </View>

        {defaultCard && (
          <TouchableOpacity 
            style={styles.miniCard}
            onPress={() => navigation.navigate('Cards')}
          >
            <LinearGradient
              colors={['#806107ff', COLORS.secondary, '#FFC107', '#FFC107']}
              style={styles.miniCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.miniCardContent}>
                <Text style={styles.miniCardBrand}>SmartBuckz Meal Card</Text>
                <View style={styles.miniCardHeader}>
                  <CreditCard size={24} color={COLORS.white} />
                  <View style={styles.miniCardInfo}>
                    <Text style={styles.miniCardNumber}>{defaultCard.cardNumber}</Text>
                    <Text style={styles.miniCardLimit}>Limit: ₦{defaultCard.dailyLimit}</Text>
                  </View>
                  <Text style={styles.defaultTag}>DEFAULT</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}



        {/* Recent Notifications */}
        {recentNotifications.length > 0 && (
          <View style={styles.notificationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationsModal(true)}>
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
          <Text style={styles.sectionTitle}>Popular Vendors</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Discovery')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sellerScroll}>
          {popularSellers.length > 0 ? (
            popularSellers.map(seller => (
              <TouchableOpacity 
                key={seller.id} 
                style={styles.sellerCard}
                onPress={() => navigation.navigate('SellerDetails', { sellerId: seller.id })}
              >
                <View style={styles.sellerImagePlaceholder}>
                  {seller.profile_image ? (
                    <Image source={{ uri: seller.profile_image }} style={styles.sellerCardImage} />
                  ) : (
                    <User size={32} color={COLORS.primary} />
                  )}
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName} numberOfLines={1}>{seller.name}</Text>
                  <View style={styles.sellerRating}>
                    <Star size={12} color={COLORS.secondary} fill={COLORS.secondary} />
                    <Text style={styles.sellerRatingText}>{seller.rating}</Text>
                    <Text style={styles.sellerDistance}>• {seller.distance}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noSellersContainer}>
              <Text style={styles.noSellersText}>No registered vendors available yet.</Text>
            </View>
          )}
        </ScrollView>
      </ScrollView>

      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setShowQRModal(true)}
      >
        <QrCode size={32} color={COLORS.primary} />
      </TouchableOpacity>

      <QRCodeModal 
        visible={showQRModal} 
        onClose={() => setShowQRModal(false)} 
        card={defaultCard} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: 5,
  },
  balanceCard: {
    padding: 25,
    borderRadius: 30,
    marginBottom: 30,
    marginTop: 5,
    width: '95vw',
    marginLeft: '1.5vw'
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  walletId: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  fundBtn: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fundText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionItem: {
    alignItems: 'center',
    width: '30%',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  notificationsSection: {
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  notifList: {
    backgroundColor: COLORS.gray,
    borderRadius: 20,
    padding: 10,
    marginHorizontal: 10,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  seeAll: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  miniCard: {
    marginBottom: 30,
    borderRadius: 30,
    overflow: 'hidden',
    width: '95vw',
    marginLeft: '1.5vw'
  },
  miniCardGradient: {
    padding: 15,
  },
  miniCardContent: {
    width: '100%',
  },
  miniCardBrand: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 8,
    opacity: 0.9,
  },
  miniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniCardInfo: {
    flex: 1,
    marginLeft: 15,
  },
  miniCardNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  miniCardLimit: {
    fontSize: 12,
    color: 'white',
    marginTop: 2,
  },
  defaultTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sellerScroll: {
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '95vw'
  },
  sellerCard: {
    width: 160,
    backgroundColor: COLORS.gray,
    borderRadius: 30,
    marginRight: 15,
    overflow: 'hidden',
  },
  sellerImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sellerCardImage: {
    width: '100%',
    height: '100%',
  },
  sellerInfo: {
    padding: 12,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  sellerRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  sellerDistance: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  noSellersContainer: {
    padding: 20,
    width: '90vw',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  noSellersText: {
    color: COLORS.darkGray,
    fontSize: 14,
    fontStyle: 'italic',
  },
  activeOrdersSection: {
    marginBottom: 30,
  },
  activeOrdersScroll: {
    paddingLeft: 20,
  },
  activeOrderCard: {
    width: 280,
    backgroundColor: COLORS.gray,
    borderRadius: 20,
    padding: 15,
    marginRight: 15,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderSellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderSellerImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  orderSellerPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderSeller: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPENDING: { backgroundColor: '#FFF3E0' },
  statusACCEPTED: { backgroundColor: '#E1F5FE' },
  statusREADY: { backgroundColor: '#E8F5E9' },
  orderStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  orderItems: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginBottom: 10,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderTimer: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  readyBanner: {
    marginTop: 10,
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  readyText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    backgroundColor: COLORS.secondary,
    width: 65,
    height: 65,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});

export default BuyerHomeScreen;
