import { ScrollView, Text, View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui";
import { colors, font, radius, space } from "@/lib/theme";

const PERKS = [
  { icon: "💰", label: "Money & wealth" },
  { icon: "💼", label: "Career & success" },
  { icon: "🍀", label: "Luck & fortune" },
  { icon: "💕", label: "Love & dating" },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const name = user?.email?.split("@")[0] ?? "there";

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.xl }}>
        <View>
          <Text style={styles.hi}>Hi {name} 👋</Text>
          <Text style={styles.h1}>What do your palms{"\n"}reveal today?</Text>
        </View>

        <Pressable onPress={() => router.push("/(tabs)/scan")} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
          <Card style={styles.hero}>
            <Text style={{ fontSize: 46 }}>✋</Text>
            <Text style={styles.heroTitle}>Scan your palm</Text>
            <Text style={styles.heroSub}>Snap a photo — AI reads your real lines in seconds.</Text>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Start reading</Text>
              <Icon name="arrow-forward" color={colors.cosmic600} size={18} />
            </View>
          </Card>
        </Pressable>

        <View>
          <Text style={styles.section}>What you'll discover</Text>
          <View style={styles.grid}>
            {PERKS.map((p) => (
              <Card key={p.label} style={styles.perk}>
                <Text style={{ fontSize: 26 }}>{p.icon}</Text>
                <Text style={styles.perkText}>{p.label}</Text>
              </Card>
            ))}
          </View>
        </View>

        <Pressable onPress={() => router.push("/(tabs)/readings")}>
          <Card style={styles.rowCard}>
            <Icon name="book" color={colors.cosmic300} size={22} />
            <Text style={styles.rowText}>My past readings</Text>
            <Icon name="chevron-forward" color={colors.textFaint} size={18} />
          </Card>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  hi: { color: colors.textDim, fontSize: font.body },
  h1: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 4, lineHeight: 34 },
  hero: { alignItems: "flex-start", gap: 6, backgroundColor: colors.cosmic600, borderColor: colors.cosmic600 },
  heroTitle: { color: "#fff", fontSize: font.h2, fontWeight: "800", marginTop: 4 },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: font.body },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: space.lg,
    paddingVertical: 11,
    borderRadius: radius.full,
    marginTop: space.md,
  },
  heroCtaText: { color: colors.cosmic600, fontWeight: "800", fontSize: font.body },
  section: { color: colors.textFaint, fontSize: font.small, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: space.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  perk: { width: "47%", flexGrow: 1, gap: 8 },
  perkText: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  rowCard: { flexDirection: "row", alignItems: "center", gap: space.md },
  rowText: { color: colors.text, fontSize: font.body, fontWeight: "600", flex: 1 },
});
