import { useState } from "react";
import { Text, View, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { Button, Field } from "@/components/ui";
import { colors, font, radius, space } from "@/lib/theme";

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [gbusy, setGbusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    setGbusy(true);
    try {
      await signInWithGoogle();
      router.replace("/(tabs)");
    } catch (e) {
      const m = (e as Error).message;
      if (!/cancel/i.test(m)) setError(m);
    } finally {
      setGbusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.wrap}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inner}
      >
        <View style={styles.brand}>
          <Text style={styles.logo}>✋</Text>
          <Text style={styles.title}>
            Palm<Text style={{ color: colors.cosmic300 }}>Insight</Text>
          </Text>
          <Text style={styles.sub}>Welcome back — read your story.</Text>
        </View>

        <View style={{ gap: space.md }}>
          <Field
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title="Log in" onPress={submit} loading={busy} icon="log-in-outline" />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>or</Text>
            <View style={styles.line} />
          </View>

          <Pressable onPress={google} disabled={gbusy} style={styles.googleBtn}>
            {gbusy ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
          </Pressable>
        </View>

        <Text style={styles.footer}>
          New here?{" "}
          <Link href="/(auth)/signup" style={styles.link}>
            Create an account
          </Link>
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: space.xl, gap: space.xl },
  brand: { alignItems: "center", gap: 6 },
  logo: { fontSize: 44 },
  title: { fontSize: 30, fontWeight: "800", color: colors.text },
  sub: { color: colors.textDim, fontSize: font.body },
  error: { color: colors.danger, fontSize: font.small },
  footer: { textAlign: "center", color: colors.textDim, fontSize: font.body },
  link: { color: colors.cosmic300, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", gap: space.md, marginVertical: 2 },
  line: { flex: 1, height: 1, backgroundColor: colors.cardBorder },
  or: { color: colors.textFaint, fontSize: font.small },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: "#fff",
  },
  googleG: { color: "#4285F4", fontSize: 20, fontWeight: "900" },
  googleText: { color: colors.text, fontSize: font.body, fontWeight: "700" },
});
