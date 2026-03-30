import React, {useEffect} from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, SafeAreaView, Dimensions, ImageBackground } from 'react-native';
import { useUser, USER_TYPES } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { User, Store } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SelectionScreen = ({ navigation }) => {
  const { selectUserType, fetchUserData, getUData, setUser, setUserType } = useUser();

  useEffect(() =>{
   
    const getIt = async () => {
       const res = await getUData();
          if(res){
            // console.log('Response is: ', res, "User is : ", res.user, " \n User role is: ", res.role);
            const userType = res.role;
            const user = res;

            setUser(user);
            setUserType(userType);

            
          }
    };
    getIt();
  }, [])
  const handleSelection = (type) => {
    selectUserType(type);
    navigation.navigate('Login', { type });
  };

  return (
    <ImageBackground 
      source={require('./background.jpg')} // Fallback to icon if background not found, user should replace this path
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0, 51, 102, 0.5)', COLORS.primary]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image 
            source={require('../../res/Logo2.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={styles.title}>SmartBuckz</Text>
          <Text style={styles.tagline}>Make your money work for you.</Text>
          <Text style={styles.subtitle}>Choose your account type</Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: COLORS.primary }]}
            onPress={() => handleSelection(USER_TYPES.BUYER)}
          >
            <User size={38} color={'white'} strokeWidth={1.5} />
            <Text style={styles.cardTitle}>Buyer</Text>
            <Text style={styles.cardDescription}>Looking for food services</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: COLORS.secondary }]}
            onPress={() => handleSelection(USER_TYPES.SELLER)}
          >
            <Store size={38} color={COLORS.primary} strokeWidth={1.5} />
            <Text style={[styles.cardTitle, { color: COLORS.primary }]}>Seller</Text>
            <Text style={[styles.cardDescription, { color: COLORS.primary }]}>Providing delicious meals</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Secure Food-Only Payments</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100vw',
    height: '100vh',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 100,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    marginTop: 5,
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginTop: 20,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  card: {
    width: width * 0.8, // Reduced width
    padding: 20, // Reduced padding/height
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    shadowColor: '#000',
    shadowOffset: { width: 0, height:7 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
    flexDirection: 'row'
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 0,
  },
  cardDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'lightgrey',
    fontWeight: '600',
  },
});

export default SelectionScreen;
