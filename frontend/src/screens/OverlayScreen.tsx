import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchMoment } from '../api/moment';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Moment } from '../types/moment';

type Props = NativeStackScreenProps<RootStackParamList, 'Overlay'>;

export default function OverlayScreen({ route, navigation }: Props) {
  const { photoUri } = route.params;
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [moment, setMoment] = useState<Moment | null>(null);
  const [momentError, setMomentError] = useState<string | null>(null);
  const [retakePressed, setRetakePressed] = useState(false);
  const retakeScale = useRef(new Animated.Value(1)).current;

  const handleRetakePressIn = () => {
    setRetakePressed(true);
    Animated.spring(retakeScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handleRetakePressOut = () => {
    setRetakePressed(false);
    Animated.spring(retakeScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
      tension: 40,
    }).start();
  };

  // get device location first
  useEffect(() => {
    (async () => {
      console.log('[location] requesting permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[location] permission status:', status);

      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }

      console.log('[location] fetching current position...');
      const position = await Location.getCurrentPositionAsync({});
      console.log('[location] got position:', position.coords);
      setLocation(position.coords);
    })();
  }, []);

  // once we have location, call the backend
  useEffect(() => {
    if (!location) return;

    (async () => {
      try {
        const data = await fetchMoment(location.latitude, location.longitude);
        setMoment(data);
      } catch (err) {
        console.log('[moment] error', err);
        setMomentError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [location]);

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.photo} />

      <View style={styles.locationBox}>
        {locationError ? (
          <Text style={styles.locationText}>{locationError}</Text>
        ) : location ? (
          <Text style={styles.locationText}>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={styles.locationText}>Getting location...</Text>
        )}
      </View>

      <ScrollView style={styles.momentBox}>
        {momentError ? (
          <Text style={styles.momentText}>{momentError}</Text>
        ) : moment ? (
          <Text style={styles.momentText}>{JSON.stringify(moment, null, 2)}</Text>
        ) : (
          <Text style={styles.momentText}>Loading moment data...</Text>
        )}
      </ScrollView>

      <Pressable
        style={styles.retakeHitArea}
        onPress={() => navigation.goBack()}
        onPressIn={handleRetakePressIn}
        onPressOut={handleRetakePressOut}
      >
        <Animated.View
          style={[
            styles.retakeButton,
            retakePressed && styles.retakeButtonPressed,
            { transform: [{ scale: retakeScale }] },
          ]}
        >
          <Text style={styles.retakeText}>Retake</Text>
        </Animated.View>
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
  momentBox: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    maxHeight: 200,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    padding: 12,
  },
  momentText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Courier',
  },
  retakeHitArea: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  retakeButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retakeButtonPressed: {
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  retakeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
