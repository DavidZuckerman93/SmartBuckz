import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, FlatList, ScrollView, Alert } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { ArrowLeft, AlertTriangle, MessageSquare, Flag, Download } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';

import GlobalHeader from '../../components/GlobalHeader';
import ReportUserModal from '../../components/ReportUserModal';

const ReportsScreen = ({ navigation }) => {
  const { sellerData } = useUser();
  const [showReportModal, setShowReportModal] = useState(false);

  const renderItem = ({ item }) => (
    <View style={styles.reportItem}>
      <View style={[styles.reportIcon, { backgroundColor: item.type === 'complain' ? '#FFF3E0' : '#FFEBEE' }]}>
        <MaterialIcons 
          name={item.type === 'complain' ? 'sentiment-very-dissatisfied' : 'flag'} 
          size={20} 
          color={item.type === 'complain' ? '#FF9800' : COLORS.danger} 
        />
      </View>
      <View style={styles.reportDetails}>
        <View style={styles.reportHeaderRow}>
          <Text style={styles.reportType}>{item.type === 'complain' ? 'Customer Complaint' : 'Report'}</Text>
          <Text style={styles.reportDate}>{item.date}</Text>
        </View>
        <Text style={styles.reportText}>{item.text}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
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
        <Text style={styles.headerTitle}>Complaints & Reports</Text>
        <TouchableOpacity>
          <Download size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sellerData.reports}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.summaryBox}>
            <MaterialIcons name="sentiment-very-dissatisfied" size={32} color={COLORS.white} />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>Feedback Overview</Text>
              <Text style={styles.summarySubtitle}>You have {sellerData.reports.length} pending issues to resolve.</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="sentiment-satisfied-alt" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>Great job! You have no complaints or reports at this time.</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.reportUserBtn}
        onPress={() => setShowReportModal(true)}
      >
        <MaterialIcons name="flag" size={20} color={COLORS.white} />
        <Text style={styles.reportUserText}>Report a User</Text>
      </TouchableOpacity>

      <ReportUserModal 
        visible={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />
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
  listContent: {
    padding: 20,
  },
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
    alignItems: 'center',
    gap: 15,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  summarySubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  reportItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  reportIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  reportDetails: {
    flex: 1,
    marginLeft: 15,
  },
  reportHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reportType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  reportDate: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  reportText: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
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
  reportUserBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    left: 20,
    backgroundColor: COLORS.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 10,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  reportUserText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReportsScreen;
