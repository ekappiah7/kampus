import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { HomeworkItem } from "@kampus/shared-types";
import { useChildren } from "@/lib/child-context";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";

export default function HomeworkScreen() {
  const { activeChildId } = useChildren();
  const [items, setItems] = useState<HomeworkItem[]>([]);

  useEffect(() => {
    if (activeChildId) api.students.homework(activeChildId).then(setItems);
  }, [activeChildId]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.title}>Homework</Text>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={items}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<Text style={styles.empty}>No homework posted yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.subject}>{item.subject}</Text>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <View style={styles.row}>
              <Text style={styles.due}>{item.due ? `Due ${item.due}` : "No due date"}</Text>
              <Text style={[styles.status, item.status === "SUBMITTED" ? styles.statusDone : styles.statusPending]}>{item.status}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  title: { fontSize: 19, fontWeight: "700", paddingHorizontal: 16, paddingTop: 12, color: theme.color.textPrimary },
  empty: { textAlign: "center", color: theme.color.textMuted, marginTop: 24 },
  card: { backgroundColor: theme.color.surface, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.color.borderAlt, padding: 14 },
  subject: { fontSize: 11, fontWeight: "700", color: theme.color.textMuted, letterSpacing: 0.5 },
  itemTitle: { fontSize: 15, fontWeight: "600", marginTop: 4, color: theme.color.textPrimary },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  due: { fontSize: 12, color: theme.color.textMuted },
  status: { fontSize: 11, fontWeight: "700", borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2, overflow: "hidden" },
  statusPending: { backgroundColor: theme.color.tint.goldAlt, color: theme.brand.pendingLabel },
  statusDone: { backgroundColor: theme.color.tint.green, color: theme.color.success },
});
