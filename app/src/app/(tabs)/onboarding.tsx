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
import { geocodeCity } from "../../lib/geocode";
import { Ionicons } from "@expo/vector-icons";

type Profile = {
  species: string;
  watering_notes: string;
  ideal_moisture_min: number;
  ideal_moisture_max: number;
};
type Geo = { lat: number; lon: number; displayName: string };

export default function PlantScreen() {
  const { plant, loading, refetch } = usePlant();
  const [plantName, setPlantName] = useState("");
  const [location, setLocation] = useState("");
  const [nameError, setNameError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [proposedProfile, setProposedProfile] = useState<Profile | null>(null);
  const [resolvedGeo, setResolvedGeo] = useState<Geo | null>(null);
  const [clarifyQuestion, setClarifyQuestion] = useState<string | null>(null);
  const [clarifyAnswer, setClarifyAnswer] = useState("");
  const [apiError, setApiError] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const runQuery = async (nameQuery: string, geo: Geo) => {
    setFetching(true);
    setApiError("");
    setClarifyQuestion(null);
    setProposedProfile(null);

    const result = await getPlantProfile(nameQuery, geo.displayName);

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

  const handleSubmit = async () => {
    let hasError = false;
    if (!plantName.trim()) {
      setNameError("Enter a plant name first");
      hasError = true;
    }
    if (!location.trim()) {
      setLocationError("Enter your city so we can factor in local climate");
      hasError = true;
    }
    if (hasError) return;

    setNameError("");
    setLocationError("");
    setFetching(true);

    const geo = await geocodeCity(location.trim());
    if (!geo) {
      setLocationError(
        'City not found — try a different spelling, e.g. "Nagpur"',
      );
      setFetching(false);
      return;
    }

    setResolvedGeo(geo);
    await runQuery(plantName.trim(), geo);
  };

  const handleClarifySubmit = () => {
    if (!clarifyAnswer.trim() || !resolvedGeo) return;
    runQuery(`${plantName.trim()} — ${clarifyAnswer.trim()}`, resolvedGeo);
  };

  const handleConfirm = async () => {
    if (!proposedProfile || !resolvedGeo) return;
    setSaving(true);
    try {
      await insertPlant({
        plant_id: "plant_1",
        name: plantName.trim(),
        species: proposedProfile.species,
        watering_notes: proposedProfile.watering_notes,
        ideal_moisture_min: proposedProfile.ideal_moisture_min,
        ideal_moisture_max: proposedProfile.ideal_moisture_max,
        latitude: resolvedGeo.lat,
        longitude: resolvedGeo.lon,
        location_name: resolvedGeo.displayName,
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: spacing.lg }}
      >
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="leaf" size={32} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{plant.name}</Text>
            {plant.species && (
              <Text style={styles.subtitle}>{plant.species}</Text>
            )}
          </View>
        </View>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Ionicons name="water-outline" size={22} color={colors.water} />
            <Text style={styles.chipValue}>
              {plant.ideal_moisture_min}–{plant.ideal_moisture_max}%
            </Text>
            <Text style={styles.chipLabel}>Ideal range</Text>
          </View>
          {plant.location_name && (
            <View style={styles.chip}>
              <Ionicons name="location-outline" size={22} color={colors.moss} />
              <Text style={styles.chipValue} numberOfLines={1}>
                {plant.location_name.split(",")[0]}
              </Text>
              <Text style={styles.chipLabel}>Location</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.notesCard}
          onPress={() => setShowNotes(!showNotes)}
          activeOpacity={0.7}
        >
          <View style={styles.notesHeader}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.forest}
            />
            <Text style={styles.notesTitle}>Care notes</Text>
            <Ionicons
              name={showNotes ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </View>
          {showNotes && (
            <Text style={styles.notesText}>
              {plant.watering_notes ?? "None yet"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
            Tell us its name and location — we'll figure out the rest
          </Text>

          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            value={plantName}
            onChangeText={(t) => {
              setPlantName(t);
              if (nameError) setNameError("");
            }}
            placeholder="Plant name, e.g. Snake Plant"
            placeholderTextColor={colors.textMuted}
            editable={!fetching}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

          <TextInput
            style={[styles.input, locationError ? styles.inputError : null]}
            value={location}
            onChangeText={(t) => {
              setLocation(t);
              if (locationError) setLocationError("");
            }}
            placeholder="Your city, e.g. Nagpur"
            placeholderTextColor={colors.textMuted}
            editable={!fetching}
          />
          {locationError ? (
            <Text style={styles.errorText}>{locationError}</Text>
          ) : null}

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
              <Text style={styles.profileRow}>
                <Text style={styles.profileLabel}>Location </Text>
                {resolvedGeo?.displayName}
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
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.moss,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  chipRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  chip: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
  },
  chipValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.forest,
    marginTop: 6,
  },
  chipLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  notesCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  notesHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  notesTitle: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.forest,
  },
  notesText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.forest,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
