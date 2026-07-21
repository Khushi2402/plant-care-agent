const EDGE_FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/onboard-plant`;
const APP_SECRET = process.env.EXPO_PUBLIC_APP_SECRET!;

export type OnboardResult =
  | { status: 'ok'; species: string; watering_notes: string; ideal_moisture_min: number; ideal_moisture_max: number }
  | { status: 'clarify'; question: string }
  | { status: 'error'; message: string };

export async function getPlantProfile(plantName: string, locationName: string): Promise<OnboardResult> {
  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-secret': APP_SECRET,
      },
      body: JSON.stringify({ plant_name: plantName, location_name: locationName }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { status: 'error', message: data.error ?? 'Something went wrong. Please try again.' };
    }

    return data;
  } catch (e) {
    console.error('Onboarding agent call failed', e);
    return { status: 'error', message: 'Could not reach the server. Check your connection and try again.' };
  }
}