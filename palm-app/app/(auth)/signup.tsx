import { useState } from "react";
import { Text, View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { Button, Field } from "@/components/ui";
import { colors, font, space } from "@/lib/theme";

export default function Signup() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const r = await signUp(email.trim(), password);
      if (r.needsVerify) {
        setNotice("Check your email to confirm your account, then log in.");
      } else {
        router.replace("/(tabs)");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.wrap}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inner}
      >
        <View style={styles.brand}>
          <Text style={styles.logo}>🔮</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.sub}>Save your readings and unlock more.</Text>
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
            placeholder="Password (min 8 characters)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          {notice && <Text style={styles.notice}>{notice}</Text>}
          <Button title="Sign up" onPress={submit} loading={busy} />
        </View>

        <Text style={styles.footer}>
          Already have an account?{" "}
          <Link href="/(auth)/login" style={styles.link}>
            Log in
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
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  sub: { color: colors.textDim, fontSize: font.body },
  error: { color: colors.danger, fontSize: font.small },
  notice: { color: colors.success, fontSize: font.small },
  footer: { textAlign: "center", color: colors.textDim, fontSize: font.body },
  link: { color: colors.cosmic300, fontWeight: "700" },
});
