import { Component, Suspense, lazy, useCallback, useEffect, useState } from "react";

const GalaxyScene = lazy(() => import("../GalaxyScene.jsx"));

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onUnavailable(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function GalaxyBackground({ repositories, selectedRepository, previewRepository, reduceMotion, onSelect, onPreview, onDismiss }) {
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneUnavailable, setSceneUnavailable] = useState(false);
  const unavailable = useCallback(() => setSceneUnavailable(true), []);

  useEffect(() => {
    const id = window.setTimeout(() => setSceneReady(true), 250);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      <div className="cosmic-wash" aria-hidden="true" />
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {sceneReady && !sceneUnavailable && <SceneBoundary onUnavailable={unavailable}><Suspense fallback={null}><GalaxyScene
          reduceMotion={Boolean(reduceMotion)} onUnavailable={unavailable}
          repositories={repositories}
          selectedRepository={selectedRepository}
          previewRepository={previewRepository}
          onSelect={onSelect}
          onPreview={onPreview}
          onBackgroundClick={onDismiss}
        /></Suspense></SceneBoundary>}
      </div>

      <div className="pointer-events-none absolute inset-0 z-1 bg-linear-to-r from-[#080a1b]/72 via-[#080a1b]/32 to-transparent md:from-[#080a1b]/68 md:via-[#080a1b]/16" />
      <div className="pointer-events-none absolute inset-0 z-1 bg-linear-to-t from-[#080a1b]/58 via-transparent to-[#080a1b]/25" />
    </>
  );
}
