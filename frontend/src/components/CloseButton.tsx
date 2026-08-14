import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  onPress: () => void;
  // same top-left icon button used for both "close/discard" (✕) and
  // "go back" (‹) - only the glyph and its meaning differ
  icon?: string;
};

export default function CloseButton({ onPress, icon = '✕' }: Props) {
  return (
    <Pressable style={styles.closeButton} onPress={onPress}>
      <Text style={styles.closeButtonText}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
