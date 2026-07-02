import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from "react-native";
import { colors, font, radius, space } from "@/lib/theme";

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost";
}) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnGhost,
        (disabled || loading) && { opacity: 0.55 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.btnText, !isPrimary && { color: colors.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textFaint}
      style={styles.field}
      {...props}
    />
  );
}

export function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <View style={[styles.chip, color ? { backgroundColor: `${color}22` } : null]}>
      <Text style={[styles.chipText, color ? { color } : null]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.lg,
  },
  btn: {
    height: 52,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  btnPrimary: { backgroundColor: colors.cosmic600 },
  btnGhost: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  btnText: { color: "#fff", fontSize: font.body, fontWeight: "700" },
  field: {
    height: 52,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: space.lg,
    color: colors.text,
    fontSize: font.body,
  },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.full,
    paddingHorizontal: space.md,
    paddingVertical: 5,
  },
  chipText: { color: colors.textDim, fontSize: font.tiny, fontWeight: "600" },
});
