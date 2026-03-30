import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, TextInput, Alert, ScrollView, Switch } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { ArrowLeft, Shield, Bell, CreditCard, Save } from 'lucide-react-native';
import GlobalHeader from '../../components/GlobalHeader';

const CardSettingsScreen = ({ navigation, route }) => {
  const { cardId } = route.params;
  const { cards, setCards } = useUser();
  const card = cards.find(c => c.id === cardId);

  const [limit, setLimit] = useState(card?.dailyLimit.toString() || '2000');
  const [notifications, setNotifications] = useState(true);
  const [frozen, setFrozen] = useState(false);

  const handleSave = () => {
    const newLimit = parseFloat(limit);
    if (isNaN(newLimit) || newLimit < 0) {
      Alert.alert('Invalid Limit', 'Please enter a valid daily limit.');
      return;
    }

    setCards(cards.map(c => 
      c.id === cardId ? { ...c, dailyLimit: newLimit } : c
    ));

    Alert.alert('Settings Saved', 'Your card settings have been updated successfully.', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Card Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.cardPreview}>
          <CreditCard size={40} color={COLORS.primary} />
          <View style={styles.cardPreviewInfo}>
            <Text style={styles.cardPreviewNumber}>{card?.cardNumber}</Text>
            <Text style={styles.cardPreviewType}>SmartBucks Virtual Card</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Limits</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingTextContent}>
              <Text style={styles.settingLabel}>Daily Spending Limit</Text>
              <Text style={styles.settingDescription}>Maximum amount spendable in 24 hours</Text>
            </View>
            <View style={styles.limitInputContainer}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput
                style={styles.limitInput}
                value={limit}
                onChangeText={setLimit}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Alerts</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContent}>
              <Text style={styles.settingLabel}>Freeze Card</Text>
              <Text style={styles.settingDescription}>Temporarily disable all transactions</Text>
            </View>
            <Switch
              value={frozen}
              onValueChange={setFrozen}
              trackColor={{ false: '#D1D1D1', true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContent}>
              <Text style={styles.settingLabel}>Transaction Alerts</Text>
              <Text style={styles.settingDescription}>Get notified of every purchase</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#D1D1D1', true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Save size={20} color={COLORS.white} />
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.deleteBtn}
          onPress={() => Alert.alert('Request Cancellation', 'Request to cancel this virtual card has been sent.')}
        >
          <Text style={styles.deleteBtnText}>Request Card Cancellation</Text>
        </TouchableOpacity>
      </ScrollView>
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
  cardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  cardPreviewInfo: {
    marginLeft: 15,
  },
  cardPreviewNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  cardPreviewType: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 2,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  settingTextContent: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  limitInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    paddingHorizontal: 10,
    borderRadius: 8,
    height: 40,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 4,
  },
  limitInput: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    minWidth: 60,
    textAlign: 'right',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    marginTop: 20,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteBtn: {
    marginTop: 30,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CardSettingsScreen;
