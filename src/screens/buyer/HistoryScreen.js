import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, FlatList, Modal, ScrollView, TextInput } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { ArrowLeft, Plus, History, ArrowUpRight, ArrowDownLeft, Search, Calendar, Filter, CheckCircle2, AlertCircle, X, Download } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalHeader from '../../components/GlobalHeader';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const HistoryScreen = ({ navigation }) => {
  const { wallet, fetchUserData, fetchNotifications } = useUser();
  const [activeTab, setActiveTab] = useState('All');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchNotifications();
    }, [])
  );

  const filteredHistory = wallet.history.filter(item => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Funding') return item.type === 'FUNDING';
    if (activeTab === 'Purchases') return item.type === 'PURCHASE';
    return true;
  });

  const handleOpenDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => handleOpenDetails(item)}
    >
      <View style={[styles.transIcon, { backgroundColor: item.type === 'FUNDING' ? '#E8F5E9' : '#FFEBEE' }]}>
        <MaterialIcons 
          name={item.type === 'FUNDING' ? 'thumb-up' : 'thumb-down'} 
          size={20} 
          color={item.type === 'FUNDING' ? COLORS.success : COLORS.danger} 
        />
      </View>
      <View style={styles.transDetails}>
        <Text style={styles.transTitle}>
          {item.type === 'FUNDING' ? `Wallet Funding (${item.merchant_name || 'Bank'})` : item.merchant_name || 'Purchase'}
        </Text>
        <Text style={styles.transDate}>
          {new Date(item.created_at).toLocaleDateString()} • {item.status}
        </Text>
      </View>
      <Text style={[styles.transAmount, { color: item.type === 'FUNDING' ? COLORS.success : COLORS.danger }]}>
        {item.type === 'FUNDING' ? '+' : '-'}₦{parseFloat(item.amount).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  const TabButton = ({ title }) => (
    <TouchableOpacity 
      style={[styles.tabBtn, activeTab === title && styles.activeTabBtn]}
      onPress={() => setActiveTab(title)}
    >
      <Text style={[styles.tabText, activeTab === title && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader navigation={navigation} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity>
          <Download size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TabButton title="All" />
        <TabButton title="Funding" />
        <TabButton title="Purchases" />
      </View>

      <FlatList
        data={filteredHistory}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <History size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No transactions found for this category.</Text>
          </View>
        }
      />

      {/* Transaction Details Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {selectedTransaction && (
              <ScrollView>
                <View style={styles.statusContainer}>
                  <MaterialIcons 
                    name={selectedTransaction.status === 'SUCCESS' ? 'sentiment-satisfied-alt' : 'sentiment-very-dissatisfied'} 
                    size={60} 
                    color={selectedTransaction.status === 'SUCCESS' ? COLORS.success : COLORS.danger} 
                    style={{ marginBottom: 10 }}
                  />
                  <Text style={[styles.detailAmount, { color: selectedTransaction.type === 'FUNDING' ? COLORS.success : COLORS.danger }]}>
                    {selectedTransaction.type === 'FUNDING' ? '+' : '-'}₦{parseFloat(selectedTransaction.amount).toLocaleString()}
                  </Text>
                  <Text style={styles.detailStatus}>{selectedTransaction.status}</Text>
                </View>

                <View style={styles.detailsList}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Transaction Type</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.type}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Reference</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.reference}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Source / Merchant</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.merchant_name || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <View style={styles.row}>
                      <Clock size={14} color={COLORS.darkGray} style={{ marginRight: 5 }} />
                      <Text style={styles.detailValue}>
                        {new Date(selectedTransaction.created_at).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.closeBtn} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeBtnText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray,
  },
  activeTabBtn: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  activeTabText: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  transIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transDetails: {
    flex: 1,
    marginLeft: 15,
  },
  transTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  transDate: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  transAmount: {
    fontSize: 16,
    fontWeight: 'bold',
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  detailAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 15,
  },
  detailStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 5,
  },
  detailsList: {
    backgroundColor: COLORS.gray,
    borderRadius: 16,
    padding: 20,
    gap: 20,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  closeBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HistoryScreen;
