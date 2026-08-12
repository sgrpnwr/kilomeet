import { useEffect, useRef } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

const ICONS: Record<string, string> = {
  index: "house.fill",
  record: "circle.fill",
  profile: "person.fill",
};

const TAB_BAR_WIDTH = Dimensions.get("window").width - 40; // 20px margin each side

export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const routeCount = state.routes.length;
  const tabWidth = TAB_BAR_WIDTH / routeCount;

  const translateX = useRef(new Animated.Value(state.index * tabWidth)).current;
  const scales = useRef(state.routes.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start();

    Animated.sequence([
      Animated.timing(scales[state.index], {
        toValue: 0.8,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scales[state.index], {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
        stiffness: 200,
      }),
    ]).start();
  }, [state.index]);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <BlurView
        intensity={60}
        tint="dark"
        style={[styles.container, { width: TAB_BAR_WIDTH }]}
      >
        <View style={styles.tint} />

        <Animated.View
          style={[
            styles.pill,
            {
              width: tabWidth - 12,
              transform: [
                { translateX: Animated.add(translateX, new Animated.Value(6)) },
              ],
            },
          ]}
        />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconName = ICONS[route.name] ?? "circle.fill";
          const isRecord = route.name === "record";

          function onPress() {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, { width: tabWidth }]}
            >
              {isRecord ? (
                <View style={styles.recordButton}>
                  <IconSymbol size={22} name="circle.fill" color="#fff" />
                </View>
              ) : (
                <Animated.View
                  style={{ transform: [{ scale: scales[index] }] }}
                >
                  <IconSymbol
                    size={24}
                    name={iconName as any}
                    color={isFocused ? "#fc4c02" : "#8e8e93"}
                  />
                </Animated.View>
              )}
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,20,22,0.55)",
  },
  pill: {
    position: "absolute",
    top: 8,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(252,76,2,0.15)",
    borderWidth: 1,
    borderColor: "rgba(252,76,2,0.35)",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  recordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fc4c02",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#fc4c02",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
