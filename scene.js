// A small, dependency-free WebGL sculpture. No network requests or external assets.
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
      float studio = smoothstep(0.48, 0.72, dot(reflected, normalize(vec3(-0.5, 1.0, 0.6))));
      float stripe = pow(max(dot(n, normalize(key + view)), 0.0), 65.0);
      float edge = pow(1.0 - max(dot(n, view), 0.0), 3.0);
      vec3 base = color * (0.24 + diffuse * 0.65 + secondary * 0.2);
      base = mix(base, color * (0.26 + studio * 0.9), metal * 0.65);
      base += vec3(1.0, 0.94, 0.83) * stripe * (0.48 + metal * 0.45);
      base += vec3(0.77, 0.8, 0.73) * edge * (0.08 + metal * 0.24);
      gl_FragColor = vec4(pow(base, vec3(0.88)), 1.0);
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
  const tau = Math.PI * 2;
  const ring = mesh(96, 20, (u, v) => {
    const a = u * tau, b = v * tau;
    const r = 1.58 + 0.135 * Math.cos(b);
    return [r * Math.cos(a), r * Math.sin(a), 0.135 * Math.sin(b), Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)];
  });
  const core = mesh(40, 56, (u, v) => {
    const a = u * Math.PI, b = -v * tau;
    const x = Math.sin(a) * Math.cos(b), y = Math.cos(a), z = Math.sin(a) * Math.sin(b);
    return [x * .76, y * .76, z * .76, x, y, z];
  });
  // Column-major rotation matrices; only rigid transforms are used for normals.
  const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
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
    const group = rotation(.2 + pointer.currentY, time * .16 + pointer.currentX, -.25);
    group[13] = .10 + Math.sin(time * .65) * .10;
    draw(core, group, [.91, .31, .13], .16);
    draw(ring, multiply(group, rotation(1.08, .35, time * .11)), [.69, .72, .64], .95);
    draw(ring, multiply(group, rotation(-.6, 1.08, -.25 - time * .09)), [.72, .28, .13], .8);
    draw(ring, multiply(group, rotation(.2, -.55, 1.15 + time * .07)), [.24, .30, .25], .88);
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
    pointer.x = ((event.clientX - rect.left) / rect.width - .5) * .5;
    pointer.y = ((event.clientY - rect.top) / rect.height - .5) * .3;
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
