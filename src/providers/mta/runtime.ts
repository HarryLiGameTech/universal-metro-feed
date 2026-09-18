import { fetchTimetableForRoutes } from "../../lib/timetable";
import { fetchComposedMtaArrivalsForRoutes } from "./composed-resolver";
import { fetchMtaTripPath } from "./trip-path-resolver";

export const mtaLoaders = {
  loadArrivals: fetchComposedMtaArrivalsForRoutes,
  loadTripPath: fetchMtaTripPath,
  loadTimetable: fetchTimetableForRoutes,
};
