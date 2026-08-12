import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  searchUsers,
  getFollowing,
  followUser,
  unfollowUser,
} from "@/lib/social";
import { Link } from "expo-router";
import { UserListSkeleton } from "@/components/ui/Skeletons";
import { ErrorView } from "@/components/ui/StateViews";
import { CloseButton } from "@/components/ui/CloseButton";
import { KeyboardAvoidingWrapper } from "@/components/ui/KeyboardAvoidingWrapper";

type UserResult = { id: string; name: string; email: string };

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set()); // per-row loading state

  async function loadUsers(search: string) {
    try {
      setError(null);
      const [results, following] = await Promise.all([
        searchUsers(search),
        getFollowing(),
      ]);
      setUsers(results);
      setFollowingIds(new Set(following.map((u: UserResult) => u.id)));
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Could not load users");
      setUsers([]); // clear stale results so we don't show wrong data
    }
  }

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadUsers(query).finally(() => setIsLoading(false));
    }, []),
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
      console.error("Follow toggle failed:", err);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  }
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingWrapper>
      <SafeAreaView
        style={[styles.container, { paddingTop: 24 }]}
        edges={["top"]}
      >
        <View style={styles.grabber} />
        <Text style={styles.title}>Find People</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor="#636262"
          value={query}
          onChangeText={handleSearchChange}
        />

        {isLoading ? (
          <UserListSkeleton />
        ) : error ? (
          <ErrorView message={error} onRetry={() => loadUsers(query)} />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>No users found</Text>
            }
            renderItem={({ item }) => {
              const isFollowing = followingIds.has(item.id);
              const isPending = pendingIds.has(item.id);
              return (
                <View style={styles.row}>
                  <Link href={`/user/${item.id}`} asChild>
                    <Pressable style={{ flex: 1 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.email}>{item.email}</Text>
                    </Pressable>
                  </Link>
                  <Pressable
                    style={[
                      styles.followButton,
                      isFollowing && styles.followingButton,
                    ]}
                    onPress={() => toggleFollow(item.id, isFollowing)}
                    disabled={isPending}
                  >
                    <Text
                      style={[
                        styles.followText,
                        isFollowing && styles.followingText,
                      ]}
                    >
                      {isPending ? "..." : isFollowing ? "Following" : "Follow"}
                    </Text>
                  </Pressable>
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0c",
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
    marginTop: 24,
    color: "#f5f5f7",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#2c2c2e",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#1c1c1e",
    color: "#f5f5f7",
  },
  list: { gap: 8 },
  empty: { textAlign: "center", color: "#8e8e93", marginTop: 40 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1c1c1e",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2c2c2e",
  },
  name: { fontWeight: "600", fontSize: 16, color: "#f5f5f7" },
  email: { color: "#8e8e93", fontSize: 13 },
  followButton: {
    backgroundColor: "#fc4c02",
    paddingVertical: 8,
    width: 100,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  followingButton: {
    backgroundColor: "#1c1c1e",
    width: 100,
    borderWidth: 1,
    borderColor: "#ebebee",
  },
  followText: { color: "#fff", fontWeight: "600" },
  followingText: { color: "#f5f5f7" },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#3a3a3c",
    alignSelf: "center",
    marginBottom: 12,
  },
});
