import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PickupNoticeView } from "@kampus/shared-types";
import { useChildren } from "@/lib/child-context";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/components/ScreenHeader";

const RELATIONS = ["Parent", "Family member", "Guardian", "Other"] as const;

export default function PickupScreen() {
  const { activeChild, activeChildId } = useChildren();
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<(typeof RELATIONS)[number] | null>(null);
  const [notice, setNotice] = useState<PickupNoticeView | null>(null);

  async function send() {
    if (!activeChildId || !relation || !name) return;
    const result = await api.pickup.send(activeChildId, name, relation);
    setNotice(result);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScreenHeader title="Pickup" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {!notice ? (
          <>
            <Text style={styles.label}>Who is picking up {activeChild?.name.split(" ")[0]}?</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" />

            <Text style={styles.label}>Relation</Text>
            <View style={styles.chipRow}>
              {RELATIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRelation(r)}
                  style={[styles.chip, relation === r && styles.chipActive]}
                >
                  <Text style={[styles.chipText, relation === r && styles.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submit} onPress={send} disabled={!name || !relation}>
              <Text style={styles.submitText}>Send pickup notice</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View>
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>One-time pickup code</Text>
              <Text style={styles.code}>{notice.code}</Text>
              <Text style={styles.codeHint}>Show this to the gate/Pickup Desk staff.</Text>
            </View>
            <View style={styles.steps}>
              <Step label="Notice sent to school" done />
              <Step label="Awaiting gate confirmation" done={notice.status === "CONFIRMED"} />
              <Step label={`${activeChild?.name.split(" ")[0]} released`} done={notice.status === "CONFIRMED"} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepDot, { backgroundColor: done ? theme.color.success : theme.color.textSecondary }]}>
        <Text style={styles.stepMark}>{done ? "✓" : "•"}</Text>
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  label: { fontSize: 13, fontWeight: "600", color: theme.color.textSecondary, marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: theme.color.borderAlt, borderRadius: theme.radius.chip, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: theme.color.surface },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.color.borderAlt, borderRadius: theme.radius.pill, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.color.surface },
  chipActive: { backgroundColor: theme.color.darkPill, borderColor: theme.color.darkPill },
  chipText: { fontSize: 13, color: theme.color.textSecondary },
  chipTextActive: { color: theme.brand.primary },
  submit: { marginTop: 24, backgroundColor: theme.color.darkPill, borderRadius: 100, paddingVertical: 14, alignItems: "center" },
  submitText: { color: theme.brand.primary, fontWeight: "700" },
  codeCard: { alignItems: "center", backgroundColor: theme.color.surface, borderRadius: theme.radius.cardLg, borderWidth: 1, borderColor: theme.color.borderAlt, padding: 24 },
  codeLabel: { fontSize: 12, color: theme.color.textMuted },
  code: { fontSize: 32, fontWeight: "700", letterSpacing: 4, marginTop: 8, color: theme.color.textPrimary },
  codeHint: { fontSize: 12, color: theme.color.textMuted, marginTop: 8 },
  steps: { marginTop: 24, gap: 14 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stepMark: { color: "white", fontSize: 12, fontWeight: "700" },
  stepLabel: { fontSize: 14, color: theme.color.textPrimary },
});
