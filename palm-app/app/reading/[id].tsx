import { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";
import type { AnalysisResult, PremiumReport } from "@/lib/types";
import { Card, Chip } from "@/components/ui";
import { colors, font, radius, shadow, space } from "@/lib/theme";

const CHAPTERS: { key: keyof PremiumReport; icon: string }[] = [
  { key: "destiny", icon: "🌌" },
  { key: "career", icon: "💼" },
  { key: "wealth", icon: "💰" },
  { key: "luck", icon: "🍀" },
  { key: "love", icon: "💕" },
  { key: "vibe", icon: "✨" },
];

export default function Reading() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PremiumReport | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportErr, setReportErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getScan(id)
      .then((r) => {
        setResult(r.result);
        if (r.result.report) setReport(r.result.report);
      })
      .catch((e) => setError((e as Error).message));
  }, [id]);

  async function revealReport() {
    if (!id || reportBusy) return;
    setReportBusy(true);
    setReportErr(null);
    try {
      const { result: full } = await api.report(id);
      if (full.report) setReport(full.report);
      else setReportErr("Couldn't generate the deep report. Try again.");
    } catch (e) {
      setReportErr((e as Error).message);
    } finally {
      setReportBusy(false);
    }
  }

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

          {/* Ask the astrologer */}
          <Pressable onPress={() => router.push(`/chat/${id}`)} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
            <View style={styles.astro}>
              <View style={styles.astroIcon}>
                <Text style={{ fontSize: 24 }}>🔮</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.astroTitle}>Ask the Astrologer</Text>
                <Text style={styles.astroSub}>Chat about your reading — love, money, luck…</Text>
              </View>
              <Icon name="chatbubbles" size={22} />
            </View>
          </Pressable>

          {/* Deep Report */}
          {!report ? (
            <Card style={styles.premium}>
              <Chip label="✦ Deep Report" color={colors.cosmic} />
              <Text style={styles.premiumTitle}>Your full story</Text>
              <Text style={styles.premiumSub}>
                Six personalized chapters read from your palm — plus your archetype &amp; lucky
                number, color and day.
              </Text>
              <View style={styles.premiumGrid}>
                {CHAPTERS.map((c) => (
                  <View key={c.key} style={styles.premiumItem}>
                    <Text style={{ fontSize: 20 }}>{c.icon}</Text>
                    <Text style={styles.premiumItemText}>{c.key}</Text>
                  </View>
                ))}
              </View>
              {reportErr && <Text style={styles.err}>{reportErr}</Text>}
              <Pressable
                onPress={revealReport}
                disabled={reportBusy}
                style={[styles.revealBtn, reportBusy && { opacity: 0.6 }]}
              >
                {reportBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.revealText}>Reveal Deep Report</Text>
                )}
              </Pressable>
            </Card>
          ) : (
            <>
              <View style={styles.highlights}>
                <HL label="Archetype" value={report.highlights.archetype} wide />
                <HL label="Lucky #" value={report.highlights.luckyNumber} />
                <HL label="Color" value={report.highlights.luckyColor} />
                <HL label="Day" value={report.highlights.luckyDay} />
              </View>
              {CHAPTERS.map(({ key, icon }) => {
                const section = report[key];
                if (typeof section !== "object" || !("title" in section)) return null;
                return (
                  <Card key={key}>
                    <Text style={styles.chapterTitle}>
                      {icon} {section.title}
                    </Text>
                    {section.body.map((p, i) => (
                      <Text key={i} style={styles.chapterBody}>
                        {p}
                      </Text>
                    ))}
                  </Card>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function HL({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.hl, wide && { width: "100%" }]}>
      <Text style={styles.hlLabel}>{label}</Text>
      <Text style={styles.hlValue}>{value}</Text>
    </View>
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
  astro: { flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: colors.cosmic600, borderRadius: radius.md, padding: space.lg, ...shadow },
  astroIcon: { height: 44, width: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  astroTitle: { color: "#fff", fontSize: font.h3, fontWeight: "800" },
  astroSub: { color: "rgba(255,255,255,0.85)", fontSize: font.small, marginTop: 2 },
  premium: { backgroundColor: colors.cosmicSoft, borderColor: colors.cosmicSoftBorder, gap: space.sm },
  premiumTitle: { color: colors.text, fontSize: font.h2, fontWeight: "800", marginTop: 2 },
  premiumSub: { color: colors.textDim, fontSize: font.small, lineHeight: 20 },
  premiumGrid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.sm },
  premiumItem: { width: "30%", flexGrow: 1, alignItems: "center", gap: 4, backgroundColor: "#fff", borderRadius: radius.sm, paddingVertical: space.md },
  premiumItemText: { color: colors.text, fontSize: font.tiny, fontWeight: "600", textAlign: "center", textTransform: "capitalize" },
  revealBtn: { height: 50, borderRadius: radius.full, backgroundColor: colors.cosmic600, alignItems: "center", justifyContent: "center", marginTop: space.sm },
  revealText: { color: "#fff", fontSize: font.body, fontWeight: "700" },
  err: { color: colors.danger, fontSize: font.small },
  highlights: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  hl: { width: "31%", flexGrow: 1, backgroundColor: colors.cosmicSoft, borderRadius: radius.sm, padding: space.md, alignItems: "center" },
  hlLabel: { color: colors.textDim, fontSize: font.tiny, fontWeight: "600", textTransform: "uppercase" },
  hlValue: { color: colors.cosmic600, fontSize: font.body, fontWeight: "800", marginTop: 2, textAlign: "center" },
  chapterTitle: { color: colors.text, fontSize: font.h3, fontWeight: "800" },
  chapterBody: { color: colors.textDim, fontSize: font.body, lineHeight: 22, marginTop: space.sm },
});
