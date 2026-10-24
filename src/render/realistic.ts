// Photo-textured and ray-marched shaders. Lighting is done in linear space,
// textures are sRGB and converted with toLin()/toSrgb().

/**
 * Textured planets and moons, with optional ray-traced rings.
 * uP: x bump strength, y regolith (Lommel–Seeliger) scattering, z atmosphere, w rings (1 texture, 2 thin)
 * uQ: x spin speed, y ring tilt, z ring roll, w limb darkening
 * uC1 texture tint, uC2 atmosphere colour, uC3 thin-ring colour
 */
export const TEXTURED = /* glsl */ `
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float heightAt(vec3 q) { return lum(texSph(uMap, q).rgb); }

vec4 ringAt(float rr) {
  if (uP.w > 1.5) {
    float t = (rr - 1.64) / (2.05 - 1.64);
    if (t < 0.0 || t > 1.0) return vec4(0.0);
    float d = exp(-pow((t - 0.08) / 0.012, 2.0)) * 0.5 + exp(-pow((t - 0.22) / 0.01, 2.0)) * 0.4
            + exp(-pow((t - 0.35) / 0.01, 2.0)) * 0.4 + exp(-pow((t - 0.5) / 0.012, 2.0)) * 0.5
            + exp(-pow((t - 0.96) / 0.022, 2.0)) * 0.95;
    return vec4(toLin(uC3), clamp(d, 0.0, 1.0) * 0.8);
  }
  float t = (rr - 1.24) / (2.27 - 1.24);
  if (t < 0.0 || t > 1.0) return vec4(0.0);
  vec4 c = texture2D(uMap2, vec2(t, 0.5));
  return vec4(toLin(c.rgb), c.a);
}

void main() {
  vec2 p = vP; float r = length(p);
  vec3 RN = vec3(0.0, cos(uQ.y), sin(uQ.y));
  RN.xy = rot(uQ.z) * RN.xy;
  vec4 o = vec4(0.0);

  if (uP.z > 0.0 && r > 0.98) {
    float h = r - 1.0;
    float side = 0.3 + 0.7 * smoothstep(-0.5, 0.8, dot(p / r, normalize(LIGHT.xy)));
    float g = (exp(-h / 0.018) * 0.85 + exp(-h / 0.07) * 0.22) * side * uP.z * smoothstep(uExt, 1.0, r);
    o = vec4(uC2, clamp(g, 0.0, 1.0));
  }

  vec4 planet = vec4(0.0);
  float zs = -1e9;
  if (r < 1.0) {
    zs = sqrt(1.0 - r * r);
    vec3 n = vec3(p, zs);
    float spin = uTime * uQ.x + uSeed;
    vec3 q = rotY(n, -spin);
    vec3 alb = toLin(texSph(uMap, q).rgb * uC1);
    vec3 nn = n;
    if (uP.x > 0.0) {
      vec3 E = normalize(vec3(q.z, 0.0, -q.x) + vec3(1e-5, 0.0, 0.0));
      vec3 Nn = cross(q, E);
      float e = 0.0035;
      float h0 = heightAt(q);
      float hx = heightAt(normalize(q + E * e));
      float hy = heightAt(normalize(q + Nn * e));
      vec3 qn = normalize(q - uP.x * 0.015 * ((hx - h0) / e * E + (hy - h0) / e * Nn));
      nn = rotY(qn, spin);
    }
    float geo = dot(n, LIGHT);
    float lam = max(dot(nn, LIGHT), 0.0);
    float mu = max(n.z, 0.02);
    float ls = 2.0 * lam / (lam + mu);
    float diff = mix(lam, ls * 0.55, uP.y) * smoothstep(-0.06, 0.1, geo);
    if (uQ.w > 0.0) diff *= mix(1.0, pow(mu, 0.3), uQ.w);
    if (uP.w > 0.0) {
      float dn = dot(LIGHT, RN);
      if (abs(dn) > 1e-3) {
        float t = -dot(n, RN) / dn;
        if (t > 0.0) diff *= 1.0 - 0.85 * ringAt(length(n + t * LIGHT)).a;
      }
    }
    vec3 c = alb * (diff * 1.2 + 0.004);
    if (uP.z > 0.0) {
      vec3 atm = toLin(uC2);
      c = mix(c, atm * max(geo, 0.0) * 0.6, uP.z * 0.25 * pow(1.0 - mu, 2.0));
      c += atm * pow(1.0 - mu, 3.0) * uP.z * 0.8 * smoothstep(-0.25, 0.5, geo);
    }
    planet = vec4(toSrgb(c), edge(r, 1.0));
  }

  vec4 ring = vec4(0.0);
  float zr = -1e9;
  if (uP.w > 0.0 && abs(RN.z) > 1e-3) {
    zr = -(p.x * RN.x + p.y * RN.y) / RN.z;
    vec3 P = vec3(p, zr);
    vec4 rc = ringAt(length(P));
    if (rc.a > 0.0) {
      float b = dot(P, LIGHT);
      float disc = b * b - (dot(P, P) - 1.0);
      float sh = (disc > 0.0 && -b - sqrt(disc) > 0.0) ? 0.06 : 1.0;
      float lit = 0.35 + 0.8 * abs(dot(RN, LIGHT));
      ring = vec4(toSrgb(rc.rgb * lit * sh * 1.15), rc.a);
    }
  }
  if (zr > zs) { o = over(planet, o); o = over(ring, o); }
  else { o = over(ring, o); o = over(planet, o); }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha * uLoaded);
}
`;

/** Earth: day map, city lights, clouds with shadows, ocean glint, atmosphere. */
export const EARTH_REAL = /* glsl */ `
void main() {
  vec2 p = vP; float r = length(p);
  vec3 atm = vec3(0.32, 0.56, 1.0);
  vec4 o = vec4(0.0);
  if (r > 0.98) {
    float h = r - 1.0;
    float side = 0.25 + 0.75 * smoothstep(-0.5, 0.8, dot(p / r, normalize(LIGHT.xy)));
    float g = (exp(-h / 0.016) * 0.9 + exp(-h / 0.06) * 0.25) * side * smoothstep(uExt, 1.0, r);
    o = vec4(atm, clamp(g, 0.0, 1.0));
  }
  if (r < 1.0) {
    vec3 n = sphere(p);
    float spin = uTime * 0.03 - 0.45;
    vec3 q = rotY(n, -spin);
    vec3 day = toLin(texSph(uMap, q).rgb);
    vec3 night = toLin(texSph(uMap2, q).rgb);
    float ocean = texSph(uMap4, q).r;
    float cspin = spin + uTime * 0.004;
    vec3 qc = rotY(n, -cspin);
    float cl = texSph(uMap3, qc).r;
    vec3 Lq = rotY(LIGHT, -cspin);
    float cs = texSph(uMap3, normalize(qc + Lq * 0.01)).r;
    float ndl = dot(n, LIGHT);
    float lam = max(ndl, 0.0);
    float mu = max(n.z, 0.02);
    vec3 surf = day * lam * (1.0 - 0.5 * cs) * 1.15;
    vec3 H = normalize(LIGHT + vec3(0.0, 0.0, 1.0));
    float nh = max(dot(n, H), 0.0);
    surf += vec3(1.0, 0.92, 0.8) * (pow(nh, 90.0) * 1.4 + pow(nh, 14.0) * 0.06) * ocean * lam;
    float clw = smoothstep(0.08, 0.85, cl);
    vec3 c = mix(surf, vec3(lam * 1.08 + 0.002), clw * 0.96);
    float dark = smoothstep(0.1, -0.15, ndl);
    c += night * vec3(1.0, 0.78, 0.5) * dark * (1.0 - clw * 0.85) * 1.8;
    vec3 haze = toLin(vec3(0.45, 0.62, 0.95));
    c = mix(c, haze * lam, 0.06 + 0.4 * pow(1.0 - mu, 3.0));
    c += toLin(atm) * pow(1.0 - mu, 2.2) * 0.5 * smoothstep(-0.2, 0.45, ndl);
    c += vec3(1.0, 0.35, 0.1) * exp(-pow(ndl / 0.08, 2.0)) * pow(1.0 - mu, 1.0) * 0.06;
    o = over(vec4(toSrgb(c), edge(r, 1.0)), o);
  }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha * uLoaded);
}
`;

/** Stars: limb-darkened photosphere with granulation from the solar map, corona. */
export const STAR_REAL = /* glsl */ `
void main() {
  vec2 p = vP; float r = length(p);
  float ang = atan(p.y, p.x);
  vec3 base = toLin(uC1), hot = toLin(uC2), cool = toLin(uC3);
  float h = max(r - 1.0, 0.0);
  float streak = fbm3(vec3(cos(ang) * 4.0, sin(ang) * 4.0, uTime * 0.05 + uSeed + h * 1.5));
  float glow = (exp(-h * 10.0) * 0.85 + exp(-h * 2.8) * 0.32 * (0.5 + 0.9 * streak) + exp(-h * 0.9) * 0.07)
             * smoothstep(uExt, uExt * 0.6, r);
  vec4 o = vec4(toSrgb(mix(base, hot, 0.35) * 1.4), clamp(glow, 0.0, 1.0) * step(0.985, r));
  if (uP.z > 0.0) {
    float dust = fbm(vec3(p * 2.2, uTime * 0.02 + uSeed)) * smoothstep(uExt, 1.0, r) * step(0.98, r);
    o = over(vec4(uC3 * 0.7, smoothstep(0.35, 0.8, dust) * 0.55 * uP.z), o);
  }
  if (r < 1.0) {
    vec3 n = sphere(p);
    float mu = n.z;
    vec3 q = rotY(n, -(uTime * 0.01 + uSeed));
    vec3 qd = normalize(q + 0.006 * vec3(noise(q * 40.0 + uTime * 0.3), noise(q * 40.0 + 7.0 + uTime * 0.3), 0.0));
    float tl = (dot(texSph(uMap, qd).rgb, vec3(0.3, 0.59, 0.11)) - 0.55) * 1.8 * uLoaded;
    float cells = (fbm(q * (9.0 / uP.x) + vec3(0.0, uTime * 0.03, 0.0)) - 0.5) * 2.0;
    float big = smoothstep(1.5, 3.5, uP.x);
    float det = mix(tl, cells, big) * uP.y;
    float limb = 1.0 - 0.6 * (1.0 - mu) - 0.2 * pow(1.0 - mu, 2.0);
    vec3 c = mix(cool, base, smoothstep(0.0, 0.55, mu));
    c = mix(c, hot, pow(mu, 4.0) * 0.45);
    c *= limb * (1.0 + det * 0.75);
    c *= 1.0 - big * 0.35 * smoothstep(0.58, 0.78, fbm(q * (9.0 / uP.x) * 0.4 + 7.0));
    c = 1.0 - exp(-c * 2.2);
    o = over(vec4(toSrgb(c), edge(r, 1.0)), o);
  }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;

/**
 * Small irregular bodies, ray-marched as a displaced signed distance field.
 * uP: x lumpiness, y crater frequency, z two-lobed shape, w coma (comets)
 */
export const ASTEROID3D = /* glsl */ `
vec3 rotX(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z); }
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
vec3 body(vec3 p) { return rotY(rotX(p, 0.45), uTime * 0.1 + uSeed); }
float sdf(vec3 p) {
  float d = length(p * vec3(1.0, 0.9, 1.08)) - 1.0;
  if (uP.z > 0.0) {
    float d1 = length((p - vec3(0.05, 0.45, 0.0)) * vec3(1.0, 1.05, 1.1)) - 0.58;
    float d2 = length((p + vec3(0.0, 0.42, 0.0)) * vec3(0.95, 1.0, 1.05)) - 0.72;
    d = mix(d, smin(d1, d2, 0.22), uP.z);
  }
  d += uP.x * (fbm3(p * 1.1 + uSeed) - 0.5) * 2.2;
  d += 0.05 * (fbm3(p * 4.5 + uSeed + 5.0) - 0.5);
  return d;
}
float map(vec3 p) { float k = 1.0 + uP.x * 0.9; return sdf(body(p) * k) / k * 0.7; }

void main() {
  vec2 p = vP; float r = length(p);
  float px = px1();
  vec4 o = vec4(0.0);
  if (uP.w > 0.0) {
    float ang = atan(p.y, p.x);
    float coma = exp(-r * 2.2) * 0.35;
    vec2 t = rot(-0.4) * p;
    float tail = exp(-pow(t.y / (0.12 + 0.18 * max(t.x, 0.0)), 2.0)) * smoothstep(0.0, 0.4, t.x) * exp(-t.x * 0.9) * 0.4;
    float jets = pow(max(0.0, fbm3(vec3(ang * 2.0, r * 2.0 - uTime * 0.3, uSeed))), 3.0) * exp(-r * 1.5) * 0.6;
    o = vec4(uC4, clamp((coma + tail + jets) * uP.w * smoothstep(uExt, uExt * 0.7, r), 0.0, 1.0));
  }
  if (r < 1.2) {
    vec3 ro = vec3(p, 1.5);
    float t = 0.0, minD = 1e9;
    bool hit = false;
    for (int i = 0; i < 56; i++) {
      float d = map(ro - vec3(0.0, 0.0, t));
      minD = min(minD, d);
      if (d < 0.001) { hit = true; break; }
      t += d;
      if (t > 3.0) break;
    }
    float cover = hit ? 1.0 : 1.0 - smoothstep(0.0, 1.3 * px, minD);
    if (cover > 0.01) {
      vec3 P = ro - vec3(0.0, 0.0, t);
      vec2 e = vec2(0.003, 0.0);
      vec3 n = normalize(vec3(
        map(P + e.xyy) - map(P - e.xyy),
        map(P + e.yxy) - map(P - e.yxy),
        map(P + e.yyx) - map(P - e.yyx)));
      vec3 B = body(P);
      float f = uP.y * 2.2;
      float c0 = craters(B * f);
      float cx = craters(body(P + vec3(0.012, 0.0, 0.0)) * f);
      float cy = craters(body(P + vec3(0.0, 0.012, 0.0)) * f);
      float r0 = fbm3(B * 14.0 + uSeed);
      float rx = fbm3(body(P + vec3(0.006, 0.0, 0.0)) * 14.0 + uSeed);
      float ry = fbm3(body(P + vec3(0.0, 0.006, 0.0)) * 14.0 + uSeed);
      n = normalize(n - vec3(cx - c0, cy - c0, 0.0) * 3.2 - vec3(rx - r0, ry - r0, 0.0) * 9.0);
      float hA = fbm3(B * 3.0 + uSeed);
      vec3 alb = toLin(mix(uC1, uC2, smoothstep(0.3, 0.75, hA)));
      alb = mix(alb, toLin(uC3), smoothstep(0.55, 0.9, fbm3(B * 6.0 + 3.0)) * 0.3);
      alb *= 1.0 + c0 * 0.35;
      float sh = 1.0, st = 0.03;
      for (int j = 0; j < 16; j++) {
        float d = map(P + LIGHT * st);
        sh = min(sh, 8.0 * d / st);
        st += clamp(d, 0.02, 0.2);
        if (sh < 0.01 || st > 2.0) break;
      }
      sh = clamp(sh, 0.0, 1.0);
      float lam = max(dot(n, LIGHT), 0.0);
      float mu = max(n.z, 0.05);
      float diff = mix(lam, 2.0 * lam / (lam + mu) * 0.55, 0.6) * sh;
      float ao = clamp(map(P + n * 0.08) / 0.056, 0.3, 1.0);
      alb *= 0.75 + 0.5 * r0;
      vec3 c = alb * (diff * 2.8 + 0.012 * ao);
      o = over(vec4(toSrgb(c), cover), o);
    }
  }
  gl_FragColor = vec4(o.rgb, o.a * uAlpha);
}
`;
