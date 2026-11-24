// Grid A* over the office floor using the same colliders as the camera, so walking routes never cross walls, doors or furniture.
import {colliders} from './world.js';
const X0=-9,Z0=-6,RES=.1,NX=180,NZ=120;
const grids={};
function grid(r){const key=r.toFixed(2);if(grids[key])return grids[key];const g=new Uint8Array(NX*NZ);
  for(let i=0;i<NX;i++)for(let j=0;j<NZ;j++){const x=X0+(i+.5)*RES,z=Z0+(j+.5)*RES;let b=x<-8.85+r||x>8.85-r||z<-5.85+r||z>5.85-r;
    if(!b)for(const c of colliders){if(x>c.x0-r&&x<c.x1+r&&z>c.z0-r&&z<c.z1+r){b=true;break;}}g[j*NX+i]=b?1:0;}
  grids[key]=g;return g;}
export function invalidate(){for(const k in grids)delete grids[k];}
const cell=(x,z)=>[Math.max(0,Math.min(NX-1,Math.floor((x-X0)/RES))),Math.max(0,Math.min(NZ-1,Math.floor((z-Z0)/RES)))];
const ctr=(i,j)=>[X0+(i+.5)*RES,Z0+(j+.5)*RES];
function nearestFree(g,i,j){if(!g[j*NX+i])return [i,j];for(let rad=1;rad<40;rad++)for(let di=-rad;di<=rad;di++)for(let dj=-rad;dj<=rad;dj++){if(Math.max(Math.abs(di),Math.abs(dj))!==rad)continue;const a=i+di,b=j+dj;if(a<0||b<0||a>=NX||b>=NZ)continue;if(!g[b*NX+a])return [a,b];}return [i,j];}
function los(g,a,b){const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/(RES*.5));for(let k=0;k<=n;k++){const t=k/n;const [i,j]=cell(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);if(g[j*NX+i])return false;}return true;}
export function isFree(x,z,r=.3){const g=grid(r);const [i,j]=cell(x,z);return !g[j*NX+i];}
// returns [[x,z],...] from start to goal (inclusive), smoothed
export function findPath(sx,sz,gx,gz,r=.3){const g=grid(r);const s=nearestFree(g,...cell(sx,sz)),e=nearestFree(g,...cell(gx,gz));
  const N=NX*NZ,cost=new Float32Array(N).fill(Infinity),from=new Int32Array(N).fill(-1),open=[];const si=s[1]*NX+s[0],ei=e[1]*NX+e[0];cost[si]=0;
  const h=k=>{const i=k%NX,j=(k/NX)|0;return Math.hypot(i-e[0],j-e[1]);};
  const push=(k,f)=>{open.push([f,k]);let n=open.length-1;while(n>0){const p=(n-1)>>1;if(open[p][0]<=open[n][0])break;[open[p],open[n]]=[open[n],open[p]];n=p;}};
  const pop=()=>{const top=open[0],last=open.pop();if(open.length){open[0]=last;let n=0;for(;;){const l=2*n+1,rr=l+1;let m=n;if(l<open.length&&open[l][0]<open[m][0])m=l;if(rr<open.length&&open[rr][0]<open[m][0])m=rr;if(m===n)break;[open[m],open[n]]=[open[n],open[m]];n=m;}}return top;};
  push(si,h(si));const D=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];let found=false;
  const closed=new Uint8Array(N);
  while(open.length){const [,k]=pop();if(closed[k])continue;closed[k]=1;if(k===ei){found=true;break;}const i=k%NX,j=(k/NX)|0;
    for(const d of D){const a=i+d[0],b=j+d[1];if(a<0||b<0||a>=NX||b>=NZ)continue;const kk=b*NX+a;if(g[kk]||closed[kk])continue;if(d[2]>1&&(g[j*NX+a]||g[b*NX+i]))continue;const c=cost[k]+d[2];if(c<cost[kk]){cost[kk]=c;from[kk]=k;push(kk,c+h(kk));}}}
  if(!found)return [[sx,sz],[gx,gz]];
  const raw=[];for(let k=ei;k!==-1;k=from[k]){raw.push(ctr(k%NX,(k/NX)|0));if(k===si)break;}raw.reverse();
  const pts=[[sx,sz],...raw,[gx,gz]];const out=[pts[0]];let a=0;
  while(a<pts.length-1){let b=pts.length-1;while(b>a+1&&!los(g,pts[a],pts[b]))b--;out.push(pts[b]);a=b;}
  return out;}
