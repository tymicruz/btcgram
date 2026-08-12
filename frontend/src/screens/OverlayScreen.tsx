import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Overlay'>;

export default function OverlayScreen({ route, navigation }: Props) {
  const { photoUri } = route.params;

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.photo} />
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
