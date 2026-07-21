import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { usePlant } from "../../context/PlantContext";
import { colors, fonts } from "../../lib/theme";

export default function TabLayout() {
  const { plant } = usePlant();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.sageBg },
        headerTitleStyle: {
          fontFamily: fonts.display,
          color: colors.forest,
          fontSize: 20,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.moss,
          height: 60,
        },
        tabBarActiveTintColor: colors.water,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.body, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{
          title: plant ? "Your Plant" : "Add Plant",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={plant ? "flower-outline" : "add-circle-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
