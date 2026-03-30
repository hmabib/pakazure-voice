# PAKAZURE Voice — Refonte futuriste JARVIS

Assistant vocal temps réel Next.js / Vercel avec identité visuelle premium PAKAZURE.

## Ce qui a été refondu

- **Nouveau dashboard header** avec métriques live, branding PAKAZURE et statut de session.
- **Zone avatar centrale premium** avec photo enrichie, micro-animations, clignement des yeux, lip-sync réactif au volume, scanlines et overlays HUD.
- **Panneau outils / actions** modernisé pour activer les tools temps réel et préparer les futures intégrations métier.
- **Panneau dataviz / visualisation** ajouté pour accueillir Gemini dataviz, KPI portuaires, previews d’analyses et statuts opérationnels.
- **Transcript panel** repensé avec meilleure hiérarchie visuelle et lecture des événements assistant / user / tools.
- **Structure plus extensible** pour brancher Softis, météo, recherche, port status, CAMCIS, Gemini dataviz, etc.

## Correctifs effectués

- Ajout de la route serveur manquante **`/api/realtime/session`** pour créer les sessions OpenAI Realtime.
- Filtrage réel des tools activés côté session Realtime.
- Amélioration du hook audio avec gestion plus propre de l’`AudioContext` et du volume analyser.
- Nettoyage de plusieurs incohérences UI / états liés à la session.

## Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Variables serveur recommandées :

```env
OPENAI_API_KEY=sk-...
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview
BRAVE_SEARCH_API_KEY=...
GEMINI_API_KEY=...
SOFTIS_API_BASE_URL=https://...
SOFTIS_API_TOKEN=...
```

## Sécurité des APIs

Toutes les clés sensibles restent **côté serveur** via des routes Next.js (`/api/...`).
Aucune clé API n’est exposée au navigateur.

Connecteurs actuellement branchés côté serveur :
- **OpenAI Realtime** via `/api/realtime/session`
- **Brave Search** via `/api/tools`
- **Gemini Dataviz** via `/api/tools`
- **Softis** via `/api/tools` avec token backend

Les outils côté navigateur appellent uniquement la route serveur sécurisée, jamais les fournisseurs directement.

## Compatibilité

- **Next.js 14**
- **Vercel-ready**
- UI responsive desktop / tablet / mobile large

## Prochaines intégrations API suggérées

1. **Softis / ERP / opérations** : actions métier, formulaires, workflows.
2. **Gemini dataviz** : graphiques générés depuis prompts ou données portuaires.
3. **CAMCIS / Port status** : navires, BL, manifestes, escales, inventaire terminal.
4. **Recherche web / veille** : briefings marché, météo, actus logistiques.
5. **Panel tools unifié** : actions, automations, connecteurs MCP, plugins.

## Vérification locale

À lancer après modification :

```bash
npm run build
npm run lint
```

Si `next lint` n’est pas disponible selon votre config Next.js, remplacer par une commande ESLint dédiée.
