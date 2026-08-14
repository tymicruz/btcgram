import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';

import { AuthProvider, useAuth } from '../context/AuthContext';
import CameraScreen from '../screens/CameraScreen';
import FeedScreen from '../screens/FeedScreen';
import LoginScreen from '../screens/LoginScreen';
import MomentDetailScreen from '../screens/MomentDetailScreen';
import OverlayScreen from '../screens/OverlayScreen';
import { StoredMoment } from '../types/storedMoment';

export type RootStackParamList = {
  Login: undefined;
  Feed: undefined;
  Camera: undefined;
  Overlay: { photoUri: string };
  MomentDetail: { moment: StoredMoment };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { session, loading } = useAuth();

  if (loading) {
    // still checking for an existing session - avoid a flash of the
    // login screen if the person's actually already logged in
    return <View style={{ flex: 1, backgroundColor: '#111' }} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Feed" component={FeedScreen} />
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="Overlay" component={OverlayScreen} />
            <Stack.Screen name="MomentDetail" component={MomentDetailScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function RootNavigator() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
