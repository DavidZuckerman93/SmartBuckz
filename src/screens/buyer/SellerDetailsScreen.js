import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { MapPin, Star, Clock, ArrowLeft, ShoppingBag, CreditCard, StarOff, CheckCircle, Info, Send, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalHeader from '../../components/GlobalHeader';
import { sellerService } from '../../services/api';

const SellerDetailsScreen = ({ navigation, route }) => {
  const { sellerId } = route.params;
  const { setNotifications, sellerData, user, orders, placeOrder } = useUser();
  
  const [seller, setSeller] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsOffset, setReviewsOffset] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const REVIEWS_LIMIT = 16;

  // Review Modal State
  const [showRateModal, setShowRateModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [orderItems, setOrderItems] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const sellerInfo = await sellerService.getSellerDetails(sellerId);
      setSeller(sellerInfo);
      
      const reviewsData = await sellerService.getSellerReviews(sellerId, REVIEWS_LIMIT, 0);
      setReviews(reviewsData);
      setHasMoreReviews(reviewsData.length === REVIEWS_LIMIT);
      setReviewsOffset(REVIEWS_LIMIT);

      const menuData = await sellerService.getSellerMenu(sellerId);
      setMenuItems(menuData);
    } catch (err) {
      console.error('Error fetching seller details:', err);
      Alert.alert('Error', 'Could not load vendor details.');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadMoreReviews = async () => {
    if (!hasMoreReviews || loadingReviews) return;

    try {
      setLoadingReviews(true);
      const data = await sellerService.getSellerReviews(sellerId, REVIEWS_LIMIT, reviewsOffset);
      setReviews(prev => [...prev, ...data]);
      setHasMoreReviews(data.length === REVIEWS_LIMIT);
      setReviewsOffset(prev => prev + REVIEWS_LIMIT);
    } catch (err) {
      console.error('Error loading more reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleAddReview = async () => {
    if (!newComment.trim()) {
      Alert.alert('Incomplete', 'Please write a comment.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      await sellerService.addReview(sellerId, { rating: newRating, comment: newComment });
      
      // Refresh reviews and seller details (to update avg rating)
      const updatedSeller = await sellerService.getSellerDetails(sellerId);
      setSeller(updatedSeller);
      
      const freshReviews = await sellerService.getSellerReviews(sellerId, REVIEWS_LIMIT, 0);
      setReviews(freshReviews);
      setReviewsOffset(REVIEWS_LIMIT);
      setHasMoreReviews(freshReviews.length === REVIEWS_LIMIT);

      setShowRateModal(false);
      setNewComment('');
      setNewRating(5);
      Alert.alert('Success', 'Thank you for your review!');
    } catch (err) {
      console.error('Error adding review:', err);
      Alert.alert('Error', 'Failed to post review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const existingOrder = orders.find(o => o.seller_id === sellerId && ['PENDING', 'ACCEPTED', 'READY'].includes(o.status));

  const handlePlaceOrder = async () => {
    if (!orderItems.trim()) {
      Alert.alert('Incomplete Order', 'Please specify what you want to eat.');
      return;
    }

    try {
      setIsOrdering(true);
      await placeOrder({
        seller_id: sellerId,
        items: orderItems,
        amount: 0 // Will be finalized by seller or set later
      });
      
      setIsOrdering(false);
      setShowOrderModal(false);
      setOrderItems('');
      Alert.alert('Order Placed!', 'The vendor has been notified. You can track your order in the Home screen.', [
        { text: 'OK', onPress: () => navigation.navigate('HomeMain') }
      ]);
    } catch (err) {
      console.error('Order placement failed:', err);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  if (loading || !seller) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderReview = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View style={styles.reviewerAvatar}>
            {item.reviewer_image ? (
              <Image source={{ uri: item.reviewer_image }} style={styles.reviewerImage} />
            ) : (
              <User size={14} color={COLORS.primary} />
            )}
          </View>
          <Text style={styles.reviewerName}>{item.reviewer_name}</Text>
        </View>
        <View style={styles.reviewStars}>
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={12} color={i <= item.rating ? COLORS.secondary : COLORS.gray} fill={i <= item.rating ? COLORS.secondary : 'transparent'} />
          ))}
        </View>
      </View>
      <Text style={styles.reviewText}>{item.comment}</Text>
      <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader navigation={navigation} showSearch={true} />
      <FlatList
        ListHeaderComponent={
          <>
            {/* <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ArrowLeft size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Vendor Details</Text>
              <View style={{ width: 40 }} />
            </View> */}

            <LinearGradient
              colors={[COLORS.primary, '#004080']}
              style={styles.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                {seller.profile_image ? (
                  <Image source={{ uri: seller.profile_image }} style={styles.sellerAvatar} />
                ) : (
                  <View style={styles.sellerAvatarPlaceholder}>
                    <User size={32} color={COLORS.primary} />
                  </View>
                )}
                <View style={styles.heroInfo}>
                  <Text style={styles.heroName}>{seller.name}</Text>
                  <View style={styles.ratingBox}>
                    <Star size={16} color={COLORS.secondary} fill={COLORS.secondary} />
                    <Text style={styles.ratingVal}>{seller.rating}</Text>
                    <Text style={styles.reviewCount}>({seller.reviewCount} reviews)</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: seller.isAvailable ? COLORS.success : COLORS.danger }]}>
                <Text style={styles.statusBadgeText}>{seller.isAvailable ? 'AVAILABLE' : 'CLOSED'}</Text>
              </View>
            </LinearGradient>

            <View style={styles.infoSection}>
              {existingOrder && (
                <View style={[styles.statusBanner, styles[`banner${existingOrder.status}`]]}>
                  <CheckCircle size={18} color={existingOrder.status === 'Accepted' ? COLORS.success : (existingOrder.status === 'Declined' ? COLORS.danger : COLORS.primary)} />
                  <Text style={styles.statusBannerText}>Your order is {existingOrder.status}</Text>
                </View>
              )}

              <View style={styles.infoItem}>
                <MapPin size={20} color={COLORS.primary} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{seller.address}</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Clock size={20} color={COLORS.primary} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Opening Hours</Text>
                  <Text style={styles.infoValue}>08:00 AM - 10:00 PM</Text>
                </View>
              </View>
            </View>

            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Vendor Specialties</Text>
              <View style={styles.menuGrid}>
                {menuItems.length > 0 ? (
                  menuItems.map(item => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={[styles.menuItem, !item.is_available && styles.disabledMenuItem]}
                      onPress={() => {
                        if (item.is_available) {
                          setOrderItems(prev => prev ? `${prev}, ${item.name}` : item.name);
                          setShowOrderModal(true);
                        } else {
                          Alert.alert('Unavailable', 'This item is currently out of stock.');
                        }
                      }}
                    >
                      <Text style={styles.menuItemText}>{item.name}</Text>
                      <Text style={styles.menuItemPrice}>₦{parseFloat(item.price).toLocaleString()}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyMenuText}>No specialties listed yet.</Text>
                )}
              </View>
            </View>

            <View style={styles.ratingSectionHeader}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
            </View>
          </>
        }
        data={reviews}
        renderItem={renderReview}
        keyExtractor={item => item.id.toString()}
        onEndReached={loadMoreReviews}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingReviews ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 20 }} />
          ) : reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Text style={styles.emptyReviewsText}>No reviews yet. Be the first to rate!</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.scrollContent}
      />

      <View style={styles.footerActions}>
        <TouchableOpacity 
          style={[styles.orderBtn, !seller.isAvailable && styles.disabledBtn]}
          onPress={() => setShowOrderModal(true)}
          disabled={!seller.isAvailable}
        >
          <ShoppingBag size={20} color={COLORS.white} />
          <Text style={styles.orderBtnText}>Place Order Now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.rateBtn}
          onPress={() => setShowRateModal(true)}
        >
          <Star size={20} color={COLORS.primary} />
          <Text style={styles.rateBtnText}>Rate</Text>
        </TouchableOpacity>
      </View>

      {/* Order Modal */}
      <Modal visible={showOrderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Place Your Order</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <StarOff size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>What would you like to order?</Text>
            <TextInput
              style={styles.orderInput}
              placeholder="e.g., 2 portions of Jollof Rice with Chicken"
              multiline
              numberOfLines={4}
              value={orderItems}
              onChangeText={setOrderItems}
            />
            
            <View style={styles.orderSummary}>
              <Info size={16} color={COLORS.primary} />
              <Text style={styles.orderSummaryText}>You will be charged when you arrive and scan your card.</Text>
            </View>

            <TouchableOpacity 
              style={[styles.confirmBtn, isOrdering && styles.disabledBtn]}
              onPress={handlePlaceOrder}
              disabled={isOrdering}
            >
              <Text style={styles.confirmBtnText}>{isOrdering ? 'Processing...' : 'Confirm Order'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal visible={showRateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Vendor</Text>
              <TouchableOpacity onPress={() => setShowRateModal(false)}>
                <Text style = {{color: COLORS.primary, fontSize: 24}}>
                    X
                </Text>
                
              </TouchableOpacity>
            </View>
            
            <View style={styles.starSelection}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setNewRating(i)}>
                  <Star size={40} color={i <= newRating ? COLORS.secondary : COLORS.gray} fill={i <= newRating ? COLORS.secondary : 'transparent'} />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Tell us about your experience..."
              multiline
              numberOfLines={4}
              value={newComment}
              onChangeText={setNewComment}
            />

            <TouchableOpacity 
              style={[styles.confirmBtn, isSubmittingReview && styles.disabledBtn]}
              onPress={handleAddReview}
              disabled={isSubmittingReview}
            >
              <Text style={styles.confirmBtnText}>{isSubmittingReview ? 'Posting...' : 'Post Review'}</Text>
            </TouchableOpacity>
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  hero: {
    padding: 25,
    paddingTop: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sellerAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  ratingVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  reviewCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  infoSection: {
    padding: 20,
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 2,
  },
  menuSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  menuItem: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  menuItemPrice: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
    fontWeight: '600',
  },
  disabledMenuItem: {
    opacity: 0.5,
  },
  emptyMenuText: {
    color: COLORS.darkGray,
    fontStyle: 'italic',
  },
  ratingSectionHeader: {
    padding: 20,
  },
  reviewCard: {
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  reviewerImage: {
    width: '100%',
    height: '100%',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 10,
    color: COLORS.darkGray,
    marginTop: 5,
    textAlign: 'right',
  },
  ratingSectionHeader: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  emptyReviews: {
    padding: 40,
    alignItems: 'center',
  },
  emptyReviewsText: {
    color: COLORS.darkGray,
    fontStyle: 'italic',
  },
  starSelection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  commentInput: {
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    gap: 15,
  },
  orderBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 10,
  },
  orderBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  rateBtn: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rateBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  disabledBtn: {
    backgroundColor: COLORS.gray,
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
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
  modalLabel: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 10,
  },
  orderInput: {
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
  },
  orderSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 15,
    padding: 10,
    backgroundColor: 'rgba(0, 51, 102, 0.05)',
    borderRadius: 8,
  },
  orderSummaryText: {
    fontSize: 12,
    color: COLORS.primary,
    flex: 1,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 25,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SellerDetailsScreen;
