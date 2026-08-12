import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export function CloseButton({ style }: { style?: ViewStyle }) {
  return (
    <Pressable style={[styles.button, style]} onPress={() => router.back()}>
      <Ionicons name="chevron-down" size={20} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
});