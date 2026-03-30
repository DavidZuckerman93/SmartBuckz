import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { ArrowLeft, Banknote, Landmark, ShieldCheck, X, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';

import GlobalHeader from '../../components/GlobalHeader';

const StatusModal = ({ visible, type, title, message, onClose }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.statusModalContent}>
        <View style={[styles.statusIconContainer, { backgroundColor: type === 'success' ? '#E8F5E9' : '#FFEBEE' }]}>
          {type === 'success' ? (
            <CheckCircle2 size={48} color={COLORS.success} />
          ) : (
            <AlertCircle size={48} color={COLORS.danger} />
          )}
        </View>
        <Text style={styles.statusTitle}>{title}</Text>
        <Text style={styles.statusMessage}>{message}</Text>
        <TouchableOpacity 
          style={[styles.statusBtn, { backgroundColor: type === 'success' ? COLORS.success : COLORS.danger }]} 
          onPress={onClose}
        >
          <Text style={styles.statusBtnText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const ConfirmModal = ({ visible, amount, bank, onConfirm, onCancel, loading }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.confirmModalContent}>
        <View style={styles.confirmHeader}>
          <Text style={styles.confirmTitle}>Confirm Withdrawal</Text>
          <TouchableOpacity onPress={onCancel} disabled={loading}>
            <X size={24} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        <View style={styles.confirmSummary}>
          <Text style={styles.confirmLabel}>Amount to Withdraw</Text>
          <Text style={styles.confirmAmount}>₦{parseFloat(amount || 0).toLocaleString()}</Text>
          
          <View style={styles.confirmDivider} />
          
          <Text style={styles.confirmLabel}>Destination Bank</Text>
          <Text style={styles.confirmBankName}>{bank?.name || 'N/A'}</Text>
          <Text style={styles.confirmBankAcc}>{bank?.accountNumber || 'N/A'}</Text>
        </View>

        <Text style={styles.confirmNotice}>
          Funds will be sent directly to your bank account via Paystack.
        </Text>

        <TouchableOpacity 
          style={[styles.confirmBtn, loading && { opacity: 0.7 }]} 
          onPress={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.confirmBtnText}>Yes, Withdraw Now</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelLink} 
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const WithdrawScreen = ({ navigation }) => {
  const { sellerData, withdrawSellerBalance, registeredBanks, fetchBanks } = useUser();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showConfirm, setShowConfirm] = useState(false);
  const [statusModal, setStatusModal] = useState({ visible: false, type: 'success', title: '', message: '' });

  const defaultBank = registeredBanks.find(b => b.is_default === 1) || registeredBanks[0];

  useEffect(() => {
    if (registeredBanks.length === 0) {
      fetchBanks();
    }
  }, []);

  const handleWithdrawInitiate = () => {
    const val = parseFloat(amount);
    if (!amount || isNaN(val) || val <= 0) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Invalid Amount',
        message: 'Please enter a valid amount to withdraw.'
      });
      return;
    }

    if (val > sellerData.balance) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Insufficient Funds',
        message: 'The amount exceeds your current withdrawable balance.'
      });
      return;
    }

    if (!defaultBank) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'No Bank Account',
        message: 'Please add a bank account in your profile first to receive funds.'
      });
      return;
    }

    setShowConfirm(true);
  };

  const processWithdrawal = async () => {
    const val = parseFloat(amount);
    setLoading(true);
    try {
      const result = await withdrawSellerBalance(val);
      setShowConfirm(false);
      
      if (result.success) {
        setStatusModal({
          visible: true,
          type: 'success',
          title: 'Success!',
          message: result.message || 'Your withdrawal has been processed successfully.'
        });
        setAmount('');
      } else {
        setStatusModal({
          visible: true,
          type: 'error',
          title: 'Withdrawal Failed',
          message: result.message || 'An error occurred while processing your withdrawal. Please check your bank details.'
        });
      }
    } catch (err) {
      setShowConfirm(false);
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'System Error',
        message: 'An unexpected error occurred. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.balanceSummary}>
          <Text style={styles.balanceLabel}>Withdrawable Balance</Text>
          <Text style={styles.balanceAmount}>₦{sellerData.balance.toLocaleString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount to Withdraw</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Withdrawal Destination</Text>
          <TouchableOpacity 
            style={styles.bankSelect} 
            onPress={() => navigation.navigate('Banks')}
            disabled={loading}
          >
            <Landmark size={24} color={COLORS.primary} />
            <View style={styles.bankInfo}>
              <Text style={styles.bankLabel}>Default Bank Account</Text>
              <Text style={styles.bankDetails}>
                {defaultBank ? `${defaultBank.accountNumber} - ${defaultBank.name}` : 'No bank account added'}
              </Text>
            </View>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <MaterialIcons name="thumb-up" size={20} color="#2E7D32" />
          <Text style={styles.infoText}>Your withdrawal is processed securely via Paystack.</Text>
        </View>

        <TouchableOpacity 
          style={styles.withdrawBtn} 
          onPress={handleWithdrawInitiate}
          disabled={loading}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <MaterialIcons name="thumb-down" size={18} color={COLORS.white} />
            <Text style={styles.withdrawBtnText}>Confirm Withdrawal</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal 
        visible={showConfirm}
        amount={amount}
        bank={defaultBank}
        onConfirm={processWithdrawal}
        onCancel={() => setShowConfirm(false)}
        loading={loading}
      />

      <StatusModal 
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => {
          setStatusModal({ ...statusModal, visible: false });
          if (statusModal.type === 'success') {
            navigation.goBack();
          }
        }}
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  balanceSummary: {
    backgroundColor: COLORS.gray,
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingVertical: 10,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 10,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.black,
    flex: 1,
  },
  bankSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: COLORS.gray,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  bankInfo: {
    flex: 1,
    marginLeft: 15,
  },
  bankLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  bankDetails: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 2,
  },
  changeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
    gap: 10,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 18,
  },
  withdrawBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  withdrawBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  statusModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  statusBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 25,
    elevation: 10,
  },
  confirmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  confirmSummary: {
    backgroundColor: COLORS.gray,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  confirmLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 5,
  },
  confirmAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 15,
  },
  confirmBankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  confirmBankAcc: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  confirmNotice: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 25,
    fontStyle: 'italic',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelLink: {
    alignItems: 'center',
  },
  cancelLinkText: {
    color: COLORS.darkGray,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WithdrawScreen;

