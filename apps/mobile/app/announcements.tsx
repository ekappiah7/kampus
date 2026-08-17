import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/components/ScreenHeader";

interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
}

export default function AnnouncementsScreen() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    api.students.announcements().then(setItems);
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScreenHeader title="Announcements" />
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={items}
        keyExtractor={(a) => a.id}
        ListEmptyComponent={<Text style={styles.empty}>No announcements yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
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
  itemTitle: { fontWeight: "700", color: theme.color.textPrimary },
  body: { fontSize: 13, color: theme.color.textSecondary, marginTop: 4 },
  date: { fontSize: 11, color: theme.color.textMuted, marginTop: 8 },
});
