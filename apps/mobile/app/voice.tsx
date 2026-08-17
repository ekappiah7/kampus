import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/components/ScreenHeader";

const CATEGORIES = [
  { key: "SUGGESTION", label: "Suggestion" },
  { key: "COMPLAINT", label: "Complaint" },
  { key: "HONOUR_A_TEACHER", label: "Honour a Teacher" },
  { key: "GENERAL", label: "General" },
] as const;

export default function VoiceScreen() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["key"] | null>(null);
  const [aboutStaffName, setAboutStaffName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const showStaffField = category === "HONOUR_A_TEACHER" || category === "COMPLAINT";

  async function submit() {
    if (!category || !message) return;
    await api.voice.submit(category, message, showStaffField ? aboutStaffName : undefined);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ScreenHeader title="Parent Voice" />
        <View style={styles.success}>
          <Text style={styles.successTitle}>Thank you ✓</Text>
          <Text style={styles.successBody}>Your submission has been sent to the school. Admin may follow up with a response.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScreenHeader title="Parent Voice" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c.key} onPress={() => setCategory(c.key)} style={[styles.chip, category === c.key && styles.chipActive]}>
              <Text style={[styles.chipText, category === c.key && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {showStaffField && (
          <>
            <Text style={styles.label}>Staff member (optional)</Text>
            <TextInput style={styles.input} value={aboutStaffName} onChangeText={setAboutStaffName} placeholder="e.g. Mrs. Abigail Bentil" />
          </>
        )}

        <Text style={styles.label}>Message</Text>
        <TextInput style={[styles.input, { height: 120 }]} value={message} onChangeText={setMessage} multiline placeholder="Tell us more…" />

        <TouchableOpacity style={styles.submit} onPress={submit} disabled={!category || !message}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  label: { fontSize: 13, fontWeight: "600", color: theme.color.textSecondary, marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: theme.color.borderAlt, borderRadius: theme.radius.chip, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: theme.color.surface, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.color.borderAlt, borderRadius: theme.radius.pill, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.color.surface },
  chipActive: { backgroundColor: theme.color.darkPill, borderColor: theme.color.darkPill },
  chipText: { fontSize: 13, color: theme.color.textSecondary },
  chipTextActive: { color: theme.brand.primary },
  submit: { marginTop: 24, backgroundColor: theme.color.darkPill, borderRadius: 100, paddingVertical: 14, alignItems: "center" },
  submitText: { color: theme.brand.primary, fontWeight: "700" },
  success: { padding: 24, alignItems: "center", marginTop: 40 },
  successTitle: { fontSize: 20, fontWeight: "700", color: theme.color.success },
  successBody: { textAlign: "center", color: theme.color.textSecondary, marginTop: 8 },
});
