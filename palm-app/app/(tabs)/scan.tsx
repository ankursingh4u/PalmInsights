import { useState } from "react";
import { ScrollView, Text, View, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
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
      console.log("[scan] tap", source);
      const perm =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("[scan] permission", JSON.stringify(perm));
      if (!perm.granted) {
        Alert.alert("Permission needed", "Please allow camera access in Settings, then try again.");
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        quality: 0.7,
      };
      console.log("[scan] launching picker…");
      const res =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);
      console.log("[scan] result canceled=", res.canceled, "hasAsset=", !!res.assets?.[0]);
      if (res.canceled || !res.assets?.[0]?.uri) {
        if (res.canceled) Alert.alert("No photo", "Closed without taking a photo.");
        return;
      }

      setBusy(true);
      // Downscale before upload (full-res photos are too big / slow → the AI
      // call times out). Mirrors the website's 1280px downscale.
      const manipulated = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.6, base64: true, format: ImageManipulator.SaveFormat.JPEG }
      );
      if (!manipulated.base64) {
        Alert.alert("Couldn't read photo", "Please try again.");
        setBusy(false);
        return;
      }
      const dataUrl = `data:image/jpeg;base64,${manipulated.base64}`;
      console.log("[scan] payload chars=", dataUrl.length);
      const out = await api.scan(dataUrl);
      setBusy(false);

      if (out.requiresPro) {
        Alert.alert(
          "Unlock unlimited readings",
          out.message || "You've used your free reading. Go Pro for unlimited readings + astrologer chat.",
          [
            { text: "Not now", style: "cancel" },
            { text: "Go Pro", onPress: () => router.push("/(tabs)/profile") },
          ]
        );
        return;
      }
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
