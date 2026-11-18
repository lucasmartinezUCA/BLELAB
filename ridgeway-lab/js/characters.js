// Animated clients: rigged characters (Sketchfab, CC BY 4.0) driven by Mixamo clips retargeted in world space,
// plus a procedural seated pose. Walking follows A* routes, so clients never cross walls, doors or furniture.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {asset} from './materials.js';
import {findPath} from './pathfind.js';
const base=n=>n.replace(/^mixamorig:?/,'').replace(/_\d+$/,'');
const _id=new THREE.Quaternion(),_q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_v=new THREE.Vector3(),_v2=new THREE.Vector3();

const isJ=o=>o.isBone||/^mixamorig/.test(o.name);
function bonesByBase(root){const m={};root.traverse(o=>{if(isJ(o)&&!m[base(o.name)])m[base(o.name)]=o;});return m;}
function restWorld(root){root.updateMatrixWorld(true);const m={};root.traverse(o=>{if(isJ(o)){const nb=base(o.name);m[nb]=o.getWorldQuaternion(new THREE.Quaternion());
  const kid=o.children.find(k=>isJ(k)&&!/End|Eye/.test(k.name)&&(o.children.length===1||/Spine|Neck|Head|Leg|Foot|Toe|ForeArm|Hand$|Middle/.test(k.name)))||o.children.find(k=>isJ(k));
  if(kid){const p=o.getWorldPosition(new THREE.Vector3()),q=kid.getWorldPosition(new THREE.Vector3());m[nb+'#dir']=q.sub(p).normalize();}}});return m;}
// world-space delta retarget: target = (srcPose * srcRest^-1) * tgtRest
function retarget(tgtRoot,tgtRest,srcRoot,srcRest,clip,fps=30){
  const srcB=bonesByBase(srcRoot),order=[];tgtRoot.traverse(o=>{if(o.isBone&&srcB[base(o.name)])order.push(o);});
  // per-bone correction that turns the target's rest direction onto the source's rest direction (handles T-pose vs A-pose)
  const corr={};order.forEach(b=>{const nb=base(b.name);const dt=tgtRest[nb+'#dir'],ds=srcRest[nb+'#dir'];if(dt&&ds&&!/Hips/.test(nb))corr[nb]=new THREE.Quaternion().setFromUnitVectors(dt,ds);});
  const mixer=new THREE.AnimationMixer(srcRoot);const act=mixer.clipAction(clip);act.play();
  const N=Math.max(2,Math.round(clip.duration*fps)+1),times=new Float32Array(N),vals=order.map(()=>new Float32Array(N*4));
  const world=new Map();
  for(let f=0;f<N;f++){const t=Math.min(clip.duration,f/fps);times[f]=t;mixer.setTime(t);srcRoot.updateMatrixWorld(true);world.clear();
    order.forEach((b,k)=>{const nb=base(b.name);srcB[nb].getWorldQuaternion(_q);_q.multiply(_q2.copy(srcRest[nb]).invert());const R=corr[nb]||_id;const w=_q.clone().multiply(R).multiply(tgtRest[nb]);world.set(b,w);
      let pw;if(world.has(b.parent))pw=world.get(b.parent);else pw=b.parent.getWorldQuaternion(new THREE.Quaternion());
      const loc=pw.clone().invert().multiply(w);loc.toArray(vals[k],f*4);});}
  act.stop();mixer.uncacheRoot(srcRoot);
  return new THREE.AnimationClip(clip.name,clip.duration,order.map((b,k)=>new THREE.QuaternionKeyframeTrack(b.name+'.quaternion',times,vals[k])));}

export class Clients{
  constructor(scene){this.scene=scene;this.list=[];this.reduced=false;}
  async load(defs,onProgress){const L=new GLTFLoader();const src=await L.loadAsync(asset('assets/models/anim_clips.glb'));const srcRoot=src.scene;const srcRest=restWorld(srcRoot);
    let n=0;for(const d of defs){try{const g=await L.loadAsync(asset('assets/models/'+d.file));const root=g.scene;const tRest=restWorld(root);
      const clips={};['idle','walk','agree','headShake'].forEach(nm=>{const c=src.animations.find(a=>a.name===nm);if(c)clips[nm]=retarget(root,tRest,srcRoot,srcRest,c);});
      const box=new THREE.Box3().setFromObject(root);const s=1.78/(box.max.y-box.min.y);root.scale.setScalar(s);
      root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;if(o.material&&o.material.transmission)o.material.transmission=0;}});
      const holder=new THREE.Group();holder.add(root);this.scene.add(holder);
      const mixer=new THREE.AnimationMixer(root);const acts={};for(const k in clips)acts[k]=mixer.clipAction(clips[k]);
      ['agree','headShake'].forEach(k=>{if(acts[k]){acts[k].setLoop(THREE.LoopOnce);acts[k].clampWhenFinished=false;}});
      const B=bonesByBase(root);root.updateMatrixWorld(true);const hipY=B.Hips.getWorldPosition(new THREE.Vector3()).y;
      const c={...d,holder,root,mixer,acts,B,hipY,sit:1,sitTarget:1,state:'sit',path:null,seat:null,yaw:0,visible:true,look:null,cur:null};
      this.play(c,'idle');this.list.push(c);}catch(e){console.warn('client model failed',d.file,e);}onProgress&&onProgress(++n/defs.length);}
  }
  play(c,name,fade=.35){const a=c.acts[name];if(!a||c.cur===a)return;a.reset();a.setEffectiveTimeScale(1);a.setEffectiveWeight(1);a.play();if(c.cur){if(fade>0)c.cur.crossFadeTo(a,fade,false);else c.cur.stop();}c.cur=a;}
  gesture(c,name){const a=c.acts[name];if(!a)return;a.reset();a.setEffectiveWeight(.9);a.play();}
  seatAt(c,seat){c.seat=seat;c.state='sit';c.sit=c.sitTarget=1;c.holder.position.set(seat.x,0,seat.z);c.yaw=seat.ry;c.holder.rotation.y=seat.ry;this.play(c,'idle',0);c.holder.visible=c.visible=true;}
  hide(c){c.holder.visible=c.visible=false;c.state='gone';}
  // stand up, walk an A* route to `goal`, then sit (if seat given) or vanish (exit)
  walkTo(c,goal,{seat=null,exit=false,onDone}={}){if(this.reduced){if(seat)this.seatAt(c,seat);else if(exit)this.hide(c);onDone&&onDone();return;}
    const p=c.holder.position;const start=c.seat&&c.state==='sit'?c.seat.stand:[p.x,p.z];
    const pts=findPath(start[0],start[1],goal[0],goal[1],.32);if(c.state==='sit'&&c.seat)pts.unshift([p.x,p.z]);
    c.path={pts,i:1,seat,exit,onDone};c.sitTarget=0;c.state='standing';c.seat=null;}
  positions(){return this.list.filter(c=>c.visible).map(c=>[c.holder.position.x,c.holder.position.z]);}
  update(dt,camera){for(const c of this.list){if(!c.visible)continue;
    if(c.state==='standing'){c.sit=Math.max(0,c.sit-dt*2);if(c.sit===0){c.state='walk';this.play(c,'walk');c.acts.walk&&c.acts.walk.setEffectiveTimeScale(1.2);}}
    else if(c.state==='walk'){const P=c.path;const tgt=P.pts[P.i];const pos=c.holder.position;_v.set(tgt[0]-pos.x,0,tgt[1]-pos.z);const d=_v.length();const sp=1.3;
      if(d<.05){P.i++;if(P.i>=P.pts.length){if(P.exit){this.hide(c);P.onDone&&P.onDone();continue;}if(P.seat){c.seat=P.seat;c.state='sitting';this.play(c,'idle');}else{c.state='idle';this.play(c,'idle');}}}
      else{_v.multiplyScalar(Math.min(d,sp*dt)/d);pos.add(_v);const want=Math.atan2(tgt[0]-pos.x,tgt[1]-pos.z);let df=((want-c.yaw+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;c.yaw+=df*Math.min(1,dt*6);}}
    else if(c.state==='sitting'){const s=c.seat;const pos=c.holder.position;pos.x+=(s.x-pos.x)*Math.min(1,dt*3);pos.z+=(s.z-pos.z)*Math.min(1,dt*3);
      let df=((s.ry-c.yaw+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;c.yaw+=df*Math.min(1,dt*5);c.sit=Math.min(1,c.sit+dt*1.4);
      if(c.sit>=1&&Math.abs(df)<.02){c.state='sit';const cb=c.path&&c.path.onDone;c.path=null;cb&&cb();}}
    c.holder.rotation.y=c.yaw;c.mixer.update(dt);this.applySit(c);if(c.look&&camera)this.applyLook(c,camera);}}
  // procedural seated pose blended over the animation (aim each limb segment at a world direction)
  applySit(c){const w=c.sit*c.sit*(3-2*c.sit);if(w<=0)return;const B=c.B,root=c.root;
    const seatY=(c.seat&&c.seat.h)||.45;c.holder.position.y=w*((seatY+.07)-c.hipY);
    const fwd=_v2.set(Math.sin(c.yaw),0,Math.cos(c.yaw)).clone(),down=new THREE.Vector3(0,-1,0),side=new THREE.Vector3(Math.cos(c.yaw),0,-Math.sin(c.yaw));
    const dir=(a,b,cc,d=0)=>fwd.clone().multiplyScalar(a).add(down.clone().multiplyScalar(b)).add(side.clone().multiplyScalar(cc)).normalize();
    c.holder.updateMatrixWorld(true);
    const aim=(bn,cn,d)=>{const b=B[bn],ch=B[cn];if(!b||!ch)return;b.updateWorldMatrix(true,false);ch.updateWorldMatrix(false,false);
      const bp=b.getWorldPosition(new THREE.Vector3()),cp=ch.getWorldPosition(new THREE.Vector3());const cur=cp.sub(bp).normalize();
      const rot=new THREE.Quaternion().setFromUnitVectors(cur,d);const wq=b.getWorldQuaternion(new THREE.Quaternion());const nw=rot.multiply(wq);
      const pq=b.parent.getWorldQuaternion(new THREE.Quaternion()).invert();const loc=pq.multiply(nw);b.quaternion.slerp(loc,w);b.updateMatrixWorld(true);};
    [['Left',1],['Right',-1]].forEach(([s,sg])=>{aim(s+'UpLeg',s+'Leg',dir(1,.06,sg*.09));aim(s+'Leg',s+'Foot',dir(.18,1,sg*.03));aim(s+'Foot',s+'ToeBase',dir(1,.35,0));
      aim(s+'Arm',s+'ForeArm',dir(.32,1,sg*.16));aim(s+'ForeArm',s+'Hand',dir(1,.42,-sg*.3));});}
  applyLook(c,camera){const h=c.B.Head,n=c.B.Neck;if(!h||c.state!=='sit')return;const hp=h.getWorldPosition(new THREE.Vector3());const to=camera.position.clone().sub(hp);
    let yaw=Math.atan2(to.x,to.z)-c.yaw;yaw=((yaw+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;yaw=Math.max(-.7,Math.min(.7,yaw));
    const pitch=Math.max(-.3,Math.min(.3,Math.atan2(to.y,Math.hypot(to.x,to.z))));
    [[n,.4],[h,.6]].forEach(([b,k])=>{if(!b)return;const wq=b.getWorldQuaternion(new THREE.Quaternion());const side=new THREE.Vector3(Math.cos(c.yaw+yaw),0,-Math.sin(c.yaw+yaw));
      const r=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw*k).multiply(new THREE.Quaternion().setFromAxisAngle(side,-pitch*k));
      const pq=b.parent.getWorldQuaternion(new THREE.Quaternion()).invert();b.quaternion.copy(pq.multiply(r.multiply(wq)));b.updateMatrixWorld(true);});}
}
