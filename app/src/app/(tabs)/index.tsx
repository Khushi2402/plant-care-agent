import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MoistureGauge from "../../components/MoistureGauge";
import DecisionCard from "../../components/DecisionCard";
import MoistureChart from "../../components/MoistureChart";
import { colors, fonts, spacing, radius } from "../../lib/theme";
import { usePlant } from "../../context/PlantContext";
import { getDailyMoisture, DailyMoisture } from "../../lib/supabase-queries";

const mockDecisions: {
  id: number;
  date: string;
  decision: "water" | "hold" | "skip";
  reasoning: string;
}[] = [
  {
    id: 1,
    date: "Jul 18",
    decision: "hold",
    reasoning: "Moisture at 45%, still within range. Rain expected tomorrow.",
  },
  {
    id: 2,
    date: "Jul 17",
    decision: "water",
    reasoning: "Moisture dropped to 22%, below ideal range. No rain forecast.",
  },
];

export default function Dashboard() {
  const { plant, loading, refetch } = usePlant();
  const [history, setHistory] = useState<DailyMoisture[]>([]);
  const [showData, setShowData] = useState(false);

  // Refetch plant every time this tab comes into focus —
  // fixes staleness after saving a plant on the other tab
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleShowData = () => {
    if (plant)
      getDailyMoisture(plant.plant_id).then(setHistory).catch(console.error);
    setShowData(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.water} />
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No plant yet</Text>
        <Text style={styles.emptyBody}>
          Head to the "Your Plant" tab to add one.
        </Text>
      </View>
    );
  }

  if (!showData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>🌱 {plant.name} added!</Text>
        <Text style={styles.emptyBody}>
          Ready to start tracking its moisture.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleShowData}>
          <Text style={styles.buttonText}>View Moisture Data</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const latestPct = history.length > 0 ? history[history.length - 1].avgPct : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <Text style={styles.plantName}>{plant.name}</Text>
      {plant.species && <Text style={styles.species}>{plant.species}</Text>}

      <View style={styles.gaugeCard}>
        <MoistureGauge
          pct={latestPct}
          min={plant.ideal_moisture_min ?? 20}
          max={plant.ideal_moisture_max ?? 60}
        />
      </View>

      <Text style={styles.sectionTitle}>Moisture, last 7 days</Text>
      <View style={styles.chartCard}>
        <MoistureChart data={history} />
      </View>

      <Text style={styles.sectionTitle}>Recent decisions</Text>
      {mockDecisions.map((d) => (
        <DecisionCard
          key={d.id}
          date={d.date}
          decision={d.decision}
          reasoning={d.reasoning}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sageBg },
  centered: {
    flex: 1,
    backgroundColor: colors.sageBg,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.forest,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.water,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  buttonText: { fontFamily: fonts.bodyBold, color: "#fff", fontSize: 15 },
  plantName: { fontFamily: fonts.display, fontSize: 28, color: colors.forest },
  species: {
    fontFamily: fonts.displayLight,
    fontSize: 15,
    color: colors.textMuted,
    fontStyle: "italic",
    marginBottom: spacing.lg,
  },
  gaugeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.forest,
    marginBottom: spacing.md,
  },
});
