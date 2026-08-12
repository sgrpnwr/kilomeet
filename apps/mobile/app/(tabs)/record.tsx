import { View } from 'react-native';

// This screen is never actually shown — the tab press is intercepted
// in _layout.tsx and redirected to /track instead. Exists only so
// Expo Router has a valid route to register as a tab.
export default function RecordPlaceholder() {
  return <View />;
}