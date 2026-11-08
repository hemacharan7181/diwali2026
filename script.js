// Efficient 2D sky-shot fireworks: capped pixel ratio, pooled frame loop and bounded particles.
const canvas=document.getElementById('sky'),ctx=canvas.getContext('2d',{alpha:true});
let W=innerWidth,H=innerHeight,DPR=1,rockets=[],particles=[],last=0,mode='idle',frame=0;
const palette=['#ffb9df','#ffe5aa','#d3c3ff','#fff6fc','#ff83c6','#ffd0ed'];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,1.35);canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener('resize',resize);resize();
function launch(x=Math.random()*W,y=H+12,scale=1){
 const target=H*(.13+Math.random()*.34);
 rockets.push({x,y,px:x,py:y,vx:(Math.random()-.5)*.65,vy:-(7.2+Math.random()*2.3)*scale,target,color:palette[(Math.random()*palette.length)|0],tail:[]});
}
function explode(x,y,color,scale=1){
 const n=Math.round((mode==='idle'?52:88)*scale);
 for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=(1.05+Math.random()*3.7)*scale;
 particles.push({x,y,px:x,py:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:45+Math.random()*35,max:80,r:.7+Math.random()*1.6,c:color,drag:.982,gravity:.045})}
 // Bright crackling stars, limited count to preserve smoothness.
 for(let i=0;i<Math.round(12*scale);i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*2.1;particles.push({x,y,px:x,py:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:38+Math.random()*25,max:65,r:.7,c:'#fff4d5',drag:.98,gravity:.035})}
 if(particles.length>1250)particles.splice(0,particles.length-1250);
}
function drawRocket(r){
 r.tail.push([r.x,r.y]);if(r.tail.length>7)r.tail.shift();
 ctx.beginPath();for(let i=0;i<r.tail.length;i++){const p=r.tail[i];if(i===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1])}
 ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.shadowBlur=12;ctx.shadowColor=r.color;ctx.stroke();ctx.shadowBlur=0;
 ctx.beginPath();ctx.arc(r.x,r.y,2.1,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
}
function tick(t){
 requestAnimationFrame(tick);const dt=Math.min((t-last||16.7)/16.7,1.6);last=t;frame++;
 // Light idle ambience; frequent volleys only after opening. Finale is a celebratory barrage.
 const interval=mode==='final'?210:mode==='active'?530:2400;
 if(!reduced && t-(tick.launchAt||0)>interval){launch(W*(.07+Math.random()*.86),H+10,mode==='idle'?.75:1.12);tick.launchAt=t;
  if(mode==='final'&&Math.random()>.38)setTimeout(()=>launch(W*(.08+Math.random()*.84),H+10,1.1),110)}
 ctx.clearRect(0,0,W,H);
 for(let i=rockets.length-1;i>=0;i--){const r=rockets[i];r.px=r.x;r.py=r.y;r.x+=r.vx*dt;r.y+=r.vy*dt;r.vy+=.075*dt;drawRocket(r);if(r.y<=r.target||r.vy>-.2){explode(r.x,r.y,r.color,mode==='idle'?.8:1.2);rockets.splice(i,1)}}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.px=p.x;p.py=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(p.drag,dt);p.vy=p.vy*Math.pow(p.drag,dt)+p.gravity*dt;p.life-=dt;
  const a=Math.max(0,p.life/p.max);ctx.globalAlpha=a;ctx.strokeStyle=p.c;ctx.lineWidth=p.r;ctx.shadowBlur=3;ctx.shadowColor=p.c;ctx.beginPath();ctx.moveTo(p.px,p.py);ctx.lineTo(p.x,p.y);ctx.stroke();if(p.life<=0)particles.splice(i,1)}
 ctx.globalAlpha=1;ctx.shadowBlur=0;
}
requestAnimationFrame(tick);

const ids=['cover','story1','story2','story3','letter','final'];let current='cover';
function show(id){ids.forEach(v=>document.getElementById(v).classList.toggle('active',v===id));current=id;window.scrollTo({top:0,behavior:'smooth'});if(id==='final'){mode='final';for(let i=0;i<8;i++)setTimeout(()=>launch(W*(.08+Math.random()*.84),H+10,1.15),i*180)}}
document.getElementById('start').addEventListener('click',()=>{mode='active';show('story1');for(let i=0;i<6;i++)setTimeout(()=>launch(W*(.08+i*.16),H+10,1.15),i*190)});
document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.next)));
document.getElementById('replay').addEventListener('click',()=>{mode='idle';show('cover')});

// Soft original synthesized bell tones; browser audio begins only after explicit tap.
let audio=null,musicTimer=null,musicOn=false,index=0;const melody=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,783.99,1046.5];
function note(freq){if(!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,audio.currentTime);g.gain.exponentialRampToValueAtTime(.026,audio.currentTime+.05);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.85);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.9)}
document.getElementById('sound').addEventListener('click',async()=>{if(musicOn){clearInterval(musicTimer);musicOn=false;document.getElementById('soundText').textContent='Sound off';document.getElementById('sound').setAttribute('aria-pressed','false');return}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio=audio||new AC();await audio.resume();musicOn=true;document.getElementById('soundText').textContent='Sound on';document.getElementById('sound').setAttribute('aria-pressed','true');note(melody[index++%melody.length]);musicTimer=setInterval(()=>note(melody[index++%melody.length]),700)});
