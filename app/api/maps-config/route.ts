import { readMapsConfiguration } from "@/lib/maps-config";

// Maps JavaScript uses a browser key; only its allowlisted configuration is returned.
export async function GET() {
  let runtime: Record<string, unknown> = {};
  try { runtime = (await import("cloudflare:workers")).env as unknown as Record<string, unknown>; } catch {}
  const config = readMapsConfiguration(runtime, process.env);
  const headers = { "Cache-Control": "no-store" };
  if (!config.key) return Response.json({ configured: false }, { status: 503, headers });
  return Response.json({ ...config, configured: true }, { headers });
}
