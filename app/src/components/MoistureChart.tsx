import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { colors, fonts } from "../lib/theme";

type Props = { data: { date: string; avgPct: number }[] };

export default function MoistureChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Not enough data yet — check back in a day or two.
        </Text>
      </View>
    );
  }

  return (
    <LineChart
      data={{
        labels: data.map((d) => d.date.slice(5)),
        datasets: [{ data: data.map((d) => d.avgPct) }],
      }}
      width={Dimensions.get("window").width - 48}
      height={180}
      yAxisSuffix="%"
      chartConfig={{
        backgroundColor: colors.card,
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(61, 126, 166, ${opacity})`,
        labelColor: () => colors.textMuted,
        propsForDots: { r: "4", strokeWidth: "2", stroke: colors.water },
      }}
      bezier
      style={{ borderRadius: 16 }}
    />
  );
}

const styles = StyleSheet.create({
  empty: { padding: 20, alignItems: "center" },
  emptyText: { fontFamily: fonts.body, color: colors.textMuted },
});
