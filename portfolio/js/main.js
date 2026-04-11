let lenisInstance = null;

/* === Theme Toggle === */
(function () {
  const root = document.documentElement;
  const THEME_KEY = 'portfolio_theme';
  const isTouch = window.matchMedia('(hover: none)').matches;

  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light') root.dataset.theme = 'light';

  function applyTheme(isLight) {
    root.dataset.theme = isLight ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, isLight ? 'dark' : 'light');
  }

  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      applyTheme(root.dataset.theme === 'light');
      if (isTouch) {
        btn.classList.add('tooltip-active');
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!isTouch || e.target.closest('.theme-toggle')) return;
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.classList.remove('tooltip-active');
    });
  });

  document.addEventListener('portfolio:unlocked', function () {
    setTimeout(function () {
      document.querySelectorAll('.theme-toggle').forEach(function (btn) {
        btn.classList.add('hint-pulse');
        btn.addEventListener('animationend', function () {
          btn.classList.remove('hint-pulse');
        }, { once: true });
      });
    }, 3000);
  });
})();

/* === Password Modal === */
(function () {
  const AUTH_KEY = 'portfolio_auth';

  const overlay = document.getElementById('pw-overlay');
  const card    = document.querySelector('.pw-card');
  if (!overlay) return;

  function triggerNav() {
    setTimeout(function () {
      const nav = document.querySelector('.nav');
      if (nav) nav.classList.add('nav-visible');
      document.dispatchEvent(new CustomEvent('portfolio:unlocked'));
    }, 700);
  }

  function removeGate() {
    overlay.remove();
    if (card) card.remove();
    const s = document.getElementById('pw-smiley');
    if (s) s.remove();
    triggerNav();
  }

  function unlock() {
    sessionStorage.setItem(AUTH_KEY, '1');
    const smiley = document.getElementById('pw-smiley');
    if (card)  card.classList.add('fade-out');
    if (smiley) smiley.classList.add('fade-out');
    setTimeout(function () {
      overlay.classList.add('fade-out');
      document.body.classList.remove('modal-open', 'pw-active');
      triggerNav();
      setTimeout(function () {
        overlay.remove();
        if (card) card.remove();
        if (smiley) smiley.remove();
        document.querySelectorAll('img').forEach(function (img) {
          const s = img.getAttribute('src') || '';
          if (s.indexOf('images/designs/') !== -1) { img.src = ''; img.src = s; }
        });
        document.querySelectorAll('video').forEach(function (v) { v.load(); });
      }, 700);
    }, 650);
  }

  if (sessionStorage.getItem(AUTH_KEY) === '1') {
    overlay.style.visibility = 'hidden';
    if (card) card.style.visibility = 'hidden';
    const smileyEl = document.getElementById('pw-smiley');
    if (smileyEl) smileyEl.style.visibility = 'hidden';
    fetch('php/auth.php')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.ok) {
          removeGate();
        } else {
          overlay.style.visibility = '';
          if (card) card.style.visibility = '';
          if (smileyEl) smileyEl.style.visibility = '';
          sessionStorage.removeItem(AUTH_KEY);
          initGate();
        }
      })
      .catch(function () {
        removeGate();
      });
    return;
  }

  initGate();

  function initGate() {
    document.body.classList.add('modal-open', 'pw-active');
    const input   = document.querySelector('.pw-input');
    const errorEl = document.querySelector('.pw-error');
    const form    = document.querySelector('.pw-form');
    const submit  = form && form.querySelector('.pw-submit');

    function fail(msg) {
      input.classList.remove('shake');
      void input.offsetWidth;
      input.classList.add('shake');
      const isDE = document.documentElement.lang === 'de';
      errorEl.innerHTML = msg || (isDE
        ? 'Zugang verweigert. Bitte geben Sie das erhaltene Passwort ein. Bei Problemen wenden Sie sich an <a href="mailto:andreas@stoeffel-media.com.au">andreas@stoeffel-media.com.au</a>'
        : 'Access denied. Please enter the password you were given. If you need assistance, contact <a href="mailto:andreas@stoeffel-media.com.au">andreas@stoeffel-media.com.au</a>');
      errorEl.classList.add('visible');
      input.value = '';
      input.focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submit) submit.disabled = true;
      fetch('php/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input.value })
      })
        .then(function (r) { return r.json().then(function (d) { return { status: r.status, data: d }; }); })
        .then(function (res) {
          if (res.data.ok) {
            unlock();
          } else if (res.status === 429) {
            fail(document.documentElement.lang === 'de'
              ? 'Zu viele Versuche. Bitte warten Sie eine Stunde.'
              : 'Too many attempts. Please wait an hour.');
            if (submit) submit.disabled = false;
          } else {
            if (submit) submit.disabled = false;
            fail();
          }
        })
        .catch(function () {
          if (submit) submit.disabled = false;
          fail();
        });
    });

    input.addEventListener('input', function () { errorEl.classList.remove('visible'); });

    const toggle = document.querySelector('.pw-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        const visible = input.type === 'text';
        input.type = visible ? 'password' : 'text';
        toggle.classList.toggle('visible', !visible);
        toggle.setAttribute('aria-label', visible
          ? (document.documentElement.lang === 'de' ? 'Passwort anzeigen' : 'Show password')
          : (document.documentElement.lang === 'de' ? 'Passwort verbergen' : 'Hide password'));
      });
    }

    setTimeout(function () { input.focus(); }, 100);
  }
})();

/* === Custom Cursor === */
(function () {
  const cursor = document.querySelector('.cursor');
  if (!cursor || window.matchMedia('(max-width: 768px)').matches) return;

  let mx = 0, my = 0;
  let cx = 0, cy = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  function updateCursor() {
    cx += (mx - cx) * 0.15;
    cy += (my - cy) * 0.15;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  const hoverEls = document.querySelectorAll('a, button, .portfolio-item, .photo-item, .project-header, .filter-tab');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });
})();

/* === WebGL Fluid Simulation === */
(function () {
  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;

  const config = {
    SIM_RESOLUTION: 128, DYE_RESOLUTION: 256,
    DENSITY_DISSIPATION: 0.978, VELOCITY_DISSIPATION: 0.972,
    PRESSURE_ITERATIONS: 10, SPLAT_RADIUS: 0.11, SPLAT_FORCE: 1600,
    COLOR_R: 0.94, COLOR_G: 0.54, COLOR_B: 0.20,
  };

  let gl, ext, simWidth, simHeight, dyeWidth, dyeHeight;
  let density, velocity, pressure, divergence;
  let splatProgram, advectionProgram, divergenceProgram, pressureProgram,
      gradientSubtractProgram, clearProgram, displayProgram;
  let pointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false };

  document.addEventListener('mousemove', (e) => {
    pointer.dx = (e.clientX - pointer.x) * 2.8;
    pointer.dy = (e.clientY - pointer.y) * 2.8;
    pointer.x = e.clientX; pointer.y = e.clientY;
    if (!e.target.closest('.portfolio-item, .photo-item')) {
      pointer.moved = true;
    }
  });

  const baseVS = `precision highp float; attribute vec2 aPosition; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform vec2 texelSize; void main(){vUv=aPosition*0.5+0.5;vL=vUv-vec2(texelSize.x,0.0);vR=vUv+vec2(texelSize.x,0.0);vT=vUv+vec2(0.0,texelSize.y);vB=vUv-vec2(0.0,texelSize.y);gl_Position=vec4(aPosition,0.0,1.0);}`;
  const clearFS = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;uniform sampler2D uTexture;uniform float value;void main(){gl_FragColor=value*texture2D(uTexture,vUv);}`;
  const displayFS = `precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uTexture;void main(){vec3 c=texture2D(uTexture,vUv).rgb;gl_FragColor=vec4(c,max(c.r,max(c.g,c.b)));}`;
  const splatFS = `precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uTarget;uniform float aspectRatio;uniform vec3 color;uniform vec2 point;uniform float radius;void main(){vec2 p=vUv-point.xy;p.x*=aspectRatio;vec3 splat=exp(-dot(p,p)/radius)*color;gl_FragColor=vec4(texture2D(uTarget,vUv).xyz+splat,1.0);}`;
  const advectionFS = `precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uVelocity;uniform sampler2D uSource;uniform vec2 texelSize;uniform vec2 dyeTexelSize;uniform float dt;uniform float dissipation;void main(){vec2 coord=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;gl_FragColor=vec4(dissipation*texture2D(uSource,coord).rgb*dissipation,1.0);}`;
  const divergenceFS = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).x;float R=texture2D(uVelocity,vR).x;float T=texture2D(uVelocity,vT).y;float B=texture2D(uVelocity,vB).y;vec2 C=texture2D(uVelocity,vUv).xy;if(vL.x<0.0)L=-C.x;if(vR.x>1.0)R=-C.x;if(vT.y>1.0)T=-C.y;if(vB.y<0.0)B=-C.y;gl_FragColor=vec4(0.5*(R-L+T-B),0.0,0.0,1.0);}`;
  const pressureFS = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uPressure;uniform sampler2D uDivergence;void main(){float L=texture2D(uPressure,vL).x;float R=texture2D(uPressure,vR).x;float T=texture2D(uPressure,vT).x;float B=texture2D(uPressure,vB).x;float div=texture2D(uDivergence,vUv).x;gl_FragColor=vec4((L+R+B+T-div)*0.25,0.0,0.0,1.0);}`;
  const gradFS = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uPressure;uniform sampler2D uVelocity;void main(){float L=texture2D(uPressure,vL).x;float R=texture2D(uPressure,vR).x;float T=texture2D(uPressure,vT).x;float B=texture2D(uPressure,vB).x;vec2 vel=texture2D(uVelocity,vUv).xy;vel.xy-=vec2(R-L,T-B);gl_FragColor=vec4(vel,0.0,1.0);}`;

  function getSupportedFormat(g, iF, f, t) {
    const tex = g.createTexture(); g.bindTexture(g.TEXTURE_2D, tex);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texImage2D(g.TEXTURE_2D, 0, iF, 4, 4, 0, f, t, null);
    const fb = g.createFramebuffer(); g.bindFramebuffer(g.FRAMEBUFFER, fb);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, tex, 0);
    const ok = g.checkFramebufferStatus(g.FRAMEBUFFER) === g.FRAMEBUFFER_COMPLETE;
    g.deleteTexture(tex); g.deleteFramebuffer(fb); g.bindFramebuffer(g.FRAMEBUFFER, null);
    return ok ? { internalFormat: iF, format: f } : { internalFormat: g.RGBA, format: g.RGBA };
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
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s;
  }
  function createProgram(vs, fs) {
    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
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
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, intf, w, h, 0, fmt, type, null);
    const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture: tex, fbo, width: w, height: h,
      attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; }
    };
  }
  function createDoubleFBO(w, h, intf, fmt, type, filter) {
    let a = createFBO(w, h, intf, fmt, type, filter), b = createFBO(w, h, intf, fmt, type, filter);
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
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: mx, height: mn } : { width: mn, height: mx };
  }
  function initFramebuffers() {
    const sr = getResolution(config.SIM_RESOLUTION), dr = getResolution(config.DYE_RESOLUTION);
    simWidth = sr.width; simHeight = sr.height; dyeWidth = dr.width; dyeHeight = dr.height;
    const tt = ext.halfFloat, rgba = ext.formatRGBA, rg = ext.formatRG, r = ext.formatR, f = ext.filtering;
    density    = createDoubleFBO(dyeWidth, dyeHeight, rgba.internalFormat, rgba.format, tt, f);
    velocity   = createDoubleFBO(simWidth, simHeight, rg.internalFormat, rg.format, tt, f);
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
    if (!document.hidden) {
      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.016);
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
    canvas.width  = canvas.clientWidth  * Math.min(window.devicePixelRatio || 1, 2);
    canvas.height = canvas.clientHeight * Math.min(window.devicePixelRatio || 1, 2);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    splatProgram            = createProgram(baseVS, splatFS);
    advectionProgram        = createProgram(baseVS, advectionFS);
    divergenceProgram       = createProgram(baseVS, divergenceFS);
    pressureProgram         = createProgram(baseVS, pressureFS);
    gradientSubtractProgram = createProgram(baseVS, gradFS);
    clearProgram            = createProgram(baseVS, clearFS);
    displayProgram          = createProgram(baseVS, displayFS);
    initFramebuffers();
    window.addEventListener('resize', () => {
      canvas.width  = canvas.clientWidth  * Math.min(window.devicePixelRatio || 1, 2);
      canvas.height = canvas.clientHeight * Math.min(window.devicePixelRatio || 1, 2);
      initFramebuffers();
    });
    update();
  }
  window.addEventListener('load', init);
})();

/* === Draggable Password Card === */
(function () {
  const card = document.querySelector('.pw-card');
  const cursor = document.querySelector('.cursor');
  if (!card) return;

  let isDragging = false, startX = 0, startY = 0, cardX = 0, cardY = 0;

  function centerCard() {
    if (isDragging) return;
    cardX = Math.round((window.innerWidth - card.offsetWidth) / 2);
    cardY = Math.round((window.innerHeight - card.offsetHeight) / 2);
    card.style.transform = `translate(${cardX}px, ${cardY}px)`;
  }
  centerCard();
  window.addEventListener('resize', centerCard);

  card.addEventListener('mouseenter', () => cursor && cursor.classList.add('has-action'));
  card.addEventListener('mouseleave', () => {
    if (!isDragging) cursor && cursor.classList.remove('has-action');
  });

  card.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    isDragging = true;
    startX = e.clientX - cardX;
    startY = e.clientY - cardY;
    cursor && cursor.classList.add('dragging');
    cursor && cursor.classList.remove('has-action');
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    cardX = e.clientX - startX;
    cardY = e.clientY - startY;
    card.style.transform = `translate(${cardX}px, ${cardY}px)`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    cursor && cursor.classList.remove('dragging');
    cursor && cursor.classList.add('has-action');
  });

  setTimeout(function () {
    setInterval(function () {
      card.animate([
        { boxShadow: '0 0 60px rgba(240,137,50,0.28), 0 20px 60px rgba(0,0,0,0.5)' },
        { boxShadow: '0 0 85px rgba(240,137,50,0.70), 0 20px 60px rgba(0,0,0,0.5)' },
        { boxShadow: '0 0 60px rgba(240,137,50,0.28), 0 20px 60px rgba(0,0,0,0.5)' },
        { boxShadow: '0 0 85px rgba(240,137,50,0.70), 0 20px 60px rgba(0,0,0,0.5)' },
        { boxShadow: '0 0 60px rgba(240,137,50,0.28), 0 20px 60px rgba(0,0,0,0.5)' }
      ], { duration: 1600, easing: 'ease-in-out', fill: 'forwards' });
    }, 20000);
  }, 3000);
})();

/* === Dot Pattern Canvas === */
(function () {
  const canvas = document.getElementById('dot-pattern');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;
  const SPACING = 80;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  let paused = false;
  document.addEventListener('visibilitychange', function () {
    paused = document.hidden;
  });

  function draw() {
    if (!paused) {
      ctx.clearRect(0, 0, W, H);
      const cols = Math.ceil(W / SPACING) + 1;
      const rows = Math.ceil(H / SPACING) + 1;
      const isPwActive = document.body.classList.contains('pw-active');
      const isLight = document.documentElement.dataset.theme === 'light';
      const alphaRange = isPwActive ? 0.32 : 0.08;
      const alphaBase  = isPwActive ? 0.08 : 0.016;
      const dotRGB = isLight ? '44,42,38' : '255,255,255';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING;
          const y = r * SPACING;
          const wave = Math.sin(t * 0.4 + c * 0.5 + r * 0.3);
          const alpha = (wave + 1) / 2 * alphaRange + alphaBase;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${dotRGB},${alpha})`;
          ctx.fill();
        }
      }
      t += 0.015;
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* === Lenis Smooth Scroll === */
(function () {
  if (typeof Lenis === 'undefined') return;
  const lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenisInstance = lenis;
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -72 });
      if (menuOverlay && menuOverlay.classList.contains('open')) {
        menuOverlay.classList.remove('open');
        document.body.classList.remove('modal-open');
      }
    });
  });
})();

/* === Navigation / Hamburger Menu === */
const menuOverlay = document.querySelector('.menu-overlay');
const menuBtn = document.querySelector('.nav-menu-btn');

if (menuBtn && menuOverlay) {
  menuBtn.addEventListener('click', function () {
    const isOpen = menuOverlay.classList.toggle('open');
    document.body.classList.toggle('modal-open', isOpen);
  });

  function closeMenu() {
    menuOverlay.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  menuOverlay.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  menuOverlay.addEventListener('click', function (e) {
    if (!e.target.closest('.menu-nav')) closeMenu();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menuOverlay.classList.contains('open')) closeMenu();
  });
}

/* === Nav Scroll Behaviour === */
(function () {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  const logo = nav.querySelector('.nav-logo');
  const footerLogo = document.querySelector('.footer-logo');
  [logo, footerLogo].forEach(el => {
    if (!el) return;
    el.addEventListener('click', e => {
      e.preventDefault();
      if (lenisInstance) {
        lenisInstance.scrollTo(0, { duration: 1.4 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
})();

/* === Section Typewriter === */
(function () {
  const els = document.querySelectorAll('[data-section-typewriter]');
  if (!els.length) return;

  els.forEach(el => {
    const text = el.dataset.sectionTypewriter;
    const splitAt = parseInt(el.dataset.typewriterSplit, 10) || text.length;
    el.style.opacity = '0';

    const cursor = document.createElement('span');
    cursor.className = 'section-typewriter-cursor';

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.unobserve(el);

        el.innerHTML = '';
        el.appendChild(cursor);
        el.style.opacity = '1';

        let i = 0;
        function tick() {
          if (i < text.length) {
            const char = text[i];
            if (i < splitAt) {
              cursor.before(document.createTextNode(char));
            } else {
              if (i === splitAt) {
                const outlineSpan = document.createElement('span');
                outlineSpan.className = 'outline';
                cursor.before(outlineSpan);
              }
              const outlineSpan = el.querySelector('.outline');
              cursor.remove();
              outlineSpan.appendChild(document.createTextNode(char));
              outlineSpan.appendChild(cursor);
            }
            i++;
            setTimeout(tick, 60);
          } else {
            setTimeout(() => cursor.remove(), 900);
          }
        }
        setTimeout(tick, 200);
      });
    }, { threshold: 0.4 });

    obs.observe(el);
  });
})();

/* === Scroll Reveal === */
(function () {
  const els = document.querySelectorAll('.reveal:not(.portfolio-item)');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => obs.observe(el));

  let staggerCounter = 0;
  let staggerResetTimer = null;

  const itemObs = new IntersectionObserver((entries) => {
    const appearing = entries.filter(e => e.isIntersecting);
    appearing.forEach((entry) => {
      const el = entry.target;
      itemObs.unobserve(el);
      const delay = staggerCounter * 80;
      staggerCounter++;
      clearTimeout(staggerResetTimer);
      staggerResetTimer = setTimeout(function () { staggerCounter = 0; }, 400);
      // rAF ensures the browser has painted opacity:0 before the animation starts
      requestAnimationFrame(function () {
        el.style.animationDelay = delay + 'ms';
        el.classList.add('entering');
        el.style.opacity = '1';
        const vid = el.querySelector('video');
        if (vid) {
          vid.load();
          vid.addEventListener('canplay', function () {
            vid.play().catch(function () {});
          }, { once: true });
        }
      });
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.portfolio-item').forEach(el => {
    el.classList.remove('reveal', 'delay-1', 'delay-2', 'delay-3');
    el.style.opacity = '0';
    itemObs.observe(el);
  });
})();

/* === Portfolio Filter === */
(function () {
  const tabs = document.querySelectorAll('.filter-tab');
  const sections = document.querySelectorAll('.portfolio-cat-section');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', function () {
      const cat = this.dataset.filter;
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      sections.forEach(section => {
        const show = cat === 'all' || section.dataset.cat === cat;
        section.classList.toggle('hidden', !show);
        if (show && cat !== 'all') {
          const body = section.querySelector('.portfolio-cat-body');
          const icon = section.querySelector('.cat-toggle-icon');
          const btn = section.querySelector('.cat-toggle');
          if (body && body.classList.contains('collapsed')) {
            body.style.maxHeight = body.scrollHeight + 'px';
            body.classList.remove('collapsed');
            if (icon) icon.textContent = '−';
            if (btn) btn.setAttribute('aria-expanded', 'true');
          }
        }
      });

      let idx = 0;
      document.querySelectorAll('.portfolio-cat-section:not(.hidden) .portfolio-item').forEach(item => {
        item.style.opacity = '0';
        item.classList.remove('entering');
        void item.offsetWidth;
        item.style.animationDelay = (idx * 40) + 'ms';
        item.classList.add('entering');
        item.style.opacity = '1';
        idx++;
      });

      updateCursorTargets();
    });
  });
})();

/* === Portfolio Section Collapse === */
(function () {
  document.querySelectorAll('.portfolio-cat-header').forEach(header => {
    const section = header.closest('.portfolio-cat-section');
    const body = section.querySelector('.portfolio-cat-body');
    const icon = header.querySelector('.cat-toggle-icon');
    const btn = header.querySelector('.cat-toggle');

    // Set initial max-height so transition works
    body.style.maxHeight = body.scrollHeight + 'px';

    btn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = !body.classList.contains('collapsed');
      if (isOpen) {
        body.style.maxHeight = body.scrollHeight + 'px';
        requestAnimationFrame(() => {
          body.style.maxHeight = '0px';
          body.classList.add('collapsed');
          icon.textContent = '+';
          btn.setAttribute('aria-expanded', 'false');
        });
      } else {
        body.classList.remove('collapsed');
        body.style.maxHeight = body.scrollHeight + 'px';
        icon.textContent = '−';
        btn.setAttribute('aria-expanded', 'true');
        // Clear max-height after transition so images/resize don't clip
        body.addEventListener('transitionend', () => {
          if (!body.classList.contains('collapsed')) body.style.maxHeight = 'none';
        }, { once: true });
      }
    });

    header.addEventListener('click', e => {
      if (!e.target.closest('.cat-toggle')) btn.click();
    });
  });
})();

function updateCursorTargets() {
  const cursor = document.querySelector('.cursor');
  if (!cursor) return;
  document.querySelectorAll('.portfolio-item, .photo-item').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });
}

/* === Lightbox === */
(function () {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const inner = lightbox.querySelector('.lightbox-inner');
  const img = lightbox.querySelector('.lightbox-img');
  const lbVideo = lightbox.querySelector('.lightbox-video');
  const counter = lightbox.querySelector('.lightbox-counter');
  const btnClose = lightbox.querySelector('.lightbox-close');
  const btnPrev = lightbox.querySelector('.lightbox-nav.prev');
  const btnNext = lightbox.querySelector('.lightbox-nav.next');
  const scrollHint = document.getElementById('lightbox-scroll-hint');
  let hintTimeout;

  let items = [];
  let currentIndex = 0;

  function buildItems(category) {
    const sel = category ? '[data-full][data-category="' + category + '"]' : '[data-full]';
    items = Array.from(document.querySelectorAll(sel));
  }

  function updateNavButtons() {
    const atStart = currentIndex === 0;
    const atEnd   = currentIndex === items.length - 1;
    if (btnPrev) { btnPrev.style.opacity = atStart ? '0.2' : ''; btnPrev.style.pointerEvents = atStart ? 'none' : ''; }
    if (btnNext) { btnNext.style.opacity = atEnd   ? '0.2' : ''; btnNext.style.pointerEvents = atEnd   ? 'none' : ''; }
  }

  function navigate(index) {
    currentIndex = Math.max(0, Math.min(index, items.length - 1));
    clearTimeout(hintTimeout);
    if (scrollHint) scrollHint.classList.remove('visible');
    inner.scrollTop = 0;
    const src = items[currentIndex].dataset.full;
    const isVideo = /\.mp4$/i.test(src);
    if (isVideo) {
      img.style.display = 'none';
      lbVideo.style.display = 'block';
      lbVideo.src = src;
      lbVideo.play().catch(function () {});
    } else {
      lbVideo.style.display = 'none';
      lbVideo.pause();
      lbVideo.src = '';
      img.style.display = '';
      img.src = src;
      img.onload = function () {
        if (scrollHint && inner.scrollHeight > inner.clientHeight) {
          scrollHint.classList.add('visible');
          hintTimeout = setTimeout(() => scrollHint.classList.remove('visible'), 2500);
        }
      };
    }
    if (counter) counter.textContent = (currentIndex + 1) + ' / ' + items.length;
    updateNavButtons();
  }

  function open(index) {
    lightbox.classList.add('open');
    document.body.classList.add('modal-open');
    if (lenisInstance) lenisInstance.stop();
    navigate(index);
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.classList.remove('modal-open');
    clearTimeout(hintTimeout);
    if (scrollHint) scrollHint.classList.remove('visible');
    if (lenisInstance) lenisInstance.start();
    setTimeout(() => {
      img.src = '';
      lbVideo.pause();
      lbVideo.src = '';
      lbVideo.style.display = 'none';
    }, 300);
  }

  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('[data-full]');
    if (!trigger) return;
    buildItems(trigger.dataset.category || '');
    const idx = items.indexOf(trigger);
    if (idx !== -1) open(idx);
  });

  btnClose && btnClose.addEventListener('click', close);
  btnPrev && btnPrev.addEventListener('click', (e) => { e.stopPropagation(); navigate(currentIndex - 1); });
  btnNext && btnNext.addEventListener('click', (e) => { e.stopPropagation(); navigate(currentIndex + 1); });

  inner.addEventListener('scroll', () => {
    if (scrollHint) scrollHint.classList.remove('visible');
    clearTimeout(hintTimeout);
  }, { passive: true });

  let isDragging = false;
  let dragStartY = 0;
  let scrollStart = 0;
  let dragMoved = false;

  inner.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragMoved = false;
    dragStartY = e.clientY;
    scrollStart = inner.scrollTop;
    inner.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    dragMoved = true;
    inner.style.cursor = 'grabbing';
    inner.scrollTop = scrollStart - (e.clientY - dragStartY);
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    inner.style.cursor = '';
    inner.style.userSelect = '';
  });

  inner.addEventListener('click', (e) => {
    if (!dragMoved && e.target === inner) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') navigate(currentIndex - 1);
    if (e.key === 'ArrowRight' || e.key === 'd') navigate(currentIndex + 1);
    if (e.key === 'Escape') close();
  });

  let swipeStartX = 0;
  let swipeStartY = 0;
  inner.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
  }, { passive: true });
  inner.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - swipeStartX;
    const dy = e.changedTouches[0].clientY - swipeStartY;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) navigate(currentIndex + 1);
    else navigate(currentIndex - 1);
  }, { passive: true });

  let wheelCooldown = false;
  lightbox.addEventListener('wheel', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    if (Math.abs(e.deltaX) < 20) return;
    if (wheelCooldown) return;
    e.preventDefault();
    wheelCooldown = true;
    if (e.deltaX > 0) navigate(currentIndex + 1);
    else navigate(currentIndex - 1);
    setTimeout(function () { wheelCooldown = false; }, 600);
  }, { passive: false });
})();

/* === Projects Accordion === */
(function () {
  const items = document.querySelectorAll('.project-item');
  items.forEach(item => {
    const header = item.querySelector('.project-header');
    header && header.addEventListener('click', function () {
      const isOpen = item.classList.contains('open');
      items.forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
})();

/* === Obfuscated Email === */
(function () {
  document.querySelectorAll('[data-email-user]').forEach(el => {
    const user = el.dataset.emailUser;
    const domain = el.dataset.emailDomain;
    const tld = el.dataset.emailTld;
    const subject = el.dataset.emailSubject || '';
    const address = user + '@' + domain + '.' + tld;
    const href = subject
      ? 'mailto:' + address + '?subject=' + encodeURIComponent(subject)
      : 'mailto:' + address;
    el.setAttribute('href', href);
    const svg = el.querySelector('svg');
    if (svg) {
      Array.from(el.childNodes).forEach(n => { if (n.nodeType === 3) n.remove(); });
      el.appendChild(document.createTextNode(' ' + address));
    } else {
      el.textContent = address;
    }
  });
})();

/* === Milestone Count-Up === */
(function () {
  const section = document.querySelector('.milestones-section');
  if (!section) return;

  function animateCount(el, target, suffix, delay) {
    setTimeout(function () {
      const duration = 1400;
      const start = performance.now();
      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);
  }

  const obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      obs.unobserve(section);
      section.querySelectorAll('.milestone-num').forEach(function (el, i) {
        const raw = el.textContent.trim();
        const suffix = raw.replace(/[0-9]/g, '');
        const target = parseInt(raw, 10);
        el.textContent = '0' + suffix;
        animateCount(el, target, suffix, i * 250);
      });
    });
  }, { threshold: 0.3 });

  obs.observe(section);
})();

/* === Skill Popovers === */
(function () {
  if (!document.getElementById('skills')) return;

  const isDE = document.documentElement.lang === 'de';

  const popover = document.createElement('div');
  popover.id = 'skill-popover';
  popover.className = 'skill-popover';
  popover.innerHTML =
    '<div class="skill-popover-thumbs"></div>' +
    '<a class="skill-popover-link"></a>' +
    '<p class="skill-popover-text"></p>';
  document.body.appendChild(popover);

  const thumbsEl = popover.querySelector('.skill-popover-thumbs');
  const linkEl   = popover.querySelector('.skill-popover-link');
  const textEl   = popover.querySelector('.skill-popover-text');

  const filterMap = { graphics: 'graphics', logos: 'graphics', print: 'print', 'web-design': 'web-design' };

  function getThumbs(key) {
    let items;
    if (key === 'logos') {
      items = Array.from(document.querySelectorAll('[data-category="graphics"]')).filter(function (el) {
        const cat = el.querySelector('.item-cat');
        return cat && cat.textContent.trim() === 'Logos';
      });
    } else {
      items = Array.from(document.querySelectorAll('[data-category="' + key + '"]:not(.is-video)'));
    }
    return items.slice(0, 3).map(function (el) {
      const img = el.querySelector('img');
      return img ? img.src : null;
    }).filter(Boolean);
  }

  let activeEl = null;

  function position(triggerEl) {
    const rect = triggerEl.getBoundingClientRect();
    const pad  = 12;
    popover.style.top  = (rect.bottom + 10) + 'px';
    popover.style.left = (rect.left + rect.width / 2) + 'px';
    const pop = popover.getBoundingClientRect();
    if (pop.left < pad) {
      popover.style.left = (parseFloat(popover.style.left) - pop.left + pad) + 'px';
    } else if (pop.right > window.innerWidth - pad) {
      popover.style.left = (parseFloat(popover.style.left) - (pop.right - window.innerWidth + pad)) + 'px';
    }
  }

  function openThumbPopover(triggerEl) {
    const key    = triggerEl.dataset.skillPopover;
    const thumbs = getThumbs(key);
    if (!thumbs.length) return;

    thumbsEl.innerHTML = thumbs.map(function (src) { return '<img src="' + (thumbCache[src] || src) + '" alt="">'; }).join('');
    thumbsEl.style.display = '';
    linkEl.style.display = '';
    textEl.style.display  = 'none';

    linkEl.textContent = isDE ? 'Arbeiten ansehen \u2192' : 'View samples \u2192';
    linkEl.onclick = function (e) {
      e.preventDefault();
      closePopover();
      const cat       = filterMap[key] || key;
      const portfolio = document.getElementById('portfolio');
      if (portfolio && lenisInstance) {
        lenisInstance.scrollTo(portfolio, { offset: -80, duration: 0.8 });
      } else if (portfolio) {
        portfolio.scrollIntoView({ behavior: 'smooth' });
      }
      setTimeout(function () {
        const btn = document.querySelector('.filter-tab[data-filter="' + cat + '"]');
        if (btn) btn.click();
      }, 750);
    };

    activeEl = triggerEl;
    position(triggerEl);
    popover.classList.add('visible');
  }

  function openTextPopover(triggerEl) {
    thumbsEl.style.display = 'none';
    linkEl.style.display   = 'none';
    textEl.style.display   = '';
    textEl.textContent     = triggerEl.dataset.skillText;

    activeEl = triggerEl;
    position(triggerEl);
    popover.classList.add('visible');
  }

  function closePopover() {
    popover.classList.remove('visible');
    activeEl = null;
  }

  let hideTimer = null;

  function scheduleClose() {
    hideTimer = setTimeout(closePopover, 150);
  }

  function cancelClose() {
    clearTimeout(hideTimer);
  }

  function openFor(span) {
    cancelClose();
    if (span.dataset.skillPopover) {
      openThumbPopover(span);
    } else {
      openTextPopover(span);
    }
  }

  const isTouch = window.matchMedia('(hover: none)').matches;

  document.querySelectorAll('[data-skill-popover], [data-skill-text]').forEach(function (span) {
    if (!isTouch) {
      span.addEventListener('mouseenter', function () { openFor(span); });
      span.addEventListener('mouseleave', scheduleClose);
    }
    span.addEventListener('click', function (e) {
      e.stopPropagation();
      if (activeEl === span && popover.classList.contains('visible')) {
        cancelClose();
        closePopover();
      } else {
        openFor(span);
      }
    });
  });

  popover.addEventListener('mouseenter', cancelClose);
  popover.addEventListener('mouseleave', scheduleClose);

  document.addEventListener('click', function (e) {
    if (!popover.classList.contains('visible')) return;
    if (!popover.contains(e.target) && !e.target.closest('[data-skill-popover], [data-skill-text]')) closePopover();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePopover(); });
  window.addEventListener('scroll', closePopover, { passive: true });

  const thumbCache = {};

  document.addEventListener('portfolio:unlocked', function () {
    document.querySelectorAll('[data-skill-popover]').forEach(function (span) {
      getThumbs(span.dataset.skillPopover).forEach(function (src) {
        if (src in thumbCache) return;
        thumbCache[src] = src;
        fetch(src, { credentials: 'include' })
          .then(function (r) { return r.blob(); })
          .then(function (blob) { thumbCache[src] = URL.createObjectURL(blob); })
          .catch(function () {});
      });
    });
  }, { once: true });
})();

/* === Copy Protection === */
(function () {
  document.addEventListener('contextmenu', function (e) {
    if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO' ||
        e.target.closest('.portfolio-items-grid, .photo-grid, #lightbox')) {
      e.preventDefault();
    }
  });

  document.addEventListener('dragstart', function (e) {
    if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
      e.preventDefault();
    }
  });
})();

/* === Password Smiley Typewriter === */
(function () {
  const el = document.getElementById('pw-smiley');
  if (!el) return;

  const text = ';-)';
  let charIndex = 0;
  let timer;

  function typeNext() {
    el.textContent = text.slice(0, charIndex);
    if (charIndex <= text.length) {
      charIndex++;
      timer = setTimeout(typeNext, 480);
    }
  }

  function reset() {
    clearTimeout(timer);
    charIndex = 0;
    typeNext();
  }

  setTimeout(function () {
    el.classList.add('smiley-visible');
    reset();
    setInterval(reset, 10000);
  }, 5000);
})();
