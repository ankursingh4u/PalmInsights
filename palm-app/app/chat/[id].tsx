import { useRef, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { colors, font, radius, space } from "@/lib/theme";

const GREETING =
  "I've studied your palm ✨ Ask me anything — love, money, career, luck, or a decision on your mind.";
const SUGGESTIONS = ["Will I be rich? 💰", "When will I find love?", "What's my luck like?"];

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy || !id) return;
    setInput("");
    const next: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setBusy(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const { reply } = await api.chat(id, next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: `⚠️ ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-back" color={colors.text} size={24} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 18 }}>🔮</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Aria</Text>
            <Text style={styles.headerSub}>your astrologer</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: space.lg, gap: space.md }}
          keyboardShouldPersistTaps="handled"
        >
          <Bubble role="assistant" text={GREETING} />
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} text={m.content} />
          ))}
          {busy && (
            <View style={[styles.bubble, styles.assistant]}>
              <ActivityIndicator color={colors.cosmic} size="small" />
            </View>
          )}

          {messages.length === 0 && (
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} onPress={() => send(s)} style={styles.suggestion}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask your question…"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            multiline
            onSubmitEditing={() => send(input)}
          />
          <Pressable
            onPress={() => send(input)}
            disabled={busy || !input.trim()}
            style={[styles.sendBtn, (busy || !input.trim()) && { opacity: 0.4 }]}
          >
            <Ionicons name="arrow-up" color="#fff" size={22} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  const isUser = role === "user";
  return (
    <View style={[styles.row, isUser && { justifyContent: "flex-end" }]}>
      {!isUser && <Text style={styles.bubbleIcon}>🔮</Text>}
      <View style={[styles.bubble, isUser ? styles.user : styles.assistant]}>
        <Text style={[styles.bubbleText, isUser && { color: "#fff" }]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  iconBtn: { height: 40, width: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { height: 34, width: 34, borderRadius: 17, backgroundColor: colors.cosmicSoft, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.text, fontSize: font.body, fontWeight: "800" },
  headerSub: { color: colors.textFaint, fontSize: font.tiny },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  bubbleIcon: { fontSize: 20, marginBottom: 2 },
  bubble: { maxWidth: "82%", borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 10 },
  assistant: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderBottomLeftRadius: 4 },
  user: { backgroundColor: colors.cosmic600, borderBottomRightRadius: 4 },
  bubbleText: { color: colors.text, fontSize: font.body, lineHeight: 21 },
  suggestions: { gap: space.sm, marginTop: space.sm },
  suggestion: {
    alignSelf: "flex-start",
    backgroundColor: colors.cosmicSoft,
    borderWidth: 1,
    borderColor: colors.cosmicSoftBorder,
    borderRadius: radius.full,
    paddingHorizontal: space.lg,
    paddingVertical: 10,
  },
  suggestionText: { color: colors.cosmic600, fontSize: font.small, fontWeight: "600" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.bgElevated,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingTop: 11,
    paddingBottom: 11,
    color: colors.text,
    fontSize: font.body,
  },
  sendBtn: { height: 44, width: 44, borderRadius: 22, backgroundColor: colors.cosmic600, alignItems: "center", justifyContent: "center" },
});
