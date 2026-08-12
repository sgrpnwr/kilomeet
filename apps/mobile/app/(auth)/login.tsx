import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { KeyboardAvoidingWrapper } from "@/components/ui/KeyboardAvoidingWrapper";
import { GryttLogo } from "@/components/ui/GryttLogo";

const ACCENT = "#fc4c02";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(
    null,
  );

  async function handleLogin() {
    setIsSubmitting(true);
    try {
      await login(email, password);
      // No manual navigation needed here — we'll set up a redirect
      // in the root layout that automatically sends logged-in users
      // to the tabs app once `user` becomes non-null.
    } catch (err: any) {
      Alert.alert(
        "Login failed",
        err.response?.data?.error || "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    email.trim().length > 0 && password.length > 0 && !isSubmitting;

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        {/* Logo */}
       <View style={styles.logoWrap}>
  <GryttLogo size={48} />
  <Text style={[styles.logoText, { marginTop: 12 }]}>
    Gry<Text style={styles.logoAccent}>tt</Text>
  </Text>
  <View style={styles.logoUnderline} />
  <Text style={styles.tagline}>Outrun yesterday</Text>
</View>

        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to continue</Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === "email" && styles.inputFocused,
              ]}
              placeholder="you@example.com"
              placeholderTextColor="#9a9a9a"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === "password" && styles.inputFocused,
              ]}
              placeholder="••••••••"
              placeholderTextColor="#9a9a9a"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              !canSubmit && styles.buttonDisabled,
              pressed && canSubmit && styles.buttonPressed,
            ]}
            onPress={handleLogin}
            disabled={!canSubmit}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? "Logging in..." : "Log In"}
            </Text>
          </Pressable>
        </View>

        <Link href="/(auth)/signup" style={styles.link}>
          <Text style={styles.linkText}>
            Don't have an account?{" "}
            <Text style={styles.linkAccent}>Sign up</Text>
          </Text>
        </Link>
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#fff",
  },

  logoWrap: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoText: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#111",
  },
  logoAccent: {
    color: ACCENT,
  },
  logoUnderline: {
    marginTop: 8,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },

  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 4,
  },
  tagline: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
    color: "#888",
    letterSpacing: 0.4,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e2e2",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#111",
    backgroundColor: "#fafafa",
  },
  inputFocused: {
    borderColor: "#111",
    backgroundColor: "#fff",
  },

  button: {
    backgroundColor: "#111",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  link: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    color: "#666",
  },
  linkAccent: {
    color: ACCENT,
    fontWeight: "600",
  },
});
