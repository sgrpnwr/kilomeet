import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function EmptyView({
  icon = 'fitness-outline',
  title,
  subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.centered}>
      <Ionicons name={icon} size={48} color="#3a3a3c" />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

export function ErrorView({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.centered}>
      <Ionicons name="cloud-offline-outline" size={48} color="#ff453a" />
      <Text style={styles.errorTitle}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  loadingText: { color: '#8e8e93', fontSize: 13, marginTop: 4 },
  emptyTitle: { color: '#f5f5f7', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptySubtitle: { color: '#8e8e93', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  errorTitle: { color: '#f5f5f7', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  retryButton: { backgroundColor: '#1c1c1e', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10, borderWidth: 1, borderColor: '#2c2c2e', marginTop: 4 },
  retryText: { color: '#fc4c02', fontWeight: '600', fontSize: 13 },
});