const $=s=>document.querySelector(s);
const FRESH=()=>({score:[0,0],games:[0,0],gameNo:1,server:0,pos:[0,0],far:0,mid:false,over:false});
let S=FRESH(),hist=[],logs=[],dbl=false,msg='',names=['Team A','Team B'];
const hn=h=>h===0?'side 1':'side 2';
const winsNext=(t)=>{const n=S.score[t]+1,o=S.score[1-t];return (n>=21&&n-o>=2)||n===30};

function point(t,why){
  if(S.over)return;
  hist.push(JSON.stringify(S));if(hist.length>300)hist.shift();
  const o=1-t;msg='';
  S.score[t]++;
  if(S.server===t){if(dbl)S.pos[t]=1-S.pos[t]}else S.server=t;
  const s=S.score;
  logs.unshift(`G${S.gameNo}  ${s[0]}–${s[1]}  ${names[t]}${why?' · '+why:''}`);
  if((s[t]>=21&&s[t]-s[o]>=2)||s[t]===30){
    S.games[t]++;
    if(S.games[t]===2){S.over=true}
    else{msg=`${names[t]} wins game ${S.gameNo}. Change ends.`;S.gameNo++;S.score=[0,0];S.server=t;S.pos=[0,0];S.far=1-S.far;S.mid=false}
  }else if(Math.max(s[0],s[1])===11&&!S.mid){
    S.mid=true;msg='Interval: 60 seconds.';
    if(S.gameNo===3){S.far=1-S.far;msg+=' Change ends.'}
  }
  speak();render();
}
function undo(){if(!hist.length)return;S=JSON.parse(hist.pop());logs.shift();msg='';render()}
function speak(){
  if(!$('#sp').checked||!('speechSynthesis' in window))return;
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(S.over?'Match':`${S.score[S.server]}, ${S.score[1-S.server]}`);speechSynthesis.speak(u)}catch(e){}
}
function render(){
  for(let t=0;t<2;t++){
    $('#s'+t).textContent=S.score[t];
    $('#side'+t).textContent=(S.far===t?'Side 1':'Side 2');
    $('#p'+t).innerHTML=[0,1].map(i=>`<span class="pip${S.games[t]>i?' on':''}"></span>`).join('');
    const el=$('#v'+t);
    if(S.server===t&&!S.over){
      const even=S.score[t]%2===0;
      let txt=`Serving · ${even?'right':'left'} court`;
      if(dbl){const p=even?S.pos[t]:1-S.pos[t];txt+=` · player ${p+1}`}
      el.textContent=txt;el.classList.add('on');
    }else{
      let txt='Receiving';
      if(dbl&&!S.over){const sEven=S.score[S.server]%2===0;txt+=` · ${sEven?'right':'left'} court`}
      el.textContent=S.over?'':txt;el.classList.remove('on');
    }
    $('#add'+t).disabled=S.over;
  }
  let b=msg;
  if(!b){
    if(S.over){const w=S.games[0]>S.games[1]?0:1;b=`${names[w]} wins the match ${S.games[w]}–${S.games[1-w]}`}
    else{const gp=[0,1].filter(winsNext).map(t=>`${S.games[t]===1?'Match point':'Game point'}: ${names[t]}`);
      b=gp.length?gp.join(' · '):`Game ${S.gameNo} · first to 21, win by 2`}
  }
  $('#banner').textContent=b;
  $('#log').innerHTML=logs.slice(0,30).map(x=>`<li>${x.replace(/</g,'&lt;')}</li>`).join('');
}
[0,1].forEach(t=>{
  $('#add'+t).onclick=()=>point(t,'manual');
  $('#n'+t).oninput=e=>{names[t]=e.target.value||('Team '+'AB'[t]);render()};
});
$('#undo').onclick=undo;
let rt=0;
$('#reset').onclick=e=>{
  if(!rt){e.target.textContent='Tap again to confirm';rt=setTimeout(()=>{rt=0;e.target.textContent='New match'},3000);return}
  clearTimeout(rt);rt=0;e.target.textContent='New match';S=FRESH();hist=[];logs=[];msg='New match.';render();
};
$('#mode').onchange=e=>{dbl=e.target.value==='d';S.pos=[0,0];render()};

/* ---------- toast ---------- */
let tt=0;
function toast(text,btns){
  $('#tt').textContent=text+' ';
  const box=$('#tb');box.innerHTML='';
  btns.forEach(([l,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.onclick=()=>{f();hideToast()};box.appendChild(b)});
  $('#toast').classList.remove('hide');clearTimeout(tt);tt=setTimeout(hideToast,8000);
}
function hideToast(){$('#toast').classList.add('hide')}

/* ---------- court geometry ---------- */
/* Any camera angle: 4 clicked corners -> homography -> real court metres (6.1 x 13.4, net at 6.7) */
let Q,Hf,Hb;
const CW=6.1,CL=13.4,NET=6.7,CRT=[[0,0],[CW,0],[CW,CL],[0,CL]];
function solve(src,dst){const A=[];for(let i=0;i<4;i++){const[x,y]=src[i],[u,v]=dst[i];A.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v])}
 for(let c=0;c<8;c++){let p=c;for(let r=c+1;r<8;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];
  for(let r=0;r<8;r++)if(r!==c){const f=A[r][c]/A[c][c];for(let k=c;k<9;k++)A[r][k]-=f*A[c][k]}}
 return A.map((r,i)=>r[8]/r[i]).slice(0,8)}
const proj=(h,p)=>{const w=h[6]*p[0]+h[7]*p[1]+1;return[(h[0]*p[0]+h[1]*p[1]+h[2])/w,(h[3]*p[0]+h[4]*p[1]+h[5])/w]};
function setQ(q){Q=q;try{Hf=solve(q,CRT);Hb=solve(CRT,q)}catch(e){}}
setQ([[.3,.25],[.7,.25],[.9,.9],[.1,.9]]);
const toCourt=p=>proj(Hf,p),toImg=p=>proj(Hb,p);
const halfOf=p=>toCourt(p)[1]<NET?0:1;
function inCourt(p){const[x,y]=toCourt(p),t=.05,s=!dbl;return x>=(s?.46:0)-t&&x<=(s?5.64:CW)+t&&y>=-t&&y<=CL+t}
const teamOf=h=>h===0?S.far:1-S.far;

let lastCall=null;
function decide(p,startH,inside){const landH=halfOf(p),loser=teamOf(inside?landH:startH);
  return{win:1-loser,loser,why:inside?`IN on ${hn(landH)}`:`OUT, hit from ${hn(startH)}`}}
function onLanding(p,startH){
  const inside=inCourt(p),{win,loser,why}=decide(p,startH,inside);
  mark={p,inside,t:performance.now()};
  lastCall={p,startH,inside,shot:snapshot(p)};
  if(S.over)return;
  const ai=AI&&camOn?[['AI check',aiCheck]]:[];
  if($('#det').value==='auto'){
    point(win,'AI: '+why);
    toast(`${why} → point ${names[win]}.`,[['Undo',undo],['Other team',()=>{undo();point(loser,'corrected')}],...ai]);
  }else{
    toast(`Suggest: ${why} → ${names[win]}.`,[['Accept',()=>point(win,'AI: '+why)],['Other team',()=>point(loser,'corrected')],...ai,['Dismiss',()=>{}]]);
  }
}

/* ---------- camera + motion tracking ---------- */
const cv=$('#cv'),cx=cv.getContext('2d'),vid=$('#vid');
const sm=document.createElement('canvas'),sx=sm.getContext('2d',{willReadFrequently:true});
let camOn=false,prev=null,tr=[],miss=0,lastEvt=0,mark=null,cal=null,W=160,H=90,lastProc=0;
const corners=['end line 1, first corner','end line 1, second corner','end line 2, corner next to the second','end line 2, last corner'];
const setSt=t=>$('#st').textContent=t;

$('#cam').onclick=async()=>{
  if(camOn){stopCam();return}
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
    vid.srcObject=stream;await vid.play();
    const vw=vid.videoWidth||1280,vh=vid.videoHeight||720;
    cv.width=Math.min(vw,1280);cv.height=Math.round(cv.width*vh/vw);
    H=Math.round(W*vh/vw);sm.width=W;sm.height=H;prev=null;tr=[];camOn=true;
    $('#cam').textContent='Stop camera';
    setSt('Camera on. Calibrate the court corners, then rally. The AI follows the shuttle and scores where it lands.');
  }catch(err){setSt('Camera unavailable. Allow camera access in the browser, or use “Simulate” to try the scoring rules.')}
};
function stopCam(){
  if(vid.srcObject)vid.srcObject.getTracks().forEach(t=>t.stop());
  vid.srcObject=null;camOn=false;$('#cam').textContent='Start camera';setSt('Camera stopped.');
}
$('#cal').onclick=()=>{cal=[];setSt(`Tap corner 1 of 4: ${corners[0]}. Use the outer doubles lines and go around the court.`)};
let drag=-1;
const ptr=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]};
cv.style.touchAction='none';
cv.addEventListener('pointerdown',e=>{
  const p=ptr(e);
  if(cal){
    cal.push(p);
    if(cal.length===4){setQ(cal);cal=null;setSt('Court saved. Drag any orange corner so the lines match the real court.')}
    else setSt(`Tap corner ${cal.length+1} of 4: ${corners[cal.length]}.`);
    return;
  }
  const d=Q.map(q=>Math.hypot(q[0]-p[0],q[1]-p[1])),m=Math.min(...d);
  if(m<.06){drag=d.indexOf(m);cv.setPointerCapture(e.pointerId);return}
  if($('#sim').checked)onLanding(p,halfOf(p));
});
cv.addEventListener('pointermove',e=>{if(drag<0)return;const q=Q.slice();q[drag]=ptr(e);setQ(q)});
['pointerup','pointercancel'].forEach(t=>cv.addEventListener(t,()=>{drag=-1}));

function process(){
  sx.drawImage(vid,0,0,W,H);
  const d=sx.getImageData(0,0,W,H).data,g=new Uint8Array(W*H);
  for(let i=0;i<W*H;i++)g[i]=(d[4*i]*77+d[4*i+1]*150+d[4*i+2]*29)>>8;
  if(!prev){prev=g;return}
  const thr=75-(+$('#sens').value)*6;
  const xs=Q.map(q=>q[0]),ys=Q.map(q=>q[1]);
  const x0=Math.max(0,Math.floor((Math.min(...xs)-.06)*W)),x1=Math.min(W-1,Math.ceil((Math.max(...xs)+.06)*W));
  const y0=0,y1=Math.min(H-1,Math.ceil((Math.max(...ys)+.06)*H));
  const m=new Uint8Array(W*H);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x;if(Math.abs(g[i]-prev[i])>thr)m[i]=1}
  prev=g;
  const c=[];
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    if(m[y*W+x]!==1)continue;
    let st=[y*W+x],a=0,sX=0,sY=0;m[y*W+x]=2;
    while(st.length){
      const i=st.pop(),px=i%W,py=(i/W)|0;a++;sX+=px;sY+=py;
      if(a>60)break;
      for(const j of[i-1,i+1,i-W,i+W]){if(j>=0&&j<W*H&&m[j]===1&&Math.abs((j%W)-px)<2){m[j]=2;st.push(j)}}
    }
    if(a>=2&&a<=40)c.push({x:sX/a/W,y:sY/a/H,a});
  }
  let pick=null;
  if(tr.length){
    const l=tr[tr.length-1],q=tr[tr.length-2]||l,px=l.x+(l.x-q.x)*.8,py=l.y+(l.y-q.y)*.8;let bd=.1;
    c.forEach(k=>{const dd=Math.hypot(k.x-px,k.y-py);if(dd<bd){bd=dd;pick=k}});
  }else if(c.length)pick=c.reduce((a,b)=>b.a>a.a?b:a);
  if(pick){tr.push(pick);miss=0;if(tr.length>120)tr.shift()}else miss++;
  if(miss>=6){
    if(tr.length>=5)finish();
    tr=[];miss=0;
  }
}
function finish(){
  const n=tr.length,a=tr[0],z=tr[n-1],b=tr[Math.max(0,n-4)],now=performance.now();
  let path=0;for(let i=1;i<n;i++)path+=Math.hypot(tr[i].x-tr[i-1].x,tr[i].y-tr[i-1].y);
  // a landing ends moving downward and fast enough; slow or upward tracks are players or rackets
  if(Math.hypot(z.x-a.x,z.y-a.y)<.1||z.y-b.y<=0||path/n<.008||now-lastEvt<2500)return;
  lastEvt=now;
  const dc=toCourt([z.x,z.y])[1]-toCourt([a.x,a.y])[1]; // travel direction along the court tells who hit it
  onLanding([z.x,z.y],Math.abs(dc)>1.5?(dc>0?0:1):halfOf([a.x,a.y]));
}

/* ---------- drawing ---------- */
function overlay(now){
  const k=cv.width/960;
  const seg=(a,b,col,w)=>{const A=toImg(a),B=toImg(b);cx.strokeStyle=col;cx.lineWidth=w*k;cx.beginPath();cx.moveTo(A[0]*cv.width,A[1]*cv.height);cx.lineTo(B[0]*cv.width,B[1]*cv.height);cx.stroke()};
  const wh='rgba(255,255,255,.9)',dim='rgba(255,255,255,.45)';
  [[[0,0],[CW,0]],[[CW,0],[CW,CL]],[[CW,CL],[0,CL]],[[0,CL],[0,0]]].forEach(([a,b])=>seg(a,b,wh,3));
  [.46,5.64].forEach(x=>seg([x,0],[x,CL],dim,2));
  [.76,12.64].forEach(y=>seg([0,y],[CW,y],dim,1.5));
  [NET-1.98,NET+1.98].forEach(y=>seg([0,y],[CW,y],dim,2));
  seg([3.05,NET-1.98],[3.05,0],dim,1.5);seg([3.05,NET+1.98],[3.05,CL],dim,1.5);
  seg([0,NET],[CW,NET],'#ff8a3d',4);
  Q.forEach(q=>{cx.fillStyle='#ff8a3d';cx.beginPath();cx.arc(q[0]*cv.width,q[1]*cv.height,7*k,0,7);cx.fill()});
  cx.fillStyle='#ffd43b';
  tr.forEach((p,i)=>{cx.globalAlpha=.3+.7*i/tr.length;cx.beginPath();cx.arc(p.x*cv.width,p.y*cv.height,5*k,0,7);cx.fill()});
  cx.globalAlpha=1;
  if(mark&&now-mark.t<2500){
    cx.strokeStyle=mark.inside?'#4cd08f':'#ff6b6b';cx.lineWidth=5*k;
    cx.beginPath();cx.arc(mark.p[0]*cv.width,mark.p[1]*cv.height,16*k,0,7);cx.stroke();
    cx.fillStyle=cx.strokeStyle;cx.font=`700 ${22*k}px Barlow,sans-serif`;
    cx.fillText(mark.inside?'IN':'OUT',mark.p[0]*cv.width+22*k,mark.p[1]*cv.height);
  }
  cx.font=`600 ${18*k}px Barlow,sans-serif`;cx.fillStyle='rgba(255,255,255,.9)';
  const L1=toImg([.4,3]),L2=toImg([.4,10.4]);cx.fillText('SIDE 1',L1[0]*cv.width,L1[1]*cv.height);cx.fillText('SIDE 2',L2[0]*cv.width,L2[1]*cv.height);
  if(cal)cal.forEach(p=>{cx.fillStyle='#ff8a3d';cx.beginPath();cx.arc(p[0]*cv.width,p[1]*cv.height,8*k,0,7);cx.fill()});
}
function loop(now){
  requestAnimationFrame(loop);
  if(camOn){
    cx.drawImage(vid,0,0,cv.width,cv.height);
    if(now-lastProc>50){lastProc=now;if(!cal)process()}
  }else{
    cx.fillStyle='#16463d';cx.fillRect(0,0,cv.width,cv.height);
    cx.fillStyle='rgba(255,255,255,.75)';cx.font=`600 ${22*cv.width/960}px Barlow,sans-serif`;cx.textAlign='center';
    cx.fillText('Camera off · use Simulate to test',cv.width/2,cv.height*.12);cx.textAlign='left';
  }
  overlay(now);
}
/* ---------- AI helpers (Claude, via the page's sample capability) ---------- */
let AI=null;
const jpeg=c=>new Promise(r=>c.toBlob(r,'image/jpeg',.82));
function frame(){const t=document.createElement('canvas');t.width=cv.width;t.height=cv.height;t.getContext('2d').drawImage(vid,0,0,t.width,t.height);return t}
function snapshot(p){
  const t=document.createElement('canvas'),k=cv.width/960;t.width=cv.width;t.height=cv.height;const g=t.getContext('2d');
  g.drawImage(cv,0,0);g.strokeStyle='#ff2d2d';g.lineWidth=4*k;g.beginPath();g.arc(p[0]*t.width,p[1]*t.height,18*k,0,7);g.stroke();
  return jpeg(t);
}
async function aiCourt(){
  if(!camOn){setSt('Start the camera first.');return}
  setSt('AI is looking for the court…');
  try{
    const r=await AI.json(`This is a camera frame of a badminton court from an unknown angle (side, corner, behind, low or high). Find the 4 outer corners of the DOUBLES court (outer boundary lines). Estimate any corner that is hidden or outside the frame. Use coordinates normalised 0 to 1 (x from the left edge, y from the top edge), values slightly below 0 or above 1 are allowed for corners outside the frame. Order: corners 1 and 2 are the two ends of one end line (the short, 6.1 m side); corner 3 is the corner of the other end line next to corner 2; corner 4 is the last corner, so the four go around the court. Reply only with JSON: {"corners":[[x,y],[x,y],[x,y],[x,y]],"confidence":"high"|"medium"|"low","tip":"one short sentence on what to fix in the camera position"}`,{images:[await jpeg(frame())],modelTier:'default',cache:false});
    if(Array.isArray(r.corners)&&r.corners.length===4){
      setQ(r.corners.map(p=>[Math.min(1.25,Math.max(-.25,+p[0])),Math.min(1.25,Math.max(-.25,+p[1]))]));
      setSt(`AI placed the court (${r.confidence} confidence). ${r.tip||''} Drag any orange corner to fine-tune.`);
    }else setSt('AI could not find the court. Tap “Calibrate court” instead.');
  }catch(e){setSt('AI court finder unavailable. Use “Calibrate court”.')}
}
async function aiCheck(){
  const c=lastCall;if(!c)return;
  toast('AI is checking the shot…',[]);
  try{
    const r=await AI.json(`You are a badminton line judge. The image is a camera frame. White lines overlaid by the app are an approximate court outline and the orange line is the net. The red circle marks where the app thinks the shuttle landed. Judge from the real court lines and the shuttle itself. A shuttle touching a line is IN. This is ${dbl?'doubles (outer side lines)':'singles (inner side lines)'}. Reply only with JSON: {"verdict":"in"|"out"|"unclear","reason":"one short sentence"}`,{images:[await c.shot],modelTier:'quick',cache:false});
    const v=r.verdict;
    if(v==='unclear'||(v==='in')===c.inside)return toast(`AI ${v==='unclear'?'cannot tell':'agrees'}: ${r.reason}`,[['OK',()=>{}]]);
    toast(`AI says ${String(v).toUpperCase()}: ${r.reason}`,[['Use AI call',()=>{
      const d=decide(c.p,c.startH,v==='in');
      if(logs[0]&&logs[0].includes(' · AI:'))undo();
      point(d.win,'AI line judge: '+d.why);c.inside=v==='in';
    }],['Keep',()=>{}]]);
  }catch(e){toast('AI check unavailable right now.',[['OK',()=>{}]])}
}
$('#ask').onclick=async()=>{
  const q=$('#q').value.trim(),out=$('#ans');if(!q||!AI)return;
  out.textContent='Thinking…';
  try{
    await AI(`You are a concise badminton umpire who knows the BWF Laws. Match: ${dbl?'doubles':'singles'}, game ${S.gameNo}, score ${names[0]} ${S.score[0]}–${S.score[1]} ${names[1]}, games won ${S.games[0]}–${S.games[1]}, ${names[S.server]} serving. Answer in three sentences or fewer.\n\nQuestion: ${q}`,{modelTier:'quick',cache:false,onText:({text})=>{out.textContent=text}});
  }catch(e){out.textContent=e.text||'AI umpire unavailable right now.'}
};
$('#q').onkeydown=e=>{if(e.key==='Enter')$('#ask').click()};
if(window.claude)claude.use('sample').then(s=>{if(!s)return;AI=s;document.querySelectorAll('.ai').forEach(x=>x.classList.remove('hide'));$('#aiCourt').onclick=aiCourt}).catch(()=>{});
render();requestAnimationFrame(loop);
