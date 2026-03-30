import { NextRequest, NextResponse } from "next/server";
import { getPortDomain, isPortStatsDomain } from "@/lib/port-stats";

export async function GET(_req: NextRequest, { params }: { params: { domain: string } }) {
  try {
    const domain = params.domain;

    if (!isPortStatsDomain(domain)) {
      return NextResponse.json({ error: `Domaine invalide: ${domain}` }, { status: 400 });
    }

    const payload = await getPortDomain(domain);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Impossible de récupérer le détail domaine",
      },
      { status: 500 }
    );
  }
}
