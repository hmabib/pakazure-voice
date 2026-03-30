import { NextRequest, NextResponse } from "next/server";
import {
  calculate,
  generateGeminiDataviz,
  getCurrentTime,
  getPortStatus,
  getWeather,
  querySoftis,
  searchWeb,
} from "@/lib/server-tools";

export async function POST(req: NextRequest) {
  try {
    const { name, args } = (await req.json()) as {
      name?: string;
      args?: Record<string, unknown>;
    };

    if (!name) {
      return NextResponse.json({ error: "Nom de tool manquant" }, { status: 400 });
    }

    const input = args || {};

    let result: unknown;

    switch (name) {
      case "get_current_time":
        result = await getCurrentTime();
        break;
      case "get_weather":
        result = await getWeather(String(input.city || "Kribi"));
        break;
      case "calculate":
        result = await calculate(String(input.expression || ""));
        break;
      case "search_web":
        result = await searchWeb(String(input.query || ""));
        break;
      case "get_port_status":
        result = await getPortStatus();
        break;
      case "generate_gemini_dataviz":
        result = await generateGeminiDataviz(String(input.prompt || ""));
        break;
      case "query_softis":
        result = await querySoftis(String(input.query || ""));
        break;
      default:
        return NextResponse.json({ error: `Tool inconnu: ${name}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erreur interne tool",
      },
      { status: 500 }
    );
  }
}
