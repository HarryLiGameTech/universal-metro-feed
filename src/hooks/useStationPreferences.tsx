import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { readFavorites, readLastStation, sameStation, saveFavorites, saveLastStation, type StationReference } from "../lib/station-preferences";

interface StationPreferences {
  lastStation: StationReference | null;
  favorites: readonly StationReference[];
  message: string;
  rememberStation(station: StationReference): void;
  toggleFavorite(station: StationReference): void;
}

const PreferencesContext = createContext<StationPreferences | null>(null);

export function StationPreferencesProvider({ children }: { children: ReactNode }) {
  const [lastStation, setLastStation] = useState(readLastStation);
  const [favorites, setFavorites] = useState(readFavorites);
  const [message, setMessage] = useState("");

  const rememberStation = useCallback((station: StationReference) => {
    saveLastStation(station);
    setLastStation((current) => current && sameStation(current, station) ? current : station);
  }, []);

  function toggleFavorite(station: StationReference) {
    const next = favorites.some((item) => sameStation(item, station))
      ? favorites.filter((item) => !sameStation(item, station))
      : [...favorites, station];
    const result = saveFavorites(next);
    if (result === "full") {
      setMessage("Your saved favorites are full. Remove a favorite before adding another.");
      return;
    }
    setFavorites(next);
    setMessage(result === "unavailable"
      ? "Favorites work for this visit, but could not be saved on this device. Check your browser’s cookie settings."
      : "");
  }

  return <PreferencesContext.Provider value={{ lastStation, favorites, message, rememberStation, toggleFavorite }}>
    {children}
  </PreferencesContext.Provider>;
}

export function useStationPreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences) throw new Error("Station preferences are not available.");
  return preferences;
}
