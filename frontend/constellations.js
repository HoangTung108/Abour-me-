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

  let columns = 1;
  let bestSpacing = -Infinity;
  for (let candidate = 1; candidate <= count; candidate += 1) {
    const rows = Math.ceil(count / candidate);
    const horizontal = candidate > 1 ? width / (candidate - 1) : Infinity;
    const vertical = rows > 1 ? height / (rows - 1) : Infinity;
    const spacing = Math.min(horizontal, vertical);
    if (spacing > bestSpacing) {
      columns = candidate;
      bestSpacing = spacing;
    }
  }

  const rows = Math.ceil(count / columns);
  const stepX = columns > 1 ? width / (columns - 1) : 0;
  const stepY = rows > 1 ? height / (rows - 1) : 0;
  const targetSpacing = Math.min(80, size.width * 0.145);
  const jitter = Math.min(0.48, Math.max(0, 1 - targetSpacing / bestSpacing));
  const positions = repositories.map((_, index) => {
    const row = Math.floor(index / columns);
    const rowCount = Math.min(columns, count - row * columns);
    const offset = index % columns;
    const column = (columns - rowCount) / 2 + (row % 2 ? rowCount - 1 - offset : offset);
    const x = columns > 1 ? left + column * stepX : (left + right) / 2;
    const y = rows > 1 ? top + row * stepY : (top + bottom) / 2;
    const jitterX = (random() - 0.5) * stepX * jitter;
    const jitterY = (random() - 0.5) * stepY * jitter;
    const screenX = Math.max(left, Math.min(right, x + jitterX));
    const screenY = Math.max(top, Math.min(bottom, y + jitterY));
    return [screenX / size.width * viewport.width - viewport.width / 2,
      viewport.height / 2 - screenY / size.height * viewport.height, 0];
  });

  const connections = [];
  const remaining = new Set(positions.map((_, index) => index));
  while (remaining.size) {
    const first = remaining.values().next().value;
    remaining.delete(first);
    const group = [positions[first]];
    while (group.length < 4 && remaining.size) {
      const centerX = group.reduce((sum, point) => sum + point[0], 0) / group.length;
      const centerY = group.reduce((sum, point) => sum + point[1], 0) / group.length;
      let closest;
      let distance = Infinity;
      for (const index of remaining) {
        const point = positions[index];
        const candidate = Math.hypot(point[0] - centerX, point[1] - centerY);
        if (candidate < distance) {
          closest = index;
          distance = candidate;
        }
      }
      remaining.delete(closest);
      group.push(positions[closest]);
    }
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

  return { positions, connectionPositions: new Float32Array(connections), spacing: bestSpacing * (1 - jitter) };
}
