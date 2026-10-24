import * as THREE from 'three';
import { OBJECTS, type SpaceObject } from '../data/objects';
import { BG_FRAG, BG_VERT, FRAGMENTS, VERT } from './shaders';

export interface Placed {
  index: number;
  x: number; // screen px from centre
  y: number;
  r: number; // radius in px
  ext: number;
}

const DEFAULT_EXT: Partial<Record<SpaceObject['kind'], number>> = {
  nebula: 1.15,
  cluster: 1.1,
};

/** Background tint keyed by log10(diameter in metres). */
const TINTS: [number, [number, number, number], [number, number, number], [number, number, number]][] = [
  [2, [0.010, 0.014, 0.030], [0.030, 0.040, 0.090], [0.020, 0.030, 0.060]],
  [9, [0.012, 0.012, 0.032], [0.050, 0.030, 0.090], [0.020, 0.040, 0.080]],
  [16, [0.014, 0.010, 0.030], [0.080, 0.030, 0.090], [0.020, 0.050, 0.090]],
  [21, [0.010, 0.010, 0.028], [0.040, 0.030, 0.110], [0.070, 0.030, 0.070]],
  [27, [0.016, 0.008, 0.026], [0.090, 0.030, 0.080], [0.030, 0.020, 0.090]],
];

function tintAt(logd: number) {
  let a = TINTS[0], b = TINTS[TINTS.length - 1];
  for (let i = 0; i < TINTS.length - 1; i++) {
    if (logd >= TINTS[i][0] && logd <= TINTS[i + 1][0]) { a = TINTS[i]; b = TINTS[i + 1]; break; }
  }
  const t = Math.min(1, Math.max(0, (logd - a[0]) / Math.max(1e-6, b[0] - a[0])));
  const mix = (u: number[], v: number[]) => new THREE.Vector3(...u.map((x, k) => x + (v[k] - x) * t));
  return { tint: mix(a[1], b[1]), h1: mix(a[2], b[2]), h2: mix(a[3], b[3]) };
}

const texLoader = new THREE.TextureLoader();
const texCache = new Map<string, Promise<THREE.Texture>>();
const BASE = import.meta.env.BASE_URL;

function loadTexture(name: string, renderer: THREE.WebGLRenderer) {
  let t = texCache.get(name);
  if (!t) {
    const file = name.includes('.') ? name : `${name}.jpg`;
    t = texLoader.loadAsync(`${BASE}textures/${file}`).then((tex) => {
      tex.colorSpace = THREE.NoColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return tex;
    });
    texCache.set(name, t);
  }
  return t;
}

/** Every texture used by the catalogue, for background preloading. */
export function allTextures() {
  return [...new Set(OBJECTS.flatMap((o) => o.look.tex ?? []))];
}

export class Universe {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  private meshes: (THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null)[] = [];
  private plane = new THREE.PlaneGeometry(1, 1);
  private bg: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private xs: number[] = [];
  private rs: number[] = [];
  width = 1;
  height = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x020308, 1);

    const bgMat = new THREE.ShaderMaterial({
      vertexShader: BG_VERT,
      fragmentShader: BG_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uRes: { value: new THREE.Vector2(1, 1) },
        uZoom: { value: 0 },
        uPan: { value: 0 },
        uTime: { value: 0 },
        uTint: { value: new THREE.Vector3() },
        uHaze1: { value: new THREE.Vector3() },
        uHaze2: { value: new THREE.Vector3() },
      },
    });
    this.bg = new THREE.Mesh(this.plane, bgMat);
    this.bg.frustumCulled = false;
    this.bg.renderOrder = -1000;
    this.scene.add(this.bg);

    // Lay objects out on a line: each one sits to the right of the previous,
    // separated by a gap proportional to the smaller neighbour.
    let x = 0;
    OBJECTS.forEach((o, i) => {
      const r = o.d / 2;
      if (i > 0) {
        const prev = OBJECTS[i - 1];
        const pr = prev.d / 2;
        const pe = this.ext(prev), ce = this.ext(o);
        x += pr + r + pr * 0.55 + pr * Math.max(0, pe - 1) + r * Math.max(0, ce - 1) * 0.6;
      }
      this.xs.push(x);
      this.rs.push(r);
      this.meshes.push(null);
    });
  }

  ext(o: SpaceObject) {
    return o.look.ext ?? DEFAULT_EXT[o.kind] ?? 1;
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.updateProjectionMatrix();
    this.bg.material.uniforms.uRes.value.set(w * dpr, h * dpr);
  }

  /** Radius (px) the focused object gets on screen. */
  focusRadius(progress = 0) {
    const n = OBJECTS.length;
    // Pull back a little on the final object to leave room for the outro.
    const end = Math.min(1, Math.max(0, progress - (n - 2)));
    const wf = this.width < 700 ? 0.3 : 0.2;
    return Math.min(this.width * wf, this.height * 0.27) * (1 - 0.3 * end * end);
  }

  /** Metres per pixel at a given progress. */
  view(progress: number) {
    const n = OBJECTS.length;
    const p = Math.min(Math.max(progress, 0), n - 1);
    const i = Math.min(Math.floor(p), n - 2);
    const f = p - i;
    const r0 = this.rs[i], r1 = this.rs[i + 1];
    const R = Math.exp(Math.log(r0) + (Math.log(r1) - Math.log(r0)) * f);
    const g = r1 === r0 ? f : (R - r0) / (r1 - r0);
    const camX = this.xs[i] + (this.xs[i + 1] - this.xs[i]) * g;
    const k = this.focusRadius(p) / R; // px per metre
    return { camX, k, R };
  }

  private material(o: SpaceObject) {
    const L = o.look;
    const col = (h?: string) => new THREE.Color(h ?? '#ffffff');
    const orb = new Array(8).fill(0);
    (L.orbits ?? []).forEach((v, i) => (orb[i] = v));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAGMENTS[o.kind],
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: L.seed ?? (o.id.length * 7.13) % 10 },
        uExt: { value: this.ext(o) },
        uPx: { value: 100 },
        uAlpha: { value: 1 },
        uC1: { value: col(L.c[0]) },
        uC2: { value: col(L.c[1]) },
        uC3: { value: col(L.c[2]) },
        uC4: { value: col(L.c[3]) },
        uP: { value: new THREE.Vector4(...(L.p ?? [0, 0, 0, 0])) },
        uQ: { value: new THREE.Vector4(...(L.q ?? [0, 0, 0, 0])) },
        uOrb: { value: orb },
        uOrbN: { value: L.orbits?.length ?? 0 },
        uMap: { value: null },
        uMap2: { value: null },
        uMap3: { value: null },
        uMap4: { value: null },
        uLoaded: { value: L.tex ? 0 : 1 },
      },
    });
    if (L.tex) {
      Promise.all(L.tex.map((n) => loadTexture(n, this.renderer))).then((texs) => {
        texs.forEach((t, i) => (mat.uniforms[i === 0 ? 'uMap' : `uMap${i + 1}`].value = t));
        mat.userData.loadedAt = performance.now();
      });
    }
    return mat;
  }

  preload() {
    allTextures().forEach((n) => loadTexture(n, this.renderer));
  }

  render(progress: number, time: number): Placed[] {
    const { camX, k } = this.view(progress);
    const dpr = this.renderer.getPixelRatio();
    const yOff = this.height * (0.03 - 0.07 * Math.min(1, Math.max(0, progress - (OBJECTS.length - 2))));
    const placed: Placed[] = [];
    const lo = Math.max(0, Math.floor(progress) - 5);
    const hi = Math.min(OBJECTS.length - 1, Math.floor(progress) + 3);

    this.meshes.forEach((m, i) => {
      if (m && (i < lo || i > hi)) m.visible = false;
    });

    for (let i = lo; i <= hi; i++) {
      const o = OBJECTS[i];
      const r = this.rs[i] * k;
      const x = (this.xs[i] - camX) * k;
      const ext = this.ext(o);
      const half = r * ext;
      const onScreen = x + half > -this.width / 2 && x - half < this.width / 2 && r > 0.35 && r < this.width * 60;
      if (!onScreen) {
        if (this.meshes[i]) this.meshes[i]!.visible = false;
        continue;
      }
      this.place(i, x, yOff, r, time);
      placed.push({ index: i, x, y: -yOff, r, ext });
    }

    this.background(Math.log10(2 * (this.focusRadius(progress) / k)), progress, time);
    this.renderer.render(this.scene, this.camera);
    return placed;
  }

  /** Show object i centred at (x, y) (three.js coordinates, y up) with radius r px. */
  private place(i: number, x: number, y: number, r: number, time: number) {
    const o = OBJECTS[i];
    let m = this.meshes[i];
    if (!m) {
      m = new THREE.Mesh(this.plane, this.material(o));
      m.frustumCulled = false;
      m.renderOrder = OBJECTS.length - i;
      this.scene.add(m);
      this.meshes[i] = m;
    }
    const half = r * this.ext(o);
    m.visible = true;
    m.position.set(x, y, 0);
    m.scale.set(half * 2, half * 2, 1);
    const u = m.material.uniforms;
    u.uTime.value = time;
    u.uPx.value = r * this.renderer.getPixelRatio();
    u.uAlpha.value = Math.min(1, r / 1.5);
    const at = m.material.userData.loadedAt as number | undefined;
    if (at !== undefined) u.uLoaded.value = Math.min(1, (performance.now() - at) / 500);
    return m;
  }

  private background(logd: number, pan: number, time: number) {
    const bu = this.bg.material.uniforms;
    const t = tintAt(logd);
    bu.uZoom.value = logd;
    bu.uPan.value = pan;
    bu.uTime.value = time;
    bu.uTint.value.copy(t.tint);
    bu.uHaze1.value.copy(t.h1);
    bu.uHaze2.value.copy(t.h2);
  }

  /**
   * Side-by-side comparison: the smaller object on the left at true scale
   * (`ratio` = small / big diameter, animated by the caller), the larger on the right.
   * When the small one is too tiny to see, it is also drawn magnified in an inset.
   */
  renderCompare(a: number, b: number, ratio: number, time: number) {
    const [si, bi] = OBJECTS[a].d <= OBJECTS[b].d ? [a, b] : [b, a];
    this.meshes.forEach((m) => m && (m.visible = false));
    const w = this.width, h = this.height;
    const mobile = w < 700;
    const R = Math.min(w * (mobile ? 0.3 : 0.24), h * 0.27);
    const r = R * ratio;
    const needInset = si !== bi && r < 14;
    const size = Math.round(Math.min(mobile ? 140 : 200, h * 0.24, R * 1.1));
    const gap = Math.max(36, R * 0.25 + 18, needInset ? size / 2 + 28 : 0);
    const total = 2 * r + gap + 2 * R;
    const left = -total / 2;
    const yOff = h * 0.02;
    const xs = left + r, xb = left + 2 * r + gap + R;

    this.place(bi, xb, yOff, R, time);
    if (si !== bi && r > 0.35) this.place(si, xs, yOff, r, time);
    this.background(Math.log10(OBJECTS[bi].d), bi, time);
    this.renderer.render(this.scene, this.camera);

    const small = { index: si, x: xs, y: -yOff, r, ext: this.ext(OBJECTS[si]) };
    const big = { index: bi, x: xb, y: -yOff, r: R, ext: this.ext(OBJECTS[bi]) };
    let inset: { x: number; y: number; size: number; zoom: number } | null = null;

    if (needInset) {
      // A magnifier floating above the tiny object's true position.
      const cx = Math.max(xs, -w / 2 + 12 + size / 2);
      const cy = yOff + 40 + size / 2;
      const ir = (size * 0.36) / Math.min(this.ext(OBJECTS[si]), 1.6);
      this.meshes[bi]!.visible = false;
      this.place(si, cx, cy, ir, time);
      const rd = this.renderer;
      rd.autoClear = false;
      rd.setScissorTest(true);
      rd.setScissor(w / 2 + cx - size / 2, h / 2 + cy - size / 2, size, size);
      rd.clear();
      rd.render(this.scene, this.camera);
      rd.setScissorTest(false);
      rd.autoClear = true;
      this.meshes[bi]!.visible = true;
      inset = { x: cx, y: -cy, size, zoom: ir / Math.max(r, 1e-300) };
    }
    return { small, big, inset };
  }
}
