import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Feed'>;

export default function FeedScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Moments</Text>
        <Text style={styles.emptyText}>No Moments yet. Capture your first one.</Text>
      </View>

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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    color: '#8b887f',
    fontSize: 15,
    textAlign: 'center',
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
