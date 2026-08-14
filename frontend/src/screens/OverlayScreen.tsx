import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { fetchMoment } from '../api/moment';
import { postMoment } from '../api/moments';
import CloseButton from '../components/CloseButton';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Moment } from '../types/moment';

type Props = NativeStackScreenProps<RootStackParamList, 'Overlay'>;

export default function OverlayScreen({ route, navigation }: Props) {
  const { photoUri } = route.params;
  const { session } = useAuth();
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [moment, setMoment] = useState<Moment | null>(null);
  const [momentError, setMomentError] = useState<string | null>(null);

  const captureAreaRef = useRef<View>(null);

  const [savePressed, setSavePressed] = useState(false);
  const saveScale = useRef(new Animated.Value(1)).current;
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [postPressed, setPostPressed] = useState(false);
  const postScale = useRef(new Animated.Value(1)).current;
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const handleSavePressIn = () => {
    setSavePressed(true);
    Animated.spring(saveScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handleSavePressOut = () => {
    setSavePressed(false);
    Animated.spring(saveScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
      tension: 40,
    }).start();
  };

  const handlePostPressIn = () => {
    setPostPressed(true);
    Animated.spring(postScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePostPressOut = () => {
    setPostPressed(false);
    Animated.spring(postScale, {
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

  const handleDiscard = () => {
    navigation.goBack();
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      console.log('[save] requesting media library permission...');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      console.log('[save] permission status:', status);

      if (status !== 'granted') {
        setSaveMessage('Photos permission denied');
        return;
      }

      console.log('[save] capturing composed view...');
      const uri = await captureRef(captureAreaRef, { format: 'jpg', quality: 0.92 });
      console.log('[save] captured to', uri);

      await MediaLibrary.saveToLibraryAsync(uri);
      console.log('[save] saved to camera roll');
      setSaveMessage('Saved to Camera Roll');
    } catch (err) {
      console.log('[save] error', err);
      setSaveMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePost = async () => {
    if (posting) return;

    if (!session) {
      setPostError('You need to be logged in to post.');
      return;
    }
    if (!moment || !location) {
      setPostError('Still loading Moment data - try again in a moment.');
      return;
    }

    setPosting(true);
    setPostError(null);

    try {
      console.log('[post] capturing composed view...');
      const composedUri = await captureRef(captureAreaRef, { format: 'jpg', quality: 0.92 });
      console.log('[post] captured to', composedUri);

      await postMoment(session.user.id, {
        ...moment,
        photoUri: composedUri,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      console.log('[post] success, returning to feed');
      navigation.popToTop();
    } catch (err) {
      console.log('[post] error', err);
      setPostError(err instanceof Error ? err.message : String(err));
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View ref={captureAreaRef} collapsable={false} style={styles.captureArea}>
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
      </View>

      <CloseButton onPress={handleDiscard} />

      {(saveMessage || postError) && (
        <View style={styles.saveMessageBox}>
          <Text style={styles.saveMessageText}>{saveMessage ?? postError}</Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable
          style={styles.actionHitArea}
          onPress={handleSave}
          onPressIn={handleSavePressIn}
          onPressOut={handleSavePressOut}
        >
          <Animated.View
            style={[
              styles.saveButton,
              savePressed && styles.saveButtonPressed,
              { transform: [{ scale: saveScale }] },
            ]}
          >
            <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
          </Animated.View>
        </Pressable>

        <Pressable
          style={styles.actionHitArea}
          onPress={handlePost}
          onPressIn={handlePostPressIn}
          onPressOut={handlePostPressOut}
        >
          <Animated.View
            style={[
              styles.postButton,
              postPressed && styles.postButtonPressed,
              { transform: [{ scale: postScale }] },
            ]}
          >
            <Text style={styles.postText}>{posting ? 'Posting...' : 'Post'}</Text>
          </Animated.View>
        </Pressable>
      </View>
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
  captureArea: {
    flex: 1,
    width: '100%',
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
  saveMessageBox: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveMessageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 12,
  },
  actionHitArea: {},
  saveButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonPressed: {
    backgroundColor: '#ddd',
  },
  saveText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '600',
  },
  postButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  postButtonPressed: {
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  postText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
