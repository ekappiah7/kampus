import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useChildren } from "@/lib/child-context";
import { theme } from "@/lib/theme";

export function ChildSwitcher() {
  const { children: kids, activeChildId, setActiveChildId } = useChildren();
  if (kids.length <= 1) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wrap} contentContainerStyle={{ gap: 10 }}>
      {kids.map((c) => {
        const active = c.id === activeChildId;
        return (
          <TouchableOpacity key={c.id} onPress={() => setActiveChildId(c.id)} style={[styles.chip, active && styles.chipActive]}>
            <View style={[styles.avatar, { backgroundColor: c.avatarColor }]}>
              <Text style={styles.avatarText}>{c.avatarInitials}</Text>
            </View>
            <Text style={[styles.name, active && styles.nameActive]}>{c.name.split(" ")[0]}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginBottom: 12 },
  chip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.color.borderAlt, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: theme.color.surface },
  chipActive: { borderColor: theme.color.textPrimary, backgroundColor: theme.color.textPrimary },
  avatar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 10, fontWeight: "700" },
  name: { fontSize: 13, fontWeight: "600", color: theme.color.textSecondary },
  nameActive: { color: theme.brand.primary },
});
