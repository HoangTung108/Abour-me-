import { useCallback, useEffect, useMemo, useState } from "react";
import { LazyMotion, MotionConfig, useReducedMotion } from "framer-motion";
import GalaxyBackground from "./components/GalaxyBackground.jsx";
import ProfileHeader from "./components/ProfileHeader.jsx";
import ProfileIntro from "./components/ProfileIntro.jsx";
import ProjectDrawer from "./components/ProjectDrawer.jsx";
import ProjectPreview from "./components/ProjectPreview.jsx";
import { loadGithubRepositories } from "./github-repositories.js";
import repositorySnapshot from "./repositories.json";

const loadMotion = () => import("./motion-features.js").then(module => module.default);
const GITHUB_USERNAME = "HoangTung108";
const PROJECT_API_BASE = import.meta.env.VITE_PROJECT_API_BASE_URL ?? (window.location.hostname.endsWith(".github.io") ? null : "");

export default function App() {
  const [showProjects, setShowProjects] = useState(false);
  function selectFromDrawer(repository) {
    selectRepository(repository);
    setShowProjects(false);
  }

  return (
    <LazyMotion features={loadMotion} strict>
      <MotionConfig reducedMotion="user">
        <main className="fixed inset-0 overflow-hidden bg-[#070916] text-white selection:bg-fuchsia-200 selection:text-indigo-950">
          <GalaxyBackground
            repositories={repositories}
            selectedRepository={selectedRepository}
            previewRepository={previewRepository}
            reduceMotion={reduceMotion}
            onSelect={selectRepository}
            onPreview={setPreviewRepository}
            onDismiss={dismissRepository}
          />
          <ProfileHeader
            username={GITHUB_USERNAME}
            reduceMotion={reduceMotion}
            showProjects={showProjects}
            onToggleProjects={() => setShowProjects(value => !value)}
          />
          <ProfileIntro
            username={GITHUB_USERNAME}
            profile={profile}
            reduceMotion={reduceMotion}
            projectCount={repositories.length}
            loaded={loaded}
            loadError={loadError}
            projectApiError={projectApiError}
            hasProjectApi={PROJECT_API_BASE !== null}
          />
          {showProjects && (
            <ProjectDrawer
              repositories={repositories}
              loaded={loaded}
              loadError={loadError}
              onClose={() => setShowProjects(false)}
              onSelect={selectFromDrawer}
            />
          )}
          <ProjectPreview
            activeRepository={activeRepository}
            isPreview={Boolean(previewRepository)}
            onDismiss={dismissRepository}
          />
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}
