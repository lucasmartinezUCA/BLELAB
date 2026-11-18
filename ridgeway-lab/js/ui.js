// Activity panels, route, settings, matrix and 3D prop updates.
import * as THREE from 'three';
import {CASES,BOOKS} from './cases.js';
import {S,C,save,reset,nextCase,status,objective,STEP_STATION,LMS} from './state.js';
import {STATIONS,dyn,hotspots} from './world.js';
import {redraw,SANS,SERIF,HAND,wrap,fit} from './materials.js';
import * as B from './builders.js';
const $=s=>document.querySelector(s);
const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const L3=['A','B','C','D'];
let ctx=null;export function bindUI(c){ctx=c;}

/* ---------- portrait placeholder (provisional) ---------- */
function portrait(c,cls=''){const ini=c.client.split(' ').map(w=>w[0]).join('');const col={northwind:'#2F4E6B',birch:'#5E7D4F',pocketlend:'#6E2F4C'}[c.id]||'#555';
  return `<div class="portrait ${cls}" role="img" aria-label="Placeholder portrait of ${esc(c.client)}"><svg viewBox="0 0 80 80" aria-hidden="true"><rect width="80" height="80" rx="12" fill="${col}"/><circle cx="40" cy="31" r="15" fill="rgba(255,255,255,.2)"/><path d="M14 80c2-17 13-26 26-26s24 9 26 26z" fill="rgba(255,255,255,.2)"/><text x="40" y="37" text-anchor="middle" font-family="Public Sans,Arial" font-weight="700" font-size="15" fill="#fff">${ini}</text></svg></div>`;}

/* ---------- legal × ethical matrix ---------- */
export function matrixSVG(points,{size=250}={}){const m=40,W=size,H=size,X=v=>m+v/100*(W-m-14),Y=v=>H-m-v/100*(H-m-14);
  let s=`<svg class="mx" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="mxT"><title id="mxT">Chart of legal soundness (horizontal) against ethical defensibility (vertical), 0 to 100. Exact values are listed in the table.</title>`;
  s+=`<rect x="${X(50)}" y="${Y(100)}" width="${X(100)-X(50)}" height="${Y(50)-Y(100)}" class="mx-q"/>`;
  [0,25,50,75,100].forEach(v=>{s+=`<line x1="${X(v)}" y1="${Y(0)}" x2="${X(v)}" y2="${Y(100)}" class="mx-g"/><line x1="${X(0)}" y1="${Y(v)}" x2="${X(100)}" y2="${Y(v)}" class="mx-g"/>`;
    s+=`<text x="${X(v)}" y="${Y(0)+14}" class="mx-t" text-anchor="middle">${v}</text><text x="${X(0)-6}" y="${Y(v)+4}" class="mx-t" text-anchor="end">${v}</text>`;});
  s+=`<line x1="${X(0)}" y1="${Y(0)}" x2="${X(100)}" y2="${Y(0)}" class="mx-a"/><line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(100)}" class="mx-a"/>`;
  s+=`<text x="${(X(0)+X(100))/2}" y="${H-4}" class="mx-l" text-anchor="middle">Legal soundness</text><text transform="translate(11 ${(Y(0)+Y(100))/2}) rotate(-90)" class="mx-l" text-anchor="middle">Ethical defensibility</text>`;
  s+=`<text x="${X(75)}" y="${Y(100)+12}" class="mx-t" text-anchor="middle">sound and defensible</text>`;
  const placed=[];points.forEach(p=>{let dx=0,dy=0;placed.forEach(q=>{if(Math.abs(q.L-p.L)<6&&Math.abs(q.E-p.E)<6){dx+=9;dy-=9;}});placed.push(p);const x=X(p.L)+dx,y=Y(p.E)+dy;
    if(p.shape==='diamond')s+=`<path d="M${x} ${y-9}L${x+9} ${y}L${x} ${y+9}L${x-9} ${y}Z" class="mx-prof"/>`;else s+=`<circle cx="${x}" cy="${y}" r="9" class="mx-you"/>`;
    s+=`<text x="${x}" y="${y+4}" text-anchor="middle" class="mx-pt">${esc(p.tag)}</text>`;});
  return s+'</svg>';}

/* ---------- 3D props ---------- */
function drawClock(){if(!dyn.clock)return;redraw(dyn.clock,(x,W,H)=>{const d=new Date();x.fillStyle='#FAFAF7';x.fillRect(0,0,W,H);x.translate(W/2,H/2);x.strokeStyle='#22262B';
  for(let i=0;i<60;i++){x.save();x.rotate(i*Math.PI/30);x.lineWidth=i%5?2:5;x.beginPath();x.moveTo(0,-112);x.lineTo(0,i%5?-104:-92);x.stroke();x.restore();}
  const hand=(a,l,w)=>{x.save();x.rotate(a);x.lineWidth=w;x.lineCap='round';x.beginPath();x.moveTo(0,14);x.lineTo(0,-l);x.stroke();x.restore();};
  hand((d.getHours()%12+d.getMinutes()/60)*Math.PI/6,62,8);hand(d.getMinutes()*Math.PI/30,92,5);x.fillStyle='#22262B';x.beginPath();x.arc(0,0,7,0,7);x.fill();x.setTransform(1,0,0,1,0,0);});}
export function tickClock(){drawClock();}
function sync3D(){const c=C();if(!dyn.monitorTex)return;
  const dirty=(t,key)=>{if(t.userData.key===key)return false;t.userData.key=key;return true;};
  // reception roster
  if(dirty(dyn.rosterTex,S.ci+S.beat))redraw(dyn.rosterTex,(x,W,H)=>{x.fillStyle='#F5F6F7';x.fillRect(0,0,W,H);x.fillStyle='#22313F';x.fillRect(0,0,W,96);x.fillStyle='#fff';x.font=`600 46px ${SANS}`;x.fillText("Today's clients",40,64);
    CASES.forEach((k,i)=>{const y=150+i*150;const st=S.beat==='end'||i<S.ci?'Completed':i===S.ci?'In progress':'Waiting';x.fillStyle=i===S.ci&&S.beat!=='end'?'#E8EEF4':'#FFFFFF';x.fillRect(30,y-50,W-60,128);
      x.fillStyle='#1D2731';x.font=`700 42px ${SANS}`;x.fillText(k.client,60,y+4);x.fillStyle='#56636F';x.font=`400 30px ${SANS}`;x.fillText(k.role,60,y+50);
      x.textAlign='right';x.fillStyle=st==='Completed'?'#2F7A55':st==='In progress'?'#2E5B88':'#7A858F';x.font=`600 32px ${SANS}`;x.fillText((st==='Completed'?'✓ ':st==='In progress'?'▶ ':'')+st,W-60,y+20);x.textAlign='left';});});
  // monitor + folder + legal pad
  if(dirty(dyn.monitorTex,c.id+S.beat+S.asked.length))redraw(dyn.monitorTex,(x,W,H)=>{x.fillStyle='#F3F5F7';x.fillRect(0,0,W,H);x.fillStyle='#22313F';x.fillRect(0,0,W,70);x.fillStyle='#fff';x.font=`600 32px ${SANS}`;x.fillText('Ridgeway Clinic  |  Client intake',28,46);
    x.fillStyle='#1D2731';x.font=`700 46px ${SANS}`;x.fillText(c.client,40,150);x.fillStyle='#56636F';x.font=`400 30px ${SANS}`;x.fillText(c.role,40,195);x.fillStyle='#1D2731';x.font=`600 30px ${SANS}`;x.fillText('Matter: '+c.title,40,255);
    x.fillStyle='#2E5B88';x.font=`600 28px ${SANS}`;x.fillText('Current step: '+(S.beat==='end'?'complete':{intake:'Interview',law:'Source of law',court:'Jurisdiction',advice:'Advice',outcome:'Outcome'}[S.beat]),40,315);
    x.fillStyle='#56636F';x.font=`400 26px ${SANS}`;x.fillText('Facts gathered: '+S.asked.length+' of '+c.qs.length,40,365);});
  if(dirty(dyn.folderTex,c.id))redraw(dyn.folderTex,(x,W,H)=>{x.fillStyle='#FBFAF5';x.fillRect(0,0,W,H);x.fillStyle='#1D2731';x.textAlign='center';x.textBaseline='middle';fit(x,c.client,W*.9,60,'700',SANS);x.fillText(c.client,W/2,62);x.fillStyle='#56636F';x.font=`400 32px ${SANS}`;x.fillText('New client intake',W/2,128);});
  if(dirty(dyn.padTex,c.id+S.asked.join()))redraw(dyn.padTex,(x,W,H)=>{x.fillStyle='#F7EE9F';x.fillRect(0,0,W,H);x.strokeStyle='#9DB4D1';x.lineWidth=2;for(let y=110;y<H;y+=40){x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke();}x.strokeStyle='#D98C8C';x.beginPath();x.moveTo(70,0);x.lineTo(70,H);x.stroke();
    x.fillStyle='#1F3A6B';x.font=`400 30px ${HAND}`;x.fillText(c.client+' - notes',84,98);let y=146;S.asked.forEach(i=>{wrap(x,'• '+c.qs[i].tag,W-110).forEach(l=>{x.fillText(l,84,y);y+=40;});});});
  // pinboard cards
  const cardKey=c.id+S.asked.join();if(dyn.cardKey!==cardKey){dyn.cardKey=cardKey;dyn.cards.forEach(m=>{m.parent.remove(m);m.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material.map)o.material.map.dispose();o.material.dispose();}});});dyn.cards=[];S.asked.forEach((qi,k)=>{const q=c.qs[qi];const tex=ctx.canvasTexture(420,280,(x,W,H)=>{x.fillStyle='#FDFCF7';x.fillRect(0,0,W,H);x.fillStyle='#C9A65A';x.fillRect(0,0,W,10);
      x.fillStyle='#56636F';x.font=`400 22px ${SANS}`;wrap(x,'Q: '+q.q,W-40).slice(0,2).forEach((l,i)=>x.fillText(l,20,44+i*28));x.fillStyle='#1D2731';x.font=`700 32px ${SANS}`;wrap(x,q.tag,W-40).slice(0,4).forEach((l,i)=>x.fillText(l,20,130+i*38));});
    const cd=B.card(tex,.34,.227);const col=k%2,row=Math.floor(k/2);cd.position.set(dyn.pinboard.x-.03,dyn.pinboard.y+.24-row*.29,dyn.pinboard.z-.33+col*.66+(row%2?.04:0));cd.rotation.set(0,-Math.PI/2,0);cd.rotation.z=((k*37)%7-3)*.008;ctx.scene.add(cd);dyn.cards.push(cd);});}
  // hero books
  dyn.heroBooks.forEach((bk,i)=>{const lab=BOOKS[c.id][i];if(dirty(bk.userData.tex,c.id))redraw(bk.userData.tex,(x,W,H)=>{x.fillStyle=['#1F3E62','#2B5E45','#6B2E26'][i];x.fillRect(0,0,W,H);x.strokeStyle='#D3B467';x.lineWidth=8;x.strokeRect(22,22,W-44,H-44);x.lineWidth=2;x.strokeRect(36,36,W-72,H-72);
      x.fillStyle='#F1E3BC';x.textAlign='center';x.textBaseline='middle';let s=58,lines;do{x.font=`700 ${s}px ${SERIF}`;lines=wrap(x,lab,W*.72);s-=4;}while(lines.length*s*1.25>H*.45&&s>24);lines.forEach((l,k)=>x.fillText(l,W/2,H*.4+(k-(lines.length-1)/2)*s*1.25));
      x.font=`600 40px ${SANS}`;x.fillText(L3[i],W/2,H*.82);});
    const chosen=S.law===i;bk.position.copy(bk.userData.base);if(chosen){bk.position.y+=.03;bk.position.z+=.09;}});
  if(S.law!=null){const ok=c.law.opts.findIndex(o=>o.ok);const t=dyn.bookTag;t.visible=true;t.position.set(dyn.heroBooks[ok].userData.base.x,.765,-3.36);
    if(dirty(t.userData.tex,'ok'))redraw(t.userData.tex,(x,W,H)=>{x.fillStyle='#FDFCF7';x.fillRect(0,0,W,H);x.fillStyle='#1E6B45';x.font=`700 46px ${SANS}`;x.textAlign='center';x.textBaseline='middle';x.fillText('✓ Governing law',W/2,H/2);});}else dyn.bookTag.visible=false;
  // court verdict cards
  ['state','federal'].forEach(k=>{const t=dyn.verdictTex[k];const show=S.court!=null;t.userData.card.visible=show;if(!show)return;const yes=c.court.show[k];
    if(dirty(t,c.id+yes))redraw(t,(x,W,H)=>{x.fillStyle='#FDFCF7';x.fillRect(0,0,W,H);x.fillStyle=yes?'#1E6B45':'#8E2F29';x.font=`700 44px ${SANS}`;x.textAlign='center';x.textBaseline='middle';x.fillText(yes?'✓ Can hear this case':'✗ Cannot hear it',W/2,H/2);});});
  // dossiers
  dyn.dossiers.forEach((f,i)=>{const signed=S.adv===i,sel=S.pick===i&&S.adv==null;if(dirty(f.userData.tex,c.id+signed))redraw(f.userData.tex,(x,W,H)=>{x.fillStyle='#FBFAF5';x.fillRect(0,0,W,H);x.fillStyle='#1D2731';x.font=`700 52px ${SANS}`;x.fillText('Option '+L3[i],24,70);x.fillStyle='#56636F';x.font=`400 28px ${SANS}`;x.fillText(c.client,24,120);
      if(signed){x.save();x.translate(W-110,82);x.rotate(-.25);x.strokeStyle='#A93F37';x.lineWidth=5;x.strokeRect(-92,-34,184,68);x.fillStyle='#A93F37';x.font=`800 40px ${SANS}`;x.textAlign='center';x.textBaseline='middle';x.fillText('SIGNED',0,2);x.restore();}});
    f.position.copy(f.userData.base);if(signed||sel)f.position.z+=.18;});
  // results display
  if(dirty(dyn.resultsTex,S.ci+S.beat+S.adv+S.rec.length))redraw(dyn.resultsTex,(x,W,H)=>{x.fillStyle='#F6F7F8';x.fillRect(0,0,W,H);x.fillStyle='#22313F';x.fillRect(0,0,W,90);x.fillStyle='#fff';x.font=`600 40px ${SANS}`;
    if(S.beat==='end'){x.fillText('Practice record',40,60);drawMatrix(x,60,140,480,S.rec.map((r,i)=>({L:r.L,E:r.E,tag:String(i+1),shape:'circle'})));x.fillStyle='#1D2731';x.font=`600 34px ${SANS}`;S.rec.forEach((r,i)=>x.fillText(`${i+1}. ${CASES[i].client}: legal ${r.L}, ethical ${r.E}`,640,220+i*64));return;}
    if(S.beat!=='outcome'||S.adv==null){x.fillText('Results',40,60);x.fillStyle='#56636F';x.font=`400 34px ${SANS}`;x.fillText('No advice signed yet for '+c.client+'.',60,200);return;}
    const o=c.advice.opts[S.adv],b=c.advice.opts.find(z=>z.best);x.fillText('Outcome: '+c.client,40,60);
    drawMatrix(x,60,140,480,[{L:b.L,E:b.E,tag:'P',shape:'diamond'},{L:o.L,E:o.E,tag:'Y',shape:'circle'}]);
    x.fillStyle='#1D2731';x.font=`700 34px ${SANS}`;x.fillText(`Y  Your advice (${L3[S.adv]}): legal ${o.L}, ethical ${o.E}`,620,200);x.fillText(`P  Professor's pick: legal ${b.L}, ethical ${b.E}`,620,256);
    x.fillStyle='#56636F';x.font=`400 28px ${SANS}`;wrap(x,o.out,600).slice(0,8).forEach((l,i)=>x.fillText(l,620,340+i*38));});
}
function drawMatrix(x,ox,oy,s,pts){x.save();x.translate(ox,oy);x.fillStyle='#FFFFFF';x.fillRect(0,0,s,s);x.fillStyle='rgba(47,122,85,.13)';x.fillRect(s/2,0,s/2,s/2);x.strokeStyle='#C9D0D6';x.lineWidth=2;
  for(let i=0;i<=4;i++){const p=i*s/4;x.beginPath();x.moveTo(p,0);x.lineTo(p,s);x.stroke();x.beginPath();x.moveTo(0,p);x.lineTo(s,p);x.stroke();x.fillStyle='#56636F';x.font=`400 22px ${SANS}`;x.fillText(String(i*25),p-10,s+30);x.fillText(String(100-i*25),-46,p+8);}
  x.fillStyle='#1D2731';x.font=`600 24px ${SANS}`;x.fillText('Legal soundness →',s/2-90,s+62);x.save();x.rotate(-Math.PI/2);x.fillText('Ethical defensibility →',-s/2-120,-58);x.restore();
  const seen=[];pts.forEach(p=>{let d=0;seen.forEach(q=>{if(Math.abs(q.L-p.L)<5&&Math.abs(q.E-p.E)<5)d+=18;});seen.push(p);const X=p.L/100*s+d,Y=s-p.E/100*s-d;
    x.fillStyle=p.shape==='diamond'?'#B07D1A':'#2E5B88';x.beginPath();if(p.shape==='diamond'){x.moveTo(X,Y-20);x.lineTo(X+20,Y);x.lineTo(X,Y+20);x.lineTo(X-20,Y);}else x.arc(X,Y,18,0,7);x.fill();
    x.fillStyle='#fff';x.font=`700 22px ${SANS}`;x.textAlign='center';x.textBaseline='middle';x.fillText(p.tag,X,Y+1);x.textAlign='left';x.textBaseline='alphabetic';});x.restore();}

/* ---------- panel rendering ---------- */
let openStation=null;
export function isOpen(){return openStation;}
export function closePanel(){if(!openStation)return;openStation=null;$('#panel').hidden=true;document.body.classList.remove('panel-open');ctx&&ctx.onPanelClose&&ctx.onPanelClose();}
export function openPanel(station,focusOpt){openStation=station;ctx&&ctx.onPanelOpen&&ctx.onPanelOpen();const p=$('#panel');p.hidden=false;document.body.classList.add('panel-open');renderPanel(focusOpt);const h=p.querySelector('h2');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
function go(station){closePanel();ctx.travel(station);}
function nextBtn(label){const st=STEP_STATION[S.beat];return `<div class="go"><button class="btn" data-go="${st}">${esc(label)}</button></div>`;}
function renderPanel(focusOpt){const st=openStation;if(!st)return;const c=C(),b=$('#panelBody');const status_=status(st);let h='';
  $('#panelTitle').textContent=STATIONS[st].name;
  if(status_==='locked'){h=`<h2>Not yet</h2><p>This room is for a later step. First: ${esc(objective())}</p>${nextBtn('Take me there')}`;}
  else if(st==='reception'){h=`<h2>Today’s clients</h2><p class="lead">${S.beat==='end'?'All three clients have been advised.':'Current task: '+esc(objective())}</p><ol class="roster">`+
     CASES.map((k,i)=>{const s=S.beat==='end'||i<S.ci?'Completed':i===S.ci?'In progress':'Waiting';return `<li><span><strong>${esc(k.client)}</strong><br><small>${esc(k.role)}</small></span><span class="badge b-${s.replace(' ','').toLowerCase()}">${s==='Completed'?'✓ ':''}${s}</span></li>`;}).join('')+'</ol>'+
     `<div class="go"><button class="btn" data-go="${STEP_STATION[S.beat]}">Go to the current step</button><button class="btn ghost" data-act="restart">Restart the week</button></div>`;}
  else if(st==='consult'){const last=S.asked[S.asked.length-1];const say=last==null?c.opening:c.qs[last].a;
    h=`<div class="dialog">${portrait(c)}<div><p class="who"><strong>${esc(c.client)}</strong> <span>${esc(c.role)}</span></p>${last!=null?`<p class="you">You: ${esc(c.qs[last].q)}</p>`:''}<p class="say">${esc(say)}</p></div></div>`;
    if(status_==='current'){h+=`<h2>Interview: ${esc(c.title)}</h2><p class="lead">Ask at least two questions. Each answer is pinned to the case file board.</p><div class="opts">`+
      c.qs.map((q,i)=>{const a=S.asked.includes(i);return `<button class="opt${a?' asked':''}" data-q="${i}" ${a?'disabled aria-disabled="true"':''}><b aria-hidden="true">${a?'✓':'?'}</b><span>${esc(q.q)}${a?'<span class="sr"> (asked)</span>':''}</span></button>`;}).join('')+`</div>`+
      `<div class="go"><button class="btn" data-act="analyze" ${S.asked.length<2?'disabled':''}>Begin analysis</button>${S.asked.length<2?`<span class="hint">${2-S.asked.length} more question${S.asked.length===1?'':'s'} first</span>`:''}</div>`;}
    else{h+=`<h2>Interview notes</h2><ul class="facts">${S.asked.map(i=>`<li>${esc(c.qs[i].tag)}</li>`).join('')}</ul>${S.beat!=='end'?nextBtn('Continue: '+objective()):''}`;}}
  else if(st==='library'||st==='courts'){const kind=st==='library'?'law':'court',Q=c[kind],ans=S[kind];
    h=`<h2>${kind==='law'?'Identify the source of law':'Find the right court'}</h2><p class="q">${esc(Q.q)}</p><div class="opts">`+
      Q.opts.map((o,i)=>{let cls='opt',mark=L3[i];if(ans!=null){if(o.ok){cls+=' right';mark='✓';}else if(i===ans){cls+=' wrong';mark='✗';}else cls+=' dim';}
        return `<button class="${cls}" data-i="${i}" ${ans!=null?'disabled aria-disabled="true"':''}><b aria-hidden="true">${mark}</b><span>${kind==='law'?`<em>${esc(BOOKS[c.id][i])}.</em> `:''}${esc(o.t)}${ans!=null?(o.ok?'<span class="sr"> (correct answer)</span>':i===ans?'<span class="sr"> (your answer, incorrect)</span>':''):''}</span></button>`;}).join('')+'</div>';
    if(ans!=null){const o=Q.opts[ans];h+=`<p class="fb ${o.ok?'':'bad'}"><strong>${o.ok?'Correct.':'Not quite.'}</strong> ${esc(o.ok?o.fb.replace(/^Right\. /,''):o.fb+' '+Q.opts.find(x=>x.ok).fb.replace(/^Right\. /,''))}</p>`;
      if(status_==='current'||S.beat===({law:'court',court:'advice'})[kind])h+=nextBtn(kind==='law'?'Walk to the Jurisdiction Room':'Walk to the Strategy Room');}}
  else if(st==='strategy'){h=`<h2>Give your advice</h2><p class="lead">${esc(c.advice.q)} The legally correct move and the ethically defensible one do not always coincide.</p><div class="opts">`+
      c.advice.opts.map((o,i)=>{const signed=S.adv===i,sel=S.pick===i;return `<button class="opt${signed?' right':''}${sel&&S.adv==null?' sel':''}" data-a="${i}" aria-pressed="${sel||signed}" ${S.adv!=null?'disabled aria-disabled="true"':''}><b aria-hidden="true">${L3[i]}</b><span>${esc(o.t)}${signed?' <strong>(signed)</strong>':''}</span></button>`;}).join('')+'</div>';
    if(S.adv==null)h+=`<div class="go"><button class="btn" data-act="sign" ${S.pick==null?'disabled':''}>${S.pick==null?'Select a dossier first':'Sign option '+L3[S.pick]}</button></div>`;
    else if(S.beat==='outcome')h+=nextBtn('Walk to the Results Room');}
  else if(st==='results'){if(S.beat==='end'){const right=S.rec.reduce((n,r)=>n+(r.law?1:0)+(r.court?1:0),0);
      h=`<h2>Your practice record</h2><div class="mxwrap">${matrixSVG(S.rec.map((r,i)=>({L:r.L,E:r.E,tag:String(i+1)})))}</div>
        <table class="vals"><caption>Exact values</caption><thead><tr><th>Client</th><th>Legal</th><th>Ethical</th><th>Matched professor</th></tr></thead><tbody>${S.rec.map((r,i)=>`<tr><td>${i+1}. ${esc(CASES[i].client)}</td><td>${r.L}</td><td>${r.E}</td><td>${r.best?'Yes':'No'}</td></tr>`).join('')}</tbody></table>
        <p><strong>${right} of ${CASES.length*2}</strong> law and court calls correct.</p><p class="prof"><strong>Before you write your summary</strong> In which case did the legally available option and the defensible one split, and what made you choose?</p>
        <div class="go"><button class="btn ghost" data-act="restart">Start the week again</button></div>`;}
    else if(S.adv!=null){const o=c.advice.opts[S.adv],b=c.advice.opts.find(x=>x.best),hid=c.qs.findIndex(q=>q.hidden);const same=o===b;
      h=`<div class="dialog">${portrait(c)}<div><p class="who"><strong>${esc(c.client)}</strong> <span>a few months later</span></p><p class="say">${esc(o.out)}</p></div></div><h2>How your advice played out</h2>
        <div class="mxwrap">${matrixSVG([{L:b.L,E:b.E,tag:'P',shape:'diamond'},{L:o.L,E:o.E,tag:'Y'}])}</div>
        <table class="vals"><caption>Exact values</caption><thead><tr><th></th><th>Legal</th><th>Ethical</th></tr></thead><tbody><tr><td>● Y: your advice (${L3[S.adv]})</td><td>${o.L}</td><td>${o.E}</td></tr><tr><td>◆ P: professor’s pick</td><td>${b.L}</td><td>${b.E}</td></tr></tbody></table>
        ${same?'<p class="fb">Your advice matches the professor’s pick; both markers sit on the same point.</p>':''}
        ${!S.asked.includes(hid)?`<p class="miss">You never asked: “${esc(c.qs[hid].q)}” That fact changes the best answer.</p>`:''}
        <p class="prof"><strong>Professor’s analysis</strong> ${esc(c.prof)}</p><div class="go"><button class="btn" data-act="next">${S.ci<CASES.length-1?'Call the next client':'See your practice record'}</button></div>`;}
    else h=`<h2>Results</h2><p>No advice has been signed yet. ${esc(objective())}</p>${nextBtn('Take me there')}`;}
  b.innerHTML=h;
  b.querySelectorAll('[data-go]').forEach(x=>x.onclick=()=>go(x.dataset.go));
  b.querySelectorAll('[data-q]').forEach(x=>x.onclick=()=>{ctx.onAsk&&ctx.onAsk();S.asked.push(+x.dataset.q);save();refresh();renderPanel();const n=b.querySelector('[data-act=analyze]:not([disabled])')||b.querySelector('[data-q]:not([disabled])');n&&n.focus();});
  b.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>{const kind=st==='library'?'law':'court';S[kind]=+x.dataset.i;S.beat=kind==='law'?'court':'advice';save();refresh();renderPanel();const n=b.querySelector('.fb');n&&(n.tabIndex=-1,n.focus());});
  b.querySelectorAll('[data-a]').forEach(x=>x.onclick=()=>{S.pick=+x.dataset.a;refresh();renderPanel();const s=b.querySelector('[data-act=sign]');s&&s.focus();});
  const act=(a)=>b.querySelector(`[data-act=${a}]`);
  if(act('analyze'))act('analyze').onclick=()=>{S.beat='law';save();refresh();renderPanel();b.querySelector('[data-go]')&&b.querySelector('[data-go]').focus();};
  if(act('sign'))act('sign').onclick=()=>{S.adv=S.pick;const o=c.advice.opts[S.adv];S.rec.push({L:o.L,E:o.E,best:!!o.best,law:c.law.opts[S.law].ok,court:c.court.opts[S.court].ok});S.beat='outcome';save();LMS.report(S);refresh();renderPanel();};
  if(act('next'))act('next').onclick=()=>{ctx.onClientDone&&ctx.onClientDone(S.ci);if(S.ci<CASES.length-1){nextCase();refresh();closePanel();ctx.travel('consult');}else{S.beat='end';save();refresh();renderPanel();}};
  if(act('restart'))act('restart').onclick=()=>{reset();ctx.onRestart&&ctx.onRestart();refresh();closePanel();ctx.travel('consult');};
  if(focusOpt!=null){const el=b.querySelector(`[data-i="${focusOpt}"],[data-a="${focusOpt}"]`);el&&setTimeout(()=>el.focus(),30);}}

/* ---------- HUD, route ---------- */
export function refresh(){const c=C();$('#hudCase').textContent=S.beat==='end'?'Week complete':`Client ${S.ci+1} of ${CASES.length}: ${c.client}`;$('#hudObj').textContent=objective();
  const order=['reception','consult','library','courts','strategy','results'];
  $('#routeList').innerHTML=order.map(id=>{const s=status(id);const lab={current:'Current step',done:'Done',locked:'Later',open:'Open'}[s];return `<li><button class="rbtn r-${s}" data-route="${id}"><span>${esc(STATIONS[id].name)}</span><small>${s==='current'?'▶ ':s==='done'?'✓ ':''}${lab}</small></button></li>`;}).join('');
  document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{ctx.closeDrawers();ctx.travel(b.dataset.route);});
  hotspots.forEach(h=>{if(h.el){const s=status(h.station);h.el.className='marker m-'+s;h.el.setAttribute('aria-label',h.label+(s==='locked'?' (later step)':s==='current'?' (current step)':''));}});
  ctx&&ctx.textMode&&ctx.renderTextMode();sync3D();}
