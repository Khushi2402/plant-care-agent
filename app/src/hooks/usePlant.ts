import { useCallback, useEffect, useState } from "react";
import { getPlant, Plant } from "../lib/supabase-queries";

export function usePlant() {
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setPlant(await getPlant());
    } catch (e) {
      console.error("Failed to fetch plant", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { plant, loading, refetch };
}
