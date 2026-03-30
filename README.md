# PAKAZURE Voice 🐬

> Assistant IA vocal temps réel — Port Autonome de Kribi

Interface web conversationnelle utilisant l'OpenAI Realtime API (WebRTC) pour des conversations vocales ultra-faibles en latence.

## Fonctionnalités

- 🎤 **Voix temps réel** via OpenAI Realtime API + WebRTC
- 🛠️ **5 outils intégrés** : météo, calcul, heure, recherche web, statut Port Kribi
- 🔌 **MCP ready** : connectez n'importe quel serveur MCP
- 🎨 **Design PAKAZURE** : thème sombre, animations orbe
- 📱 **Responsive** : fonctionne sur mobile et desktop
- ⌨️ **Saisie texte** en complément de la voix

## Setup rapide

### 1. Variables d'environnement

```bash
cp .env.local.example .env.local
# Éditez .env.local et ajoutez votre clé OpenAI
```

```env
OPENAI_API_KEY=sk-your-openai-api-key
```

### 2. Installation

```bash
npm install
npm run dev
```

Ouvrez http://localhost:3000

### 3. Deploy sur Vercel

```bash
# Via CLI
npm i -g vercel
vercel

# Ou connectez le repo GitHub à vercel.com
# Ajoutez OPENAI_API_KEY dans les variables d'environnement Vercel
```

## Architecture

```
Browser
  └── VoiceAssistant (React)
        ├── useRealtimeSession (WebRTC Hook)
        │     ├── POST /api/realtime/session → ephemeral token
        │     ├── RTCPeerConnection → OpenAI Realtime API
        │     ├── DataChannel → events (transcript, tools)
        │     └── Tool calls → toolHandlers.ts
        ├── OrbVisualizer (animations)
        ├── TranscriptPanel (chat history)
        ├── ToolsPanel (toggle outils)
        └── SettingsModal (voix, langue, MCP)
```

## Outils disponibles

| Outil | Description |
|-------|-------------|
| `get_current_time` | Date/heure Africa/Lagos |
| `get_weather` | Météo wttr.in |
| `calculate` | Calcul mathématique |
| `search_web` | Recherche web (mock, connecter Brave API) |
| `get_port_status` | Statut Port Autonome de Kribi |

## Connecter un serveur MCP

Dans Paramètres → Serveurs MCP, ajoutez l'URL WebSocket de votre serveur MCP :
```
ws://localhost:3001/mcp
wss://your-mcp-server.com/mcp
```

## Coût estimé

- OpenAI Realtime API : ~$0.06/min audio input + $0.24/min audio output
- Une conversation de 5 min ≈ $1.50

---
*Généré par PAKAZURE 🐬 — Port Autonome de Kribi*
