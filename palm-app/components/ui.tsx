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
import { Icon } from "@/components/Icon";
import { colors, font, radius, shadow, space } from "@/lib/theme";

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
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  icon?: string;
}) {
  const isPrimary = variant === "primary";
  const fg = isPrimary ? "#fff" : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnGhost,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} color={fg} />}
          <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput placeholderTextColor={colors.textFaint} style={styles.field} {...props} />
  );
}

export function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <View style={[styles.chip, color ? { backgroundColor: `${color}1A` } : null]}>
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
    ...shadow,
  },
  btn: {
    flexDirection: "row",
    gap: 8,
    height: 52,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  btnPrimary: { backgroundColor: colors.cosmic600 },
  btnGhost: {
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  btnText: { fontSize: font.body, fontWeight: "700" },
  field: {
    height: 52,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    color: colors.text,
    fontSize: font.body,
  },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: colors.chipBg,
    borderRadius: radius.full,
    paddingHorizontal: space.md,
    paddingVertical: 5,
  },
  chipText: { color: colors.textDim, fontSize: font.tiny, fontWeight: "700" },
});
