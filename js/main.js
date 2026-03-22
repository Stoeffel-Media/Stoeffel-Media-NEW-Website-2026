/* ═══════════════════════════════════════════
   STOEFFEL-MEDIA — main.js
═══════════════════════════════════════════ */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ═══════════════════════════════════════════
// TYPEWRITER EFFECT (hero-sub)
// ═══════════════════════════════════════════
(function() {
  const el = document.querySelector('[data-typewriter]');
  if (!el) return;

  const lines = el.dataset.typewriter.split('|');
  const fullText = lines.join('\n');
  const cursor = document.createElement('span');
  cursor.className = 'typewriter-cursor';

  if (reducedMotion) {
    el.innerHTML = lines.join('<br>');
    return;
  }

  const DELAY_START = 1200;
  const CHAR_SPEED = 55;
  const PAUSE = 10000;
  let timer = null;
  let blocked = false;

  function stop() { clearTimeout(timer); timer = null; }

  function type() {
    if (blocked) return;
    el.style.transition = 'none';
    el.style.opacity = '1';
    el.textContent = '';
    el.appendChild(cursor);
    let i = 0;

    function tick() {
      if (blocked) return;
      if (i < fullText.length) {
        const char = fullText[i];
        if (char === '\n') {
          cursor.before(document.createElement('br'));
        } else {
          cursor.before(document.createTextNode(char));
        }
        i++;
        timer = setTimeout(tick, CHAR_SPEED);
      } else {
        timer = setTimeout(fadeOut, PAUSE);
      }
    }
    tick();
  }

  function fadeOut() {
    if (blocked) return;
    el.style.transition = 'opacity 0.6s ease';
    el.style.opacity = '0';
    timer = setTimeout(type, 700);
  }

  el.addEventListener('mousedown', function(e) {
    if (blocked) return;
    blocked = true;
    stop();
    el.textContent = 'Nice try. This one\'s read-only :-)';
    el.appendChild(cursor);
    timer = setTimeout(() => {
      blocked = false;
      el.textContent = '';
      el.appendChild(cursor);
      type();
    }, 2500);
    e.preventDefault();
  });

  timer = setTimeout(type, DELAY_START);
})();

// ═══════════════════════════════════════════
// CUSTOM CURSOR
// ═══════════════════════════════════════════
(function() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  let cursorX = 0, cursorY = 0;
  let targetX = 0, targetY = 0;

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

  // White-dot indicator for hidden actions
  document.querySelectorAll('[data-cursor-action]').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('has-action'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('has-action'));
  });

  // Heart morph on logo hover
  document.querySelectorAll('.nav-logo, .nav-logo-center, .footer-logo').forEach(logo => {
    logo.addEventListener('mouseenter', () => {
      cursor.classList.add('on-logo');
      cursor.classList.remove('hovering');
    });
    logo.addEventListener('mouseleave', () => cursor.classList.remove('on-logo'));
  });

  // Enlarge cursor on interactive elements
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
})();

// ═══════════════════════════════════════════
// MENU OVERLAY
// ═══════════════════════════════════════════
(function() {
  const menuOverlay = document.getElementById('menu-overlay');
  const menuOpenBtn = document.querySelector('.nav-menu-btn');
  const menuCloseBtn = document.getElementById('menu-close');
  if (!menuOverlay || !menuOpenBtn) return;

  menuOpenBtn.addEventListener('click', () => menuOverlay.classList.add('open'));
  menuCloseBtn?.addEventListener('click', () => menuOverlay.classList.remove('open'));
  menuOverlay.querySelectorAll('.menu-nav a').forEach(a => {
    a.addEventListener('click', () => menuOverlay.classList.remove('open'));
  });
})();

// ═══════════════════════════════════════════
// LOGO SCROLL FADE
// ═══════════════════════════════════════════
(function() {
  const navLogo = document.querySelector('.nav-logo');
  const navLogoCenter = document.getElementById('nav-logo-center');
  if (!navLogo || !navLogoCenter) return;

  const MAIN_FADE_START = 80, MAIN_FADE_END = 250;
  const CTR_FADE_START = 400, CTR_FADE_END = 600;
  const contactSection = document.getElementById('contact');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const mainP = Math.min(Math.max((y - MAIN_FADE_START) / (MAIN_FADE_END - MAIN_FADE_START), 0), 1);
    navLogo.style.opacity = 1 - mainP;

    // Fade in
    const ctrIn = Math.min(Math.max((y - CTR_FADE_START) / (CTR_FADE_END - CTR_FADE_START), 0), 1);

    // Fade out near contact section
    let ctrOut = 1;
    if (contactSection) {
      const contactTop = contactSection.offsetTop;
      const fadeOutStart = contactTop - window.innerHeight * 0.8;
      const fadeOutEnd = contactTop - window.innerHeight * 0.3;
      ctrOut = 1 - Math.min(Math.max((y - fadeOutStart) / (fadeOutEnd - fadeOutStart), 0), 1);
    }

    const ctrP = ctrIn * ctrOut;
    navLogoCenter.style.opacity = ctrP;
    navLogoCenter.style.pointerEvents = ctrP > 0.5 ? 'auto' : 'none';
  }, { passive: true });
})();

// ═══════════════════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════════════════
(function() {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
})();

// ═══════════════════════════════════════════
// ANIMATED DOT PATTERN (Hero background)
// ═══════════════════════════════════════════
(function() {
  const dotCanvas = document.getElementById('dot-pattern');
  if (!dotCanvas) return;

  const ctx = dotCanvas.getContext('2d');
  const SPACING = 80, DOT_RADIUS = 2;
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

  let dotsActive = true;
  new IntersectionObserver(([e]) => { dotsActive = e.isIntersecting; }, { threshold: 0 }).observe(dotCanvas);

  function draw(time) {
    if (!document.hidden && dotsActive) {
      const w = dotCanvas.clientWidth, h = dotCanvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const t = time * 0.001;
      for (const dot of dots) {
        const wave = (Math.sin(t * dot.speed + dot.phase) + 1) * 0.5;
        dot.opacity = MIN_OPACITY + wave * (MAX_OPACITY - MIN_OPACITY);
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
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
    DYE_RESOLUTION: 256,
    DENSITY_DISSIPATION: 0.978,
    VELOCITY_DISSIPATION: 0.972,
    PRESSURE_ITERATIONS: 10,
    SPLAT_RADIUS: 0.11,
    SPLAT_FORCE: 1600,
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
    pointer.dx = (e.clientX - pointer.x) * 2.8;
    pointer.dy = (e.clientY - pointer.y) * 2.8;
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

  let fluidActive = true;
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    new IntersectionObserver(([e]) => { fluidActive = e.isIntersecting; }, { threshold: 0 }).observe(heroSection);
  }

  let lastTime = Date.now();
  function update() {
    if (!document.hidden && fluidActive) {
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
    } else {
      lastTime = Date.now();
    }
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
  const HOLD_MS = 3500, ENTER_MS = 600, EXIT_MS = 500;

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
// PORTFOLIO LIGHTBOX
// ═══════════════════════════════════════════
(function() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  if (!lightbox) return;

  document.querySelectorAll('.bento-img[data-full]').forEach(item => {
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

  if (!reducedMotion) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const shift = y * 0.28;
      heroHeading.style.transform = `translateY(${shift}px)`;
      if (heroSub)  heroSub.style.transform  = `translateY(${shift * 0.7}px)`;
      if (heroCta)  heroCta.style.transform  = `translateY(${shift * 0.6}px)`;
    }, { passive: true });
  }
})();

// ═══════════════════════════════════════════
// LIGHT RAYS — WebGL Shader
// ═══════════════════════════════════════════
(function() {
  const canvas = document.getElementById('rays-canvas');
  if (!canvas || reducedMotion) { if (canvas) canvas.style.display = 'none'; return; }
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
  if (!gl) { canvas.style.display = 'none'; return; }

  const vertSrc = `#version 300 es
  in vec2 p;
  void main(){ gl_Position=vec4(p,0,1); }`;

  const fragSrc = `#version 300 es
  precision highp float;
  out vec4 O;
  uniform vec2 R;
  uniform float T;

  float rnd(vec2 p){
    p=fract(p*vec2(12.9898,78.233));
    p+=dot(p,p+34.56);
    return fract(p.x*p.y);
  }

  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
    float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+1.);
    return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
  }

  void main(){
    vec2 uv=(gl_FragCoord.xy-vec2(.55,.5)*R)/min(R.x,R.y);
    vec3 col=vec3(0);

    uv*=1.-.15*(sin(T*.15)*.5+.5);

    for(float i=1.;i<10.;i++){
      uv+=.08*cos(i*vec2(.1+.01*i,.8)+i*i+T*.4+.1*uv.x);
      vec2 p=uv;
      float d=length(p);

      col+=.001/d*(cos(sin(i)*vec3(.8,.9,1.))+1.);

      float b=noise(i+p+T*.1);
      col+=.0015*b/length(max(p,vec2(b*p.x*.02,p.y)));

      col=mix(col,vec3(0),d*.6);
    }

    float a=max(col.r,max(col.g,col.b));
    a=smoothstep(0.02,0.5,a);
    O=vec4(col,a);
  }`;

  function compileShader(src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Shader compile failed:', gl.getShaderInfoLog(shader));
      canvas.style.display = 'none'; return null;
    }
    return shader;
  }

  const vertShader = compileShader(vertSrc, gl.VERTEX_SHADER);
  const fragShader = compileShader(fragSrc, gl.FRAGMENT_SHADER);
  if (!vertShader || !fragShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    canvas.style.display = 'none'; return;
  }
  gl.useProgram(program);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  const posAttr = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(posAttr);
  gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

  const uRes  = gl.getUniformLocation(program, 'R');
  const uTime = gl.getUniformLocation(program, 'T');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    canvas.width  = canvas.clientWidth  * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  resize();
  window.addEventListener('resize', resize);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let raysVisible = true;
  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    new IntersectionObserver(([e]) => { raysVisible = e.isIntersecting; }, { threshold: 0 }).observe(heroEl);
  }

  function draw(now) {
    if (raysVisible && !document.hidden) {
      gl.uniform2f(uRes,  canvas.width, canvas.height);
      gl.uniform1f(uTime, now * 1e-3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

// ═══════════════════════════════════════════
// DRAGGABLE SERVICE CARDS
// ═══════════════════════════════════════════
(function() {
  if (window.innerWidth <= 768) return;
  const grid = document.querySelector('.services-grid');
  if (!grid) return;
  const cards = () => Array.from(grid.querySelectorAll('.service-card'));

  let dragged = null;
  let placeholder = null;
  let offsetX, offsetY;
  let startRect;

  function renumber() {
    cards().forEach((card, i) => {
      const num = card.querySelector('.service-number');
      if (num) num.textContent = String(i + 1).padStart(2, '0');
    });
  }

  function onPointerDown(e) {
    const card = e.target.closest('.service-card');
    if (!card || e.button !== 0) return;

    dragged = card;
    startRect = card.getBoundingClientRect();
    offsetX = e.clientX - startRect.left;
    offsetY = e.clientY - startRect.top;

    // Create placeholder
    placeholder = document.createElement('div');
    placeholder.className = 'service-card-placeholder';
    placeholder.style.width = startRect.width + 'px';
    placeholder.style.height = startRect.height + 'px';
    card.parentNode.insertBefore(placeholder, card);

    // Float the card
    card.classList.add('dragging');
    card.style.width = startRect.width + 'px';
    card.style.left = startRect.left + 'px';
    card.style.top = startRect.top + 'px';
    document.body.appendChild(card);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragged) return;
    dragged.style.left = (e.clientX - offsetX) + 'px';
    dragged.style.top = (e.clientY - offsetY) + 'px';

    // Find which card we're hovering over
    const allCards = cards().filter(c => c !== dragged);
    for (const card of allCards) {
      const rect = card.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      if (e.clientX > rect.left && e.clientX < rect.right &&
          e.clientY > rect.top && e.clientY < rect.bottom) {
        if (e.clientX < midX) {
          grid.insertBefore(placeholder, card);
        } else {
          grid.insertBefore(placeholder, card.nextSibling);
        }
        break;
      }
    }
  }

  function onPointerUp() {
    if (!dragged) return;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);

    // Put card back into grid at placeholder position
    dragged.classList.remove('dragging');
    dragged.style.width = '';
    dragged.style.left = '';
    dragged.style.top = '';
    grid.insertBefore(dragged, placeholder);
    placeholder.remove();

    renumber();
    dragged = null;
    placeholder = null;
  }

  grid.addEventListener('pointerdown', onPointerDown);
})();

// ═══════════════════════════════════════════
// VIDEO PAUSE WHEN OFF-SCREEN
// ═══════════════════════════════════════════
(function() {
  document.querySelectorAll('.statements-video-bg video, .contact-video-bg video').forEach(video => {
    function tryPlay() {
      if (video.readyState >= 2) {
        video.play().catch(() => {});
      } else {
        video.addEventListener('canplay', () => video.play().catch(() => {}), { once: true });
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        tryPlay();
      } else {
        video.pause();
      }
    }, { threshold: 0.1 });
    observer.observe(video.closest('section') || video.parentElement);
  });
})();

// ═══════════════════════════════════════════
// ROTATING QUOTE — TYPEWRITER + FADE
// ═══════════════════════════════════════════
(function() {
  const el = document.getElementById('rotating-quote');
  if (!el || reducedMotion) return;

  const quotes = [
    "Design is the first thing people notice. Make sure it tells the right story.",
    "A slow or outdated website costs you more than a new one. We build things that hold up.",
    "Getting found online isn't luck. It's consistent, deliberate work. We know what it takes."
  ];

  let index = 0;
  let typeTimer = null;

  function typeText(text) {
    clearTimeout(typeTimer);
    el.textContent = '';
    el.style.opacity = '1';
    let i = 0;
    function tick() {
      if (i < text.length) {
        el.textContent += text[i];
        i++;
        typeTimer = setTimeout(tick, 38);
      }
    }
    tick();
  }

  function next() {
    clearTimeout(typeTimer);
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = '';
      index = (index + 1) % quotes.length;
      typeText(quotes[index]);
    }, 750);
  }

  // Start when quote section scrolls into view
  el.style.opacity = '0';
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      observer.disconnect();
      setTimeout(() => typeText(quotes[0]), 200);
      const rotateInterval = setInterval(next, 6000);
    }
  }, { threshold: 0.4 });
  observer.observe(el.closest('section') || el.parentElement);
})();

// ═══════════════════════════════════════════
// STATS — STAGGER FADE + COUNT-UP
// ═══════════════════════════════════════════
(function() {
  const statsEl = document.querySelector('.about-stats');
  if (!statsEl) return;

  const items = statsEl.querySelectorAll('.stat-item');

  function countUp(numEl, target, duration) {
    const textNode = numEl.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      textNode.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
      else textNode.textContent = target;
    }
    requestAnimationFrame(tick);
  }

  if (reducedMotion) {
    items.forEach(item => item.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    items.forEach((item, i) => {
      setTimeout(() => {
        item.classList.add('visible');
        const numEl = item.querySelector('.stat-number');
        if (numEl) {
          const target = parseInt(numEl.firstChild.textContent);
          if (!isNaN(target)) countUp(numEl, target, 1800);
        }
      }, i * 320);
    });
  }, { threshold: 0.2 });

  observer.observe(statsEl);
})();

// ═══════════════════════════════════════════
// SERVICE CARD BACKGROUND ANIMATIONS
// ═══════════════════════════════════════════
(function() {
  if (reducedMotion) return;

  // ── Card 01: Graphic Design — floating geometric shapes ──
  function initDesign(w, h) {
    const types = ['circle', 'triangle', 'square'];
    const shapes = [];
    for (let i = 0; i < 9; i++) {
      shapes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 18 + Math.random() * 52,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.007,
        type: types[Math.floor(Math.random() * 3)],
        alpha: 0.04 + Math.random() * 0.08
      });
    }
    return shapes;
  }

  function drawDesign(ctx, w, h, shapes) {
    shapes.forEach(s => {
      s.x += s.vx; s.y += s.vy; s.rot += s.vrot;
      if (s.x < -s.r) s.x = w + s.r;
      if (s.x > w + s.r) s.x = -s.r;
      if (s.y < -s.r) s.y = h + s.r;
      if (s.y > h + s.r) s.y = -s.r;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.globalAlpha = s.alpha;
      ctx.strokeStyle = '#f08932';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (s.type === 'circle') {
        ctx.arc(0, 0, s.r, 0, Math.PI * 2);
      } else if (s.type === 'triangle') {
        ctx.moveTo(0, -s.r);
        ctx.lineTo(s.r * 0.866, s.r * 0.5);
        ctx.lineTo(-s.r * 0.866, s.r * 0.5);
        ctx.closePath();
      } else {
        ctx.rect(-s.r * 0.5, -s.r * 0.5, s.r, s.r);
      }
      ctx.stroke();
      ctx.restore();
    });
  }

  // ── Card 02: Web Dev — dot grid with scan line ──
  function initDev(w, h) {
    const cols = Math.ceil(w / 24);
    const rows = Math.ceil(h / 24);
    const dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({
          x: (c + 0.5) * (w / cols),
          y: (r + 0.5) * (h / rows),
          alpha: 0
        });
      }
    }
    return { dots, scanX: -20, scanSpeed: w / 160 };
  }

  function drawDev(ctx, w, h, state) {
    state.scanX += state.scanSpeed;
    if (state.scanX > w + 20) state.scanX = -20;

    state.dots.forEach(d => {
      const dist = Math.abs(d.x - state.scanX);
      d.alpha = dist < 18 ? Math.min(0.9, d.alpha + 0.18) : Math.max(0, d.alpha - 0.025);
      if (d.alpha > 0.01) {
        ctx.globalAlpha = d.alpha * 0.55;
        ctx.fillStyle = '#f08932';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const grad = ctx.createLinearGradient(state.scanX - 12, 0, state.scanX + 12, 0);
    grad.addColorStop(0, 'rgba(240,137,50,0)');
    grad.addColorStop(0.5, 'rgba(240,137,50,0.12)');
    grad.addColorStop(1, 'rgba(240,137,50,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(state.scanX - 12, 0, 24, h);
  }

  // ── Card 03: Marketing — radiating rings from multiple origins ──
  function initMarketing(w, h) {
    return {
      sources: [
        { x: w * 0.25, y: h * 0.38, phase: 0 },
        { x: w * 0.72, y: h * 0.28, phase: Math.PI * 0.9 },
        { x: w * 0.5,  y: h * 0.72, phase: Math.PI * 0.45 }
      ],
      t: 0
    };
  }

  function drawMarketing(ctx, w, h, state) {
    state.t += 0.016;
    const maxR = Math.max(w, h) * 0.42;
    state.sources.forEach(src => {
      for (let i = 0; i < 5; i++) {
        const progress = ((state.t + src.phase + i * 1.26) % (Math.PI * 2)) / (Math.PI * 2);
        const r = progress * maxR;
        const alpha = (1 - progress) * 0.22;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#f08932';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(src.x, src.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#f08932';
      ctx.beginPath();
      ctx.arc(src.x, src.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // ── Controller ──
  const cards = document.querySelectorAll('.service-card');
  const animTypes = ['design', 'dev', 'marketing'];
  const isTouch = window.matchMedia('(hover: none)').matches;

  cards.forEach((card, i) => {
    const canvas = card.querySelector('.service-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const type = animTypes[i] || 'design';
    let raf = null;
    let running = false;
    let state = null;

    function resize() {
      canvas.width  = card.offsetWidth;
      canvas.height = card.offsetHeight;
      if (type === 'design')   state = initDesign(canvas.width, canvas.height);
      else if (type === 'dev') state = initDev(canvas.width, canvas.height);
      else                     state = initMarketing(canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    function start() { running = true;  if (!raf) loop(); }
    function stop()  { running = false; }

    if (isTouch) {
      // Mobile: animate while card is in viewport
      // Also expose canvas since :hover won't fire on touch devices
      const observer = new IntersectionObserver(([entry]) => {
        const visible = entry.isIntersecting;
        visible ? start() : stop();
        canvas.style.opacity = visible ? '1' : '0';
      }, { threshold: 0.3 });
      observer.observe(card);
    } else {
      // Desktop: hover only
      card.addEventListener('mouseenter', start);
      card.addEventListener('mouseleave', stop);
    }

    function loop() {
      if (!running) { raf = null; return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (type === 'design')   drawDesign(ctx, canvas.width, canvas.height, state);
      else if (type === 'dev') drawDev(ctx, canvas.width, canvas.height, state);
      else                     drawMarketing(ctx, canvas.width, canvas.height, state);
      raf = requestAnimationFrame(loop);
    }
  });
})();

// ═══════════════════════════════════════════
// EMAIL OBFUSCATION
// ═══════════════════════════════════════════
(function() {
  document.querySelectorAll('.js-email').forEach(link => {
    const addr = link.dataset.u + '@' + link.dataset.d + '.' + link.dataset.t;
    link.href = 'mailto:' + addr;
    const label = link.querySelector('.js-email-text');
    if (label) label.textContent = addr;
    link.removeAttribute('aria-label');
  });
})();
