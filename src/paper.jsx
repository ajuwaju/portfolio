import React, { useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Shared input: pointer position (-1..1) and how far the hero has scrolled away (0..1)
const input = { x: 0, y: 0, scroll: 0 };
addEventListener('pointermove', (e) => { input.x = e.clientX / innerWidth * 2 - 1; input.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });

function paperTexture(kind) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 724;
  const g = c.getContext('2d');
  g.fillStyle = css('--paper') || '#fffefa'; g.fillRect(0, 0, c.width, c.height);
  if (kind === 'ruled') {
    g.strokeStyle = 'rgba(53,89,176,.22)'; g.lineWidth = 2;
    for (let y = 120; y < c.height; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke(); }
    g.strokeStyle = 'rgba(194,65,45,.35)'; g.beginPath(); g.moveTo(96, 0); g.lineTo(96, c.height); g.stroke();
  } else if (kind === 'grid') {
    g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = 1.5;
    for (let x = 0; x < c.width; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, c.height); g.stroke(); }
    for (let y = 0; y < c.height; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke(); }
  } else {
    // typed draft: faint lines of "text"
    g.fillStyle = 'rgba(0,0,0,.09)';
    for (let y = 90, i = 0; y < c.height - 60; y += 38, i++) { const w = 520 + ((i * 137) % 340); g.fillRect(90, y, w, 12); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

const SHEETS = [
  { kind: 'draft', rot: -0.16, off: [-0.35, 0.18], tint: null },
  { kind: 'grid', rot: 0.11, off: [0.4, -0.1], tint: null },
  { kind: 'draft', rot: -0.05, off: [-0.1, -0.22], tint: '--manila' },
  { kind: 'ruled', rot: 0.03, off: [0, 0], tint: null },
];

function Sheet({ i, s, total }) {
  const ref = useRef();
  const tex = useMemo(() => paperTexture(s.kind), [s.kind]);
  const geo = useMemo(() => {
    // a slightly curled page: bend the plane along x
    const g = new THREE.PlaneGeometry(4.6, 3.25, 24, 4);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k); p.setZ(k, 0.06 * Math.cos(x * 0.9) + 0.02 * i); }
    g.computeVertexNormals(); return g;
  }, [i]);
  const color = s.tint ? new THREE.Color(css(s.tint) || '#ead7a8') : new THREE.Color('#ffffff');
  useFrame((st) => {
    const t = st.clock.elapsedTime, f = input.scroll;
    const m = ref.current; if (!m) return;
    const fan = f * (i - (total - 1) / 2);
    m.position.set(s.off[0] * (1 + f * 2.2) + fan * 1.1, s.off[1] * (1 + f * 1.5) + (reduce ? 0 : Math.sin(t * 0.8 + i) * 0.03), i * 0.05 + f * i * 0.35);
    m.rotation.z = s.rot * (1 + f * 1.6);
  });
  return (
    <mesh ref={ref} geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial map={s.tint ? null : tex} color={color} roughness={0.92} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Stack() {
  const g = useRef();
  useFrame((st, dt) => {
    if (!g.current) return;
    const tx = reduce ? -0.5 : -0.62 + input.y * 0.12;
    const ty = reduce ? 0 : input.x * 0.18;
    g.current.rotation.x += (tx - g.current.rotation.x) * Math.min(1, dt * 4);
    g.current.rotation.y += (ty - g.current.rotation.y) * Math.min(1, dt * 4);
  });
  return (
    <group ref={g} rotation={[-0.6, 0, 0]}>
      {SHEETS.map((s, i) => <Sheet key={i} i={i} s={s} total={SHEETS.length} />)}
      <mesh position={[0, 0, -0.05]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <shadowMaterial opacity={0.12} />
      </mesh>
    </group>
  );
}

function App() {
  return (
    <Canvas shadows flat dpr={[1, 2]} camera={{ position: [0, 0, 6.9], fov: 38 }} gl={{ alpha: true, antialias: true }}
      frameloop={reduce ? 'demand' : 'always'}>
      <ambientLight intensity={2.1} />
      <directionalLight position={[2.5, 3, 6]} intensity={0.9} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} />
      <Stack />
    </Canvas>
  );
}

export function mount(el, hero) {
  const update = () => { const r = hero.getBoundingClientRect(); input.scroll = Math.min(1, Math.max(0, -r.top / (r.height * 0.6))); };
  addEventListener('scroll', update, { passive: true }); update();
  createRoot(el).render(<App />);
}
