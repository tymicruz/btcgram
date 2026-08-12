import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CameraScreen from '../screens/CameraScreen';
import OverlayScreen from '../screens/OverlayScreen';

export type RootStackParamList = {
  Camera: undefined;
  Overlay: { photoUri: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Overlay" component={OverlayScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
