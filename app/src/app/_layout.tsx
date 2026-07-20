import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_400Regular,
} from "@expo-google-fonts/fraunces";
import { Manrope_500Medium, Manrope_700Bold } from "@expo-google-fonts/manrope";
import { Stack } from "expo-router";
import { View } from "react-native";
import { colors } from "../lib/theme";
import { PlantProvider } from "../context/PlantContext";
import { useRegisterPushToken } from "../hooks/useRegisterPushToken";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
  });

  useRegisterPushToken();

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.sageBg }} />;
  }

  return (
    <PlantProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PlantProvider>
  );
}
