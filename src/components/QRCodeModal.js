import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import { X, QrCode, User, CreditCard } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { COLORS } from '../theme/colors';

const QRCodeModal = ({ visible, onClose, card }) => {
  if (!card) return null;

  const qrData = `SB-CARD-${card.id}`;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <QrCode size={24} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Scan to Pay</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.qrContainer}>
            <QRCode
              value={qrData}
              size={220}
              backgroundColor={COLORS.white}
              color={COLORS.primary}
              logo={undefined}
            
              logoSize={40}
              logoBackgroundColor={COLORS.white}
            />
          </View>

          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <User size={16} color={COLORS.darkGray} />
              <Text style={styles.detailText}>{card.cardholder_name}</Text>
            </View>
            <View style={styles.detailRow}>
              <CreditCard size={16} color={COLORS.darkGray} />
              <Text style={styles.detailText}>**** **** **** {card.card_pan ? card.card_pan.slice(-4) : (card.cardNumber ? card.cardNumber.slice(-4) : '****')}</Text>
            </View>
          </View>

          <Text style={styles.instructions}>Present this code to the vendor to complete your payment.</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 25,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardDetails: {
    width: '100%',
    backgroundColor: COLORS.gray,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  instructions: {
    fontSize: 13,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
});

export default QRCodeModal;
