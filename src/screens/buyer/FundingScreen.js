import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { ArrowLeft, CreditCard, Banknote, Plus, History, Send, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { walletService } from '../../services/api';
import { MaterialIcons } from '@expo/vector-icons';

import GlobalHeader from '../../components/GlobalHeader';

// Conditional import for Paystack to avoid errors on Web
let usePaystack;
if (Platform.OS !== 'web') {
  try {
    const paystackLib = require('react-native-paystack-webview');
    usePaystack = paystackLib.usePaystack;
  } catch (e) {
    console.warn('Paystack WebView not available');
  }
}

const FundingScreen = ({ navigation, route }) => {
  const { wallet, user, fetchUserData } = useUser();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Only call hook if on native and available
  const paystack = (Platform.OS !== 'web' && usePaystack) ? usePaystack() : null;

  // Handle callback for web redirect
  useEffect(() => {
    if (Platform.OS === 'web' && route.params?.reference) {
      handleVerifyWebPayment(route.params.reference);
    }
  }, [route.params?.reference]);

  const handleVerifyWebPayment = async (reference) => {
    setLoading(true);
    try {
      await walletService.verifyPayment(reference);
      await fetchUserData();
      Alert.alert('Success', 'Payment verified and wallet funded!');
    } catch (err) {
      console.error('Web verification failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFund = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid funding amount.');
      return;
    }

    if (Platform.OS === 'web') {
      handleWebFunding();
    } else if (paystack) {
      paystack.popup.checkout({
        email: user.email || 'customer@smartbuckz.com',
        amount: parseFloat(amount),
        onSuccess: (res) => onPaymentSuccess(res),
        onCancel: () => onPaymentCancel(),
      });
    } else {
      Alert.alert('Error', 'Payment gateway is not available on this platform.');
    }
  };

  const handleWebFunding = async () => {
    setLoading(true);
    try {
      // For web, we get an authorization URL and redirect
      const callbackUrl = window.location.origin + '/funding-callback'; // Custom route or handled in App.js
      const data = await walletService.initializePayment(parseFloat(amount), window.location.href);
      
      if (data.authorization_url) {
        // Redirect the user to Paystack
        window.location.href = data.authorization_url;
      } else {
        throw new Error('Could not initialize payment URL');
      }
    } catch (err) {
      console.error('Web funding error:', err);
      Alert.alert('Error', 'Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onPaymentSuccess = async (res) => {
    setLoading(true);
    try {
      const reference = res.reference || res.transactionRef?.reference;
      if (!reference) throw new Error('No reference');
      await walletService.verifyPayment(reference);
      await fetchUserData();
      Alert.alert('Success', `Successfully funded wallet with ₦${parseFloat(amount).toLocaleString()}`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('Verification failed:', err);
      Alert.alert('Error', 'Payment verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const onPaymentCancel = () => {
    Alert.alert('Cancelled', 'Payment was cancelled');
  };

  const handleRequestSMS = () => {
    Alert.alert('Request Funding', 'SMS request sent to your linked contacts.');
  };

  return (
    <View style={styles.container}>
      <GlobalHeader navigation={navigation} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Fund Wallet</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.balanceSummary}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>₦{wallet.balance.toLocaleString()}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enter Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>
            <View style={styles.quickAmounts}>
              {[1000, 2000, 5000, 10000].map((val) => (
                <TouchableOpacity 
                  key={val} 
                  style={styles.quickAmountBtn}
                  onPress={() => setAmount(val.toString())}
                >
                  <Text style={styles.quickAmountText}>+₦{val.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.fundBtn, loading && styles.disabledBtn]}
            onPress={handleFund}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="thumb-up" size={20} color={COLORS.white} />
                <Text style={styles.fundBtnText}>Fund Now</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity 
            style={styles.requestBtn}
            onPress={handleRequestSMS}
          >
            <MessageSquare size={20} color={COLORS.primary} />
            <Text style={styles.requestBtnText}>Request Funding via SMS</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 28,
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
    width: '60vw'
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
  },
  quickAmountBtn: {
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickAmountText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray,
    marginBottom: 10,
  },
  bankItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#E1F5FE',
  },
  bankIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    flex: 1,
  },
  bankNameSelected: {
    color: COLORS.primary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray,
  },
  radioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  fundBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  fundBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray,
  },
  dividerText: {
    marginHorizontal: 15,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 16,
    gap: 10,
  },
  requestBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FundingScreen;
