import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {buildWorld,hotspots,STATIONS,dyn,CEIL,roomOf,START_VIEW} from './world.js';
import {Nav} from './nav.js';
import {setAniso,canvasTexture} from './materials.js';
import {S,load,save,status,objective,STEP_STATION} from './state.js';
import {bindUI,refresh,openPanel,closePanel,isOpen,tickClock,flushJobs} from './ui.js';
import {Clients} from './characters.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {ACT_CASES as CASES,ACTIVITY,isOpen as roomOpen} from './activity.js';
import {findPath} from './pathfind.js';
const $=s=>document.querySelector(s);
const PREF_KEY='ridgeway-lab-prefs-v4';
const prefs=Object.assign({motion:matchMedia('(prefers-reduced-motion: reduce)').matches,contrast:false,text:100,profile:null,mode:'3d'},(()=>{try{return JSON.parse(localStorage.getItem(PREF_KEY)||'{}');}catch(e){return {};}})());
const savePrefs=()=>{try{localStorage.setItem(PREF_KEY,JSON.stringify(prefs));}catch(e){}};
const ROOM_TEXT={reception:'Reception: a walnut-slat counter, a leather sofa, and a wall screen listing today’s clients.',corridor:'Corridor: doors with name plates lead to the library, consultation room, strategy room, jurisdiction room, and results room.',
 consult:'Consultation room: an executive desk with the client intake folder, two guest chairs, and a case file board on the right wall.',library:'Law library: floor-to-ceiling bookcases and a reading table with three law books on a stand.',
 courts:'Jurisdiction room: a table with architectural models of a state courthouse and a federal courthouse, and a whiteboard checklist.',strategy:'Strategy room: a meeting table with four strategy dossiers, A to D.',results:'Results and archive room: a wall screen showing the outcome chart, and filing cabinets.'};

let clients=null,staff=null,frameNo=0;
let webgl=true;try{const t=document.createElement('canvas');webgl=!!(t.getContext('webgl2')||t.getContext('webgl'));}catch(e){webgl=false;}
const canvas=$('#c');let renderer=null,composer=null,gtao=null,scene,camera,nav,sun,areaLights=[],lampLights=[],hemi;
function detectProfile(){return 'economy';} // lightest profile by default; Medium/High can be chosen in Settings

const ctx={scene:null,canvasTexture,textMode:false,
  travel(station){if(ctx.textMode||!roomOpen(station)){openPanel(station);return;}closePanel();announce('Walking to the '+STATIONS[station].name+'.');if(station==='consult')callClient();
    const arrive=()=>{if(station==='consult')whenSeated(()=>openPanel(station));else openPanel(station);};
    // Already at this station's view (e.g. calling the next client from the lawyer's chair): stay seated, don't stand up and sit again.
    const v=STATIONS[station].view.pos;if(nav.room===STATIONS[station].room&&Math.hypot(nav.pos.x-v[0],nav.pos.z-v[2])<.35){arrive();return;}
    nav.goTo(station,arrive);},
  onAsk(){const c=curClient();if(c&&c.state==='sit')clients.gesture(c,Math.random()<.5?'agree':'headShake');},
  onClientDone(i){const c=clients&&clients.list[i];if(c){c.look=false;clients.walkTo(c,dyn.seats.exit,{exit:true});}},
  onRestart(){placeClients(true);},
  onPanelOpen(st){nav&&nav.stopAll();if(st==='reception'&&staff&&staff.list[0])staff.gesture(staff.list[0],'agree');const h=document.getElementById('talkHint');if(h)h.hidden=true;},
  closeDrawers(){['#route','#settings'].forEach(s=>{$(s).hidden=true;});document.querySelectorAll('[aria-controls=route],[aria-controls=settings]').forEach(b=>b.setAttribute('aria-expanded','false'));},
  renderTextMode(){const order=['reception','consult','library','courts','strategy','results'];$('#textStations').innerHTML=order.map(id=>{const s=status(id);return `<li><button class="rbtn r-${s}" data-tm="${id}"><span>${STATIONS[id].name}</span><small>${s==='current'?'▶ Current step':s==='done'?'✓ Done':s==='locked'?'Later':s==='closed'?(ACTIVITY.closedNote[id]||'Later in the course'):'Open'}</small></button></li>`;}).join('');
    document.querySelectorAll('[data-tm]').forEach(b=>b.onclick=()=>openPanel(b.dataset.tm));},
  onPanelClose(){}};
bindUI(ctx);
function announce(t){const a=$('#announce');a.textContent='';setTimeout(()=>a.textContent=t,30);}

function applyPrefs(){if(clients)clients.reduced=prefs.motion;document.body.classList.toggle('hc',prefs.contrast);document.documentElement.style.fontSize=prefs.text+'%';$('#setMotion').checked=prefs.motion;$('#setContrast').checked=prefs.contrast;$('#setText').value=String(prefs.text);
  $('#setProfile').value=prefs.profile;$('#setMode').value=prefs.mode;if(nav)nav.reduced=prefs.motion;document.body.classList.toggle('reduced',prefs.motion);setMode(prefs.mode);}
function setMode(m){ctx.textMode=m==='text'||!webgl;document.body.classList.toggle('textmode',ctx.textMode);if(ctx.textMode){ctx.renderTextMode();}}
function applyProfile(p){if(!renderer)return;prefs.profile=p;const dpr=window.devicePixelRatio||1;
  renderer.setPixelRatio(p==='high'?Math.min(dpr,2):p==='medium'?Math.min(dpr,1.25):Math.min(dpr,1));renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  const sh=p!=='economy';if(renderer.shadowMap.enabled!==sh){renderer.shadowMap.enabled=sh;scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);}});}
  sun.castShadow=sh;const ms=p==='high'?4096:2048;if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
  areaLights.forEach(l=>l.visible=p!=='economy');hemi.intensity=p==='economy'?1.1:.35;
  composer=null;if(p==='high'){const rt=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4});composer=new EffectComposer(renderer,rt);composer.addPass(new RenderPass(scene,camera));
    gtao=new GTAOPass(scene,camera,1,1);gtao.output=GTAOPass.OUTPUT.Default;gtao.blendIntensity=.85;gtao.updateGtaoMaterial({radius:.35,distanceExponent:1.5,thickness:1,scale:1});composer.addPass(gtao);composer.addPass(new OutputPass());}
  resize();savePrefs();}
function resize(){if(!renderer)return;const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();if(composer)composer.setSize(w,h);}

async function init(){
  window.__labBooted=true;
  load();applyPrefs();
  if(!webgl){$('#loading').hidden=true;prefs.mode='text';setMode('text');$('#noGL').hidden=false;refresh();return;}
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;setAniso(Math.min(8,renderer.capabilities.getMaxAnisotropy()));
  scene=new THREE.Scene();scene.background=new THREE.Color('#C9D6E0');ctx.scene=scene;
  camera=new THREE.PerspectiveCamera(60,1,.05,200);
  const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(renderer),.04).texture;
  hemi=new THREE.HemisphereLight('#EEF2F6','#8A7A68',.35);scene.add(hemi);
  sun=new THREE.DirectionalLight('#FFF1DE',3.4);sun.position.set(7,10,16);sun.target.position.set(0,0,0);scene.add(sun,sun.target);sun.castShadow=true;
  Object.assign(sun.shadow.camera,{left:-15,right:15,top:12,bottom:-12,near:2,far:45});sun.shadow.bias=-.0003;sun.shadow.normalBias=.02;
  RectAreaLightUniformsLib.init();
  await buildWorld(scene,{onProgress:f=>{$('#loadBar').style.width=Math.round(20+f*80)+'%';}});
  const before=countDraw(scene);mergeStatic(scene);console.info('draw meshes',before,'->',countDraw(scene));
  dyn.areaSpots.forEach(a=>{const l=new THREE.RectAreaLight('#FFF3E4',a[2]==='corridor'?4:6.5,1.2,.6);l.position.set(a[0],CEIL-.04,a[1]);l.lookAt(a[0],0,a[1]);scene.add(l);areaLights.push(l);});
  dyn.lamps.forEach(p=>{const l=new THREE.PointLight('#FFD8A0',2.2,3.2,2);l.position.set(p[0],p[1],p[2]);scene.add(l);lampLights.push(l);});
  scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if('envMapIntensity' in m&&m.envMapIntensity===1)m.envMapIntensity=.42;});}});
  nav=new Nav(camera,canvas);nav.reduced=prefs.motion;nav.setView(START_VIEW.pos,START_VIEW.look);
  clients=new Clients(scene);clients.reduced=prefs.motion;$('#loading p').textContent='Clients arriving…';
  await clients.load(CASES.map(k=>({file:ACTIVITY.models[k.id]})));placeClients(true);nav.people=()=>clients.positions();
  // receptionist: static model rigged automatically, seated at the reception computer
  staff=new Clients(scene);staff.reduced=prefs.motion;await staff.load([{file:'staff_receptionist.glb',autoRig:true,arms:'desk'}]);
  if(staff.list[0]){const r=staff.list[0];staff.seatAt(r,{x:-8.3,z:3.3,ry:Math.PI/2,h:.47});
    hotspots.push({id:'receptionist',station:'reception',label:'Marcus, the receptionist: today’s clients',object:r.holder,anchor:new THREE.Vector3(-8.25,1.45,3.3)});}
  setupMobile();
  nav.onRoom=r=>{if(r==='consult')callClient();announce('You are in the '+(r==='corridor'?'corridor':STATIONS[r]?STATIONS[r].name:r)+'.');canvas.setAttribute('aria-label','3D view. '+ROOM_TEXT[r]);const o=isOpen();if(o&&STATIONS[o].room!==r&&!nav.travel)closePanel();};
  applyProfile(prefs.profile||detectProfile());$('#setProfile').value=prefs.profile;
  $('#loading p').textContent='Preparing the rooms…';await new Promise(r=>setTimeout(r,30));for(let i=0;i<40;i++)flushJobs();warmUp();
  buildMarkers();refresh();
  $('#loading').hidden=true;if(!S.started)$('#intro').hidden=false;else if(touchDevice)$('#gyroAsk').hidden=false;
  window.addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(canvas);
  canvas.addEventListener('pointerup',onClick);canvas.addEventListener('pointermove',onHover);
  let last=performance.now(),acc=0,frames=0,fpsT=0;tickClock();setInterval(tickClock,30000);
  const loop=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;if(!ctx.textMode){nav.update(dt);clients.update(dt,camera);if(staff){const r=staff.list[0];if(r)r.look=Math.hypot(nav.pos.x-r.holder.position.x,nav.pos.z-r.holder.position.z)<3.2;staff.update(dt,camera);}flushJobs();frameNo++;proximityHint();
      if(renderer.shadowMap.enabled&&clients.list.some(c=>c.state!=='sit'&&c.state!=='gone')&&frameNo%3===0)renderer.shadowMap.needsUpdate=true;placeMarkers();if(composer)composer.render();else renderer.render(scene,camera);}
    frames++;fpsT+=dt;if(fpsT>1){window.__fps=frames/fpsT;frames=0;fpsT=0;}requestAnimationFrame(loop);};requestAnimationFrame(loop);
  window.__lab={S,dyn,nav,scene,renderer,applyProfile,openPanel,travel:ctx.travel,hotspots,camera,get clients(){return clients;},callClient,ctx};}

/* ---------- warm-up: compile every shader, upload every texture and build path grids during loading ---------- */
function warmUp(){try{renderer.compile(scene,camera);const seen=new Set();scene.traverse(o=>{if(!o.material)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(mt=>{
    ['map','normalMap','roughnessMap','emissiveMap','alphaMap','metalnessMap','aoMap'].forEach(k=>{const t=mt[k];if(t&&!seen.has(t)){seen.add(t);renderer.initTexture(t);}});});});
  findPath(0,0,1,1,.3);findPath(0,0,1,1,.32);}catch(e){console.warn('warm-up',e);}}
/* ---------- mobile: arrow pad, gyroscope look, look joystick ---------- */
const touchDevice=matchMedia('(pointer: coarse)').matches||('ontouchstart' in window);
function setupMobile(){if(!touchDevice)return;document.body.classList.add('touch');
  const orient=()=>(screen.orientation&&screen.orientation.angle)||window.orientation||0;
  window.addEventListener('deviceorientation',e=>nav&&nav.onOrientation(e.alpha,e.beta,e.gamma,orient()));
  const btn=$('#btnGyro');btn.hidden=false;
  const set=on=>{nav.enableGyro(on);const act=nav.gyro.active;btn.setAttribute('aria-pressed',String(act));btn.textContent=act?'Gyroscope: on':'Gyroscope: off';
    document.body.classList.toggle('gyro',act);prefs.gyro=act;savePrefs();};
  const tryOn=async()=>{try{if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function'){const r=await DeviceOrientationEvent.requestPermission();if(r!=='granted'&&!nav.gyro.has){announce('Motion access was not allowed. Use the look joystick.');set(false);return;}}}catch(_){}
    const t0=performance.now();const wait=()=>{if(nav.gyro.has){set(true);announce('Gyroscope on: move the device to look around.');}else if(performance.now()-t0<1500)setTimeout(wait,100);else{set(false);announce('No gyroscope found. Use the look joystick on the right.');}};wait();};
  btn.onclick=()=>{if(nav.gyro.active)set(false);else tryOn();};
  ctx.autoGyro=()=>{if(prefs.gyro!==false)tryOn();};
  // look joystick (fallback when there is no gyroscope, or when it is off)
  const pad=$('#lookJoy'),knob=pad.querySelector('span');let id=null,cx=0,cy=0;
  const move=e=>{const r=pad.getBoundingClientRect();const R=r.width/2;let dx=e.clientX-(r.left+R),dy=e.clientY-(r.top+R);const d=Math.hypot(dx,dy);if(d>R){dx*=R/d;dy*=R/d;}
    knob.style.transform=`translate(${dx}px,${dy}px)`;nav.joyLook={x:dx/R,y:dy/R};nav.travel=null;};
  pad.addEventListener('pointerdown',e=>{id=e.pointerId;try{pad.setPointerCapture(id);}catch(_){}move(e);e.preventDefault();});
  pad.addEventListener('pointermove',e=>{if(e.pointerId===id)move(e);});
  const up=()=>{id=null;knob.style.transform='';nav.joyLook={x:0,y:0};};['pointerup','pointercancel','lostpointercapture'].forEach(ev=>pad.addEventListener(ev,up));}
/* ---------- proximity prompt: walking up to the receptionist offers a conversation ---------- */
let hintShown=false;
function proximityHint(){const r=staff&&staff.list[0];const el=$('#talkHint');if(!r||!el)return;const d=Math.hypot(nav.pos.x-r.holder.position.x,nav.pos.z-r.holder.position.z);
  const near=d<2.8&&!isOpen()&&!nav.travel;if(near&&!hintShown){el.hidden=false;hintShown=true;}else if(!near&&hintShown){el.hidden=true;hintShown=false;}}
/* ---------- clients ---------- */
function curClient(){return clients&&S.beat!=='end'?clients.list[S.ci]:null;}
function placeClients(initial){if(!clients)return;clients.list.forEach((c,i)=>{c.look=false;c.path=null;
  if(S.beat==='end'||i<S.ci)clients.hide(c);else if(i===S.ci&&S.called){clients.seatAt(c,dyn.seats.guest);c.look=true;}else clients.seatAt(c,dyn.seats.sofa[i]);});}
function callClient(){const c=curClient();if(!c||S.beat!=='intake'||S.called)return;S.called=true;save();announce(CASES[S.ci].client+' is walking to the consultation room.');
  clients.walkTo(c,dyn.seats.guest.stand,{seat:dyn.seats.guest,onDone:()=>{c.look=true;}});}
function whenSeated(fn){const c=curClient();const t0=performance.now();const tick=()=>{if(!c||c.state==='sit'||c.state==='gone'||performance.now()-t0>25000)fn();else setTimeout(tick,250);};tick();}
/* ---------- static batching: merge non-interactive meshes that share a material (far fewer draw calls) ---------- */
function countDraw(root){let n=0;root.traverse(o=>{if(o.isMesh&&o.visible)n++;});return n;}
function mergeStatic(scene){const keep=new Set();const mark=o=>o&&o.traverse(k=>keep.add(k));
  hotspots.forEach(h=>mark(h.object));(dyn.heroBooks||[]).forEach(mark);(dyn.dossiers||[]).forEach(mark);mark(dyn.bookTag);
  if(dyn.verdictTex)Object.values(dyn.verdictTex).forEach(t=>mark(t.userData.card));
  scene.updateMatrixWorld(true);const groups=new Map();
  scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||keep.has(o)||Array.isArray(o.material)||o.morphTargetInfluences||!o.visible)return;
    let p=o.parent,ok=true;while(p){if(p.userData&&p.userData.glb){ok=false;break;}p=p.parent;}if(!ok)return;
    const g=o.geometry;const key=o.material.uuid+'|'+Object.keys(g.attributes).sort().join(',')+'|'+(g.index?1:0)+'|'+o.castShadow+o.receiveShadow+'|'+o.renderOrder;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);});
  groups.forEach(list=>{if(list.length<2)return;const geos=list.map(o=>{const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);return g;});
    const merged=mergeGeometries(geos,false);if(!merged)return;const m0=list[0];const mesh=new THREE.Mesh(merged,m0.material);mesh.castShadow=m0.castShadow;mesh.receiveShadow=m0.receiveShadow;mesh.renderOrder=m0.renderOrder;
    scene.add(mesh);list.forEach(o=>o.parent&&o.parent.remove(o));geos.forEach(g=>g.dispose());});}
/* ---------- hotspots: raycast + accessible HTML markers ---------- */
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
function pick(e){const r=canvas.getBoundingClientRect();mv.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mv,camera);
  const objs=hotspots.map(h=>h.object);const hit=ray.intersectObjects(objs,true)[0];if(!hit||hit.distance>8)return null;let o=hit.object;while(o){const h=hotspots.find(k=>k.object===o);if(h)return h;o=o.parent;}return null;}
function onClick(e){if(nav.moved>6)return;const h=pick(e);if(h)activate(h);}
let hoverT=0;function onHover(e){if(nav.dragging)return;const now=performance.now();if(now-hoverT<80)return;hoverT=now;const h=pick(e);canvas.style.cursor=h?'pointer':'grab';hotspots.forEach(k=>k.el&&k.el.classList.toggle('hover',k===h));}
function activate(h){const st=h.station;const v=STATIONS[st].view.pos;const near=nav.room===STATIONS[st].room&&Math.hypot(nav.pos.x-v[0],nav.pos.z-v[2])<2.6;
  const open=()=>st==='consult'?whenSeated(()=>openPanel(st,h.option)):openPanel(st,h.option);if(st==='consult')callClient();
  if(near)open();else{closePanel();nav.goTo(st,open);}}
function buildMarkers(){const wrap=$('#markers');hotspots.forEach(h=>{if(!h.anchor)return;const b=document.createElement('button');b.type='button';b.className='marker';b.innerHTML=`<span class="dot" aria-hidden="true"></span><span class="tip">${h.label}</span>`;
  b.onclick=()=>activate(h);wrap.appendChild(b);h.el=b;});}
const V=new THREE.Vector3();
function placeMarkers(){const w=canvas.clientWidth,hh=canvas.clientHeight;hotspots.forEach(h=>{if(!h.el)return;const same=roomOf(h.anchor.x,h.anchor.z)===nav.room;V.copy(h.anchor);const d=V.distanceTo(nav.pos);V.project(camera);
  const vis=same&&d<9&&V.z<1&&Math.abs(V.x)<1.02&&Math.abs(V.y)<1.02&&!nav.travel;h.el.hidden=!vis;if(vis){h.el.style.left=((V.x+1)/2*w)+'px';h.el.style.top=((1-V.y)/2*hh)+'px';}});}

/* ---------- chrome: intro, drawers, settings, touch ---------- */
function toggle(id,btn){const el=$('#'+id);const open=el.hidden;ctx.closeDrawers();el.hidden=!open;btn.setAttribute('aria-expanded',String(open));if(open){const f=el.querySelector('button,select,input');f&&f.focus();}}
$('#btnRoute').onclick=e=>toggle('route',e.currentTarget);$('#btnSettings').onclick=e=>toggle('settings',e.currentTarget);
/* ---------- full screen (falls back to a new tab where the Fullscreen API is unavailable, e.g. iPhone) ---------- */
{const b=$('#btnFull');const el=document.documentElement;const req=el.requestFullscreen||el.webkitRequestFullscreen;const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
  const canFS=!!req&&(document.fullscreenEnabled||document.webkitFullscreenEnabled);
  const upd=()=>{const on=!!fsEl();b.textContent=canFS?(on?'Exit full screen':'Full screen'):'Open in new tab';b.setAttribute('aria-pressed',String(on));setTimeout(resize,120);};
  b.onclick=()=>{if(!canFS){window.open(location.href,'_blank','noopener');return;}if(fsEl())(document.exitFullscreen||document.webkitExitFullscreen).call(document);else{const p=req.call(el);if(p&&p.catch)p.catch(()=>window.open(location.href,'_blank','noopener'));}};
  document.addEventListener('fullscreenchange',upd);document.addEventListener('webkitfullscreenchange',upd);upd();}
$('#btnNext').onclick=()=>ctx.travel(STEP_STATION[S.beat]);$('#btnHelp').onclick=()=>{$('#intro').hidden=false;$('#introStart').focus();};
$('#panelClose').onclick=()=>{closePanel();canvas.focus();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#intro').hidden){$('#intro').hidden=true;return;}if(isOpen())closePanel();ctx.closeDrawers();}});
$('#introStart').onclick=()=>{ctx.autoGyro&&ctx.autoGyro();S.started=true;save();$('#intro').hidden=true;prefs.mode='3d';applyPrefs();canvas.focus();announce('You are in the Reception. '+objective());};
$('#introGuided').onclick=()=>{ctx.autoGyro&&ctx.autoGyro();S.started=true;save();$('#intro').hidden=true;prefs.mode='3d';applyPrefs();ctx.travel(STEP_STATION[S.beat]);};
$('#introText').onclick=()=>{S.started=true;save();$('#intro').hidden=true;prefs.mode='text';applyPrefs();};
$('#setMotion').onchange=e=>{prefs.motion=e.target.checked;savePrefs();applyPrefs();};
$('#setContrast').onchange=e=>{prefs.contrast=e.target.checked;savePrefs();applyPrefs();};
$('#setText').onchange=e=>{prefs.text=+e.target.value;savePrefs();applyPrefs();};
$('#setProfile').onchange=e=>applyProfile(e.target.value);
$('#setMode').onchange=e=>{prefs.mode=e.target.value;savePrefs();applyPrefs();if(prefs.mode==='3d')resize();};
document.querySelectorAll('[data-move]').forEach(b=>{const [x,z]=b.dataset.move.split(',').map(Number);
  const on=e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(_){}if(nav){nav.touchMove={x,z};nav.travel=null;}b.classList.add('on');};
  const off=()=>{if(nav)nav.touchMove={x:0,z:0};b.classList.remove('on');};
  b.addEventListener('pointerdown',on);['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,off));b.addEventListener('contextmenu',e=>e.preventDefault());});
init().catch(err=>{console.error(err);$('#loading').hidden=true;webgl=false;prefs.mode='text';setMode('text');$('#noGL').hidden=false;$('#noGL').textContent='The 3D office could not load ('+err.message+'). The full activity is available below in text mode.';refresh();});
