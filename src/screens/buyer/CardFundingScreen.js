import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { ArrowLeft, CreditCard, Banknote, Plus, History, Send, MessageSquare, Landmark, Check, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { virtualCardService } from '../../services/api';
import GlobalHeader from '../../components/GlobalHeader';
import { MaterialIcons } from '@expo/vector-icons';

// Conditional import for Paystack
let usePaystack;
if (Platform.OS !== 'web') {
  try {
    const paystackLib = require('react-native-paystack-webview');
    usePaystack = paystackLib.usePaystack;
  } catch (e) {
    console.warn('Paystack WebView not available');
  }
}

const CardFundingScreen = ({ navigation, route }) => {
  const { cardId } = route.params;
  const { cards, user, fetchUserData } = useUser();
  const card = cards.find(c => c.id === cardId) || { card_alias: 'Virtual Card', card_number: '**** **** **** 0000', card_balance: '0' };
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Paystack Hook
  const paystack = (Platform.OS !== 'web' && usePaystack) ? usePaystack() : null;

  // Handle web callback if any (though usually handled in App.js or a separate route)
  useEffect(() => {
    if (Platform.OS === 'web' && route.params?.reference) {
      handleVerifyWebPayment(route.params.reference);
    }
  }, [route.params?.reference]);

  const handleVerifyWebPayment = async (reference) => {
    setLoading(true);
    try {
      await virtualCardService.verifyCardFunding(reference, cardId);
      await fetchUserData();
      Alert.alert('Success', 'Card funded successfully!');
    } catch (err) {
      console.error('Web card verification failed:', err);
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
      const data = await virtualCardService.initializeCardFunding(cardId, parseFloat(amount), window.location.href);
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('Could not initialize payment URL');
      }
    } catch (err) {
      console.error('Web card funding error:', err);
      Alert.alert('Error', 'Failed to initialize payment.');
    } finally {
      setLoading(false);
    }
  };

  const onPaymentSuccess = async (res) => {
    setLoading(true);
    try {
      const reference = res.reference || res.transactionRef?.reference;
      await virtualCardService.verifyCardFunding(reference, cardId);
      await fetchUserData();
      Alert.alert('Success', `Successfully funded ${card.card_alias} with ₦${parseFloat(amount).toLocaleString()}`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('Card verification failed:', err);
      Alert.alert('Error', 'Payment verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const onPaymentCancel = () => {
    Alert.alert('Cancelled', 'Payment was cancelled');
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader navigation={navigation} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Top Up Card</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Selected Card Preview */}
          <LinearGradient
            colors={['#003366', '#001A33']}
            style={styles.cardPreview}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.cardBrand}>SmartBuckz Meal Card</Text>
            <View style={styles.cardHeader}>
              <Text style={styles.cardAlias}>{card.card_alias}</Text>
              <CreditCard size={20} color={COLORS.white} />
            </View>
            <Text style={styles.cardNumber}>**** **** **** {card.cardNumber?.slice(-4) || '0000'}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardBalanceLabel}>Current Balance</Text>
              <Text style={styles.cardBalanceValue}>₦{parseFloat(card.card_balance || 0).toLocaleString()}</Text>
            </View>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Funding Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
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
                <Text style={styles.fundBtnText}>Top Up Now</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cardPreview: {
    padding: 20,
    borderRadius: 16,
    height: 160,
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  cardBrand: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 5,
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAlias: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardNumber: {
    color: COLORS.white,
    fontSize: 18,
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardBalanceLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  cardBalanceValue: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 10,
  },
  amountInput: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.black,
    flex: 1,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
  },
  quickAmountBtn: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickAmountText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedBankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  placeholderText: {
    color: COLORS.darkGray,
    fontSize: 15,
  },
  selectedBankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  selectedBankAccount: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  bankIcon: {
    fontSize: 24,
  },
  banksDropdown: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: COLORS.gray,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    gap: 15,
  },
  dropdownBankInfo: {
    flex: 1,
  },
  dropdownBankName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  dropdownBankAccount: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  addNewBankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
    backgroundColor: '#F8F9FA',
  },
  addNewBankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  fundBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  fundBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});

export default CardFundingScreen;
