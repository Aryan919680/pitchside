import { configureKeyMode, loadGoogleMaps } from "./google-maps";

type MapsSession = { mapId: string; demoKey: boolean };
let session: Promise<MapsSession> | undefined;
let rejectedByGoogle = false;
export const MAPS_UNAVAILABLE = "Nearby venue search is temporarily unavailable. Please try again later.";

export function invalidateMapsSession() {
  rejectedByGoogle = true;
  session = undefined;
}

// Startup and visitor actions share one initialization promise. An early click
// waits for the configured key to load rather than requesting one from a visitor.
export function ensureMapsSession(): Promise<MapsSession> {
  if (rejectedByGoogle) return Promise.reject(new Error(MAPS_UNAVAILABLE));
  if (session) return session;
  session = (async () => {
    const response = await fetch("/api/maps-config", { cache: "no-store" });
    if (!response.ok) throw new Error(MAPS_UNAVAILABLE);
    const config = await response.json() as { key?: unknown; mapId?: unknown; demoKey?: unknown };
    if (!config || typeof config.key !== "string" || !config.key.trim()) throw new Error(MAPS_UNAVAILABLE);
    const demoKey = config.demoKey !== false;
    configureKeyMode(demoKey);
    await loadGoogleMaps(config.key.trim());
    if (rejectedByGoogle) throw new Error(MAPS_UNAVAILABLE);
    return { mapId: typeof config.mapId === "string" ? config.mapId : "", demoKey };
  })().catch(() => {
    session = undefined;
    throw new Error(MAPS_UNAVAILABLE);
  });
  return session;
}
