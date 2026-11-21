import { AnimatePresence, m as motion } from "framer-motion";
import { ArrowUpRight, Star, X } from "lucide-react";

function formatCount(count) {
  return new Intl.NumberFormat("en", { notation: count > 999 ? "compact" : "standard" }).format(count || 0);
}

export default function ProjectPreview({ activeRepository, isPreview, onDismiss }) {
  return (
    <AnimatePresence mode="wait">
      {activeRepository && (
        <motion.aside
          key={activeRepository.id}
          className={`fixed bottom-20 right-5 z-30 w-[min(360px,calc(100vw-40px))] sm:bottom-24 sm:right-8 ${isPreview ? 'pointer-events-none' : ''}`}
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          aria-live="polite"
        >
          <button className="close-preview" onClick={onDismiss} aria-label="Close project preview"><X size={16} /></button>
          <a href={activeRepository.html_url} target="_blank" rel="noreferrer" className="group block rounded-2xl border border-white/15 bg-[#111329]/85 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.5),0_0_40px_rgba(151,131,255,0.12)] backdrop-blur-2xl transition hover:border-cyan-100/35">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-100/65">{activeRepository.full_name}</p>
                <h2 className="mt-2 wrap-break-word font-display text-xl font-semibold tracking-tight text-white">{activeRepository.name}</h2>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 text-fuchsia-200 transition group-hover:rotate-45 group-hover:border-fuchsia-200/30"><ArrowUpRight size={17} /></span>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-indigo-100/65">{activeRepository.description || "No description provided."}</p>
            <div className="mt-4 flex items-center gap-4 font-mono text-[11px] text-white/55">
              {activeRepository.language && <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-fuchsia-200" />{activeRepository.language}</span>}
              {activeRepository.stargazers_count != null && <span className="flex items-center gap-1.5"><Star size={12} className="text-cyan-100" />{formatCount(activeRepository.stargazers_count)}</span>}
              <span className="ml-auto text-cyan-100/75">Open project ↗</span>
            </div>
          </a>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
