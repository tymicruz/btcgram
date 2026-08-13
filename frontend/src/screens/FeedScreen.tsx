import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { fetchRecentMoments } from '../api/moments';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/RootNavigator';
import { StoredMoment } from '../types/storedMoment';

type Props = NativeStackScreenProps<RootStackParamList, 'Feed'>;

export default function FeedScreen({ navigation }: Props) {
  const [moments, setMoments] = useState<StoredMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // refetch every time this screen comes into focus (e.g. after posting a
  // new Moment and navigating back), not just on first mount
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
          const data = await fetchRecentMoments();
          if (!cancelled) setMoments(data);
        } catch (err) {
          if (!cancelled) {
            setErrorMsg(err instanceof Error ? err.message : String(err));
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Moments</Text>
        <Pressable onPress={() => supabase.auth.signOut()}>
          <Text style={styles.logOutText}>Log Out</Text>
        </Pressable>
      </View>

      {errorMsg ? (
        <Text style={styles.emptyText}>{errorMsg}</Text>
      ) : loading ? (
        <Text style={styles.emptyText}>Loading...</Text>
      ) : moments.length === 0 ? (
        <Text style={styles.emptyText}>No Moments yet. Capture your first one.</Text>
      ) : (
        <FlatList
          data={moments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.photo_url }} style={styles.thumbnail} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardCity}>{item.city ?? 'Unknown location'}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      <Pressable style={styles.newButtonHitArea} onPress={() => navigation.navigate('Camera')}>
        <View style={styles.newButton}>
          <Text style={styles.newButtonText}>📷  New Moment</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  logOutText: {
    color: '#8b887f',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    flex: 1,
    color: '#8b887f',
    fontSize: 15,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 24,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1b19',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#33312c',
  },
  cardInfo: {
    marginLeft: 12,
  },
  cardCity: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardDate: {
    color: '#8b887f',
    fontSize: 13,
    marginTop: 2,
  },
  newButtonHitArea: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  newButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  newButtonText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '700',
  },
});
