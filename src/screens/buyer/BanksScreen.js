import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, FlatList, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { Plus, Landmark, X, CreditCard, ShieldCheck, Edit2, CheckCircle2 } from 'lucide-react-native';
import GlobalHeader from '../../components/GlobalHeader';


const BanksScreen = ({ navigation }) => {
  const { registeredBanks, addRegisteredBank, updateRegisteredBank, deleteBank, setDefaultBank, fetchBanks } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [bankListVisible, setBankListVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingBankId, setEditingBankId] = useState(null);
  const [newBank, setNewBank] = useState({ name: '', accountNumber: '', bankCode: '', cvv: '', expiry: '' });

  const NIGERIAN_BANKS = [
    { name: 'Access Bank', code: '044' },
    { name: 'Citibank Nigeria', code: '023' },
    { name: 'Ecobank Nigeria', code: '050' },
    { name: 'Fidelity Bank Nigeria', code: '070' },
    { name: 'First Bank of Nigeria', code: '011' },
    { name: 'First City Monument Bank', code: '214' },
    { name: 'Guaranty Trust Bank', code: '058' },
    { name: 'Heritage Bank', code: '030' },
    { name: 'Keystone Bank', code: '082' },
    { name: 'Polaris Bank', code: '076' },
    { name: 'Providus Bank', code: '101' },
    { name: 'Stanbic IBTC Bank', code: '221' },
    { name: 'Standard Chartered Bank', code: '068' },
    { name: 'Sterling Bank', code: '232' },
    { name: 'Suntrust Bank Nigeria', code: '100' },
    { name: 'Union Bank of Nigeria', code: '032' },
    { name: 'United Bank for Africa', code: '033' },
    { name: 'Unity Bank', code: '215' },
    { name: 'Wema Bank', code: '035' },
    { name: 'Zenith Bank', code: '057' },
    { name: 'OPay Digital Services (OPay)', code: '999992' },
    { name: 'PalmPay', code: '999991' },
    { name: 'Kuda Bank', code: '50211' }
  ];

  const handleOpenModal = (bank = null) => {
    if (bank) {
      setEditingBankId(bank.id);
      setNewBank({ 
        name: bank.name, 
        accountNumber: bank.accountNumber, 
        bankCode: bank.bankCode || '',
        cvv: bank.cvv || '', 
        expiry: bank.expiry || '' 
      });
    } else {
      setEditingBankId(null);
      setNewBank({ name: '', accountNumber: '', bankCode: '', cvv: '', expiry: '' });
    }
    setModalVisible(true);
  };

  const selectBank = (bank) => {
    setNewBank({ ...newBank, name: bank.name, bankCode: bank.code });
    setBankListVisible(false);
  };

  const handleAddOrUpdateBank = async () => {
    if (!newBank.name || !newBank.accountNumber) {
      Alert.alert('Error', 'Please fill in all details.');
      return;
    }
    
    setLoading(true);
    try {
      if (editingBankId) {
        await updateRegisteredBank(editingBankId, { ...newBank, icon: '🏦' });
        Alert.alert('Success', 'Bank account updated successfully.');
      } else {
        await addRegisteredBank({ ...newBank, icon: '🏦' });
        Alert.alert('Success', 'Bank account registered successfully.');
      }
      setNewBank({ name: '', accountNumber: '', cvv: '', expiry: '' });
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', `Failed to ${editingBankId ? 'update' : 'register'} bank account. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = (id) => {
    Alert.alert(
      'Delete Bank',
      'Are you sure you want to remove this bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteBank(id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bank account.');
            }
          } 
        }
      ]
    );
  };

  const renderBankItem = ({ item }) => (
    <View style={[styles.bankItem, item.is_default === 1 && styles.defaultBankItem]}>
      <View style={styles.bankIconContainer}>
        <Text style={styles.bankIcon}>{item.icon}</Text>
      </View>
      <View style={styles.bankDetails}>
        <View style={styles.bankNameRow}>
          <Text style={styles.bankName}>{item.name}</Text>
          {item.is_default === 1 && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>DEFAULT</Text></View>}
        </View>
        <Text style={styles.accountNumber}>**** **** {item.accountNumber ? item.accountNumber.slice(-4) : '****'}</Text>
      </View>
      <View style={styles.bankActions}>
        {item.is_default !== 1 && (
          <TouchableOpacity onPress={() => setDefaultBank(item.id)} style={{ marginRight: 15 }}>
            <CheckCircle2 size={20} color={COLORS.success} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => handleOpenModal(item)} style={{ marginRight: 15 }}>
          <Edit2 size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteBank(item.id)}>
          <X size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader navigation={navigation} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>My Registered Banks</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenModal()}>
            <Plus size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <View>
            <Text style = {{color: 'dimgrey', padding: 10, borderWidth: 1, borderColor: 'grey', borderRadius: 10, marginVertical: 20}}>Adding a bank lets you easily fund your SB Card(s). You can save your bank details here so you do not have to always search for your bank cards whenever you want to fund your SB Card(s)</Text>
        </View>

        <FlatList
          data={registeredBanks}
          renderItem={renderBankItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Landmark size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No banks registered yet.</Text>
            </View>
          }
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingBankId ? 'Update Bank Card' : 'Save a Bank Card'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View>
               <Text style = {{color: 'dimgrey', padding: 10, borderWidth: 1, borderColor: 'grey', borderRadius: 10, marginVertical: 20}}>All your bank details are safe with us. They are protected by the law and we will not share your details with any third party organizations without your permission.</Text>
            </View>

            <ScrollView>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bank Name</Text>
                <TouchableOpacity style={styles.input} onPress={() => setBankListVisible(true)}>
                  <Text style={{ color: newBank.name ? COLORS.black : COLORS.darkGray }}>
                    {newBank.name || 'Select a bank'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account / Card Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0123 4567 8901 2345"
                  keyboardType="numeric"
                  value={newBank.accountNumber}
                  onChangeText={text => setNewBank({ ...newBank, accountNumber: text })}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Expiry</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    value={newBank.expiry}
                    onChangeText={text => setNewBank({ ...newBank, expiry: text })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    keyboardType="numeric"
                    secureTextEntry
                    value={newBank.cvv}
                    onChangeText={text => setNewBank({ ...newBank, cvv: text })}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddOrUpdateBank}>
                <Text style={styles.submitBtnText}>{editingBankId ? 'Update Bank' : 'Register Bank'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={bankListVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Bank</Text>
              <TouchableOpacity onPress={() => setBankListVisible(false)}>
                <X size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={NIGERIAN_BANKS}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.bankListItem} 
                  onPress={() => selectBank(item)}
                >
                  <Text style={styles.bankListItemText}>{item.name}</Text>
                  <Landmark size={18} color={COLORS.darkGray} />
                </TouchableOpacity>
              )}
            />
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
  content: {
    flex: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  addBtn: {
    backgroundColor: COLORS.secondary,
    padding: 8,
    borderRadius: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
  },
  bankIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  bankIcon: {
    fontSize: 24,
  },
  bankDetails: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  bankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
  defaultBankItem: {
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  accountNumber: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  bankActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.darkGray,
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
    padding: 20,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    color: COLORS.black,
  },
  row: {
    flexDirection: 'row',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  bankListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  bankListItemText: {
    fontSize: 16,
    color: COLORS.black,
  },
});

export default BanksScreen;
