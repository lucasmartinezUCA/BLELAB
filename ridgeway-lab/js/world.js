// Office architecture, rooms, stations and interactive objects. 1 unit = 1 metre.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MAT,canvasTexture,redraw,SANS,SERIF,HAND,wrap,fit,asset} from './materials.js';
import * as B from './builders.js';
const {at,rb,bx,cy}=B;

export const CEIL=2.9;
export const colliders=[];   // {x0,z0,x1,z1}
export const hotspots=[];    // {id,station,label,object,anchor}
export const dyn={};         // dynamic objects updated by the UI layer
export const STATIONS={
  reception:{name:'Reception',room:'reception',view:{pos:[-3.9,1.62,1.45],look:[-8.6,1.15,4.7]}},
  consult:{name:'Consultation room',room:'consult',view:{pos:[0,1.2,-4.62],look:[0,1.0,-2.6]}},
  library:{name:'Law library',room:'library',view:{pos:[-6.6,1.6,-1.85],look:[-6.6,.92,-3.45]}},
  courts:{name:'Jurisdiction room',room:'courts',view:{pos:[0,1.6,1.8],look:[0,.86,3.45]}},
  strategy:{name:'Strategy room',room:'strategy',view:{pos:[6,1.6,-1.55],look:[6,.78,-3.5]}},
  results:{name:'Results room',room:'results',view:{pos:[5.3,1.6,3.4],look:[8.9,1.42,3.4]}}};
export const DOORS={consult:{x:1.6,side:-1},library:{x:-4.2,side:-1},strategy:{x:4.5,side:-1},courts:{x:-1.8,side:1},results:{x:4.2,side:1},reception:{x:-6,side:1}};
export function roomOf(x,z){if(Math.abs(z)<.9)return 'corridor';if(z<0)return x<-3?'library':x<3?'consult':'strategy';return x<-3?'reception':x<3?'courts':'results';}

function addCol(x0,z0,x1,z1){colliders.push({x0:Math.min(x0,x1),z0:Math.min(z0,z1),x1:Math.max(x0,x1),z1:Math.max(z0,z1)});}
function colAround(obj,w,d,cx,cz,ry=0){const c=Math.abs(Math.cos(ry)),s=Math.abs(Math.sin(ry));const W=w*c+d*s,D=w*s+d*c;addCol(cx-W/2,cz-D/2,cx+W/2,cz+D/2);}
function place(scene,obj,x,y,z,ry=0){at(obj,x,y,z,ry);scene.add(obj);return obj;}

/* ---------- walls with openings ---------- */
function wall(scene,axis,c,a0,a1,t,openings=[],{exterior=false,face=1,color='#E4DED3'}={}){
  // axis 'x': runs along x at z=c ; axis 'z': runs along z at x=c
  const segs=[];let cur=a0;openings.slice().sort((p,q)=>p.a-q.a).forEach(o=>{if(o.a>cur)segs.push({a:cur,b:o.a,y0:0,y1:CEIL});if(o.y0>0)segs.push({a:o.a,b:o.b,y0:0,y1:o.y0});if(o.y1<CEIL)segs.push({a:o.a,b:o.b,y0:o.y1,y1:CEIL});cur=o.b;});
  if(cur<a1)segs.push({a:cur,b:a1,y0:0,y1:CEIL});
  segs.forEach(s=>{const L=s.b-s.a,H=s.y1-s.y0;if(L<=0||H<=0)return;const m=MAT.paint(color,L,H);const w=new THREE.Mesh(new THREE.BoxGeometry(axis==='x'?L:t,H,axis==='x'?t:L),m);w.castShadow=w.receiveShadow=true;
    const mid=(s.a+s.b)/2;if(axis==='x')w.position.set(mid,s.y0+H/2,c);else w.position.set(c,s.y0+H/2,mid);scene.add(w);
    if(s.y0===0){if(axis==='x')addCol(s.a,c-t/2,s.b,c+t/2);else addCol(c-t/2,s.a,c+t/2,s.b);
      if(s.y1===CEIL){[-1,1].forEach(side=>{if(exterior&&side!==face)return;const bb=new THREE.Mesh(new THREE.BoxGeometry(axis==='x'?L:.016,.1,axis==='x'?.016:L),MAT.trim());bb.receiveShadow=true;
        if(axis==='x')bb.position.set(mid,.05,c+side*(t/2+.008));else bb.position.set(c+side*(t/2+.008),.05,mid);scene.add(bb);});}}});}

function doorway(scene,axis,c,a,w,t,leafSide,{glass=false,label,sub}={}){const h=2.1;const cas=B.casing(w,h,t);
  if(axis==='x'){cas.position.set(a,0,c);}else{cas.position.set(c,0,a);cas.rotation.y=Math.PI/2;}scene.add(cas);
  const leaf=B.doorLeaf(w-.02,h-.01,glass?MAT.glass():undefined);
  if(axis==='x'){leaf.position.set(a-w/2+.01,0,c+leafSide*(t/2+.03));leaf.rotation.y=leafSide>0?-Math.PI/2:Math.PI/2;}
  scene.add(leaf);
  if(axis==='x'){const x0=a-w/2-.04,z0=c+leafSide*(t/2),z1=c+leafSide*(t/2+w);addCol(x0,z0,x0+.1,z1);}
  if(label){[-1,1].forEach(s=>{const p=B.signPlate(label,sub);if(axis==='x'){p.position.set(a+w/2+.32,1.5,c+s*(t/2+.006));p.rotation.y=s>0?0:Math.PI;}scene.add(p);});}
  return leaf;}

export async function buildWorld(scene,{onProgress}={}){
  const T=.12,TE=.25;
  // floor + ceiling
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(18,12),MAT.floorOak(18,12));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(18,12),MAT.ceiling(18,12));ceil.rotation.x=Math.PI/2;ceil.position.y=CEIL;ceil.receiveShadow=true;ceil.castShadow=true;scene.add(ceil);
  // outside ground & skyline (seen through windows)
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#9AA38F',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.02;ground.receiveShadow=true;scene.add(ground);
  const walk=new THREE.Mesh(new THREE.PlaneGeometry(22,4),new THREE.MeshStandardMaterial({color:'#C9C6BF',roughness:.9}));walk.rotation.x=-Math.PI/2;walk.position.set(0,-.01,8.3);walk.receiveShadow=true;scene.add(walk);
  const sky=canvasTexture(2048,512,(x,W,H)=>{const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#8DB2D3');g.addColorStop(.7,'#D5E3EC');g.addColorStop(1,'#E4EAEC');x.fillStyle=g;x.fillRect(0,0,W,H);
    let s=3;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};for(let i=0;i<70;i++){const bw=30+r()*90,bh=60+r()*230,bx_=r()*W;x.fillStyle=`rgb(${120+r()*40},${135+r()*40},${150+r()*40})`;x.fillRect(bx_,H-bh,bw,bh);
      x.fillStyle='rgba(255,250,235,.35)';for(let yy=H-bh+8;yy<H-8;yy+=12)for(let xx=bx_+5;xx<bx_+bw-5;xx+=9)if(r()>.5)x.fillRect(xx,yy,4,6);}
    for(let i=0;i<40;i++){x.fillStyle=`rgba(70,${100+r()*40},70,.95)`;x.beginPath();x.arc(r()*W,H-10,20+r()*40,0,7);x.fill();}});
  const cylG=new THREE.CylinderGeometry(60,60,40,64,1,true);const skyM=new THREE.MeshBasicMaterial({map:sky,side:THREE.BackSide,fog:false});const skyMesh=new THREE.Mesh(cylG,skyM);skyMesh.position.y=14;scene.add(skyMesh);

  // exterior walls
  wall(scene,'x',-6,-9-TE/2,9+TE/2,TE,[{a:-1.2,b:1.2,y0:.9,y1:2.4},{a:4.5,b:7.5,y0:.9,y1:2.4}],{exterior:true,face:1});
  wall(scene,'x',6,-9-TE/2,9+TE/2,TE,[{a:-7.9,b:-6.3,y0:0,y1:2.3},{a:-5.2,b:-3.7,y0:.9,y1:2.4},{a:-1.2,b:1.2,y0:.9,y1:2.4},{a:4.8,b:6.8,y0:.9,y1:2.4}],{exterior:true,face:-1});
  wall(scene,'z',-9,-6,6,TE,[{a:-4.6,b:-2.2,y0:.9,y1:2.4}],{exterior:true,face:1});
  wall(scene,'z',9,-6,6,TE,[],{exterior:true,face:-1});
  // windows
  [[0,-6,2.4,1.5,0],[6,-6,3.0,1.5,0],[-4.45,6,1.5,1.5,Math.PI],[0,6,2.4,1.5,Math.PI],[5.8,6,2.0,1.5,Math.PI]].forEach(w=>{const u=B.windowUnit(w[2],w[3],.3);u.position.set(w[0],1.65,w[1]);u.rotation.y=w[4];scene.add(u);});
  {const u=B.windowUnit(2.4,1.5,.3);u.position.set(-9,1.65,-3.4);u.rotation.y=Math.PI/2;scene.add(u);}
  // entrance: glass double door
  {const fr=MAT.powder('#3B4046');const g=new THREE.Group();[[-.78],[.78],[0]].forEach(p=>g.add(at(bx(.05,2.3,.1,fr),p[0],1.15,0)));g.add(at(bx(1.6,.06,.1,fr),0,2.27,0));
   [-1,1].forEach(s=>{const gl=new THREE.Mesh(new THREE.PlaneGeometry(.72,2.2),MAT.glass());gl.position.set(s*.39,1.12,0);g.add(gl);g.add(at(rb(.03,.6,.03,.01,MAT.steel()),s*.07,1.1,.08));});
   g.position.set(-7.1,0,6);scene.add(g);addCol(-7.9,5.85,-6.3,6.15);}

  // corridor north wall (z=-0.9) with doors; strategy part is glass
  wall(scene,'x',-.9,-9,3,T,[{a:-4.66,b:-3.74,y0:0,y1:2.1},{a:1.14,b:2.06,y0:0,y1:2.1}]);
  doorway(scene,'x',-.9,-4.2,.92,T,-1,{label:'Law Library',sub:'Room 102'});doorway(scene,'x',-.9,1.6,.92,T,-1,{label:'Consultation',sub:'Room 104'});
  // glass partition for strategy room: door opening x 4.0–5.0 (glass leaf swung open into the room)
  {const fr=MAT.powder('#3B4046');for(let x=3;x<=9.001;x+=1.0){scene.add(at(bx(.05,CEIL,.08,fr),x,CEIL/2,-.9));}
   scene.add(at(bx(6,.05,.08,fr),6,CEIL-.05,-.9));
   [[3,4],[5,9]].forEach(([a,b])=>{scene.add(at(bx(b-a,.05,.08,fr),(a+b)/2,.05,-.9));scene.add(at(bx(b-a,.05,.08,fr),(a+b)/2,1.05,-.9));});
   scene.add(at(bx(1,.06,.08,fr),4.5,2.13,-.9)); // transom above the door
   for(let i=0;i<6;i++){if(i===1)continue;const gl=new THREE.Mesh(new THREE.PlaneGeometry(.95,CEIL-.1),MAT.glass());gl.position.set(3.5+i,CEIL/2,-.9);scene.add(gl);}
   {const gl=new THREE.Mesh(new THREE.PlaneGeometry(.95,CEIL-2.2),MAT.glass());gl.position.set(4.5,(2.16+CEIL-.05)/2,-.9);scene.add(gl);}
   const film=canvasTexture(512,64,(x,W,H)=>{x.clearRect(0,0,W,H);x.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<W;i+=6)x.fillRect(i,0,3,H);});
   const fm=new THREE.MeshBasicMaterial({map:film,transparent:true,depthWrite:false});
   [[3,4],[5,9]].forEach(([a,b])=>{const t=film.clone();t.repeat.set((b-a)/6,1);t.wrapS=THREE.RepeatWrapping;t.needsUpdate=true;const fb=new THREE.Mesh(new THREE.PlaneGeometry(b-a,.12),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));fb.position.set((a+b)/2,1.25,-.86);scene.add(fb);});
   const gd=B.doorLeaf(.9,2.1,MAT.glass());gd.position.set(4.06,0,-.95);gd.rotation.y=Math.PI/2;scene.add(gd);
   // film strip on the leaf so the open glass door is visible
   const lf=new THREE.Mesh(new THREE.PlaneGeometry(.88,.12),new THREE.MeshBasicMaterial({map:film,transparent:true,depthWrite:false,side:THREE.DoubleSide}));lf.position.set(4.06,1.25,-.95-.45);lf.rotation.y=Math.PI/2;scene.add(lf);
   addCol(4.0,-1.88,4.12,-.9);          // open leaf
   addCol(3,-.95,4.02,-.85);addCol(4.98,-.95,9,-.85); // glass panels on both sides of the opening
   const p=B.signPlate('Strategy Room','Room 106');p.position.set(5.5,1.5,-.84);scene.add(p);}
  // corridor south wall (z=0.9): reception is open plan
  wall(scene,'x',.9,-3,9,T,[{a:-2.26,b:-1.34,y0:0,y1:2.1},{a:3.74,b:4.66,y0:0,y1:2.1}]);
  doorway(scene,'x',.9,-1.8,.92,T,1,{label:'Jurisdiction Room',sub:'Room 103'});doorway(scene,'x',.9,4.2,.92,T,1,{label:'Results & Archive',sub:'Room 105'});
  // partitions
  wall(scene,'z',-3,-6,-.9,T);wall(scene,'z',3,-6,-.9,T);wall(scene,'z',-3,.9,6,T);wall(scene,'z',3,.9,6,T);
  // reception column at open corner
  scene.add(at(rb(.3,CEIL,.3,.01,MAT.paint('#E9E6E0',.3,CEIL)),-3,CEIL/2,.9));addCol(-3.15,.75,-2.85,1.05);

  // ceiling lights
  const panels=[[-6,-3.4],[0,-2.6],[0,-4.5],[6,-3.4],[-6,3.4],[0,3.4],[6,3.4],[-6.6,-.0],[-1.8,0],[3.8,0],[7.6,0],[-6,-1.9]];
  panels.forEach(p=>{const c=B.ceilingPanel(1.2,.6);c.position.set(p[0],CEIL,p[1]);scene.add(c);});
  dyn.areaSpots=[[-6,-3.4,'library'],[0,-3.5,'consult'],[6,-3.4,'strategy'],[-6,3.4,'reception'],[0,3.4,'courts'],[6,3.4,'results'],[-3,0,'corridor'],[5,0,'corridor']];

  /* ===== RECEPTION ===== */
  {const ctr=B.receptionCounter(2.2,.7,1.05);place(scene,ctr,-8.2,0,3.3,Math.PI/2);colAround(ctr,2.2,.8,-8.2,3.3,Math.PI/2);
   const logo=canvasTexture(1024,256,(x,W,H)=>{x.clearRect(0,0,W,H);x.fillStyle='#092F49';x.textAlign='center';x.textBaseline='middle';x.font=`600 92px ${SERIF}`;x.fillText('Ridgeway',W/2,100);x.fillStyle='#206582';x.font=`600 40px ${SANS}`;x.fillText('LEGAL CLINIC',W/2,190);});
   const lg=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.45),new THREE.MeshStandardMaterial({map:logo,transparent:true,roughness:.4,metalness:.2}));lg.position.set(-8.86,2.15,3.3);lg.rotation.y=Math.PI/2;scene.add(lg);
   lg.position.x=-8.86; // lettering applied directly on the wall (wooden plaque removed)
   place(scene,B.monitor(canvasTexture(512,300,(x,W,H)=>{x.fillStyle='#F4F6F8';x.fillRect(0,0,W,H);x.fillStyle='#2B3036';x.font=`600 26px ${SANS}`;x.fillText('Visitor check-in',24,44);x.font=`400 20px ${SANS}`;['9:00  Dana Ruiz','10:30  Theo Marsh','14:00  Priya Nair'].forEach((t,i)=>x.fillText(t,24,96+i*36));})),-8.45,.75,3.0,Math.PI/2-.4);
   place(scene,B.phone(),-8.4,.75,3.7,Math.PI/2);
   // roster board: interactive
   const rt=canvasTexture(1024,640,()=>{});dyn.rosterTex=rt;const board=B.wallDisplay(rt,1.3,.81);place(scene,board,-3.1,1.55,3.0,-Math.PI/2);
   hotspots.push({id:'roster',station:'reception',label:"Today's clients board",object:board,anchor:new THREE.Vector3(-3.12,2.05,3.0)});
   place(scene,B.coffeeTable(1.1,.6),-4.7,0,3.75);colAround(null,1.1,.6,-4.7,3.75);
   place(scene,B.rug(3.2,2.2,'#4E4A45','#B9A887'),-4.9,0,4.2);
   dyn.glb=[{f:'SheenWoodLeatherSofa',x:-4.7,z:5.42,ry:Math.PI,w:2.4,col:[2.45,.95]},{f:'SheenChair',x:-6.55,z:4.3,ry:-Math.PI/2.4,w:.8,col:[.8,.65]},{f:'DiffuseTransmissionPlant',x:-3.55,z:5.5,ry:0,w:.9,y:0,scale:1.25,col:[.7,.7]},{f:'GlassVaseFlowers',x:-8.25,z:2.75,y:1.07,ry:Math.PI/2,w:.26,col:null},{f:'pothos_plant',x:-8.4,z:5.3,ry:2.4,w:.86,scale:1.25,col:[.75,.75],contact:[.8,.8]}];
   [[-6.5,2.9],[-8.95,1.5]].forEach((p,i)=>{});
   }

  /* ===== CORRIDOR art ===== */
  [[-1.0,-.95,0,1],[5.5,.95,Math.PI,2],[-7.6,-.95,0,3]].forEach(p=>{const a=B.artwork(p[3],.9,.62);a.position.set(p[0],1.6,p[1]+(p[1]<0?.08:-.08));a.rotation.y=p[2];scene.add(a);});
  [[8.85,0,-Math.PI/2,5]].forEach(p=>{const a=B.artwork(p[3],1.1,.75);a.position.set(p[0],1.6,p[1]);a.rotation.y=p[2];scene.add(a);});

  /* ===== CONSULTATION ROOM (reference room) ===== */
  {const desk=B.executiveDesk(1.8,.85,.75);place(scene,desk,0,0,-3.95,Math.PI);colAround(desk,1.8,.85,0,-3.95);
   const chair=B.officeChair({seat:MAT.leather('#2B2724'),high:true});place(scene,chair,0,0,-4.75,0);colAround(null,.6,.6,0,-4.75);
   const scrTex=canvasTexture(1024,576,()=>{});dyn.monitorTex=scrTex;place(scene,B.monitor(scrTex),-.74,.75,-3.7,Math.PI-.75);
   const kb=B.keyboard();place(scene,kb,-.45,.75,-4.12,Math.PI-.3);place(scene,B.mouse(),-.12,.75,-4.2);
   place(scene,B.penCup(),.62,.75,-3.7);place(scene,B.mug(),.48,.75,-4.15);place(scene,B.phone(),.74,.75,-3.55,Math.PI+.4);
   const padTex=canvasTexture(512,700,()=>{});dyn.padTex=padTex;place(scene,B.legalPad(padTex),.36,.75,-4.05,Math.PI+.15);
   const lamp=B.bankersLamp();place(scene,lamp,.78,.75,-4.25,Math.PI+.4);dyn.lamps=[[.78,1.05,-4.22]];
   const ftex=canvasTexture(512,180,()=>{});dyn.folderTex=ftex;const fo=B.folder(ftex);place(scene,fo,-.02,.751,-3.78,Math.PI-.05);
   hotspots.push({id:'intake',station:'consult',label:'Client intake folder: interview the client',object:fo,anchor:new THREE.Vector3(-.05,.95,-3.68)});
   const cred=B.credenza(1.8,.45,.72);place(scene,cred,0,0,-5.6,0);colAround(cred,1.8,.45,0,-5.6);
   place(scene,B.paperStack(12,.23,.3),-.5,.72,-5.6,.1);
   const pb=B.pinboard(1.6,1.0);place(scene,pb,2.92,1.55,-3.4,-Math.PI/2);dyn.pinboard={x:2.9,y:1.55,z:-3.4};dyn.cards=[];
   hotspots.push({id:'casefile',station:'consult',label:'Case file board: facts you have gathered',object:pb,anchor:new THREE.Vector3(2.88,2.15,-3.4)});
   const dip=canvasTexture(512,380,(x,W,H)=>{x.fillStyle='#FBF8EF';x.fillRect(0,0,W,H);x.strokeStyle='#B08D57';x.lineWidth=6;x.strokeRect(18,18,W-36,H-36);x.fillStyle='#2A3540';x.textAlign='center';x.font=`600 34px ${SERIF}`;x.fillText('Juris Doctor',W/2,120);x.font=`italic 22px ${SERIF}`;x.fillText('conferred upon',W/2,170);x.font=`600 28px ${SERIF}`;x.fillText('Maria Ostrowski',W/2,215);x.fillStyle='#8E2F29';x.beginPath();x.arc(W/2,295,30,0,7);x.fill();});
   const dip2=canvasTexture(512,380,(x,W,H)=>{x.fillStyle='#FBF8EF';x.fillRect(0,0,W,H);x.strokeStyle='#5D6B78';x.lineWidth=5;x.strokeRect(18,18,W-36,H-36);x.fillStyle='#2A3540';x.textAlign='center';x.font=`600 30px ${SERIF}`;x.fillText('Admitted to the Bar',W/2,130);x.font=`italic 22px ${SERIF}`;x.fillText('State of Ohio',W/2,185);x.fillStyle='#2E5B88';x.beginPath();x.arc(W/2,285,28,0,7);x.fill();});
   place(scene,B.framedDoc(dip,.44,.33),-2.92,1.75,-4.3,Math.PI/2);place(scene,B.framedDoc(dip2,.44,.33),-2.92,1.75,-3.6,Math.PI/2);
   const clk=B.wallClock();place(scene,clk,-1.0,2.25,-.98,Math.PI);dyn.clock=clk.userData.face;
   place(scene,B.rug(3.4,2.4,'#3E4A52','#A8B3B9'),0,0,-3.5);
   [[-2.0,.35,-.98,Math.PI],[1.0,.35,-5.86,0],[-2.92,.35,-2.0,Math.PI/2]].forEach(p=>place(scene,B.wallPlate('outlet'),p[0],p[1],p[2],p[3]));
   place(scene,B.wallPlate('switch'),2.3,1.2,-.98,Math.PI);
   const gc1=B.guestChair();place(scene,gc1,-.5,0,-2.9,Math.PI+.15);colAround(null,.62,.6,-.5,-2.9);const gc2=B.guestChair();place(scene,gc2,.55,0,-2.9,Math.PI-.15);colAround(null,.62,.6,.55,-2.9);
   hotspots.push({id:'client',station:'consult',label:'Client: talk to the client',object:gc2,anchor:new THREE.Vector3(.55,1.45,-2.9)});
   dyn.glb.push({f:'DiffuseTransmissionPlant',x:2.5,z:-5.5,ry:.5,w:.9,scale:1.25,col:[.7,.7]});
   const art=B.artwork(7,1.0,.7);place(scene,art,-1.6,1.7,-.98,Math.PI);}

  /* ===== LAW LIBRARY ===== */
  {const filler=new B.BookFiller();let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
   const addCase=(x,z,ry,w=1.1,h=2.35,d=.36)=>{const bc=B.bookcase(w,h,d);place(scene,bc,x,0,z,ry);colAround(bc,w,d,x,z,ry);
     bc.updateMatrixWorld(true);bc.userData.shelves.forEach(y=>{const tmp=new B.BookFiller();tmp.fillShelf(-w/2+.05,w/2-.05,y,0,d-.04,1,rnd);
       tmp.lists.forEach((L,i)=>L.forEach(b=>{b.m.premultiply(bc.matrixWorld);filler.lists[i].push(b);}));});};
   for(let i=0;i<5;i++)addCase(-8.35+i*1.12,-5.66,0);
   [-5.1,-3.95,-2.8].forEach(z=>addCase(-3.25,z,-Math.PI/2));
   filler.build(scene);
   const tbl=B.readingTable(1.8,.9,.76);place(scene,tbl,-6.6,0,-3.45);colAround(tbl,1.8,.9,-6.6,-3.45);
   const lamp=B.bankersLamp();place(scene,lamp,-7.25,.76,-3.65,.3);dyn.lamps.push([-7.25,1.06,-3.6]);
   const stand=B.bookStand();place(scene,stand,-6.55,.76,-3.62);
   dyn.heroBooks=[0,1,2].map(i=>{const tex=canvasTexture(420,580,()=>{});const bk=B.heroBook(tex,['#1F3E62','#2B5E45','#6B2E26'][i]);
     const x=-6.55-.23+i*.23;bk.position.set(x,.785,-3.6);bk.rotation.x=-.3;scene.add(bk);bk.userData.base=bk.position.clone();bk.userData.tex=tex;bk.userData.i=i;
     hotspots.push({id:'book'+i,station:'library',label:'Law book '+'ABC'[i],object:bk,anchor:new THREE.Vector3(x,1.18,-3.55),option:i});return bk;});
   const tagTex=canvasTexture(400,120,()=>{});dyn.bookTag=new THREE.Mesh(new THREE.PlaneGeometry(.2,.06),new THREE.MeshStandardMaterial({map:tagTex,roughness:.7}));dyn.bookTag.userData.tex=tagTex;dyn.bookTag.rotation.x=-Math.PI/2;dyn.bookTag.visible=false;scene.add(dyn.bookTag);
   place(scene,B.paperStack(5),-5.85,.76,-3.3,.2);
   place(scene,B.rug(3.0,2.2,'#5A2E2A','#C2A372'),-6.6,0,-3.45);
   const ch1=B.officeChair({seat:MAT.leather('#4A2E22'),arms:true,high:false});place(scene,ch1,-6.95,0,-2.75,Math.PI);colAround(null,.55,.55,-6.95,-2.75);
   const ch2=B.officeChair({seat:MAT.leather('#4A2E22'),arms:true,high:false});place(scene,ch2,-6.2,0,-4.2,0);colAround(null,.55,.55,-6.2,-4.2);
   place(scene,B.sideTable(),-8.4,0,-3.4);colAround(null,.5,.5,-8.4,-3.4);
   dyn.glb.push({f:'ChairDamaskPurplegold',x:-8.35,z:-4.25,ry:Math.PI/2+.5,w:.8,col:[.8,.6]},{f:'ChairDamaskPurplegold',x:-8.35,z:-2.55,ry:Math.PI/2-.5,w:.8,col:[.8,.6]});
   const a=B.artwork(9,.7,.9);place(scene,a,-8.86,1.7,-1.6,Math.PI/2);}

  /* ===== JURISDICTION ROOM ===== */
  {const tbl=B.meetingTable(2.4,1.1,.74);place(scene,tbl,0,0,3.45);colAround(tbl,2.4,1.1,0,3.45);
   const mk=(word)=>canvasTexture(512,100,(x,W,H)=>{x.fillStyle='#B39556';x.fillRect(0,0,W,H);x.fillStyle='#2A2318';x.textAlign='center';x.textBaseline='middle';x.font=`700 44px ${SERIF}`;x.fillText(word,W/2,H/2);});
   const sp=mk('STATE COURT'),fp=mk('U.S. DISTRICT COURT');
   const ms=B.courthouseModel('state',sp),mf=B.courthouseModel('federal',fp);place(scene,ms,-.55,.74,3.45,Math.PI);place(scene,mf,.55,.74,3.45,Math.PI);
   dyn.models={state:ms,federal:mf};
   const vt=()=>canvasTexture(512,160,()=>{});dyn.verdictTex={state:vt(),federal:vt()};
   ['state','federal'].forEach((k,i)=>{const card=new THREE.Mesh(new THREE.PlaneGeometry(.34,.106),new THREE.MeshStandardMaterial({map:dyn.verdictTex[k],roughness:.7}));card.rotation.set(-Math.PI/2+.25,0,Math.PI);card.position.set(i?.55:-.55,.765,2.95);card.visible=false;scene.add(card);dyn.verdictTex[k].userData.card=card;});
   hotspots.push({id:'models',station:'courts',label:'Court models: state and federal',object:ms,anchor:new THREE.Vector3(0,1.25,3.45)});hotspots.push({id:'models2',station:'courts',label:'Federal court model',object:mf,anchor:null});
   const wb=canvasTexture(1024,620,(x,W,H)=>{x.fillStyle='#FBFCFC';x.fillRect(0,0,W,H);x.fillStyle='#1F4C8F';x.font=`700 54px ${HAND}`;x.fillText('Where can this be heard?',50,90);
     x.fillStyle='#222';x.font=`400 42px ${HAND}`;['1. What law creates the claim?','2. Subject-matter jurisdiction','     federal question / diversity','3. Personal jurisdiction','     minimum contacts','4. Venue'].forEach((t,i)=>x.fillText(t,60,180+i*68));
     x.strokeStyle='#B33A32';x.lineWidth=4;x.beginPath();x.ellipse(820,420,140,70,0,0,7);x.stroke();x.fillStyle='#B33A32';x.font=`400 38px ${HAND}`;x.fillText('> $75,000?',720,432);});
   place(scene,B.whiteboard(wb,1.8,1.1),2.92,1.5,3.45,-Math.PI/2);
   [[-.75,2.6,0],[.75,2.6,0],[-.75,4.3,Math.PI],[.75,4.3,Math.PI]].forEach(p=>{const c=B.officeChair({seat:MAT.fabric('#5D6770'),arms:false,high:false});place(scene,c,p[0],0,p[1],p[2]+Math.PI);colAround(null,.55,.55,p[0],p[1]);});
   const a=B.artwork(12,1.0,.7);place(scene,a,-2.92,1.65,3.45,Math.PI/2);}

  /* ===== STRATEGY ROOM ===== */
  {const tbl=B.meetingTable(3.0,1.15,.74);place(scene,tbl,6,0,-3.5);colAround(tbl,3.0,1.15,6,-3.5);
   [[5.0,-2.75,Math.PI],[6.0,-2.75,Math.PI],[7.0,-2.75,Math.PI],[5.0,-4.25,0],[6.0,-4.25,0],[7.0,-4.25,0]].forEach(p=>{const c=B.officeChair({seat:MAT.fabric('#2F3A44'),arms:true,high:true});place(scene,c,p[0],0,p[1],p[2]);colAround(null,.6,.6,p[0],p[1]);});
   dyn.dossiers=[0,1,2,3].map(i=>{const tex=canvasTexture(420,160,()=>{});const f=B.folder(tex,['#2E4A6B','#3B6A52','#7A3B33','#5B5248'][i]);const x=5.0+i*.66;f.position.set(x,.74,-3.35);f.rotation.y=(i-1.5)*.05;scene.add(f);
     f.userData={base:f.position.clone(),tex,i};hotspots.push({id:'dossier'+i,station:'strategy',label:'Strategy dossier '+'ABCD'[i],object:f,anchor:new THREE.Vector3(x,.98,-3.35),option:i});return f;});
   const st=canvasTexture(1024,620,(x,W,H)=>{x.fillStyle='#FBFCFC';x.fillRect(0,0,W,H);x.fillStyle='#1F4C8F';x.font=`700 54px ${HAND}`;x.fillText('Before you sign:',50,90);x.fillStyle='#222';x.font=`400 44px ${HAND}`;
     ['Is it legally sound?','Is it ethically defensible?','What does it cost:','   money, time, relationships?'].forEach((t,i)=>x.fillText(t,70,190+i*80));});
   place(scene,B.whiteboard(st,1.8,1.1),8.86,1.5,-3.5,-Math.PI/2);
   const cred=B.credenza(1.6,.45,.72);place(scene,cred,3.3,0,-3.6,Math.PI/2);colAround(cred,1.6,.45,3.3,-3.6,Math.PI/2);
   dyn.glb.push({f:'GlassVaseFlowers',x:3.3,z:-3.2,y:.72,ry:Math.PI/2,w:.26,col:null});
   place(scene,B.paperStack(8),3.3,.72,-4.05,.2);}

  /* ===== RESULTS & ARCHIVE ===== */
  {const rtex=canvasTexture(1280,720,()=>{});dyn.resultsTex=rtex;const disp=B.wallDisplay(rtex,1.75,.985);place(scene,disp,8.84,1.5,3.4,-Math.PI/2);
   hotspots.push({id:'results',station:'results',label:'Results display',object:disp,anchor:new THREE.Vector3(8.8,2.1,3.4)});
   const cr=B.credenza(1.8,.45,.6);place(scene,cr,8.65,0,3.4,-Math.PI/2);colAround(cr,1.8,.45,8.65,3.4,-Math.PI/2);
   [['Northwind','Robotics','Supply'],['Birch & Loom','Vermont','Textiles'],['PocketLend','Fintech','Terms']].forEach((l,i)=>{const fc=B.filingCabinet(['Closed 2025',l[0],l[1],'Archive']);place(scene,fc,3.36,0,2.0+i*.52,Math.PI/2);colAround(fc,.47,.62,3.36,2.0+i*.52,Math.PI/2);});
   [[6.6,2.7,-Math.PI/2+.5],[6.6,4.1,-Math.PI/2-.5]].forEach(p=>{const c=B.officeChair({seat:MAT.fabric('#5D6770'),arms:true,high:false});place(scene,c,p[0],0,p[1],p[2]);colAround(null,.55,.55,p[0],p[1]);});
   place(scene,B.rug(2.6,2.0,'#46505A','#9AA6AE'),7.0,0,3.4);
   const a=B.artwork(15,.9,.65);place(scene,a,6,1.65,.98,0);}

  // seats used by the animated clients (x,z = seat centre; ry = facing; h = seat height; stand = clear standing spot)
  dyn.seats={sofa:[-5.4,-4.7,-4.0].map(x=>({x,z:5.3,ry:Math.PI,h:.44,stand:[x,4.5]})),
    guest:{x:.55,z:-2.92,ry:Math.PI-.15,h:.4,stand:[1.27,-2.85]},exit:[-7.1,5.45]};
  // ---- GLB furniture (Khronos glTF Sample Assets, CC BY 4.0) ----
  const loader=new GLTFLoader();const list=dyn.glb;let done=0;const cache={};
  dyn.glbStatus={};
  await Promise.all(list.map(async it=>{try{if(!cache[it.f])cache[it.f]=loader.loadAsync(asset('assets/models/'+it.f+'.glb'));const gl=await cache[it.f];
      const obj=gl.scene.clone(true);const box=new THREE.Box3().setFromObject(obj);const size=box.getSize(new THREE.Vector3());const s=(it.scale||(it.w/size.x));
      obj.scale.setScalar(it.scale?it.scale:s);obj.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;
        if(o.material&&o.material.transmission){o.material=o.material.clone();o.material.transmission=0;o.material.transparent=true;o.material.opacity=.35;o.material.depthWrite=false;}
        const gA=o.geometry.attributes;if(!gA.uv1&&gA.uv)o.geometry.setAttribute('uv1',gA.uv); // some optimised meshes lost TEXCOORD_1 used by their AO map
        if(it.tint&&o.material&&o.material.name&&/fabric|damask|purple|seat|cushion/i.test(o.material.name)){o.material=o.material.clone();o.material.color.set(it.tint);}}});
      obj.position.set(it.x,it.y||0,it.z);obj.rotation.y=it.ry||0;obj.userData.glb=true;scene.add(obj);if(!(it.y>0)){const c=it.contact?B.contact(it.contact[0],it.contact[1],.45):B.contact(size.x*s+.3,size.z*s+.3,.45);c.position.set(it.x,0,it.z);c.rotation.z=-(it.ry||0);scene.add(c);}
      if(it.col)colAround(null,it.col[0],it.col[1],it.x,it.z,it.ry||0);
      if(it.hs){hotspots.push({id:it.hs,station:it.station,label:'Client chair: talk to the client',object:obj,anchor:new THREE.Vector3(it.x,1.1,it.z)});}
      dyn.glbStatus[it.f]='loaded';}
    catch(e){dyn.glbStatus[it.f]='failed: '+e.message;console.warn('GLB failed',it.f,e);}
    done++;onProgress&&onProgress(done/list.length);}));
  return {floor};}
