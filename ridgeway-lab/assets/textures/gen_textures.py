import numpy as np
from PIL import Image
rng=np.random.default_rng(7)
OUT='assets/textures/'
def bandnoise(h,w,lo,hi,seed):
    r=np.random.default_rng(seed); n=r.standard_normal((h,w))
    F=np.fft.fft2(n); fy=np.fft.fftfreq(h)[:,None]*h; fx=np.fft.fftfreq(w)[None,:]*w; f=np.sqrt(fx**2+fy**2)
    m=((f>=lo)&(f<=hi)).astype(float)*(1/np.maximum(f,1))
    o=np.real(np.fft.ifft2(F*m)); o=(o-o.mean())/o.std(); return o
def aniso(h,w,fx_max,fy_max,seed):
    r=np.random.default_rng(seed); n=r.standard_normal((h,w)); F=np.fft.fft2(n)
    fy=np.abs(np.fft.fftfreq(h)[:,None]*h); fx=np.abs(np.fft.fftfreq(w)[None,:]*w)
    m=np.exp(-(fx/fx_max)**2-(fy/fy_max)**2); o=np.real(np.fft.ifft2(F*m)); return (o-o.mean())/o.std()
def normal_from_height(hm,strength):
    dx=(np.roll(hm,-1,1)-np.roll(hm,1,1))*strength; dy=(np.roll(hm,-1,0)-np.roll(hm,1,0))*strength
    n=np.stack([-dx,dy,np.ones_like(hm)],-1); n/=np.linalg.norm(n,axis=-1,keepdims=True)
    return ((n*.5+.5)*255).astype(np.uint8)
def save(a,name,q=90):
    im=Image.fromarray(a if a.dtype==np.uint8 else np.clip(a,0,255).astype(np.uint8)); im.save(OUT+name,quality=q)
def lerpc(c1,c2,t): return c1[None,None,:]*(1-t[...,None])+c2[None,None,:]*t[...,None]

# --- wood grain (long grain along x) ---
def wood(h,w,seed,c_light,c_dark,rings=9,warp=1.6,fine=.35):
    y=np.arange(h)[:,None]/h
    wv=aniso(h,w,1.5,2.5,seed)*warp/rings + aniso(h,w,6,4,seed+9)*.12/rings
    f=(y+wv)*rings*2*np.pi
    ring=(np.sin(f)*.5+.5)**1.6
    pores=aniso(h,w,6,h/5,seed+1)
    t=np.clip(ring*.42+.25+pores*.10+bandnoise(h,w,1,4,seed+2)*.10,0,1)
    alb=lerpc(np.array(c_light,float),np.array(c_dark,float),t)
    alb*=(1+aniso(h,w,2,h/40,seed+3)[...,None]*.03)
    height=ring*.4+pores*fine*.35
    return alb,height,t

# oak planks floor 2048, covers 2.4m x 2.4m : 12 rows of planks 0.2m wide
H=W=2048; rows=12; ph=H//rows
alb=np.zeros((H,W,3)); hgt=np.zeros((H,W)); rough=np.zeros((H,W))
base_alb,base_h,base_t=wood(H,W*2,11,(190,152,110),(150,112,76),rings=70,warp=.9)
for r in range(rows):
    off=rng.integers(0,W); length=rng.choice([W//2,W*2//3,W])
    sl=slice(r*ph,(r+1)*ph)
    a=np.roll(base_alb[sl,:W],-off*(r+1)%W,1); hh=np.roll(base_h[sl,:W],-off,1)
    tint=1+rng.uniform(-.09,.07); a=a*tint
    alb[sl]=a; hgt[sl]=hh*.3
    rough[sl]=.42+rng.uniform(-.04,.05)
    # butt joints
    for j in range(0,W,length):
        x0=(j+off)%W; alb[sl,x0:x0+3]*=.55; hgt[sl,x0:x0+3]-=1
    alb[r*ph:r*ph+3]*=.5; hgt[r*ph:r*ph+3]-=1.2
rough+=base_t[:,:W]*.08+bandnoise(H,W,30,200,5)*.02
save(alb,'oak_floor_albedo.jpg'); save(normal_from_height(hgt,2.0),'oak_floor_normal.jpg'); save(np.clip(rough,0,1)*255,'oak_floor_rough.jpg')

# walnut furniture 1024
a,h,t=wood(1024,1024,21,(112,74,50),(70,44,28),rings=26,warp=.8)
save(a,'walnut_albedo.jpg'); save(normal_from_height(h,.8),'walnut_normal.jpg'); save((.38+t*.12+bandnoise(1024,1024,40,300,3)*.02)*255,'walnut_rough.jpg')
# light oak furniture 1024
a,h,t=wood(1024,1024,31,(200,170,132),(166,132,96),rings=24,warp=.8)
save(a,'oak_albedo.jpg'); save(normal_from_height(h,.8),'oak_normal.jpg')

# plaster wall 1024 (very subtle)
n=bandnoise(1024,1024,8,120,41)*.6+bandnoise(1024,1024,150,500,42)*.4
a=np.ones((1024,1024,3))*np.array([236,234,229])[None,None,:]*(1+n[...,None]*.012)
save(a,'plaster_albedo.jpg'); save(normal_from_height(n,.6),'plaster_normal.jpg')

# leather 1024
cell=bandnoise(1024,1024,60,140,51); cell=-np.abs(cell)
wr=bandnoise(1024,1024,10,40,52)
a=np.ones((1024,1024,3))*np.array([78,48,34])[None,None,:]*(1+cell[...,None]*.05+wr[...,None]*.04)
save(a,'leather_albedo.jpg'); save(normal_from_height(cell*.9+wr*.2,1.4),'leather_normal.jpg'); save((.45+cell*.05+wr*.03)*255,'leather_rough.jpg')

# woven fabric 1024 (32 threads per tile)
y=np.arange(1024)[:,None];x=np.arange(1024)[None,:]
k=2*np.pi*32/1024
warp_=(np.sin(x*k)*.5+.5)*(np.sin(y*k*2)>0); weft=(np.sin(y*k)*.5+.5)*(np.sin(x*k*2)<=0)
hh=warp_+weft+bandnoise(1024,1024,100,400,61)*.25
a=np.ones((1024,1024,3))*np.array([120,120,118])[None,None,:]*(.82+hh[...,None]*.14+bandnoise(1024,1024,3,20,62)[...,None]*.03)
save(a,'fabric_albedo.jpg'); save(normal_from_height(hh,1.5),'fabric_normal.jpg')

# carpet / rug fibers 1024
fib=bandnoise(1024,1024,200,500,71)
save(normal_from_height(fib,1.2),'carpet_normal.jpg')

# acoustic ceiling 512
n=bandnoise(512,512,60,250,81); dots=(rng.random((512,512))>.985)*-1.0
a=np.ones((512,512,3))*np.array([240,240,237])[None,None,:]*(1+n[...,None]*.01+dots[...,None]*.05)
save(a,'ceiling_albedo.jpg'); save(normal_from_height(n*.4+dots,.8),'ceiling_normal.jpg')

# brushed metal normal 512
bm=aniso(512,512,200,1.5,91); save(normal_from_height(bm*.3,1.0),'brushed_normal.jpg')
print('ok')
