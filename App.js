import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from './src/context/UserContext';
import RootNavigator from './src/navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ResponsiveContainer from './src/components/ResponsiveContainer';
import { Platform } from 'react-native';

export default function App() {
  // Use PaystackProvider only on native platforms
  let PaystackProvider;
  if (Platform.OS !== 'web') {
    try {
      PaystackProvider = require('react-native-paystack-webview').PaystackProvider;
    } catch (e) {
      console.warn('PaystackProvider not available');
    }
  }

  const Content = () => (
    <>
      <StatusBar style="auto" />
      <RootNavigator />
    </>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        {Platform.OS !== 'web' && PaystackProvider ? (
          <PaystackProvider 
            publicKey="pk_live_165df48a15c75f4f848116a9f0e796c8d1ec1e55"
            currency="NGN"
          >
            <Content />
          </PaystackProvider>
        ) : (
          <Content />
        )}
      </UserProvider>
    </GestureHandlerRootView>
  );
}
