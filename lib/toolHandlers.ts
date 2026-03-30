export async function executeToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    switch (name) {
      case "get_current_time": {
        const now = new Date();
        return JSON.stringify({
          datetime: now.toLocaleString("fr-FR", { timeZone: "Africa/Lagos" }),
          date: now.toLocaleDateString("fr-FR", { timeZone: "Africa/Lagos" }),
          time: now.toLocaleTimeString("fr-FR", { timeZone: "Africa/Lagos" }),
          timezone: "Africa/Lagos (WAT, UTC+1)",
          iso: now.toISOString(),
        });
      }

      case "get_weather": {
        const city = (args.city as string) || "Kribi";
        try {
          const res = await fetch(
            `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (!res.ok) throw new Error("Weather API error");
          const data = await res.json();
          const current = data.current_condition?.[0];
          return JSON.stringify({
            city,
            temp_c: current?.temp_C,
            feels_like_c: current?.FeelsLikeC,
            description: current?.weatherDesc?.[0]?.value,
            humidity: current?.humidity + "%",
            wind_kmph: current?.windspeedKmph + " km/h",
            visibility_km: current?.visibility,
          });
        } catch {
          return JSON.stringify({ error: `Météo indisponible pour ${city}` });
        }
      }

      case "calculate": {
        const expr = (args.expression as string) || "";
        try {
          const safe = expr.replace(/[^0-9+\-*/.() %^,\s]/g, "");
          const result = Function(`"use strict"; return (${safe})`)();
          return JSON.stringify({ expression: expr, result, formatted: String(result) });
        } catch {
          return JSON.stringify({ error: "Expression invalide" });
        }
      }

      case "search_web": {
        const query = (args.query as string) || "";
        return JSON.stringify({
          query,
          note: "Recherche web simulée — connectez une API réelle pour des résultats en direct",
          results: [
            {
              title: `Résultats pour: ${query}`,
              snippet: `Voici ce que j'ai trouvé sur "${query}". Pour des résultats réels, configurez l'API Brave Search.`,
              url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            },
          ],
        });
      }

      case "get_port_status": {
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour > 22;
        return JSON.stringify({
          port: "Port Autonome de Kribi (PAK)",
          status: "Opérationnel",
          traffic_level: isNight ? "Faible" : "Normal",
          vessels_at_berth: Math.floor(Math.random() * 4) + 2,
          vessels_at_anchor: Math.floor(Math.random() * 6) + 4,
          containers_processed_today: Math.floor(Math.random() * 150) + 250,
          teus_today: Math.floor(Math.random() * 300) + 400,
          weather_conditions: "Mer calme, vent modéré",
          last_updated: new Date().toISOString(),
          source: "PAK SmartInfo (simulé)",
        });
      }

      default:
        return JSON.stringify({ error: `Outil inconnu: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}
