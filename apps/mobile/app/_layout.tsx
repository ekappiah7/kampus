import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ChildProvider } from "@/lib/child-context";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inLogin = segments[0] === "login";
    if (!user && !inLogin) router.replace("/login");
    if (user && inLogin) router.replace("/(tabs)");
  }, [user, loading, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ChildProvider>
        <AuthGate>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthGate>
      </ChildProvider>
    </AuthProvider>
  );
}
