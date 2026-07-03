import { ScrollView, Text, View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui";
import { colors, font, radius, space } from "@/lib/theme";

function Row({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} color={danger ? colors.danger : colors.cosmic300} size={20} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" color={colors.textFaint} size={18} />}
    </Pressable>
  );
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();

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
});
