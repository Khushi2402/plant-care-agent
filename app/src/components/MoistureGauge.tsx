import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius } from "../lib/theme";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  pct: number; // current moisture 0-100
  min: number; // ideal range lower bound
  max: number; // ideal range upper bound
};

export default function MoistureGauge({ pct, min, max }: Props) {
  const inRange = pct >= min && pct <= max;
  const fillColor = inRange ? colors.water : colors.clay;

  return (
    <View style={styles.wrap}>
      <View style={styles.capsule}>
        <View
          style={[
            styles.fill,
            { height: `${pct}%`, backgroundColor: fillColor },
          ]}
        />
      </View>
      <View style={styles.readout}>
        <Text style={styles.pctText}>{pct}%</Text>
        <View style={styles.statusRow}>
          <Ionicons
            name={inRange ? "checkmark-circle" : "alert-circle"}
            size={20}
            color={fillColor}
          />
          <Text style={[styles.statusText, { color: fillColor }]}>
            {inRange ? "Good" : pct < min ? "Low" : "High"}
          </Text>
        </View>
        <Text style={styles.rangeText}>
          Ideal range: {min}–{max}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 20 },
  capsule: {
    width: 56,
    height: 160,
    borderRadius: radius.pill,
    backgroundColor: "#DCE3D6",
    overflow: "hidden",
    justifyContent: "flex-end",
    borderWidth: 2,
    borderColor: colors.moss,
  },
  fill: {
    width: "100%",
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  readout: { flex: 1 },
  pctText: { fontFamily: fonts.display, fontSize: 36, color: colors.forest },
  statusText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.forest,
    marginTop: 2,
  },
  rangeText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
});
