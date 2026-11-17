// Furniture, fixtures and props. Procedural geometry with PBR materials (real-world scale: 1 unit = 1 m).
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {MAT,canvasTexture,SANS,SERIF,HAND,wrap,fit} from './materials.js';

export function mk(geo,mat,cast=true){const m=new THREE.Mesh(geo,mat);m.castShadow=cast;m.receiveShadow=true;return m;}
export function rb(w,h,d,r,mat,seg=3){r=Math.max(.0005,Math.min(r,w/2-.0002,h/2-.0002,d/2-.0002));return mk(new RoundedBoxGeometry(w,h,d,seg,r),mat);}
export const bx=(w,h,d,mat,cast=true)=>mk(new THREE.BoxGeometry(w,h,d),mat,cast);
export const cy=(a,b,h,mat,seg=24)=>mk(new THREE.CylinderGeometry(a,b,h,seg),mat);
export function at(o,x,y,z,ry=0){o.position.set(x,y,z);if(ry)o.rotation.y=ry;return o;}
export function group(...k){const g=new THREE.Group();k.forEach(o=>g.add(o));return g;}

/* contact shadow decal (cheap soft AO under furniture) */
let csTex=null;
export function contact(w,d,op=.5){if(!csTex)csTex=canvasTexture(128,128,(x,W,H)=>{const g=x.createRadialGradient(W/2,H/2,4,W/2,H/2,W/2);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.55,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,W,H);},{srgb:false});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:'#000',alphaMap:csTex,transparent:true,opacity:op,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
  m.rotation.x=-Math.PI/2;m.position.y=.002;m.renderOrder=1;m.userData.contact=true;return m;}

/* ---------- desk ---------- */
export function executiveDesk(w=1.8,d=.85,h=.75){const g=new THREE.Group();const wn=MAT.walnut(w,d),wv=MAT.walnut(.9,.9);
  g.add(at(rb(w,.04,d,.008,wn),0,h-.02,0));
  g.add(at(rb(.04,h-.04,d-.08,.006,wv),-w/2+.06,(h-.04)/2,0));
  const ped=at(rb(.46,h-.07,d-.1,.006,wv),w/2-.27,(h-.07)/2+.01,0);g.add(ped);
  for(let i=0;i<3;i++){const y=.1+i*.215;g.add(at(rb(.42,.19,.02,.004,MAT.walnut(.5,.3)),w/2-.27,y+.1,d/2-.04));
    g.add(at(rb(.16,.012,.022,.005,MAT.steel()),w/2-.27,y+.16,d/2-.022));}
  g.add(at(rb(w-.14,.42,.02,.004,wv),0,h-.27,-d/2+.06));
  const pad=at(rb(.95,.004,.5,.002,new THREE.MeshStandardMaterial({color:'#2F3A35',roughness:.6})),-.1,h+.002,.1);g.add(pad);
  g.add(at(contact(w+.3,d+.3,.45),0,0,0));return g;}

/* ---------- ergonomic office chair ---------- */
function bendGeo(geo,k){const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,p.getZ(i)+k*x*x);}geo.computeVertexNormals();return geo;}
export function officeChair({seat=MAT.fabric('#3B4148'),arms=true,high=true}={}){const g=new THREE.Group();const blk=MAT.plastic('#1B1D20'),chr=MAT.chrome();
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const leg=rb(.31,.035,.055,.012,MAT.blackMetal());leg.position.set(Math.cos(a)*.15,.085,Math.sin(a)*.15);leg.rotation.y=-a;g.add(leg);
    const cx=Math.cos(a)*.3,cz=Math.sin(a)*.3;const fork=bx(.03,.04,.04,blk);fork.position.set(cx,.06,cz);g.add(fork);
    const wh=cy(.028,.028,.024,blk,18);wh.rotation.z=Math.PI/2;wh.rotation.y=-a;wh.position.set(cx,.03,cz);g.add(wh);}
  g.add(at(cy(.04,.045,.05,MAT.blackMetal()),0,.1,0));g.add(at(cy(.022,.022,.3,chr),0,.27,0));g.add(at(cy(.032,.032,.12,blk),0,.17,0));
  g.add(at(rb(.26,.05,.24,.01,MAT.blackMetal()),0,.43,0));
  g.add(at(rb(.5,.075,.48,.03,seat,4),0,.48,.01));
  const spine=rb(.06,.42,.025,.01,MAT.blackMetal());spine.position.set(0,.66,-.24);spine.rotation.x=-.12;g.add(spine);
  const bh=high?.62:.48;const bg=bendGeo(new RoundedBoxGeometry(.47,bh,.05,4,.025),.32);const back=mk(bg,seat);back.position.set(0,.84+(high?.06:0),-.27);back.rotation.x=-.1;g.add(back);
  if(arms)[-1,1].forEach(s=>{g.add(at(rb(.03,.22,.04,.01,MAT.blackMetal()),s*.27,.58,0));g.add(at(rb(.07,.025,.24,.012,MAT.plastic('#2A2D31')),s*.27,.7,.01));});
  g.add(contact(.75,.75,.4));return g;}

/* ---------- bookcase with real-looking books (instanced per spine design) ---------- */
const SPINES=[
 {c:'#5B1F22',t:'Federal Reporter',bands:2,h:[.27,.29]},{c:'#1F2F45',t:'U.S. Code Annotated',bands:3,h:[.25,.27]},
 {c:'#2E4A33',t:'Restatement (Second)',bands:2,h:[.24,.26]},{c:'#6B4B23',t:'Corpus Juris Secundum',bands:2,h:[.27,.28]},
 {c:'#7A2C1F',t:'American Jurisprudence',bands:2,h:[.26,.28]},{c:'#23262B',t:'Supreme Court Reporter',bands:3,h:[.24,.25]},
 {c:'#3A3F5C',t:'Uniform Commercial Code',bands:1,h:[.23,.25]},{c:'#E6DED0',t:'Law Review',bands:0,h:[.24,.25],dark:true},
 {c:'#8C6A3C',t:'State Statutes',bands:2,h:[.25,.27]}];
const spineMats=SPINES.map((s,i)=>{const tex=canvasTexture(64,512,(x,W,H)=>{x.fillStyle=s.c;x.fillRect(0,0,W,H);
    for(let k=0;k<1500;k++){x.fillStyle=`rgba(${Math.random()>.5?255:0},${Math.random()>.5?255:0},${Math.random()>.5?255:0},.03)`;x.fillRect(Math.random()*W,Math.random()*H,2,2);}
    const gold=s.dark?'#3A3328':'#C9A65A';x.fillStyle=gold;
    for(let b=0;b<s.bands;b++){x.fillRect(0,40+b*14,W,4);x.fillRect(0,H-60-b*14,W,4);}
    x.fillStyle=s.dark?'#22201C':'#1A1715';x.fillRect(8,120,W-16,90);x.strokeStyle=gold;x.lineWidth=2;x.strokeRect(10,122,W-20,86);
    x.save();x.translate(W/2,165);x.rotate(-Math.PI/2);x.fillStyle=gold;x.textAlign='center';x.textBaseline='middle';x.font=`700 15px ${SERIF}`;x.fillText(s.t.split(' ')[0],0,0);x.restore();
    x.fillStyle=gold;x.font=`700 20px ${SERIF}`;x.textAlign='center';x.fillText(String(10+i*7),W/2,300);});
  const side=new THREE.MeshStandardMaterial({color:s.c,roughness:.7});const top=MAT.paper('#EFE8D8');
  return [side,side,top,top,new THREE.MeshStandardMaterial({map:tex,roughness:.6}),side];});
export class BookFiller{constructor(){this.lists=SPINES.map(()=>[]);}
  fillShelf(x0,x1,y,z,depth,face,rnd){let x=x0;let set=Math.floor(rnd()*SPINES.length),run=0;
    while(x<x1-.02){if(run<=0){set=Math.floor(rnd()*SPINES.length);run=6+Math.floor(rnd()*14);}
      if(rnd()<.05&&run>4){x+=.04+rnd()*.06;run=0;continue;}
      const s=SPINES[set],t=.028+rnd()*.03,hh=s.h[0]+rnd()*(s.h[1]-s.h[0]),dd=depth*(.78+rnd()*.12);if(x+t>x1)break;
      const m=new THREE.Matrix4();const lean=(run===1&&rnd()<.15)?.12:0;
      m.compose(new THREE.Vector3(face===1?x+t/2:x+t/2,y+hh/2,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,lean)),new THREE.Vector3(t,hh,dd));
      this.lists[set].push({m,face});x+=t+.002;run--;}}
  build(parent){const geo=new THREE.BoxGeometry(1,1,1);this.lists.forEach((L,i)=>{if(!L.length)return;const im=new THREE.InstancedMesh(geo,spineMats[i],L.length);
    const col=new THREE.Color();L.forEach((b,k)=>{im.setMatrixAt(k,b.m);const v=.88+Math.random()*.2;im.setColorAt(k,col.setRGB(v,v,v));});
    im.castShadow=true;im.receiveShadow=true;parent.add(im);});}}
export function bookcase(w,h,d,books,worldMatrixFn){const g=new THREE.Group();const wn=MAT.walnut(w,h),wv=MAT.walnut(.4,h);
  [-1,1].forEach(s=>g.add(at(rb(.03,h,d,.004,wv),s*(w/2-.015),h/2,0)));
  g.add(at(rb(w+.04,.04,d+.03,.006,wn),0,h+.02,.0));g.add(at(rb(w+.07,.03,d+.05,.006,wn),0,h+.055,.0));
  g.add(at(rb(w-.06,.09,d-.03,.004,MAT.walnut(1,.1)),0,.045,-.01));
  g.add(at(bx(w-.04,h-.1,.012,MAT.walnut(w,h)),0,h/2+.04,-d/2+.006));
  const n=Math.round((h-.12)/.36);const step=(h-.12)/n;const shelves=[];
  for(let i=0;i<=n;i++){const y=.09+i*step;g.add(at(rb(w-.05,.022,d-.02,.003,wn),0,y,0));if(i<n)shelves.push(y+.011);}
  g.add(contact(w+.25,d+.35,.4));g.userData.shelves=shelves;return g;}

/* ---------- lamps / light fixtures ---------- */
export function bankersLamp(){const g=new THREE.Group();const brass=MAT.brass();
  g.add(at(cy(.075,.085,.025,brass,32),0,.0125,0));g.add(at(cy(.012,.012,.3,brass),0,.16,0));
  const arm=cy(.009,.009,.16,brass);arm.rotation.x=Math.PI/2;arm.position.set(0,.31,.02);g.add(arm);
  const shadeM=new THREE.MeshPhysicalMaterial({color:'#11553A',roughness:.12,clearcoat:1,clearcoatRoughness:.08,side:THREE.DoubleSide,emissive:'#0d3a24',emissiveIntensity:.25});
  const sh=mk(new THREE.CylinderGeometry(.09,.09,.3,40,1,true,0,Math.PI),shadeM);sh.rotation.z=Math.PI/2;sh.position.set(0,.36,.06);g.add(sh);
  const inner=mk(new THREE.CylinderGeometry(.087,.087,.29,40,1,true,0,Math.PI),new THREE.MeshStandardMaterial({color:'#F4E6C0',emissive:'#FFE2A8',emissiveIntensity:.8,side:THREE.BackSide}),false);inner.rotation.copy(sh.rotation);inner.position.copy(sh.position);g.add(inner);
  const bulb=mk(new THREE.CapsuleGeometry(.018,.15,6,12),new THREE.MeshBasicMaterial({color:'#FFF1CF'}),false);bulb.rotation.z=Math.PI/2;bulb.position.set(0,.33,.06);g.add(bulb);
  const chain=cy(.002,.002,.09,brass,6);chain.position.set(.06,.29,.08);g.add(chain);g.add(at(mk(new THREE.SphereGeometry(.008,10,8),brass),.06,.245,.08));
  g.userData.lightPos=new THREE.Vector3(0,.3,.07);return g;}
export function ceilingPanel(w=1.2,d=.6){const g=new THREE.Group();g.add(at(rb(w+.04,.03,d+.04,.005,MAT.trim('#E6E8EA')),0,-.015,0));
  const dif=mk(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({color:'#ffffff',emissive:'#FFF8EC',emissiveIntensity:1.6}),false);dif.rotation.x=Math.PI/2;dif.position.y=-.031;g.add(dif);return g;}

/* ---------- computer ---------- */
export function monitor(screenTex){const g=new THREE.Group();const blk=MAT.plastic('#141618'),al=MAT.steel();
  g.add(at(rb(.24,.012,.17,.006,al),0,.006,0));const neck=rb(.05,.3,.02,.006,al);neck.position.set(0,.16,-.03);neck.rotation.x=-.08;g.add(neck);
  const body=at(rb(.62,.37,.022,.006,blk),0,.36,-.01);g.add(body);
  const scr=mk(new THREE.PlaneGeometry(.596,.336),new THREE.MeshStandardMaterial({map:screenTex,emissive:'#ffffff',emissiveMap:screenTex,emissiveIntensity:.55,roughness:.25}),false);scr.position.set(0,.365,.0015);g.add(scr);g.userData.screen=scr;return g;}
export function keyboard(){const g=new THREE.Group();g.add(at(rb(.43,.01,.13,.004,MAT.steel()),0,.005,0));
  const keyG=new RoundedBoxGeometry(.0165,.007,.0165,2,.003);const im=new THREE.InstancedMesh(keyG,MAT.plastic('#EDEEEF'),6*15);let k=0;const m=new THREE.Matrix4();
  for(let r=0;r<6;r++)for(let c=0;c<15;c++){const x=-.2+c*.0193+(r%2)*.004,z=-.05+r*.0193;if(r===5&&c>3&&c<11){m.makeScale(c===4?1:0.0001,1,1);}else m.identity();
    m.setPosition(x,.0135,z);if(r===5&&c===4){m.makeScale(7.2,1,1);m.setPosition(-.2+7.5*.0193,.0135,z);}im.setMatrixAt(k++,m);}
  im.castShadow=false;im.receiveShadow=true;g.add(im);return g;}
export function mouse(){const m=mk(new THREE.SphereGeometry(.03,24,16),MAT.plastic('#EDEEEF'));m.scale.set(1,.45,1.8);m.position.y=.012;return m;}
export function mug(color='#F4F4F1'){const g=new THREE.Group();const c=new THREE.MeshStandardMaterial({color,roughness:.25});
  const pts=[[0,0],[.038,0],[.041,.004],[.043,.095],[.04,.095],[.038,.008],[0,.008]].map(p=>new THREE.Vector2(p[0],p[1]));g.add(mk(new THREE.LatheGeometry(pts,40),c));
  const h=mk(new THREE.TorusGeometry(.025,.006,10,24,Math.PI*1.2),c);h.rotation.z=-Math.PI*.6;h.position.set(.043,.05,0);g.add(h);
  const cof=mk(new THREE.CircleGeometry(.038,30),new THREE.MeshStandardMaterial({color:'#2E1A0F',roughness:.15}),false);cof.rotation.x=-Math.PI/2;cof.position.y=.075;g.add(cof);return g;}
export function penCup(){const g=new THREE.Group();g.add(at(cy(.038,.036,.1,MAT.blackMetal(),28),0,.05,0));
  [['#1D2731',.0],['#A93F37',.01],['#2E5B88',-.012],['#C7A15A',.015]].forEach((p,i)=>{const pen=cy(.0045,.0045,.15,new THREE.MeshStandardMaterial({color:p[0],roughness:.35}),10);pen.position.set(Math.sin(i*1.7)*.014,.12,Math.cos(i*1.7)*.014);pen.rotation.set(Math.sin(i)*.15,0,Math.cos(i*2)*.15);g.add(pen);});return g;}
export function paperStack(n=6,w=.215,d=.28){const g=new THREE.Group();for(let i=0;i<n;i++){const p=bx(w,.0012,d,MAT.paper(i%3?'#F7F6F1':'#F2F1EA'),false);p.position.set((Math.random()-.5)*.008,.0008+i*.0013,(Math.random()-.5)*.008);p.rotation.y=(Math.random()-.5)*.04;p.receiveShadow=true;g.add(p);}return g;}
export function legalPad(tex){const g=new THREE.Group();g.add(at(bx(.22,.012,.32,MAT.paper('#F3E58C')),0,.006,0));
  const top=mk(new THREE.PlaneGeometry(.215,.3),new THREE.MeshStandardMaterial({map:tex,roughness:.9}),false);top.rotation.x=-Math.PI/2;top.position.set(0,.0125,.008);g.add(top);
  g.add(at(bx(.22,.014,.025,MAT.plastic('#7A2E2A')),0,.007,-.15));return g;}
export function folder(labelTex,color){const g=new THREE.Group();const m=color?new THREE.MeshStandardMaterial({color,roughness:.75}):MAT.manila();
  g.add(at(rb(.24,.006,.31,.002,m),0,.003,0));g.add(at(paperStack(4,.22,.29),0,.006,.0));g.add(at(rb(.24,.004,.31,.002,m),0,.02,0));
  g.add(at(rb(.08,.004,.03,.002,m),-.06,.02,-.165));
  if(labelTex){const l=mk(new THREE.PlaneGeometry(.17,.06),new THREE.MeshStandardMaterial({map:labelTex,roughness:.8}),false);l.rotation.x=-Math.PI/2;l.position.set(0,.0225,.05);g.add(l);}
  return g;}
export function phone(){const g=new THREE.Group();g.add(at(rb(.17,.04,.19,.012,MAT.plastic('#1A1C1F')),0,.02,0));const h=rb(.05,.035,.2,.014,MAT.plastic('#1A1C1F'));h.position.set(-.05,.05,0);g.add(h);
  for(let i=0;i<12;i++)g.add(at(rb(.016,.006,.012,.002,MAT.plastic('#3A3D41')),.025+(i%3)*.024,.043,-.04+Math.floor(i/3)*.022));return g;}

/* ---------- storage & boards ---------- */
export function filingCabinet(labels){const g=new THREE.Group();const p=MAT.powder('#6E767E'),w=.47,d=.62,h=1.33;
  g.add(at(rb(w,h,d,.008,p),0,h/2,0));
  labels.forEach((t,i)=>{const y=h-.17-i*.32;g.add(at(rb(w-.03,.3,.012,.004,MAT.powder('#78808A')),0,y,d/2+.004));
    g.add(at(rb(.16,.022,.03,.006,MAT.chrome()),0,y-.06,d/2+.022));
    const lt=canvasTexture(256,96,(x,W,H)=>{x.fillStyle='#F7F5EE';x.fillRect(0,0,W,H);x.fillStyle='#22262B';x.textAlign='center';x.textBaseline='middle';fit(x,t,W*.9,40,'700',SANS);x.fillText(t,W/2,H/2);});
    const lbl=mk(new THREE.PlaneGeometry(.1,.038),new THREE.MeshStandardMaterial({map:lt,roughness:.7}),false);lbl.position.set(0,y+.07,d/2+.011);g.add(lbl);
    g.add(at(rb(.115,.05,.006,.002,MAT.chrome()),0,y+.07,d/2+.008));});
  g.add(contact(w+.25,d+.25,.45));return g;}
export function whiteboard(tex,w=1.8,h=1.1){const g=new THREE.Group();const al=MAT.steel();
  g.add(at(rb(w+.04,h+.04,.025,.008,al),0,0,0));const b=mk(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,roughness:.18}),false);b.position.z=.0135;g.add(b);
  g.add(at(rb(w*.6,.03,.07,.006,al),0,-h/2-.03,.035));[['#1F4C8F',-.15],['#B33A32',-.05],['#1E1E1E',.05]].forEach(m=>{const mk_=cy(.009,.009,.13,MAT.plastic(m[0]),12);mk_.rotation.z=Math.PI/2;mk_.position.set(m[1],-h/2-.005,.05);g.add(mk_);});
  return g;}
export function wallDisplay(tex,w=1.65,h=.95){const g=new THREE.Group();g.add(at(rb(w+.03,h+.03,.045,.008,MAT.plastic('#0E0F10')),0,0,0));
  const scr=mk(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,emissive:'#ffffff',emissiveMap:tex,emissiveIntensity:.6,roughness:.2}),false);scr.position.z=.0235;g.add(scr);g.userData.screen=scr;return g;}
export function pinboard(w=1.5,h=1.0){const g=new THREE.Group();const cork=canvasTexture(512,340,(x,W,H)=>{x.fillStyle='#B88B5B';x.fillRect(0,0,W,H);for(let i=0;i<9000;i++){const v=Math.random();x.fillStyle=`rgba(${v>.5?95:225},${v>.5?60:185},${v>.5?30:120},${Math.random()*.35})`;x.fillRect(Math.random()*W,Math.random()*H,1+Math.random()*2,1+Math.random()*2);}});
  g.add(at(rb(w+.05,h+.05,.03,.006,MAT.steel()),0,0,0));const c=mk(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:cork,roughness:1}),false);c.position.z=.0155;g.add(c);return g;}
export function card(tex,w=.3,h=.2){const g=new THREE.Group();const p=mk(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,roughness:.85}),false);g.add(p);
  const pin=mk(new THREE.SphereGeometry(.009,12,10),new THREE.MeshStandardMaterial({color:'#B8322B',roughness:.3}));pin.position.set(0,h/2-.02,.008);g.add(pin);return g;}

/* ---------- tables, counters ---------- */
export function meetingTable(l=3.0,w=1.1,h=.74){const g=new THREE.Group();g.add(at(rb(l,.045,w,.012,MAT.walnut(l,w)),0,h-.0225,0));
  [-1,1].forEach(s=>{const x=s*(l/2-.45);g.add(at(rb(.08,h-.07,.08,.01,MAT.steel()),x,(h-.05)/2,0));g.add(at(rb(.08,.03,w-.2,.01,MAT.steel()),x,.015,0));g.add(at(rb(.08,.025,w-.3,.01,MAT.steel()),x,h-.06,0));});
  g.add(contact(l+.4,w+.5,.4));return g;}
export function readingTable(l=1.8,w=.9,h=.76){const g=new THREE.Group();g.add(at(rb(l,.05,w,.01,MAT.walnut(l,w)),0,h-.025,0));g.add(at(rb(l-.12,.08,w-.12,.004,MAT.walnut(l,.1)),0,h-.09,0));
  [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(s=>{const leg=mk(new THREE.CylinderGeometry(.03,.022,h-.05,20),MAT.walnut(.1,.7));leg.position.set(s[0]*(l/2-.08),(h-.05)/2,s[1]*(w/2-.08));g.add(leg);});
  g.add(contact(l+.4,w+.4,.4));return g;}
export function receptionCounter(l=2.4,d=.7,h=1.05){const g=new THREE.Group();
  g.add(at(rb(l,.04,d+.06,.01,MAT.stone()),0,h,0));g.add(at(rb(l-.04,.03,d-.12,.008,MAT.stone()),0,.75,.05));
  const slat=new RoundedBoxGeometry(.045,h-.08,.035,2,.008);const im=new THREE.InstancedMesh(slat,MAT.oak(.1,1),Math.floor(l/.06));const m=new THREE.Matrix4();
  for(let i=0;i<im.count;i++){m.makeTranslation(-l/2+.03+i*.06,(h-.08)/2+.04,d/2-.02);im.setMatrixAt(i,m);}im.castShadow=im.receiveShadow=true;g.add(im);
  g.add(at(bx(l-.02,h-.08,.02,MAT.plastic('#2A2622')),0,(h-.08)/2+.04,d/2-.045));
  [-1,1].forEach(s=>g.add(at(rb(.04,h,d,.006,MAT.oak(.6,1)),s*(l/2-.02),h/2,0)));
  g.add(at(bx(l-.08,.04,d,MAT.plastic('#2A2622')),0,.02,0));g.add(contact(l+.4,d+.4,.45));return g;}
export function coffeeTable(l=1.1,w=.6){const g=new THREE.Group();g.add(at(rb(l,.03,w,.008,MAT.stone()),0,.42,0));
  [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(s=>g.add(at(rb(.025,.405,.025,.006,MAT.blackMetal()),s[0]*(l/2-.05),.2,s[1]*(w/2-.05))));
  g.add(at(rb(l-.08,.015,w-.08,.004,MAT.blackMetal()),0,.12,0));g.add(contact(l+.3,w+.3,.4));return g;}
export function credenza(l=1.6,d=.45,h=.72){const g=new THREE.Group();g.add(at(rb(l,h-.06,d,.008,MAT.walnut(l,h)),0,(h-.06)/2+.06,0));
  for(let i=0;i<3;i++){g.add(at(rb(l/3-.02,h-.12,.012,.003,MAT.walnut(.5,h)),-l/3+i*l/3,(h-.06)/2+.06,d/2+.003));g.add(at(rb(.012,.16,.02,.004,MAT.brass()),-l/3+i*l/3+(l/6-.06),(h-.06)/2+.08,d/2+.016));}
  [[-1],[1]].forEach(s=>g.add(at(rb(.03,.06,d-.08,.004,MAT.blackMetal()),s[0]*(l/2-.08),.03,0)));g.add(contact(l+.3,d+.3,.45));return g;}

/* ---------- architecture details ---------- */
export function doorLeaf(w=.92,h=2.1,mat){const g=new THREE.Group();g.add(at(rb(w,h,.045,.004,mat||MAT.walnut(w,h)),w/2,h/2,0));
  [-1,1].forEach(s=>{g.add(at(rb(.13,.02,.02,.008,MAT.steel()),w-.12,1.02,s*.035));g.add(at(cy(.02,.02,.02,MAT.steel()),w-.07,1.02,s*.03));});
  g.children.forEach(c=>{if(c.geometry.type==='CylinderGeometry')c.rotation.x=Math.PI/2;});return g;}
export function casing(w,h,depth){const g=new THREE.Group();const t=MAT.trim();[-1,1].forEach(s=>g.add(at(rb(.07,h+.035,depth+.03,.006,t),s*(w/2+.035),(h+.035)/2,0)));g.add(at(rb(w+.14,.07,depth+.03,.006,t),0,h+.035,0));return g;}
export function windowUnit(w,h,blindDrop=.35){const g=new THREE.Group();const fr=MAT.powder('#3B4046');const f=.05;
  g.add(at(bx(w,f,.08,fr),0,-h/2+f/2,0));g.add(at(bx(w,f,.08,fr),0,h/2-f/2,0));[-1,1].forEach(s=>g.add(at(bx(f,h,.08,fr),s*(w/2-f/2),0,0)));
  const mull=Math.max(1,Math.round(w/1.2));for(let i=1;i<mull;i++)g.add(at(bx(.04,h-f*2,.07,fr),-w/2+i*w/mull,0,0));g.add(at(bx(w-f*2,.035,.06,fr),0,-h/2+h*.28,0));
  const gl=mk(new THREE.PlaneGeometry(w-f*2,h-f*2),MAT.glass(),false);gl.castShadow=false;g.add(gl);
  const sill=rb(w+.12,.03,.24,.006,MAT.stone());sill.position.set(0,-h/2-.015,.1);g.add(sill);
  if(blindDrop>0){const bl=bx(w-.06,h*blindDrop,.006,MAT.fabric('#E3DED3'));bl.position.set(0,h/2-.08-h*blindDrop/2,.07);bl.material=bl.material.clone();bl.material.transparent=true;bl.material.opacity=.92;g.add(bl);
    g.add(at(cy(.03,.03,w-.04,MAT.trim('#EDEBE6')),0,h/2-.05,.07));g.children[g.children.length-1].rotation.z=Math.PI/2;
    g.add(at(bx(w-.06,.02,.015,MAT.steel()),0,h/2-.08-h*blindDrop,.07));}
  return g;}
export function artwork(seed,w=.9,h=.65){const tex=canvasTexture(512,Math.round(512*h/w),(x,W,H)=>{let s=seed;const r=()=>{s=(s*9301+49297)%233280;return s/233280;};
    x.fillStyle=['#E9E3D6','#DCE3E6','#E8DED3'][seed%3];x.fillRect(0,0,W,H);
    for(let i=0;i<7;i++){x.globalAlpha=.55+r()*.35;x.fillStyle=['#2E4A5C','#B8875A','#6E7F73','#C9B79C','#3B3B3B','#9AA9B3'][Math.floor(r()*6)];
      if(r()<.5){x.beginPath();x.arc(r()*W,r()*H,30+r()*120,0,7);x.fill();}else x.fillRect(r()*W*.8,r()*H*.8,60+r()*200,20+r()*140);}
    x.globalAlpha=.08;for(let i=0;i<3000;i++){x.fillStyle=r()>.5?'#000':'#fff';x.fillRect(r()*W,r()*H,1,1);}x.globalAlpha=1;});
  const g=new THREE.Group();g.add(at(rb(w+.06,h+.06,.035,.004,MAT.blackMetal()),0,0,0));g.add(at(bx(w-.04,h-.04,.002,MAT.paper('#FBFAF6'),false),0,0,.018));
  const p=mk(new THREE.PlaneGeometry(w-.16,h-.16),new THREE.MeshStandardMaterial({map:tex,roughness:.85}),false);p.position.z=.02;g.add(p);return g;}
export function framedDoc(tex,w=.4,h=.3){const g=new THREE.Group();g.add(at(rb(w+.04,h+.04,.025,.003,MAT.plastic('#1E1A17')),0,0,0));const p=mk(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,roughness:.6}),false);p.position.z=.0135;g.add(p);return g;}
export function signPlate(text,sub){const tex=canvasTexture(512,180,(x,W,H)=>{x.fillStyle='#2B3036';x.fillRect(0,0,W,H);x.fillStyle='#F2F2F0';x.textAlign='left';x.textBaseline='middle';fit(x,text,W*.86,56,'600',SANS);x.fillText(text,34,sub?72:H/2);if(sub){x.fillStyle='#AEB6BE';x.font=`400 30px ${SANS}`;x.fillText(sub,34,130);}});
  const g=new THREE.Group();g.add(at(rb(.3,.105,.008,.002,MAT.blackMetal()),0,0,0));const p=mk(new THREE.PlaneGeometry(.29,.1),new THREE.MeshStandardMaterial({map:tex,roughness:.5}),false);p.position.z=.0045;g.add(p);return g;}
export function wallPlate(kind='outlet'){const g=new THREE.Group();g.add(at(rb(.08,.12,.008,.003,MAT.trim('#F6F6F4')),0,0,0));
  if(kind==='outlet'){[-1,1].forEach(s=>g.add(at(bx(.012,.012,.004,MAT.plastic('#9AA0A6'),false),0,s*.025,.005)));}else g.add(at(rb(.025,.045,.01,.003,MAT.trim('#FFFFFF')),0,0,.006));return g;}
export function wallClock(){const g=new THREE.Group();const face=canvasTexture(256,256,()=>{});g.userData.face=face;
  g.add(at(cy(.17,.17,.035,MAT.blackMetal(),48),0,0,0));g.children[0].rotation.x=Math.PI/2;
  const f=mk(new THREE.CircleGeometry(.155,48),new THREE.MeshStandardMaterial({map:face,roughness:.4}),false);f.position.z=.0185;g.add(f);
  const gl=mk(new THREE.CircleGeometry(.158,48),MAT.glass(),false);gl.position.z=.02;g.add(gl);return g;}
export function rug(w,d,color='#5A3A30',border='#C2A372'){const tex=canvasTexture(512,Math.round(512*d/w),(x,W,H)=>{x.fillStyle=color;x.fillRect(0,0,W,H);x.strokeStyle=border;x.lineWidth=12;x.strokeRect(22,22,W-44,H-44);x.lineWidth=4;x.strokeRect(46,46,W-92,H-92);
    for(let i=0;i<6000;i++){x.fillStyle=`rgba(${Math.random()>.5?255:0},${Math.random()>.5?255:0},${Math.random()>.5?255:0},.035)`;x.fillRect(Math.random()*W,Math.random()*H,2,2);}});
  const m=new THREE.MeshStandardMaterial({map:tex,normalMap:MAT.carpet('#fff',w,d).normalMap,roughness:1,normalScale:new THREE.Vector2(.8,.8)});
  const r=rb(w,.008,d,.003,m);r.position.y=.004;r.castShadow=false;
  // flat top UV for rounded box: use a plane on top for the pattern
  const top=mk(new THREE.PlaneGeometry(w-.01,d-.01),m,false);top.rotation.x=-Math.PI/2;top.position.y=.0085;const g=new THREE.Group();g.add(r,top);r.material=MAT.carpet(color,w,d);return g;}

/* ---------- maquettes (architectural models: white matte board is the realistic finish) ---------- */
export function courthouseModel(kind,plaqueTex){const g=new THREE.Group();const m=MAT.model(),dark=new THREE.MeshStandardMaterial({color:'#9C9890',roughness:.9});
  g.add(at(rb(.86,.03,.62,.004,MAT.walnut(.9,.6)),0,.015,0));
  const grass=bx(.82,.004,.58,new THREE.MeshStandardMaterial({color:'#B9C2AE',roughness:1}),false);grass.position.y=.032;g.add(grass);
  [[.6,.02,.42],[.56,.02,.39],[.52,.02,.36]].forEach((s,i)=>g.add(at(bx(s[0],s[1],s[2],m),0,.044+i*.02,0)));
  const top=.094;g.add(at(bx(.44,.16,.26,m),0,top+.08,-.04));
  for(let i=0;i<6;i++){const x=-.2+i*.08;g.add(at(cy(.011,.013,.15,m,16),x,top+.075,.115));g.add(at(bx(.028,.008,.028,m),x,top+.154,.115));g.add(at(bx(.028,.006,.028,m),x,top+.003,.115));}
  for(let i=0;i<5;i++)g.add(at(bx(.022,.05,.002,dark,false),-.16+i*.08,top+.07,.091));
  g.add(at(bx(.5,.03,.33,m),0,top+.172,0));
  if(kind==='state'){const sh=new THREE.Shape();sh.moveTo(-.25,0);sh.lineTo(.25,0);sh.lineTo(0,.09);sh.lineTo(-.25,0);const pg=new THREE.ExtrudeGeometry(sh,{depth:.33,bevelEnabled:false});pg.translate(0,0,-.165);g.add(at(mk(pg,m),0,top+.187,0));
    const ck=mk(new THREE.CircleGeometry(.018,24),dark,false);ck.position.set(0,top+.22,.166);g.add(ck);}
  else{g.add(at(cy(.09,.09,.06,m,40),0,top+.217,-.02));const dm=mk(new THREE.SphereGeometry(.09,40,20,0,Math.PI*2,0,Math.PI/2),m);dm.position.set(0,top+.247,-.02);g.add(dm);
    g.add(at(cy(.012,.012,.04,m,12),0,top+.35,-.02));for(let i=0;i<12;i++){const a=i/12*Math.PI*2;g.add(at(cy(.004,.004,.055,dark,6),Math.cos(a)*.091,top+.217,-.02+Math.sin(a)*.091));}}
  const pl=mk(new THREE.PlaneGeometry(.3,.06),new THREE.MeshStandardMaterial({map:plaqueTex,roughness:.4,metalness:.3}),false);pl.position.set(0,.016,.311);g.add(pl);
  g.add(contact(1.0,.8,.35));return g;}

/* ---------- books for the library station ---------- */
export function heroBook(coverTex,color){const g=new THREE.Group();const cv=new THREE.MeshStandardMaterial({color,roughness:.55});const W=.21,H=.29,D=.05;
  g.add(at(rb(W,H,.006,.002,cv),0,H/2,D/2-.003));g.add(at(rb(W,H,.006,.002,cv),0,H/2,-D/2+.003));g.add(at(rb(.012,H,D,.004,cv),-W/2+.004,H/2,0));
  g.add(at(bx(W-.012,H-.012,D-.012,MAT.paper('#F1EBDD')),.004,H/2,0));
  const t=mk(new THREE.PlaneGeometry(W-.01,H-.01),new THREE.MeshStandardMaterial({map:coverTex,roughness:.5}),false);t.position.set(0,H/2,D/2+.0005);g.add(t);g.userData.cover=cv;g.userData.title=t.material;return g;}
export function bookStand(){const g=new THREE.Group();const w=MAT.walnut(.6,.4);const base=rb(.62,.02,.26,.004,w);base.position.y=.01;g.add(base);
  g.add(at(rb(.62,.035,.025,.006,w),0,.0175+.02,.075));g.add(at(rb(.62,.12,.02,.004,w),0,.08,-.12));return g;}

/* ---------- upholstered guest armchair ---------- */
export function guestChair(up=MAT.leather('#5A3A2A')){const g=new THREE.Group();const wd=MAT.walnut(.3,.5);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(s=>{const leg=mk(new THREE.CylinderGeometry(.018,.012,.24,16),wd);leg.position.set(s[0]*.25,.12,s[1]*.23);leg.rotation.z=s[0]*.06;leg.rotation.x=-s[1]*.06;g.add(leg);});
  g.add(at(rb(.6,.06,.58,.012,wd),0,.26,0));
  g.add(at(rb(.5,.1,.5,.04,up,4),0,.34,.02));
  const bg=bendGeo(new RoundedBoxGeometry(.6,.5,.09,4,.04),.35);const back=mk(bg,up);back.position.set(0,.55,-.25);back.rotation.x=-.12;g.add(back);
  [-1,1].forEach(s=>{const arm=rb(.08,.26,.56,.035,up,4);arm.position.set(s*.29,.42,0);g.add(arm);});
  g.add(contact(.85,.85,.45));return g;}
export function sideTable(){const g=new THREE.Group();g.add(at(cy(.25,.25,.025,MAT.walnut(.5,.5),40),0,.55,0));g.add(at(cy(.02,.02,.53,MAT.brass(),16),0,.27,0));g.add(at(cy(.16,.18,.02,MAT.brass(),32),0,.01,0));g.add(contact(.6,.6,.35));return g;}
