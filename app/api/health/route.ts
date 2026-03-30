import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    app: "PAKAZURE Voice",
    version: "1.0.0",
    ts: new Date().toISOString(),
  });
}
