export async function geocodeCity(city: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );
  const data = await res.json();
  const first = data.results?.[0];
  if (!first) return null;
  return {
    lat: first.latitude,
    lon: first.longitude,
    displayName: `${first.name}, ${first.admin1 ?? ''} ${first.country ?? ''}`.trim(),
  };
}