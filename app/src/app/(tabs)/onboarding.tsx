import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { colors, fonts, radius, spacing } from "../../lib/theme";
import { usePlant } from "../../context/PlantContext";
import { insertPlant } from "../../lib/supabase-queries";
import { getPlantProfile } from "../../lib/onboarding-agent";

type Profile = {
  species: string;
  watering_notes: string;
  ideal_moisture_min: number;
  ideal_moisture_max: number;
};

export default function PlantScreen() {
  const { plant, loading, refetch } = usePlant();
  const [plantName, setPlantName] = useState("");
  const [nameError, setNameError] = useState("");
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [proposedProfile, setProposedProfile] = useState<Profile | null>(null);
  const [clarifyQuestion, setClarifyQuestion] = useState<string | null>(null);
  const [clarifyAnswer, setClarifyAnswer] = useState("");
  const [apiError, setApiError] = useState("");

  const runQuery = async (query: string) => {
    setFetching(true);
    setApiError("");
    setClarifyQuestion(null);
    setProposedProfile(null);

    const result = await getPlantProfile(query);

    if (result.status === "ok") {
      setProposedProfile({
        species: result.species,
        watering_notes: result.watering_notes,
        ideal_moisture_min: result.ideal_moisture_min,
        ideal_moisture_max: result.ideal_moisture_max,
      });
    } else if (result.status === "clarify") {
      setClarifyQuestion(result.question);
    } else {
      setApiError(result.message);
    }

    setFetching(false);
  };

  const handleSubmit = () => {
    if (!plantName.trim()) {
      setNameError("Enter a plant name first");
      return;
    }
    setNameError("");
    runQuery(plantName.trim());
  };

  const handleClarifySubmit = () => {
    if (!clarifyAnswer.trim()) return;
    runQuery(`${plantName.trim()} — ${clarifyAnswer.trim()}`);
  };

  const handleConfirm = async () => {
    if (!proposedProfile) return;
    setSaving(true);
    try {
      await insertPlant({
        plant_id: "plant_1",
        name: plantName.trim(),
        species: proposedProfile.species,
        watering_notes: proposedProfile.watering_notes,
        ideal_moisture_min: proposedProfile.ideal_moisture_min,
        ideal_moisture_max: proposedProfile.ideal_moisture_max,
      });
      await refetch();
    } catch (e) {
      Alert.alert(
        "Couldn't save",
        "Something went wrong saving your plant. Please try again.",
      );
      console.error(e);
    } finally {
      setSaving(false);
    }
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.sageBg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Add a plant</Text>
          <Text style={styles.subtitle}>
            Tell us its name — we'll figure out the rest
          </Text>

          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            value={plantName}
            onChangeText={(t) => {
              setPlantName(t);
              if (nameError) setNameError("");
            }}
            placeholder="e.g. Snake Plant"
            placeholderTextColor={colors.textMuted}
            editable={!fetching}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

          <TouchableOpacity
            style={[styles.button, fetching && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={fetching}
          >
            {fetching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Get profile</Text>
            )}
          </TouchableOpacity>

          {apiError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorCardText}>{apiError}</Text>
            </View>
          ) : null}

          {clarifyQuestion && (
            <View style={styles.profileCard}>
              <Text style={styles.profileHeader}>Just to be sure</Text>
              <Text style={styles.profileRow}>{clarifyQuestion}</Text>
              <TextInput
                style={styles.input}
                value={clarifyAnswer}
                onChangeText={setClarifyAnswer}
                placeholder="Your answer"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleClarifySubmit}
                disabled={fetching}
              >
                {fetching ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

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
                style={[
                  styles.button,
                  { marginTop: spacing.md },
                  saving && { opacity: 0.6 },
                ]}
                onPress={handleConfirm}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Confirm & save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.sageBg,
    padding: spacing.lg,
  },
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
    marginBottom: spacing.sm,
  },
  inputError: { borderColor: colors.clay },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.clay,
    marginBottom: spacing.md,
  },
  errorCard: {
    backgroundColor: "#F7E6DC",
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.clay,
  },
  errorCardText: { fontFamily: fonts.body, fontSize: 14, color: colors.clay },
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
