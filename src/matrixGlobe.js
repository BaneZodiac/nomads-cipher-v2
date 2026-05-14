// ============================================
// MATRIX DIGITAL GLOBE
// Matrix-style green code characters on a 3D sphere
// ============================================

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/{}[]|&^%$#@!';

export async function createMatrixGlobe(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const THREE = await import('three');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.position.z = 12;

  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // Character texture factory
  function makeCharTex(char) {
    const c = document.createElement("canvas");
    c.width = 64; c.height = 64;
    const ctx = c.getContext("2d");
    ctx.shadowColor = "#00ff41"; ctx.shadowBlur = 15;
    ctx.fillStyle = "#00ff41";
    ctx.font = "bold 40px Courier New, monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(char, 32, 32);
    return new THREE.CanvasTexture(c);
  }

  const charData = [];
  const N = 4000;

  for (let i = 0; i < N; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 4.5 + (Math.random() - 0.5) * 0.3;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    const mat = new THREE.SpriteMaterial({
      map: makeCharTex(ch),
      transparent: true,
      opacity: 0.3 + Math.random() * 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    const size = 0.15 + Math.random() * 0.25;
    sprite.scale.set(size, size, 1);
    sprite.position.set(x, y, z);
    charData.push({ sprite, mat, baseOpacity: mat.opacity, speed: 0.2 + Math.random() * 0.8, phase: Math.random() * Math.PI * 2, ch, lastChange: 0, interval: 0.5 + Math.random() * 2 });
    globeGroup.add(sprite);
  }

  // Connection lines
  const lpos = [], lcol = [];
  for (let i = 0; i < 800; i++) {
    const a = Math.floor(Math.random() * N);
    const b = Math.floor(Math.random() * N);
    if (a === b) continue;
    const p1 = charData[a].sprite.position;
    const p2 = charData[b].sprite.position;
    if (p1.distanceTo(p2) > 2.5) continue;
    lpos.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
    const br = 0.1 + Math.random() * 0.2;
    lcol.push(0, br, 0.1, 0, br, 0.1);
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.Float32BufferAttribute(lpos, 3));
  lg.setAttribute("color", new THREE.Float32BufferAttribute(lcol, 3));
  const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending }));
  globeGroup.add(lines);

  // Inner glow wireframe
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(4.4, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff41, transparent: true, opacity: 0.04, wireframe: true, blending: THREE.AdditiveBlending })
  );
  globeGroup.add(glow);

  // Glow rings
  function makeRing(op) {
    const m = new THREE.MeshBasicMaterial({ color: 0x00ff41, transparent: true, opacity: op, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    return new THREE.Mesh(new THREE.RingGeometry(5.2, 5.8, 64), m);
  }
  const ring1 = makeRing(0.08); ring1.rotation.x = Math.PI / 3; ring1.rotation.z = Math.PI / 5;
  globeGroup.add(ring1);
  const ring2 = makeRing(0.05); ring2.scale.set(1.3, 1.3, 1.3); ring2.rotation.x = -Math.PI / 4; ring2.rotation.z = Math.PI / 3;
  globeGroup.add(ring2);

  // Orbiting rain
  function makeRainTex(ch) {
    const c = document.createElement("canvas");
    c.width = 32; c.height = 32;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#00ff41"; ctx.shadowColor = "#00ff41"; ctx.shadowBlur = 8;
    ctx.font = "bold 22px Courier New, monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(ch, 16, 16);
    return new THREE.CanvasTexture(c);
  }
  const rainGroup = new THREE.Group();
  globeGroup.add(rainGroup);
  const rainData = [];
  for (let i = 0; i < 150; i++) {
    const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    const mat = new THREE.SpriteMaterial({ map: makeRainTex(ch), transparent: true, opacity: 0.05 + Math.random() * 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    const tr = Math.random() * Math.PI * 2;
    const pr = Math.acos(2 * Math.random() - 1);
    const rr = 7 + Math.random() * 3;
    sprite.position.set(rr * Math.sin(pr) * Math.cos(tr), rr * Math.sin(pr) * Math.sin(tr), rr * Math.cos(pr));
    sprite.scale.set(0.4, 0.4, 1);
    rainGroup.add(sprite);
    rainData.push({ sprite, mat, theta: tr, phi: pr, radius: rr, speed: 0.1 + Math.random() * 0.3 });
  }

  // Mouse
  let mx = 0, my = 0, trx = 0, try_ = 0, rafId = null;
  const onMouseMove = (e) => {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = -(e.clientY / window.innerHeight) * 2 + 1;
  };
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  document.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onResize);

  let t = 0;
    function animate() {
    rafId = requestAnimationFrame(animate);
    t += 0.01;
    trx += (my * 0.5 - trx) * 0.02;
    try_ += (mx * 0.5 - try_) * 0.02;
    globeGroup.rotation.x += 0.001 + trx * 0.0005;
    globeGroup.rotation.y += 0.002 + try_ * 0.0005;

    charData.forEach(d => {
      if (t - d.lastChange > d.interval) {
        d.lastChange = t;
        d.ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        const nc = document.createElement("canvas");
        nc.width = 64; nc.height = 64;
        const ctx = nc.getContext("2d");
        ctx.shadowColor = "#00ff41"; ctx.shadowBlur = 12;
        ctx.fillStyle = "#00ff41";
        ctx.font = "bold 40px Courier New, monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(d.ch, 32, 32);
        d.mat.map = new THREE.CanvasTexture(nc);
        d.mat.needsUpdate = true;
      }
      d.mat.opacity = d.baseOpacity * (Math.sin(t * d.speed + d.phase) * 0.3 + 0.7);
    });

    rainData.forEach(d => {
      d.theta += d.speed * 0.01;
      d.sprite.position.set(d.radius * Math.sin(d.phi) * Math.cos(d.theta), d.radius * Math.sin(d.phi) * Math.sin(d.theta), d.radius * Math.cos(d.phi));
      d.mat.opacity = (0.05 + Math.random() * 0.15) * (Math.sin(t * 2 + d.theta) * 0.3 + 0.7);
    });

    ring1.material.opacity = 0.08 + Math.sin(t * 1.5) * 0.04;
    ring2.material.opacity = 0.05 + Math.sin(t * 1.5 + Math.PI) * 0.03;
    glow.material.opacity = 0.03 + Math.sin(t * 0.8) * 0.02;
    renderer.render(scene, camera);
  }
  animate();
    return {
    dispose: () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      // Dispose sprites
      charData.forEach(d => { d.mat.dispose(); if (d.mat.map) d.mat.map.dispose(); });
      rainData.forEach(d => { d.mat.dispose(); if (d.mat.map) d.mat.map.dispose(); });
      // Dispose meshes and geometries
      if (glow) { glow.material.dispose(); glow.geometry.dispose(); }
      if (ring1) { ring1.material.dispose(); ring1.geometry.dispose(); }
      if (ring2) { ring2.material.dispose(); ring2.geometry.dispose(); }
      if (lines) { lines.material.dispose(); lines.geometry.dispose(); }
      // Remove all from scene
      while(globeGroup.children.length > 0) {
        globeGroup.remove(globeGroup.children[0]);
      }
      scene.remove(globeGroup);
    }
  };
}
