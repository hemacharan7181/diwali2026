// Sky-shot fireworks: rockets rise from the lower edge and burst overhead.
const canvas=document.getElementById('fireworks'),ctx=canvas.getContext('2d');
let W,H,dpr,rockets=[],sparks=[],lastLaunch=0,active=false,finale=false;
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
const colors=['#ffb2dc','#ffe5a8','#c9baff','#ffffff','#ff8dc8','#ffd0ee'];
function launch(x=Math.random()*W,y=H+10,targetY=H*(.16+Math.random()*.3)){
 const hue=colors[Math.floor(Math.random()*colors.length)];
 rockets.push({x,y,vx:(Math.random()-.5)*1.2,vy:-(8+Math.random()*3),targetY,color:hue,trail:[]});
}
function burst(x,y,color,power=1){
 const count=90+Math.floor(Math.random()*55);
 for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=(1.1+Math.random()*4.4)*power;
 sparks.push({x,y,px:x,py:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:55+Math.random()*38,max:90,size:.8+Math.random()*2.1,color,twinkle:Math.random()})}
 // glittering secondary crackle
 for(let i=0;i<24;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*2.3;sparks.push({x,y,px:x,py:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:75,max:75,size:.7,color:'#fff0bd',twinkle:1})}
}
function frame(t){
 requestAnimationFrame(frame);ctx.clearRect(0,0,W,H);
 // sparse ambient launchers from first screen; energetic volleys after opening
 const rate=active?(finale?240:720):2300;
 if(t-lastLaunch>rate){launch(W*(.08+Math.random()*.84));lastLaunch=t;if(active&&Math.random()>.55)setTimeout(()=>launch(W*(.12+Math.random()*.76)),180)}
 rockets=rockets.filter(r=>{
  r.trail.push([r.x,r.y]);if(r.trail.length>10)r.trail.shift();
  r.x+=r.vx;r.y+=r.vy;r.vy+=.075;
  ctx.beginPath();r.trail.forEach((p,i)=>{if(i===0)ctx.moveTo(...p);else ctx.lineTo(...p)});
  ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.shadowBlur=14;ctx.shadowColor=r.color;ctx.stroke();ctx.shadowBlur=0;
  if(r.y<=r.targetY||r.vy>=-.4){burst(r.x,r.y,r.color,active?1.1:.72);return false}return true;
 });
 sparks=sparks.filter(s=>{
  s.px=s.x;s.py=s.y;s.x+=s.vx;s.y+=s.vy;s.vx*=.986;s.vy=s.vy*.986+.045;s.life--;
  const alpha=Math.max(0,s.life/s.max);
  ctx.globalAlpha=alpha;ctx.strokeStyle=s.color;ctx.lineWidth=s.size;ctx.shadowBlur=s.twinkle?10:5;ctx.shadowColor=s.color;
  ctx.beginPath();ctx.moveTo(s.px,s.py);ctx.lineTo(s.x,s.y);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;
  return s.life>0;
 });
}
requestAnimationFrame(frame);
const pages=['intro','message','final'];function show(id){pages.forEach(p=>document.getElementById(p).classList.toggle('active',p===id));window.scrollTo({top:0,behavior:'smooth'})}
const messageParts=[
'Happyyy Diwali bangarammm 💗✨🪔',
'Nuvvu na life loki ochina taruvatha everything changed. You are not just my lucky charm, you\'re the light in my darkest days and ever, my biggest support and the reason behind my smile. Sometimes I genuinely feel words are not enough to explain how much your presence means to me. Nuvvu pakkana unte even the hardest days feel easy, and without you everything feels so numb and empty. 🥺💖',
'Ee Diwali ki I just wish that manam iddaram life lo chala successful avvali mana dream careers achieve cheyyali, parents ni proud feel ayela cheyali and finally mana biggest dream marriage ni reality cheskovali. 🥹💗',
'I don\'t expect a perfect journey, but I wish we never give up on each other. How many ups and downs vachina, misunderstandings vachina, let\'s keep growing, supporting and succeeding together forever. 🫂🤗🥺',
'One day, mana careers lo settle ayyi, mana families blessings tho husband and wife ga kalisi Diwali celebrate cheskovali. That\'s the dream I always wishing for. 💖✨',
'Happy Diwali once again, my lucky charm, my happiness, my future Mrs. Hema Charan. 💋😚🥰☺️🫂😭'
];
const typed=document.getElementById('typed'),signature=document.getElementById('signature'),finish=document.getElementById('finish');
let started=false;
function revealMessage(){
 if(started)return;started=true;active=true;finale=false;show('message');
 typed.innerHTML='';signature.classList.remove('show');finish.hidden=true;
 // Staggered paragraph reveal timed to fireworks, then reveal the final signature.
 messageParts.forEach((text,i)=>{setTimeout(()=>{const p=document.createElement('span');p.className='para';p.textContent=text;typed.appendChild(p);if(i===messageParts.length-1){setTimeout(()=>{signature.classList.add('show');finish.hidden=false;},900)}},650+i*2450)});
 // Launch a synchronized opening volley.
 for(let i=0;i<7;i++)setTimeout(()=>launch(W*(.08+.84*(i/6))),i*170);
}
document.getElementById('open').addEventListener('click',revealMessage);
document.getElementById('finish').addEventListener('click',()=>{finale=true;active=true;show('final');for(let i=0;i<16;i++)setTimeout(()=>launch(W*(.05+Math.random()*.9)),i*210)});
document.getElementById('again').addEventListener('click',()=>{started=false;active=false;finale=false;typed.innerHTML='';signature.classList.remove('show');finish.hidden=true;show('intro')});

// Optional original synthesized bell-like accompaniment. Starts only after user presses Sound.
let audio=null,loop=null,music=false,step=0;const notes=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,783.99,1046.5];
function tone(f){if(!audio)return;let o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,audio.currentTime);g.gain.exponentialRampToValueAtTime(.035,audio.currentTime+.04);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.9);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+1)}
document.getElementById('music').addEventListener('click',async()=>{if(music){clearInterval(loop);music=false;document.querySelector('#music span').textContent='Sound off';return}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio=audio||new AC();await audio.resume();music=true;document.querySelector('#music span').textContent='Sound on';loop=setInterval(()=>{tone(notes[step++%notes.length]);},650)});
