import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Overlay'>;

export default function OverlayScreen({ route, navigation }: Props) {
  const { photoUri } = route.params;
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      console.log('[location] requesting permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[location] permission status:', status);

      if (status !== 'granted') {
        setErrorMsg('Location permission denied');
        return;
      }

      console.log('[location] fetching current position...');
      const position = await Location.getCurrentPositionAsync({});
      console.log('[location] got position:', position.coords);
      setLocation(position.coords);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.photo} />

      <View style={styles.locationBox}>
        {errorMsg ? (
          <Text style={styles.locationText}>{errorMsg}</Text>
        ) : location ? (
          <Text style={styles.locationText}>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={styles.locationText}>Getting location...</Text>
        )}
      </View>

      <Pressable style={styles.retakeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.retakeText}>Retake</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    flex: 1,
    width: '100%',
  },
  locationBox: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retakeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
