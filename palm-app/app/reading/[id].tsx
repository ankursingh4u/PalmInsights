import { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";
import type { AnalysisResult } from "@/lib/types";
import { Card, Chip } from "@/components/ui";
import { colors, font, radius, shadow, space } from "@/lib/theme";

const PREMIUM = [
  { icon: "🌌", t: "Your Path" },
  { icon: "💼", t: "Career" },
  { icon: "💰", t: "Money" },
  { icon: "🍀", t: "Luck" },
  { icon: "💕", t: "Love" },
  { icon: "✨", t: "Your Vibe" },
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
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Icon name="chevron-back" color={colors.text} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Your Reading</Text>
        <View style={{ width: 40 }} />
      </View>

      {!result && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.cosmic} />
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
            <Chip label={`${result.handedness} hand`} color={colors.cosmic} />
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
                  <Icon name="ellipse" size={5} color={line.color} style={{ marginTop: 7 }} />
                  <Text style={styles.bulletText}>{t}</Text>
                </View>
              ))}
            </Card>
          ))}

          {/* Talk to the astrologer */}
          <Pressable onPress={() => router.push(`/chat/${id}`)} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
            <View style={styles.astro}>
              <View style={styles.astroIcon}>
                <Text style={{ fontSize: 24 }}>🔮</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.astroTitle}>Ask the Astrologer</Text>
                <Text style={styles.astroSub}>Chat about your reading — love, money, luck…</Text>
              </View>
              <Icon name="chatbubbles" color="#fff" size={22} />
            </View>
          </Pressable>

          {/* Deep report teaser */}
          <Card style={{ gap: space.sm }}>
            <Chip label="✦ Deep Report" color={colors.cosmic} />
            <Text style={styles.premiumTitle}>Your full story</Text>
            <Text style={styles.premiumSub}>
              Six chapters read from your palm — coming as an in-app unlock.
            </Text>
            <View style={styles.premiumGrid}>
              {PREMIUM.map((p) => (
                <View key={p.t} style={styles.premiumItem}>
                  <Text style={{ fontSize: 20 }}>{p.icon}</Text>
                  <Text style={styles.premiumItemText}>{p.t}</Text>
                </View>
              ))}
            </View>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.md, paddingVertical: space.sm },
  iconBtn: { height: 40, width: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  h1: { color: colors.text, fontSize: font.h1, fontWeight: "800", marginTop: 8 },
  lineHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { height: 12, width: 12, borderRadius: 6 },
  lineLabel: { color: colors.text, fontSize: font.h3, fontWeight: "700", flex: 1 },
  summary: { color: colors.text, fontSize: font.body, marginTop: space.md, lineHeight: 22 },
  bullet: { flexDirection: "row", gap: 8, marginTop: 6 },
  bulletText: { color: colors.textDim, fontSize: font.small, flex: 1, lineHeight: 20 },
  astro: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: colors.cosmic600,
    borderRadius: radius.md,
    padding: space.lg,
    ...shadow,
  },
  astroIcon: { height: 44, width: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  astroTitle: { color: "#fff", fontSize: font.h3, fontWeight: "800" },
  astroSub: { color: "rgba(255,255,255,0.85)", fontSize: font.small, marginTop: 2 },
  premiumTitle: { color: colors.text, fontSize: font.h2, fontWeight: "800", marginTop: 2 },
  premiumSub: { color: colors.textDim, fontSize: font.small, lineHeight: 20 },
  premiumGrid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.sm },
  premiumItem: { width: "30%", flexGrow: 1, alignItems: "center", gap: 4, backgroundColor: colors.chipBg, borderRadius: radius.sm, paddingVertical: space.md },
  premiumItemText: { color: colors.text, fontSize: font.tiny, fontWeight: "600", textAlign: "center" },
});
