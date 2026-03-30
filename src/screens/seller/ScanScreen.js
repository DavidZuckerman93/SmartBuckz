import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, TextInput, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { ArrowLeft, Camera, QrCode, X, RefreshCcw, CreditCard, ShoppingBag } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import GlobalHeader from '../../components/GlobalHeader';

const ScanScreen = ({ navigation, route }) => {
  const { chargeCard, chargeOrder } = useUser();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [amount, setAmount] = useState(route.params?.amount?.toString() || '');
  const [isCharging, setIsCharging] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const orderId = route.params?.orderId;

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBeginScan = () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('Price Required', 'Please enter a valid amount before beginning the scan.');
      return;
    }
    setShowScanner(true);
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setScannedData(data);
    // Data expected format: SB-CARD-ID-NUMBER
    if (!data.startsWith('SB-CARD-')) {
      Alert.alert('Invalid QR Code', 'This is not a valid SmartBucks card.');
      setScanned(false);
      setScannedData(null);
    }
  };

  const handleCharge = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to charge.');
      return;
    }

    try {
      setIsCharging(true);
      if (orderId) {
        await chargeOrder(orderId, parseFloat(amount));
        Alert.alert('Success', `Successfully charged ₦${amount} for order #${orderId}.`, [
          { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
        ]);
      } else {
        await chargeCard(parseFloat(amount), scannedData);
        Alert.alert('Success', `Successfully charged ₦${amount} from card.`, [
          { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
        ]);
      }
    } catch (err) {
      console.error('Charge failed:', err);
      const errorMessage = err.response?.data?.message || 'Failed to process charge. Please check balance and try again.';
      const errorCode = err.response?.data?.error_code;
      
      if (errorCode === 'INSUFFICIENT_BALANCE') {
        Alert.alert(
          'Insufficient Balance', 
          `The customer (${err.response?.data?.buyerName || 'Account'}) does not have enough funds for this transaction.`,
          [{ text: 'OK', onPress: () => {
            setScanned(false);
            setScannedData(null);
          }}]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsCharging(false);
    }
  };

  if (hasPermission === null && Platform.OS !== 'web') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.permissionText}>Requesting for camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false && Platform.OS !== 'web') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader navigation={navigation} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Charge Card</Text>
        <View style={{ width: 40 }} />
      </View>

      {!scanned ? (
        <View style={styles.scannerContainer}>
          <View style={styles.inputSectionTop}>
            <Text style={styles.inputLabel}>Amount to Charge</Text>
            <View style={styles.amountInputContainerSmall}>
              <Text style={styles.currencySymbolSmall}>₦</Text>
              <TextInput
                style={styles.amountInputSmall}
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                editable={!showScanner}
              />
            </View>
          </View>

          {!showScanner ? (
            <View style={styles.preScanContainer}>
              <Text style={styles.instructions}>Enter the amount first, then begin scanning the customer's QR code.</Text>
              <TouchableOpacity 
                style={styles.beginScanBtn} 
                onPress={handleBeginScan}
              >
                <Camera size={24} color={COLORS.white} />
                <Text style={styles.beginScanBtnText}>Begin Scan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.instructions}>Position the customer's QR code within the frame</Text>
              <View style={styles.cameraFrame}>
                {Platform.OS === 'web' ? (
                  <TouchableOpacity 
                    style={styles.mockScanner}
                    onPress={() => handleBarCodeScanned({ type: 'qr', data: 'SB-CARD-1-**** 1234' })}
                  >
                    <Camera size={64} color={COLORS.primary} />
                    <Text style={styles.mockText}>Click to Simulate Scan (Web Mode)</Text>
                  </TouchableOpacity>
                ) : (
                  <BarCodeScanner
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <View style={styles.overlay}>
                  <View style={styles.cornerTopLeft} />
                  <View style={styles.cornerTopRight} />
                  <View style={styles.cornerBottomLeft} />
                  <View style={styles.cornerBottomRight} />
                </View>
              </View>
              <TouchableOpacity style={styles.resetAmountBtn} onPress={() => setShowScanner(false)}>
                <Text style={styles.resetAmountBtnText}>Change Amount</Text>
              </TouchableOpacity>
            </>
          )}
          <QrCode size={40} color={COLORS.primary} style={styles.qrIcon} />
        </View>
      ) : (
        <View style={styles.chargeContainer}>
          <View style={styles.cardInfo}>
            <View style={styles.successIcon}>
              <MaterialIcons name="sentiment-satisfied-alt" size={32} color={COLORS.success} />
            </View>
            <Text style={styles.cardScannedText}>Card Scanned Successfully</Text>
            <Text style={styles.cardIdText}>{scannedData}</Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Amount to Charge</Text>
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
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.chargeBtn, isCharging && styles.disabledBtn]} 
              onPress={handleCharge}
              disabled={isCharging}
            >
              <Text style={styles.chargeBtnText}>
                {isCharging ? 'Processing...' : 'Confirm Charge'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => {
                setScanned(false);
                setScannedData(null);
                setAmount('');
              }}
            >
              <X size={20} color={COLORS.danger} />
              <Text style={styles.cancelBtnText}>Cancel and Rescan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  instructions: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 30,
  },
  cameraFrame: {
    width: 280,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000', // Change to black to make it look like a camera
    position: 'relative',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  mockScanner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E1F5FE',
  },
  mockText: {
    marginTop: 15,
    color: COLORS.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.secondary,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.secondary,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.secondary,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.secondary,
  },
  qrIcon: {
    marginTop: 40,
  },
  chargeContainer: {
    flex: 1,
    padding: 25,
  },
  cardInfo: {
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardScannedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  cardIdText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 5,
  },
  inputSection: {
    marginBottom: 40,
  },
  inputSectionTop: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 15,
  },
  amountInputContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 5,
  },
  currencySymbolSmall: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 8,
  },
  amountInputSmall: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    flex: 1,
  },
  preScanContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  beginScanBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 16,
    gap: 10,
    marginTop: 10,
    width: '100%',
  },
  beginScanBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetAmountBtn: {
    marginTop: 20,
    padding: 10,
  },
  resetAmountBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  inputLabel: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 10,
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
  actions: {
    gap: 15,
  },
  chargeBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  chargeBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.danger,
    gap: 10,
  },
  cancelBtnText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default ScanScreen;
