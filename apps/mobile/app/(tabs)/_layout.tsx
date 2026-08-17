import { Tabs } from "expo-router";
import { Text } from "react-native";
import { theme } from "@/lib/theme";

const TAB_ICON: Record<string, string> = {
  index: "🏠",
  homework: "📝",
  fees: "💳",
  calendar: "📅",
  more: "⋯",
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.brand.link,
        tabBarInactiveTintColor: theme.color.textMuted,
        tabBarStyle: { backgroundColor: theme.color.surface, borderTopColor: theme.color.borderAlt },
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICON[route.name]}</Text>,
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="homework" options={{ title: "Homework" }} />
      <Tabs.Screen name="fees" options={{ title: "Fees" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}
