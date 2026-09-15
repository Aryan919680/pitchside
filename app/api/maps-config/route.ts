import { readMapsConfiguration } from "@/lib/maps-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = readMapsConfiguration(process.env);
  const headers = { "Cache-Control": "no-store" };

  if (!config.key) {
    return Response.json(
      {
        configured: false,
        code: "MAPS_NOT_CONFIGURED",
      },
      { status: 503, headers }
    );
  }

  return Response.json(
    { ...config, configured: true },
    { headers }
  );
}