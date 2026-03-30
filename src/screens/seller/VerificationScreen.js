import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, Alert, Image, Dimensions } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { ArrowLeft, Camera, Video, CheckCircle, Upload, X, ShieldCheck, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalHeader from '../../components/GlobalHeader';

const { width } = Dimensions.get('window');

const VerificationScreen = ({ navigation }) => {
  const { sellerData, updateVerificationStatus } = useUser();
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 business photos.');
      return;
    }
    // Mock upload
    const newPhoto = `https://picsum.photos/200/200?random=${Date.now()}`;
    setPhotos([...photos, newPhoto]);
  };

  const handleVideoUpload = () => {
    // Mock upload
    setVideo('business_verification_video.mp4');
  };

  const handleSubmit = async () => {
    if (photos.length < 5) {
      Alert.alert('Incomplete', 'Please upload at least 5 photos of your business.');
      return;
    }
    if (!video) {
      Alert.alert('Incomplete', 'Please upload a verification video.');
      return;
    }

    setIsUploading(true);
    try {
      await updateVerificationStatus('Verified', { photos, video });
      Alert.alert('Success!', 'Your business has been verified. You now have the verified badge.', [
        { text: 'Great!', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('Verification submission failed:', err);
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business Verification</Text>
          <View style={{ width: 24 }} />
        </View>

        <LinearGradient
          colors={[COLORS.primary, '#004080']}
          style={styles.infoBox}
        >
          <ShieldCheck size={32} color={COLORS.secondary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Get Verified</Text>
            <Text style={styles.infoSubtitle}>Build trust with customers and unlock premium features by verifying your business.</Text>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Photos (Min 5)</Text>
          <Text style={styles.sectionSubtitle}>Upload clear photos of your storefront, kitchen, and menu.</Text>
          
          <View style={styles.photoGrid}>
            {photos.map((uri, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri }} style={styles.photo} />
                <TouchableOpacity 
                  style={styles.removeBtn}
                  onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                >
                  <X size={12} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 5 && (
              <TouchableOpacity style={styles.uploadBtn} onPress={handlePhotoUpload}>
                <Camera size={32} color={COLORS.primary} />
                <Text style={styles.uploadText}>{photos.length}/5</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Video</Text>
          <Text style={styles.sectionSubtitle}>Record a short video (max 30s) showing your workspace.</Text>
          
          {video ? (
            <View style={styles.videoPreview}>
              <Video size={40} color={COLORS.success} />
              <Text style={styles.videoName}>Video uploaded successfully</Text>
              <TouchableOpacity onPress={() => setVideo(null)}>
                <X size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.videoUploadBtn} onPress={handleVideoUpload}>
              <Upload size={24} color={COLORS.primary} />
              <Text style={styles.videoUploadText}>Record or Upload Video</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Address</Text>
          <View style={styles.addressBox}>
            <MapPin size={20} color={COLORS.primary} />
            <Text style={styles.addressText}>{sellerData.address || '123 Victoria Island, Lagos'}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, isUploading && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={isUploading}
        >
          <Text style={styles.submitBtnText}>
            {isUploading ? 'Verifying...' : 'Submit for Verification'}
          </Text>
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
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    alignItems: 'center',
    gap: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  infoSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    lineHeight: 18,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 15,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtn: {
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    borderRadius: 12,
    backgroundColor: COLORS.gray,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  videoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    gap: 15,
  },
  videoName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
  },
  videoUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    gap: 10,
  },
  videoUploadText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledBtn: {
    opacity: 0.7,
  },
});

export default VerificationScreen;
