/**
 * Trace a binary ink mask into closed SVG paths without external dependencies.
 * Coordinates describe pixel cell boundaries, not pixel centres. Exterior loops
 * and counters retain opposite winding; use fill-rule="evenodd" when composing.
 */
export function traceMask(mask, width, height, options = {}) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new TypeError("Mask width and height must be positive integers.");
  }
  if (!mask || mask.length !== width * height) {
    throw new TypeError("Mask length must equal width × height.");
  }
  const minArea = finiteOption(options.minArea, 8, 0);
  const fitError = finiteOption(options.fitError, 0.6, 0.001);
  const cornerMinRun = finiteOption(options.cornerMinRun, 2, 0);
  const cornerAngle = finiteOption(options.cornerAngle, 60, 1, 179);
  const stride = width + 1;
  const edges = [];
  const outgoing = new Map();
  const occupied = (x, y) => x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x] !== 0;
  const addEdge = (ax, ay, bx, by, direction) => {
    const a = ay * stride + ax;
    const id = edges.length;
    edges.push({ a, b: by * stride + bx, direction });
    const list = outgoing.get(a);
    if (list) list.push(id);
    else outgoing.set(a, [id]);
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!occupied(x, y)) continue;
      // Filled material stays on the right of every directed edge.
      if (!occupied(x, y - 1)) addEdge(x, y, x + 1, y, 0);
      if (!occupied(x + 1, y)) addEdge(x + 1, y, x + 1, y + 1, 1);
      if (!occupied(x, y + 1)) addEdge(x + 1, y + 1, x, y + 1, 2);
      if (!occupied(x - 1, y)) addEdge(x, y + 1, x, y, 3);
    }
  }

  const used = new Uint8Array(edges.length);
  const contours = [];
  for (let firstId = 0; firstId < edges.length; firstId++) {
    if (used[firstId]) continue;
    const start = edges[firstId].a;
    const vertices = [];
    let edgeId = firstId;
    let closed = false;
    for (let steps = 0; steps <= edges.length; steps++) {
      const edge = edges[edgeId];
      if (used[edgeId]) throw new Error("Contour traversal reached an already consumed edge.");
      used[edgeId] = 1;
      vertices.push([edge.a % stride, Math.floor(edge.a / stride)]);
      if (edge.b === start) {
        closed = true;
        break;
      }
      const candidates = (outgoing.get(edge.b) || []).filter((id) => !used[id]);
      if (!candidates.length) throw new Error("Binary mask produced an open boundary.");
      // Right turns first keep diagonal-touching pixels as separate contours.
      const priority = [(edge.direction + 1) % 4, edge.direction, (edge.direction + 3) % 4, (edge.direction + 2) % 4];
      edgeId = candidates.reduce((best, id) =>
        priority.indexOf(edges[id].direction) < priority.indexOf(edges[best].direction) ? id : best,
      candidates[0]);
    }
    if (!closed) throw new Error("Contour traversal exceeded its boundary edge count.");
    const area = signedArea(vertices);
    if (Math.abs(area) < minArea) continue;
    const originalPoints = removeCollinear(vertices);
    // A single bounded fairing pass turns 1px diagonal staircases into straight
    // subpixel runs. Long-leg corners stay exact. Reserve its displacement from
    // the fitting tolerance so the combined operation respects fitError.
    const weight = Math.min(0.25, fitError / (2 * Math.SQRT2));
    const corners = cornerIndices(originalPoints, cornerMinRun, cornerAngle);
    const protectedPoints = new Set([...corners].map((index) => originalPoints[index].join(",")));
    const fair = vertices.map((point, index) => {
      if (protectedPoints.has(point.join(","))) return point;
      const previous = vertices[(index + vertices.length - 1) % vertices.length];
      const next = vertices[(index + 1) % vertices.length];
      return [
        point[0] * (1 - 2 * weight) + weight * (previous[0] + next[0]),
        point[1] * (1 - 2 * weight) + weight * (previous[1] + next[1]),
      ];
    });
    const points = removeCollinear(fair);
    if (points.length < 3) continue;
    const bounds = pointBounds(originalPoints);
    const fittingBudget = Math.max(0.0001, fitError - Math.SQRT2 * weight);
    const { path, segmentCount } = fitClosedPath(points, fittingBudget, cornerMinRun, cornerAngle, bounds);
    contours.push({ path, area, hole: area < 0, bounds, pointCount: vertices.length, segmentCount, closed: true });
  }
  contours.sort((a, b) => Math.abs(b.area) - Math.abs(a.area));
  return {
    path: contours.map((contour) => contour.path).join(" "),
    contours,
    bounds: contours.length ? unionBounds(contours.map((contour) => contour.bounds)) : null,
  };
}

function finiteOption(value, fallback, minimum, maximum = Infinity) {
  const result = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(result) || result < minimum || result > maximum) {
    throw new TypeError(`Invalid contour option: ${value}`);
  }
  return result;
}

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, scale) => [a[0] * scale, a[1] * scale];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const norm = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => {
  const length = norm(a);
  return length > 1e-12 ? mul(a, 1 / length) : [0, 0];
};
const distance = (a, b) => norm(sub(a, b));

function signedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area / 2;
}

function removeCollinear(points) {
  return points.filter((point, i) => {
    const a = points[(i + points.length - 1) % points.length];
    const b = points[(i + 1) % points.length];
    const incoming = sub(point, a), outgoing = sub(b, point);
    return Math.abs(incoming[0] * outgoing[1] - incoming[1] * outgoing[0]) > 1e-9 || dot(incoming, outgoing) <= 0;
  });
}

function pointBounds(points) {
  const xs = points.map((point) => point[0]), ys = points.map((point) => point[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

function unionBounds(bounds) {
  const x = Math.min(...bounds.map((bound) => bound.x));
  const y = Math.min(...bounds.map((bound) => bound.y));
  return {
    x, y,
    width: Math.max(...bounds.map((bound) => bound.x + bound.width)) - x,
    height: Math.max(...bounds.map((bound) => bound.y + bound.height)) - y,
  };
}

function cornerIndices(points, minRun, cornerAngle) {
  const count = points.length;
  const corners = new Set();
  const threshold = Math.cos(cornerAngle * Math.PI / 180);
  for (let i = 0; i < count; i++) {
    const incoming = sub(points[i], points[(i + count - 1) % count]);
    const outgoing = sub(points[(i + 1) % count], points[i]);
    if (norm(incoming) >= minRun && norm(outgoing) >= minRun && dot(unit(incoming), unit(outgoing)) < threshold) corners.add(i);
  }
  return corners;
}

function fitClosedPath(points, error, minRun, cornerAngle, bounds) {
  const count = points.length;
  const corners = cornerIndices(points, minRun, cornerAngle);
  let anchors = [...corners];
  if (!anchors.length) {
    const lengths = [0];
    for (let i = 1; i <= count; i++) lengths.push(lengths[i - 1] + distance(points[i % count], points[i - 1]));
    anchors = [0];
    for (let quarter = 1; quarter < 4; quarter++) {
      const target = lengths[count] * quarter / 4;
      let nearest = 1;
      for (let i = 2; i < count; i++) if (Math.abs(lengths[i] - target) < Math.abs(lengths[nearest] - target)) nearest = i;
      anchors.push(nearest);
    }
  } else if (anchors.length === 1) {
    const origin = points[anchors[0]];
    let farthest = (anchors[0] + 1) % count;
    for (let i = 0; i < count; i++) if (distance(points[i], origin) > distance(points[farthest], origin)) farthest = i;
    anchors.push(farthest);
  }
  anchors = [...new Set(anchors)].sort((a, b) => a - b);
  const tangent = (index, forward) => {
    const previous = points[(index + count - 1) % count];
    const next = points[(index + 1) % count];
    if (corners.has(index)) return unit(forward ? sub(next, points[index]) : sub(previous, points[index]));
    return mul(unit(sub(next, previous)), forward ? 1 : -1);
  };
  const curves = [];
  for (let i = 0; i < anchors.length; i++) {
    const start = anchors[i], end = anchors[(i + 1) % anchors.length];
    const section = [points[start]];
    let cursor = (start + 1) % count;
    while (cursor !== end) {
      section.push(points[cursor]);
      cursor = (cursor + 1) % count;
    }
    section.push(points[end]);
    // Collinear compression is useful for corner detection, but endpoints alone
    // do not constrain a long straight edge when its endpoint tangent is shared
    // with a neighbouring curve. Restore <=1px samples before fitting so a cubic
    // cannot bow between sparse vertices without being caught by maxError.
    curves.push(...fitCurve(densifyPolyline(section), tangent(start, true), tangent(end, false), error * error, 0));
  }
  // Cubic curves can otherwise overshoot extrema by a fraction of a pixel.
  const clamp = (point) => [
    Math.max(bounds.x, Math.min(bounds.x + bounds.width, point[0])),
    Math.max(bounds.y, Math.min(bounds.y + bounds.height, point[1])),
  ];
  const format = (point) => `${number(point[0])} ${number(point[1])}`;
  let path = `M${format(curves[0][0])}`;
  for (const curve of curves) {
    const [start, a, b, end] = [curve[0], clamp(curve[1]), clamp(curve[2]), curve[3]];
    const chord = sub(end, start);
    const cross = (point) => Math.abs(chord[0] * (point[1] - start[1]) - chord[1] * (point[0] - start[0]));
    if (cross(a) < 1e-7 && cross(b) < 1e-7) path += `L${format(end)}`;
    else path += `C${format(a)} ${format(b)} ${format(end)}`;
  }
  return { path: `${path}Z`, segmentCount: curves.length };
}

function densifyPolyline(points, maximumStep = 1) {
  const dense = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const start = points[i - 1], end = points[i];
    const steps = Math.max(1, Math.ceil(distance(start, end) / maximumStep));
    for (let step = 1; step < steps; step++) {
      const amount = step / steps;
      dense.push([start[0] + (end[0] - start[0]) * amount, start[1] + (end[1] - start[1]) * amount]);
    }
    dense.push(end);
  }
  return dense;
}

function number(value) {
  const rounded = Math.round(value * 1000) / 1000;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

/** Adaptive least-squares cubic fitting with chord-length parameterisation. */
function fitCurve(points, firstTangent, lastTangent, squaredError, depth) {
  if (points.length === 2) {
    const handle = distance(points[0], points[1]) / 3;
    return [[points[0], add(points[0], mul(firstTangent, handle)), add(points[1], mul(lastTangent, handle)), points[1]]];
  }
  let parameters = [0];
  for (let i = 1; i < points.length; i++) parameters.push(parameters[i - 1] + distance(points[i], points[i - 1]));
  const total = parameters[parameters.length - 1];
  parameters = parameters.map((value) => value / total);
  let curve = generateBezier(points, parameters, firstTangent, lastTangent);
  let worst = maxError(points, curve, parameters);
  if (worst.error <= squaredError) return [curve];
  if (worst.error <= squaredError * 4) {
    for (let iteration = 0; iteration < 4; iteration++) {
      const next = parameters.map((value, index) => improveParameter(curve, points[index], value));
      if (next.some((value, index) => index && value <= next[index - 1])) break;
      parameters = next;
      curve = generateBezier(points, parameters, firstTangent, lastTangent);
      worst = maxError(points, curve, parameters);
      if (worst.error <= squaredError) return [curve];
    }
  }
  if (depth >= 48) {
    return points.slice(1).map((point, index) => [points[index], points[index], point, point]);
  }
  const split = Math.max(1, Math.min(points.length - 2, worst.index));
  const centreTangent = unit(sub(points[split - 1], points[split + 1]));
  return [
    ...fitCurve(points.slice(0, split + 1), firstTangent, centreTangent, squaredError, depth + 1),
    ...fitCurve(points.slice(split), mul(centreTangent, -1), lastTangent, squaredError, depth + 1),
  ];
}

function generateBezier(points, parameters, firstTangent, lastTangent) {
  const first = points[0], last = points[points.length - 1];
  let c00 = 0, c01 = 0, c11 = 0, x0 = 0, x1 = 0;
  for (let i = 0; i < points.length; i++) {
    const u = parameters[i], v = 1 - u;
    const b0 = v * v * v, b1 = 3 * u * v * v, b2 = 3 * u * u * v, b3 = u * u * u;
    const a0 = mul(firstTangent, b1), a1 = mul(lastTangent, b2);
    const residual = sub(points[i], add(mul(first, b0 + b1), mul(last, b2 + b3)));
    c00 += dot(a0, a0); c01 += dot(a0, a1); c11 += dot(a1, a1);
    x0 += dot(a0, residual); x1 += dot(a1, residual);
  }
  const determinant = c00 * c11 - c01 * c01;
  let alpha = Math.abs(determinant) > 1e-12 ? (x0 * c11 - x1 * c01) / determinant : 0;
  let beta = Math.abs(determinant) > 1e-12 ? (c00 * x1 - c01 * x0) / determinant : 0;
  const length = distance(first, last);
  const epsilon = Math.max(1e-9, length * 1e-6);
  if (alpha < epsilon || beta < epsilon || alpha > length * 4 || beta > length * 4) alpha = beta = length / 3;
  return [first, add(first, mul(firstTangent, alpha)), add(last, mul(lastTangent, beta)), last];
}

function bezier(curve, u) {
  const v = 1 - u;
  return add(add(mul(curve[0], v * v * v), mul(curve[1], 3 * v * v * u)), add(mul(curve[2], 3 * v * u * u), mul(curve[3], u * u * u)));
}

function maxError(points, curve, parameters) {
  let error = 0, index = Math.floor(points.length / 2);
  for (let i = 1; i < points.length - 1; i++) {
    const difference = sub(bezier(curve, parameters[i]), points[i]);
    const current = dot(difference, difference);
    if (current > error) { error = current; index = i; }
  }
  return { error, index };
}

function improveParameter(curve, point, u) {
  const v = 1 - u;
  const first = add(add(mul(sub(curve[1], curve[0]), 3 * v * v), mul(sub(curve[2], curve[1]), 6 * v * u)), mul(sub(curve[3], curve[2]), 3 * u * u));
  const second = add(mul(add(sub(curve[2], mul(curve[1], 2)), curve[0]), 6 * v), mul(add(sub(curve[3], mul(curve[2], 2)), curve[1]), 6 * u));
  const difference = sub(bezier(curve, u), point);
  const denominator = dot(first, first) + dot(difference, second);
  if (Math.abs(denominator) < 1e-12) return u;
  return Math.max(0, Math.min(1, u - dot(difference, first) / denominator));
}
