import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useUser, USER_TYPES } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { ArrowLeft, User, Mail, Lock, Phone } from 'lucide-react-native';
import GlobalHeader from '../../components/GlobalHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignupScreen = ({ navigation }) => {
  const { userType, signup, saveUData } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      console.log("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    console.log("Starting signup for:", email);
    
    try {
      // This will call the backend and update the user state in UserContext
      const $signupResponse = await signup({ name, email, phone, password, role: userType });
      // If successful, RootNavigator will automatically switch to the main app stack
      console.log("Signup successful! resposnse value is: ", $signupResponse);
      // Save user data locally
      await saveUData({ name, email, phone, password, role: userType, allData: $signupResponse });
    } catch (err) {
      console.error("Signup error:", err);
      Alert.alert('Signup Failed', err.response?.data?.message || 'Something went wrong. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSeller = userType === USER_TYPES.SELLER;

  return (
    <SafeAreaView style={styles.container}>
      {/* <GlobalHeader navigation={navigation} /> */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.header}><Text style={styles.title}>SmartBuckz... </Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up as a {isSeller ? 'Seller' : 'Customer'} to get started</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                outlineColor="transparent"
                mode = "flat"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.signupButton, { backgroundColor: isSeller ? COLORS.secondary : COLORS.primary }]}
              onPress={handleSignup}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={isSeller ? COLORS.primary : COLORS.white} />
              ) : (
                <Text style={[styles.signupButtonText, { color: isSeller ? COLORS.primary : COLORS.white }]}>
                  Sign Up
                </Text>
              )}
              {/* <Text style={[styles.signupButtonText, { color: isSeller ? COLORS.primary : COLORS.white }]}>
                Sign Up
              </Text> */}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: isSeller ? COLORS.secondary : COLORS.primary }]}>
                  Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginTop: 8,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    borderWidth: 0,
    outlineWidth : 0,
    borderColor: 'transparent'
  },
  signupButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: COLORS.darkGray,
  },
  loginLink: {
    fontWeight: 'bold',
  },
});

export default SignupScreen;
