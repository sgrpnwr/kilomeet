import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MapView, { Polyline, Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { api } from "@/lib/api";
import { formatDistance, formatDuration, formatPace } from "@/lib/format";
import { CloseButton } from "@/components/ui/CloseButton";
import * as Location from "expo-location";

export default function TrackScreen() {
  const { isTracking, points, totalDistance, start, stop } =
    useLocationTracking();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<Date | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
  latitude: number;
  longitude: number;
} | null>(null);

useEffect(() => {
  (async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCurrentLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (err) {
      console.error("Failed to get current location:", err);
    }
  })();
}, []);

  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTracking]);

  async function handleStart() {
    try {
      startedAtRef.current = new Date();
      setElapsedSeconds(0);
      await start();
    } catch (err: any) {
      Alert.alert("Permission needed", err.message);
    }
  }

  async function handleStop() {
    stop();

    if (points.length < 2) {
      Alert.alert("Run too short", "Not enough GPS data was recorded.");
      router.back();
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/activities", {
        type: "RUN",
        distance: totalDistance,
        duration: elapsedSeconds,
        startedAt:
          startedAtRef.current?.toISOString() ?? new Date().toISOString(),
      });
      Alert.alert("Run saved", "", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Failed to save",
        err.response?.data?.error || "Something went wrong",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const fallback = currentLocation ?? { latitude: 37.78825, longitude: -122.4324 };

const initialRegion = {
  latitude: points[points.length - 1]?.latitude ?? fallback.latitude,
  longitude: points[points.length - 1]?.longitude ?? fallback.longitude,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

  // Maximized view (No map, full stats)
  if (isMaximized) {
    return (
      <SafeAreaView style={styles.maximizedContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>RUN</Text>
          <Pressable
            style={styles.iconButtonPlain}
            onPress={() => setIsMaximized(false)}
          >
            <Ionicons name="contract-outline" size={24} color="#ffffff" />
          </Pressable>
        </View>

        <View style={styles.timeSection}>
          <Text style={styles.timeLabel}>DURATION</Text>
          <Text style={styles.timeValue}>{formatDuration(elapsedSeconds)}</Text>
        </View>

        <View style={styles.mainStatsSection}>
          <View style={styles.primaryStat}>
            <Text style={styles.primaryValue}>
              {formatDistance(totalDistance)}
            </Text>
            <Text style={styles.primaryLabel}>DISTANCE (KM)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.primaryStat}>
            <Text style={styles.primaryValue}>
              {totalDistance > 0
                ? formatPace(totalDistance, elapsedSeconds)
                : "--:--"}
            </Text>
            <Text style={styles.primaryLabel}>AVG PACE (/KM)</Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          {!isTracking ? (
            <Pressable style={styles.startButton} onPress={handleStart}>
              <Text style={styles.buttonText}>START RUN</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.stopButton}
              onPress={handleStop}
              disabled={isSaving}
            >
              <Text style={styles.buttonText}>
                {isSaving ? "SAVING..." : "FINISH & SAVE"}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <CloseButton
        style={{
          position: "absolute",
          top: insets.top + 10,
          left: 16,
          zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      />
      <MapView
        style={styles.map}
        region={initialRegion}
        showsUserLocation
        followsUserLocation={isTracking}
      >
        {points.length > 1 && (
          <Polyline
            coordinates={points.map((p) => ({
              latitude: p.latitude,
              longitude: p.longitude,
            }))}
            strokeColor="#fc4c02"
            strokeWidth={5}
          />
        )}
        {points.length > 0 && (
          <Marker
            coordinate={{
              latitude: points[0].latitude,
              longitude: points[0].longitude,
            }}
            title="Start"
            pinColor="green"
          />
        )}
      </MapView>

      {/* Floating Bottom Overlay Card */}
      <SafeAreaView style={styles.overlayContainer} edges={["bottom"]}>
        <View style={styles.overlayCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>RUN</Text>
            <Pressable
              style={styles.iconButtonPlain}
              onPress={() => setIsMaximized(true)}
            >
              <Ionicons name="resize-outline" size={24} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatDistance(totalDistance)}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatDuration(elapsedSeconds)}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {totalDistance > 0
                  ? formatPace(totalDistance, elapsedSeconds)
                  : "--:--"}
              </Text>
              <Text style={styles.statLabel}>Pace</Text>
            </View>
          </View>

          {!isTracking ? (
            <Pressable style={styles.startButton} onPress={handleStart}>
              <Text style={styles.buttonText}>START RUN</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.stopButton}
              onPress={handleStop}
              disabled={isSaving}
            >
              <Text style={styles.buttonText}>
                {isSaving ? "SAVING..." : "STOP & SAVE"}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0c" },
  map: { flex: 1 },
  overlayContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  overlayCard: {
    backgroundColor: "#1c1c1ee8",
    borderRadius: 22,
    padding: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: "#2c2c2e",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 2,
  },
  cardTitle: {
    color: "#f5f5f7",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  iconButtonPlain: {
    position: "absolute",
    right: 0,
    top: -6,
    padding: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    width: "100%",
  },
  headerTitle: {
    color: "#f5f5f7",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  maximizedContainer: {
    flex: 1,
    backgroundColor: "#0b0b0c",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  timeSection: {
    alignItems: "center",
  },
  timeLabel: {
    color: "#8e8e93",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  timeValue: {
    color: "#f5f5f7",
    fontSize: 48,
    fontWeight: "300",
    fontVariant: ["tabular-nums"],
  },
  mainStatsSection: {
    alignItems: "center",
    width: "100%",
    gap: 36,
  },
  primaryStat: {
    alignItems: "center",
  },
  primaryValue: {
    color: "#fc4c02",
    fontSize: 64,
    fontWeight: "800",
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  primaryLabel: {
    color: "#8e8e93",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 2,
  },
  divider: {
    width: "40%",
    height: 1,
    backgroundColor: "#1c1c1e",
  },
  actionSection: {
    width: "100%",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    color: "#f5f5f7",
    fontSize: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    color: "#8e8e93",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  startButton: {
    backgroundColor: "#fc4c02",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  stopButton: {
    backgroundColor: "#2c2c2e",
    borderWidth: 1,
    borderColor: "#3a3a3c",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1.2,
  },
});
