import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  useFonts,
} from "@expo-google-fonts/fraunces";
import { Manrope_500Medium, Manrope_700Bold } from "@expo-google-fonts/manrope";
import { Stack } from "expo-router";
import { View } from "react-native";
import { colors } from "../lib/theme";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.sageBg }} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
