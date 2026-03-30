import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useUser, USER_TYPES } from '../context/UserContext';
import { COLORS } from '../theme/colors';
import { Home, CreditCard, History, User, Store, LayoutDashboard, QrCode, AlertTriangle, Search, Landmark } from 'lucide-react-native';

// Auth Screens
import SelectionScreen from '../screens/auth/SelectionScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Buyer Screens
import BuyerHomeScreen from '../screens/buyer/HomeScreen';
import VirtualCardScreen from '../screens/buyer/VirtualCardScreen';
import FundingScreen from '../screens/buyer/FundingScreen';
import HistoryScreen from '../screens/buyer/HistoryScreen';
import CardSettingsScreen from '../screens/buyer/CardSettingsScreen';
import SellerDiscoveryScreen from '../screens/buyer/SellerDiscoveryScreen';
import SellerDetailsScreen from '../screens/buyer/SellerDetailsScreen';
import BanksScreen from '../screens/buyer/BanksScreen';
import CardFundingScreen from '../screens/buyer/CardFundingScreen';
import BuyerProfileScreen from '../screens/buyer/BuyerProfileScreen';

// Seller Screens
import SellerHomeScreen from '../screens/seller/HomeScreen';
import ScanScreen from '../screens/seller/ScanScreen';
import SalesScreen from '../screens/seller/SalesScreen';
import ReportsScreen from '../screens/seller/ReportsScreen';
import WithdrawScreen from '../screens/seller/WithdrawScreen';
import VerificationScreen from '../screens/seller/VerificationScreen';
import SellerProfileScreen from '../screens/seller/SellerProfileScreen';

import ResponsiveContainer from '../components/ResponsiveContainer';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <ResponsiveContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Selection" component={SelectionScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  </ResponsiveContainer>
);

const BuyerHomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={BuyerHomeScreen} />
    <Stack.Screen name="Funding" component={FundingScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SellerDetails" component={SellerDetailsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="BuyerProfile" component={BuyerProfileScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const ExploreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Discovery" component={SellerDiscoveryScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SellerDetails" component={SellerDetailsScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const BuyerCardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CardsMain" component={VirtualCardScreen} options={{ headerShown: false }} />
    <Stack.Screen name="CardSettings" component={CardSettingsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="CardFunding" component={CardFundingScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Banks" component={BanksScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const BuyerTabs = () => (
  <ResponsiveContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.white,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarStyle: { 
          height: 65, 
          paddingBottom: 10, 
          paddingTop: 5,
          backgroundColor: COLORS.primary,
          borderTopWidth: 0,
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') return <Home size={size} color={color} />;
          if (route.name === 'Explore') return <Search size={size} color={color} />;
          if (route.name === 'Cards') return <CreditCard size={size} color={color} />;
          if (route.name === 'Banks') return <Landmark size={size} color={color} />;
          if (route.name === 'History') return <History size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={BuyerHomeStack} />
      <Tab.Screen name="Explore" component={ExploreStack} />
      <Tab.Screen name="Cards" component={BuyerCardStack} />
      <Tab.Screen name="Banks" component={BanksScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  </ResponsiveContainer>
);

const SellerHomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashboardMain" component={SellerHomeScreen} />
    <Stack.Screen name="Withdraw" component={WithdrawScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Verification" component={VerificationScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
    <Stack.Screen name="SellerDetails" component={SellerDetailsScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const SellerTabs = () => (
  <ResponsiveContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.white,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarStyle: { 
          height: 65, 
          paddingBottom: 10, 
          paddingTop: 5,
          backgroundColor: COLORS.primary,
          borderTopWidth: 0,
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Dashboard') return <LayoutDashboard size={size} color={color} />;
          if (route.name === 'Scan') return <QrCode size={size} color={color} />;
          if (route.name === 'Banks') return <Landmark size={size} color={color} />;
          if (route.name === 'Sales') return <History size={size} color={color} />;
          if (route.name === 'Reports') return <AlertTriangle size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={SellerHomeStack} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Banks" component={BanksScreen} />
      <Tab.Screen name="Sales" component={SalesScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  </ResponsiveContainer>
);

const RootNavigator = () => {
  const { user, userType } = useUser();
// Changes based on userType or null
  return (
    <NavigationContainer>
      {user ? (
        userType === USER_TYPES.BUYER ? <BuyerTabs /> : <SellerTabs />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;
