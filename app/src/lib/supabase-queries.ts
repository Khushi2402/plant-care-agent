import { supabase } from "./supabase";

export type Plant = {
  plant_id: string;
  name: string;
  species: string | null;
  watering_notes: string | null;
  ideal_moisture_min: number | null;
  ideal_moisture_max: number | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
};

export async function getPlant(plantId = "plant_1"): Promise<Plant | null> {
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("plant_id", plantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type DailyMoisture = { date: string; avgPct: number };

export async function getDailyMoisture(
  plantId = "plant_1",
  days = 7,
): Promise<DailyMoisture[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("readings")
    .select("created_at, moisture_pct")
    .eq("plant_id", plantId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;

  const byDay: Record<string, number[]> = {};
  (data ?? []).forEach((r) => {
    if (r.moisture_pct == null) return;
    const day = new Date(r.created_at).toISOString().slice(0, 10);
    byDay[day] = byDay[day] || [];
    byDay[day].push(r.moisture_pct);
  });

  return Object.entries(byDay).map(([date, values]) => ({
    date,
    avgPct: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
  }));
}

export async function insertPlant(plant: {
  plant_id: string;
  name: string;
  species: string;
  watering_notes: string;
  ideal_moisture_min: number;
  ideal_moisture_max: number;
  latitude: number;
  longitude: number;
  location_name: string;
}) {
  const { error } = await supabase.from('plants').insert(plant);
  if (error) throw error;
}

export async function registerDeviceToken(token: string) {
  const { error } = await supabase
    .from('device_tokens')
    .upsert({ expo_push_token: token }, { onConflict: 'expo_push_token' });
  if (error) throw error;
}

export type Decision = {
  id: number;
  created_at: string;
  decision: 'water' | 'hold' | 'skip';
  reasoning: string;
};

export async function getRecentDecisions(plantId = 'plant_1', limit = 5): Promise<Decision[]> {
  const { data, error } = await supabase
    .from('decisions')
    .select('id, created_at, decision, reasoning')
    .eq('plant_id', plantId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}