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
- Ajout d’un bloc léger **stats portuaires** alimenté par routes serveur sécurisées côté Supabase REST.
- Ajout de réglages avatar fins : bouche, yeux, intensité, taille, centrage en parole, transcript sous avatar.

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
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_PORT_STATS_VIEW_DASHBOARD=port_stats_dashboard
SUPABASE_PORT_STATS_VIEW_DASHBOARD_WEEKLY=port_stats_dashboard_weekly
SUPABASE_PORT_STATS_VIEW_DASHBOARD_YEARLY=port_stats_dashboard_yearly
SUPABASE_PORT_STATS_VIEW_DOMAIN=port_stats_domain_metrics
SUPABASE_PORT_STATS_VIEW_ESCALES=port_stats_escales
SUPABASE_PORT_STATS_VIEW_MARCHANDISES=port_stats_marchandises
SUPABASE_PORT_STATS_VIEW_CONTENEURS=port_stats_conteneurs
SUPABASE_PORT_STATS_VIEW_FINANCE=port_stats_finance
SUPABASE_PORT_STATS_VIEW_CAMIONS=port_stats_camions
SUPABASE_PORT_STATS_VIEW_PRODUCTIVITE=port_stats_productivite
SUPABASE_PORT_STATS_VIEW_PARTS_LIGNE=port_stats_parts_ligne
```

## Sécurité des APIs

Toutes les clés sensibles restent **côté serveur** via des routes Next.js (`/api/...`).
Aucune clé API n’est exposée au navigateur.

Connecteurs actuellement branchés côté serveur :
- **OpenAI Realtime** via `/api/realtime/session`
- **Brave Search** via `/api/tools`
- **Gemini Dataviz** via `/api/tools`
- **Softis** via `/api/tools` avec token backend
- **Supabase REST** via `/api/port-stats/dashboard` et `/api/port-stats/[domain]`

Les outils côté navigateur appellent uniquement la route serveur sécurisée, jamais les fournisseurs directement.

### Schéma logique recommandé pour les stats portuaires

Pour éviter de recopier un mapping métier incohérent dans le front, l’app attend des **vues normalisées** côté Supabase/Postgres :

- `dashboard_weekly` / `dashboard_yearly` ou une vue unique dashboard avec `period_scope`
- une vue domaine générique ou des vues dédiées par domaine
- colonnes normalisées : `domain`, `metric_key`, `metric_label`, `value`, `unit`, `trend`, `comparison_label`

Ainsi, l’architecture UI consomme un JSON stable, même si les tables sources réelles sont plus complexes.

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
