import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SubjectGrade } from "@kampus/shared-types";
import { useChildren } from "@/lib/child-context";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function GradesScreen() {
  const { activeChildId } = useChildren();
  const [grades, setGrades] = useState<SubjectGrade[]>([]);

  useEffect(() => {
    if (activeChildId) api.students.grades(activeChildId).then(setGrades);
  }, [activeChildId]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScreenHeader title="Grades" />
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={grades}
        keyExtractor={(g) => g.subject}
        ListEmptyComponent={<Text style={styles.empty}>No grades posted yet this term.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.subject}>{item.subject}</Text>
              <Text style={styles.grade}>
                {item.letterGrade} · {item.finalScore}%
              </Text>
            </View>
            <Text style={styles.remark}>{item.remark}</Text>
            {item.components.map((c, i) => (
              <View key={i} style={styles.componentRow}>
                <Text style={styles.componentLabel}>
                  {c.label} ({c.weightPct}%)
                </Text>
                <Text style={styles.componentScore}>
                  {c.score}/{c.maxScore}
                </Text>
              </View>
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  empty: { textAlign: "center", color: theme.color.textMuted, marginTop: 24 },
  card: { backgroundColor: theme.color.surface, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.color.borderAlt, padding: 14 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  subject: { fontWeight: "700", color: theme.color.textPrimary },
  grade: { fontWeight: "700", color: theme.color.success },
  remark: { fontSize: 12, color: theme.color.textMuted, marginTop: 2, marginBottom: 8 },
  componentRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 1, borderTopColor: theme.color.borderSoft },
  componentLabel: { fontSize: 12, color: theme.color.textSecondary },
  componentScore: { fontSize: 12, fontWeight: "600", color: theme.color.textPrimary },
});
