import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, getUserActivities, updateProfile } from "@/lib/social";
import { Activity } from "@/types/activity";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatDate,
} from "@/lib/format";
import { ProfileHeaderSkeleton } from "@/components/ui/Skeletons";
import { ErrorView } from "@/components/ui/StateViews";

type Profile = {
  id: string;
  name: string;
  email: string;
  followerCount: number;
  followingCount: number;
  activityCount: number;
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(() => {
    if (!user) return;
    setError(null);
    getUserProfile(user.id)
      .then(setProfile)
      .catch(() => setError("Could not load your profile"));
    getUserActivities(user.id)
      .then(setActivities)
      .catch((err) => console.error("Failed to load activities:", err));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  function openEdit() {
    setEditName(profile?.name ?? "");
    setIsEditVisible(true);
  }

  async function handleSaveName() {
    if (editName.trim().length < 2) {
      Alert.alert("Name too short", "Must be at least 2 characters");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateProfile(editName.trim());
      setProfile((prev) => (prev ? { ...prev, name: updated.name } : prev));
      setIsEditVisible(false);
    } catch (err) {
      Alert.alert("Failed to update", "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ErrorView message={error} onRetry={loadProfile} />
      </SafeAreaView>
    );
  }

  if (!profile) return <ProfileHeaderSkeleton />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {profile.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.name}</Text>
          <Pressable onPress={openEdit}>
            <Ionicons name="pencil" size={16} color="#8e8e93" />
          </Pressable>
        </View>
        <Text style={styles.email}>{profile.email}</Text>

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

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>YOUR ACTIVITIES</Text>

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

      <Modal visible={isEditVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={() => setIsEditVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit name</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor="#8e8e93"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setIsEditVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalSaveButton}
                onPress={handleSaveName}
                disabled={isSaving}
              >
                <Text style={styles.modalSaveText}>
                  {isSaving ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0c", paddingHorizontal: 20 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
    marginTop: 100, // guarantees at least 100px of dark overlay visible above the sheet
  },
  avatarLargeText: { color: "#fff", fontWeight: "800", fontSize: 28 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 20, fontWeight: "800", color: "#f5f5f7" },
  email: { fontSize: 13, color: "#8e8e93" },
  statsRow: { flexDirection: "row", gap: 32, marginTop: 16 },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#f5f5f7" },
  statLabel: { fontSize: 11, color: "#8e8e93", marginTop: 2 },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#1c1c1e",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2c2c2e",
  },
  logoutText: { color: "#ff453a", fontWeight: "600", fontSize: 13 },
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
  modalTitle: { color: "#f5f5f7", fontSize: 18, fontWeight: "700" },
  modalInput: {
    backgroundColor: "#0b0b0c",
    borderRadius: 10,
    padding: 12,
    color: "#f5f5f7",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2c2c2e",
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#2c2c2e",
  },
  modalCancelText: { color: "#f5f5f7", fontWeight: "600" },
  modalSaveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#fc4c02",
  },
  modalSaveText: { color: "#fff", fontWeight: "700" },
});
