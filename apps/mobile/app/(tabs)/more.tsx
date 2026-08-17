import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

const MORE_LINKS = [
  { icon: "📋", label: "Attendance", href: "/attendance" },
  { icon: "📊", label: "Grades", href: "/grades" },
  { icon: "📣", label: "Announcements", href: "/announcements" },
  { icon: "🍽️", label: "Cafeteria Menu", href: "/cafeteria" },
  { icon: "💬", label: "Parent Voice", href: "/voice" },
  { icon: "🚗", label: "Pickup Notice", href: "/pickup" },
  { icon: "🔔", label: "Notifications", href: "/notifications" },
];

export default function MoreScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.title}>More</Text>
      <View style={styles.grid}>
        {MORE_LINKS.map((l) => (
          <TouchableOpacity key={l.label} style={styles.tile} onPress={() => router.push(l.href as never)}>
            <Text style={{ fontSize: 20 }}>{l.icon}</Text>
            <Text style={styles.tileLabel}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {user && (
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Sign out ({user.name})</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  title: { fontSize: 19, fontWeight: "700", paddingHorizontal: 16, paddingTop: 12, color: theme.color.textPrimary },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 12 },
  tile: { width: "30%", aspectRatio: 1, borderRadius: theme.radius.card, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: theme.color.surface, borderWidth: 1, borderColor: theme.color.borderAlt },
  tileLabel: { fontSize: 11, fontWeight: "600", color: theme.color.textPrimary, textAlign: "center" },
  logout: { marginTop: "auto", marginHorizontal: 16, marginBottom: 24, alignItems: "center", padding: 14 },
  logoutText: { color: theme.color.danger, fontWeight: "600" },
});
