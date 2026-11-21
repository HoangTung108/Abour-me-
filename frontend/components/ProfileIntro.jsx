import { useState } from "react";
import { m as motion } from "framer-motion";
import { ArrowUpRight, Code2, Cpu, Gamepad2, Globe, Layers, Star } from "lucide-react";
import { personalProfile } from "../profile.js";

export default function ProfileIntro({ username, profile, reduceMotion, projectCount, loaded, loadError, projectApiError, hasProjectApi }) {
  const [profileTab, setProfileTab] = useState("about");
  const [avatarUnavailable, setAvatarUnavailable] = useState(false);

  return (
    <section className="intro-layout" aria-labelledby="intro-title">
      <motion.div
        className="intro-content"
        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.12, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <div className="personal-heading">
          <p className="intro-eyebrow"><span /> PORTFOLIO</p>
          <h1 id="intro-title">Hello, I’m <span className="cosmic-gradient">{personalProfile.name}.</span></h1>
        </div>

        <article className="personal-card" aria-label="Personal profile">
          <div className="personal-identity">
            <div className="personal-avatar">{avatarUnavailable ? <Code2 size={27} /> : <img src={`https://github.com/${username}.png?size=120`} alt="" width="60" height="60" onError={() => { console.warn("Could not load GitHub avatar"); setAvatarUnavailable(true); }} />}<span /></div>
            <div><h2>{profile?.name || personalProfile.name}</h2><p>{personalProfile.role}</p></div>
            <span className="personal-monogram" aria-hidden="true">&lt;/&gt;</span>
          </div>
          <div className="personal-tabs" role="tablist" aria-label="Profile information">
            {[['about', 'About'], ['skills', 'Skills']].map(([id, label]) => <button key={id} id={'tab-' + id} role="tab" aria-selected={profileTab === id} aria-controls={'panel-' + id} tabIndex={profileTab === id ? 0 : -1} onClick={() => setProfileTab(id)} onKeyDown={event => {
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
              <div className="focus-grid" aria-label="Areas of expertise">
                {[Layers, Gamepad2, Globe, Cpu].map((Icon, index) => <div key={personalProfile.areas[index]}><Icon size={17} /><span>{personalProfile.areas[index]}</span></div>)}
              </div>
            </div><div className="expertise-panel" id="panel-skills" role="tabpanel" aria-labelledby="tab-skills" tabIndex={0} hidden={profileTab !== "skills"}>
              <p className="expertise-caption">PRIMARY LANGUAGES <span>Self-assessed</span></p>
              {personalProfile.skills.map(skill => <div className="expertise-row" key={skill.name} style={{ '--skill-color': skill.color }}>
                <span className="expertise-mark">{skill.mark}</span>
                <div className="expertise-info"><h3>{skill.name}</h3><p>{skill.context}</p></div>
                <span className="expertise-rating" role="img" aria-label={skill.name + ': ' + skill.rating + '/5 sao'}>
                  <span className="rating-stars" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={12} className={index < skill.rating ? 'is-filled' : 'is-empty'} />)}</span>
                  </span>
              </div>)}
              <p className="embedded-note"><Cpu size={14} /><span><strong>Embedded systems</strong> · Additional knowledge</span></p>
            </div>
          </div>
          <div className="personal-footer">
            <span><span className="personal-status-dot" />{loadError ? `${projectCount} project${projectCount === 1 ? '' : 's'} · Saved GitHub data` : loaded ? projectCount + ` public project${projectCount === 1 ? '' : 's'}` : 'Connecting to GitHub'}</span>
            <a href={'https://github.com/' + username} target="_blank" rel="noreferrer">@{username}<ArrowUpRight size={13} /></a>
          </div>
          {projectApiError && <p className="mt-2 text-[10px] text-amber-200/80" role="status">Added projects unavailable. Reconnecting…</p>}
          {!hasProjectApi && <p className="mt-2 text-[10px] text-amber-200/80" role="status">Additional projects require a configured backend.</p>}
        </article>
      </motion.div>
    </section>
  );
}
