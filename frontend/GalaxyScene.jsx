import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute } from "three";
const ignoreRaycast = () => null;

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
  useEffect(() => () => geometry.dispose(), [geometry]);

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
    <mesh position={[0.4, 0.15, -0.35]} raycast={ignoreRaycast}>
      <planeGeometry args={[2.4, 2.4]} />
      <shaderMaterial transparent depthWrite={false} blending={AdditiveBlending}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`varying vec2 vUv; void main() { float d = length(vUv - 0.5); float halo = exp(-d * d * 55.0) * 0.15; float core = exp(-d * d * 2400.0); gl_FragColor = vec4(mix(vec3(0.55, 0.48, 1.0), vec3(0.9, 0.95, 1.0), core), halo + core); }`} />
    </mesh>
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

function RepositoryStars({ repositories, positions, onSelect, onHoldStart, onHoldEnd }) {
  const timer = useRef(null);
  const held = useRef(false);
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute("position", new Float32BufferAttribute(positions.flat(), 3));
    result.setAttribute("size", new Float32BufferAttribute(repositories.map(repo => 25 + Math.min(Math.log2(repo.stargazers_count + 1) * 4, 20)), 1));
    return result;
  }, [positions, repositories]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => { clearTimeout(timer.current); document.body.style.cursor = ""; }, []);
  const cancel = () => { clearTimeout(timer.current); onHoldEnd(); };
  return <points geometry={geometry}
    onPointerOver={event => { event.stopPropagation(); document.body.style.cursor = "pointer"; }}
    onPointerOut={() => { cancel(); document.body.style.cursor = ""; }}
    onPointerDown={event => {
      event.stopPropagation(); held.current = false; cancel(); onHoldStart();
      const repository = repositories[event.index];
      timer.current = setTimeout(() => { held.current = true; onSelect(repository); }, 460);
    }}
    onPointerUp={cancel} onPointerCancel={cancel}
    onClick={event => { event.stopPropagation(); if (!held.current) onSelect(repositories[event.index]); held.current = false; }}>
    <shaderMaterial transparent depthWrite={false} blending={AdditiveBlending}
      vertexShader={`attribute float size; void main() { vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_PointSize = size * (19.0 / -p.z); }`}
      fragmentShader={`void main() { float d = length(gl_PointCoord - 0.5) * 2.0; float glow = exp(-d * d * 7.0); float core = exp(-d * d * 100.0); gl_FragColor = vec4(mix(vec3(0.40, 0.72, 1.0), vec3(1.0), core), glow * 0.75 + core); }`} />
  </points>;
}

function GalaxyContents({ repositories, onSelect, onHoldStart, onHoldEnd, reduceMotion, lowPower }) {
  const { viewport, invalidate } = useThree();
  const galaxy = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });

  const frameTimer = useRef(null);
  const scatterSeed = useRef(108);
  const constellations = useMemo(
    () => createConstellations(repositories, viewport, scatterSeed.current),
    [repositories, viewport.width, viewport.height],
  );
  const connectionGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(constellations.connectionPositions, 3));
    return geometry;
  }, [constellations.connectionPositions]);
  useEffect(() => () => connectionGeometry.dispose(), [connectionGeometry]);
  useEffect(() => {
    if (reduceMotion) return;
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
  }, [invalidate, reduceMotion]);

  useEffect(() => { invalidate(); return () => window.clearTimeout(frameTimer.current); }, [reduceMotion, lowPower, invalidate]);

  useFrame((state, delta) => {
    const { clock } = state;
    if (!galaxy.current || reduceMotion || document.hidden) return;
    const smoothing = 1 - Math.exp(-delta * 1.5);
    galaxy.current.rotation.y += (pointer.current.x * 0.035 - galaxy.current.rotation.y) * smoothing;
    galaxy.current.rotation.x += (-pointer.current.y * 0.025 - galaxy.current.rotation.x) * smoothing;
    galaxy.current.rotation.z = Math.sin(clock.elapsedTime * 0.035) * 0.004;
    window.clearTimeout(frameTimer.current);
    frameTimer.current = window.setTimeout(() => {
      frameTimer.current = null;
      if (!document.hidden) state.invalidate();
    }, 1000 / (lowPower ? 20 : 30));
  });

  return (
    <group ref={galaxy}>
      <GalaxyDust lowPower={lowPower} />
      <GalaxyCore />
      {!lowPower && !reduceMotion && <ShootingStar index={0} viewWidth={viewport.width} viewHeight={viewport.height} />}
      {constellations.connectionPositions.length > 0 && (
        <lineSegments geometry={connectionGeometry} raycast={ignoreRaycast}>
          <lineBasicMaterial color="#9dd9ff" transparent opacity={0.42} blending={AdditiveBlending} depthWrite={false} />
        </lineSegments>
      )}
      <RepositoryStars repositories={repositories} positions={constellations.positions} onSelect={onSelect} onHoldStart={onHoldStart} onHoldEnd={onHoldEnd} />
    </group>
  );
}

export default function GalaxyScene({ repositories, onSelect, onHoldStart, onHoldEnd, onBackgroundClick, lowPower, reduceMotion, onUnavailable }) {
  return (
    <Canvas
      className="galaxy-canvas"
      camera={{ position: [0, 0, 19], fov: 52 }}
      dpr={lowPower ? 0.8 : 1.25}
      raycaster={{ params: { Points: { threshold: 0.24 } } }}
      fallback={<span className="sr-only">3D unavailable. Use the project list.</span>}
      onCreated={({ gl }) => { gl.domElement.addEventListener("webglcontextlost", onUnavailable, { once: true }); }}
      frameloop="demand"
      gl={{ alpha: true, antialias: false, powerPreference: "low-power", stencil: false, depth: true, preserveDrawingBuffer: false }}
      performance={{ min: 0.55 }}
      onPointerMissed={onBackgroundClick}
    >
      <GalaxyContents repositories={repositories} onSelect={onSelect} onHoldStart={onHoldStart} onHoldEnd={onHoldEnd} reduceMotion={reduceMotion} lowPower={lowPower} />
    </Canvas>
  );
}

