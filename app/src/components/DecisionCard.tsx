import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing } from "../lib/theme";

type Props = {
  date: string;
  decision: "water" | "hold" | "skip";
  reasoning: string;
};

const decisionMeta = {
  water: { label: "Watered", color: colors.water },
  hold: { label: "Held off", color: colors.clay },
  skip: { label: "Skipped", color: colors.moss },
};

export default function DecisionCard({ date, decision, reasoning }: Props) {
  const meta = decisionMeta[decision];
  return (
    <View style={styles.card}>
      <View style={[styles.bar, { backgroundColor: meta.color }]} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.label, { color: meta.color }]}>
            {meta.label}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <Text style={styles.reasoning}>{reasoning}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  bar: { width: 5 },
  content: { flex: 1, padding: spacing.md },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { fontFamily: fonts.bodyBold, fontSize: 14 },
  date: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  reasoning: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.forest,
    lineHeight: 20,
  },
});
