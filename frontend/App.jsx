import React, { Component, Suspense, lazy, useCallback, useEffect, useState } from "react";
import { AnimatePresence, LazyMotion, MotionConfig, m as motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, GitBranch, Orbit, Star, X, Sparkles, Code2, Layers, Gamepad2, Globe, Cpu } from "lucide-react";
const GalaxyScene = lazy(() => import("./GalaxyScene.jsx"));
const loadMotion = () => import("./motion-features.js").then(module => module.default);
import { personalProfile } from "./profile.js";
const GITHUB_USERNAME = "HoangTung108";
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onUnavailable(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function formatCount(count) {
  return new Intl.NumberFormat("en", { notation: count > 999 ? "compact" : "standard" }).format(count || 0);
}

export default function App() {
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneUnavailable, setSceneUnavailable] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [profileTab, setProfileTab] = useState("about");
  const [loaded, setLoaded] = useState(false);
  const unavailable = useCallback(() => setSceneUnavailable(true), []);
  useEffect(() => {
    const id = window.setTimeout(() => setSceneReady(true), 250);
    return () => window.clearTimeout(id);
  }, []);
  const [repositories, setRepositories] = useState([]);
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('https://api.github.com/users/' + GITHUB_USERNAME, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Profile unavailable'); return response.json(); })
      .then(setProfile).catch(() => { /* Local introduction remains available. */ });
    return () => controller.abort();
  }, []);
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [isHolding, setIsHolding] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const reduceMotion = useReducedMotion();
  const activeRepository = selectedRepository;
  useEffect(() => {
    const controller = new AbortController();

    const cacheKey = "github-repositories-v1";
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey));
      if (cached && Date.now() - cached.time < 300000 && Array.isArray(cached.data)) {
        setRepositories(cached.data); setLoaded(true); return () => controller.abort();
      }
    } catch { /* Storage can be unavailable in private browsing. */ }
    fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const publicRepositories = data.filter(repository => !repository.private);
        setRepositories(publicRepositories); setLoaded(true);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), data: publicRepositories })); } catch { /* Optional cache. */ }
      })
      .catch((error) => {
        if (error.name !== "AbortError") { setLoadError(true); setLoaded(true); }
      });

    return () => controller.abort();
  }, []);

  const selectRepository = useCallback((repository) => {
    setIsHolding(false);
    setSelectedRepository((selected) => selected?.id === repository.id ? null : repository);
  }, []);

  const dismissRepository = useCallback(() => {
    setSelectedRepository(null);
    setIsHolding(false);
  }, []);
  const beginHold = useCallback(() => setIsHolding(true), []);
  const endHold = useCallback(() => setIsHolding(false), []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") { dismissRepository(); setShowProjects(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissRepository]);

  return (
    <LazyMotion features={loadMotion} strict><MotionConfig reducedMotion="user">
    <main className="fixed inset-0 overflow-hidden bg-[#070916] text-white selection:bg-fuchsia-200 selection:text-indigo-950">
      <div className="cosmic-wash" aria-hidden="true" />
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {sceneReady && !sceneUnavailable && <SceneBoundary onUnavailable={unavailable}><Suspense fallback={null}><GalaxyScene
          reduceMotion={Boolean(reduceMotion)} onUnavailable={unavailable}
          repositories={repositories}
          onSelect={selectRepository}
          onHoldStart={beginHold}
          onHoldEnd={endHold}
          onBackgroundClick={dismissRepository}
        /></Suspense></SceneBoundary>}
      </div>

      <div className="pointer-events-none absolute inset-0 z-1 bg-linear-to-r from-[#080a1b]/72 via-[#080a1b]/32 to-transparent md:from-[#080a1b]/68 md:via-[#080a1b]/16" />
      <div className="pointer-events-none absolute inset-0 z-1 bg-linear-to-t from-[#080a1b]/58 via-transparent to-[#080a1b]/25" />

      <AnimatePresence>
        {isHolding && (
          <motion.div
            className="pointer-events-none fixed bottom-7 left-1/2 z-20 -translate-x-1/2 rounded-full border border-cyan-100/20 bg-[#101329]/80 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-100/80 backdrop-blur-xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            Hold to preview repository
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        className="profile-header"
        initial={reduceMotion ? false : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <a href={`https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noreferrer" className="group flex items-center gap-3" aria-label="Visit GitHub profile">
          <span className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/6 text-cyan-100 shadow-[0_0_24px_rgba(153,196,255,0.12)] transition group-hover:border-fuchsia-200/50 group-hover:shadow-[0_0_30px_rgba(255,155,209,0.25)]"><Orbit size={19} /></span>
          <span className="font-display text-sm font-semibold tracking-[0.16em] text-white/85">HwangT<span className="text-fuchsia-300">.</span></span>
        </a>
        <nav className="top-actions" aria-label="Main navigation">
          <button className="explore-button" onClick={() => setShowProjects(value => !value)} aria-expanded={showProjects} aria-controls="project-list"><Sparkles size={15} /> Projects</button>
          <a href={'https://github.com/' + GITHUB_USERNAME} target="_blank" rel="noreferrer"><GitBranch size={15} /> GitHub <ArrowUpRight size={14} /></a>
        </nav>
      </motion.header>

      <section className="intro-layout" aria-labelledby="intro-title">
        <motion.div
          className="intro-content"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.12, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <div className="personal-heading">
            <p className="intro-eyebrow"><span /> PERSONAL SPACE / PORTFOLIO</p>
            <h1 id="intro-title">Xin chào, mình là<br /><span className="cosmic-gradient">{personalProfile.name}.</span></h1>
            <p className="personal-tagline">Ý tưởng của bạn. Trải nghiệm chúng ta cùng tạo ra.</p>
          </div>

          <article className="personal-card" aria-label="Hồ sơ cá nhân">
            <div className="personal-identity">
              <div className="personal-avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" width="60" height="60" /> : <Code2 size={27} />}<span /></div>
              <div><h2>{profile?.name || personalProfile.name}</h2><p>{personalProfile.role}</p></div>
              <span className="personal-monogram" aria-hidden="true">&lt;/&gt;</span>
            </div>
            <div className="personal-tabs" role="tablist" aria-label="Thông tin profile">
              {[['about', 'Giới thiệu'], ['skills', 'Kỹ năng']].map(([id, label]) => <button key={id} id={'tab-' + id} role="tab" aria-selected={profileTab === id} aria-controls={'panel-' + id} tabIndex={profileTab === id ? 0 : -1} onClick={() => setProfileTab(id)} onKeyDown={event => {
                if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                  event.preventDefault();
                  const next = event.key === 'Home' ? 'about' : event.key === 'End' ? 'skills' : id === 'about' ? 'skills' : 'about';
                  setProfileTab(next); document.getElementById('tab-' + next)?.focus();
                }
              }}>{id === 'about' ? <Layers size={14} /> : <Code2 size={14} />}{label}</button>)}
            </div>

            <div className="personal-panel">
              <div className="about-panel" id="panel-about" role="tabpanel" aria-labelledby="tab-about" tabIndex={0} hidden={profileTab !== "about"}>
                <p className="personal-intro">{personalProfile.intro}</p>
                <p className="personal-detail">{personalProfile.detail}</p>
                <div className="focus-grid" aria-label="Lĩnh vực chuyên môn">
                  {[Layers, Gamepad2, Globe, Cpu].map((Icon, index) => <div key={personalProfile.areas[index]}><Icon size={17} /><span>{personalProfile.areas[index]}</span></div>)}
                </div>
              </div><div className="expertise-panel" id="panel-skills" role="tabpanel" aria-labelledby="tab-skills" tabIndex={0} hidden={profileTab !== "skills"}>
                <p className="expertise-caption">NGÔN NGỮ CHỦ ĐẠO <span>Tự đánh giá</span></p>
                {personalProfile.skills.map(skill => <div className="expertise-row" key={skill.name} style={{ '--skill-color': skill.color }}>
                  <span className="expertise-mark">{skill.mark}</span>
                  <div className="expertise-info"><h3>{skill.name}</h3><p>{skill.context}</p></div>
                  <span className="expertise-level">{skill.level}</span>
                </div>)}
                <p className="embedded-note"><Cpu size={14} /><span><strong>Hệ thống nhúng</strong> · Kiến thức bổ trợ</span></p>
              </div>
            </div>
            <div className="personal-footer">
              <span><span className="personal-status-dot" />{loadError ? 'Khám phá dự án trên GitHub' : loaded ? repositories.length + ' dự án công khai' : 'Đang kết nối GitHub'}</span>
              <a href={'https://github.com/' + GITHUB_USERNAME} target="_blank" rel="noreferrer">@{GITHUB_USERNAME}<ArrowUpRight size={13} /></a>
            </div>
          </article>
        </motion.div>
      </section>
      {showProjects && <section className="project-drawer" id="project-list" aria-label="Public projects">
        <div className="drawer-heading"><div><p>THE CONSTELLATION</p><h2>Explore my projects</h2></div><button onClick={() => setShowProjects(false)} aria-label="Close project list"><X size={18} /></button></div>
        <div className="project-list">{repositories.map(repository => <button key={repository.id} onClick={() => { selectRepository(repository); setShowProjects(false); }}><span><strong>{repository.name}</strong><small>{repository.language || "Open source"}</small></span><ArrowUpRight size={16} /></button>)}</div>
        {!repositories.length && <p>{loadError ? "GitHub is unavailable. Visit the profile to explore projects." : loaded ? "No public projects yet." : "Loading projects…"}</p>}
      </section>}
      <AnimatePresence mode="wait">
        {activeRepository && (
          <motion.aside
            key={activeRepository.id}
            className="fixed bottom-20 right-5 z-30 w-[min(360px,calc(100vw-40px))] sm:bottom-24 sm:right-8"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            aria-live="polite"
          >
            <button className="close-preview" onClick={dismissRepository} aria-label="Close project preview"><X size={16} /></button>
            <a href={activeRepository.html_url} target="_blank" rel="noreferrer" className="group block rounded-2xl border border-white/15 bg-[#111329]/85 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.5),0_0_40px_rgba(151,131,255,0.12)] backdrop-blur-2xl transition hover:border-cyan-100/35">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-100/65">{activeRepository.full_name}</p>
                  <h2 className="mt-2 wrap-break-word font-display text-xl font-semibold tracking-tight text-white">{activeRepository.name}</h2>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 text-fuchsia-200 transition group-hover:rotate-45 group-hover:border-fuchsia-200/30"><ArrowUpRight size={17} /></span>
              </div>
              {activeRepository.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-indigo-100/65">{activeRepository.description}</p>}
              <div className="mt-4 flex items-center gap-4 font-mono text-[11px] text-white/55">
                {activeRepository.language && <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-fuchsia-200" />{activeRepository.language}</span>}
                <span className="flex items-center gap-1.5"><Star size={12} className="text-cyan-100" />{formatCount(activeRepository.stargazers_count)}</span>
                <span className="ml-auto text-cyan-100/75">Open project ↗</span>
              </div>
            </a>
          </motion.aside>
        )}
      </AnimatePresence>
    </main></MotionConfig></LazyMotion>
  );
}
