export async function executeToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    const res = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, args }),
    });

    const data = await res.json().catch(() => ({ error: "Réponse tool invalide" }));

    if (!res.ok || data?.ok === false) {
      return JSON.stringify({ error: data?.error || `Erreur d'exécution pour ${name}` });
    }

    return JSON.stringify(data.result ?? {});
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}
