import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import DecisionCard from "../../components/DecisionCard";
import { colors, fonts, spacing } from "../../lib/theme";
import { usePlant } from "../../context/PlantContext";
import { getRecentDecisions, Decision } from "../../lib/supabase-queries";

export default function NotificationsScreen() {
  const { plant } = usePlant();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (plant) {
      getRecentDecisions(plant.plant_id, 10)
        .then(setDecisions)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [plant]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator
          color={colors.water}
          style={{ marginTop: spacing.xl }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {decisions.length === 0 ? (
            <Text style={styles.emptyText}>No notifications yet.</Text>
          ) : (
            decisions.map((d) => (
              <DecisionCard
                key={d.id}
                date={new Date(d.created_at).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                })}
                decision={d.decision}
                reasoning={d.reasoning}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sageBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.forest,
  },
  emptyText: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
