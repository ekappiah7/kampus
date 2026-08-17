import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { FeeLineItemView } from "@kampus/shared-types";
import { useChildren } from "@/lib/child-context";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";

type PaymentStage = "idle" | "selectMethod" | "processing" | "success";
const METHODS = [
  { key: "MOMO_MTN", label: "MTN Mobile Money" },
  { key: "MOMO_VODAFONE", label: "Vodafone Cash" },
  { key: "MOMO_AIRTELTIGO", label: "AirtelTigo Money" },
  { key: "CARD", label: "Debit/Credit Card" },
];

export default function FeesScreen() {
  const { activeChild, activeChildId, refresh: refreshChildren } = useChildren();
  const [items, setItems] = useState<FeeLineItemView[]>([]);
  const [stage, setStage] = useState<PaymentStage>("idle");

  function load() {
    if (activeChildId) api.fees.lineItems(activeChildId).then(setItems);
  }
  useEffect(load, [activeChildId]);

  async function pay(method: string) {
    if (!activeChildId || !activeChild) return;
    setStage("processing");
    await api.fees.pay(activeChildId, activeChild.feeBalance, method);
    setStage("success");
    load();
    refreshChildren();
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.title}>Fees</Text>
      {activeChild && (
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Outstanding balance · {activeChild.term}</Text>
          <Text style={[styles.balanceValue, { color: activeChild.feeBalance > 0 ? theme.color.danger : theme.color.success }]}>
            GH₵{activeChild.feeBalance}
          </Text>
          {activeChild.feeBalance > 0 && (
            <TouchableOpacity style={styles.payButton} onPress={() => setStage("selectMethod")}>
              <Text style={styles.payButtonText}>Pay now</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{item.label}</Text>
              {item.scholarshipNote && <Text style={styles.note}>{item.scholarshipNote}</Text>}
              {item.discountNote && <Text style={styles.note}>{item.discountNote}</Text>}
            </View>
            <Text
              style={[
                styles.status,
                item.status === "PAID" ? styles.statusPaid : item.status === "OVERDUE" ? styles.statusOverdue : styles.statusPending,
              ]}
            >
              GH₵{item.netAmount} · {item.status}
            </Text>
          </View>
        ))}
        {items.length === 0 && <Text style={{ color: theme.color.textMuted, textAlign: "center" }}>No fee items yet.</Text>}
      </ScrollView>

      <Modal visible={stage !== "idle"} transparent animationType="slide" onRequestClose={() => setStage("idle")}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {stage === "selectMethod" && (
              <>
                <Text style={styles.modalTitle}>Choose payment method</Text>
                {METHODS.map((m) => (
                  <TouchableOpacity key={m.key} style={styles.methodRow} onPress={() => pay(m.key)}>
                    <Text style={styles.methodLabel}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setStage("idle")}>
                  <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
            {stage === "processing" && <Text style={styles.modalTitle}>Processing payment…</Text>}
            {stage === "success" && (
              <>
                <Text style={styles.modalTitle}>Payment successful ✓</Text>
                <TouchableOpacity style={styles.payButton} onPress={() => setStage("idle")}>
                  <Text style={styles.payButtonText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  title: { fontSize: 19, fontWeight: "700", paddingHorizontal: 16, paddingTop: 12, color: theme.color.textPrimary },
  balanceCard: { margin: 16, padding: 18, backgroundColor: theme.color.surface, borderRadius: theme.radius.cardLg, borderWidth: 1, borderColor: theme.color.borderAlt },
  balanceLabel: { fontSize: 12, color: theme.color.textMuted },
  balanceValue: { fontSize: 28, fontWeight: "700", marginTop: 4 },
  payButton: { marginTop: 12, backgroundColor: theme.color.darkPill, borderRadius: 100, paddingVertical: 12, alignItems: "center" },
  payButtonText: { color: theme.brand.primary, fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: theme.color.surface, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.color.borderAlt, padding: 14 },
  label: { fontWeight: "600", color: theme.color.textPrimary },
  note: { fontSize: 11, color: theme.color.textMuted, marginTop: 2 },
  status: { fontSize: 12, fontWeight: "700" },
  statusPaid: { color: theme.color.success },
  statusPending: { color: theme.brand.pendingLabel },
  statusOverdue: { color: theme.color.danger },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: theme.color.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 10 },
  modalTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  methodRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.color.borderSoft },
  methodLabel: { fontSize: 15, fontWeight: "500" },
  cancel: { textAlign: "center", marginTop: 12, color: theme.color.textMuted },
});
