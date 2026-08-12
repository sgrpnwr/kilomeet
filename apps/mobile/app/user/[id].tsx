import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  getUserProfile,
  getUserActivities,
  followUser,
  unfollowUser,
} from "@/lib/social";
import { Activity } from "@/types/activity";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatDate,
} from "@/lib/format";
import { CloseButton } from "@/components/ui/CloseButton";
import { ProfileHeaderSkeleton } from "@/components/ui/Skeletons";

type Profile = {
  id: string;
  name: string;
  email: string;
  followerCount: number;
  followingCount: number;
  activityCount: number;
  isFollowing: boolean;
  isSelf: boolean;
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isPending, setIsPending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getUserProfile(id).then(setProfile).catch(console.error);
      getUserActivities(id).then(setActivities).catch(console.error);
    }, [id]),
  );

  // If this happens to be your own profile (e.g. tapped your own name in the feed),
  // just redirect to the real Profile tab instead of showing a duplicate screen
  useFocusEffect(
    useCallback(() => {
      if (profile?.isSelf) {
        router.replace("/(tabs)/profile");
      }
    }, [profile]),
  );

  async function toggleFollow() {
    if (!profile) return;
    setIsPending(true);
    try {
      if (profile.isFollowing) {
        await unfollowUser(profile.id);
        setProfile({
          ...profile,
          isFollowing: false,
          followerCount: profile.followerCount - 1,
        });
      } else {
        await followUser(profile.id);
        setProfile({
          ...profile,
          isFollowing: true,
          followerCount: profile.followerCount + 1,
        });
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setIsPending(false);
    }
  }

if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: 24 }]}>
        <CloseButton style={{ alignSelf: 'flex-start', marginBottom: 8 }} />
        <ProfileHeaderSkeleton />
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.grabber} />

      <Stack.Screen options={{ title: profile.name }} />

      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {profile.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile.name}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile.activityCount}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile.followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.followButton,
            profile.isFollowing && styles.followingButton,
          ]}
          onPress={toggleFollow}
          disabled={isPending}
        >
          <Text
            style={[
              styles.followText,
              profile.isFollowing && styles.followingText,
            ]}
          >
            {isPending ? "..." : profile.isFollowing ? "Following" : "Follow"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>ACTIVITIES</Text>

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No activities yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.activityRow}>
            <View>
              <Text style={styles.activityType}>{item.type}</Text>
              <Text style={styles.activityDate}>
                {formatDate(item.startedAt)}
              </Text>
            </View>
            <View style={styles.activityStats}>
              <Text style={styles.activityStatText}>
                {formatDistance(item.distance)}
              </Text>
              <Text style={styles.activityStatText}>
                {formatDuration(item.duration)}
              </Text>
              <Text style={styles.activityStatText}>
                {formatPace(item.distance, item.duration)}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0c",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  header: { alignItems: "center", paddingVertical: 20, gap: 4 },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fc4c02",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarLargeText: { color: "#fff", fontWeight: "800", fontSize: 28 },
  name: { fontSize: 20, fontWeight: "800", color: "#f5f5f7" },
  statsRow: { flexDirection: "row", gap: 32, marginTop: 16 },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#f5f5f7" },
  statLabel: { fontSize: 11, color: "#8e8e93", marginTop: 2 },
  followButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 32,
    backgroundColor: "#fc4c02",
    borderRadius: 10,
  },
  followingButton: {
    backgroundColor: "#1c1c1e",
    borderWidth: 1,
    borderColor: "#2c2c2e",
  },
  followText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  followingText: { color: "#f5f5f7" },
  sectionTitle: {
    color: "#8e8e93",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 16,
    marginBottom: 8,
  },
  list: { gap: 10, paddingBottom: 32 },
  empty: { textAlign: "center", color: "#8e8e93", marginTop: 24 },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1c1c1e",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2c2c2e",
  },
  activityType: { color: "#f5f5f7", fontWeight: "700", fontSize: 14 },
  activityDate: { color: "#8e8e93", fontSize: 12, marginTop: 2 },
  activityStats: { flexDirection: "row", gap: 12 },
  activityStatText: { color: "#8e8e93", fontSize: 12, fontWeight: "600" },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#3a3a3c",
    alignSelf: "center",
    marginBottom: 12,
  },
});
