import { useState } from "react";
import { ScrollView, Text, View, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/lib/api";
import { Card } from "@/components/ui";
import { colors, font, radius, space } from "@/lib/theme";

const TIPS = [
  "Open hand, palm facing the camera",
  "Good, even lighting — no harsh shadows",
  "Fill the frame with your palm",
];

export default function Scan() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function pick(source: "camera" | "library") {
    try {
      const perm =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Please allow access to continue.");
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      };
      const res =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets?.[0]?.base64) return;

      const dataUrl = `data:image/jpeg;base64,${res.assets[0].base64}`;
      setBusy(true);
      const out = await api.scan(dataUrl);
      setBusy(false);

      if (out.notPalm) {
        Alert.alert("Hmm, that's not a clear palm", out.message || "Try again with an open palm.");
        return;
      }
      if (out.scanId) {
        router.push(`/reading/${out.scanId}`);
      }
    } catch (e) {
      setBusy(false);
      Alert.alert("Something went wrong", (e as Error).message);
    }
  }

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.xl }}>
        <View>
          <Text style={styles.h1}>Scan your palm</Text>
          <Text style={styles.sub}>The AI reads your real lines from the photo.</Text>
        </View>

        <View style={styles.frame}>
          <Icon name="hand-left-outline" color={colors.cosmic300} size={72} />
        </View>

        <View style={{ gap: space.md }}>
          <Pressable onPress={() => pick("camera")} disabled={busy} style={({ pressed }) => [styles.primary, pressed && { opacity: 0.9 }]}>
            <Icon name="camera" color="#fff" size={20} />
            <Text style={styles.primaryText}>Take a photo</Text>
          </Pressable>
          <Pressable onPress={() => pick("library")} disabled={busy} style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.9 }]}>
            <Icon name="image" color={colors.text} size={20} />
            <Text style={styles.ghostText}>Choose from gallery</Text>
          </Pressable>
        </View>

        <Card style={{ gap: space.sm }}>
          <Text style={styles.tipTitle}>For the best reading</Text>
          {TIPS.map((t) => (
            <View key={t} style={styles.tipRow}>
              <Icon name="checkmark-circle" color={colors.cosmic400} size={16} />
              <Text style={styles.tipText}>{t}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      {busy && (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.cosmic300} size="large" />
          <Text style={styles.overlayText}>Reading your palm…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.text, fontSize: font.h1, fontWeight: "800" },
  sub: { color: colors.textDim, fontSize: font.body, marginTop: 4 },
  frame: {
    height: 200,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cosmicSoftBorder,
    borderStyle: "dashed",
    backgroundColor: colors.cosmicSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    flexDirection: "row",
    gap: 8,
    height: 54,
    borderRadius: radius.full,
    backgroundColor: colors.cosmic600,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#fff", fontSize: font.body, fontWeight: "700" },
  ghost: {
    flexDirection: "row",
    gap: 8,
    height: 54,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.chipBg,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostText: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  tipTitle: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tipText: { color: colors.textDim, fontSize: font.small },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
  },
  overlayText: { color: colors.text, fontSize: font.body, fontWeight: "600" },
});
