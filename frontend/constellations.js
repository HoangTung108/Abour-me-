export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function createConstellations(repositories, viewport, size, seed) {
  const count = repositories.length;
  if (!count) return { positions: [], connectionPositions: new Float32Array(), spacing: Infinity };

  const random = seededRandom(seed);
  const margin = Math.min(30, size.width * 0.04, size.height * 0.06);
  const left = size.width * 0.52 + margin;
  const right = size.width - margin;
  const top = Math.min(100, size.height * 0.2);
  const bottom = size.height - margin;
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);

  let bestSpacing = -Infinity;
  for (let candidate = 1; candidate <= count; candidate += 1) {
    const rows = Math.ceil(count / candidate);
    const horizontal = candidate > 1 ? width / (candidate - 1) : Infinity;
    const vertical = rows > 1 ? height / (rows - 1) : Infinity;
    const spacing = Math.min(horizontal, vertical);
    if (spacing > bestSpacing) bestSpacing = spacing;
  }

  const separation = Math.min(80, size.width * 0.145, bestSpacing * 0.75) + 0.5;
  const clusterCount = Math.ceil(count / 4);
  const centers = [];
  const insetX = Math.min(separation * 0.6, width / 2);
  const insetY = Math.min(separation * 0.6, height / 2);
  for (let cluster = 0; cluster < clusterCount; cluster += 1) {
    let best;
    let bestDistance = -Infinity;
    for (let attempt = 0; attempt < 48; attempt += 1) {
      const x = left + insetX + random() * (width - insetX * 2);
      const y = top + insetY + random() * (height - insetY * 2);
      const distance = centers.length ? Math.min(...centers.map(center => Math.hypot(center[0] - x, center[1] - y))) : Infinity;
      if (distance > bestDistance) {
        best = [x, y];
        bestDistance = distance;
      }
    }
    centers.push(best);
  }

  const groups = Array.from({ length: clusterCount }, () => []);
  const points = repositories.map((_, index) => {
    const cluster = Math.floor(index * clusterCount / count);
    groups[cluster].push(index);
    const angle = random() * Math.PI * 2;
    const radius = separation * (0.55 + random() * 0.55);
    return [
      Math.max(left, Math.min(right, centers[cluster][0] + Math.cos(angle) * radius)),
      Math.max(top, Math.min(bottom, centers[cluster][1] + Math.sin(angle) * radius)),
    ];
  });

  for (let iteration = 0; iteration < 600; iteration += 1) {
    let overlap = 0;
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        let dx = points[j][0] - points[i][0];
        let dy = points[j][1] - points[i][1];
        let distance = Math.hypot(dx, dy);
        if (distance >= separation) continue;
        if (distance < 1e-8) {
          const angle = random() * Math.PI * 2;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distance = 1;
        }
        const shift = (separation - distance) / 2;
        overlap = Math.max(overlap, separation - distance);
        const x = dx / distance * shift;
        const y = dy / distance * shift;
        points[i][0] = Math.max(left, Math.min(right, points[i][0] - x));
        points[i][1] = Math.max(top, Math.min(bottom, points[i][1] - y));
        points[j][0] = Math.max(left, Math.min(right, points[j][0] + x));
        points[j][1] = Math.max(top, Math.min(bottom, points[j][1] + y));
      }
    }
    if (overlap < 0.01) break;
  }

  let spacing = Infinity;
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      spacing = Math.min(spacing, Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1]));
    }
  }
  const positions = points.map(([x, y]) => [
    x / size.width * viewport.width - viewport.width / 2,
    viewport.height / 2 - y / size.height * viewport.height, 0,
  ]);

  const connections = [];
  for (const indices of groups) {
    const group = indices.map(index => positions[index]);
    if (group.length < 2) continue;
    const centerX = group.reduce((sum, point) => sum + point[0], 0) / group.length;
    const centerY = group.reduce((sum, point) => sum + point[1], 0) / group.length;
    group.sort((a, b) => Math.atan2(a[1] - centerY, a[0] - centerX) - Math.atan2(b[1] - centerY, b[0] - centerX));
    const edges = group.length === 2 ? 1 : group.length;
    for (let index = 0; index < edges; index += 1) {
      connections.push(...group[index], ...group[(index + 1) % group.length]);
    }
    if (group.length === 4) connections.push(...group[0], ...group[2]);
  }

  return { positions, connectionPositions: new Float32Array(connections), spacing };
}
