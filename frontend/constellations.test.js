import assert from "node:assert/strict";
import { test } from "node:test";
import { createConstellations } from "./constellations.js";

function layout(count, width, height) {
  const viewport = { width: width / 37, height: height / 37 };
  const size = { width, height };
  const repositories = Array.from({ length: count }, (_, id) => ({ id }));
  const result = createConstellations(repositories, viewport, size, 108);
  const pixels = result.positions.map(([x, y]) => [
    (x / viewport.width + 0.5) * width,
    (0.5 - y / viewport.height) * height,
  ]);
  let minimum = Infinity;
  for (let i = 0; i < pixels.length; i += 1) {
    for (let j = i + 1; j < pixels.length; j += 1) {
      minimum = Math.min(minimum, Math.hypot(pixels[i][0] - pixels[j][0], pixels[i][1] - pixels[j][1]));
    }
  }
  return { ...result, pixels, minimum };
}

test("spaces 17 repository stars apart on desktop and mobile screens", () => {
  for (const [width, height, minimum] of [[1260, 687, 80], [390, 844, 55], [320, 568, 40]]) {
    const result = layout(17, width, height);
    assert.ok(result.minimum >= minimum, `${width}x${height}: ${result.minimum}px`);
    assert.ok(result.minimum + 1e-8 >= result.spacing);
    assert.equal(result.positions.length, 17);
    assert.ok(result.pixels.every(([x, y]) => x >= 0 && x <= width && y >= 0 && y <= height));
    assert.ok(result.connectionPositions.length > 0);
  }
});

test("keeps dense layouts separated and scales star sizes to the available space", () => {
  for (const [width, height] of [[1260, 687], [390, 844], [320, 568]]) {
    const result = layout(100, width, height);
    const maximumPointSize = Math.min(75, result.spacing * 3 / 2.55 * 0.9);
    assert.ok(result.minimum + 1e-8 >= result.spacing);
    assert.ok(maximumPointSize * 2.55 / 3 < result.minimum);
    assert.equal(new Set(result.pixels.map(point => point.join(","))).size, 100);
  }
});

test("handles empty and single-project layouts", () => {
  assert.equal(layout(0, 1260, 687).connectionPositions.length, 0);
  const single = layout(1, 1260, 687);
  assert.equal(single.positions.length, 1);
  assert.equal(single.connectionPositions.length, 0);
});
