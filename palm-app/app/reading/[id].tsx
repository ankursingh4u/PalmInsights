import { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import type { AnalysisResult } from "@/lib/types";
import { Card, Chip } from "@/components/ui";
import { colors, font, radius, space } from "@/lib/theme";

const PREMIUM = [
  { icon: "🌌", t: "Your Path" },
  { icon: "💼", t: "Career & Success" },
  { icon: "💰", t: "Money & Wealth" },
  { icon: "🍀", t: "Luck & Fortune" },
  { icon: "💕", t: "Love & Dating" },
  { icon: "🔮", t: "Ask the Astrologer" },
];

export default function Reading() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getScan(id)
      .then((r) => setResult(r.result))
      .catch((e) => setError((e as Error).message));
  }, [id]);

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" color={colors.text} size={26} />
        </Pressable>
        <Text style={styles.headerTitle}>Your Reading</Text>
        <View style={{ width: 26 }} />
      </View>

      {!result && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.cosmic300} />
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={{ color: colors.danger }}>{error}</Text>
        </View>
      )}

      {result && (
        <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg }}>
          <View>
            <Chip label={`${result.handedness} hand`} color={colors.cosmic300} />
            <Text style={styles.h1}>Your palm, decoded</Text>
          </View>

          {result.lines.map((line) => (
            <Card key={line.key}>
              <View style={styles.lineHead}>
                <View style={[styles.dot, { backgroundColor: line.color }]} />
                <Text style={styles.lineLabel}>{line.label}</Text>
                <Chip label={line.pattern} color={line.color} />
              </View>
              {!!line.summary && <Text style={styles.summary}>{line.summary}</Text>}
              {line.interpretation.map((t, i) => (
                <View key={i} style={styles.bullet}>
                  <Text style={{ color: line.color }}>•</Text>
                  <Text style={styles.bulletText}>{t}</Text>
                </View>
              ))}
            </Card>
          ))}

          {/* Premium teaser */}
          <Card style={styles.premium}>
            <Chip label="✦ Deep Report" color={colors.cosmic300} />
            <Text style={styles.premiumTitle}>Unlock your full story</Text>
            <Text style={styles.premiumSub}>
              Six personalized chapters read from your palm — plus chat with your personal astrologer.
            </Text>
            <View style={styles.premiumGrid}>
              {PREMIUM.map((p) => (
                <View key={p.t} style={styles.premiumItem}>
                  <Text style={{ fontSize: 22 }}>{p.icon}</Text>
                  <Text style={styles.premiumItemText}>{p.t}</Text>
                </View>
              ))}
            </View>
            <View style={styles.lockedCta}>
              <Ionicons name="lock-closed" color={colors.textDim} size={16} />
              <Text style={styles.lockedText}>In-app unlock coming soon</Text>
            </View>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.lg, paddingVertical: space.md },
  headerTitle: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  h1: { color: colors.text, fontSize: font.h1, fontWeight: "800", marginTop: 8 },
  lineHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { height: 12, width: 12, borderRadius: 6 },
  lineLabel: { color: colors.text, fontSize: font.h3, fontWeight: "700", flex: 1 },
  summary: { color: colors.text, fontSize: font.body, marginTop: space.md },
  bullet: { flexDirection: "row", gap: 8, marginTop: 6 },
  bulletText: { color: colors.textDim, fontSize: font.small, flex: 1, lineHeight: 20 },
  premium: { backgroundColor: "rgba(124,58,237,0.16)", borderColor: "rgba(167,139,250,0.35)", gap: space.sm },
  premiumTitle: { color: colors.text, fontSize: font.h2, fontWeight: "800", marginTop: 4 },
  premiumSub: { color: colors.textDim, fontSize: font.small, lineHeight: 20 },
  premiumGrid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.sm },
  premiumItem: { width: "30%", flexGrow: 1, alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: radius.sm, paddingVertical: space.md },
  premiumItemText: { color: colors.text, fontSize: font.tiny, fontWeight: "600", textAlign: "center" },
  lockedCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: space.md },
  lockedText: { color: colors.textDim, fontSize: font.small, fontWeight: "600" },
});
