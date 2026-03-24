import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './screens/SplashScreen';
import AuthGatewayScreen from './screens/AuthGatewayScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import WorkoutSchedulerScreen from './screens/WorkoutSchedulerScreen';
import YouScreen from './screens/YouScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import PrivacySecurityScreen from './screens/PrivacySecurityScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';
import ProgressScreen from './screens/ProgressScreen';
import CalorieCalculatorScreen from './screens/CalorieCalculatorScreen';
import CalorieCounterScreen from './screens/CalorieCounterScreen';
import ExerciseLibraryScreen from './screens/ExerciseLibraryScreen';
import WorkoutLibraryScreen from './screens/WorkoutLibraryScreen';
import AITrainerScreen from './screens/AITrainerScreen';
import { ActivityIndicator, View, Platform, Alert } from 'react-native';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      {session ? (
        // Protected Routes
        profile?.onboarding_completed ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Explore" component={ExploreScreen} />
            <Stack.Screen name="WorkoutScheduler" component={WorkoutSchedulerScreen} />
            <Stack.Screen name="Workout" component={WorkoutScreen} />
            <Stack.Screen name="You" component={YouScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
            <Stack.Screen name="Progress" component={ProgressScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="CalorieCalculator" component={CalorieCalculatorScreen} />
            <Stack.Screen name="CalorieCounter" component={CalorieCounterScreen} />
            <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
            <Stack.Screen name="WorkoutLibrary" component={WorkoutLibraryScreen} />
            <Stack.Screen name="AITrainer" component={AITrainerScreen} />
          </>

        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )
      ) : (
        // Auth Routes
        <>
          <Stack.Screen name="AuthGateway" component={AuthGatewayScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
