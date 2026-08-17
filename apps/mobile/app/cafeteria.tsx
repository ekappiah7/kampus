import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, SCHOOL_SUBDOMAIN } from "@/lib/api";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/components/ScreenHeader";

interface MenuItem {
  id: string;
  dayOfWeek: string;
  main: string;
  side: string | null;
}

export default function CafeteriaScreen() {
  const [menu, setMenu] = useState<MenuItem[]>([]);

  useEffect(() => {
    api.school.cafeteria(SCHOOL_SUBDOMAIN).then((r) => setMenu(r as MenuItem[]));
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScreenHeader title="Cafeteria Menu" />
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={menu}
        keyExtractor={(m) => m.id}
        ListEmptyComponent={<Text style={styles.empty}>Menu not published yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.day}>{item.dayOfWeek}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.main}>{item.main}</Text>
              {item.side && <Text style={styles.side}>{item.side}</Text>}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  empty: { textAlign: "center", color: theme.color.textMuted, marginTop: 24 },
  row: { flexDirection: "row", gap: 14, backgroundColor: theme.color.surface, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.color.borderAlt, padding: 14 },
  day: { width: 90, fontSize: 11, fontWeight: "700", color: theme.color.textMuted },
  main: { fontWeight: "600", color: theme.color.textPrimary },
  side: { fontSize: 12, color: theme.color.textSecondary, marginTop: 2 },
});
