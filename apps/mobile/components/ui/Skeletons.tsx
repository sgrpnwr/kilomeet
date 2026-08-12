import { View, StyleSheet } from 'react-native';
import { Shimmer } from './Shimmer';

export function ActivityCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userRow}>
          <Shimmer style={styles.avatar} />
          <View style={{ gap: 6 }}>
            <Shimmer style={{ width: 100, height: 14 }} />
            <Shimmer style={{ width: 50, height: 10, borderRadius: 4 }} />
          </View>
        </View>
        <Shimmer style={{ width: 60, height: 12 }} />
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <Shimmer style={{ width: 50, height: 16 }} />
            <Shimmer style={{ width: 40, height: 9 }} />
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={{ flexDirection: 'row', gap: 20 }}>
        <Shimmer style={{ width: 30, height: 16, borderRadius: 8 }} />
        <Shimmer style={{ width: 30, height: 16, borderRadius: 8 }} />
      </View>
    </View>
  );
}

export function ActivityFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <ActivityCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function UserRowSkeleton() {
  return (
    <View style={styles.userRowCard}>
      <View style={{ gap: 6 }}>
        <Shimmer style={{ width: 120, height: 14 }} />
        <Shimmer style={{ width: 160, height: 11 }} />
      </View>
      <Shimmer style={{ width: 70, height: 30, borderRadius: 8 }} />
    </View>
  );
}

export function UserListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <UserRowSkeleton key={i} />
      ))}
    </View>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 20, gap: 10 }}>
      <Shimmer style={{ width: 72, height: 72, borderRadius: 36 }} />
      <Shimmer style={{ width: 120, height: 18 }} />
      <View style={{ flexDirection: 'row', gap: 32, marginTop: 10 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <Shimmer style={{ width: 30, height: 16 }} />
            <Shimmer style={{ width: 50, height: 10 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  divider: { height: 1, backgroundColor: '#2c2c2e' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  userRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
});