import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "../lib/theme";

type Props = {
  date: string;
  decision: "water" | "hold" | "skip";
  reasoning: string;
};

const decisionMeta = {
  water: { label: "Water", icon: "water" as const, color: colors.water },
  hold: { label: "Wait", icon: "rainy" as const, color: colors.clay },
  skip: {
    label: "Skip",
    icon: "checkmark-circle" as const,
    color: colors.moss,
  },
};

export default function DecisionCard({ date, decision, reasoning }: Props) {
  const [expanded, setExpanded] = useState(false);
  const meta = decisionMeta[decision];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: meta.color }]}>
        <Ionicons name={meta.icon} size={28} color="#fff" />
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.label, { color: meta.color }]}>
            {meta.label}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        {expanded ? (
          <Text style={styles.reasoning}>{reasoning}</Text>
        ) : (
          <View style={styles.tapHintRow}>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            <Text style={styles.tapHint}>Why?</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    alignItems: "center",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  content: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontFamily: fonts.bodyBold, fontSize: 18 },
  date: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  tapHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  tapHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  reasoning: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.forest,
    lineHeight: 20,
    marginTop: 6,
  },
});
