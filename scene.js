// Native WebGL sculpture: beveled sheets that fan open, hold, and restack.
const canvas = document.querySelector('#scene');
const container = document.querySelector('.sculpture');
const toggle = document.querySelector('.motion-toggle');

function createScene() {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!gl) return;
  const vertex = `
    attribute vec3 position;
    attribute vec3 normal;
    uniform mat4 model;
    uniform mat4 projection;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec4 world = model * vec4(position, 1.0);
      vNormal = mat3(model) * normal;
      vPosition = world.xyz;
      gl_Position = projection * vec4(world.xyz + vec3(0.0, 0.0, -7.4), 1.0);
    }
  `;
  const fragment = `
    precision mediump float;
    uniform vec3 color;
    uniform float metal;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec3 n = normalize(vNormal);
      vec3 view = normalize(vec3(0.0, 0.0, 7.4) - vPosition);
      vec3 key = normalize(vec3(-3.0, 5.0, 5.0));
      vec3 fill = normalize(vec3(4.0, 1.0, 2.0));
      float diffuse = max(dot(n, key), 0.0);
      float secondary = max(dot(n, fill), 0.0);
      vec3 reflected = reflect(-view, n);
      float studio = smoothstep(0.1, 0.85, dot(reflected, normalize(vec3(-0.5, 1.0, 0.6))));
      float stripe = pow(max(dot(n, normalize(key + view)), 0.0), 28.0);
      float edge = pow(1.0 - max(dot(n, view), 0.0), 3.0);
      vec3 base = color * (0.42 + diffuse * 0.46 + secondary * 0.16);
      base = mix(base, color * (0.55 + studio * 0.5), metal * 0.45);
      base += vec3(1.0, 0.94, 0.99) * stripe * (0.13 + metal * 0.24);
      base += vec3(0.85, 0.80, 1.0) * edge * 0.13;
      gl_FragColor = vec4(pow(base, vec3(0.94)), 1.0);
    }
  `;
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Shader unavailable');
    return s;
  }
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('WebGL unavailable');
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  const uniforms = Object.fromEntries(['model', 'projection', 'color', 'metal'].map(name => [name, gl.getUniformLocation(program, name)]));
  const positions = gl.getAttribLocation(program, 'position');
  const normals = gl.getAttribLocation(program, 'normal');
  gl.enableVertexAttribArray(positions);
  gl.enableVertexAttribArray(normals);

  function mesh(rows, columns, point) {
    const vertices = [], indices = [];
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= columns; col++) vertices.push(...point(row / rows, col / columns));
    }
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const a = row * (columns + 1) + col, b = a + columns + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const index = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return { buffer, index, count: indices.length };
  }
  const halfSize = [1.0, 1.22, .075];
  const bevel = .045;
  const faces = [
    { axis: 2, sign: 1, u: [1,0,0], v: [0,1,0] },
    { axis: 2, sign: -1, u: [-1,0,0], v: [0,1,0] },
    { axis: 0, sign: 1, u: [0,0,-1], v: [0,1,0] },
    { axis: 0, sign: -1, u: [0,0,1], v: [0,1,0] },
    { axis: 1, sign: 1, u: [1,0,0], v: [0,0,-1] },
    { axis: 1, sign: -1, u: [1,0,0], v: [0,0,1] },
  ].map(face => mesh(24, 24, (u, v) => {
    const p = halfSize.map((extent, i) => i === face.axis ? extent * face.sign : extent * (face.u[i] * (u * 2 - 1) + face.v[i] * (v * 2 - 1)));
    const inner = p.map((value, i) => Math.max(-halfSize[i] + bevel, Math.min(halfSize[i] - bevel, value)));
    const delta = p.map((value, i) => value - inner[i]);
    const length = Math.hypot(...delta);
    const normal = delta.map(value => value / length);
    return [...inner.map((value, i) => value + normal[i] * bevel), ...normal];
  }));
  // Column-major rigid transforms preserve surface normals.
  function multiply(a, b) {
    const out = new Array(16).fill(0);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
    return out;
  }
  function rotation(x, y, z) {
    const sx = Math.sin(x), cx = Math.cos(x), sy = Math.sin(y), cy = Math.cos(y), sz = Math.sin(z), cz = Math.cos(z);
    return multiply(multiply([1,0,0,0, 0,cx,sx,0, 0,-sx,cx,0, 0,0,0,1], [cy,0,-sy,0, 0,1,0,0, sy,0,cy,0, 0,0,0,1]), [cz,sz,0,0, -sz,cz,0,0, 0,0,1,0, 0,0,0,1]);
  }
  function draw(object, matrix, color, metal) {
    gl.bindBuffer(gl.ARRAY_BUFFER, object.buffer);
    gl.vertexAttribPointer(positions, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(normals, 3, gl.FLOAT, false, 24, 12);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.index);
    gl.uniformMatrix4fv(uniforms.model, false, matrix);
    gl.uniform3fv(uniforms.color, color);
    gl.uniform1f(uniforms.metal, metal);
    gl.drawElements(gl.TRIANGLES, object.count, gl.UNSIGNED_SHORT, 0);
  }
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motionPreference.matches;
  let visible = true, frame = 0, previous = 0, time = 0, lost = false;
  const pointer = { x: 0, y: 0, currentX: 0, currentY: 0 };

  function render() {
    const size = Math.max(1, Math.round(container.clientWidth * Math.min(devicePixelRatio || 1, 1.5)));
    if (canvas.width !== size || canvas.height !== size) { canvas.width = size; canvas.height = size; }
    gl.viewport(0, 0, size, size);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const f = 1 / Math.tan(38 * Math.PI / 360), near = .1, far = 40;
    gl.uniformMatrix4fv(uniforms.projection, false, [f,0,0,0, 0,f,0,0, 0,0,(far+near)/(near-far),-1, 0,0,2*far*near/(near-far),0]);
    const cycle = (time % 8) / 8;
    const ease = value => value * value * (3 - 2 * value);
    const spread = cycle < .16 ? 0 : cycle < .42 ? ease((cycle - .16) / .26) : cycle < .63 ? 1 : cycle < .92 ? 1 - ease((cycle - .63) / .29) : 0;
    const group = rotation(-.18 + pointer.currentY, -.38 + pointer.currentX + Math.sin(time * .3) * .06, -.12);
    group[13] = .12 + Math.sin(time * .45) * .045;
    const layers = [
      { x: .40 + spread * .35, y: .20 + spread * .10, z: -.48, angle: -.17 - spread * .14, color: [.97, .76, .60] },
      { x: .02, y: .03, z: 0, angle: .04, color: [.96, .94, .91] },
      { x: -.38 - spread * .35, y: -.18 - spread * .10, z: .48 + spread * .06, angle: .19 + spread * .14, color: [.75, .66, .89] },
    ];
    for (const layer of layers) {
      const local = rotation(0, 0, layer.angle);
      local[12] = layer.x; local[13] = layer.y; local[14] = layer.z;
      const model = multiply(group, local);
      for (const face of faces) draw(face, model, layer.color, .05);
    }
  }
  function animate(stamp) {
    frame = 0;
    if (paused || !visible || document.hidden || lost) return;
    if (previous) time += Math.min((stamp - previous) / 1000, .05);
    previous = stamp;
    pointer.currentX += (pointer.x - pointer.currentX) * .035;
    pointer.currentY += (pointer.y - pointer.currentY) * .035;
    render();
    frame = requestAnimationFrame(animate);
  }
  function start() {
    previous = 0;
    if (!frame && !paused && visible && !document.hidden && !lost) frame = requestAnimationFrame(animate);
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; previous = 0; }
  function updateToggle() {
    const label = paused ? 'Play animation' : 'Pause animation';
    toggle.setAttribute('aria-label', label);
    toggle.querySelector('span').textContent = label;
    toggle.querySelector('path').setAttribute('d', paused ? 'M5 3l7 5-7 5Z' : 'M5 3v10M11 3v10');
  }
  toggle.addEventListener('click', () => { paused = !paused; updateToggle(); paused ? stop() : start(); });
  container.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || paused) return;
    const rect = container.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width - .5) * .2;
    pointer.y = ((event.clientY - rect.top) / rect.height - .5) * .12;
  });
  container.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  motionPreference.addEventListener('change', event => { paused = event.matches; updateToggle(); paused ? stop() : start(); });
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; visible ? start() : stop(); });
  observer.observe(container);
  const resize = new ResizeObserver(() => { if (!lost) render(); });
  resize.observe(container);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; stop();
    container.classList.remove('webgl-ready'); toggle.hidden = true;
  });
  // Keep the CSS fallback if the GPU context cannot be used.
  render();
  container.classList.add('webgl-ready');
  toggle.hidden = false;
  updateToggle();
  start();
}

try { createScene(); } catch {
  container.classList.remove('webgl-ready');
  toggle.hidden = true;
}
