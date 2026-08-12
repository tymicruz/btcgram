import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CameraScreen from '../screens/CameraScreen';
import FeedScreen from '../screens/FeedScreen';
import OverlayScreen from '../screens/OverlayScreen';

export type RootStackParamList = {
  Feed: undefined;
  Camera: undefined;
  Overlay: { photoUri: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Feed" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Feed" component={FeedScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Overlay" component={OverlayScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
