import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { getPlant, Plant } from "../lib/supabase-queries";

type PlantContextType = {
  plant: Plant | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const PlantContext = createContext<PlantContextType | undefined>(undefined);

export function PlantProvider({ children }: { children: ReactNode }) {
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

  return (
    <PlantContext.Provider value={{ plant, loading, refetch }}>
      {children}
    </PlantContext.Provider>
  );
}

export function usePlant() {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error("usePlant must be used within PlantProvider");
  return ctx;
}
