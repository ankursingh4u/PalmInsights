import { useState } from "react";
import { Text, View, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { Button, Field } from "@/components/ui";
import { colors, font, radius, space } from "@/lib/theme";

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [gbusy, setGbusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function google() {
    setError(null);
    setNotice(null);
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
          <Button title="Sign up" onPress={submit} loading={busy} icon="person-add-outline" />

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
  divider: { flexDirection: "row", alignItems: "center", gap: space.md, marginVertical: 2 },
  line: { flex: 1, height: 1, backgroundColor: colors.cardBorder },
  or: { color: colors.textFaint, fontSize: font.small },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: radius.full, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: "#fff" },
  googleG: { color: "#4285F4", fontSize: 20, fontWeight: "900" },
  googleText: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  notice: { color: colors.success, fontSize: font.small },
  footer: { textAlign: "center", color: colors.textDim, fontSize: font.body },
  link: { color: colors.cosmic300, fontWeight: "700" },
});
