import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { deleteMoment } from '../api/moments';
import CloseButton from '../components/CloseButton';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'MomentDetail'>;

export default function MomentDetailScreen({ route, navigation }: Props) {
  const { moment } = route.params;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setMessage(null);

    try {
      console.log('[detail] requesting media library permission...');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setMessage('Photos permission denied');
        return;
      }

      // photo_url is a remote Supabase Storage URL, not a local file -
      // saveToLibraryAsync needs an actual file on the device, so this
      // downloads it into the cache directory first.
      console.log('[detail] downloading photo...');
      const downloaded = await File.downloadFileAsync(moment.photo_url, Paths.cache);
      console.log('[detail] downloaded to', downloaded.uri);

      await MediaLibrary.saveToLibraryAsync(downloaded.uri);
      console.log('[detail] saved to camera roll');
      setMessage('Saved to Camera Roll');
    } catch (err) {
      console.log('[detail] save error', err);
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete this Moment?', 'This permanently removes it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            console.log('[detail] deleting moment', moment.id);
            await deleteMoment(moment);
            navigation.goBack();
          } catch (err) {
            console.log('[detail] delete error', err);
            setMessage(err instanceof Error ? err.message : String(err));
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: moment.photo_url }} style={styles.photo} />

      <CloseButton icon="‹" onPress={() => navigation.goBack()} />

      {message && (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
        </Pressable>

        <Pressable
          style={[styles.deleteButton, deleting && styles.buttonDisabled]}
          onPress={handleDelete}
          disabled={deleting}
        >
          <Text style={styles.deleteText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
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
  photo: {
    flex: 1,
    width: '100%',
  },
  messageBox: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  messageText: {
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
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: '#ff6b5e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteText: {
    color: '#ff6b5e',
    fontSize: 16,
    fontWeight: '600',
  },
});
