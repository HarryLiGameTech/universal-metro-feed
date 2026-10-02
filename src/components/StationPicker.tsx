import { useMemo, useRef, useState } from "react";
import { Search, Star, X } from "lucide-react";
import { useCatalog } from "../providers/catalog-context";
import { useStationPreferences } from "../hooks/useStationPreferences";
import { searchStations } from "../lib/station-search";
import type { Station } from "../types";

export function StationPicker({ idPrefix, station, onStationChange }: {
  idPrefix: string;
  station: Station;
  onStationChange(stationId: string): void;
}) {
  const { providerId, routes, stations } = useCatalog();
  const { favorites, toggleFavorite, message } = useStationPreferences();
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const resultsList = useRef<HTMLUListElement>(null);
  const favoriteIds = useMemo(() => new Set(favorites.filter((item) => item.providerId === providerId)
    .map((item) => item.stationId)), [favorites, providerId]);
  const favoriteCount = stations.filter((item) => favoriteIds.has(item.id)).length;
  const results = useMemo(() => searchStations(stations, routes, query)
    .filter((item) => !favoritesOnly || favoriteIds.has(item.id)), [stations, routes, query, favoritesOnly, favoriteIds]);

  function favoriteButton(item: Station) {
    const saved = favoriteIds.has(item.id);
    return <button
      type="button"
      className={saved ? "station-favorite is-favorite" : "station-favorite"}
      aria-label={`${saved ? "Remove" : "Add"} ${item.name} ${saved ? "from" : "to"} favorites`}
      aria-pressed={saved}
      title={saved ? "Remove favorite" : "Save favorite"}
      onClick={() => toggleFavorite({ providerId, stationId: item.id })}
    ><Star aria-hidden="true" size={18} fill={saved ? "currentColor" : "none"} /></button>;
  }

  return <div className="field-group station-picker">
    <div className="station-current">
      <div><span className="station-caption">Viewing station</span><strong>{station.name}</strong></div>
      {favoriteButton(station)}
    </div>
    <div className="station-filters" aria-label="Filter stations">
      <button type="button" aria-pressed={!favoritesOnly} onClick={() => setFavoritesOnly(false)}>All stations</button>
      <button type="button" aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly(true)}>
        <Star aria-hidden="true" size={13} />Favorites ({favoriteCount})
      </button>
    </div>
    <label className="sr-only" htmlFor={`${idPrefix}-station-search`}>Search stations</label>
    <div className="station-search-shell">
      <Search aria-hidden="true" size={17} />
      <input
        ref={searchInput}
        id={`${idPrefix}-station-search`}
        type="search"
        placeholder="Search stations or lines"
        autoComplete="off"
        value={query}
        aria-controls={`${idPrefix}-station-results`}
        onChange={(event) => {
          setQuery(event.target.value);
          if (resultsList.current) resultsList.current.scrollTop = 0;
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            resultsList.current?.querySelector<HTMLButtonElement>(".station-result-choice")?.focus();
          }
          if (event.key === "Escape") setQuery("");
        }}
      />
      {query && <button type="button" aria-label="Clear station search" onClick={() => {
        setQuery("");
        searchInput.current?.focus();
      }}><X aria-hidden="true" size={16} /></button>}
    </div>
    <ul ref={resultsList} id={`${idPrefix}-station-results`} className="station-results" aria-label="Station search results">
      {results.map((item, index) => <li key={item.id} className={item.id === station.id ? "station-result is-selected" : "station-result"}>
        <button
          type="button"
          className="station-result-choice"
          aria-current={item.id === station.id ? "true" : undefined}
          onClick={() => onStationChange(item.id)}
          onKeyDown={(event) => {
            const choices = resultsList.current?.querySelectorAll<HTMLButtonElement>(".station-result-choice");
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const next = index + (event.key === "ArrowDown" ? 1 : -1);
              if (next < 0) searchInput.current?.focus();
              else choices?.[Math.min(next, results.length - 1)]?.focus();
            } else if (event.key === "Escape") {
              searchInput.current?.focus();
            }
          }}
        >
          <span>{item.name}</span>
          <small>{item.routes.map(({ routeId }) => routes[routeId]?.label ?? routeId).join(" · ")}</small>
        </button>
        {favoriteButton(item)}
      </li>)}
    </ul>
    <p className="station-results-status" role="status">
      {results.length > 0 ? `${results.length} ${results.length === 1 ? "station" : "stations"}`
        : favoritesOnly && favoriteCount === 0 ? "No favorites yet. Use a star to save a station."
        : "No stations match your search."}
    </p>
    {message && <p className="station-preferences-message" role="status">{message}</p>}
  </div>;
}
