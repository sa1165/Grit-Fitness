import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, StatusBar, Animated, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

const SplashScreen = ({ navigation }) => {
  const { session, profile } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Start animation after a short delay
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        delay: 500,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
        delay: 500,
      }),
    ]).start();

    // Auto-navigate after animation + delay
    const timer = setTimeout(() => {
      if (session) {
        if (profile && !profile.onboarding_completed) {
          navigation.replace('Onboarding');
        } else {
          navigation.replace('Home');
        }
      } else {
        navigation.replace('AuthGateway');
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, session, profile]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/splash-design.png')}
          style={styles.splashImage}
          resizeMode="contain"
        />
        <Animated.View style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.title}>Grit.</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  splashImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  textContainer: {
    marginTop: 140, // Reduced gap to bring text closer to the logo
    marginLeft: 8,  // Slighly shifted right for precise optical alignment
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '600',
    letterSpacing: -1,
  },
});

export default SplashScreen;
