import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { searchUsers, getFollowing, followUser, unfollowUser } from '@/lib/social';

type UserResult = { id: string; name: string; email: string };

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserResult[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set()); // per-row loading state

  async function loadUsers(search: string) {
    const [results, following] = await Promise.all([searchUsers(search), getFollowing()]);
    setUsers(results);
    setFollowingIds(new Set(following.map((u: UserResult) => u.id)));
  }

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadUsers(query).finally(() => setIsLoading(false));
    }, [])
  );

  async function handleSearchChange(text: string) {
    setQuery(text);
    loadUsers(text); // re-search as they type
  }

  async function toggleFollow(userId: string, isFollowing: boolean) {
    setPendingIds((prev) => new Set(prev).add(userId));
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      } else {
        await followUser(userId);
        setFollowingIds((prev) => new Set(prev).add(userId));
      }
    } catch (err) {
      console.error('Follow toggle failed:', err);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Find People</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name..."
        value={query}
        onChangeText={handleSearchChange}
      />

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No users found</Text>}
          renderItem={({ item }) => {
            const isFollowing = followingIds.has(item.id);
            const isPending = pendingIds.has(item.id);
            return (
              <View style={styles.row}>
                <View>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                </View>
                <Pressable
                  style={[styles.followButton, isFollowing && styles.followingButton]}
                  onPress={() => toggleFollow(item.id, isFollowing)}
                  disabled={isPending}
                >
                  <Text style={[styles.followText, isFollowing && styles.followingText]}>
                    {isPending ? '...' : isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  list: { gap: 8 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 10,
  },
  name: { fontWeight: '600', fontSize: 16 },
  email: { color: '#888', fontSize: 13 },
  followButton: { backgroundColor: '#111', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  followingButton: { backgroundColor: '#eee' },
  followText: { color: '#fff', fontWeight: '600' },
  followingText: { color: '#111' },
});