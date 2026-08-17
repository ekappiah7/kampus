import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NotificationView } from "@kampus/shared-types";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationView[]>([]);

  useEffect(() => {
    api.notifications.list().then(setItems);
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScreenHeader title="Notifications" />
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={items}
        keyExtractor={(n) => n.id}
        ListEmptyComponent={<Text style={styles.empty}>You&apos;re all caught up.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.row, !item.read && styles.unread]}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  empty: { textAlign: "center", color: theme.color.textMuted, marginTop: 24 },
  row: { backgroundColor: theme.color.surface, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.color.borderAlt, padding: 14 },
  unread: { borderColor: theme.brand.primary },
  itemTitle: { fontWeight: "700", color: theme.color.textPrimary },
  body: { fontSize: 13, color: theme.color.textSecondary, marginTop: 2 },
  time: { fontSize: 11, color: theme.color.textMuted, marginTop: 6 },
});
