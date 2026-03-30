import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Search, X, AlertTriangle, Send, User } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { userService } from '../services/api';

const ReportUserModal = ({ visible, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await userService.searchUsers(searchQuery);
      setUsers(data);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedUser || !reportReason.trim()) {
      Alert.alert('Incomplete', 'Please select a user and provide a reason for the report.');
      return;
    }

    setSubmitting(true);
    try {
      await userService.reportUser({
        reported_user_id: selectedUser.id,
        reason: reportReason.trim()
      });
      Alert.alert('Success', 'Report submitted successfully. Thank you for helping keep our community safe.');
      resetAndClose();
    } catch (err) {
      console.error('Error submitting report:', err);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSearchQuery('');
    setUsers([]);
    setSelectedUser(null);
    setReportReason('');
    onClose();
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem} 
      onPress={() => setSelectedUser(item)}
    >
      <View style={styles.userIcon}>
        {item.profile_image ? (
          <Image source={{ uri: item.profile_image }} style={styles.userImage} />
        ) : (
          <User size={20} color={COLORS.primary} />
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email} • {item.role}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <AlertTriangle size={24} color={COLORS.danger} />
              <Text style={styles.modalTitle}>Report a User</Text>
            </View>
            <TouchableOpacity onPress={resetAndClose}>
              <X size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {!selectedUser ? (
            <View style={styles.searchSection}>
              <Text style={styles.instructions}>Search for the user you want to report</Text>
              <View style={styles.searchBar}>
                <Search size={20} color={COLORS.darkGray} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Enter name or email..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>

              {loading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
              ) : (
                <FlatList
                  data={users}
                  renderItem={renderUserItem}
                  keyExtractor={item => item.id.toString()}
                  style={styles.userList}
                  ListEmptyComponent={
                    searchQuery.length >= 2 ? (
                      <Text style={styles.emptyText}>No users found matching "{searchQuery}"</Text>
                    ) : null
                  }
                />
              )}
            </View>
          ) : (
            <View style={styles.reportSection}>
              <View style={styles.selectedUserCard}>
                <View style={styles.userIconLarge}>
                  {selectedUser.profile_image ? (
                    <Image source={{ uri: selectedUser.profile_image }} style={styles.userImage} />
                  ) : (
                    <User size={24} color={COLORS.primary} />
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{selectedUser.name}</Text>
                  <Text style={styles.userEmail}>{selectedUser.email}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedUser(null)}>
                  <Text style={styles.changeBtn}>Change</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Reason for Report</Text>
              <TextInput
                style={styles.reportInput}
                placeholder="Describe why you are reporting this user..."
                multiline
                numberOfLines={6}
                value={reportReason}
                onChangeText={setReportReason}
                autoFocus
              />

              <TouchableOpacity 
                style={[styles.submitBtn, submitting && styles.disabledBtn]}
                onPress={handleSubmitReport}
                disabled={submitting}
              >
                <Send size={20} color={COLORS.white} />
                <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Report'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    minHeight: '60%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  instructions: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.black,
  },
  userList: {
    maxHeight: 300,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 10,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  userImage: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.darkGray,
    fontStyle: 'italic',
  },
  reportSection: {
    gap: 15,
  },
  selectedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  userIconLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  changeBtn: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  reportInput: {
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    height: 150,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitBtn: {
    backgroundColor: COLORS.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
    marginTop: 10,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});

export default ReportUserModal;
