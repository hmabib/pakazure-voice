import { NextResponse } from "next/server";
import { createRealtimeSession } from "@/lib/server-tools";

export async function POST() {
  try {
    const session = await createRealtimeSession();
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
