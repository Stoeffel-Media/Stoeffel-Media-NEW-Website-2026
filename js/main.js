/* ═══════════════════════════════════════════
   STOEFFEL-MEDIA — main.js
═══════════════════════════════════════════ */

// ═══════════════════════════════════════════
// CUSTOM CURSOR
// ═══════════════════════════════════════════
const cursor = document.getElementById('cursor');
let cursorX = 0, cursorY = 0;
let targetX = 0, targetY = 0;

if (cursor) {
  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  function updateCursor() {
    cursorX += (targetX - cursorX) * 0.15;
    cursorY += (targetY - cursorY) * 0.15;
    cursor.style.transform = `translate(-50%, -50%) translate(${cursorX}px, ${cursorY}px)`;
    requestAnimationFrame(updateCursor);
  }
  updateCursor();
}

// ═══════════════════════════════════════════
// MENU OVERLAY
// ═══════════════════════════════════════════
const menuOverlay = document.getElementById('menu-overlay');
const menuOpenBtn = document.querySelector('.nav-menu-btn');
const menuCloseBtn = document.getElementById('menu-close');

if (menuOverlay && menuOpenBtn) {
  menuOpenBtn.addEventListener('click', () => menuOverlay.classList.add('open'));
  menuCloseBtn?.addEventListener('click', () => menuOverlay.classList.remove('open'));
  menuOverlay.querySelectorAll('.menu-nav a').forEach(a => {
    a.addEventListener('click', () => menuOverlay.classList.remove('open'));
  });
}

// ═══════════════════════════════════════════
// CURSOR HOVER STATE
// ═══════════════════════════════════════════
if (cursor) {
  function refreshHoverables() {
    document.querySelectorAll('.hoverable, a, button, input, textarea, select').forEach(el => {
      if (!el.dataset.cursorBound) {
        el.dataset.cursorBound = '1';

        // White cursor on accent (orange) buttons — so cursor is visible against orange bg
        const isAccentEl = el.classList.contains('hero-cta') ||
                           el.classList.contains('statements-cta') ||
                           el.classList.contains('form-submit');

        el.addEventListener('mouseenter', () => {
          cursor.classList.add('hovering');
          if (isAccentEl) cursor.classList.add('on-accent');
        });
        el.addEventListener('mouseleave', () => {
          cursor.classList.remove('hovering');
          if (isAccentEl) cursor.classList.remove('on-accent');
        });
      }
    });
  }
  refreshHoverables();
}

// ═══════════════════════════════════════════
// LOGO SCROLL FADE
// ═══════════════════════════════════════════
const navLogo = document.querySelector('.nav-logo');
const navLogoCenter = document.getElementById('nav-logo-center');

if (navLogo && navLogoCenter) {
  const MAIN_FADE_START = 80, MAIN_FADE_END = 250;
  const CTR_FADE_START = 400, CTR_FADE_END = 600;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const mainP = Math.min(Math.max((y - MAIN_FADE_START) / (MAIN_FADE_END - MAIN_FADE_START), 0), 1);
    navLogo.style.opacity = 1 - mainP;

    const ctrP = Math.min(Math.max((y - CTR_FADE_START) / (CTR_FADE_END - CTR_FADE_START), 0), 1);
    navLogoCenter.style.opacity = ctrP;
    navLogoCenter.style.pointerEvents = ctrP > 0.5 ? 'auto' : 'none';
  }, { passive: true });
}

// ═══════════════════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════════════════
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ═══════════════════════════════════════════
// ANIMATED DOT PATTERN (Hero background)
// ═══════════════════════════════════════════
(function() {
  const dotCanvas = document.getElementById('dot-pattern');
  if (!dotCanvas) return;

  const ctx = dotCanvas.getContext('2d');
  const SPACING = 80, CROSS_SIZE = 6, CROSS_THICKNESS = 2.5;
  const MAX_OPACITY = 0.12, MIN_OPACITY = 0.02;
  let dots = [], cols, rows;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dotCanvas.width = dotCanvas.clientWidth * dpr;
    dotCanvas.height = dotCanvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
    initDots();
  }

  function initDots() {
    const w = dotCanvas.clientWidth, h = dotCanvas.clientHeight;
    cols = Math.ceil(w / SPACING) + 1;
    rows = Math.ceil(h / SPACING) + 1;
    dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({
          x: c * SPACING,
          y: r * SPACING,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.7,
          opacity: MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY),
        });
      }
    }
  }

  function draw(time) {
    const w = dotCanvas.clientWidth, h = dotCanvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const t = time * 0.001;
    for (const dot of dots) {
      const wave = (Math.sin(t * dot.speed + dot.phase) + 1) * 0.5;
      dot.opacity = MIN_OPACITY + wave * (MAX_OPACITY - MIN_OPACITY);
      ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`;
      ctx.fillRect(dot.x - CROSS_SIZE, dot.y - CROSS_THICKNESS / 2, CROSS_SIZE * 2, CROSS_THICKNESS);
    }
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(draw);
})();

// ═══════════════════════════════════════════
// WEBGL FLUID SIMULATION
// Navier-Stokes fluid dynamics (orange, #f08932)
// ═══════════════════════════════════════════
(function() {
  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;

  const config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 0.965,
    VELOCITY_DISSIPATION: 0.96,
    PRESSURE_ITERATIONS: 20,
    SPLAT_RADIUS: 0.15,
    SPLAT_FORCE: 3000,
    COLOR_R: 0.94,
    COLOR_G: 0.54,
    COLOR_B: 0.20,
  };

  let gl, ext;
  let simWidth, simHeight, dyeWidth, dyeHeight;
  let density, velocity, pressure, divergence;
  let splatProgram, advectionProgram, divergenceProgram, pressureProgram,
      gradientSubtractProgram, clearProgram, displayProgram;

  let pointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false };

  document.addEventListener('mousemove', (e) => {
    pointer.dx = (e.clientX - pointer.x) * 5.0;
    pointer.dy = (e.clientY - pointer.y) * 5.0;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.moved = true;
  });

  const baseVertexShader = `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
    uniform vec2 texelSize;
    void main () {
      vUv = aPosition * 0.5 + 0.5;
      vL = vUv - vec2(texelSize.x, 0.0); vR = vUv + vec2(texelSize.x, 0.0);
      vT = vUv + vec2(0.0, texelSize.y); vB = vUv - vec2(0.0, texelSize.y);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;
  const clearShader = `
    precision mediump float; precision mediump sampler2D;
    varying highp vec2 vUv; uniform sampler2D uTexture; uniform float value;
    void main () { gl_FragColor = value * texture2D(uTexture, vUv); }
  `;
  const displayShader = `
    precision highp float; precision highp sampler2D;
    varying vec2 vUv; uniform sampler2D uTexture;
    void main () {
      vec3 c = texture2D(uTexture, vUv).rgb;
      gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)));
    }
  `;
  const splatShader = `
    precision highp float; precision highp sampler2D;
    varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio;
    uniform vec3 color; uniform vec2 point; uniform float radius;
    void main () {
      vec2 p = vUv - point.xy; p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / radius) * color;
      gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + splat, 1.0);
    }
  `;
  const advectionShader = `
    precision highp float; precision highp sampler2D;
    varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource;
    uniform vec2 texelSize; uniform vec2 dyeTexelSize; uniform float dt; uniform float dissipation;
    void main () {
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      gl_FragColor = vec4(dissipation * texture2D(uSource, coord).rgb * dissipation, 1.0);
    }
  `;
  const divergenceShader = `
    precision mediump float; precision mediump sampler2D;
    varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR;
    varying highp vec2 vT; varying highp vec2 vB; uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uVelocity, vL).x; float R = texture2D(uVelocity, vR).x;
      float T = texture2D(uVelocity, vT).y; float B = texture2D(uVelocity, vB).y;
      vec2 C = texture2D(uVelocity, vUv).xy;
      if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x;
      if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
      gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
    }
  `;
  const pressureShader = `
    precision mediump float; precision mediump sampler2D;
    varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR;
    varying highp vec2 vT; varying highp vec2 vB;
    uniform sampler2D uPressure; uniform sampler2D uDivergence;
    void main () {
      float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;
      float divergence = texture2D(uDivergence, vUv).x;
      gl_FragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
    }
  `;
  const gradientSubtractShader = `
    precision mediump float; precision mediump sampler2D;
    varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR;
    varying highp vec2 vT; varying highp vec2 vB;
    uniform sampler2D uPressure; uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;
      vec2 vel = texture2D(uVelocity, vUv).xy;
      vel.xy -= vec2(R - L, T - B);
      gl_FragColor = vec4(vel, 0.0, 1.0);
    }
  `;

  function getSupportedFormat(g, internalFmt, fmt, type) {
    const tex = g.createTexture();
    g.bindTexture(g.TEXTURE_2D, tex);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texImage2D(g.TEXTURE_2D, 0, internalFmt, 4, 4, 0, fmt, type, null);
    const fb = g.createFramebuffer();
    g.bindFramebuffer(g.FRAMEBUFFER, fb);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, tex, 0);
    const ok = g.checkFramebufferStatus(g.FRAMEBUFFER) === g.FRAMEBUFFER_COMPLETE;
    g.deleteTexture(tex); g.deleteFramebuffer(fb);
    g.bindFramebuffer(g.FRAMEBUFFER, null);
    return ok ? { internalFormat: internalFmt, format: fmt } : { internalFormat: g.RGBA, format: g.RGBA };
  }

  function initGL() {
    const params = { alpha: true, depth: false, stencil: false, antialias: false };
    gl = canvas.getContext('webgl2', params);
    const isWGL2 = !!gl;
    if (!isWGL2) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
    if (!gl) return false;

    let halfFloat, linFilter;
    if (isWGL2) {
      gl.getExtension('EXT_color_buffer_float');
      linFilter = gl.getExtension('OES_texture_float_linear');
      halfFloat = gl.HALF_FLOAT;
    } else {
      halfFloat = gl.getExtension('OES_texture_half_float')?.HALF_FLOAT_OES;
      linFilter = gl.getExtension('OES_texture_half_float_linear');
    }

    gl.clearColor(0, 0, 0, 0);
    const filter = linFilter ? gl.LINEAR : gl.NEAREST;
    ext = {
      halfFloat, filtering: filter,
      formatRGBA: getSupportedFormat(gl, isWGL2 ? gl.RGBA16F : gl.RGBA, gl.RGBA, halfFloat),
      formatRG:   getSupportedFormat(gl, isWGL2 ? gl.RG16F   : gl.RGBA, isWGL2 ? gl.RG : gl.RGBA, halfFloat),
      formatR:    getSupportedFormat(gl, isWGL2 ? gl.R16F    : gl.RGBA, isWGL2 ? gl.RED : gl.RGBA, halfFloat),
    };
    return true;
  }

  function compileShader(type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(shader)); return null; }
    return shader;
  }

  function createProgram(vs, fs) {
    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return null; }
    const uniforms = {};
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(prog, i);
      uniforms[info.name] = gl.getUniformLocation(prog, info.name);
    }
    return { program: prog, uniforms, bind() { gl.useProgram(prog); } };
  }

  function createFBO(w, h, intf, fmt, type, filter) {
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, intf, w, h, 0, fmt, type, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture: tex, fbo, width: w, height: h,
      attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; }
    };
  }

  function createDoubleFBO(w, h, intf, fmt, type, filter) {
    let a = createFBO(w, h, intf, fmt, type, filter);
    let b = createFBO(w, h, intf, fmt, type, filter);
    return { width: w, height: h,
      get read() { return a; }, set read(v) { a = v; },
      get write() { return b; }, set write(v) { b = v; },
      swap() { const t = a; a = b; b = t; }
    };
  }

  function blit(target) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target?.fbo || null);
    if (target) gl.viewport(0, 0, target.width, target.height);
    else gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function getResolution(res) {
    let ar = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (ar < 1) ar = 1 / ar;
    const mn = Math.round(res), mx = Math.round(res * ar);
    return gl.drawingBufferWidth > gl.drawingBufferHeight
      ? { width: mx, height: mn }
      : { width: mn, height: mx };
  }

  function initFramebuffers() {
    const sr = getResolution(config.SIM_RESOLUTION), dr = getResolution(config.DYE_RESOLUTION);
    simWidth = sr.width; simHeight = sr.height; dyeWidth = dr.width; dyeHeight = dr.height;
    const tt = ext.halfFloat, rgba = ext.formatRGBA, rg = ext.formatRG, r = ext.formatR, f = ext.filtering;
    density  = createDoubleFBO(dyeWidth, dyeHeight, rgba.internalFormat, rgba.format, tt, f);
    velocity = createDoubleFBO(simWidth, simHeight, rg.internalFormat, rg.format, tt, f);
    divergence = createFBO(simWidth, simHeight, r.internalFormat, r.format, tt, gl.NEAREST);
    pressure   = createDoubleFBO(simWidth, simHeight, r.internalFormat, r.format, tt, gl.NEAREST);
  }

  function splat(x, y, dx, dy, color) {
    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatProgram.uniforms.point, x / canvas.width, 1 - y / canvas.height);
    gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 0);
    gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS / 100);
    blit(velocity.write); velocity.swap();
    gl.uniform1i(splatProgram.uniforms.uTarget, density.read.attach(0));
    gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
    blit(density.write); density.swap();
  }

  function step(dt) {
    advectionProgram.bind();
    gl.uniform2f(advectionProgram.uniforms.texelSize, 1/simWidth, 1/simHeight);
    gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, 1/simWidth, 1/simHeight);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectionProgram.uniforms.uSource, velocity.read.attach(0));
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
    blit(velocity.write); velocity.swap();

    gl.uniform2f(advectionProgram.uniforms.texelSize, 1/dyeWidth, 1/dyeHeight);
    gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, 1/dyeWidth, 1/dyeHeight);
    gl.uniform1i(advectionProgram.uniforms.uSource, density.read.attach(1));
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
    blit(density.write); density.swap();

    divergenceProgram.bind();
    gl.uniform2f(divergenceProgram.uniforms.texelSize, 1/simWidth, 1/simHeight);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence);

    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, 0.8);
    blit(pressure.write); pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(pressureProgram.uniforms.texelSize, 1/simWidth, 1/simHeight);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
      blit(pressure.write); pressure.swap();
    }

    gradientSubtractProgram.bind();
    gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, 1/simWidth, 1/simHeight);
    gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
    gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
    blit(velocity.write); velocity.swap();
  }

  function render() {
    displayProgram.bind();
    gl.uniform1i(displayProgram.uniforms.uTexture, density.read.attach(0));
    blit(null);
  }

  let lastTime = Date.now();
  function update() {
    const now = Date.now();
    let dt = Math.min((now - lastTime) / 1000, 0.016);
    lastTime = now;
    if (pointer.moved) {
      pointer.moved = false;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      splat(pointer.x * dpr, pointer.y * dpr,
        -pointer.dx * config.SPLAT_FORCE * dt,
        -pointer.dy * config.SPLAT_FORCE * dt,
        { r: config.COLOR_R * 0.45, g: config.COLOR_G * 0.45, b: config.COLOR_B * 0.45 });
    }
    step(dt); render();
    requestAnimationFrame(update);
  }

  function init() {
    if (!initGL()) return;
    canvas.width = canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2);
    canvas.height = canvas.clientHeight * Math.min(window.devicePixelRatio || 1, 2);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    splatProgram          = createProgram(baseVertexShader, splatShader);
    advectionProgram      = createProgram(baseVertexShader, advectionShader);
    divergenceProgram     = createProgram(baseVertexShader, divergenceShader);
    pressureProgram       = createProgram(baseVertexShader, pressureShader);
    gradientSubtractProgram = createProgram(baseVertexShader, gradientSubtractShader);
    clearProgram          = createProgram(baseVertexShader, clearShader);
    displayProgram        = createProgram(baseVertexShader, displayShader);
    initFramebuffers();
    window.addEventListener('resize', () => {
      canvas.width  = canvas.clientWidth  * Math.min(window.devicePixelRatio || 1, 2);
      canvas.height = canvas.clientHeight * Math.min(window.devicePixelRatio || 1, 2);
      initFramebuffers();
    });
    update();
  }

  init();
})();

// ═══════════════════════════════════════════
// BUSINESS STATEMENTS ROTATOR
// ═══════════════════════════════════════════
(function() {
  const items = document.querySelectorAll('.statement-item');
  if (!items.length) return;

  let current = 0;
  const HOLD_MS = 5000, ENTER_MS = 600, EXIT_MS = 500;

  function show(index) {
    const el = items[index];
    el.style.opacity = '';
    el.style.transform = '';
    el.classList.remove('hold', 'exit');
    el.classList.add('enter');

    setTimeout(() => {
      el.classList.remove('enter');
      el.classList.add('hold');
    }, ENTER_MS);

    setTimeout(() => {
      el.classList.remove('hold');
      el.classList.add('exit');
      setTimeout(() => {
        el.classList.remove('exit');
        el.style.opacity = '0';
        el.style.transform = 'translateY(100%)';
        current = (index + 1) % items.length;
        show(current);
      }, EXIT_MS);
    }, ENTER_MS + HOLD_MS);
  }

  // Init: hide all
  items.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(100%)';
  });

  // Start after a short delay
  setTimeout(() => show(0), 400);
})();

// ═══════════════════════════════════════════
// QUOTE — WORD BY WORD FADE
// ═══════════════════════════════════════════
(function() {
  const quoteEl = document.querySelector('.quote-text');
  if (!quoteEl) return;

  // Split text into word spans
  const rawText = quoteEl.textContent.trim();
  const words = rawText.split(/(\s+)/);
  quoteEl.innerHTML = '';

  words.forEach((chunk, i) => {
    if (/^\s+$/.test(chunk)) {
      quoteEl.appendChild(document.createTextNode(' '));
    } else {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = chunk;
      // Spread delay across ~3 seconds
      const wordCount = words.filter(w => !/^\s+$/.test(w)).length;
      const delay = (i / words.length) * 2800;
      span.style.transitionDelay = `${delay}ms`;
      quoteEl.appendChild(span);
    }
  });

  const quoteObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        quoteEl.querySelectorAll('.word').forEach(w => w.classList.add('visible'));
        quoteObserver.disconnect();
      }
    });
  }, { threshold: 0.4 });

  quoteObserver.observe(quoteEl);
})();

// ═══════════════════════════════════════════
// PORTFOLIO LIGHTBOX
// ═══════════════════════════════════════════
(function() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  if (!lightbox) return;

  document.querySelectorAll('.portfolio-item[data-full]').forEach(item => {
    item.addEventListener('click', () => {
      lightboxImg.src = item.dataset.full;
      lightboxImg.alt = item.dataset.alt || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 300);
  }

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
})();

// ═══════════════════════════════════════════
// CONTACT FORM — FETCH SUBMIT
// ═══════════════════════════════════════════
(function() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('.form-submit');
    const msg = form.querySelector('.form-message');
    const originalText = btn.textContent;

    btn.disabled = true;
    btn.textContent = 'Sending…';
    msg.className = 'form-message';
    msg.style.display = 'none';

    try {
      const data = new FormData(form);
      const res = await fetch('../php/contact.php', {
        method: 'POST',
        body: data,
      });
      const json = await res.json();

      if (json.success) {
        msg.textContent = json.message || 'Message sent. We\'ll be in touch soon.';
        msg.classList.add('success');
        form.reset();
      } else {
        msg.textContent = json.message || 'Something went wrong. Please try again or email us directly.';
        msg.classList.add('error');
      }
    } catch (err) {
      msg.textContent = 'Connection error. Please email us directly at info@stoeffel-media.com.au';
      msg.classList.add('error');
    }

    btn.disabled = false;
    btn.textContent = originalText;
  });
})();

// ═══════════════════════════════════════════
// SMOOTH HERO PARALLAX ON SCROLL
// ═══════════════════════════════════════════
(function() {
  const heroHeading = document.querySelector('.hero-heading');
  const heroSub = document.querySelector('.hero-sub');
  const heroCta = document.querySelector('.hero-cta');
  if (!heroHeading) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const shift = y * 0.28;
    heroHeading.style.transform = `translateY(${shift}px)`;
    if (heroSub)  heroSub.style.transform  = `translateY(${shift * 0.7}px)`;
    if (heroCta)  heroCta.style.transform  = `translateY(${shift * 0.6}px)`;
  }, { passive: true });
})();
