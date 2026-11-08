// Original interactive Diwali experience for Harshi.
// The background music is synthesized in-browser (no copyrighted audio file).
const screens = [...document.querySelectorAll('.screen')];
const toast = document.getElementById('toast');
let currentScreen = 'welcome';
function showScreen(id) {
  screens.forEach(s => s.classList.toggle('active', s.id === id));
  currentScreen = id;
  window.scrollTo({top:0, behavior:'smooth'});
  if (id === 'finale') launchFinale();
}
function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}
document.getElementById('beginBtn').addEventListener('click', () => showScreen('journey'));
document.querySelectorAll('[data-next]').forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.next)));
document.getElementById('replayBtn').addEventListener('click', () => {
  document.getElementById('openLetter').classList.remove('opened');
  document.getElementById('letterMessage').classList.remove('show');
  document.querySelector('.fireworks-btn').style.display = '';
  showScreen('welcome');
});

const envelope = document.getElementById('openLetter');
envelope.addEventListener('click', () => {
  if (!envelope.classList.contains('opened')) {
    envelope.classList.add('opened');
    setTimeout(() => {
      document.getElementById('letterMessage').classList.add('show');
      document.querySelector('.fireworks-btn').scrollIntoView({behavior:'smooth',block:'nearest'});
    }, 550);
    notify('A little letter, written just for you 💗');
  } else {
    document.getElementById('letterMessage').classList.toggle('show');
  }
});

// Soft, original chime melody generated with Web Audio after a user gesture.
let audioCtx = null, musicTimer = null, musicOn = false, noteIndex = 0;
const melody = [523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,783.99,1046.5];
function playNote(freq, start) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const shimmer = audioCtx.createOscillator();
  const shimmerGain = audioCtx.createGain();
  osc.type = 'sine'; osc.frequency.value = freq;
  shimmer.type = 'sine'; shimmer.frequency.value = freq * 2.01;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.045, start + .04);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.05);
  shimmerGain.gain.setValueAtTime(0.0001, start);
  shimmerGain.gain.exponentialRampToValueAtTime(0.009, start + .05);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, start + .7);
  osc.connect(gain).connect(audioCtx.destination);
  shimmer.connect(shimmerGain).connect(audioCtx.destination);
  osc.start(start); shimmer.start(start);
  osc.stop(start + 1.1); shimmer.stop(start + .75);
}
function startMusic() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) { notify('Audio is not supported in this browser.'); return; }
  audioCtx = audioCtx || new AudioContext();
  audioCtx.resume();
  musicOn = true;
  document.getElementById('soundIcon').textContent = '♫';
  document.getElementById('soundLabel').textContent = 'Sound on';
  document.getElementById('soundToggle').setAttribute('aria-pressed','true');
  if (musicTimer) clearInterval(musicTimer);
  const schedule = () => {
    if (!musicOn) return;
    const now = audioCtx.currentTime;
    playNote(melody[noteIndex % melody.length], now);
    if (noteIndex % 4 === 0) playNote(melody[(noteIndex + 2) % melody.length] / 2, now + .18);
    noteIndex++;
  };
  schedule();
  musicTimer = setInterval(schedule, 680);
}
function stopMusic() {
  musicOn = false;
  if (musicTimer) clearInterval(musicTimer);
  document.getElementById('soundIcon').textContent = '♫';
  document.getElementById('soundLabel').textContent = 'Sound off';
  document.getElementById('soundToggle').setAttribute('aria-pressed','false');
}
document.getElementById('soundToggle').addEventListener('click', () => musicOn ? stopMusic() : startMusic());

// Three.js starfield and 3D firework bursts, with a canvas fallback if WebGL is unavailable.
const canvas = document.getElementById('scene');
let renderer, scene, camera, stars, particles = [], fireworks = [], clock;
let threeReady = false;
function setupThree() {
  if (!window.THREE) return;
  try {
    renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setSize(window.innerWidth, window.innerHeight);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, .1, 1000);
    camera.position.z = 38;
    clock = new THREE.Clock();
    const starGeo = new THREE.BufferGeometry();
    const positions = [];
    for (let i=0;i<700;i++) positions.push((Math.random()-.5)*100,(Math.random()-.5)*65,(Math.random()-.5)*65);
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
    stars = new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xffd8ef,size:.12,transparent:true,opacity:.8}));
    scene.add(stars);
    threeReady = true;
    animateThree();
  } catch(e) { console.warn('3D background unavailable; using CSS ambience.',e); }
}
function createBurst(x,y,z, power=1) {
  if (!threeReady) return;
  const count = Math.floor(70*power);
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count*3);
  const velocity = [];
  for(let i=0;i<count;i++){
    pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z;
    const a=Math.random()*Math.PI*2, u=Math.random()*2-1, speed=(.045+Math.random()*.13)*power;
    const r=Math.sqrt(1-u*u);
    velocity.push([Math.cos(a)*r*speed,u*speed,Math.sin(a)*r*speed]);
  }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const colors=[0xffa8d4,0xffe2a8,0xc8b5ff,0xffffff,0xffc2ed];
  const mat=new THREE.PointsMaterial({color:colors[Math.floor(Math.random()*colors.length)],size:.18,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false});
  const points=new THREE.Points(geo,mat);scene.add(points);
  fireworks.push({points,velocity,life:1});
}
function animateThree() {
  requestAnimationFrame(animateThree);
  const dt=Math.min(clock.getDelta(),.04);
  if(stars) stars.rotation.y += dt*.012;
  particles.forEach(p=>{});
  fireworks=fireworks.filter(f=>{
    const a=f.points.geometry.attributes.position;
    for(let i=0;i<f.velocity.length;i++){
      a.array[i*3]+=f.velocity[i][0];
      a.array[i*3+1]+=f.velocity[i][1]-.0012;
      a.array[i*3+2]+=f.velocity[i][2];
      f.velocity[i][0]*=.992;f.velocity[i][1]*=.992;f.velocity[i][2]*=.992;
    }
    a.needsUpdate=true;f.life-=dt*.42;f.points.material.opacity=Math.max(0,f.life);
    if(f.life<=0){scene.remove(f.points);f.points.geometry.dispose();f.points.material.dispose();return false}
    return true;
  });
  renderer.render(scene,camera);
}
function resizeThree() {
  if(!threeReady)return;
  camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
}
window.addEventListener('resize',resizeThree);
function launchFinale() {
  if(!threeReady)return;
  let n=0;
  const interval=setInterval(()=>{
    if(currentScreen!=='finale'||n>11){clearInterval(interval);return}
    const x=(Math.random()-.5)*29,y=(Math.random()-.5)*15+4,z=(Math.random()-.5)*8;
    createBurst(x,y,z,Math.random()*.8+.7);n++;
  },430);
}
setupThree();

// A few gentle bursts also appear in the background during the experience.
setInterval(()=>{
  if(threeReady && currentScreen!=='finale' && Math.random()>.35)
    createBurst((Math.random()-.5)*34,(Math.random()-.5)*18+8,-8,Math.random()*.45+.3);
},2600);
