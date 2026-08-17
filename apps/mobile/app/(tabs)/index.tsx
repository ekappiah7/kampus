import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChildren } from "@/lib/child-context";
import { theme } from "@/lib/theme";
import { ChildSwitcher } from "@/components/ChildSwitcher";

const QUICK_LINKS: { icon: string; label: string; href: string; tint: string }[] = [
  { icon: "📋", label: "Attendance", href: "/attendance", tint: theme.color.tint.goldAlt },
  { icon: "📊", label: "Grades", href: "/grades", tint: theme.color.tint.blue },
  { icon: "📝", label: "Homework", href: "/(tabs)/homework", tint: theme.color.tint.pink },
  { icon: "🚗", label: "Pickup", href: "/pickup", tint: theme.color.tint.blue },
  { icon: "💳", label: "Fees", href: "/(tabs)/fees", tint: theme.color.tint.green },
  { icon: "📅", label: "Calendar", href: "/(tabs)/calendar", tint: theme.color.tint.goldAlt },
  { icon: "📣", label: "Notices", href: "/announcements", tint: theme.color.tint.blue },
  { icon: "🍽️", label: "Cafeteria", href: "/cafeteria", tint: theme.color.tint.pink },
  { icon: "💬", label: "Parent Voice", href: "/voice", tint: theme.color.tint.green },
];

export default function HomeScreen() {
  const { activeChild } = useChildren();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Aspire Royal Academy</Text>
          <TouchableOpacity onPress={() => router.push("/notifications")}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        <ChildSwitcher />

        {activeChild && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Attendance</Text>
              <Text style={styles.statValue}>{activeChild.attendancePct}%</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Fee balance</Text>
              <Text style={[styles.statValue, { color: activeChild.feeBalance > 0 ? theme.color.danger : theme.color.success }]}>
                GH₵{activeChild.feeBalance}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.grid}>
          {QUICK_LINKS.map((link) => (
            <TouchableOpacity key={link.label} style={[styles.tile, { backgroundColor: link.tint }]} onPress={() => router.push(link.href as never)}>
              <Text style={{ fontSize: 22 }}>{link.icon}</Text>
              <Text style={styles.tileLabel}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  greeting: { fontSize: 19, fontWeight: "700", color: theme.color.textPrimary },
  statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: theme.color.surface, borderRadius: theme.radius.cardLg, borderWidth: 1, borderColor: theme.color.borderAlt, padding: 14 },
  statLabel: { fontSize: 12, color: theme.color.textMuted },
  statValue: { fontSize: 22, fontWeight: "700", color: theme.color.textPrimary, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 12 },
  tile: { width: "30%", aspectRatio: 1, borderRadius: theme.radius.card, alignItems: "center", justifyContent: "center", gap: 6 },
  tileLabel: { fontSize: 12, fontWeight: "600", color: theme.color.textPrimary, textAlign: "center" },
});
