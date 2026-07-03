import { useCallback, useState } from "react";
import { FlatList, Text, View, StyleSheet, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";
import type { ScanSummary } from "@/lib/types";
import { Card, Chip } from "@/components/ui";
import { colors, font, space } from "@/lib/theme";

export default function Readings() {
  const router = useRouter();
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.history();
      setScans(r.scans);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={{ paddingHorizontal: space.xl, paddingTop: space.lg }}>
        <Text style={styles.h1}>My readings</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.cosmic300} />
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: space.xl, gap: space.md }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.cosmic300}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 44 }}>🔮</Text>
              <Text style={styles.emptyText}>No readings yet.</Text>
              <Pressable onPress={() => router.push("/(tabs)/scan")} style={styles.cta}>
                <Icon name="scan" color="#fff" size={18} />
                <Text style={styles.ctaText}>Scan your palm</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/reading/${item.id}`)}>
              <Card style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.personName || "🔮").trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.personName || "My reading"}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.topLine ? `${item.topLine.label}: ${item.topLine.pattern} · ` : ""}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Chip label={item.paid ? "✦ Premium" : "Free"} color={item.paid ? colors.cosmic300 : undefined} />
                <Icon name="chevron-forward" color={colors.textFaint} size={18} />
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.text, fontSize: font.h1, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", gap: space.md, paddingTop: 80 },
  emptyText: { color: colors.textDim, fontSize: font.body },
  cta: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.cosmic600, paddingHorizontal: space.xl, paddingVertical: 12, borderRadius: 999, marginTop: space.sm },
  ctaText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  avatar: { height: 40, width: 40, borderRadius: 20, backgroundColor: colors.cosmicSoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.cosmic300, fontSize: font.h3, fontWeight: "700" },
  name: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  meta: { color: colors.textFaint, fontSize: font.small, marginTop: 2 },
});
