// Account tab: who is signed in, and Sign out. Phase 2 grows this into the full profile
// (own listings, purchases, stats).
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ScreenTitle } from "@/components/ScreenTitle";
import { SignInPrompt } from "@/components/SignInPrompt";
import { useAuth } from "@/lib/auth";
import { colors, radius } from "@/theme";

export default function AccountScreen() {
  const { user, loading, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <ScreenTitle text="Account" />
      {loading ? (
        <ActivityIndicator color={colors.pageText} style={styles.spinner} />
      ) : !user ? (
        <SignInPrompt message="Save items, and soon chat with sellers and sell your own things." />
      ) : (
        <View style={styles.card}>
          <Text style={styles.initial}>{user.name.charAt(0).toUpperCase()}</Text>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.line}>{user.email}</Text>
          {user.major ? <Text style={styles.line}>{user.major}</Text> : null}
          {user.isVerified ? <Text style={styles.badge}>Verified AUPP student</Text> : null}
          <Button label="Sign out" variant="plain" onPress={signOut} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.page },
  spinner: { marginTop: 40 },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 20, gap: 10, margin: 20 },
  initial: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.dark, color: colors.inset,
    fontSize: 32, fontWeight: "800", textAlign: "center", lineHeight: 72, overflow: "hidden", alignSelf: "center",
  },
  name: { fontSize: 24, fontWeight: "800", color: colors.cardText, textAlign: "center" },
  line: { fontSize: 15, color: colors.cardText, textAlign: "center" },
  badge: {
    alignSelf: "center", backgroundColor: colors.dark, color: colors.inset, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 4, fontWeight: "700", overflow: "hidden", marginBottom: 6,
  },
});
