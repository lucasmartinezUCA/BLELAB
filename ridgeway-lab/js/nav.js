// First-person navigation: drag to look, WASD/arrows to walk, collisions, smooth guided travel along door-to-door paths.
import * as THREE from 'three';
import {colliders,roomOf,DOORS,STATIONS} from './world.js';
import {findPath} from './pathfind.js';
export const EYE=1.62,RADIUS=.26;
export class Nav{
  constructor(camera,dom){this.cam=camera;this.dom=dom;this.pos=new THREE.Vector3(-6.1,EYE,1.75);this.yaw=0;this.pitch=0;this.keys=new Set();this.vel=new THREE.Vector2();
    this.reduced=false;this.travel=null;this.enabled=true;this.onArrive=null;this.onRoom=null;this.room=null;this.dragging=false;this.moved=0;this.touchMove={x:0,z:0};
    dom.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;this.dragging=true;this.moved=0;this.lx=e.clientX;this.ly=e.clientY;dom.setPointerCapture(e.pointerId);});
    dom.addEventListener('pointermove',e=>{if(!this.dragging)return;const dx=e.clientX-this.lx,dy=e.clientY-this.ly;this.lx=e.clientX;this.ly=e.clientY;this.moved+=Math.abs(dx)+Math.abs(dy);
      if(this.travel&&this.moved>6)this.travel=null;const k=e.pointerType==='touch'?.005:.0035;this.yaw-=dx*k;this.pitch=Math.max(-1.1,Math.min(1.0,this.pitch-dy*k));});
    dom.addEventListener('pointerup',e=>{this.dragging=false;});
    window.addEventListener('keydown',e=>{if(!this.enabled)return;const t=e.target;if(t&&/INPUT|TEXTAREA|SELECT|BUTTON/.test(t.tagName)&&!t.classList.contains('canvas-focus'))return;
      const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','q','e'].includes(k)){this.keys.add(k);this.travel=null;e.preventDefault();}});
    window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>this.keys.clear());}
  setView(pos,look){this.pos.set(pos[0],pos[1],pos[2]);const d=new THREE.Vector3(look[0]-pos[0],look[1]-pos[1],look[2]-pos[2]);this.yaw=Math.atan2(-d.x,-d.z);this.pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));}
  blocked(x,z){const px=this.pos.x,pz=this.pos.z,R=RADIUS;if(this.people)for(const p of this.people()){const dn=Math.hypot(x-p[0],z-p[1]),dc=Math.hypot(px-p[0],pz-p[1]);if(dn<.55&&dn<dc)return true;}for(const c of colliders){const inNew=x>c.x0-R&&x<c.x1+R&&z>c.z0-R&&z<c.z1+R;if(!inNew)continue;const inCur=px>c.x0-R&&px<c.x1+R&&pz>c.z0-R&&pz<c.z1+R;
    if(!inCur)return true;const dCur=Math.min(px-(c.x0-R),(c.x1+R)-px,pz-(c.z0-R),(c.z1+R)-pz),dNew=Math.min(x-(c.x0-R),(c.x1+R)-x,z-(c.z0-R),(c.z1+R)-z);if(dNew>dCur)return true;}
    return x<-8.8||x>8.8||z<-5.8||z>5.8;}
  // A* route over the same colliders: the camera never crosses walls, doors or furniture
  route(target){const st=STATIONS[target];const v=st.view.pos;const pts=findPath(this.pos.x,this.pos.z,v[0],v[2],RADIUS+.04);
    const out=pts.slice(1).map(p=>new THREE.Vector3(p[0],EYE,p[1]));out[out.length-1]=new THREE.Vector3(v[0],v[1],v[2]);return out;}
  goTo(target,cb){const st=STATIONS[target];const pts=this.route(target);this.onArrive=cb;
    if(this.reduced){this.fadeCut(()=>{this.setView(st.view.pos,st.view.look);cb&&cb();});return;}
    const path=[this.pos.clone(),...pts];let L=0;const segs=[];for(let i=1;i<path.length;i++){const d=path[i].distanceTo(path[i-1]);segs.push(d);L+=d;}
    this.travel={path,segs,L,t:0,dur:Math.max(.8,L/2.1),look:new THREE.Vector3(...st.view.look),yaw0:this.yaw,pitch0:this.pitch};}
  fadeCut(fn){const f=document.getElementById('fade');f.classList.add('on');setTimeout(()=>{fn();setTimeout(()=>f.classList.remove('on'),60);},180);}
  pointAt(s){const tr=this.travel;let d=s*tr.L;for(let i=0;i<tr.segs.length;i++){if(d<=tr.segs[i]||i===tr.segs.length-1){const t=tr.segs[i]?Math.min(1,d/tr.segs[i]):1;return {p:tr.path[i].clone().lerp(tr.path[i+1],t),i};}d-=tr.segs[i];}}
  update(dt){if(this.travel){const tr=this.travel;tr.t+=dt;const u=Math.min(1,tr.t/tr.dur);const e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;const {p,i}=this.pointAt(e);this.pos.copy(p);
      let wantYaw,wantPitch;const lookW=Math.max(0,(e-.75)/.25);
      const ahead=this.pointAt(Math.min(1,e+.06)).p.sub(p);if(ahead.lengthSq()>1e-4&&lookW<1){wantYaw=Math.atan2(-ahead.x,-ahead.z);}else wantYaw=this.yaw;
      const d=tr.look.clone().sub(this.pos);const fy=Math.atan2(-d.x,-d.z),fp=Math.atan2(d.y,Math.hypot(d.x,d.z));
      const blendYaw=(a,b,t)=>{let diff=((b-a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return a+diff*t;};
      const target=lookW>0?blendYaw(wantYaw,fy,lookW):wantYaw;this.yaw=blendYaw(this.yaw,target,Math.min(1,dt*5));this.pitch+= ((lookW>0?fp*lookW:0)-this.pitch)*Math.min(1,dt*4);
      if(u>=1){this.yaw=fy;this.pitch=fp;this.travel=null;const cb=this.onArrive;this.onArrive=null;cb&&cb();}}
    else{const f=(this.keys.has('w')||this.keys.has('arrowup')?1:0)-(this.keys.has('s')||this.keys.has('arrowdown')?1:0)+this.touchMove.z;
      const turn=(this.keys.has('arrowleft')?1:0)-(this.keys.has('arrowright')?1:0);const str=(this.keys.has('d')?1:0)-(this.keys.has('a')?1:0)+this.touchMove.x;
      this.yaw+=turn*dt*1.6;const sp=1.5;const tx=(-Math.sin(this.yaw)*f+Math.cos(this.yaw)*str)*sp,tz=(-Math.cos(this.yaw)*f-Math.sin(this.yaw)*str)*sp;
      this.vel.x+=(tx-this.vel.x)*Math.min(1,dt*8);this.vel.y+=(tz-this.vel.y)*Math.min(1,dt*8);
      const nx=this.pos.x+this.vel.x*dt,nz=this.pos.z+this.vel.y*dt;if(!this.blocked(nx,this.pos.z))this.pos.x=nx;else this.vel.x=0;if(!this.blocked(this.pos.x,nz))this.pos.z=nz;else this.vel.y=0;
      const targetY=1.62;if(Math.abs(this.vel.x)+Math.abs(this.vel.y)>.05)this.pos.y+=(targetY-this.pos.y)*Math.min(1,dt*3);}
    this.cam.position.copy(this.pos);this.cam.rotation.set(this.pitch,this.yaw,0,'YXZ');
    const r=roomOf(this.pos.x,this.pos.z);if(r!==this.room){this.room=r;this.onRoom&&this.onRoom(r);}}}
