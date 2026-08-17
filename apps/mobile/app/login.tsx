import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await login(phone, password);
    } catch {
      setError("Invalid phone or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Aspire Royal Academy</Text>
        <Text style={styles.subtitle}>Sign in to the Parent App</Text>

        <Text style={styles.label}>Phone number</Text>
        <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="024 883 4000" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? "Signing in…" : "Sign in"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg, justifyContent: "center", padding: 24 },
  card: { backgroundColor: theme.color.surface, borderRadius: theme.radius.cardLg, padding: 24, borderWidth: 1, borderColor: theme.color.border },
  title: { fontSize: 22, fontWeight: "700", color: theme.color.textPrimary },
  subtitle: { fontSize: 14, color: theme.color.textMuted, marginTop: 4, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: theme.color.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: theme.color.borderAlt, borderRadius: theme.radius.chip, paddingHorizontal: 14, paddingVertical: 10 },
  error: { color: theme.color.danger, marginTop: 12, fontSize: 13 },
  button: { backgroundColor: theme.color.darkPill, borderRadius: theme.radius.pill, paddingVertical: 14, marginTop: 24, alignItems: "center" },
  buttonText: { color: theme.brand.primary, fontWeight: "700" },
});
