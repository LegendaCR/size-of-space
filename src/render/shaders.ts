// All visuals are procedural: every object is a quad rendered with a
// fragment shader. `vP` runs from -ext..ext, so the body's edge is at r = 1.

export const VERT = /* glsl */ `
uniform float uExt;
varying vec2 vP;
void main() {
  vP = position.xy * 2.0 * uExt;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const COMMON = /* glsl */ `
precision highp float;
uniform float uTime, uSeed, uExt, uPx, uAlpha;
uniform vec3 uC1, uC2, uC3, uC4;
uniform vec4 uP, uQ;
uniform float uOrb[8];
uniform int uOrbN;
varying vec2 vP;

const vec3 LIGHT = vec3(-0.549, 0.35, 0.759);

// Hashes without sine (Dave Hoskins, MIT)
float hash21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float hash31(vec3 p) { p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
vec3 hash33(vec3 p) { p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }

float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash31(i), hash31(i + vec3(1, 0, 0)), f.x), mix(hash31(i + vec3(0, 1, 0)), hash31(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0, 0, 1)), hash31(i + vec3(1, 0, 1)), f.x), mix(hash31(i + vec3(0, 1, 1)), hash31(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float fbm(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s / 0.96875;
}
float fbm3(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 3; i++) { s += a * noise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s / 0.875;
}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
vec3 rotY(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); }
vec3 sphere(vec2 p) { return vec3(p, sqrt(max(0.0, 1.0 - dot(p, p)))); }
float px1() { return 1.0 / max(uPx, 1.0); }
float edge(float r, float R) { float w = 1.5 * px1(); return 1.0 - smoothstep(R - w, R, r); }

vec4 over(vec4 top, vec4 bot) {
  float a = top.a + bot.a * (1.0 - top.a);
  vec3 c = (top.rgb * top.a + bot.rgb * bot.a * (1.0 - top.a)) / max(a, 1e-4);
  return vec4(c, a);
}

vec2 voro3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  float d = 8.0, id = 0.0;
  for (int z = -1; z <= 1; z++)
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 r = g + hash33(i + g) - f;
    float dd = dot(r, r);
    if (dd < d) { d = dd; id = hash31(i + g + 7.0); }
  }
  return vec2(sqrt(d), id);
}

vec2 voro2(vec2 x) {
  vec2 n = floor(x), f = fract(x);
  float f1 = 8.0, f2 = 8.0;
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = hash22(n + g);
    o = 0.5 + 0.42 * sin(uTime * 0.03 + 6.2831 * o);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
  }
  return sqrt(vec2(f1, f2));
}

float craters(vec3 p) {
  vec2 v = voro3(p);
  float rad = 0.22 + 0.3 * v.y;
  float x = v.x / rad;
  float h = x < 1.0 ? (x * x - 1.0) * 0.6 : 0.0;
  h += 0.25 * exp(-pow((x - 1.0) * 5.0, 2.0));
  return h * step(0.62, v.y);
}

// A layer of point-like stars in object space; n = cells per unit radius.
// Fades to an average glow when cells get smaller than a few pixels.
float stars(vec2 p, float n, float prob) {
  vec2 g = p * n + uSeed * 17.0;
  vec2 i = floor(g), f = fract(g);
  float cellPx = uPx / n;
  float fade = smoothstep(1.5, 5.0, cellPx);
  float avg = prob * 0.06 * (1.0 - fade);
  if (hash21(i) > prob) return avg;
  vec2 c = 0.15 + 0.7 * hash22(i + 3.7);
  float rad = max(0.8 / cellPx, 0.03);
  float d = length(f - c);
  float b = exp(-d * d / (rad * rad)) * (0.25 + 0.75 * pow(hash21(i + 9.1), 3.0));
  return b * fade + avg;
}
`;

const ROCKY = /* glsl */ `
void main() {
  vec2 p = vP; float r = length(p);
  vec4 o = vec4(0.0);
  if (uExt > 1.01) {
    float g = exp(-(r - 1.0) / (uExt - 1.0) * 3.5) * smoothstep(uExt, 1.0, r) * step(0.98, r);
    o = vec4(uC3, g * 0.45);
  }
  if (r < 1.0) {
    vec3 n = sphere(p);
    float spin = uTime * 0.02 + uSeed;
    vec3 q = rotY(n, spin);
    float f = uP.y;
    float h = fbm(q * f + uSeed * 1.3);
    float h2 = fbm(q * f * 2.7 + 11.0);
    vec3 alb = mix(uC1, uC2, smoothstep(0.32, 0.7, h));
    alb = mix(alb, uC3, smoothstep(0.55, 0.8, h2) * 0.35);
    if (uQ.y > 0.0) {
      float m = smoothstep(0.5, 0.56, fbm(q * 1.3 + 4.0));
      alb = mix(alb, uC1 * 0.75, m * uQ.y);
    }
    vec3 Lq = rotY(LIGHT, spin);
    float shade = 0.0;
    if (uP.x > 0.0) {
      float c0 = craters(q * f * 2.5) * 0.6 + craters(q * f * 6.0 + 3.0) * 0.3;
      vec3 q2 = q + Lq * 0.015;
      float c1 = craters(q2 * f * 2.5) * 0.6 + craters(q2 * f * 6.0 + 3.0) * 0.3;
      shade = (c1 - c0) * 11.0 * uP.x;
      alb *= 1.0 + c0 * 0.25 * uP.x;
    }
    float hb = fbm(q * f + Lq * 0.02 + uSeed * 1.3);
    shade += (hb - h) * 12.0;
    if (uP.w > 0.0) {
      float c = abs(fbm(q * 3.0 + 20.0) - 0.5);
      float line = 1.0 - smoothstep(0.0, 0.022, c);
      float c2 = abs(fbm(q * 7.0 + 5.0) - 0.5);
      line = max(line, (1.0 - smoothstep(0.0, 0.014, c2)) * 0.6);
      alb = mix(alb, uC3, line * uP.w);
    }
    if (uP.z > 0.0) {
      float cap = smoothstep(0.82, 0.88, abs(n.y) + (h - 0.5) * 0.15);
      alb = mix(alb, uC4, cap * uP.z);
    }
    if (uQ.z > 0.0) {
      vec2 v = voro3(q * 4.0);
      float spot = (1.0 - smoothstep(0.05, 0.11, v.x)) * step(0.45, v.y);
      float ring = exp(-pow((v.x - 0.2) / 0.06, 2.0)) * step(0.7, v.y);
      alb = mix(alb, uC3, spot);
      alb = mix(alb, uC4, ring * 0.45);
    }
    if (uQ.x > 0.0) {
      vec3 hc = normalize(vec3(0.3, -0.12, 1.0));
      float d = distance(q, hc) + (fbm(q * 4.0) - 0.5) * 0.18;
      alb = mix(alb, uC3, (1.0 - smoothstep(0.34, 0.44, d)) * uQ.x);
    }
    float ndl = dot(n, LIGHT);
    float lam = max(ndl, 0.0);
    vec3 col = alb * (0.025 + 1.1 * lam * clamp(1.0 + shade, 0.2, 2.0));
    if (uExt > 1.01) {
      float fr = pow(1.0 - n.z, 3.0);
      col += uC3 * fr * 0.45 * smoothstep(-0.3, 0.4, ndl);
    }
    float a = edge(r, 1.0);
    o = over(vec4(col, a), o);
  }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

const ASTEROID = /* glsl */ `
void main() {
  vec2 p = rot(uTime * 0.015 + uSeed) * vP;
  float r = length(p);
  vec2 dir = p / max(r, 1e-4);
  float R = 1.0 - uP.x * fbm3(vec3(dir * 1.4, uSeed));
  float ang = atan(dir.y, dir.x);
  R *= 1.0 - uP.z * 0.33 * exp(-pow((abs(ang) - 1.5708) / 0.45, 2.0));
  vec4 o = vec4(0.0);
  if (uP.w > 0.0) {
    float coma = exp(-r * 2.2) * 0.35;
    vec2 t = rot(-0.5) * vP;
    float tail = exp(-pow(t.y / (0.12 + 0.18 * max(t.x, 0.0)), 2.0)) * smoothstep(0.0, 0.4, t.x) * exp(-t.x * 0.9) * 0.4;
    float jets = pow(max(0.0, fbm3(vec3(ang * 2.0, r * 2.0 - uTime * 0.3, uSeed))), 3.0) * exp(-r * 1.5) * 0.6;
    o = vec4(uC4, clamp((coma + tail + jets) * uP.w * smoothstep(uExt, uExt * 0.7, r), 0.0, 1.0));
  }
  if (r < R + 0.02) {
    vec2 pn = p / R;
    vec3 n = normalize(vec3(pn, sqrt(max(0.0, 1.0 - dot(pn, pn))) + 0.15));
    vec3 q = vec3(pn, n.z) + uSeed;
    float f = uP.y * 2.0;
    float h = fbm(q * f * 2.0);
    vec3 alb = mix(uC1, uC2, smoothstep(0.3, 0.75, h));
    alb = mix(alb, uC3, smoothstep(0.6, 0.85, fbm(q * f * 5.0 + 7.0)) * 0.4);
    vec3 L = vec3(rot(-uTime * 0.015 - uSeed) * LIGHT.xy, LIGHT.z);
    float c0 = craters(q * f * 2.0) * 0.6 + craters(q * f * 5.0 + 2.0) * 0.3;
    vec3 q2 = q + L * 0.02;
    float c1 = craters(q2 * f * 2.0) * 0.6 + craters(q2 * f * 5.0 + 2.0) * 0.3;
    float hb = fbm(q2 * f * 2.0);
    float shade = (c1 - c0) * 14.0 + (hb - h) * 14.0;
    float lam = max(dot(n, L), 0.0);
    vec3 col = alb * (0.03 + 1.15 * lam * clamp(1.0 + shade, 0.15, 2.2));
    o = over(vec4(col, edge(r, R)), o);
  }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

const EARTH = /* glsl */ `
void main() {
  vec2 p = vP; float r = length(p);
  vec3 atm = vec3(0.35, 0.6, 1.0);
  float g = exp(-(r - 1.0) / (uExt - 1.0) * 3.0) * smoothstep(uExt, 1.0, r) * step(0.98, r);
  vec4 o = vec4(atm, g * 0.55);
  if (r < 1.0) {
    vec3 n = sphere(p);
    vec3 q = rotY(n, uTime * 0.05 + 2.0);
    float c = fbm(q * 1.8 + 3.1);
    float land = smoothstep(0.52, 0.535, c);
    float lat = abs(q.y);
    float desert = smoothstep(0.5, 0.62, fbm(q * 3.0 + 9.0)) * smoothstep(0.45, 0.1, abs(lat - 0.3));
    vec3 landCol = mix(uC2 * (0.6 + 0.6 * fbm(q * 9.0)), uC3, desert);
    vec3 ocean = mix(uC1 * 0.55, uC1 * 1.35, smoothstep(0.3, 0.52, c));
    vec3 alb = mix(ocean, landCol, land);
    float ice = smoothstep(0.8, 0.86, lat + (c - 0.5) * 0.25);
    alb = mix(alb, vec3(0.93, 0.96, 1.0), ice);
    vec3 cq = rotY(n, uTime * 0.065 + 1.0);
    float cl = fbm(cq * 3.0 + vec3(0.0, uTime * 0.01, 0.0));
    cl = smoothstep(0.52, 0.78, cl + 0.07 * sin(q.y * 9.0));
    float ndl = dot(n, LIGHT);
    float lam = max(ndl, 0.0);
    vec3 col = alb * lam * 1.1;
    vec3 H = normalize(LIGHT + vec3(0.0, 0.0, 1.0));
    col += pow(max(dot(n, H), 0.0), 40.0) * (1.0 - land) * (1.0 - cl) * 0.6;
    col = mix(col, vec3(1.0) * (0.03 + lam * 1.05), cl * 0.92);
    float night = smoothstep(0.05, -0.2, ndl);
    float city = step(0.82, hash31(floor(q * 140.0))) * land * (1.0 - ice) * (1.0 - cl);
    col += vec3(1.0, 0.72, 0.38) * city * night * smoothstep(0.42, 0.6, fbm(q * 6.0));
    float fr = pow(1.0 - n.z, 2.5);
    col += atm * fr * 0.8 * smoothstep(-0.25, 0.5, ndl);
    o = over(vec4(col, edge(r, 1.0)), o);
  }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

const GAS = /* glsl */ `
vec4 rings(vec2 p, out bool behind) {
  vec2 rp = rot(uQ.w) * p;
  behind = rp.y > 0.0;
  if (uP.w <= 0.0) return vec4(0.0);
  float tilt = 0.3;
  vec2 e = vec2(rp.x, rp.y / tilt);
  float rr = length(e);
  float inner = 1.25, outer = 2.25;
  if (rr < inner || rr > outer) return vec4(0.0);
  float t = (rr - inner) / (outer - inner);
  float dens;
  if (uP.w >= 0.99) {
    dens = 0.55 + 0.18 * sin(rr * 90.0) + 0.3 * (noise(vec3(rr * 40.0, 0.0, 0.0)) - 0.5);
    dens *= 1.0 - (smoothstep(0.66, 0.68, t) - smoothstep(0.72, 0.74, t));
    dens *= smoothstep(0.0, 0.08, t) * (0.35 + 0.65 * smoothstep(0.1, 0.3, t)) * smoothstep(1.0, 0.97, t);
  } else {
    dens = 0.0;
    dens += exp(-pow((t - 0.30) / 0.01, 2.0));
    dens += exp(-pow((t - 0.42) / 0.01, 2.0));
    dens += exp(-pow((t - 0.55) / 0.012, 2.0));
    dens += exp(-pow((t - 0.85) / 0.02, 2.0)) * 1.4;
    dens *= uP.w * 1.6;
  }
  vec3 rc = mix(uC2, uC4, noise(vec3(rr * 30.0, 1.0, 1.0)));
  float lit = 0.75 + 0.35 * smoothstep(0.6, -0.6, rp.x);
  return vec4(rc * lit, clamp(dens, 0.0, 1.0));
}

void main() {
  vec2 p = vP; float r = length(p);
  bool behind;
  vec4 ring = rings(p, behind);
  float g = 0.0;
  if (uExt > 1.01 && uP.w <= 0.0) g = exp(-(r - 1.0) / (uExt - 1.0) * 3.5) * smoothstep(uExt, 1.0, r) * step(0.98, r);
  vec4 o = vec4(uC4, g * 0.4);
  vec4 planet = vec4(0.0);
  if (r < 1.0) {
    vec3 n = sphere(p);
    vec3 q = rotY(n, uTime * 0.04 + uSeed);
    float lat = q.y;
    float w = fbm(vec3(q.x * 3.0, lat * 12.0, q.z * 3.0) + uTime * 0.01) - 0.5;
    float w2 = fbm(q * vec3(6.0, 20.0, 6.0) + 3.0) - 0.5;
    float b = sin((lat + w * uP.y * 0.25 + w2 * uP.y * 0.06) * uP.x * 3.14159);
    vec3 alb = mix(uC1, uC2, 0.5 + 0.5 * b);
    alb = mix(alb, uC3, smoothstep(0.05, 0.35, w2) * 0.3);
    alb = mix(alb, uC4, smoothstep(0.8, 1.0, b) * 0.35);
    if (uP.z > 0.0) {
      vec3 sc = normalize(vec3(0.45, -0.36, 0.82));
      float d = length((q - sc) * vec3(1.0, 1.9, 1.0)) + w2 * 0.06;
      float s = 1.0 - smoothstep(0.1, 0.17, d);
      vec3 sCol = uQ.y > 0.0 ? uC1 * 0.45 : uC3 * 1.15;
      alb = mix(alb, sCol, s * uP.z);
    }
    float ndl = dot(n, LIGHT);
    float lam = max(ndl, 0.0);
    vec3 col = alb * (0.02 + 1.1 * lam) * (0.75 + 0.25 * n.z);
    float fr = pow(1.0 - n.z, 2.5);
    col += uC4 * fr * uQ.x * 0.6 * smoothstep(-0.3, 0.5, ndl);
    planet = vec4(col, edge(r, 1.0));
  }
  if (behind) { o = over(ring, o); o = over(planet, o); }
  else { o = over(planet, o); o = over(ring, o); }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

const STAR = /* glsl */ `
void main() {
  vec2 p = vP; float r = length(p);
  float glow = (0.6 * exp(-(r - 1.0) * 7.0) + 0.3 * exp(-(r - 1.0) * 2.2)) * smoothstep(uExt, uExt * 0.7, r);
  float ang = atan(p.y, p.x);
  glow *= 0.85 + 0.3 * fbm3(vec3(cos(ang) * 3.0, sin(ang) * 3.0, uTime * 0.15 + r));
  vec4 o = vec4(uC1, clamp(glow, 0.0, 1.0) * step(0.97, r));
  if (uP.z > 0.0) {
    float dust = fbm(vec3(p * 2.2, uTime * 0.02 + uSeed)) * smoothstep(uExt, 1.0, r) * step(0.98, r);
    o = over(vec4(uC3 * 0.8, smoothstep(0.35, 0.8, dust) * 0.55 * uP.z), o);
  }
  if (r < 1.0) {
    vec3 n = sphere(p);
    vec3 q = rotY(n, uTime * 0.015 + uSeed);
    float fq = 9.0 / uP.x;
    float gran = fbm(q * fq + vec3(0.0, uTime * 0.04, 0.0));
    float g2 = noise(q * fq * 3.0 + uTime * 0.1);
    float mu = n.z;
    float limb = 0.3 + 0.7 * pow(mu, 0.55);
    vec3 c = mix(uC3, uC1, limb);
    c = mix(c, uC2, pow(mu, 3.0) * 0.55);
    c *= 0.88 + uP.y * 0.3 * (gran - 0.5) * 2.0 + 0.1 * g2;
    c *= 1.0 - smoothstep(1.5, 4.0, uP.x) * 0.3 * smoothstep(0.58, 0.78, fbm(q * fq * 0.4 + 7.0));
    o = over(vec4(c * 1.15, edge(r, 1.0)), o);
  }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

const NEUTRON = /* glsl */ `
void main() {
  vec2 p = vP; float r = length(p);
  float t = uTime * 1.8;
  vec3 m = vec3(sin(0.55) * cos(t), cos(0.55), sin(0.55) * sin(t));
  vec2 md = normalize(m.xy);
  float along = dot(p, md);
  float perp = abs(p.x * md.y - p.y * md.x);
  float wdt = 0.08 + 0.12 * abs(along);
  float beam = exp(-pow(perp / wdt, 2.0)) * exp(-abs(along) * 0.55) * smoothstep(0.9, 1.4, abs(along));
  beam *= 0.6 + 0.4 * abs(m.z);
  float glow = exp(-(r - 1.0) * 1.6) * 0.55 * step(0.98, r);
  vec4 o = vec4(uC3, clamp(beam + glow, 0.0, 1.0) * smoothstep(uExt, uExt * 0.8, r));
  if (r < 1.0) {
    vec3 n = sphere(p);
    vec3 c = mix(uC1, uC2, pow(n.z, 1.5));
    c += 0.2 * noise(rotY(n, t) * 6.0);
    o = over(vec4(c, edge(r, 1.0)), o);
  }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

const BLACKHOLE = /* glsl */ `
void main() {
  vec2 p = vP; float r = length(p);
  float tilt = uP.x;
  vec2 e = vec2(p.x, p.y / tilt);
  float dr = length(e);
  float a2 = atan(e.y, e.x) - uTime * 0.6 / dr;
  float s = fbm(vec3(cos(a2) * dr * 2.5, sin(a2) * dr * 2.5, dr * 1.5 + uSeed));
  float diskI = smoothstep(1.4, 1.7, dr) * (1.0 - smoothstep(2.3, 3.1, dr)) * (0.35 + 1.2 * s) * pow(1.7 / dr, 1.4);
  diskI *= 1.0 - 0.6 * (e.x / dr);
  vec3 diskC = mix(uC3, uC1, smoothstep(2.9, 1.8, dr));
  diskC = mix(diskC, uC2, smoothstep(2.1, 1.5, dr) * 0.7);

  vec4 o = vec4(0.0);
  if (uP.z > 0.0) {
    float halo = exp(-r * 0.9) * 0.45 * uP.z * smoothstep(uExt, uExt * 0.6, r);
    o = vec4(uC1, halo);
  }
  if (uP.w > 0.0) {
    float jet = exp(-pow(p.x / (0.06 + 0.06 * abs(p.y)), 2.0)) * smoothstep(1.0, 1.6, abs(p.y)) * exp(-abs(p.y) * 0.25);
    jet *= 0.7 + 0.5 * fbm3(vec3(p.x * 4.0, abs(p.y) * 2.0 - uTime * 1.5, 1.0));
    o = over(vec4(mix(uC1, vec3(0.7, 0.85, 1.0), 0.6), clamp(jet * uP.w, 0.0, 1.0)), o);
  }
  float pa = atan(p.y, p.x) - uTime * 0.35;
  float lens = exp(-pow((r - 1.16) / 0.07, 2.0)) * (0.35 + 0.65 * smoothstep(-0.6, 0.8, p.y / max(r, 1e-3))) * 0.8;
  lens *= 0.55 + 0.7 * fbm3(vec3(cos(pa) * 3.0, sin(pa) * 3.0, 1.0));
  float ring = exp(-pow((r - 1.04) / 0.025, 2.0));
  float bright = uP.y;
  float backDisk = diskI * step(0.0, p.y) * smoothstep(0.98, 1.03, r) * bright;
  o = over(vec4(diskC * 1.2, clamp(backDisk, 0.0, 1.0)), o);
  o = over(vec4(mix(uC1, uC2, 0.4) * 1.2, clamp(lens * bright, 0.0, 1.0)), o);
  o = over(vec4(uC2 * 1.3, clamp(ring * bright, 0.0, 1.0)), o);
  o = over(vec4(vec3(0.0), 1.0 - smoothstep(0.97, 1.0, r)), o);
  float frontDisk = diskI * step(p.y, 0.0) * bright;
  o = over(vec4(diskC * 1.2, clamp(frontDisk, 0.0, 1.0)), o);
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

const ORBIT = /* glsl */ `
void main() {
  vec2 p = vP; float r = length(p);
  float px = px1();
  vec4 o = vec4(uC3, 0.04 * (1.0 - smoothstep(1.0 - px, 1.0, r)));
  if (uP.w > 0.0) {
    float belt = smoothstep(0.40, 0.44, r) * (1.0 - smoothstep(0.6, 0.65, r));
    float s = stars(rot(uTime * 0.02) * p, 180.0, belt * 0.7) + stars(rot(uTime * 0.025) * p, 420.0, belt * 0.5);
    o = over(vec4(vec3(0.75, 0.68, 0.6), clamp(s, 0.0, 1.0) * 0.8), o);
  }
  for (int i = 0; i < 8; i++) {
    if (i >= uOrbN) break;
    float ro = uOrb[i];
    bool main = i == uOrbN - 1;
    float lw = px * (main ? 1.2 : 0.8);
    float line = exp(-pow((r - ro) / lw, 2.0));
    o = over(vec4(main ? uC2 : uC3, line * (main ? 0.85 : 0.6)), o);
    float w = min(0.35 * pow(ro, -1.5), 2.5) * 0.12;
    float ang = uTime * w + float(i) * 2.4 + uSeed;
    vec2 pp = ro * vec2(cos(ang), sin(ang));
    float rad = max(main ? uP.z : 0.0, (main ? 3.2 : 2.2) * px);
    float d = length(p - pp);
    float dotA = 1.0 - smoothstep(rad - px, rad + px, d);
    float dotG = exp(-d / (rad * 2.5)) * 0.35;
    vec3 dc = main ? uC2 : mix(uC3, vec3(1.0), 0.55);
    o = over(vec4(dc, clamp(dotA + dotG, 0.0, 1.0)), o);
  }
  float cr = max(uP.y, 3.0 * px);
  float core = 1.0 - smoothstep(cr - px, cr + px, r);
  float glow = exp(-r / (cr * 2.5)) * 0.8 * uP.x;
  o = over(vec4(uC1, clamp(core + glow, 0.0, 1.0)), o);
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

const BUBBLE = /* glsl */ `
void main() {
  vec2 p = vP; float r = length(p);
  float px = px1();
  vec2 q = p + vec2(0.12, 0.0);
  float sx = q.x < 0.0 ? q.x * 0.62 : q.x;
  float d = length(vec2(sx, q.y));
  float fl = fbm(vec3(p * 3.0 + vec2(uTime * 0.03, 0.0), uSeed));
  float shell = exp(-pow((d - 1.0 + (fl - 0.5) * 0.1) / 0.07, 2.0));
  float inside = (1.0 - smoothstep(0.88, 1.02, d)) * 0.13 * (0.5 + 0.9 * fl);
  float term = exp(-pow((r - 0.72 - (fl - 0.5) * 0.04) / 0.03, 2.0)) * 0.35;
  float bow = exp(-pow((length(p - vec2(-0.35, 0.0)) - 1.42) / 0.07, 2.0)) * smoothstep(0.3, 0.95, p.x) * 0.3;
  vec4 o = vec4(uC1, clamp(inside + bow, 0.0, 1.0));
  o = over(vec4(uC2, clamp(shell * (0.5 + 0.6 * fl) + term, 0.0, 1.0)), o);
  float orbit = exp(-pow((r - 0.25) / px, 2.0)) * 0.5;
  o = over(vec4(vec3(0.6, 0.75, 1.0), orbit), o);
  float sun = exp(-r / (4.0 * px)) + (1.0 - smoothstep(1.5 * px, 2.5 * px, r));
  o = over(vec4(uC3, clamp(sun, 0.0, 1.0)), o);
  gl_FragColor = vec4(o.rgb, o.a * uAlpha * smoothstep(uExt, uExt * 0.9, r));
}
`;

const SHELL = /* glsl */ `
void main() {
  vec2 p = vP; float r = length(p);
  float px = px1();
  float shell = r < 1.0 ? 0.35 / sqrt(max(1.0 - r * r, 0.03)) : 0.0;
  shell *= smoothstep(1.0, 0.97, r);
  float inner = exp(-r * 7.0) * 1.2;
  float dens = clamp((shell + inner) * (0.6 + 0.8 * fbm3(vec3(p * 3.0, uSeed))), 0.0, 1.5);
  float s = stars(p, 70.0, dens * 0.5) + stars(p, 160.0, dens * 0.5) + stars(p, 360.0, dens * 0.5);
  vec4 o = vec4(uC1, clamp(dens * 0.08 + s, 0.0, 1.0));
  float sun = exp(-r / (4.0 * px)) + (1.0 - smoothstep(1.5 * px, 2.5 * px, r));
  o = over(vec4(uC2, clamp(sun, 0.0, 1.0)), o);
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

const NEBULA = /* glsl */ `
void main() {
  vec2 p = vP; float r = length(p);
  float px = px1();
  vec3 pp = vec3(p * 1.5, uSeed * 0.37);
  vec3 warp = vec3(fbm(pp + vec3(0.0, 0.0, uTime * 0.004)), fbm(pp + vec3(5.2, 1.3, 2.0)), 0.0);
  float w = fbm(pp * 1.2 + warp * 1.6);
  float w2 = fbm(pp * 3.1 + warp * 2.0 + 4.0);
  int shape = int(uP.x + 0.5);
  float dens = 0.0;
  vec3 col = uC1;
  bool addStars = true;
  if (shape == 0) {
    dens = smoothstep(1.05, 0.15, r + (w - 0.5) * 0.9) * (0.3 + 1.1 * w);
    col = mix(uC2, uC1, smoothstep(0.35, 0.7, w));
    col = mix(col, uC3, smoothstep(0.55, 0.8, w2) * 0.6);
    float core = exp(-r * r * 12.0) * uQ.x;
    col = mix(col, uC4, core * 0.6);
    dens += core * 0.5;
    dens *= 1.0 - 0.7 * smoothstep(0.55, 0.78, fbm(pp * 2.2 + 9.0));
  } else if (shape == 1) {
    float rr = r * (1.0 + (w - 0.5) * 0.25);
    dens = exp(-pow((rr - 0.62) / 0.2, 2.0)) * (0.55 + 0.8 * w2);
    dens += smoothstep(0.6, 0.0, rr) * 0.4;
    col = mix(uC1, uC3, smoothstep(0.2, 0.55, rr));
    col = mix(col, uC2, smoothstep(0.55, 0.85, rr));
    if (uQ.x < 0.99) {
      vec2 e1 = rot(0.6) * p; float d1 = length(e1 * vec2(1.0, 1.8));
      vec2 e2 = rot(-0.5) * p; float d2 = length(e2 * vec2(1.7, 1.0));
      float sh = exp(-pow((d1 - 0.42) / 0.035, 2.0)) * 0.9 + exp(-pow((d2 - 0.5) / 0.035, 2.0)) * 0.7;
      dens += sh;
      col = mix(col, uC3, clamp(sh, 0.0, 1.0) * 0.6);
      dens += smoothstep(1.0, 0.7, r) * 0.12 * w2;
    }
    dens *= smoothstep(1.0, 0.85, r);
    float star = exp(-r / (3.0 * px)) + (1.0 - smoothstep(1.2 * px, 2.2 * px, r));
    col = mix(col, uC4, clamp(star, 0.0, 1.0));
    dens = max(dens, star);
    addStars = false;
  } else if (shape == 2) {
    float bg = smoothstep(1.0, 0.0, r) * 0.6 * (0.35 + w);
    float pil = 0.0;
    float rim = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float top = i == 0 ? 0.62 : (i == 1 ? 0.05 : -0.32);
      float x0 = -0.42 + 0.42 * fi + 0.07 * sin(p.y * 2.3 + fi * 2.0) - (p.y + 1.0) * 0.06 * (1.0 - fi);
      float t = clamp((p.y + 1.0) / (top + 1.0), 0.0, 1.0);
      float wdt = mix(0.19, 0.075, t) * (0.75 + 0.6 * fbm3(vec3(p.y * 3.0, fi * 4.0, uSeed)));
      float rough = (fbm(vec3(p * 9.0, fi + uSeed)) - 0.5) * 0.07 + (w2 - 0.5) * 0.08;
      float body = max(abs(p.x - x0) - wdt, p.y - top) + rough;
      float head = length((p - vec2(x0 + 0.02, top - 0.02)) * vec2(1.0, 1.25)) - wdt * 1.35 + rough;
      float d = min(body, head);
      float c = 1.0 - smoothstep(-0.015, 0.015, d);
      pil = max(pil, c);
      float lit = 0.4 + 0.6 * smoothstep(top - 0.5, top, p.y);
      rim = max(rim, exp(-pow(d / 0.03, 2.0)) * lit);
    }
    float base = smoothstep(-0.55, -0.9, p.y + (w - 0.5) * 0.35);
    pil = max(pil, base);
    col = mix(uC3, uC2, smoothstep(0.45, 0.75, w) * 0.7);
    vec3 dust = uC1 * (0.45 + 0.9 * w2);
    col = mix(col, dust, pil);
    col = mix(col, uC4, clamp(rim, 0.0, 1.0) * 0.75);
    dens = max(bg, max(pil * 0.96, rim * 0.9)) * smoothstep(1.0, 0.82, r);
  } else if (shape == 3) {
    float y0 = 0.25 * sin(p.x * 3.0 + 1.0);
    float band = exp(-pow((p.y - y0) / (0.1 + 0.08 * w), 2.0)) * smoothstep(1.0, 0.7, abs(p.x));
    band *= 0.35 + 1.3 * smoothstep(0.4, 0.72, w2);
    col = mix(uC2, uC1, smoothstep(0.3, 0.7, w));
    col = mix(col, uC3, smoothstep(0.6, 0.8, w2) * 0.5);
    dens = band;
  } else if (shape == 4) {
    float d = smoothstep(1.0, 0.5, r + (w - 0.5) * 0.35);
    col = mix(uC2, uC1, smoothstep(0.0, 0.6, d));
    col += uC3 * exp(-pow((r - 0.92) / 0.08, 2.0)) * 0.35;
    dens = clamp(d * 1.05 + smoothstep(1.15, 0.85, r) * 0.2, 0.0, 1.0);
    addStars = false;
  } else {
    float ell = length(p * vec2(0.8, 1.1));
    float mask = smoothstep(1.0, 0.65, ell + (w - 0.5) * 0.3);
    float fil = 1.0 - abs(fbm(pp * 2.5 + warp * 2.0) * 2.0 - 1.0);
    fil = pow(fil, 6.0);
    col = uC2 * 0.8 * smoothstep(0.9, 0.0, ell);
    col = mix(col, uC1 * 1.3, clamp(fil * 1.6, 0.0, 1.0));
    col = mix(col, uC3, clamp(fil * fil, 0.0, 1.0));
    dens = mask * (0.3 + fil * 1.4);
    float star = exp(-r / (3.0 * px)) + (1.0 - smoothstep(1.2 * px, 2.2 * px, r));
    col = mix(col, uC4, clamp(star, 0.0, 1.0));
    dens = max(dens, star);
  }
  vec4 o = vec4(col, clamp(dens, 0.0, 1.0));
  if (addStars) {
    float s = stars(p, 45.0, 0.12) + stars(p, 120.0, 0.1) * 0.8;
    o = over(vec4(mix(uC4, vec3(1.0), 0.6), clamp(s, 0.0, 1.0) * smoothstep(1.0, 0.8, r)), o);
  }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

const CLUSTER = /* glsl */ `
void main() {
  vec2 p = vP; float r = length(p);
  float dens;
  float neb = 0.0;
  if (uP.y > 0.5) {
    vec2 e = rot(0.35) * p;
    float dr = length(e * vec2(1.0, 2.3));
    float clump = 0.35 + 1.3 * smoothstep(0.45, 0.72, fbm(vec3(p * 3.0, uSeed)));
    dens = exp(-pow((dr - 0.72) / 0.2, 2.0)) * clump;
    neb = smoothstep(0.6, 0.82, fbm(vec3(p * 4.0, 2.0))) * dens;
  } else {
    dens = pow(1.0 + pow(r / 0.12, 2.0), -1.5) * smoothstep(1.0, 0.75, r);
  }
  float s1 = stars(p, 40.0, dens * 0.9) * 1.3 + stars(p, 95.0, dens);
  float s2 = stars(p + 0.37, 210.0, dens) + stars(p + 0.71, 460.0, dens);
  vec4 o = vec4(uC1, clamp(dens * 0.4, 0.0, 1.0));
  o = over(vec4(uC3, clamp(neb * 0.7, 0.0, 1.0)), o);
  o = over(vec4(uC2, clamp(s1, 0.0, 1.0)), o);
  o = over(vec4(mix(uC1, uC3, 0.3), clamp(s2, 0.0, 1.0)), o);
  gl_FragColor = vec4(o.rgb, o.a * uAlpha * smoothstep(uExt, uExt * 0.85, r));
}
`;

const GALAXY = /* glsl */ `
void main() {
  vec2 p = vP;
  vec2 d = rot(uQ.y) * p;
  d.y /= max(uQ.x, 0.05);
  float r = length(d);
  float ang = atan(d.y, d.x);
  int type = int(uP.x + 0.5);
  float I = 0.0;
  vec3 col = uC1;
  float sp = 0.0;
  if (type == 0) {
    I = exp(-4.2 * sqrt(r)) * 2.2 * smoothstep(1.0, 0.6, r) + exp(-r * r * 4.0) * 0.08;
    col = mix(uC3, uC2, exp(-r * 3.0));
    sp = stars(p, 60.0, 0.35 * smoothstep(1.0, 0.2, r)) * 0.8;
  } else if (type == 1) {
    float nz = fbm(vec3(d * 4.0, uSeed));
    float spiral = uP.y * (ang - 2.3 * log(r + 0.001)) + nz * 2.2 + uTime * 0.02;
    float arm = pow(0.5 + 0.5 * cos(spiral), 2.5) + 0.35 * pow(0.5 + 0.5 * cos(spiral * 2.0 + 1.3), 3.0);
    float disk = exp(-r * 2.4) * smoothstep(1.02, 0.7, r);
    float bulge = exp(-pow(r / (0.2 * uP.z + 0.02), 2.0)) * 1.3;
    float bar = uQ.z > 0.0 ? exp(-(pow(d.x / 0.3, 2.0) + pow(d.y / 0.075, 2.0))) * uQ.z * 0.8 : 0.0;
    float dust = pow(0.5 + 0.5 * cos(spiral - 0.9), 8.0) * smoothstep(0.08, 0.3, r) * (1.0 - smoothstep(0.6, 0.95, r));
    float knots = smoothstep(0.7, 0.86, fbm(vec3(d * 14.0, uSeed + 3.0))) * arm * smoothstep(0.15, 0.4, r);
    I = disk * (0.3 + 1.5 * arm) * 1.6 * uP.w + bulge + bar;
    I *= 1.0 - dust * 0.6;
    col = mix(uC1, uC2, clamp(bulge * 1.4 + bar * 1.2, 0.0, 1.0));
    col = mix(col, uC3, knots * 0.85);
    I += knots * disk * 1.5;
    sp = (stars(p, 70.0, arm * disk * 2.5) + stars(p, 170.0, arm * disk * 2.5)) * uP.w;
  } else {
    float w = fbm(vec3(d * 2.2, uSeed));
    float body = smoothstep(1.0, 0.15, r + (w - 0.5) * 0.9);
    float bar = uP.y > 0.5 ? exp(-(pow(d.x / 0.45, 2.0) + pow((d.y + 0.05) / 0.12, 2.0))) : 0.0;
    float knots = smoothstep(0.68, 0.84, fbm(vec3(d * 9.0, uSeed + 5.0))) * body;
    I = (body * 0.5 * (0.4 + w) + bar * 0.6 + knots * 0.9) * uP.w * 1.4;
    col = mix(uC1, uC2, clamp(bar, 0.0, 1.0));
    col = mix(col, uC3, knots);
    sp = stars(p, 80.0, body * 0.6) + stars(p, 190.0, body * 0.6);
  }
  vec4 o = vec4(col * 1.1, clamp(I, 0.0, 1.0));
  o = over(vec4(vec3(1.0, 0.97, 0.92), clamp(sp, 0.0, 1.0)), o);
  gl_FragColor = vec4(o.rgb, o.a * uAlpha * smoothstep(uExt, uExt * 0.9, length(p)));
}
`;

const GROUP = /* glsl */ `
vec4 miniGalaxy(vec2 lp, float spiral, float incl) {
  lp.y /= incl;
  float rr = length(lp);
  if (rr > 1.2) return vec4(0.0);
  float I;
  vec3 c;
  if (spiral > 0.5) {
    float arm = 0.5 + 0.5 * cos(2.0 * (atan(lp.y, lp.x) - 2.5 * log(rr + 0.01)));
    I = exp(-rr * 4.0) * (0.4 + 0.9 * arm) + exp(-rr * rr * 60.0) * 0.8;
    c = mix(uC1, uC2, exp(-rr * 6.0));
  } else {
    I = exp(-rr * rr * 7.0) * 0.9 + exp(-rr * rr * 60.0) * 0.4;
    c = uC2;
  }
  return vec4(c, clamp(I * smoothstep(1.2, 0.7, rr), 0.0, 1.0));
}

void main() {
  vec2 p = vP; float r = length(p);
  float px = px1();
  vec4 o = vec4(0.0);
  if (uP.z > 0.5) {
    float core = exp(-pow(r / 0.02, 2.0)) * 1.5 + exp(-r / 0.03) * 0.3 + (1.0 - smoothstep(1.5 * px, 2.5 * px, r));
    float jet = exp(-pow(p.y / (0.005 + 0.02 * abs(p.x)), 2.0)) * smoothstep(0.95, 0.3, abs(p.x)) * 0.5;
    float lobes = 0.0;
    float mixc = 0.0;
    for (int i = 0; i < 2; i++) {
      float sgn = i == 0 ? -1.0 : 1.0;
      vec2 lp = p - vec2(sgn * 0.74, sgn * 0.04);
      float f = fbm(vec3(p * 5.0, sgn * 3.0 + uTime * 0.01));
      float ld = length(lp * vec2(1.15, 0.85)) + (f - 0.5) * 0.3;
      float l = smoothstep(0.32, 0.04, ld) * (0.45 + fbm(vec3(p * 9.0, 2.0)));
      lobes += l;
      mixc += l * f;
    }
    vec3 lc = mix(uC3, uC1, clamp(mixc / max(lobes, 1e-3) * 1.4, 0.0, 1.0));
    o = vec4(lc, clamp(lobes * 0.8, 0.0, 1.0));
    o = over(vec4(mix(uC1, vec3(1.0), 0.4), clamp(jet, 0.0, 1.0)), o);
    o = over(vec4(uC2, clamp(core, 0.0, 1.0)), o);
  } else {
    float N = uP.x > 0.5 ? 9.0 : 6.0;
    float prof = exp(-r * r * 1.6) * smoothstep(1.0, 0.8, r);
    o = vec4(uC3, exp(-r * r * 3.0) * 0.12 * (0.5 + uP.x) * smoothstep(1.0, 0.7, r));
    vec2 g = p * N;
    vec2 gi = floor(g);
    for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
      vec2 c = gi + vec2(float(i), float(j));
      float h = hash21(c + uSeed);
      vec2 cp = (c + 0.15 + 0.7 * hash22(c + 1.3)) / N;
      float pr = exp(-dot(cp, cp) * 1.6) * smoothstep(1.0, 0.8, length(cp));
      if (h > pr * 0.85) continue;
      float s = (0.08 + 0.3 * pow(hash21(c + 5.1), 3.0)) / N;
      s = max(s, 2.0 * px);
      vec2 lp = rot(hash21(c + 2.2) * 6.28) * (p - cp) / s;
      o = over(miniGalaxy(lp, step(0.45, hash21(c + 8.8)), 0.35 + 0.65 * hash21(c + 4.4)), o);
    }
    if (uP.y > 0.5) {
      o = over(miniGalaxy(rot(0.4) * (p - vec2(-0.26, 0.05)) / 0.08, 1.0, 0.85), o);
      o = over(miniGalaxy(rot(-0.6) * (p - vec2(0.26, -0.06)) / 0.1, 1.0, 0.4), o);
    } else {
      o = over(miniGalaxy((p - vec2(0.03, 0.02)) / 0.07, 0.0, 0.85), o);
    }
    o.a *= smoothstep(1.0, 0.85, r) * (0.4 + 0.6 * prof + 0.4);
  }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

const WEB = /* glsl */ `
float webLayer(vec2 p, float n, float wdt) {
  vec2 q = p * n + (vec2(fbm3(vec3(p * 2.0, uSeed)), fbm3(vec3(p * 2.0, uSeed + 4.0))) - 0.5) * 1.6;
  vec2 v = voro2(q);
  return exp(-pow((v.y - v.x) / wdt, 2.0));
}
void main() {
  vec2 p = vP; float r = length(p);
  float px = px1();
  float n = 2.0 + uP.x;
  float fil = webLayer(p, n, 0.07);
  float fil2 = webLayer(p * 1.0 + 3.3, n * 2.6, 0.05);
  float mask = smoothstep(1.0, 0.82, r + (fbm3(vec3(p * 3.0, uSeed + 9.0)) - 0.5) * 0.12);
  if (uP.w > 0.5) mask *= exp(-pow((p.y + 0.15 * sin(p.x * 2.5)) / 0.3, 2.0));
  if (uP.y > 0.5) mask *= smoothstep(0.35, 0.72, r + (fbm3(vec3(p * 2.0, 3.0)) - 0.5) * 0.25);
  float knots = fil * smoothstep(0.58, 0.8, fbm(vec3(p * n * 2.0, uSeed)));
  float sp = stars(p, n * 30.0, fil * 0.8) + stars(p, n * 75.0, (fil + fil2) * 0.5);
  vec3 col = uC1 * (fil * 0.9 + fil2 * 0.35) + uC2 * knots * 1.3;
  float a = (fil * 0.75 + fil2 * 0.3 + knots * 0.9 + 0.1) * mask;
  vec4 o = vec4(col / max(a, 0.05) * mask + uC3 * 0.2, clamp(a, 0.0, 1.0));
  o = over(vec4(mix(uC2, vec3(1.0), 0.5), clamp(sp * mask, 0.0, 1.0)), o);
  if (uP.z > 0.5) {
    float br = r * (1.0 + (fbm3(vec3(p * 2.0, 9.0)) - 0.5) * 0.45);
    float line = exp(-pow((br - 0.8) / (1.2 * px + 0.002), 2.0));
    o = over(vec4(vec3(0.85, 0.9, 1.0), line * 0.7), o);
    float you = 1.0 - smoothstep(2.0 * px, 3.0 * px, length(p - vec2(-0.32, 0.18)));
    o = over(vec4(vec3(1.0, 0.85, 0.4), you), o);
  }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

const CMB = /* glsl */ `
void main() {
  vec2 p = vP; float r = length(p);
  float px = px1();
  vec4 o = vec4(uC2, exp(-(r - 1.0) * 25.0) * 0.5 * step(1.0, r));
  if (r < 1.0) {
    vec3 n = sphere(p);
    vec3 q = rotY(n, uTime * 0.004);
    float c = fbm(q * 5.0) * 0.65 + fbm(q * 14.0 + 3.0) * 0.35;
    vec3 cmb = mix(uC1 * 0.8, uC2, smoothstep(0.3, 0.62, c));
    cmb = mix(cmb, uC3, smoothstep(0.6, 0.8, c) * 0.8);
    float band = smoothstep(0.84, 0.97, r) * 0.9;
    vec2 wq = p * 7.0 + (vec2(fbm3(vec3(p * 2.0, 1.0)), fbm3(vec3(p * 2.0, 5.0))) - 0.5) * 1.6;
    vec2 v = voro2(wq);
    float fil = exp(-pow((v.y - v.x) / 0.06, 2.0)) * smoothstep(0.9, 0.35, r) * smoothstep(0.03, 0.2, r);
    float sp = stars(p, 160.0, fil * 0.7);
    vec3 inner = uC4 * fil * 1.3 + vec3(1.0, 0.9, 0.8) * sp;
    float ia = clamp(fil * 0.8 + sp + 0.06, 0.0, 1.0);
    vec4 io = vec4(inner / max(ia, 0.05), ia);
    float halo = exp(-r * r * 30.0) * 0.6;
    io = over(vec4(vec3(1.0, 0.85, 0.6), halo), io);
    float you = 1.0 - smoothstep(1.5 * px, 2.5 * px, r);
    io = over(vec4(vec3(1.0), you), io);
    vec4 rim = vec4(cmb, band * edge(r, 1.0));
    o = over(over(rim, io), o);
  }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

export const FRAGMENTS: Record<string, string> = {
  rocky: COMMON + ROCKY,
  asteroid: COMMON + ASTEROID,
  earth: COMMON + EARTH,
  gas: COMMON + GAS,
  star: COMMON + STAR,
  neutron: COMMON + NEUTRON,
  blackhole: COMMON + BLACKHOLE,
  orbit: COMMON + ORBIT,
  bubble: COMMON + BUBBLE,
  shell: COMMON + SHELL,
  nebula: COMMON + NEBULA,
  cluster: COMMON + CLUSTER,
  galaxy: COMMON + GALAXY,
  group: COMMON + GROUP,
  web: COMMON + WEB,
  cmb: COMMON + CMB,
};

export const BG_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }
`;

export const BG_FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uZoom, uPan, uTime;
uniform vec3 uTint, uHaze1, uHaze2;
varying vec2 vUv;

float hash21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float hash31(vec3 p) { p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash31(i), hash31(i + vec3(1, 0, 0)), f.x), mix(hash31(i + vec3(0, 1, 0)), hash31(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0, 0, 1)), hash31(i + vec3(1, 0, 1)), f.x), mix(hash31(i + vec3(0, 1, 1)), hash31(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float fbm3(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s / 0.9375;
}

void main() {
  vec2 fc = (vUv - 0.5) * uRes;
  vec2 hp = fc / uRes.y;
  vec3 col = uTint;
  float h = fbm3(vec3(hp * 1.3 + vec2(uPan * 0.05, 0.0), uZoom * 0.12));
  float h2 = fbm3(vec3(hp * 2.6 - vec2(uPan * 0.03, 0.0), uZoom * 0.12 + 7.0));
  col += uHaze1 * smoothstep(0.45, 0.85, h) * 0.9;
  col += uHaze2 * smoothstep(0.5, 0.9, h2) * 0.7;
  col *= 1.0 - 0.35 * dot(vUv - 0.5, vUv - 0.5) * 2.0;

  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float s = fract(uZoom * 0.45 + fk / 4.0);
    float scale = exp2(s * 4.0);
    float fade = smoothstep(0.0, 0.25, s) * smoothstep(1.0, 0.7, s);
    float cell = 70.0;
    vec2 uv = fc * scale / (cell * 16.0) + vec2(uPan * 0.15, 0.0) / scale + fk * 17.3 + floor(uZoom * 0.45 + fk / 4.0) * 31.7;
    vec2 g = uv * 16.0;
    vec2 i = floor(g), f = fract(g);
    float hsh = hash21(i);
    if (hsh < 0.16) {
      vec2 c = 0.15 + 0.7 * hash22(i + 3.1);
      float cellPx = cell / scale;
      float rad = (0.55 + 0.9 * pow(hash21(i + 1.7), 6.0)) / max(cellPx, 1.0);
      float d = length(f - c);
      float b = exp(-d * d / (rad * rad)) * (0.35 + 0.65 * pow(hash21(i + 5.3), 2.0));
      b *= 0.75 + 0.25 * sin(uTime * (1.0 + 3.0 * hash21(i + 8.0)) + hsh * 40.0);
      vec3 sc = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.85, 0.7), hash21(i + 2.9));
      col += sc * b * fade;
    }
  }
  gl_FragColor = vec4(col, 1.0);
}
`;
