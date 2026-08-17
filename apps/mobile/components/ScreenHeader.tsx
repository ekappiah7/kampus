import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "@/lib/theme";

export function ScreenHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.borderAlt,
    backgroundColor: theme.color.surface,
  },
  back: { width: 32, alignItems: "center" },
  backText: { fontSize: 24, color: theme.color.textPrimary },
  title: { fontSize: 19, fontWeight: "700", color: theme.color.textPrimary },
});
