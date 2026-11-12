"use strict";

(() => {
  const dialog = document.getElementById("creel-dialog");
  const canvas = document.getElementById("creel-canvas");
  const fallback = document.getElementById("creel-fallback");
  const status = document.getElementById("model-status");
  const slider = document.getElementById("stage");
  const controls = Object.fromEntries(["remove-piece", "add-piece", "turn-left", "turn-right", "top-model", "reset-model"]
    .map(id => [id, document.getElementById(id)]));
  const descriptions = [
    "Implantación esquemática junto al lago. El plano sitúa el hito dentro de la zona existente.",
    "La base de ladrillos fija la huella. Los árboles marcan el borde del jardín.",
    "La primera planta levanta los muros, ventanas y accesos.",
    "La segunda planta completa la silueta del cuerpo principal.",
    "Las columnas y el porche enmarcan la entrada.",
    "El reloj de los Creel corona el eje de la fachada.",
    "Los tejados, tablones y luces terminan la maqueta.",
  ];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let stage = 0;
  let yaw = 0.44;
  let pitch = 0.42;
  let renderer;
  let frame;
  let mounted = false;
  let startedAt;
  let pointer;
  let opening;

  function draw(time = performance.now()) {
    if (!renderer || !dialog.open) return;
    const duration = reducedMotion.matches ? 0 : 1400;
    const progress = stage === 0 || duration === 0 || startedAt === undefined
      ? 1 : Math.min(1, (time - startedAt) / duration);
    renderer(stage, Math.max(0, progress), yaw, pitch);
    if (progress < 1) frame = requestAnimationFrame(draw);
  }

  function selectStage(value, animate = true) {
    startedAt = animate && value > stage ? performance.now() : undefined;
    stage = value;
    creelScene.setVisible(stage === 6 && mounted);
    slider.value = String(stage);
    const names = typeof creelGeometry === "object" ? creelGeometry.stages : [];
    document.getElementById("stage-name").textContent = stage ? names[stage - 1].title : "Plano de implantación";
    document.getElementById("stage-detail").textContent = descriptions[stage];
    document.getElementById("stage-number").textContent = `${stage} / ${descriptions.length - 1}`;
    controls["remove-piece"].disabled = !mounted || stage === 0;
    controls["add-piece"].disabled = !mounted || stage === descriptions.length - 1;
    cancelAnimationFrame(frame);
    draw();
  }

  document.getElementById("open-creel").addEventListener("click", async () => {
    dialog.showModal();
    if (!opening) {
      opening = prepare().catch(error => {
        console.warn("Vista 3D no disponible", error);
        status.textContent = "Vista estática de la maqueta";
        fallback.hidden = false;
        canvas.hidden = true;
      });
    }
    await opening;
    cancelAnimationFrame(frame);
    draw();
  });
  document.getElementById("close-creel").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => cancelAnimationFrame(frame));
  slider.addEventListener("input", () => selectStage(Number(slider.value)));
  controls["remove-piece"].onclick = () => selectStage(stage - 1);
  controls["add-piece"].onclick = () => selectStage(stage + 1);
  controls["turn-left"].onclick = () => { yaw -= Math.PI / 12; selectStage(stage, false); };
  controls["turn-right"].onclick = () => { yaw += Math.PI / 12; selectStage(stage, false); };
  controls["top-model"].onclick = () => { yaw = 0; pitch = Math.PI / 2; selectStage(stage, false); };
  controls["reset-model"].onclick = () => { creelScene.reset(); yaw = .44; pitch = .42; selectStage(0, false); };
  document.getElementById("creel-reset").addEventListener("click", creelScene.reset);
  creelScene.bindCamera(actor => {
    yaw = Math.atan2(actor.x, actor.z);
    pitch = .42;
    selectStage(6, false);
  });
  canvas.addEventListener("pointerdown", event => {
    if (!mounted || pointer || event.button !== 0) return;
    pointer = event;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", event => {
    if (pointer?.pointerId !== event.pointerId) return;
    yaw += (event.clientX - pointer.clientX) * .009;
    pitch = Math.min(1.37, Math.max(.14, pitch + (event.clientY - pointer.clientY) * .007));
    pointer = event;
    selectStage(stage, false);
  });
  canvas.addEventListener("lostpointercapture", () => { pointer = undefined; });
  new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    draw();
  }).observe(canvas.parentElement);

  async function prepare() {
    const gl = canvas.getContext("webgl", {antialias:true, alpha:true});
    if (!gl) throw new Error("WebGL");
    const source = Uint8Array.from(atob(creelCompressed), character => character.charCodeAt(0));
    const stream = new Blob([source]).stream().pipeThrough(new DecompressionStream("gzip"));
    const geometry = await new Response(stream).arrayBuffer();
    if (geometry.byteLength !== creelGeometry.vertices * 20) throw new Error("Malla incompleta");
    renderer = createRenderer(gl, geometry);
    slider.disabled = false;
    for (const button of Object.values(controls)) button.disabled = false;
    mounted = true;
    fallback.hidden = true;
    status.textContent = `Maqueta 3D · ${creelGeometry.stages.reduce((n, group) => n + group.pieces.length, 0).toLocaleString("es-ES")} piezas`;
    selectStage(6, false);
  }

  function createRenderer(gl, geometry) {
    const program = gl.createProgram();
    function attach(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }
    attach(gl.VERTEX_SHADER, `
      attribute vec3 point, normal, color;
      uniform vec3 center, right, up, view;
      uniform vec2 scale;
      uniform float lift;
      varying vec3 shade, position;
      void main() {
        vec3 p = point - center + vec3(0.0, lift, 0.0);
        gl_Position = vec4(dot(p,right)*scale.x, dot(p,up)*scale.y, -dot(p,view)*0.024, 1.0);
        float light = max(dot(normal, normalize(vec3(-0.4,0.9,0.75))), 0.0);
        shade = pow(max(color, vec3(0.005)), vec3(0.56)) * (0.53 + light * 0.49);
        position = point;
      }`);
    attach(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec3 shade, position;
      uniform float plan;
      void main() {
        vec3 base = shade;
        if (plan > 0.5) {
          vec2 p = position.xz;
          vec2 edge = abs(fract(p * 0.5) - 0.5);
          float grid = step(0.478, max(edge.x, edge.y));
          float lake = 1.0 - smoothstep(0.80,1.0,length((p-vec2(10.0,2.4))/vec2(2.2,4.2)));
          base = mix(vec3(0.18,0.22,0.27),vec3(0.13,0.39,0.43),lake);
          base += grid * vec3(0.085,0.12,0.12);
          float outline = max(abs(p.x-1.0)/6.7,abs(p.y-0.5)/4.0);
          base += smoothstep(0.92,0.95,outline)*(1.0-smoothstep(0.97,1.0,outline))*vec3(.43,.23,.17);
        }
        gl_FragColor = vec4(base,1.0);
      }`);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    const uniforms = Object.fromEntries(["center", "right", "up", "view", "scale", "lift", "plan"]
      .map(name => [name, gl.getUniformLocation(program, name)]));
    const attributes = Object.fromEntries(["point", "normal", "color"].map(name => [name, gl.getAttribLocation(program, name)]));
    const meshBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);
    const groundBuffer = gl.createBuffer();
    const ground = new ArrayBuffer(6 * 20);
    const groundView = new DataView(ground);
    const {min, max, stages} = creelGeometry;
    const y = min[1] - .04;
    const boardX = creelScene.board.width / creelScene.board.unitCm / 2;
    const boardZ = creelScene.board.depth / creelScene.board.unitCm / 2;
    const corners = [[-boardX,y,-boardZ],[boardX,y,-boardZ],[boardX,y,boardZ],
      [-boardX,y,-boardZ],[boardX,y,boardZ],[-boardX,y,boardZ]];
    corners.forEach(([x, height, z], i) => {
      groundView.setFloat32(i * 20, x, true);
      groundView.setFloat32(i * 20 + 4, height, true);
      groundView.setFloat32(i * 20 + 8, z, true);
      groundView.setInt8(i * 20 + 13, 127);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, groundBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, ground, gl.STATIC_DRAW);

    const figureBuffer = gl.createBuffer();
    const figures = figureGeometry();
    gl.bindBuffer(gl.ARRAY_BUFFER, figureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, figures, gl.STATIC_DRAW);

    function bind(buffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(attributes.point, 3, gl.FLOAT, false, 20, 0);
      gl.vertexAttribPointer(attributes.normal, 3, gl.BYTE, true, 20, 12);
      gl.vertexAttribPointer(attributes.color, 3, gl.UNSIGNED_BYTE, true, 20, 16);
      for (const index of Object.values(attributes)) gl.enableVertexAttribArray(index);
    }

    return (visible, progress, azimuth, elevation) => {
      const factor = Math.min(devicePixelRatio || 1, 2);
      const width = Math.round(canvas.clientWidth * factor);
      const height = Math.round(canvas.clientHeight * factor);
      if (!width || !height) return;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const cx = Math.cos(azimuth), sx = Math.sin(azimuth);
      const cy = Math.cos(elevation), sy = Math.sin(elevation);
      const aspect = width / height;
      const center = (min[1] + max[1]) * .38;
      const halfWidth = boardX * Math.abs(cx) + boardZ * Math.abs(sx);
      const halfHeight = (boardX * Math.abs(sx) + boardZ * Math.abs(cx)) * sy + center * cy;
      const zoom = Math.min(.92 / halfHeight, .92 * aspect / halfWidth);
      gl.uniform3f(uniforms.center, 0, center, 0);
      gl.uniform3f(uniforms.right, cx, 0, -sx);
      gl.uniform3f(uniforms.up, -sx * sy, cy, -cx * sy);
      gl.uniform3f(uniforms.view, sx * cy, sy, cx * cy);
      gl.uniform2f(uniforms.scale, zoom / aspect, zoom);
      gl.uniform1f(uniforms.lift, 0);
      gl.uniform1f(uniforms.plan, 1);
      bind(groundBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.uniform1f(uniforms.plan, 0);
      bind(meshBuffer);
      for (let i = 0; i < visible; i++) {
        const group = stages[i];
        const ratio = i === visible - 1 ? progress : 1;
        const revealed = Math.ceil(group.pieces.length * ratio);
        if (revealed === 0) continue;
        gl.uniform1f(uniforms.lift, 1.7 * Math.pow(1 - ratio, 2));
        gl.drawArrays(gl.TRIANGLES, group.start, group.pieces[revealed - 1] - group.start);
      }
      if (visible === 6) {
        gl.uniform1f(uniforms.lift, 0);
        bind(figureBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, figures.byteLength / 20);
        creelScene.project({cx,sx,cy,sy,zoom,aspect,center});
      }
    };
  }

  function figureGeometry() {
    const vertices = [];
    const faces = [
      [[0,0,-1],[0,1,2,3]], [[0,0,1],[4,5,6,7]],
      [[-1,0,0],[0,3,7,4]], [[1,0,0],[1,2,6,5]],
      [[0,-1,0],[0,1,5,4]], [[0,1,0],[3,2,6,7]],
    ];
    function box(x,y,z,w,h,d,hex) {
      const color = [1,3,5].map(index => Math.round((parseInt(hex.slice(index,index+2),16)/255) ** 1.8 * 255));
      const l=x-w/2, r=x+w/2, n=z-d/2, f=z+d/2, t=y+h;
      const corners=[[l,y,n],[r,y,n],[r,t,n],[l,t,n],[l,y,f],[r,y,f],[r,t,f],[l,t,f]];
      for (const [normal, face] of faces) {
        for (const index of [0,1,2,0,2,3]) vertices.push([corners[face[index]],normal,color]);
      }
    }
    for (const {x,y,z,coat,hair,id} of creelScene.cast) {
      const skin=id === 11 ? "#a4736d" : id === 2 ? "#a56d4a" : "#edb880";
      for (const side of [-1,1]) {
        box(x+side*.15,y,z,.25,.49,.34,"#36364c");
        box(x+side*.34,y+.57,z,.18,.44,.24,coat);
        box(x+side*.34,y+.49,z,.18,.13,.21,skin);
      }
      box(x,y+.48,z,.52,.56,.32,coat);
      box(x,y+1.04,z,.39,.36,.35,skin);
      box(x,y+1.34,z-.035,.44,.14,.42,hair);
      for (const side of [-1,1]) box(x+side*.095,y+1.22,z+.179,.052,.055,.018,"#25202c");
    }
    const data = new ArrayBuffer(vertices.length * 20);
    const view = new DataView(data);
    vertices.forEach(([point,normal,color],i) => {
      const start=i*20;
      point.forEach((n,k) => view.setFloat32(start+4*k,n,true));
      normal.forEach((n,k) => view.setInt8(start+12+k,n*127));
      color.forEach((n,k) => view.setUint8(start+16+k,n));
    });
    return data;
  }
})();
