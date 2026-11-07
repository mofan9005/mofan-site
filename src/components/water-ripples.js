// Plain WebGL 1: a small ping-pong height field, then one water-image pass.
// RG/BA each pack a signed 16-bit height; no float texture extensions required.
const vertex = `attribute vec2 a_position;
varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
const simulation = `precision highp float;
varying vec2 v_uv;
uniform sampler2D u_state;
uniform vec2 u_texel;
uniform float u_aspect;
uniform vec4 u_drops[8];
float unpackHeight(vec2 v){return (dot(v,vec2(65280.,255.))-32768.)/32768.;}
vec2 packHeight(float h){float n=floor(clamp(h*32768.+32768.,0.,65535.)+.5);return vec2(floor(n/256.),mod(n,256.))/255.;}
float heightAt(vec2 p){return unpackHeight(texture2D(u_state,p).rg);}
void main(){
 vec4 state=texture2D(u_state,v_uv);
 float h=unpackHeight(state.rg),previous=unpackHeight(state.ba);
 float lap=heightAt(v_uv+vec2(u_texel.x,0.))+heightAt(v_uv-vec2(u_texel.x,0.))
          +heightAt(v_uv+vec2(0.,u_texel.y))+heightAt(v_uv-vec2(0.,u_texel.y))-4.*h;
 float next=(h+(h-previous)*.976+lap*.46)*.995;
 for(int i=0;i<8;i++){
  float d=length((v_uv-u_drops[i].xy)*vec2(u_aspect,1.))/max(u_drops[i].z,.0001);
  next+=(cos(min(d,1.)*3.14159265)+1.)*.5*u_drops[i].w;
 }
 vec2 edge=min(v_uv,1.-v_uv)/u_texel;
 next*=smoothstep(0.,5.,min(edge.x,edge.y));
 gl_FragColor=vec4(packHeight(next),packHeight(h));
}`;
const surface = `precision highp float;
varying vec2 v_uv;
uniform sampler2D u_image;
uniform sampler2D u_state;
uniform sampler2D u_grade;
uniform vec2 u_texel;
uniform vec2 u_cover;
uniform float u_time;
uniform float u_aspect;
float heightSample(vec2 p){return (dot(texture2D(u_state,p).rg,vec2(65280.,255.))-32768.)/32768.;}
float heightAt(vec2 p){
 vec2 cell=p/u_texel-.5,weight=fract(cell),base=(floor(cell)+.5)*u_texel;
 return mix(mix(heightSample(base),heightSample(base+vec2(u_texel.x,0.)),weight.x),
            mix(heightSample(base+vec2(0.,u_texel.y)),heightSample(base+u_texel),weight.x),weight.y);
}
void main(){
 vec2 p=vec2(v_uv.x,1.-v_uv.y);
 float phase=u_time*.78539816; // Eight-second breathing cycle.
 vec2 drift=vec2(sin(p.y*18.+phase)+sin(p.y*31.-phase),cos(p.x*19.+phase)+sin(p.x*27.-phase))*.00065;
 vec2 normal=vec2(heightAt(p+vec2(u_texel.x,0.))-heightAt(p-vec2(u_texel.x,0.)),
                  heightAt(p+vec2(0.,u_texel.y))-heightAt(p-vec2(0.,u_texel.y)));
 vec2 bend=normal*vec2(1./u_aspect,1.)*.07;
 vec2 uv=(p+drift+bend-.5)*u_cover+.5;
 vec3 original=texture2D(u_image,clamp(uv,0.,1.)).rgb;
 float luma=dot(original,vec3(.2126,.7152,.0722));
 vec3 color=texture2D(u_grade,vec2((luma*255.+.5)/256.,.5)).rgb;
 vec2 light=p*vec2(u_aspect,1.)+drift*2.;
 float caustic=pow(max(0.,sin(light.x*32.+sin(light.y*23.+phase)+phase)*cos(light.y*29.-phase)),14.);
 float crest=clamp(dot(normal,vec2(-.8,-.6))*.45,-.035,.065);
 color+=vec3(.68,.90,1.)*(caustic*.014+crest);
 gl_FragColor=vec4(color,1.);
}`;

export function createWaterGrade(element) {
 const styles = getComputedStyle(element);
 const names = ['shadow', 'deep', 'blue', 'tile', 'mid', 'light', 'highlight', 'glint'];
 const colors = [[0, 0, 0], ...names.map(name => {
  const hex = styles.getPropertyValue(`--water-${name}`).trim().replace('#', '');
  return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
 }), [255, 255, 255]];
 const values = styles.getPropertyValue('--water-grade-stops').trim().split(/\s+/).map(Number);
 const stops = colors.map((rgb, i) => ({rgb, value: values[i]}));
 const pixels = new Uint8Array(256 * 4), tables = [[], [], []];
 for (let i = 0; i < 256; i++) {
  const right = stops.findIndex(stop => stop.value >= i);
  const a = stops[Math.max(0, right - 1)], b = stops[right < 0 ? stops.length - 1 : right];
  const mix = (i - a.value) / (b.value - a.value || 1);
  for (let c = 0; c < 3; c++) {
   const value = Math.round(a.rgb[c] + (b.rgb[c] - a.rgb[c]) * mix);
   pixels[i * 4 + c] = value;
   tables[c].push((value / 255).toFixed(5));
  }
  pixels[i * 4 + 3] = 255;
 }
 return {pixels, tables: tables.map(table => table.join(' '))};
}

export function startWaterRipples({canvas, source, grade, stretch = false}) {
 const scene = canvas.parentElement.parentElement;
 let gl;
 try {gl = canvas.getContext('webgl', {alpha: false, antialias: false, powerPreference: 'low-power'});} catch {return () => {};}
 if (!gl) return () => {};
 gl.disable(gl.DITHER); // Dithering would corrupt the packed simulation heights.
 const resources = [];
 let disposed = false, lost = false, ready = false, visible = false, frame = 0;
 let elapsed = 0, last = 0, accumulator = 0, frameCount = 0, fpsStart = 0, ticks = 0;
 let targets = [], current = 0, width = 1, height = 1, gridWidth = 1, gridHeight = 1;
 let imageAspect = 1, pending = [], ripples = [], lastPointer = null;
 let toys = [], measureToys = true;
 const compact = matchMedia('(max-width:700px), (pointer:coarse)').matches;
 const fps = compact ? 30 : 45;
 function state(value) {canvas.dataset.renderState = value; scene.dataset.waterState = value;}
 function keep(kind, resource) {
  if (!resource) throw Error(`Water ${kind} allocation failed`);
  resources.push([kind, resource]); return resource;
 }
 function program(fragment) {
  const shaders = [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]].map(([type, code]) => {
   const shader = keep('Shader', gl.createShader(type));
   gl.shaderSource(shader, code); gl.compileShader(shader);
   if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
   return shader;
  });
  const result = keep('Program', gl.createProgram());
  shaders.forEach(shader => gl.attachShader(result, shader)); gl.linkProgram(result);
  if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(result));
  return result;
 }
 function texture(filter) {
  const texture = keep('Texture', gl.createTexture());
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
 }
 function release(kind, item) {
  gl[`delete${kind}`](item);
  const index = resources.findIndex(entry => entry[1] === item);
  if (index >= 0) resources.splice(index, 1);
 }
 function releaseAll() {resources.splice(0).reverse().forEach(([kind, item]) => gl[`delete${kind}`](item));}
 let sim, draw, buffer, image, palette, locations;
 try {
  sim = program(simulation); draw = program(surface);
  buffer = keep('Buffer', gl.createBuffer());
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  image = texture(gl.LINEAR); palette = texture(gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, grade);
  locations = new Map([sim, draw].map(p => [p, Object.fromEntries(
   ['state', 'image', 'grade', 'texel', 'aspect', 'cover', 'time', 'drops[0]'].map(name => [name, gl.getUniformLocation(p, `u_${name}`)])
  )]));
 } catch {releaseAll(); return () => {};}
 function use(p) {
  gl.useProgram(p); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const position = gl.getAttribLocation(p, 'a_position');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  return locations.get(p);
 }
 function bind(texture, unit) {gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, texture);}
 function resize() {
  if (disposed || lost) return;
  width = Math.max(1, canvas.clientWidth); height = Math.max(1, canvas.clientHeight);
  const dpr = Math.min(devicePixelRatio || 1, compact ? 1 : 1.25);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  // Square cells keep the rings circular in portrait and landscape.
  const gridScale = Math.min(1 / 4, (compact ? 224 : 320) / Math.max(width, height));
  gridWidth = Math.max(2, Math.round(width * gridScale)); gridHeight = Math.max(2, Math.round(height * gridScale));
  targets.forEach(target => {release('Texture', target.texture); release('Framebuffer', target.framebuffer);}); targets = [];
  const neutral = new Uint8Array(gridWidth * gridHeight * 4);
  for (let i = 0; i < neutral.length; i += 4) {neutral[i] = 128; neutral[i + 2] = 128;}
  try {
   for (let i = 0; i < 2; i++) {
    const target = {texture: texture(gl.NEAREST), framebuffer: keep('Framebuffer', gl.createFramebuffer())}; targets.push(target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gridWidth, gridHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, neutral);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw Error('Water framebuffer unavailable');
   }
  } catch {ready = false; canvas.style.opacity = '0'; state('static');}
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  current = 0; pending = []; ripples = []; lastPointer = null; measureToys = true;
  canvas.dataset.simulationSize = `${gridWidth}x${gridHeight}`;
 }
 function addRipple(event, tap) {
  if (!ready || document.hidden || !visible || scene.classList.contains('is-open') || scene.classList.contains('has-library')) return;
  if (event.pointerType === 'touch' && !tap && event.buttons === 0) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
  if (x < 0 || y < 0 || x > 1 || y > 1) return;
  const now = performance.now();
  if (!tap && lastPointer && (now - lastPointer.time < 65 || Math.hypot((x - lastPointer.x) * width, (y - lastPointer.y) * height) < 9)) return;
  lastPointer = {x, y, time: now};
  if (tap) {
   // A click follows a pointermove; merge that initial dimple into one tap.
   const keep = ripple => elapsed - ripple.born > .12 || Math.hypot((x - ripple.x) * width, (y - ripple.y) * height) > 22;
   pending = pending.filter(keep); ripples = ripples.filter(keep);
  }
  const impulse = {x, y, radius: (tap ? 19 : 10) / height, strength: tap ? .62 : .24, born: elapsed};
  pending.push(impulse); pending = pending.slice(-8); ripples.push(impulse); ripples = ripples.slice(-32);
  canvas.dataset.interactionCount = String(Number(canvas.dataset.interactionCount || 0) + 1);
 }
 const move = event => addRipple(event, false);
 const down = event => {if (event.button === 0) addRipple(event, true);};
 const leave = () => {lastPointer = null;};
 function simulate() {
  const uniform = use(sim); bind(targets[current].texture, 0);
  gl.uniform1i(uniform.state, 0); gl.uniform2f(uniform.texel, 1 / gridWidth, 1 / gridHeight); gl.uniform1f(uniform.aspect, width / height);
  const drops = new Float32Array(32);
  pending.splice(0, 8).forEach((drop, i) => drops.set([drop.x, drop.y, drop.radius, drop.strength], i * 4));
  gl.uniform4fv(uniform['drops[0]'], drops);
  gl.bindFramebuffer(gl.FRAMEBUFFER, targets[1 - current].framebuffer); gl.viewport(0, 0, gridWidth, gridHeight);
  gl.drawArrays(gl.TRIANGLES, 0, 6); current = 1 - current;
 }
 function renderWater() {
  const uniform = use(draw); bind(image, 0); bind(targets[current].texture, 1); bind(palette, 2);
  gl.uniform1i(uniform.image, 0); gl.uniform1i(uniform.state, 1); gl.uniform1i(uniform.grade, 2);
  gl.uniform2f(uniform.texel, 1 / gridWidth, 1 / gridHeight); gl.uniform1f(uniform.time, elapsed); gl.uniform1f(uniform.aspect, width / height);
  const aspect = width / height;
  gl.uniform2f(uniform.cover, stretch ? 1 : Math.min(1, aspect / imageAspect), stretch ? 1 : Math.min(1, imageAspect / aspect));
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); gl.drawArrays(gl.TRIANGLES, 0, 6);
 }
 function floatToys() {
  if (measureToys) {
   const rect = canvas.getBoundingClientRect();
   toys = [...scene.querySelectorAll('.object-image')].map(element => {
    const toy = element.getBoundingClientRect();
    return {element, x: toy.left + toy.width / 2 - rect.left, y: toy.top + toy.height / 2 - rect.top};
   }); measureToys = false;
  }
  ripples = ripples.filter(ripple => elapsed - ripple.born < 1.8);
  const speed = Math.sqrt(.46) * 60 * height / gridHeight;
  toys.forEach(({element, x, y}, index) => {
   let lift = 0, tilt = 0;
   for (const ripple of ripples) {
    const age = elapsed - ripple.born, dx = x - ripple.x * width, dy = y - ripple.y * height;
    const distance = Math.hypot(dx, dy), front = distance - speed * age;
    const wave = Math.exp(-Math.pow(front / 30, 2)) * Math.cos(front / 13) * (1 - age / 1.8) * ripple.strength * 5;
    lift += wave; tilt += wave * dx / (distance || 1) * .26;
   }
   const phase = elapsed * Math.PI / 4 + index * 1.7;
   const vertical = Math.max(-3, Math.min(3, Math.sin(phase) * .85 + lift));
   element.style.translate = `${(Math.cos(phase) * .6).toFixed(2)}px ${vertical.toFixed(2)}px`;
   element.style.rotate = `${(Math.sin(phase) * .3 + Math.max(-.65, Math.min(.65, tilt))).toFixed(3)}deg`;
  });
  canvas.dataset.activeRipples = String(ripples.length);
 }
 function render(now) {
  if (disposed || !ready || lost) return;
  frame = requestAnimationFrame(render);
  if (now - last < 1000 / fps - 1) return;
  const dt = Math.min((now - last) / 1000, .0667); last = now; elapsed += dt; accumulator += dt;
  while (accumulator >= 1 / 60) {simulate(); accumulator -= 1 / 60;}
  renderWater(); floatToys(); canvas.style.opacity = '1'; canvas.dataset.frame = String(++ticks); frameCount++;
  if (now - fpsStart >= 1000) {canvas.dataset.fps = String(Math.round(frameCount * 1000 / (now - fpsStart))); fpsStart = now; frameCount = 0;}
 }
 function resume() {
  cancelAnimationFrame(frame);
  const obscured = scene.classList.contains('is-open') || scene.classList.contains('has-library');
  const running = !disposed && !lost && ready && visible && !document.hidden && !obscured;
  state(running ? 'running' : ready ? 'paused' : 'static');
  if (running) {
   last = performance.now(); fpsStart = last; frameCount = 0; accumulator = 0; measureToys = true; frame = requestAnimationFrame(render);
  } else {pending = []; lastPointer = null;}
 }
 const resizeObserver = new ResizeObserver(() => {resize(); resume();});
 const intersection = new IntersectionObserver(entries => {visible = entries[0].isIntersecting; resume();});
 const sceneObserver = new MutationObserver(resume);
 const onLost = event => {event.preventDefault(); lost = true; ready = false; canvas.style.opacity = '0'; resume();};
 const onScroll = () => {measureToys = true;};
 resizeObserver.observe(canvas); intersection.observe(canvas); sceneObserver.observe(scene, {attributes: true, attributeFilter: ['class']});
 canvas.addEventListener('webglcontextlost', onLost); document.addEventListener('visibilitychange', resume); window.addEventListener('scroll', onScroll, {passive: true});
 scene.addEventListener('pointermove', move, {passive: true}); scene.addEventListener('pointerdown', down, {passive: true});
 scene.addEventListener('pointerleave', leave, {passive: true}); scene.addEventListener('pointercancel', leave, {passive: true});
 const img = new Image();
 img.onload = () => {
  if (disposed || lost) return;
  try {
   bind(image, 0); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
   imageAspect = img.naturalWidth / img.naturalHeight; ready = true; resize(); resume();
  } catch {ready = false; canvas.style.opacity = '0'; resume();}
 };
 img.src = source;
 return () => {
  disposed = true; img.onload = null; cancelAnimationFrame(frame);
  resizeObserver.disconnect(); intersection.disconnect(); sceneObserver.disconnect();
  canvas.removeEventListener('webglcontextlost', onLost); document.removeEventListener('visibilitychange', resume); window.removeEventListener('scroll', onScroll);
  scene.removeEventListener('pointermove', move); scene.removeEventListener('pointerdown', down); scene.removeEventListener('pointerleave', leave); scene.removeEventListener('pointercancel', leave);
  toys.forEach(({element}) => {element.style.removeProperty('translate'); element.style.removeProperty('rotate');});
  releaseAll(); canvas.style.opacity = '0'; state('static');
 };
}
