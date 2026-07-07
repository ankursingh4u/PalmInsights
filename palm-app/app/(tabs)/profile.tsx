import { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, Pressable, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth";
import { api, getProToken, setProToken } from "@/lib/api";
import { Card } from "@/components/ui";
import { colors, font, radius, space } from "@/lib/theme";

function Row({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={styles.rowIcon}>
        <Icon name={icon} color={danger ? colors.danger : colors.cosmic300} size={20} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      {!danger && <Icon name="chevron-forward" color={colors.textFaint} size={18} />}
    </Pressable>
  );
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [pro, setPro] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getProToken().then((t) => setPro(Boolean(t)));
  }, []);

  async function redeem() {
    const c = code.trim();
    if (!c || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const { proToken } = await api.redeem(c);
      await setProToken(proToken);
      setPro(true);
      setShowRedeem(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.xl }}>
        <Card style={styles.identity}>
          <View style={styles.bigAvatar}>
            <Text style={styles.bigAvatarText}>{user ? user.email[0].toUpperCase() : "🔮"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Welcome back</Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </Card>

        {/* Pro status / upgrade */}
        {pro ? (
          <Card style={styles.proCard}>
            <Text style={styles.proBadge}>✦ PRO</Text>
            <Text style={styles.proActive}>You're a Pro member</Text>
            <Text style={styles.proSub}>Deep Reports, unlimited chat &amp; more are unlocked.</Text>
          </Card>
        ) : (
          <Card style={styles.proCard}>
            <View style={styles.proRow}>
              <Text style={styles.proBadge}>✦ Go PRO</Text>
              <Text style={styles.proPrice}>$9 / month</Text>
            </View>
            <Text style={styles.proSub}>Unlimited palm readings, Ask the Astrologer chat &amp; the full Deep Report.</Text>
            {showRedeem ? (
              <View style={{ gap: space.sm, marginTop: space.sm }}>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="Launch code (free for first 100)"
                  placeholderTextColor={colors.textFaint}
                  autoCapitalize="characters"
                  style={styles.codeInput}
                />
                {err && <Text style={styles.err}>{err}</Text>}
                <Pressable onPress={redeem} disabled={busy} style={[styles.proBtn, busy && { opacity: 0.6 }]}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.proBtnText}>Redeem &amp; Unlock</Text>}
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setShowRedeem(true)} style={styles.proBtn}>
                <Text style={styles.proBtnText}>Enter launch code</Text>
              </Pressable>
            )}
          </Card>
        )}

        <View>
          <Text style={styles.section}>Your palm</Text>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <Row icon="scan" label="New palm scan" onPress={() => router.push("/(tabs)/scan")} />
            <View style={styles.divider} />
            <Row icon="book" label="My readings" onPress={() => router.push("/(tabs)/readings")} />
          </Card>
        </View>

        <View>
          <Text style={styles.section}>Account</Text>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <Row icon="log-out-outline" label="Log out" danger onPress={signOut} />
          </Card>
        </View>

        <Text style={styles.footer}>
          PalmInsight · for entertainment & self-reflection{"\n"}by ankursingh.site
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  identity: { flexDirection: "row", alignItems: "center", gap: space.lg, backgroundColor: colors.cosmicSoft, borderColor: colors.cosmicSoftBorder },
  bigAvatar: { height: 60, width: 60, borderRadius: 30, backgroundColor: colors.cosmic600, alignItems: "center", justifyContent: "center" },
  bigAvatarText: { color: "#fff", fontSize: 24, fontWeight: "800" },
  name: { color: colors.text, fontSize: font.h2, fontWeight: "800" },
  email: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  section: { color: colors.textFaint, fontSize: font.small, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, paddingVertical: 14 },
  rowIcon: { height: 34, width: 34, borderRadius: radius.sm, backgroundColor: colors.chipBg, alignItems: "center", justifyContent: "center" },
  rowLabel: { color: colors.text, fontSize: font.body, fontWeight: "600", flex: 1 },
  divider: { height: 1, backgroundColor: colors.cardBorder, marginLeft: 60 },
  footer: { color: colors.textFaint, fontSize: font.tiny, textAlign: "center", lineHeight: 18 },
  proCard: { backgroundColor: colors.cosmicSoft, borderColor: colors.cosmicSoftBorder, gap: 6 },
  proRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  proBadge: { color: colors.cosmic600, fontSize: font.h3, fontWeight: "900", letterSpacing: 0.5 },
  proPrice: { color: colors.cosmic600, fontSize: font.small, fontWeight: "800" },
  proActive: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  proSub: { color: colors.textDim, fontSize: font.small, lineHeight: 19 },
  codeInput: { height: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.cosmicSoftBorder, backgroundColor: "#fff", paddingHorizontal: space.lg, color: colors.text, fontSize: font.body },
  proBtn: { height: 48, borderRadius: radius.full, backgroundColor: colors.cosmic600, alignItems: "center", justifyContent: "center", marginTop: space.sm },
  proBtnText: { color: "#fff", fontSize: font.body, fontWeight: "700" },
  err: { color: colors.danger, fontSize: font.small },
});
