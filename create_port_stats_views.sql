-- =========================================================
-- PAKAZURE / PORT STATS VIEWS
-- Script complet à coller dans Supabase SQL Editor
-- =========================================================

begin;

-- =========================================================
-- 0) Vue consolidée de base
-- =========================================================
create or replace view public.port_stats_base as
select
  pb.id as bulletin_id,
  pb.semaine,
  pb.semaine_num,
  pb.year,
  pb.date_bulletin,

  -- Escales
  se.onshore,
  se.offshore,
  se.tac,
  se.tpol,
  se.autres_escales,
  se.t_hilli,
  se.t_kk1,
  se.mother_vessel,
  se.feeder,
  se.total_escales,

  -- Marchandises
  ct.terminal_polyvalent,
  ct.terminal_hilli_episeyo,
  ct.terminal_kome_kribi1,
  ct.vrac_liquide,
  ct.vrac_solide,
  ct.conventionnel,
  ct.total_marchandises,

  -- Conteneurs
  ctt.import_plein,
  ctt.import_vide,
  ctt.export_plein,
  ctt.export_vide,
  ctt.transbo_plein,
  ctt.transbo_vide,
  ctt.cont20_plein,
  ctt.cont40_plein,
  ctt.cont20_vide,
  ctt.cont40_vide,
  ctt.total_evp,

  -- Finance
  fp.redevance_acces,
  fp.redevances_diverses,
  fp.redevance_concession,
  fp.redevance_domaniales,
  fp.redevance_manutention,
  fp.redevance_marchandise,
  fp.red_navires_offshore,
  fp.red_navires_onshore,
  fp.red_navire_total,
  fp.chiffre_affaires,

  -- Camions
  tk.entrees_pleines,
  tk.entrees_vides,
  tk.sorties_pleines,
  tk.sorties_vides,
  tk.total_camions,
  tk.truck_turn_around_minutes,
  tk.seuil_minutes,

  -- Productivité
  pk.productivite_mv,
  pk.productivite_feeder,
  pk.productivite_pc,
  pk.objectif_pc,
  pk.taux_occupation_yards,
  pk.taux_occupation_quais,
  pk.block_reefers,
  pk.cap_export_disponible,
  pk.cap_export_utilisation,

  -- Parts de ligne
  ils.cma_cgm_pct,
  ils.maersk_pct,
  ils.hapag_lloyd_pct,
  ils.muo_pct

from public.port_bulletins pb
left join public.ship_escales se on se.bulletin_id = pb.id
left join public.cargo_traffic ct on ct.bulletin_id = pb.id
left join public.container_traffic ctt on ctt.bulletin_id = pb.id
left join public.financial_performance fp on fp.bulletin_id = pb.id
left join public.truck_kpi tk on tk.bulletin_id = pb.id
left join public.productivity_kpi pk on pk.bulletin_id = pb.id
left join public.import_line_share ils on ils.bulletin_id = pb.id;

-- =========================================================
-- 1) Dashboard hebdomadaire
-- =========================================================
create or replace view public.port_stats_dashboard_weekly as
with latest as (
  select *
  from public.port_stats_base
  order by year desc, semaine_num desc
  limit 1
),
prev as (
  select *
  from public.port_stats_base
  where (year, semaine_num) < (select year, semaine_num from latest)
  order by year desc, semaine_num desc
  limit 1
)
select
  'weekly' as period_scope,
  'escales_total' as metric_key,
  'Escales semaine' as metric_label,
  coalesce((select total_escales from latest), 0)::numeric as value,
  'navires' as unit,
  (
    coalesce((select total_escales from latest), 0)
    - coalesce((select total_escales from prev), 0)
  )::numeric as trend,
  'vs semaine précédente' as comparison_label

union all
select
  'weekly',
  'marchandises_total',
  'Marchandises semaine',
  coalesce((select total_marchandises from latest), 0)::numeric,
  'tonnes',
  (
    coalesce((select total_marchandises from latest), 0)
    - coalesce((select total_marchandises from prev), 0)
  )::numeric,
  'vs semaine précédente'

union all
select
  'weekly',
  'conteneurs_total_evp',
  'Conteneurs semaine',
  coalesce((select total_evp from latest), 0)::numeric,
  'EVP',
  (
    coalesce((select total_evp from latest), 0)
    - coalesce((select total_evp from prev), 0)
  )::numeric,
  'vs semaine précédente'

union all
select
  'weekly',
  'camions_total',
  'Camions semaine',
  coalesce((select total_camions from latest), 0)::numeric,
  'camions',
  (
    coalesce((select total_camions from latest), 0)
    - coalesce((select total_camions from prev), 0)
  )::numeric,
  'vs semaine précédente'

union all
select
  'weekly',
  'ca_total',
  'Chiffre d''affaires semaine',
  coalesce((select chiffre_affaires from latest), 0)::numeric,
  'XAF',
  (
    coalesce((select chiffre_affaires from latest), 0)
    - coalesce((select chiffre_affaires from prev), 0)
  )::numeric,
  'vs semaine précédente'
;

-- =========================================================
-- 2) Dashboard annuel
-- =========================================================
create or replace view public.port_stats_dashboard_yearly as
with latest_year as (
  select max(year) as year from public.port_stats_base
)
select
  'yearly' as period_scope,
  'escales_ytd' as metric_key,
  'Escales YTD' as metric_label,
  coalesce(sum(total_escales), 0)::numeric as value,
  'navires' as unit,
  null::numeric as trend,
  'année en cours' as comparison_label
from public.port_stats_base
where year = (select year from latest_year)

union all
select
  'yearly',
  'marchandises_ytd',
  'Marchandises YTD',
  coalesce(sum(total_marchandises), 0)::numeric,
  'tonnes',
  null::numeric,
  'année en cours'
from public.port_stats_base
where year = (select year from latest_year)

union all
select
  'yearly',
  'evp_ytd',
  'EVP YTD',
  coalesce(sum(total_evp), 0)::numeric,
  'EVP',
  null::numeric,
  'année en cours'
from public.port_stats_base
where year = (select year from latest_year)

union all
select
  'yearly',
  'ca_ytd',
  'Chiffre d''affaires YTD',
  coalesce(sum(chiffre_affaires), 0)::numeric,
  'XAF',
  null::numeric,
  'année en cours'
from public.port_stats_base
where year = (select year from latest_year)
;

-- =========================================================
-- 3) Dashboard générique
-- =========================================================
create or replace view public.port_stats_dashboard as
select * from public.port_stats_dashboard_weekly
union all
select * from public.port_stats_dashboard_yearly
;

-- =========================================================
-- 4) Vue générique par domaine
-- =========================================================
create or replace view public.port_stats_domain_metrics as

-- ESCALES
select 'escales' as domain, 'onshore' as metric_key, 'Escales onshore' as metric_label,
coalesce(onshore,0)::numeric as value, 'navires' as unit, null::numeric as trend, null::text as comparison_label
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'escales', 'offshore', 'Escales offshore',
coalesce(offshore,0)::numeric, 'navires', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'escales', 'mother_vessel', 'Mother vessel',
coalesce(mother_vessel,0)::numeric, 'navires', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'escales', 'feeder', 'Feeder',
coalesce(feeder,0)::numeric, 'navires', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

-- MARCHANDISES
union all
select 'marchandises', 'vrac_liquide', 'Vrac liquide',
coalesce(vrac_liquide,0)::numeric, 'tonnes', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'marchandises', 'vrac_solide', 'Vrac solide',
coalesce(vrac_solide,0)::numeric, 'tonnes', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'marchandises', 'total_marchandises', 'Total marchandises',
coalesce(total_marchandises,0)::numeric, 'tonnes', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

-- CONTENEURS
union all
select 'conteneurs', 'import_plein', 'Import plein',
coalesce(import_plein,0)::numeric, 'EVP', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'conteneurs', 'export_plein', 'Export plein',
coalesce(export_plein,0)::numeric, 'EVP', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'conteneurs', 'total_evp', 'Total EVP',
coalesce(total_evp,0)::numeric, 'EVP', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

-- FINANCE
union all
select 'finance', 'redevance_acces', 'Redevance accès',
coalesce(redevance_acces,0)::numeric, 'XAF', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'finance', 'redevance_marchandise', 'Redevance marchandise',
coalesce(redevance_marchandise,0)::numeric, 'XAF', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'finance', 'chiffre_affaires', 'Chiffre d''affaires',
coalesce(chiffre_affaires,0)::numeric, 'XAF', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

-- CAMIONS
union all
select 'camions', 'total_camions', 'Total camions',
coalesce(total_camions,0)::numeric, 'camions', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'camions', 'truck_turn_around_minutes', 'Truck turn around',
coalesce(truck_turn_around_minutes,0)::numeric, 'minutes', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

-- PRODUCTIVITE
union all
select 'productivite', 'productivite_mv', 'Productivité MV',
coalesce(productivite_mv,0)::numeric, 'mvt/h', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'productivite', 'productivite_feeder', 'Productivité feeder',
coalesce(productivite_feeder,0)::numeric, 'mvt/h', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'productivite', 'productivite_pc', 'Productivité PC',
coalesce(productivite_pc,0)::numeric, 'mvt/h', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'productivite', 'taux_occupation_yards', 'Occupation yards',
coalesce(taux_occupation_yards,0)::numeric, '%', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

-- PARTS LIGNE
union all
select 'parts_ligne', 'cma_cgm_pct', 'CMA CGM',
coalesce(cma_cgm_pct,0)::numeric, '%', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'parts_ligne', 'maersk_pct', 'Maersk',
coalesce(maersk_pct,0)::numeric, '%', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'parts_ligne', 'hapag_lloyd_pct', 'Hapag Lloyd',
coalesce(hapag_lloyd_pct,0)::numeric, '%', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1

union all
select 'parts_ligne', 'muo_pct', 'MUO',
coalesce(muo_pct,0)::numeric, '%', null::numeric, null::text
from public.port_stats_base
order by year desc, semaine_num desc
limit 1
;

-- =========================================================
-- 5) Vues par domaine
-- =========================================================
create or replace view public.port_stats_escales as
select * from public.port_stats_domain_metrics where domain = 'escales';

create or replace view public.port_stats_marchandises as
select * from public.port_stats_domain_metrics where domain = 'marchandises';

create or replace view public.port_stats_conteneurs as
select * from public.port_stats_domain_metrics where domain = 'conteneurs';

create or replace view public.port_stats_finance as
select * from public.port_stats_domain_metrics where domain = 'finance';

create or replace view public.port_stats_camions as
select * from public.port_stats_domain_metrics where domain = 'camions';

create or replace view public.port_stats_productivite as
select * from public.port_stats_domain_metrics where domain = 'productivite';

create or replace view public.port_stats_parts_ligne as
select * from public.port_stats_domain_metrics where domain = 'parts_ligne';

commit;
