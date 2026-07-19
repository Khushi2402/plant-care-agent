import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { usePlant } from "../../hooks/usePlant";
import { colors, fonts, radius, spacing } from "../../lib/theme";

export default function PlantScreen() {
  const { plant, loading, refetch } = usePlant();
  const [plantName, setPlantName] = useState("");
  const [proposedProfile, setProposedProfile] = useState<null | {
    species: string;
    watering_notes: string;
    ideal_moisture_min: number;
    ideal_moisture_max: number;
  }>(null);

  const handleSubmit = () => {
    // Mock response — real onboarding agent call comes next
    setProposedProfile({
      species: "Epipremnum aureum",
      watering_notes: "Let soil dry out between waterings; avoid soggy roots",
      ideal_moisture_min: 20,
      ideal_moisture_max: 45,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.water} />
      </View>
    );
  }

  if (plant) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{plant.name}</Text>
        {plant.species && <Text style={styles.subtitle}>{plant.species}</Text>}
        <View style={styles.profileCard}>
          <Text style={styles.profileRow}>
            <Text style={styles.profileLabel}>Notes </Text>
            {plant.watering_notes ?? "None yet"}
          </Text>
          <Text style={styles.profileRow}>
            <Text style={styles.profileLabel}>Ideal moisture </Text>
            {plant.ideal_moisture_min}%–{plant.ideal_moisture_max}%
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a plant</Text>
      <Text style={styles.subtitle}>
        Tell us its name — we'll figure out the rest
      </Text>

      <TextInput
        style={styles.input}
        value={plantName}
        onChangeText={setPlantName}
        placeholder="e.g. Money Plant"
        placeholderTextColor={colors.textMuted}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Get profile</Text>
      </TouchableOpacity>

      {proposedProfile && (
        <View style={styles.profileCard}>
          <Text style={styles.profileHeader}>Proposed profile</Text>
          <Text style={styles.profileRow}>
            <Text style={styles.profileLabel}>Species </Text>
            {proposedProfile.species}
          </Text>
          <Text style={styles.profileRow}>
            <Text style={styles.profileLabel}>Notes </Text>
            {proposedProfile.watering_notes}
          </Text>
          <Text style={styles.profileRow}>
            <Text style={styles.profileLabel}>Ideal moisture </Text>
            {proposedProfile.ideal_moisture_min}%–
            {proposedProfile.ideal_moisture_max}%
          </Text>
          <TouchableOpacity
            style={[styles.button, { marginTop: spacing.md }]}
            onPress={refetch}
          >
            <Text style={styles.buttonText}>Confirm & save</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sageBg, padding: spacing.lg },
  centered: {
    flex: 1,
    backgroundColor: colors.sageBg,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.forest },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  input: {
    fontFamily: fonts.body,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.forest,
    borderWidth: 1,
    borderColor: colors.moss,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.water,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { fontFamily: fonts.bodyBold, color: "#fff", fontSize: 15 },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  profileHeader: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.forest,
    marginBottom: spacing.md,
  },
  profileLabel: { fontFamily: fonts.bodyBold, color: colors.forest },
  profileRow: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.forest,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
});
