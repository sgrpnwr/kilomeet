import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Link } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Activity } from "@/types/activity";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatDate,
} from "@/lib/format";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { giveKudos, removeKudos } from "@/lib/social";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isTracking, points, totalDistance, start, stop } =
    useLocationTracking();
  async function handleToggleKudos(activity: Activity) {
    // Optimistic update: change the UI immediately, before the network call finishes
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activity.id
          ? {
              ...a,
              hasGivenKudos: !a.hasGivenKudos,
              kudosCount: a.hasGivenKudos ? a.kudosCount - 1 : a.kudosCount + 1,
            }
          : a,
      ),
    );

    try {
      if (activity.hasGivenKudos) {
        await removeKudos(activity.id);
      } else {
        await giveKudos(activity.id);
      }
    } catch (err) {
      console.error("Kudos toggle failed:", err);
      // Revert on failure
      setActivities((prev) =>
        prev.map((a) => (a.id === activity.id ? activity : a)),
      );
    }
  }
  async function fetchActivities() {
    try {
      const res = await api.get("/activities");
      setActivities(res.data);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchActivities().finally(() => setIsLoading(false));
    }, []),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchActivities();
    setIsRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeSubtitle}>WELCOME BACK</Text>
          <Text style={styles.greeting}>{user?.name ?? "Runner"}</Text>
        </View>
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#ff453a" />
        </Pressable>
      </View>

      {/* Primary Action Buttons */}
      <View style={styles.actionContainer}>
        <Link href="/track" asChild>
          <Pressable style={styles.primaryRecordButton}>
            <Ionicons name="play-circle" size={22} color="#ffffff" />
            <Text style={styles.primaryButtonText}>RECORD A RUN</Text>
          </Pressable>
        </Link>

        <Link href="/modal" asChild>
          <Pressable style={styles.secondaryLogButton}>
            <Ionicons name="add-circle-outline" size={20} color="#8e8e93" />
            <Text style={styles.secondaryButtonText}>Manual Log</Text>
          </Pressable>
        </Link>
      </View>

      {/* Quick Test Tracking Banner (Optional Debug State) */}
      <Pressable
        style={[
          styles.testBanner,
          {
            backgroundColor: isTracking ? "#ff453a20" : "#30d15820",
            borderColor: isTracking ? "#ff453a" : "#30d158",
          },
        ]}
        onPress={async () => {
          if (isTracking) {
            stop();
          } else {
            try {
              await start();
            } catch (err: any) {
              Alert.alert("Permission needed", err.message);
            }
          }
        }}
      >
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isTracking ? "#ff453a" : "#30d158" },
          ]}
        />
        <Text
          style={[
            styles.testBannerText,
            { color: isTracking ? "#ff453a" : "#30d158" },
          ]}
        >
          {isTracking
            ? `Tracking Active (${(totalDistance / 1000).toFixed(2)} km)`
            : "Tap to quick-test background tracker"}
        </Text>
      </Pressable>

      {/* Feed Section Header */}
      <Text style={styles.sectionTitle}>RECENT ACTIVITIES</Text>

      {/* Activities List */}
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#fc4c02"
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="fitness-outline" size={48} color="#3a3a3c" />
              <Text style={styles.emptyText}>
                No activities yet. Hit record to start your first run.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardUser}>{item.user.name}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.type}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.cardDate}>{formatDate(item.startedAt)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {formatDistance(item.distance)}
                </Text>
                <Text style={styles.statLabel}>DISTANCE</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {formatDuration(item.duration)}
                </Text>
                <Text style={styles.statLabel}>DURATION</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {formatPace(item.distance, item.duration)}
                </Text>
                <Text style={styles.statLabel}>PACE</Text>
              </View>
            </View>
            <View style={styles.divider} />

            <View style={styles.socialRow}>
              <Pressable
                style={styles.socialButton}
                onPress={() => handleToggleKudos(item)}
              >
                <Ionicons
                  name={item.hasGivenKudos ? "heart" : "heart-outline"}
                  size={20}
                  color={item.hasGivenKudos ? "#fc4c02" : "#8e8e93"}
                />
                <Text
                  style={[
                    styles.socialCount,
                    item.hasGivenKudos && styles.socialCountActive,
                  ]}
                >
                  {item.kudosCount}
                </Text>
              </Pressable>

              <Link href={`/activity/${item.id}`} asChild>
                <Pressable style={styles.socialButton}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={19}
                    color="#8e8e93"
                  />
                  <Text style={styles.socialCount}>{item.commentCount}</Text>
                </Pressable>
              </Link>
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
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeSubtitle: {
    color: "#8e8e93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: "#f5f5f7",
    letterSpacing: -0.5,
  },
  logoutButton: {
    backgroundColor: "#1c1c1e",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2c2c2e",
  },
  actionContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  primaryRecordButton: {
    flex: 2,
    backgroundColor: "#fc4c02",
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1,
  },
  secondaryLogButton: {
    flex: 1,
    backgroundColor: "#1c1c1e",
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#2c2c2e",
  },
  secondaryButtonText: {
    color: "#f5f5f7",
    fontWeight: "600",
    fontSize: 13,
  },
  testBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  testBannerText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    color: "#8e8e93",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  list: {
    gap: 12,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: "center",
    color: "#8e8e93",
    fontSize: 14,
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#1c1c1e",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2c2c2e",
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fc4c02",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  cardUser: {
    fontWeight: "700",
    fontSize: 15,
    color: "#f5f5f7",
  },
  typeBadge: {
    backgroundColor: "#2c2c2e",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fc4c02",
    letterSpacing: 0.5,
  },
  cardDate: {
    color: "#8e8e93",
    fontSize: 12,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#2c2c2e",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#2c2c2e",
  },
  statValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#f5f5f7",
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#8e8e93",
    marginTop: 4,
    letterSpacing: 0.8,
  },
  socialRow: {
    flexDirection: "row",
    gap: 20,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  socialCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8e8e93",
  },
  socialCountActive: {
    color: "#fc4c02",
  },
});
