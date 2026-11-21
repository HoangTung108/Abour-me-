import { m as motion } from "framer-motion";
import { ArrowUpRight, GitBranch, Orbit, Sparkles } from "lucide-react";

export default function ProfileHeader({ username, reduceMotion, showProjects, onToggleProjects }) {
  return (
    <motion.header
      className="profile-header"
      initial={reduceMotion ? false : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <a href={`https://github.com/${username}`} target="_blank" rel="noreferrer" className="group flex items-center gap-3" aria-label="Visit GitHub profile">
        <span className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/6 text-cyan-100 shadow-[0_0_24px_rgba(153,196,255,0.12)] transition group-hover:border-fuchsia-200/50 group-hover:shadow-[0_0_30px_rgba(255,155,209,0.25)]"><Orbit size={19} /></span>
        <span className="font-display text-sm font-semibold tracking-[0.16em] text-cyan-200">HwangT<span className="text-fuchsia-300">.</span></span>
      </a>
      <nav className="top-actions" aria-label="Main navigation">
        <button className="explore-button" onClick={onToggleProjects} aria-expanded={showProjects} aria-controls="project-list"><Sparkles size={15} /> Projects</button>
        <a href={'https://github.com/' + username} target="_blank" rel="noreferrer"><GitBranch size={15} /> GitHub <ArrowUpRight size={14} /></a>
      </nav>
    </motion.header>
  );
}
