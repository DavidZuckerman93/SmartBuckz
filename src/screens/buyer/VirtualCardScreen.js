import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, FlatList, Dimensions, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { VirtualCardStyles } from '../../GlobalStyles';
import { ArrowLeft, Plus, CreditCard, Shield, Settings, QrCode, Eye, EyeOff, Check, Landmark, Wallet } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';

import GlobalHeader from '../../components/GlobalHeader';
import { Button } from 'react-native-web';
import { virtualCardService } from '../../services/api';

const { width } = Dimensions.get('window');


const formatCardNumber = (input, delimiter = '-') => {
  if (!input) return '';

  // Remove all non-digit characters
  const cleaned = input.replace(/\D/g, '');

  // Split into chunks of 4
  const chunks = cleaned.match(/.{1,4}/g);

  return chunks ? chunks.join(delimiter) : '';
};

const formatCurrencyAbbr = (value) => {
  const num = parseFloat(value || 0);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
};

const VirtualCardScreen = ({ navigation }) => {
  const { cards, user, virtualCardOperations } = useUser();
  const [selectedCard, setSelectedCard] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [modalVisible, setModalVisiblle] = useState(false);
  const [card_alias, set_card_alias] = useState("");
  const [card_color, set_card_color] = useState("");
  const [dataSet, setDataSet] = useState(false);
  const [visibleCards, setVisibleCards] = useState({});

  useEffect(()=>{
    fetchAllCards()
  }, []);

  const toggleCardVisibility = (id) => {
    setVisibleCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const maskCardNumber = (number) => {
    if (!number) return '';
    const cleaned = number.replace(/\D/g, '');
    const firstFour = cleaned.substring(0, 4);
    const lastFour = cleaned.substring(cleaned.length - 4);
    return `${firstFour} **** **** ${lastFour}`;
  };

  const PRESET_COLORS = {
    'Black': ['#434343', '#000000'],
    'Blue': ['#00C6FF', '#0072FF'],
    'Purple': ['#A8C0FF', '#3F2B96'],
    'Orange': ['#FF9966', '#FF5E62'],
    'Yellow': ['#F7971E', '#FFD200'],
    'Green': ['#11998e', '#38ef7d'],
    'Pink': ['#ff9a9e', '#fecfef'],
    'Red': ['#e52d27', '#b31217'],
    'Teal': ['#008080', '#004d4d'],
    'Indigo': ['#4b0082', '#2d004d'],
    'Cyan': ['#00ffff', '#008b8b'],
    'Silver': ['#bdc3c7', '#2c3e50'],
    'Gold': ['#f1c40f', '#f39c12'],
    'Crimson': ['#dc143c', '#8b0000'],
    'Navy': ['#000080', '#000033'],
    'Emerald': ['#50C878', '#046307'],
  };

  const getGradientColors = (colorName, isDefault) => {
    if (isDefault) return ['#FFD700', '#B8860B'];
    return PRESET_COLORS[colorName] || ['#003366', '#001A33'];
  };

  const handleRequestCard = () => {
    setModalVisiblle(true);
  };

  const setDefault = async (id) => {
    try {
      await virtualCardOperations.setDefaultCard(id);
      Alert.alert("Success", "Default card updated.");
    } catch (error) {
      console.error('Error setting default card:', error);
      Alert.alert("Error", "Failed to update default card.");
    }
  };

  const createNewVCard = async()=>{
    if(card_alias.length < 5){
      Alert.alert("Invalid Alias", "Card alias must be at least 5 characters long.");
      return;
    }
    if(!card_color){
      Alert.alert("Color Required", "Please select a theme color for your card.");
      return;
    }

    setModalVisiblle(false);
    setDataSet(true);
    try {
      const res = await virtualCardOperations.createNewCard(user.allData.user.id, card_alias, card_color);
      console.log('Create card response:', res);
      await fetchAllCards();
    } catch (error) {
      console.error('Error creating card:', error);
      Alert.alert("Failed to create card");
    } finally {
      setDataSet(false);
      set_card_alias("");
      set_card_color("");
    }
  }

  const fetchAllCards = async () =>{
    try {
      const $limit = 20;
      const $offset = 0;
      const $res = await virtualCardOperations.fetchAllCards(user.allData.user.id, $limit, $offset);
      if (Array.isArray($res)) {
        setAllCards($res);
      }
      console.log('Fetched cards:', $res);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  }

  const renderAllCards = ({ item }) => {
    const isDefault = item.is_default === 1;
    const isVisible = visibleCards[item.id];
    const textColor = isDefault || (item.card_color !== 'White') ? COLORS.white : COLORS.primary;
    const labelColor = isDefault ? 'rgba(0,51,102,0.6)' : (item.card_color === 'White' ? 'rgba(0,51,102,0.4)' : 'rgba(255,255,255,0.6)');

    return (
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={getGradientColors(item.card_color, isDefault)}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.cardBrand, { color: textColor }]}>SmartBuckz Meal Card</Text>
          <View style={styles.cardHeader}>
            <View style={styles.aliasRow}>
              <Text style={[styles.cardType, { color: textColor }]}>{item.card_alias}</Text>
              {isDefault && (
                <View style={styles.defaultBadge}>
                  <Check size={12} color={COLORS.success} strokeWidth={3} />
                  <Text style={styles.defaultText}>- default</Text>
                </View>
              )}
            </View>
            <CreditCard size={24} color={textColor} />
          </View>
          
          <View style={styles.numberRow}>
            <Text style={[styles.cardNumber, { color: textColor }]}>
              {isVisible ? formatCardNumber(item.card_number) : maskCardNumber(item.card_number)}
            </Text>
            <TouchableOpacity onPress={() => toggleCardVisibility(item.id)} style={styles.eyeBtn}>
              {isVisible ? <EyeOff size={20} color={textColor} /> : <Eye size={20} color={textColor} />}
            </TouchableOpacity>
          </View>

          <View style={styles.cardInfoGrid}>
            <View style={styles.balanceLimitRow}>
              <View>
                <Text style={[styles.cardLabel, { color: labelColor }]}>Balance</Text>
                <Text style={[styles.cardValue, { color: textColor, fontSize: 18 }]}>
                  ₦{formatCurrencyAbbr(item.card_balance)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View>
                <Text style={[styles.cardLabel, { color: labelColor }]}>Daily Limit</Text>
                <Text style={[styles.cardValue, { color: textColor, fontSize: 18 }]}>
                  ₦{formatCurrencyAbbr(item.daily_limit)}
                </Text>
              </View>
            </View>
            <View style={styles.expiryCol}>
              <Text style={[styles.cardLabel, { color: labelColor, textAlign: 'right' }]}>Expiry</Text>
              <Text style={[styles.cardValue, { color: textColor, textAlign: 'right' }]}>{item.expiry_date}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.footerActions}>
              <TouchableOpacity 
                style={[styles.topupBtn, { backgroundColor: isDefault ? COLORS.white : 'rgba(255,255,255,0.2)' }]}
                onPress={() => navigation.navigate('CardFunding', { cardId: item.id })}
              >
                <Plus size={16} color={isDefault ? COLORS.primary : textColor} />
                <Text style={[styles.topupText, { color: isDefault ? COLORS.primary : textColor }]}>TOPUP</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.qrBtn, { backgroundColor: isDefault ? COLORS.primary : (item.card_color === 'White' ? COLORS.primary : COLORS.secondary) }]}
                onPress={() => {
                  setSelectedCard({ ...item, cardNumber: item.card_number });
                  setShowQR(true);
                }}
              >
                <QrCode size={20} color={isDefault ? COLORS.secondary : (item.card_color === 'White' ? COLORS.white : COLORS.primary)} />
                <Text style={[styles.qrBtnText, { color: isDefault ? COLORS.secondary : (item.card_color === 'White' ? COLORS.white : COLORS.primary) }]}>PAY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.cardActions}>
          {!isDefault && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => setDefault(item.id)}>
              <Text style={styles.actionBtnText}>Set as Default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => navigation.navigate('CardSettings', { cardId: item.id })}
          >
            <Settings size={18} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => Alert.alert("Request Card", "Your physical card request has been received.")}
          >
            <Landmark size={18} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Request Physical</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader navigation={navigation} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Virtual Cards</Text>
        <TouchableOpacity onPress={handleRequestCard}>
          <Plus size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
          data={cards}
          renderItem={renderAllCards}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Shield size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No cards found. Request your first virtual card!</Text>
          </View>
        }
      />

      <Modal
        visible={showQR}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQR(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Get scanned to pay</Text>
            <Text style={styles.modalSubtitle}>Present this QR code to the vendor</Text>
            
            <View style={styles.qrContainer}>
              {selectedCard && (
                <QRCode
                  value={`SB-CARD-${selectedCard.id}-${selectedCard.cardNumber}-${user.id}`}
                  size={200}
                  color='darkgoldenrod'
                  backgroundColor="white"
                />
              )}
            </View>

            <Text style={styles.cardRef}>SB Card Number: {formatCardNumber(selectedCard?.cardNumber)}</Text>
            
            <TouchableOpacity 
              style={styles.closeBtn}
              onPress={() => setShowQR(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      

         <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisiblle(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={VirtualCardStyles.ModalContainer}>
           <View style = {{flexDirection: 'row', alignContent: 'center',  alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20}}>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
               <CreditCard size={24} color={COLORS.white} />
               <Text style={{color: 'white', fontWeight: 'bold', fontSize: 20}}>New Virtual Card</Text>
             </View>
             <TouchableOpacity onPress={() => setModalVisiblle(false)}>
               <Text style = {{color: 'white', fontSize: 24}}>X</Text>
             </TouchableOpacity>
           </View>
            <TextInput placeholder = "Card Alias (Set a name for your card)" style = {VirtualCardStyles.textIn} onChangeText = {set_card_alias}/>
            
            <View style={{ width: '100%', marginBottom: 20 }}>
              <Text style={{ color: 'white', marginBottom: 10, fontSize: 16 }}>Choose Card Theme</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={{ flexDirection: 'row' }}
              >
                {Object.keys(PRESET_COLORS).map((colorName) => (
                  <TouchableOpacity
                    key={colorName}
                    onPress={() => set_card_color(colorName)}
                    style={{
                      width: 45,
                      height: 45,
                      borderRadius: 22.5,
                      backgroundColor: PRESET_COLORS[colorName][1],
                      marginRight: 15,
                      borderWidth: card_color === colorName ? 3 : 0,
                      borderColor: 'white',
                      justifyContent: 'center',
                      alignItems: 'center',
                      elevation: 3,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 2,
                    }}
                  >
                    {card_color === colorName && (
                      <Check size={20} color="white" strokeWidth={4} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity onPress = {()=>{
              // Create button request here
              createNewVCard();
              
            }} style = {VirtualCardStyles.createButton}>
             {dataSet ? (
              <ActivityIndicator size = {30} color = {COLORS.white} />
            ) : (
              <Text style={{ color: COLORS.primary, textAlign: 'center', lineHeight: 30, fontWeight: 'bold' }}>
                Create Card
              </Text>
            )}
               
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
  listContent: {
    padding: 20,
  },
  cardContainer: {
    marginBottom: 25,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    height: 230,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardBrand: {
    fontSize: 16,
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
  cardType: {
    fontSize: 14,
    fontWeight: '600',
  },
  aliasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  eyeBtn: {
    padding: 5,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cardInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  balanceLimitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  expiryCol: {
    alignItems: 'flex-end',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  topupText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 12,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  qrBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 15,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 5,
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
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    width: width * 0.85,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 5,
    marginBottom: 25,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRef: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  closeBtn: {
    marginTop: 30,
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VirtualCardScreen;
