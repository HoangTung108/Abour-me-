import { ArrowUpRight, X } from "lucide-react";

export default function ProjectDrawer({ repositories, loaded, loadError, onClose, onSelect }) {
  return (
    <section className="project-drawer" id="project-list" aria-label="Public projects">
      <div className="drawer-heading"><div></div><button onClick={onClose} aria-label="Close project list"><X size={18} /></button></div>
      <div className="project-list">{repositories.map(repository => <button key={repository.id} onClick={() => onSelect(repository)}><span><strong>{repository.name}</strong><small>{repository.language || (repository.source === "project" ? "Project link" : "Open source")}</small></span><ArrowUpRight size={16} /></button>)}</div>
      {!repositories.length && <p>{loadError ? "GitHub is unavailable. Visit the profile to explore projects." : loaded ? "No public projects yet." : "Loading projects…"}</p>}
    </section>
  );
}
