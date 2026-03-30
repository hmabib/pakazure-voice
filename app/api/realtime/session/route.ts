import { NextRequest, NextResponse } from "next/server";
import { createRealtimeSession } from "@/lib/server-tools";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { enableVideo?: boolean };
    const session = await createRealtimeSession({ enableVideo: Boolean(body.enableVideo) });
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Impossible de créer la session realtime",
      },
      { status: 500 }
    );
  }
}
