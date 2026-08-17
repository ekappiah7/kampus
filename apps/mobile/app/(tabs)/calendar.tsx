import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";

interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string | null;
}

export default function CalendarScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    api.events.list().then((r) => setEvents(r as EventItem[]));
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.title}>Calendar</Text>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={events}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={<Text style={styles.empty}>No upcoming events.</Text>}
        renderItem={({ item }) => {
          const d = new Date(item.date);
          return (
            <View style={styles.row}>
              <View style={styles.dateBox}>
                <Text style={styles.month}>{d.toLocaleString("en", { month: "short" }).toUpperCase()}</Text>
                <Text style={styles.day}>{d.getDate()}</Text>
              </View>
              <View>
                <Text style={styles.eventTitle}>{item.title}</Text>
                {item.time && <Text style={styles.eventTime}>{item.time}</Text>}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  title: { fontSize: 19, fontWeight: "700", paddingHorizontal: 16, paddingTop: 12, color: theme.color.textPrimary },
  empty: { textAlign: "center", color: theme.color.textMuted, marginTop: 24 },
  row: { flexDirection: "row", gap: 14, backgroundColor: theme.color.surface, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.color.borderAlt, padding: 14 },
  dateBox: { alignItems: "center", width: 44 },
  month: { fontSize: 11, fontWeight: "700", color: theme.brand.link },
  day: { fontSize: 20, fontWeight: "700", color: theme.color.textPrimary },
  eventTitle: { fontWeight: "600", color: theme.color.textPrimary },
  eventTime: { fontSize: 12, color: theme.color.textMuted, marginTop: 2 },
});
