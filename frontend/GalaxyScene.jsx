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

function GalaxyDust({ reduceMotion, swirl }) {
  const { viewport } = useThree();
  const material = useRef(null);
  const radius = Math.min(viewport.width * 0.48, viewport.height * 0.68);
  const uniforms = useMemo(() => ({ pixelRatio: { value: 1.5 }, time: { value: 0 }, swirl, radius: { value: radius } }), [radius, swirl]);
  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.uniforms.time.value = reduceMotion ? 0 : clock.elapsedTime;
    material.current.uniforms.swirl.value = swirl.value;
  });
  const geometry = useMemo(() => {
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const orbits = new Float32Array(count * 3);
    const random = seededRandom(108);
    const angle = 0.39;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let index = 0; index < count; index += 1) {
      const r = Math.pow(random(), 0.72);
      const arm = index % 3;
      const theta = arm * Math.PI * 2 / 3 + r * 5.8 + gaussian(random) * 0.24;
      const along = Math.cos(theta) * r * radius;
      const across = Math.sin(theta) * r * radius * 0.48 + gaussian(random) * radius * 0.025;
      const offset = index * 3;
      orbits[offset] = Math.pow(r, 1 / 0.72);
      orbits[offset + 1] = theta - r * 5.8;
      orbits[offset + 2] = gaussian(random) * 0.12;
      positions[offset] = along * cos - across * sin;
      positions[offset + 1] = along * sin + across * cos;
      positions[offset + 2] = -1.2 + Math.sin(theta) * r * 1.6 + gaussian(random) * 0.16;
      const warm = Math.exp(-r * 5);
      colors[offset] = 0.48 + warm * 0.5 + (arm === 1 ? 0.12 : 0);
      colors[offset + 1] = 0.62 + warm * 0.25;
      colors[offset + 2] = 1.0 - warm * 0.18;
      sizes[index] = index % 41 === 0 ? 5 + random() * 3 : 1 + random() * 1.6;
    }

    const result = new BufferGeometry();
    result.setAttribute("position", new Float32BufferAttribute(positions, 3));
    result.setAttribute("color", new Float32BufferAttribute(colors, 3));
    result.setAttribute("size", new Float32BufferAttribute(sizes, 1));
    result.setAttribute("orbit", new Float32BufferAttribute(orbits, 3));
    return result;
  }, [radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry} raycast={ignoreRaycast}>
      <shaderMaterial ref={material} transparent depthWrite={false} blending={AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`attribute vec3 color; attribute vec3 orbit; attribute float size; varying vec3 vColor; varying float brightness; uniform float pixelRatio; uniform float time; uniform float swirl; uniform float radius;
          void main() {
            // Stars stream inward along spiral arms; the disc itself stays fixed.
            float phase = fract(orbit.x - swirl * 0.09);
            float r = pow(phase, 0.72);
            float theta = orbit.y + r * 5.8 + swirl * 0.18;
            float x = cos(theta) * r * radius;
            float y = sin(theta) * r * radius * 0.48;
            float c = cos(0.39), s = sin(0.39);
            vec3 moved = vec3(x * c - y * s, x * s + y * c,
              -1.2 + sin(theta) * r * 1.6 + orbit.z);
            float fade = smoothstep(0.0, 0.045, phase) * (1.0 - smoothstep(0.92, 1.0, phase));
            vColor = mix(color, vec3(1.0, 0.88, 0.78), exp(-r * 5.0) * 0.6);
            brightness = (0.85 + 0.15 * sin(time * 0.8 + orbit.y * 7.0)) * fade;
            vec4 p = modelViewMatrix * vec4(moved, 1.0);
            gl_Position = projectionMatrix * p;
            gl_PointSize = clamp(size * 19.0 / -p.z, 1.0, 9.0) * pixelRatio;
          }`}
        fragmentShader={`varying vec3 vColor; varying float brightness; void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float alpha = exp(-d * d * 3.0) * (1.0 - smoothstep(0.4, 1.0, d));
          gl_FragColor = vec4(vColor, alpha * 0.78 * brightness);
        }`} />
    </points>
  );
}

function DistantStars({ reduceMotion, foreground = false }) {
  const { viewport } = useThree();
  const material = useRef(null);
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.time.value = reduceMotion ? 0 : clock.elapsedTime;
  });
  const geometry = useMemo(() => {
    const random = seededRandom(foreground ? 712 : 902);
    const positions = [], sizes = [], colors = [];
    for (let index = 0; index < (foreground ? 65 : 850); index++) {
      const z = foreground ? 3 + random() * 4 : -5 - random() * 12;
      const coverage = (19 - z) / 19 * 1.15;
      positions.push((random() - 0.5) * viewport.width * coverage,
        (random() - 0.5) * viewport.height * coverage, z);
      sizes.push(foreground ? 2 + random() * 5 : index % 67 === 0 ? 10 : 1.2 + random() * 2.2);
      const warm = random() > 0.8;
      colors.push(warm ? 1 : 0.65, warm ? 0.83 : 0.8, warm ? 0.67 : 1);
    }
    const result = new BufferGeometry();
    result.setAttribute("position", new Float32BufferAttribute(positions, 3));
    result.setAttribute("size", new Float32BufferAttribute(sizes, 1));
    result.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return result;
  }, [viewport.width, viewport.height, foreground]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <points geometry={geometry} raycast={ignoreRaycast}>
    <shaderMaterial ref={material} transparent depthWrite={false} blending={AdditiveBlending} uniforms={uniforms}
      vertexShader={`attribute float size; attribute vec3 color; uniform float time;
        varying vec3 tint; varying float brightness; varying float sparkle;
        void main() {
          tint = color; sparkle = step(8.0, size);
          float depthFade = mix(0.38, 0.82, smoothstep(-17.0, 7.0, position.z));
          brightness = depthFade * (0.85 + 0.15 * sin(time * 0.65 + position.x * 11.0));
          vec4 p = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * p;
          gl_PointSize = max(1.0, size * 28.5 / -p.z);
        }`}
      fragmentShader={`varying vec3 tint; varying float brightness; varying float sparkle;
        void main() {
          vec2 p = (gl_PointCoord - 0.5) * 2.0;
          float r = length(p);
          float halo = exp(-r * r * 5.0) * 0.5;
          float core = exp(-r * r * 65.0);
          float rays = (exp(-abs(p.x) * 38.0) + exp(-abs(p.y) * 38.0)) * exp(-r * 4.0) * sparkle * 0.35;
          float edge = 1.0 - smoothstep(0.65, 1.0, r);
          gl_FragColor = vec4(tint, (halo + core + rays) * edge * brightness);
        }`} />
  </points>;
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

function GalaxyCore({ swirl }) {
  const { viewport } = useThree();
  const material = useRef(null);
  useFrame(() => { if (material.current) material.current.uniforms.swirl.value = swirl.value; });
  const uniforms = useMemo(() => ({ swirl }), [swirl]);
  const radius = Math.min(viewport.width * 0.48, viewport.height * 0.68);
  return (
    <mesh position={[0, 0, -1.5]} rotation={[0, 0, 0.39]} raycast={ignoreRaycast}>
      <planeGeometry args={[radius * 2.3, radius * 1.5]} />
      <shaderMaterial ref={material} transparent depthWrite={false} blending={AdditiveBlending} uniforms={uniforms}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`varying vec2 vUv; uniform float swirl; void main() {
          vec2 p = (vUv - 0.5) * vec2(2.3, 3.125);
          float r = length(p);
          float angle = atan(p.y, p.x + 0.00001);
          float arms = pow(0.5 + 0.5 * cos((angle - swirl * 0.18) * 3.0 - r * 17.4), 3.0);
          float fade = 1.0 - smoothstep(0.55, 1.0, r);
          float haze = exp(-r * r * 3.5) * 0.12;
          float spiral = arms * smoothstep(0.06, 0.25, r) * 0.10;
          float core = exp(-r * r * 85.0) * (0.48 + 0.035 * sin(swirl * 4.0));
          vec3 color = mix(vec3(0.30, 0.39, 0.85), vec3(1.0, 0.83, 0.68), exp(-r * r * 35.0));
          gl_FragColor = vec4(color, (haze + spiral + core) * fade);
        }`} />
    </mesh>
  );
}

function ShootingStar({ index, viewWidth, viewHeight }) {
  const streak = useRef(null);
  const material = useRef(null);
  const glow = useMemo(() => ({ opacity: { value: 0 } }), []);
  const elapsed = useRef(index * 2.4);
  const cycle = 6.5 + index * 1.8;
  const duration = 2.8 + index * 0.25;
  const travelX = viewWidth * 0.72;
  const travelY = -viewHeight * (0.34 + index * 0.08);
  const heading = Math.atan2(travelY, travelX);
  const tailLength = Math.min(viewWidth * (0.23 + index * 0.02), 5.5);

  useFrame((_, delta) => {
    if (!streak.current || document.hidden) return;
    elapsed.current += Math.min(delta, 0.05);
    const phase = elapsed.current % cycle;
    const progress = phase / duration;
    const visible = phase < duration;
    streak.current.visible = visible;
    if (!visible) return;

    streak.current.position.set(-viewWidth * (0.16 + index * 0.07) + progress * travelX,
      viewHeight * (0.4 - index * 0.12) + progress * travelY, 1.7 + index * 0.25);
    if (material.current) material.current.uniforms.opacity.value = Math.sin(progress * Math.PI) ** 0.6;
  });

  return (
    <group ref={streak} visible={false} rotation={[0, 0, heading]}>
      <mesh position={[-tailLength * 0.42, 0, 0]} raycast={ignoreRaycast}>
        <planeGeometry args={[tailLength, 0.38]} />
        <shaderMaterial ref={material} transparent depthWrite={false} blending={AdditiveBlending} uniforms={glow}
          vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          fragmentShader={`varying vec2 vUv; uniform float opacity; void main() {
            float along = vUv.x;
            float width = mix(0.19, 0.045, along);
            float crossTail = exp(-pow((vUv.y - 0.5) / width, 2.0));
            float tail = pow(along, 1.25) * (1.0 - smoothstep(0.91, 1.0, along)) * crossTail;
            vec2 headUV = (vUv - vec2(0.92, 0.5)) * vec2(15.0, 3.0);
            float head = exp(-dot(headUV, headUV) * 18.0);
            vec3 color = mix(vec3(0.30, 0.55, 1.0), vec3(0.92, 0.97, 1.0), along);
            float halo = exp(-dot(headUV, headUV) * 2.5) * 0.22;
            gl_FragColor = vec4(color, (tail * 0.85 + head + halo) * opacity);
          }`} />
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

function NebulaVeil() {
  const { viewport } = useThree();
  return <mesh position={[viewport.width * 0.2, 0, -4]} raycast={ignoreRaycast}>
    <planeGeometry args={[viewport.width * 1.1, viewport.height * 1.2]} />
    <shaderMaterial transparent depthWrite={false} blending={AdditiveBlending}
      vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
      fragmentShader={`varying vec2 vUv; void main() {
        vec2 p = vUv - 0.5;
        float ribbon = p.y - p.x * 0.4 + sin(p.x * 9.0) * 0.065;
        float clouds = exp(-ribbon * ribbon * 48.0);
        float lane = 1.0 - exp(-pow(ribbon + 0.025, 2.0) * 900.0) * 0.85;
        float wisps = 0.65 + 0.35 * sin(p.x * 23.0 + sin(p.y * 17.0));
        float edge = (1.0 - smoothstep(0.2, 0.5, abs(p.x))) * (1.0 - smoothstep(0.2, 0.5, abs(p.y)));
        vec3 color = mix(vec3(0.18, 0.38, 0.65), vec3(0.48, 0.22, 0.62), smoothstep(-0.3, 0.3, p.x));
        gl_FragColor = vec4(color, clouds * lane * wisps * edge * 0.15);
      }`} />
  </mesh>;
}

function GalaxyContents({ repositories, onSelect, onHoldStart, onHoldEnd, reduceMotion }) {
  const { viewport, invalidate } = useThree();
  const galaxy = useRef(null);
  const farLayer = useRef(null);
  const nearLayer = useRef(null);
  const swirl = useMemo(() => ({ value: 0 }), []);
  const pointer = useRef({ x: 0, y: 0 });

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
    const trackPointer = event => {
      pointer.current.x = event.clientX / window.innerWidth * 2 - 1;
      pointer.current.y = event.clientY / window.innerHeight * 2 - 1;
    };
    const wake = () => { if (!document.hidden) invalidate(); };
    window.addEventListener('pointermove', trackPointer, { passive: true });
    document.addEventListener('visibilitychange', wake);
    invalidate();
    return () => {
      window.removeEventListener('pointermove', trackPointer);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [invalidate, reduceMotion]);

  useFrame((state, delta) => {
    if (!galaxy.current || reduceMotion || document.hidden) return;
    // Slow continuous orbit; capped delta avoids jumping after an inactive tab.
    swirl.value += Math.min(delta, 0.05) * 0.225;
    const smoothing = 1 - Math.exp(-Math.min(delta, 0.05) * 2.5);
    galaxy.current.rotation.y += (pointer.current.x * 0.035 - galaxy.current.rotation.y) * smoothing;
    galaxy.current.rotation.x += (-pointer.current.y * 0.025 - galaxy.current.rotation.x) * smoothing;
    for (const [layer, strength] of [[farLayer.current, 0.08], [nearLayer.current, 0.48]]) {
      if (!layer) continue;
      layer.position.x += (-pointer.current.x * strength - layer.position.x) * smoothing;
      layer.position.y += (pointer.current.y * strength - layer.position.y) * smoothing;
    }
    state.invalidate();
  });

  return (
    <>
      <group ref={farLayer}>
        <DistantStars reduceMotion={reduceMotion} />
        <NebulaVeil />
      </group>
      <group ref={galaxy}>
      <group position={[viewport.width * 0.24, viewport.height * 0.04, 0]}>
        <GalaxyDust reduceMotion={reduceMotion} swirl={swirl} />
        <GalaxyCore swirl={swirl} />
      </group>
      {!reduceMotion && [0, 1, 2].map(index => <ShootingStar key={index} index={index} viewWidth={viewport.width} viewHeight={viewport.height} />)}
      {constellations.connectionPositions.length > 0 && (
        <lineSegments geometry={connectionGeometry} raycast={ignoreRaycast}>
          <lineBasicMaterial color="#9dd9ff" transparent opacity={0.22} blending={AdditiveBlending} depthWrite={false} />
        </lineSegments>
      )}
      <RepositoryStars repositories={repositories} positions={constellations.positions} onSelect={onSelect} onHoldStart={onHoldStart} onHoldEnd={onHoldEnd} />
      </group>
      <group ref={nearLayer}><DistantStars reduceMotion={reduceMotion} foreground /></group>
    </>
  );
}

export default function GalaxyScene({ repositories, onSelect, onHoldStart, onHoldEnd, onBackgroundClick, reduceMotion, onUnavailable }) {
  return (
    <Canvas
      className="galaxy-canvas"
      camera={{ position: [0, 0, 19], fov: 52 }}
      dpr={1.5}
      raycaster={{ params: { Points: { threshold: 0.24 } } }}
      fallback={<span className="sr-only">3D unavailable. Use the project list.</span>}
      onCreated={({ gl }) => { gl.domElement.addEventListener("webglcontextlost", onUnavailable, { once: true }); }}
      frameloop="demand"
      gl={{ alpha: true, antialias: false, powerPreference: "high-performance", stencil: false, depth: true, preserveDrawingBuffer: false }}
      performance={{ min: 0.55 }}
      onPointerMissed={onBackgroundClick}
    >
      <GalaxyContents repositories={repositories} onSelect={onSelect} onHoldStart={onHoldStart} onHoldEnd={onHoldEnd} reduceMotion={reduceMotion} />
    </Canvas>
  );
}

