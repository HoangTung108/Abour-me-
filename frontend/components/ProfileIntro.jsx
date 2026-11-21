import { useState } from "react";
import { m as motion } from "framer-motion";
import { ArrowUpRight, Briefcase, Code2, Cpu, Gamepad2, GraduationCap, Layers, Trophy } from "lucide-react";
import { personalProfile } from "../profile.js";

const tabs = [
  { id: "about", label: "About", Icon: Layers },
  { id: "skills", label: "Skills", Icon: Code2 },
  { id: "work", label: "Work", Icon: Briefcase },
  { id: "awards", label: "Awards", Icon: Trophy },
];

function ProfileEntries({ entries }) {
  return (
    <ul className="profile-entries">
      {entries.map(({ title, subtitle, description }) => (
        <li key={title}>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
          {description && <p>{description}</p>}
        </li>
      ))}
    </ul>
  );
}

export default function ProfileIntro({ username, reduceMotion, projectCount, loaded, loadError, projectApiError, hasProjectApi }) {
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
            <div><h2>{personalProfile.name}</h2><p>{personalProfile.role}</p></div>
            <span className="personal-monogram" aria-hidden="true">&lt;/&gt;</span>
          </div>
          <div className="personal-tabs" role="tablist" aria-label="Profile information">
            {tabs.map(({ id, label, Icon }, index) => (
              <button key={id} id={`tab-${id}`} role="tab" aria-selected={profileTab === id}
                aria-controls={`panel-${id}`} tabIndex={profileTab === id ? 0 : -1}
                onClick={() => setProfileTab(id)} onKeyDown={event => {
                  const targets = {
                    ArrowLeft: (index + tabs.length - 1) % tabs.length,
                    ArrowRight: (index + 1) % tabs.length,
                    Home: 0,
                    End: tabs.length - 1,
                  };
                  if (!Object.hasOwn(targets, event.key)) return;
                  event.preventDefault();
                  const next = tabs[targets[event.key]].id;
                  setProfileTab(next);
                  document.getElementById(`tab-${next}`)?.focus();
                }}>
                <Icon size={14} aria-hidden="true" />{label}
              </button>
            ))}
          </div>

          <div className="personal-panel">
            <div className="about-panel" id="panel-about" role="tabpanel" aria-labelledby="tab-about" tabIndex={0} hidden={profileTab !== "about"}>
              <p className="personal-intro">{personalProfile.intro}</p>
              <p className="personal-detail">{personalProfile.detail}</p>
              <div className="focus-grid" aria-label="Areas of expertise">
                {[Code2, Gamepad2, Cpu, GraduationCap].map((Icon, index) => <div key={personalProfile.areas[index]}><Icon size={17} /><span>{personalProfile.areas[index]}</span></div>)}
              </div>
              <p className="personal-detail">{personalProfile.education}</p>
              <p className="personal-detail">
                {personalProfile.english} · {personalProfile.location} · <a href={`mailto:${personalProfile.email}`}>Email me</a>
              </p>
            </div>
            <div className="expertise-panel" id="panel-skills" role="tabpanel" aria-labelledby="tab-skills" tabIndex={0} hidden={profileTab !== "skills"}>
              {personalProfile.skills.map(skill => (
                <div className="expertise-row" key={skill.name} style={{ "--skill-color": skill.color }}>
                  <span className="expertise-mark" aria-hidden="true">{skill.mark}</span>
                  <div className="expertise-info"><h3>{skill.name}</h3><p>{skill.context}</p></div>
                </div>
              ))}
            </div>
            <div id="panel-work" role="tabpanel" aria-labelledby="tab-work" tabIndex={0} hidden={profileTab !== "work"}>
              <h3 className="expertise-caption">WORK EXPERIENCE</h3>
              <ProfileEntries entries={personalProfile.experience} />
              <h3 className="expertise-caption">SELECTED PROJECTS</h3>
              <ProfileEntries entries={personalProfile.projects} />
            </div>
            <div id="panel-awards" role="tabpanel" aria-labelledby="tab-awards" tabIndex={0} hidden={profileTab !== "awards"}>
              <ProfileEntries entries={personalProfile.awards} />
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
