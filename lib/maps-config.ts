type Environment = Record<string, unknown>;
export type MapsConfiguration = { key: string; mapId: string; demoKey: boolean };
const KEY_NAMES = ["GOOGLE_MAPS_BROWSER_KEY", "GOOGLE_MAPS_API_KEY", "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "VITE_GOOGLE_MAPS_API_KEY"];

function firstValue(sources: Environment[], names: string[]) {
  for (const source of sources) {
    for (const name of names) {
      const value = source[name];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return "";
}

// Read only the browser Maps configuration, never arbitrary application secrets.
export function readMapsConfiguration(...sources: Environment[]): MapsConfiguration {
  return {
    key: firstValue(sources, KEY_NAMES),
    mapId: firstValue(sources, ["GOOGLE_MAPS_MAP_ID", "VITE_GOOGLE_MAPS_MAP_ID"]),
    demoKey: firstValue(sources, ["GOOGLE_MAPS_KEY_MODE"]) !== "standard",
  };
}

export function localMapsBindings(environment: Environment): Record<string, string> {
  const config = readMapsConfiguration(environment);
  return config.key ? {
    GOOGLE_MAPS_BROWSER_KEY: config.key,
    GOOGLE_MAPS_MAP_ID: config.mapId,
    GOOGLE_MAPS_KEY_MODE: config.demoKey ? "demo" : "standard",
  } : {};
}
