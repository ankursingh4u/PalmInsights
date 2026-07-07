import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { Icon } from "@/components/Icon";
import { ShareCard } from "@/components/ShareCard";
import { api, getProToken, setProToken } from "@/lib/api";
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

const PRO_PERKS = [
  "20 palm readings a month",
  "Ask the Astrologer — 60 chats / mo",
  "10 full Deep Reports a month",
  "Your lucky number, color & day",
];

export default function Reading() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PremiumReport | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportErr, setReportErr] = useState<string | null>(null);

  const shareRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [pro, setPro] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [code, setCode] = useState("");
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [redeemErr, setRedeemErr] = useState<string | null>(null);

  useEffect(() => {
    getProToken().then((t) => setPro(Boolean(t)));
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
      const proToken = await getProToken();
      const res = await api.report(id, proToken);
      if (res.requiresPro) {
        setShowRedeem(true);
      } else if (res.result?.report) {
        setReport(res.result.report);
      } else {
        setReportErr("Couldn't generate the report. Try again.");
      }
    } catch (e) {
      setReportErr((e as Error).message);
    } finally {
      setReportBusy(false);
    }
  }

  async function share() {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(shareRef, { format: "png", quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share your palm reading" });
      }
    } catch (e) {
      Alert.alert("Couldn't share", (e as Error).message);
    } finally {
      setSharing(false);
    }
  }

  async function redeem() {
    const c = code.trim();
    if (!c || redeemBusy) return;
    setRedeemBusy(true);
    setRedeemErr(null);
    try {
      const { proToken } = await api.redeem(c);
      await setProToken(proToken);
      setPro(true);
      setShowRedeem(false);
      revealReport();
    } catch (e) {
      setRedeemErr((e as Error).message);
    } finally {
      setRedeemBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Icon name="chevron-back" color={colors.text} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Your Reading</Text>
        <Pressable onPress={share} hitSlop={10} style={styles.iconBtn} disabled={!result}>
          {sharing ? (
            <ActivityIndicator color={colors.cosmic} size="small" />
          ) : (
            <Text style={{ fontSize: 20 }}>📤</Text>
          )}
        </Pressable>
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

          {/* Ask the astrologer — Pro only */}
          <Pressable
            onPress={() => (pro ? router.push(`/chat/${id}`) : setShowRedeem(true))}
            style={({ pressed }) => [pressed && { opacity: 0.9 }]}
          >
            <View style={styles.astro}>
              <View style={styles.astroIcon}>
                <Text style={{ fontSize: 24 }}>🔮</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.astroTitle}>Ask the Astrologer {pro ? "" : "🔒"}</Text>
                <Text style={styles.astroSub}>
                  {pro ? "Chat about your reading — love, money, luck…" : "Pro feature — unlock to chat"}
                </Text>
              </View>
              <Icon name="chatbubbles" size={22} />
            </View>
          </Pressable>

          {/* Deep Report */}
          {report ? (
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
          ) : (
            <Card style={styles.premium}>
              <View style={styles.proRow}>
                <Chip label="✦ PRO" color={colors.cosmic} />
                <Text style={styles.price}>$9 / month</Text>
              </View>
              <Text style={styles.premiumTitle}>Unlock your full story</Text>
              {PRO_PERKS.map((p) => (
                <View key={p} style={styles.perkRow}>
                  <Icon name="checkmark-circle" size={15} color={colors.cosmic} />
                  <Text style={styles.perkText}>{p}</Text>
                </View>
              ))}

              {showRedeem && !pro ? (
                <View style={{ gap: space.sm, marginTop: space.sm }}>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="Launch code (free for first 100)"
                    placeholderTextColor={colors.textFaint}
                    autoCapitalize="characters"
                    style={styles.codeInput}
                  />
                  {redeemErr && <Text style={styles.err}>{redeemErr}</Text>}
                  <Pressable onPress={redeem} disabled={redeemBusy} style={[styles.revealBtn, redeemBusy && { opacity: 0.6 }]}>
                    {redeemBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.revealText}>Redeem &amp; Unlock</Text>}
                  </Pressable>
                </View>
              ) : (
                <>
                  {reportErr && <Text style={styles.err}>{reportErr}</Text>}
                  <Pressable onPress={revealReport} disabled={reportBusy} style={[styles.revealBtn, reportBusy && { opacity: 0.6 }]}>
                    {reportBusy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.revealText}>{pro ? "Reveal Deep Report" : "Unlock Deep Report"}</Text>
                    )}
                  </Pressable>
                  {!pro && (
                    <Pressable onPress={() => setShowRedeem(true)}>
                      <Text style={styles.redeemLink}>Have a launch code?</Text>
                    </Pressable>
                  )}
                </>
              )}
            </Card>
          )}
        </ScrollView>
      )}

      {/* Off-screen card captured for sharing */}
      {result && (
        <View style={styles.offscreen} pointerEvents="none">
          <ShareCard ref={shareRef} result={result} report={report} />
        </View>
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
  premium: { backgroundColor: colors.cosmicSoft, borderColor: colors.cosmicSoftBorder, gap: 6 },
  proRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price: { color: colors.cosmic600, fontSize: font.small, fontWeight: "800" },
  premiumTitle: { color: colors.text, fontSize: font.h2, fontWeight: "800", marginTop: 2, marginBottom: 4 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  perkText: { color: colors.text, fontSize: font.small },
  codeInput: { height: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.cosmicSoftBorder, backgroundColor: "#fff", paddingHorizontal: space.lg, color: colors.text, fontSize: font.body },
  revealBtn: { height: 50, borderRadius: radius.full, backgroundColor: colors.cosmic600, alignItems: "center", justifyContent: "center", marginTop: space.sm },
  revealText: { color: "#fff", fontSize: font.body, fontWeight: "700" },
  redeemLink: { color: colors.cosmic600, fontSize: font.small, fontWeight: "600", textAlign: "center", marginTop: space.md },
  err: { color: colors.danger, fontSize: font.small },
  highlights: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  hl: { width: "31%", flexGrow: 1, backgroundColor: colors.cosmicSoft, borderRadius: radius.sm, padding: space.md, alignItems: "center" },
  hlLabel: { color: colors.textDim, fontSize: font.tiny, fontWeight: "600", textTransform: "uppercase" },
  hlValue: { color: colors.cosmic600, fontSize: font.body, fontWeight: "800", marginTop: 2, textAlign: "center" },
  chapterTitle: { color: colors.text, fontSize: font.h3, fontWeight: "800" },
  chapterBody: { color: colors.textDim, fontSize: font.body, lineHeight: 22, marginTop: space.sm },
  offscreen: { position: "absolute", top: -10000, left: 0 },
});
