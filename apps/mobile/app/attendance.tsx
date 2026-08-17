import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AttendanceEntry } from "@kampus/shared-types";
import { useChildren } from "@/lib/child-context";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/components/ScreenHeader";

const STATUS_STYLE: Record<AttendanceEntry["status"], { bg: string; color: string }> = {
  PRESENT: { bg: theme.color.tint.green, color: theme.color.success },
  LATE: { bg: theme.color.tint.goldAlt, color: theme.brand.pendingLabel },
  ABSENT: { bg: theme.color.dangerTint, color: theme.color.danger },
};

export default function AttendanceScreen() {
  const { activeChildId } = useChildren();
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);

  useEffect(() => {
    if (activeChildId) api.students.attendance(activeChildId).then(setEntries);
  }, [activeChildId]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScreenHeader title="Attendance" />
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 8 }}
        data={entries}
        keyExtractor={(e) => e.date}
        ListEmptyComponent={<Text style={styles.empty}>No attendance recorded yet.</Text>}
        renderItem={({ item }) => {
          const s = STATUS_STYLE[item.status];
          return (
            <View style={styles.row}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={[styles.badge, { backgroundColor: s.bg, color: s.color }]}>{item.status}</Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  empty: { textAlign: "center", color: theme.color.textMuted, marginTop: 24 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: theme.color.surface, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.color.borderAlt, padding: 14 },
  date: { fontWeight: "500", color: theme.color.textPrimary },
  badge: { fontSize: 11, fontWeight: "700", borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3, overflow: "hidden" },
});
