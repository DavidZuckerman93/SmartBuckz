import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Modal, FlatList, TextInput, Switch, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { COLORS } from '../../theme/colors';
import { useUser } from '../../context/UserContext';
import { User, X, Phone, MapPin, Mail, Plus, Trash2, Edit2, Check, Info, Camera, Image as ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import GlobalHeader from '../../components/GlobalHeader';
import { sellerService, userService } from '../../services/api';

const SellerProfileScreen = ({ navigation }) => {
  const { user, setUser, updateProfileImage } = useUser();
  const [viewMode, setViewMode] = useState("Bio"); // Bio, Menu
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    address: user?.address || '',
    phone: user?.phone || ''
  });

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

  // Menu Modal State
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [isEditingMenuItem, setIsEditingMenuItem] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] = useState({
    id: null,
    name: '',
    description: '',
    price: '',
    is_available: true
  });

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sellerService.getSellerMenu(user.id);
      setMenuItems(data);
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (user?.id) {
      fetchMenu();
    }
  }, [fetchMenu, user?.id]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
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

  const handleSaveMenuItem = async () => {
    if (!currentMenuItem.name || !currentMenuItem.price) {
      Alert.alert('Error', 'Please provide at least a name and price');
      return;
    }

    try {
      setLoading(true);
      if (isEditingMenuItem) {
        await sellerService.updateMenuItem(currentMenuItem.id, currentMenuItem);
      } else {
        await sellerService.addMenuItem(currentMenuItem);
      }
      await fetchMenu();
      setShowMenuModal(false);
      setCurrentMenuItem({ id: null, name: '', description: '', price: '', is_available: true });
    } catch (err) {
      console.error('Error saving menu item:', err);
      Alert.alert('Error', 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMenuItem = async (id) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this menu item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setLoading(true);
              await sellerService.deleteMenuItem(id);
              await fetchMenu();
            } catch (err) {
              console.error('Error deleting menu item:', err);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItemCard}>
      <View style={styles.menuItemInfo}>
        <Text style={styles.menuItemName}>{item.name}</Text>
        <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.menuItemPrice}>₦{parseFloat(item.price).toLocaleString()}</Text>
        <View style={[styles.statusTag, { backgroundColor: item.is_available ? COLORS.success : COLORS.danger }]}>
          <Text style={styles.statusTagText}>{item.is_available ? 'Available' : 'Unavailable'}</Text>
        </View>
      </View>
      <View style={styles.menuItemActions}>
        <TouchableOpacity 
          style={styles.actionIconBtn} 
          onPress={() => {
            setCurrentMenuItem(item);
            setIsEditingMenuItem(true);
            setShowMenuModal(true);
          }}
        >
          <Edit2 size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionIconBtn} 
          onPress={() => handleDeleteMenuItem(item.id)}
        >
          <Trash2 size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader navigation={navigation} showSearch={true} />
      
      <View style={styles.tabHeader}>
        <TouchableOpacity 
          style={[styles.tabBtn, viewMode === 'Bio' && styles.activeTab]} 
          onPress={() => setViewMode('Bio')}
        >
          <Text style={[styles.tabText, viewMode === 'Bio' && styles.activeTabText]}>Profile Bio</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, viewMode === 'Menu' && styles.activeTab]} 
          onPress={() => setViewMode('Menu')}
        >
          <Text style={[styles.tabText, viewMode === 'Menu' && styles.activeTabText]}>Live Menu</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'Bio' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
            <Text style={styles.businessNameLarge}>{user?.name}</Text>
            <Text style={styles.roleTag}>Verified Seller</Text>
          </View>

          <View style={styles.profileSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Business Information</Text>
              {!isEditingProfile && (
                <TouchableOpacity onPress={() => setIsEditingProfile(true)}>
                  <Edit2 size={20} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>

            {isEditingProfile ? (
              <View style={styles.editForm}>
                <Text style={styles.label}>Business Name</Text>
                <TextInput 
                  style={styles.input} 
                  value={profileData.name} 
                  onChangeText={(t) => setProfileData({...profileData, name: t})} 
                />
                
                <Text style={styles.label}>Address</Text>
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

                <View style={styles.formActions}>
                  <TouchableOpacity 
                    style={[styles.btn, styles.cancelBtn]} 
                    onPress={() => {
                      setIsEditingProfile(false);
                      setProfileData({ name: user.name, address: user.address, phone: user.phone });
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.btn, styles.saveBtn]} 
                    onPress={handleUpdateProfile}
                    disabled={loading}
                  >
                    <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.bioDetails}>
                <View style={styles.bioItem}>
                  <User size={20} color={COLORS.primary} />
                  <View style={styles.bioText}>
                    <Text style={styles.bioLabel}>Business Name</Text>
                    <Text style={styles.bioValue}>{user?.name}</Text>
                  </View>
                </View>

                <View style={styles.bioItem}>
                  <MapPin size={20} color={COLORS.primary} />
                  <View style={styles.bioText}>
                    <Text style={styles.bioLabel}>Location / Address</Text>
                    <Text style={styles.bioValue}>{user?.address || 'No address set'}</Text>
                  </View>
                </View>

                <View style={styles.bioItem}>
                  <Phone size={20} color={COLORS.primary} />
                  <View style={styles.bioText}>
                    <Text style={styles.bioLabel}>Contact Phone</Text>
                    <Text style={styles.bioValue}>{user?.phone || 'No phone set'}</Text>
                  </View>
                </View>

                <View style={styles.bioItem}>
                  <Mail size={20} color={COLORS.primary} />
                  <View style={styles.bioText}>
                    <Text style={styles.bioLabel}>Email Address</Text>
                    <Text style={styles.bioValue}>{user?.email}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={menuItems}
            renderItem={renderMenuItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />
              ) : (
                <View style={styles.emptyState}>
                  <Info size={48} color={COLORS.gray} />
                  <Text style={styles.emptyText}>Your menu is empty.</Text>
                  <Text style={styles.emptySubText}>Add items that buyers can see and order.</Text>
                </View>
              )
            }
          />
          
          <TouchableOpacity 
            style={styles.fab} 
            onPress={() => {
              setCurrentMenuItem({ id: null, name: '', description: '', price: '', is_available: true });
              setIsEditingMenuItem(false);
              setShowMenuModal(true);
            }}
          >
            <Plus size={32} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Menu Item Modal */}
      <Modal visible={showMenuModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditingMenuItem ? 'Edit Menu Item' : 'Add New Item'}</Text>
              <TouchableOpacity onPress={() => setShowMenuModal(false)}>
                <X size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Item Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g., Jollof Rice"
                value={currentMenuItem.name}
                onChangeText={(t) => setCurrentMenuItem({...currentMenuItem, name: t})}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput 
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                placeholder="Describe the dish..."
                multiline
                value={currentMenuItem.description}
                onChangeText={(t) => setCurrentMenuItem({...currentMenuItem, description: t})}
              />

              <Text style={styles.label}>Price (₦)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="0.00"
                keyboardType="numeric"
                value={currentMenuItem.price.toString()}
                onChangeText={(t) => setCurrentMenuItem({...currentMenuItem, price: t})}
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Available for Order</Text>
                <Switch 
                  value={currentMenuItem.is_available} 
                  onValueChange={(v) => setCurrentMenuItem({...currentMenuItem, is_available: v})}
                  trackColor={{ false: '#D1D1D1', true: COLORS.success }}
                />
              </View>

              <TouchableOpacity 
                style={[styles.btn, styles.saveBtn, { marginTop: 20 }]} 
                onPress={handleSaveMenuItem}
                disabled={loading}
              >
                <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Item'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 10,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: COLORS.secondary,
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 15,
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  businessNameLarge: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  roleTag: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 5,
  },
  profileSection: {
    backgroundColor: COLORS.gray,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
  bioDetails: {
    gap: 20,
  },
  bioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  bioText: {
    flex: 1,
  },
  bioLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  bioValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 2,
  },
  editForm: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 5,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  formActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F5F5F5',
  },
  cancelBtnText: {
    color: COLORS.darkGray,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  menuItemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray,
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  menuItemDesc: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  menuItemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginTop: 5,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 5,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  menuItemActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default SellerProfileScreen;
