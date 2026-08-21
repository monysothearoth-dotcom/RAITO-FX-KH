import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ExternalLink, Search, ShieldAlert, Sparkles } from 'lucide-react';
import { filterResearchModules, RESEARCH_MODULES, RESEARCH_SOURCES, type ResearchDomain } from '../lib/marketKnowledge';

export default function ResearchLibrary() {
  const [domain, setDomain] = useState<ResearchDomain | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(RESEARCH_MODULES[0].id);
  const filtered = useMemo(() => filterResearchModules(RESEARCH_MODULES, domain, query), [domain, query]);
  const selected = filtered.find((module) => module.id === selectedId) || filtered[0] || RESEARCH_MODULES[0];

  return (
    <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/95 p-4 sm:p-6 shadow-2xl" data-testid="research-library">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-400"><BookOpen className="h-5 w-5" /></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap"><h2 className="text-lg font-black uppercase tracking-wide text-white">Market Research Library</h2><span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase text-cyan-300">Forex + Crypto</span></div>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">A practical e-book layer for technical structure, macro/fundamental context, execution, and risk. Signal Analyze uses this framework to explain live setups; it does not guarantee outcomes.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-[10px] font-mono font-bold uppercase text-rose-300"><ShieldAlert className="h-3.5 w-3.5" />Risk is always yours</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.4fr] gap-4">
          <div className="flex min-h-[520px] flex-col rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex flex-col gap-2 pb-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2"><Search className="h-3.5 w-3.5 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search modules, concepts, or checks" className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600" aria-label="Search research modules" /></div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {(['all', 'forex', 'crypto', 'shared'] as const).map((item) => <button key={item} onClick={() => setDomain(item)} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase transition-colors ${domain === item ? 'border-amber-400 bg-amber-500 text-slate-950' : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'}`}>{item === 'all' ? 'All modules' : item}</button>)}
              </div>
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto pr-1">
              {filtered.map((module) => <button key={module.id} onClick={() => setSelectedId(module.id)} className={`rounded-xl border p-3 text-left transition-all ${selected?.id === module.id ? 'border-amber-500/50 bg-amber-500/10' : 'border-transparent bg-slate-900/60 hover:border-slate-700'}`}><div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-white">{module.title}</span><span className="text-[9px] font-mono uppercase text-slate-500">{module.level}</span></div><p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-500">{module.summary}</p></button>)}
              {!filtered.length && <div className="p-6 text-center text-xs text-slate-500">No modules match this search.</div>}
            </div>
          </div>

          <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-mono font-bold uppercase text-amber-300">{selected.domain}</span><span className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] font-mono font-bold uppercase text-slate-400">{selected.level}</span></div>
            <h3 className="mt-3 text-xl font-black text-white">{selected.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{selected.summary}</p>
            <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div><h4 className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-300"><Sparkles className="h-3.5 w-3.5" />Core lessons</h4><div className="flex flex-col gap-2">{selected.lessons.map((lesson) => <div key={lesson} className="flex gap-2 text-xs leading-relaxed text-slate-400"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />{lesson}</div>)}</div></div>
              <div><h4 className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" />Before accepting a setup</h4><div className="flex flex-col gap-2">{selected.checklist.map((check) => <div key={check} className="flex gap-2 text-xs leading-relaxed text-slate-400"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />{check}</div>)}</div></div>
            </div>
            <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wide text-amber-300 hover:text-amber-200"><ExternalLink className="h-3.5 w-3.5" />Reference: {selected.sourceLabel}</a>
          </article>
        </div>

        <div className="border-t border-slate-800 pt-4"><h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Primary references</h4><div className="mt-2 flex flex-wrap gap-2">{RESEARCH_SOURCES.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-[10px] font-mono text-slate-400 hover:border-amber-500/40 hover:text-amber-300"><ExternalLink className="h-3 w-3" />{source.label}</a>)}</div></div>
      </div>
    </section>
  );
}
