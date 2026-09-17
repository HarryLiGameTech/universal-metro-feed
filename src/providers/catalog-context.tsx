import { createContext, useContext } from "react";
import type { ProviderCatalog } from "./registry";

export const CatalogContext = createContext<ProviderCatalog | null>(null);

export function useCatalog() {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("Provider catalog is not loaded.");
  return catalog;
}
