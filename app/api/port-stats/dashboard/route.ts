import { NextResponse } from "next/server";
import { getPortDashboard } from "@/lib/port-stats";

export async function GET() {
  try {
    const payload = await getPortDashboard();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Impossible de récupérer le dashboard portuaire",
      },
      { status: 500 }
    );
  }
}
