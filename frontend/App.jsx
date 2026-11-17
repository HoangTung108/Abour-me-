import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles, Stars } from "@react-three/drei";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight, GitBranch, Orbit, Sparkles as SparkleIcon, Star } from "lucide-react";
import { AdditiveBlending, BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, SRGBColorSpace } from "three";

const GITHUB_USERNAME = "HoangTung108";
const STAR_COLORS = ["#a9eaff", "#c0aaff", "#ff9bd1", "#e0d4ff"];

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

function GalaxyDust() {
  const geometry = useMemo(() => {
    const count = 16000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const random = seededRandom(108);
    const palette = [new Color("#d9e8ff"), new Color("#aec8ff"), new Color("#a999e7"), new Color("#f0bedf")];
    const angle = 0.39;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let index = 0; index < count; index += 1) {
      const along = (random() * 2 - 1) * 13.2;
      const cross = gaussian(random) * (0.62 + random() * 0.48) + Math.sin(along * 0.53) * 0.18;
      const offset = index * 3;
      const color = palette[Math.floor(random() * palette.length)].clone();
      const brightness = Math.max(0.35, 1 - Math.abs(cross) * 0.22) * (0.66 + random() * 0.55);

      positions[offset] = along * cos - cross * sin;
      positions[offset + 1] = along * sin + cross * cos;
      positions[offset + 2] = (random() - 0.5) * 0.9;
      colors[offset] = color.r * brightness;
      colors[offset + 1] = color.g * brightness;
      colors[offset + 2] = color.b * brightness;
    }

    const result = new BufferGeometry();
    result.setAttribute("position", new Float32BufferAttribute(positions, 3));
    result.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return result;
  }, []);

  return (
    <points geometry={geometry} rotation={[0.02, -0.08, 0]}>
      <pointsMaterial
        size={0.024}
        sizeAttenuation
        transparent
        opacity={0.78}
        vertexColors
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function MilkyWayCloud() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1536;
    canvas.height = 640;
    const context = canvas.getContext("2d");
    const random = seededRandom(731);
    const band = context.createLinearGradient(0, 0, 0, canvas.height);

    band.addColorStop(0, "rgba(115, 151, 255, 0)");
    band.addColorStop(0.23, "rgba(107, 138, 225, 0.035)");
    band.addColorStop(0.42, "rgba(165, 165, 247, 0.11)");
    band.addColorStop(0.5, "rgba(222, 219, 255, 0.24)");
    band.addColorStop(0.57, "rgba(164, 170, 239, 0.12)");
    band.addColorStop(0.78, "rgba(103, 134, 220, 0.035)");
    band.addColorStop(1, "rgba(115, 151, 255, 0)");
    context.fillStyle = band;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "screen";

    for (let index = 0; index < 1500; index += 1) {
      const x = random() * canvas.width;
      const y = canvas.height * 0.5 + gaussian(random) * 91;
      const radius = 18 + random() * 92;
      const alpha = 0.018 + random() * 0.05;
      const tint = random() > 0.72 ? "185, 164, 255" : "169, 202, 255";
      const cloud = context.createRadialGradient(x, y, 0, x, y, radius);
      cloud.addColorStop(0, `rgba(${tint}, ${alpha})`);
      cloud.addColorStop(1, `rgba(${tint}, 0)`);
      context.fillStyle = cloud;
      context.beginPath();
      context.ellipse(x, y, radius, radius * (0.22 + random() * 0.46), random() * Math.PI, 0, Math.PI * 2);
      context.fill();
    }

    context.globalCompositeOperation = "multiply";
    context.lineCap = "round";
    for (let lane = 0; lane < 7; lane += 1) {
      context.beginPath();
      context.moveTo(0, canvas.height * (0.39 + lane * 0.035));
      for (let x = 0; x <= canvas.width; x += 64) {
        const y = canvas.height * (0.4 + lane * 0.035) + Math.sin(x * 0.009 + lane) * 35 + gaussian(random) * 12;
        context.lineTo(x, y);
      }
      context.strokeStyle = "rgba(8, 11, 28, 0.09)";
      context.lineWidth = 5 + random() * 13;
      context.stroke();
    }

    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, []);

  return (
    <mesh position={[0, 0, -0.75]} rotation={[0, 0, 0.39]}>
      <planeGeometry args={[28, 9.5]} />
      <meshBasicMaterial map={texture} transparent opacity={0.82} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
    </mesh>
  );
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

function RepositoryStar({ repository, index, total, viewWidth, viewHeight, onHover, onSelect }) {
  const position = useMemo(() => {
    const angle = 0.39;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const maxAlong = Math.min((viewWidth * 0.47) / cos, (viewHeight * 0.45) / sin);
    const along = ((index + 0.5) / total - 0.5) * maxAlong * 1.8 + Math.sin(index * 11.7) * 0.16;
    const cross = Math.sin(index * 5.83) * 1.05;
    return [along * cos - cross * sin, along * sin + cross * cos, (index % 5) * 0.14 - 0.2];
  }, [index, total, viewWidth, viewHeight]);
  const color = STAR_COLORS[index % STAR_COLORS.length];
  const size = 0.075 + Math.min(Math.log2(repository.stargazers_count + 1) * 0.025, 0.13);

  return (
    <Float speed={0.7 + (index % 5) * 0.12} rotationIntensity={0.4} floatIntensity={0.2}>
      <group position={position}>
        <mesh
          onPointerOver={(event) => {
            event.stopPropagation();
            document.body.style.cursor = "pointer";
            onHover(repository);
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
            onHover(null);
          }}
          onFocus={() => onHover(repository)}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(repository);
          }}
        >
          <octahedronGeometry args={[size, 0]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[size * 3.2, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.08} depthWrite={false} />
        </mesh>
      </group>
    </Float>
  );
}

function GalaxyContents({ repositories, onHover, onSelect, reduceMotion }) {
  const { viewport } = useThree();
  const galaxy = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const trackPointer = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", trackPointer, { passive: true });
    return () => window.removeEventListener("pointermove", trackPointer);
  }, []);

  useFrame((_, delta) => {
    if (!galaxy.current || reduceMotion) return;
    const smoothing = 1 - Math.exp(-delta * 1.5);
    galaxy.current.rotation.y += (pointer.current.x * 0.035 - galaxy.current.rotation.y) * smoothing;
    galaxy.current.rotation.x += (-pointer.current.y * 0.025 - galaxy.current.rotation.x) * smoothing;
    galaxy.current.rotation.z += delta * 0.003;
  });

  return (
    <group ref={galaxy}>
      <ambientLight intensity={0.35} />
      <Stars radius={100} depth={65} count={4200} factor={1.8} saturation={0.35} fade speed={0.12} />
      <Sparkles count={75} scale={[22, 14, 9]} size={1.8} speed={0.12} opacity={0.35} color="#c4d6ff" />
      <MilkyWayCloud />
      <GalaxyDust />
      <GalaxyCore />
      {repositories.map((repository, index) => (
        <RepositoryStar
          key={repository.id}
          repository={repository}
          index={index}
          total={repositories.length}
          viewWidth={viewport.width}
          viewHeight={viewport.height}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

function GalaxyScene({ repositories, onHover, onSelect, onBackgroundClick }) {
  return (
    <Canvas
      className="galaxy-canvas"
      camera={{ position: [0, 0, 15], fov: 48 }}
      dpr={[1, 1.3]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={onBackgroundClick}
    >
      <GalaxyContents repositories={repositories} onHover={onHover} onSelect={onSelect} reduceMotion={useReducedMotion()} />
    </Canvas>
  );
}

function formatCount(count) {
  return new Intl.NumberFormat("en", { notation: count > 999 ? "compact" : "standard" }).format(count || 0);
}

export default function App() {
  const [repositories, setRepositories] = useState([]);
  const [hoveredRepository, setHoveredRepository] = useState(null);
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const hideTimer = useRef(null);
  const reduceMotion = useReducedMotion();
  const activeRepository = hoveredRepository || selectedRepository;

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

  const handleStarHover = useCallback((repository) => {
    clearTimeout(hideTimer.current);
    if (repository) setHoveredRepository(repository);
    else {
      hideTimer.current = setTimeout(() => setHoveredRepository(null), 420);
    }
  }, []);

  const selectRepository = useCallback((repository) => {
    setSelectedRepository((selected) => selected?.id === repository.id ? null : repository);
    setHoveredRepository(repository);
  }, []);

  const dismissRepository = useCallback(() => {
    clearTimeout(hideTimer.current);
    setHoveredRepository(null);
    setSelectedRepository(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") dismissRepository();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissRepository]);

  const explore = () => {
    if (repositories.length) selectRepository(repositories[Math.floor(Math.random() * repositories.length)]);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070916] text-white selection:bg-fuchsia-200 selection:text-indigo-950">
      <div className="cosmic-wash" aria-hidden="true" />
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <GalaxyScene
          repositories={repositories}
          onHover={handleStarHover}
          onSelect={selectRepository}
          onBackgroundClick={dismissRepository}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-1 bg-linear-to-r from-[#080a1b]/72 via-[#080a1b]/32 to-transparent md:from-[#080a1b]/68 md:via-[#080a1b]/16" />
      <div className="pointer-events-none absolute inset-0 z-1 bg-linear-to-t from-[#080a1b]/58 via-transparent to-[#080a1b]/25" />

      <motion.header
        className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-16"
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

      <section className="relative z-10 flex min-h-[calc(100svh-88px)] items-center px-6 pb-24 pt-4 sm:px-10 lg:px-16" aria-labelledby="intro-title">
        <motion.div
          className="max-w-165"
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
            Welcome to my corner of the universe. Every glowing star is a public GitHub project—hover to discover it, or open one to explore the code.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" onClick={explore} className="group inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#101126] shadow-[0_6px_40px_rgba(161,212,255,0.2)] transition hover:-translate-y-0.5 hover:bg-cyan-100 hover:shadow-[0_10px_45px_rgba(161,212,255,0.32)]">
              Explore a project <SparkleIcon size={16} className="transition group-hover:rotate-12" />
            </button>
            <a href={`https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/4.5 px-5 py-3 text-sm font-medium text-white/80 backdrop-blur-md transition hover:border-fuchsia-200/40 hover:bg-white/10 hover:text-white">
              <GitBranch size={16} /> GitHub profile <ArrowUpRight size={15} />
            </a>
          </div>

          <div className="mt-9 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-indigo-100/45">
            <span className="flex size-6 items-center justify-center rounded-full border border-white/10"><Star size={11} /></span>
            {loadError ? "GitHub is temporarily unavailable" : repositories.length ? `${repositories.length} public projects in orbit` : "Connecting to GitHub"}
          </div>
        </motion.div>
      </section>

      <motion.div className="pointer-events-none absolute bottom-6 left-6 z-10 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/35 sm:left-10 lg:left-16" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
        <ArrowDown size={13} className="animate-bounce" /> Move through the stars
      </motion.div>

      <AnimatePresence mode="wait">
        {activeRepository && (
          <motion.aside
            key={activeRepository.id}
            className="fixed bottom-6 right-5 z-30 w-[min(360px,calc(100vw-40px))] sm:bottom-8 sm:right-8"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onMouseEnter={() => clearTimeout(hideTimer.current)}
            onMouseLeave={() => {
              if (!selectedRepository) setHoveredRepository(null);
            }}
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