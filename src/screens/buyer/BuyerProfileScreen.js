import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, TextInput, Alert, ActivityIndicator, ScrollView, Image, Modal } from 'react-native';
import { COLORS } from '../../theme/colors';
import { useUser } from '../../context/UserContext';
import { User, Phone, MapPin, Mail, Edit2, Camera, ArrowLeft, History, CreditCard, ShoppingBag, Image as ImageIcon, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import GlobalHeader from '../../components/GlobalHeader';
import { sellerService } from '../../services/api';

const BuyerProfileScreen = ({ navigation }) => {
  const { user, setUser, updateProfileImage, orders, cards } = useUser();
  const [loading, setLoading] = useState(false);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    address: user?.address || '',
    phone: user?.phone || ''
  });

  // const handleUpdateImage = () => {
  //   Alert.prompt(
  //     'Update Profile Photo',
  //     'Please enter the image URL for your profile photo.',
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       { 
  //         text: 'Update', 
  //         onPress: async (url) => {
  //           if (!url) return;
  //           try {
  //             setIsUpdatingImage(true);
  //             await updateProfileImage(url);
  //             Alert.alert('Success', 'Profile photo updated successfully!');
  //           } catch (err) {
  //             Alert.alert('Error', 'Failed to update profile photo.');
  //           } finally {
  //             setIsUpdatingImage(false);
  //           }
  //         }
  //       }
  //     ],
  //     'plain-text',
  //     user?.profile_image || ''
  //   );
  // };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      // Reusing sellerService.updateProfile as it likely hits the same user update endpoint
      await sellerService.updateProfile(profileData);
      setUser({ ...user, ...profileData });
      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Orders', value: orders.length, icon: ShoppingBag, color: '#E3F2FD' },
    { label: 'Cards', value: cards.length, icon: CreditCard, color: '#F3E5F5' },
    { label: 'History', value: 'View', icon: History, color: '#E8F5E9', action: () => navigation.navigate('History') },
  ];

  const [showImageModal, setShowImageModal] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleUpdateImage(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleUpdateImage = async (imageAsset) => {
    try {
      setIsUpdatingImage(true);
      await updateProfileImage(imageAsset);
      setShowImageModal(false);
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile photo.');
    } finally {
      setIsUpdatingImage(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader navigation={navigation} showSearch={true} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.imageContainer}>
          <TouchableOpacity style={styles.profileImageWrapper} onPress={() => setShowImageModal(true)}>
            {user?.profile_image ? (
              <Image source={{ uri: user.profile_image }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <User size={48} color={COLORS.darkGray} />
              </View>
            )}
            <View style={styles.cameraBtn}>
              {isUpdatingImage ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Camera size={16} color={COLORS.white} />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.userNameLarge}>{user?.name}</Text>
          <Text style={styles.roleTag}>Verified Buyer</Text>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.statCard}
              onPress={stat.action}
              disabled={!stat.action}
            >
              <View style={[styles.statIconContainer, { backgroundColor: stat.color }]}>
                <stat.icon size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.profileSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {!isEditingProfile && (
              <TouchableOpacity onPress={() => setIsEditingProfile(true)}>
                <Edit2 size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>

          {isEditingProfile ? (
            <View style={styles.editForm}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.input} 
                value={profileData.name} 
                onChangeText={(t) => setProfileData({...profileData, name: t})} 
              />
              
              <Text style={styles.label}>Delivery Address</Text>
              <TextInput 
                style={styles.input} 
                value={profileData.address} 
                onChangeText={(t) => setProfileData({...profileData, address: t})} 
                multiline
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput 
                style={styles.input} 
                value={profileData.phone} 
                onChangeText={(t) => setProfileData({...profileData, phone: t})} 
                keyboardType="phone-pad"
              />

              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={[styles.btn, styles.cancelBtn]} 
                  onPress={() => setIsEditingProfile(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btn, styles.saveBtn]} 
                  onPress={handleUpdateProfile}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Mail size={20} color={COLORS.primary} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Phone size={20} color={COLORS.primary} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <MapPin size={20} color={COLORS.primary} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Delivery Address</Text>
                  <Text style={styles.infoValue}>{user?.address || 'Not set'}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Update Modal */}
      <Modal visible={showImageModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profile Photo</Text>
              <TouchableOpacity onPress={() => setShowImageModal(false)}>
                <X size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={{ gap: 15, marginBottom: 20 }}>
              <Text style={styles.confirmText}>
                Choose a new profile photo from your device gallery.
              </Text>
              
              <TouchableOpacity 
                style={styles.pickImageBtn} 
                onPress={pickImage}
                disabled={isUpdatingImage}
              >
                <View style={styles.pickImageContent}>
                  <ImageIcon size={24} color={COLORS.primary} />
                  <Text style={styles.pickImageText}>Select Image from Gallery</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.modalHelpText}>
                Supported formats: JPEG, PNG. Max size: 5MB.
              </Text>
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity 
                style={[styles.btn, styles.cancelBtn]} 
                onPress={() => setShowImageModal(false)}
                disabled={isUpdatingImage}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.gray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 4,
    borderColor: COLORS.gray,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  userNameLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 15,
  },
  roleTag: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  profileSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  infoList: {
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 16,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 2,
  },
  editForm: {
    gap: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 5,
  },
  input: {
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: COLORS.black,
  },
  editActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  confirmText: {
    fontSize: 16,
    color: COLORS.black,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
  modalHelpText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 8,
    textAlign: 'center',
  },
  pickImageBtn: {
    backgroundColor: COLORS.gray,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 10,
  },
  pickImageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  btn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.gray,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
  },
  cancelBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default BuyerProfileScreen;