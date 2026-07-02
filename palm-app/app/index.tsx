import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.cosmic300} size="large" />
      </View>
    );
  }
  return <Redirect href={user ? "/(tabs)" : "/(auth)/login"} />;
}
