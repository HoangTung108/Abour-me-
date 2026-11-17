import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, GitBranch, Orbit, Star } from "lucide-react";
import { AdditiveBlending, BufferGeometry, CanvasTexture, Float32BufferAttribute } from "three";

const GITHUB_USERNAME = "HoangTung108";
const STAR_COLOR = "#c5e8ff";
const ignoreRaycast = () => null;
const MAX_INTERACTIVE_STARS = 1000;

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function gaussian(random) {
  return Math.sqrt(-2 * Math.log(Math.max(random(), 0.0001))) * Math.cos(2 * Math.PI * random());
}

function GalaxyDust({ lowPower }) {
  const geometry = useMemo(() => {
    const count = lowPower ? 1400 : 3600;
    const positions = new Float32Array(count * 3);
    const random = seededRandom(108);
    const angle = 0.39;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let index = 0; index < count; index += 1) {
      const along = (random() * 2 - 1) * 17.5;
      const across = gaussian(random) * (0.8 + random() * 0.6) + Math.sin(along * 0.31) * 0.25;
      const offset = index * 3;
      positions[offset] = along * cos - across * sin;
      positions[offset + 1] = along * sin + across * cos;
      positions[offset + 2] = (random() - 0.5) * 0.6;
    }

    const result = new BufferGeometry();
    result.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return result;
  }, [lowPower]);

  return (
    <points geometry={geometry} rotation={[0.02, -0.08, 0]}>
      <pointsMaterial
        size={0.028}
        sizeAttenuation
        transparent
        opacity={0.34}
        color="#a8c9f3"
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function createConstellations(repositories, viewport, seed) {
  const random = seededRandom(seed);
  const clusterCount = Math.ceil(repositories.length / 4);
  const clusterRadius = Math.min(1.35, viewport.width * 0.055, viewport.height * 0.07);
  const safeHalfWidth = Math.max(0.5, viewport.width * 0.5 - clusterRadius - 0.35);
  const safeHalfHeight = Math.max(0.5, viewport.height * 0.5 - clusterRadius - 0.45);
  const xMin = Math.max(viewport.width * 0.12, -safeHalfWidth);
  const xMax = Math.min(viewport.width * 0.38, safeHalfWidth);
  const yMax = Math.min(viewport.height * 0.34, safeHalfHeight);
  const clusterCenters = [];

  for (let cluster = 0; cluster < clusterCount; cluster += 1) {
    let center = null;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const x = xMin + random() * (xMax - xMin);
      const y = (random() * 2 - 1) * yMax;
      center = [x, y];
      if (clusterCenters.every(([otherX, otherY]) => Math.hypot(otherX - x, otherY - y) > Math.min(2.8, viewport.width * 0.12))) break;
    }
    clusterCenters.push(center);
  }

  const positions = [];
  const groups = Array.from({ length: clusterCount }, () => []);
  repositories.forEach((repository, index) => {
    const clusterIndex = Math.min(clusterCount - 1, Math.floor(index * clusterCount / repositories.length));
    const [centerX, centerY] = clusterCenters[clusterIndex];
    const group = groups[clusterIndex];
    const radius = clusterRadius * (0.25 + random() * 0.75);
    const angle = random() * Math.PI * 2;
    const position = [
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius * 0.82,
      (random() - 0.5) * 0.8,
    ];
    positions[index] = position;
    group.push(index);
  });

  const connections = [];
  groups.forEach((group) => {
    if (group.length < 2) return;
    const [centerX, centerY] = clusterCenters[groups.indexOf(group)];
    const ordered = [...group].sort((a, b) => {
      const positionA = positions[a];
      const positionB = positions[b];
      return Math.atan2(positionA[1] - centerY, positionA[0] - centerX) - Math.atan2(positionB[1] - centerY, positionB[0] - centerX);
    });

    ordered.forEach((index, orderedIndex) => {
      const next = ordered[(orderedIndex + 1) % ordered.length];
      connections.push(...positions[index], ...positions[next]);
    });
    if (ordered.length >= 4) connections.push(...positions[ordered[0]], ...positions[ordered[2]]);
  });

  return { positions, connectionPositions: new Float32Array(connections) };
}

function GalaxyCore() {
  return (
    <group>
      <mesh position={[0.4, 0.15, -0.35]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#e7e4ff" toneMapped={false} />
      </mesh>
      <mesh position={[0.4, 0.15, -0.3]}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshBasicMaterial color="#a6baff" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ShootingStar({ index, viewWidth, viewHeight }) {
  const streak = useRef(null);
  const cycle = 8 + index * 3.7;
  const duration = 0.72;
  const startX = -viewWidth * (0.32 + index * 0.08);
  const startY = viewHeight * (0.26 - index * 0.18);

  useFrame(({ clock }) => {
    if (!streak.current) return;
    const phase = (clock.elapsedTime + index * 2.8) % cycle;
    const progress = phase / duration;
    const visible = phase < duration;
    streak.current.visible = visible;
    if (!visible) return;

    const eased = progress * progress * (3 - 2 * progress);
    streak.current.position.set(startX + eased * viewWidth * 0.38, startY - eased * viewHeight * 0.22, 1.7);
    streak.current.scale.setScalar(Math.sin(progress * Math.PI) * 0.9 + 0.1);
  });

  return (
    <group ref={streak} rotation={[0, 0, -0.5]}>
      <mesh scale={[0.5, 0.012, 0.012]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial color="#f4eaff" transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <mesh position={[0.32, 0, 0]}>
        <sphereGeometry args={[0.035, 10, 8]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  );
}

function RepositoryStar({ repository, index, position, glowTexture, onHoldStart, onHoldEnd, onSelect }) {
  const holdTimer = useRef(null);
  const holdTriggered = useRef(false);
  const isHolding = useRef(false);
  const color = STAR_COLOR;
  const size = 0.105 + Math.min(Math.log2(repository.stargazers_count + 1) * 0.025, 0.1);
  const interactive = index < MAX_INTERACTIVE_STARS;

  useEffect(() => () => clearTimeout(holdTimer.current), []);

  return (
    <group position={position}>
      <sprite scale={[size * 12, size * 12, 1]} raycast={ignoreRaycast}>
        <spriteMaterial
          map={glowTexture}
          color={color}
          transparent
          opacity={0.96}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      {interactive && <mesh
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(event) => {
          document.body.style.cursor = "";
          clearTimeout(holdTimer.current);
          if (isHolding.current) {
            isHolding.current = false;
            onHoldEnd();
          }
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          holdTriggered.current = false;
          isHolding.current = true;
          onHoldStart();
          clearTimeout(holdTimer.current);
          holdTimer.current = setTimeout(() => {
            holdTriggered.current = true;
            onSelect(repository);
          }, 460);
        }}
        onPointerUp={(event) => {
          event.stopPropagation();
          clearTimeout(holdTimer.current);
          if (isHolding.current) {
            isHolding.current = false;
            onHoldEnd();
          }
        }}
        onPointerCancel={() => {
          clearTimeout(holdTimer.current);
          isHolding.current = false;
          onHoldEnd();
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (holdTriggered.current) {
            holdTriggered.current = false;
            return;
          }
          onSelect(repository);
        }}
      >
        <sphereGeometry args={[size * 2.4, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>}
      <mesh raycast={ignoreRaycast}>
        <sphereGeometry args={[size * 0.68, 8, 8]} />
        <meshBasicMaterial color="#f2faff" toneMapped={false} />
      </mesh>
    </group>
  );
}

function GalaxyContents({ repositories, onSelect, onHoldStart, onHoldEnd, reduceMotion, lowPower }) {
  const { viewport, invalidate } = useThree();
  const galaxy = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const lastFrame = useRef(-1);
  const frameTimer = useRef(null);
  const scatterSeed = useRef(Math.floor(Math.random() * 0xffffffff));
  const constellations = useMemo(
    () => createConstellations(repositories, viewport, scatterSeed.current),
    [repositories, viewport.width, viewport.height],
  );
  const connectionGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(constellations.connectionPositions, 3));
    return geometry;
  }, [constellations.connectionPositions]);
  const glowTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(16, 16, 0.5, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.12, "rgba(255,255,255,0.68)");
    gradient.addColorStop(0.36, "rgba(255,255,255,0.22)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  useEffect(() => {
    const trackPointer = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", trackPointer, { passive: true });
    const wake = () => {
      if (document.hidden) {
        window.clearTimeout(frameTimer.current);
        frameTimer.current = null;
      } else {
        invalidate();
      }
    };
    document.addEventListener("visibilitychange", wake);
    invalidate();
    return () => {
      window.removeEventListener("pointermove", trackPointer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [invalidate]);

  useEffect(() => () => window.clearTimeout(frameTimer.current), []);

  useFrame((state, delta) => {
    const { clock } = state;
    if (!galaxy.current || reduceMotion || document.hidden) return;
    // Demand-render at 24 FPS: sufficient for slow space motion and lighter on GPU/CPU.
    if (clock.elapsedTime - lastFrame.current < 1 / 24) return;
    lastFrame.current = clock.elapsedTime;
    const smoothing = 1 - Math.exp(-delta * 1.5);
    galaxy.current.rotation.y += (pointer.current.x * 0.035 - galaxy.current.rotation.y) * smoothing;
    galaxy.current.rotation.x += (-pointer.current.y * 0.025 - galaxy.current.rotation.x) * smoothing;
    galaxy.current.rotation.z = Math.sin(clock.elapsedTime * 0.035) * 0.004;
    window.clearTimeout(frameTimer.current);
    frameTimer.current = window.setTimeout(() => {
      frameTimer.current = null;
      if (!document.hidden) state.invalidate();
    }, 1000 / 24);
  });

  return (
    <group ref={galaxy}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 7, 12]} color="#d7d9ff" intensity={1.6} />
      <GalaxyDust lowPower={lowPower} />
      <GalaxyCore />
      {!lowPower && !reduceMotion && <ShootingStar index={0} viewWidth={viewport.width} viewHeight={viewport.height} />}
      {constellations.connectionPositions.length > 0 && (
        <lineSegments geometry={connectionGeometry} raycast={ignoreRaycast}>
          <lineBasicMaterial color="#9dd9ff" transparent opacity={0.42} blending={AdditiveBlending} depthWrite={false} />
        </lineSegments>
      )}
      {repositories.map((repository, index) => (
        <RepositoryStar
          key={repository.id}
          repository={repository}
          index={index}
          position={constellations.positions[index]}
          glowTexture={glowTexture}
          onHoldStart={onHoldStart}
          onHoldEnd={onHoldEnd}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

function GalaxyScene({ repositories, onSelect, onHoldStart, onHoldEnd, onBackgroundClick }) {
  const lowPower = typeof window !== "undefined" && (
    window.matchMedia("(max-width: 700px)").matches ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4)
  );
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas
      className="galaxy-canvas"
      camera={{ position: [0, 0, 19], fov: 52 }}
      dpr={1}
      frameloop="demand"
      gl={{ alpha: true, antialias: false, powerPreference: "low-power", stencil: false, depth: true, preserveDrawingBuffer: false }}
      performance={{ min: 0.55 }}
      onPointerMissed={onBackgroundClick}
    >
      <GalaxyContents repositories={repositories} onSelect={onSelect} onHoldStart={onHoldStart} onHoldEnd={onHoldEnd} reduceMotion={reduceMotion} lowPower={lowPower} />
    </Canvas>
  );
}

function formatCount(count) {
  return new Intl.NumberFormat("en", { notation: count > 999 ? "compact" : "standard" }).format(count || 0);
}

export default function App() {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [isHolding, setIsHolding] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const reduceMotion = useReducedMotion();
  const activeRepository = selectedRepository;

  useEffect(() => {
    const controller = new AbortController();

    fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
        return response.json();
      })
      .then((data) => setRepositories(data.filter((repository) => !repository.private)))
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(true);
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
      if (event.key === "Escape") dismissRepository();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissRepository]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#070916] text-white selection:bg-fuchsia-200 selection:text-indigo-950">
      <div className="cosmic-wash" aria-hidden="true" />
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <GalaxyScene
          repositories={repositories}
          onSelect={selectRepository}
          onHoldStart={beginHold}
          onHoldEnd={endHold}
          onBackgroundClick={dismissRepository}
        />
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
            Release to preview repository
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-16"
        initial={reduceMotion ? false : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <a href={`https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noreferrer" className="group flex items-center gap-3" aria-label="Visit GitHub profile">
          <span className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/6 text-cyan-100 shadow-[0_0_24px_rgba(153,196,255,0.12)] transition group-hover:border-fuchsia-200/50 group-hover:shadow-[0_0_30px_rgba(255,155,209,0.25)]"><Orbit size={19} /></span>
          <span className="font-display text-sm font-semibold tracking-[0.16em] text-white/85">HT<span className="text-fuchsia-300">.</span></span>
        </a>
        <a href={`https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/4.5 px-4 py-2 text-sm text-white/70 backdrop-blur-md transition hover:border-cyan-200/40 hover:text-white sm:flex">
          <GitBranch size={16} /> GitHub <ArrowUpRight size={14} />
        </a>
      </motion.header>

      <section className="pointer-events-none absolute inset-0 z-10 flex items-center px-6 pb-12 pt-24 sm:px-10 sm:pb-16 lg:px-16" aria-labelledby="intro-title">
        <motion.div
          className="pointer-events-none max-w-165"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.12, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/6 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-100/85 backdrop-blur-md">
            <span className="relative flex size-1.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-200 opacity-70" /><span className="relative inline-flex size-1.5 rounded-full bg-cyan-200" /></span>
            Software developer · Vietnam
          </div>

          <h1 id="intro-title" className="font-display text-[clamp(3.35rem,8vw,7.3rem)] font-medium leading-[0.91] tracking-[-0.075em] text-white drop-shadow-[0_4px_35px_rgba(11,11,34,0.6)]">
            My work,<br />written in <span className="cosmic-gradient">starlight.</span>
          </h1>

          <p className="mt-7 max-w-117.5 text-sm leading-7 text-indigo-100/70 sm:text-base sm:leading-8">
            Welcome to my corner of the universe. Press and hold any glowing star to preview its public GitHub repository.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={`https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noreferrer" className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/4.5 px-5 py-3 text-sm font-medium text-white/80 backdrop-blur-md transition hover:border-fuchsia-200/40 hover:bg-white/10 hover:text-white">
              <GitBranch size={16} /> GitHub profile <ArrowUpRight size={15} />
            </a>
          </div>

          <div className="mt-9 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-indigo-100/45">
            <span className="flex size-6 items-center justify-center rounded-full border border-white/10"><Star size={11} /></span>
            {loadError ? "GitHub is temporarily unavailable" : repositories.length ? `${repositories.length} public projects in orbit` : "Connecting to GitHub"}
          </div>
        </motion.div>
      </section>

      <AnimatePresence mode="wait">
        {activeRepository && (
          <motion.aside
            key={activeRepository.id}
            className="fixed bottom-6 right-5 z-30 w-[min(360px,calc(100vw-40px))] sm:bottom-8 sm:right-8"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            aria-live="polite"
          >
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
    </main>
  );
}