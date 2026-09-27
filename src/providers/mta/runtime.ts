import { fetchComposedMtaArrivalsForRoutes } from "./composed-resolver";
import { fetchMtaTripPath } from "./trip-path-resolver";

export const mtaLoaders = {
  loadArrivals: fetchComposedMtaArrivalsForRoutes,
  loadTripPath: fetchMtaTripPath,
};
