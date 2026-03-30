"use client";

interface VizSeriesItem {
  label: string;
  value: number;
}

interface VizPayload {
  title?: string;
  summary?: string;
  chartType?: string;
  series?: VizSeriesItem[];
  insight?: string;
}

interface Props {
  data: VizPayload | null;
  loading?: boolean;
}

export default function DatavizPanel({ data, loading = false }: Props) {
  const series = data?.series || [];
  const max = Math.max(1, ...series.map((item) => item.value || 0));

  return (
    <div className="min-w-0 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">Gemini dataviz</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Visualisation à la demande</h3>
        </div>
        <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-cyan-100">
          {loading ? "Génération" : data ? "Affichée" : "Prête"}
        </span>
      </div>

      {!data && !loading && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-400">
          Demande une visualisation Gemini et elle s’affichera ici, avec mise en forme PAKAZURE.
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.04] px-4 py-8 text-center text-sm text-cyan-100">
          Génération de la dataviz en cours...
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-4">
            <div className="mb-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://static.wixstatic.com/media/ccfac3_e82eb7f271cb42709c78ae85c0aaf01f~mv2.jpg/v1/fill/w_144,h_122,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/PAKAZURE_JPG.jpg"
                alt="PAKAZURE"
                className="h-9 w-9 rounded-lg object-cover"
              />
              <div>
                <p className="text-base font-semibold text-white">{data.title || "Dataviz PAKAZURE"}</p>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Généré par PAKAZURE</p>
              </div>
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{data.summary}</p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(46,109,180,0.16),rgba(7,14,32,0.62))] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-100">{data.chartType || "Chart"}</span>
              <span className="text-[11px] uppercase tracking-[0.28em] text-slate-400">PAKAZURE</span>
            </div>

            <div className="flex h-52 items-end gap-3 overflow-x-auto rounded-2xl border border-white/8 bg-slate-950/35 px-4 pb-4 pt-6">
              {series.map((item) => (
                <div key={item.label} className="flex min-w-[72px] flex-1 flex-col items-center justify-end gap-2">
                  <div className="text-xs font-semibold text-cyan-100">{item.value}</div>
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-cyan-400 to-blue-500"
                    style={{ height: `${Math.max(16, (item.value / max) * 140)}px` }}
                  />
                  <div className="text-center text-[11px] leading-4 text-slate-300">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {data.insight && (
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-100">Insight</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{data.insight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
