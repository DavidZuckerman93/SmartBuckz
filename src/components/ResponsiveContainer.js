import React from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';
const MAX_WIDTH = 500; // Typical mobile width for web view

const ResponsiveContainer = ({ children, style }) => {
  if (!IS_WEB) return <View style={[styles.flex, style]}>{children}</View>;

  return (
    <View style={styles.webWrapper}>
      <View style={[styles.webContent, style]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  webWrapper: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Light background for outside the "phone"
    alignItems: 'center',
    justifyContent: 'center',
  },
  webContent: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});

export default ResponsiveContainer;
