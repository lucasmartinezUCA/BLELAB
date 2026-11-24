// Material library: PBR materials built from local procedural textures (assets/textures, original work, CC0 by the author of this lab).
import * as THREE from 'three';
const TL=new THREE.TextureLoader();
// Standalone build inlines assets as data URIs in window.__ASSETS; the folder build loads files.
export const asset=p=>(window.__ASSETS&&window.__ASSETS[p])||p;
const base={};let ANISO=4;
export function setAniso(a){ANISO=a;}
function src(name,srgb){const k=name+(srgb?'#s':'');if(!base[k]){const t=TL.load(asset('assets/textures/'+name));t.wrapS=t.wrapT=THREE.RepeatWrapping;if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=ANISO;base[k]=t;}return base[k];}
function tex(name,srgb,rx,ry){const t=src(name,srgb).clone();t.repeat.set(rx,ry);t.needsUpdate=true;return t;}
const cache=new Map();
function memo(key,fn){if(!cache.has(key))cache.set(key,fn());return cache.get(key);}
const r2=v=>Math.max(.25,Math.round(v*4)/4);
export const MAT={
  floorOak:(w,d)=>memo('fo'+r2(w)+'x'+r2(d),()=>new THREE.MeshStandardMaterial({map:tex('oak_floor_albedo.jpg',true,w/2.4,d/2.4),normalMap:tex('oak_floor_normal.jpg',false,w/2.4,d/2.4),roughnessMap:tex('oak_floor_rough.jpg',false,w/2.4,d/2.4),roughness:1,normalScale:new THREE.Vector2(.6,.6)})),
  walnut:(w=1,h=1)=>memo('wn'+r2(w)+'x'+r2(h),()=>new THREE.MeshStandardMaterial({map:tex('walnut_albedo.jpg',true,w/1.2,h/1.2),normalMap:tex('walnut_normal.jpg',false,w/1.2,h/1.2),roughnessMap:tex('walnut_rough.jpg',false,w/1.2,h/1.2),roughness:1,normalScale:new THREE.Vector2(.35,.35)})),
  oak:(w=1,h=1)=>memo('ok'+r2(w)+'x'+r2(h),()=>new THREE.MeshStandardMaterial({map:tex('oak_albedo.jpg',true,w/1.2,h/1.2),normalMap:tex('oak_normal.jpg',false,w/1.2,h/1.2),roughness:.55,normalScale:new THREE.Vector2(.3,.3)})),
  paint:(color='#ECEAE5',w=1,h=1)=>memo('pt'+color+r2(w)+'x'+r2(h),()=>new THREE.MeshStandardMaterial({color,normalMap:tex('plaster_normal.jpg',false,w/2,h/2),roughness:.92,normalScale:new THREE.Vector2(.25,.25)})),
  trim:(color='#F4F3EF')=>memo('tr'+color,()=>new THREE.MeshStandardMaterial({color,roughness:.45})),
  ceiling:(w,d)=>memo('cl'+r2(w)+r2(d),()=>new THREE.MeshStandardMaterial({map:tex('ceiling_albedo.jpg',true,w/1.2,d/1.2),normalMap:tex('ceiling_normal.jpg',false,w/1.2,d/1.2),roughness:.95})),
  leather:(color='#4A2E22')=>memo('lt'+color,()=>new THREE.MeshStandardMaterial({color,map:tex('leather_albedo.jpg',true,2,2),normalMap:tex('leather_normal.jpg',false,2,2),roughnessMap:tex('leather_rough.jpg',false,2,2),roughness:1,normalScale:new THREE.Vector2(.5,.5)})),
  fabric:(color='#5B6670')=>memo('fb'+color,()=>new THREE.MeshStandardMaterial({color,map:tex('fabric_albedo.jpg',true,3,3),normalMap:tex('fabric_normal.jpg',false,3,3),roughness:.95,normalScale:new THREE.Vector2(.6,.6)})),
  carpet:(color,w,d)=>memo('cp'+color+r2(w)+r2(d),()=>new THREE.MeshStandardMaterial({color,normalMap:tex('carpet_normal.jpg',false,w,d),roughness:1,normalScale:new THREE.Vector2(.8,.8)})),
  steel:()=>memo('st',()=>new THREE.MeshStandardMaterial({color:'#C9CDD1',metalness:1,roughness:.32,normalMap:tex('brushed_normal.jpg',false,1,1),normalScale:new THREE.Vector2(.25,.25)})),
  chrome:()=>memo('cr',()=>new THREE.MeshStandardMaterial({color:'#E8EAEC',metalness:1,roughness:.12})),
  brass:()=>memo('br',()=>new THREE.MeshStandardMaterial({color:'#C7A15A',metalness:1,roughness:.28})),
  blackMetal:()=>memo('bm',()=>new THREE.MeshStandardMaterial({color:'#23262A',metalness:.6,roughness:.42})),
  powder:(color='#5E666E')=>memo('pw'+color,()=>new THREE.MeshStandardMaterial({color,metalness:.25,roughness:.48})),
  plastic:(color='#1E2124')=>memo('pl'+color,()=>new THREE.MeshStandardMaterial({color,roughness:.55})),
  glass:()=>memo('gl',()=>new THREE.MeshPhysicalMaterial({color:'#E9F1F3',metalness:0,roughness:.03,transmission:0,transparent:true,opacity:.16,envMapIntensity:1.4,depthWrite:false,side:THREE.DoubleSide})),
  paper:(color='#F7F6F1')=>memo('pp'+color,()=>new THREE.MeshStandardMaterial({color,roughness:.88})),
  manila:()=>memo('mn',()=>new THREE.MeshStandardMaterial({color:'#D9BD80',roughness:.8})),
  stone:()=>memo('sn',()=>new THREE.MeshStandardMaterial({color:'#D8D6D1',roughness:.35,normalMap:tex('plaster_normal.jpg',false,1,1),normalScale:new THREE.Vector2(.15,.15)})),
  model:()=>memo('md',()=>new THREE.MeshStandardMaterial({color:'#F1EFEA',roughness:.85})),
  soil:()=>memo('so',()=>new THREE.MeshStandardMaterial({color:'#3B2B20',roughness:1})),
};
export function canvasTexture(w,h,draw,{srgb=true}={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=ANISO;t.userData.canvas=c;return t;}
export function redraw(t,draw){const c=t.userData.canvas;draw(c.getContext('2d'),c.width,c.height);t.needsUpdate=true;}
export const SANS='"Public Sans","Helvetica Neue",Arial,sans-serif',SERIF='"Source Serif 4",Georgia,serif',HAND='"Segoe Print","Bradley Hand","Comic Neue",cursive';
export function wrap(x,text,maxW){const out=[];String(text).split('\n').forEach(par=>{let cur='';par.split(' ').forEach(w=>{const t=cur?cur+' '+w:w;if(x.measureText(t).width>maxW&&cur){out.push(cur);cur=w;}else cur=t;});out.push(cur);});return out;}
export function fit(x,text,maxW,size,weight,family){let s=size;do{x.font=`${weight} ${s}px ${family}`;s-=2;}while(x.measureText(text).width>maxW&&s>8);return s+2;}
