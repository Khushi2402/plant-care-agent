import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DecisionCard from "../../components/DecisionCard";
import MoistureChart from "../../components/MoistureChart";
import MoistureGauge from "../../components/MoistureGauge";
import { usePlant } from "../../hooks/usePlant";
import { DailyMoisture, getDailyMoisture } from "../../lib/supabase-queries";
import { colors, fonts, radius, spacing } from "../../lib/theme";

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
  const { plant, loading } = usePlant();
  const [history, setHistory] = useState<DailyMoisture[]>([]);

  useEffect(() => {
    if (plant)
      getDailyMoisture(plant.plant_id).then(setHistory).catch(console.error);
  }, [plant]);

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
          Head to the "Add Plant" tab to get started.
        </Text>
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
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
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
