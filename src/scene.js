import * as THREE from 'three';

/**
 * Hero star sea — four depth layers (a Milky-Way band, far, mid, near bokeh)
 * plus soft nebula glows. The rendered chrome plate is blended on top with
 * `screen`, so the ribbon floats inside the field instead of cutting it out.
 */
export function createHeroField(canvas, opts = {}) {
  const reduced = !!opts.reduced;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 220);
  camera.position.set(0, 0, 11);

  const q = window.innerWidth < 820 ? 0.42 : 1;
  const gauss = () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const bone = new THREE.Color('#f3ece0');
  const cool = new THREE.Color('#cfdcff');
  const warm = new THREE.Color('#ffd9b6');
  const ember = new THREE.Color('#e2452a');

  const data = { pos: [], size: [], phase: [], soft: [], alpha: [], depth: [], color: [] };

  const push = (x, y, z, size, soft, alpha, depth, c) => {
    data.pos.push(x, y, z);
    data.size.push(size);
    data.phase.push(Math.random());
    data.soft.push(soft);
    data.alpha.push(alpha);
    data.depth.push(depth);
    data.color.push(c.r, c.g, c.b);
  };

  const pickColor = (coolBias) => {
    const r = Math.random();
    if (r > 0.985) return ember.clone().offsetHSL(0, -0.1, 0.05 + Math.random() * 0.08);
    if (r > 0.88) return warm.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
    if (r > 0.7 - coolBias) return cool.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
    return bone.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.12);
  };

  // 1 — milky band, dense and dim, along a diagonal
  const bandCount = Math.round(6800 * q);
  for (let i = 0; i < bandCount; i++) {
    const x = -58 + Math.random() * 116;
    const y = -0.5 * x + 7 + gauss() * 3.4;
    const z = -92 + Math.random() * 34;
    push(x, y, z, 0.32 + Math.random() * 0.55, 0.25, 0.12 + Math.random() * 0.3, 0.05, pickColor(0.12));
  }

  // 2 — far field
  const farCount = Math.round(6200 * q);
  for (let i = 0; i < farCount; i++) {
    push(
      -62 + Math.random() * 124,
      -40 + Math.random() * 80,
      -70 + Math.random() * 34,
      0.45 + Math.random() * 0.85,
      0.15,
      0.2 + Math.random() * 0.5,
      0.08 + Math.random() * 0.16,
      pickColor(0),
    );
  }

  // 3 — mid field
  const midCount = Math.round(4200 * q);
  for (let i = 0; i < midCount; i++) {
    push(
      -46 + Math.random() * 92,
      -28 + Math.random() * 56,
      -30 + Math.random() * 22,
      0.7 + Math.random() * 1.5,
      0.35,
      0.28 + Math.random() * 0.55,
      0.4 + Math.random() * 0.3,
      pickColor(0.06),
    );
  }

  // 4 — near bokeh
  const nearCount = Math.round(230 * q);
  for (let i = 0; i < nearCount; i++) {
    push(
      -34 + Math.random() * 68,
      -22 + Math.random() * 44,
      -9 + Math.random() * 8,
      3 + Math.random() * 7,
      1,
      0.035 + Math.random() * 0.075,
      0.85 + Math.random() * 0.15,
      pickColor(0.04),
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.pos, 3));
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(data.size, 1));
  geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(data.phase, 1));
  geometry.setAttribute('aSoft', new THREE.Float32BufferAttribute(data.soft, 1));
  geometry.setAttribute('aAlpha', new THREE.Float32BufferAttribute(data.alpha, 1));
  geometry.setAttribute('aDepth', new THREE.Float32BufferAttribute(data.depth, 1));
  geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(data.color, 3));

  const uniforms = {
    uTime: { value: 0 },
    uPR: { value: Math.min(window.devicePixelRatio || 1, 2) },
    uScroll: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uPR;
      uniform float uScroll;
      uniform vec2 uMouse;
      attribute float aSize;
      attribute float aPhase;
      attribute float aSoft;
      attribute float aAlpha;
      attribute float aDepth;
      attribute vec3 aColor;
      varying float vAlpha;
      varying vec3 vColor;
      varying float vSoft;

      void main() {
        vec3 p = position;
        float t = uTime;
        float s = aPhase * 6.2831;
        float drift = 0.16 + aDepth * 0.6;

        p.x += sin(t * 0.13 + s * 2.3) * drift;
        p.y += cos(t * 0.11 + s * 1.7) * drift;

        p.x += uMouse.x * (0.3 + aDepth * 4.2);
        p.y -= uMouse.y * (0.22 + aDepth * 3.1);
        p.y += uScroll * (2.0 + aDepth * 7.0);

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;

        float dist = -mv.z;
        gl_PointSize = aSize * uPR * (76.0 / max(dist, 1.0));
        gl_PointSize = clamp(gl_PointSize, 0.7, 26.0 * uPR);

        float tw = 0.66 + 0.34 * sin(t * (0.5 + aPhase * 1.8) + s * 5.0 + position.x * 0.13);
        float fade = smoothstep(120.0, 16.0, dist);
        vAlpha = aAlpha * tw * fade;

        float ndcX = gl_Position.x / gl_Position.w;
        vAlpha *= mix(0.36, 1.0, smoothstep(-0.98, 0.04, ndcX));

        vColor = aColor;
        vSoft = aSoft;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      varying vec3 vColor;
      varying float vSoft;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float hard = smoothstep(0.5, 0.34, d);
        float soft = pow(smoothstep(0.5, 0.0, d), 2.1);
        float a = mix(hard, soft, vSoft) * vAlpha;
        if (a < 0.002) discard;
        gl_FragColor = vec4(vColor, a);
      }
    `,
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);

  // nebula glows — soft additive sprites behind the stars
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const gctx = glowCanvas.getContext('2d');
  const grad = gctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.28, 'rgba(255,255,255,0.42)');
  grad.addColorStop(0.62, 'rgba(255,255,255,0.1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 256, 256);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  glowTex.colorSpace = THREE.SRGBColorSpace;

  const nebulae = [
    { p: [22, -3, -84], s: [128, 92], c: '#e2452a', o: 0.11 },
    { p: [-30, 19, -96], s: [140, 104], c: '#41639c', o: 0.12 },
    { p: [-7, -21, -88], s: [118, 82], c: '#7a6d5c', o: 0.09 },
  ];
  const nebulaGroup = new THREE.Group();
  nebulae.forEach((n) => {
    const mat = new THREE.SpriteMaterial({
      map: glowTex,
      color: new THREE.Color(n.c),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: n.o,
    });
    const sp = new THREE.Sprite(mat);
    sp.position.set(n.p[0], n.p[1], n.p[2]);
    sp.scale.set(n.s[0], n.s[1], 1);
    nebulaGroup.add(sp);
  });
  scene.add(nebulaGroup);

  let w = 0;
  let h = 0;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uPR.value = Math.min(window.devicePixelRatio || 1, 2);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let mx = 0;
  let my = 0;
  let tx = 0;
  let ty = 0;
  window.addEventListener('pointermove', (e) => {
    tx = (e.clientX / window.innerWidth) * 2 - 1;
    ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let scrollT = 0;
  const onScroll = () => {
    const max = window.innerHeight * 1.2;
    scrollT = Math.min(1, Math.max(0, window.scrollY / max));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  let visible = true;
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { visible = entry.isIntersecting; });
  }, { threshold: 0 });
  vio.observe(canvas);

  const clock = new THREE.Clock();
  let raf = 0;

  const render = () => {
    if (!reduced) raf = requestAnimationFrame(render);
    if (!visible) return;

    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    uniforms.uScroll.value += (scrollT - uniforms.uScroll.value) * 0.05;
    mx += (tx - mx) * 0.045;
    my += (ty - my) * 0.045;
    uniforms.uMouse.value.set(mx, my);

    camera.position.x += (mx * 0.9 - camera.position.x) * 0.04;
    camera.position.y += (-my * 0.6 - camera.position.y) * 0.04;
    camera.position.z = 11 - uniforms.uScroll.value * 2.4;
    camera.lookAt(0, 0, -2);

    nebulaGroup.position.x = -mx * 1.6;
    nebulaGroup.position.y = my * 1.2;
    stars.rotation.z = Math.sin(t * 0.02) * 0.012;

    renderer.render(scene, camera);
  };

  if (reduced) {
    renderer.render(scene, camera);
  } else {
    render();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else if (!reduced) {
      cancelAnimationFrame(raf);
      render();
    }
  });

  return { renderer, scene, camera };
}
