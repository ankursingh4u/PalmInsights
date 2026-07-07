import { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { AnalysisResult, PremiumReport } from "@/lib/types";
import { colors, font } from "@/lib/theme";

// A branded, screenshot-ready card users share to Instagram / WhatsApp status.
// Rendered off-screen and captured with react-native-view-shot.
export const ShareCard = forwardRef<View, { result: AnalysisResult; report: PremiumReport | null }>(
  function ShareCard({ result, report }, ref) {
    const top = result.lines[0];
    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <Text style={styles.brand}>🔮 PalmInsight</Text>

        {report ? (
          <>
            <Text style={styles.kicker}>My palm archetype</Text>
            <Text style={styles.big}>{report.highlights.archetype}</Text>
            <View style={styles.luckyRow}>
              <Lucky label="Lucky #" value={report.highlights.luckyNumber} />
              <Lucky label="Color" value={report.highlights.luckyColor} />
              <Lucky label="Day" value={report.highlights.luckyDay} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.kicker}>My palm reading</Text>
            <Text style={styles.big}>{top?.summary || "The lines don't lie ✨"}</Text>
            {top && <Text style={styles.line}>{top.label}: {top.pattern}</Text>}
          </>
        )}

        <View style={styles.hand}>
          <Text style={{ fontSize: 64 }}>✋</Text>
        </View>

        <Text style={styles.cta}>Scan your palm with AI 👉</Text>
        <Text style={styles.url}>PalmInsight on Google Play</Text>
      </View>
    );
  }
);

function Lucky({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.lucky}>
      <Text style={styles.luckyLabel}>{label}</Text>
      <Text style={styles.luckyValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 360,
    padding: 28,
    backgroundColor: colors.cosmic600,
    borderRadius: 28,
    gap: 8,
  },
  brand: { color: "#fff", fontSize: font.h3, fontWeight: "900", letterSpacing: 0.3 },
  kicker: { color: "rgba(255,255,255,0.8)", fontSize: font.small, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 18 },
  big: { color: "#fff", fontSize: 30, fontWeight: "900", lineHeight: 36, marginTop: 4 },
  line: { color: "rgba(255,255,255,0.9)", fontSize: font.body, marginTop: 8 },
  luckyRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  lucky: { flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  luckyLabel: { color: "rgba(255,255,255,0.8)", fontSize: font.tiny, fontWeight: "700", textTransform: "uppercase" },
  luckyValue: { color: "#fff", fontSize: font.body, fontWeight: "900", marginTop: 2, textAlign: "center" },
  hand: { alignItems: "center", marginVertical: 18 },
  cta: { color: "#fff", fontSize: font.body, fontWeight: "800", textAlign: "center" },
  url: { color: "rgba(255,255,255,0.85)", fontSize: font.small, textAlign: "center", marginTop: 2 },
});
