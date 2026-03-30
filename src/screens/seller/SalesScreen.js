import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, FlatList, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { ArrowLeft, Search, Download, TrendingUp, RefreshCcw, X } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import GlobalHeader from '../../components/GlobalHeader';

const SalesScreen = ({ navigation }) => {
  const { sellerData, refundPayment, fetchUserData, fetchNotifications } = useUser();
  const [search, setSearch] = useState('');
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isRefunding, setIsRefunding] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchNotifications();
    }, [])
  );

  const filteredSales = sellerData.sales.filter(sale => 
    sale.buyer.toLowerCase().includes(search.toLowerCase()) || 
    sale.amount.toString().includes(search)
  );

  const handleRefundPress = (sale) => {
    setSelectedSale(sale);
    setRefundModalVisible(true);
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
      Alert.alert('Error', err.response?.data?.message || 'Failed to process refund.');
    } finally {
      setIsRefunding(false);
      setSelectedSale(null);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.saleItem}>
      <View style={styles.saleIcon}>
        <MaterialIcons name="thumb-up" size={20} color={COLORS.success} />
      </View>
      <View style={styles.saleDetails}>
        <Text style={styles.saleBuyer}>{item.buyer}</Text>
        <Text style={styles.saleDate}>{item.date} • {item.status}</Text>
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
  );

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader navigation={navigation} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Sales</Text>
        <TouchableOpacity>
          <Download size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.darkGray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Buyer or Amount"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredSales}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <TrendingUp size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No sales found matching your search.</Text>
          </View>
        }
      />

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
              Refund <Text style={{fontWeight: 'bold'}}>₦{selectedSale?.amount.toLocaleString()}</Text> to <Text style={{fontWeight: 'bold'}}>{selectedSale?.buyer}</Text>?
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
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  saleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
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
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  saleAction: {
    alignItems: 'flex-end',
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
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    paddingHorizontal: 40,
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
    marginBottom: 25,
    lineHeight: 22,
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
});

export default SalesScreen;
