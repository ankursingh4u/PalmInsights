import { Text, TextStyle } from "react-native";

// Font-free icons: emoji + text glyphs render reliably everywhere (the icon
// font would not resolve in the release build on-device). Semantic names map
// to an emoji or a system-font glyph, so callers stay readable.
const MAP: Record<string, string> = {
  // tabs
  sparkles: "🏠",
  home: "🏠",
  scan: "📷",
  book: "📖",
  person: "👤",
  // navigation
  "chevron-forward": "›",
  "chevron-back": "‹",
  "arrow-forward": "→",
  "arrow-up": "↑",
  // actions
  camera: "📷",
  image: "🖼️",
  "checkmark-circle": "✓",
  "hand-left-outline": "✋",
  "log-in-outline": "→",
  "person-add-outline": "✨",
  "log-out-outline": "↩",
  chatbubbles: "💬",
  chatbubble: "💬",
  ellipse: "•",
};

// Glyphs that are plain text (not emoji) and should take the given color.
const TEXT_GLYPHS = new Set(["›", "‹", "→", "↑", "✓", "•", "↩"]);

export function Icon({
  name,
  size = 20,
  color,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  style?: TextStyle;
}) {
  const ch = MAP[name] ?? "•";
  const colorable = TEXT_GLYPHS.has(ch);
  return (
    <Text
      allowFontScaling={false}
      style={[
        { fontSize: size, lineHeight: size * 1.15 },
        colorable && color ? { color } : null,
        style,
      ]}
    >
      {ch}
    </Text>
  );
}
