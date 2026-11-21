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
  const [loaded, setLoaded] = useState(false);
  const [githubRepositories, setGithubRepositories] = useState(repositorySnapshot);
  const [addedProjects, setAddedProjects] = useState([]);
  const [projectApiError, setProjectApiError] = useState(false);
  const repositories = useMemo(() => {
    const githubUrls = new Set(githubRepositories.map(repository => repository.html_url.replace(/\/$/, "").toLowerCase()));
    return [...githubRepositories, ...addedProjects.filter(project => !githubUrls.has(project.html_url.replace(/\/$/, "").toLowerCase()))];
  }, [githubRepositories, addedProjects]);
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('https://api.github.com/users/' + GITHUB_USERNAME, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Profile unavailable'); return response.json(); })
      .then(setProfile).catch(() => { /* Local introduction remains available. */ });
    return () => controller.abort();
  }, []);
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [previewRepository, setPreviewRepository] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const reduceMotion = useReducedMotion();
  const activeRepository = previewRepository || selectedRepository;
  useEffect(() => {
    const controller = new AbortController();
    let storage;
    try {
      storage = window.localStorage;
    } catch { /* Storage can be unavailable in private browsing. */ }
    loadGithubRepositories({ username: GITHUB_USERNAME, storage, signal: controller.signal })
      .then(({ repositories: data, error }) => {
        setGithubRepositories(data);
        setLoaded(true);
        if (error) {
          console.warn("Using saved GitHub projects:", error);
          setLoadError(true);
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error("Could not load GitHub projects:", error);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (PROJECT_API_BASE === null) return;
    let controller;
    let retryTimer;
    const events = new EventSource(`${PROJECT_API_BASE}/api/projects/events`);
    const refreshProjects = () => {
      clearTimeout(retryTimer);
      controller?.abort();
      controller = new AbortController();
      fetch(`${PROJECT_API_BASE}/api/projects`, { signal: controller.signal })
        .then(response => {
          if (!response.ok) throw new Error(`Project API returned ${response.status}`);
          return response.json();
        })
        .then(data => {
          if (!Array.isArray(data)) throw new Error("Invalid project API response");
          setAddedProjects(data);
          setProjectApiError(events.readyState !== EventSource.OPEN);
        })
        .catch(error => {
          if (error.name !== "AbortError") {
            console.error("Could not load added projects:", error);
            setProjectApiError(true);
            retryTimer = setTimeout(refreshProjects, 5000);
          }
        });
    };
    events.onmessage = refreshProjects;
    events.onerror = () => setProjectApiError(true);
    return () => {
      controller?.abort();
      clearTimeout(retryTimer);
      events.close();
    };
  }, []);

  const selectRepository = useCallback((repository) => {
    setSelectedRepository((selected) => selected?.id === repository.id ? null : repository);
  }, []);

  const dismissRepository = useCallback(() => {
    setSelectedRepository(null);
    setPreviewRepository(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") { dismissRepository(); setShowProjects(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissRepository]);

  function openRepository(repository) {
    let url;
    try {
      url = new URL(repository.html_url);
    } catch {
      return;
    }
    if (url.protocol === "https:" || url.protocol === "http:") {
      window.open(url.href, "_blank", "noopener,noreferrer");
    }
  }

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
            onSelect={openRepository}
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
