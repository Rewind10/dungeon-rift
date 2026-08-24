#!/usr/bin/env python3
"""Anteprima v1.39: Negromante (float idle + cast, orbe+occhi) e migliorie ghoul (hit-squash, elite tint, morte)."""
import json, math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
S = math.sin; TAU = 2 * math.pi; PI = math.pi
def bump(x, c, w): return max(0.0, 1 - abs(x - c) / w)

def load(key):
    D = f'/home/claude/dr/public/assets/enemies/{key}'
    man = json.load(open(os.path.join(D, key + '.json')))
    imgs = {p['name']: Image.open(os.path.join(D, p['name'] + '.png')).convert('RGBA') for p in man['parts']}
    parts = {p['name']: p for p in man['parts']}
    return man, imgs, parts

MAGE = load('mage'); GH = load('ghoul')
PROF = {
 'mage': dict(OY0=900, K=2.7, order=['robe','armStaff','torso','armHand','head'], eye='#a06bff'),
 'ghoul': dict(OY0=890, K=2.7, order=['legR','legL','torso','head','armR','armL'], eye='#8bff86'),
}

def mage_pose(t, moving, atk):
    a=atk or 0; wind=bump(a,0.32,0.30); strike=bump(a,0.66,0.28); fl=t*0.9
    P={k:[0.,0.,0.] for k in ['robe','armStaff','torso','armHand','head']}
    bob=5*S(TAU*fl*0.5); lungeX=0; tilt=0
    P['robe']=[2.6*S(TAU*fl*0.42),0,0]; P['torso']=[1.4*S(TAU*fl*0.42),0,0]
    P['head']=[2.2*S(TAU*fl*0.5+0.6),0,1.5*S(TAU*fl*0.5)]
    P['armStaff']=[3*S(TAU*fl*0.5),0,2*S(TAU*fl*0.5)]; P['armHand']=[-5*S(TAU*fl*0.46),0,0]
    if a>0.001:
        P['armStaff'][0]+=-34*wind; P['armStaff'][2]+=-16*wind; P['head'][2]+=-8*wind; P['torso'][0]+=-4*wind
        P['armStaff'][0]+=18*strike; P['armHand'][0]+=-30*strike; P['armHand'][2]+=22*strike
        P['head'][2]+=12*strike; P['torso'][0]+=6*strike; bob+=-6*strike; lungeX+=10*strike
    return P,bob,lungeX,max(wind,strike)

def gh_death(p):
    return {'legR':[40*p,-6*p,30*p],'legL':[-40*p,6*p,30*p],'torso':[10*p,0,34*p],'head':[70*p,46*p,40*p],'armR':[50*p,0,20*p],'armL':[-50*p,0,20*p]}, 26*p, 1-p

def draw(key, P, bob, lungeX, alpha=1.0, hit=False, elite=False, cast=0, W=300, H=380, label=''):
    man,imgs,parts = MAGE if key=='mage' else GH
    prof=PROF[key]; SC=0.5; OX=man['originX']; OY0=prof['OY0']; CH=man['charH']; K=250.0/CH
    cv=Image.new('RGBA',(W,H),(12,14,20,255)); cx,cy=W//2,int(H*0.5)
    # aura
    au=Image.new('RGBA',(W,H),(0,0,0,0)); da=ImageDraw.Draw(au)
    ec=(160,110,255) if key=='mage' else (120,255,110)
    for rr,al in [(120,20),(85,26),(55,34)]: da.ellipse([cx-rr,cy-rr,cx+rr,cy+rr],fill=(*ec,al))
    cv.alpha_composite(au.filter(ImageFilter.GaussianBlur(18)))
    # shadow
    fy=(man['feetY']-OY0)*K
    sh=Image.new('RGBA',(W,H),(0,0,0,0)); ds=ImageDraw.Draw(sh)
    ds.ellipse([cx-25*0.62*K*8*0-38,cy+fy-9,cx+38,cy+fy+9],fill=(0,0,0,int(255*0.42*alpha)))
    cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(3)))
    grp=Image.new('RGBA',(W,H),(0,0,0,0))
    for n in prof['order']:
        if n not in parts: continue
        p=parts[n]; im0=imgs[n]; rot,dx,dy=P[n]
        w=max(1,round(im0.width/SC*K)); h=max(1,round(im0.height/SC*K))
        part=im0.resize((w,h),Image.LANCZOS)
        if elite:
            import numpy as _np
            arr=_np.array(part).astype(_np.float32)
            if key=='mage': arr[:,:,0]*=1.15; arr[:,:,2]*=1.2
            else: arr[:,:,0]*=1.3; arr[:,:,1]*=0.9
            part=Image.fromarray(_np.clip(arr,0,255).astype('uint8'))
        oxL=p['ox']/SC*K; oyL=p['oy']/SC*K
        pad=Image.new('RGBA',(w*3,h*3),(0,0,0,0)); pad.alpha_composite(part,(int(w*1.5-oxL),int(h*1.5-oyL)))
        pr=pad.rotate(-rot,resample=Image.BICUBIC,center=(w*1.5,h*1.5))
        ax=(p['ax']+dx+lungeX-OX)*K+cx; ay=(p['ay']+dy+bob-OY0)*K+cy
        grp.alpha_composite(pr,(int(ax-w*1.5),int(ay-h*1.5)))
    if alpha<1: grp=Image.blend(Image.new('RGBA',grp.size,(0,0,0,0)),grp,alpha)
    if hit:  # squash
        grp=grp.resize((int(W*1.06),int(H*0.9)),Image.LANCZOS)
        cv.alpha_composite(grp,(int(-W*0.03-5),int(H*0.1)))
    else:
        cv.alpha_composite(grp)
    # overlays: orb (mage) + eyes
    d=ImageDraw.Draw(cv)
    ecol=(150,120,255) if key=='mage' else (150,255,130)
    if key=='mage' and 'orb' in man and alpha>0.1:
        asp=parts['armStaff']; atr=P['armStaff']
        wx=(man['orb'][0]-OX+lungeX)*K+cx; wy=(man['orb'][1]-OY0+bob+atr[2])*K+cy
        for rr,al in [(22,int(90*(0.8+cast))),(12,180),(6,255)]:
            d.ellipse([wx-rr,wy-rr,wx+rr,wy+rr],fill=(*ecol,min(255,al)))
    if alpha>0.1:
        hp=parts['head']; htr=P['head']
        for (ex,ey) in man['eyes']:
            wx=(ex-OX+lungeX)*K+cx; wy=(ey-OY0+bob+htr[2])*K+cy
            R=(7 if not hit else 10)
            for rr,al in [(R*1.6,80),(R,160),(R*0.5,255)]:
                d.ellipse([wx-rr,wy-rr,wx+rr,wy+rr],fill=(*ecol,al))
    if label: d.text((8,H-18),label,fill=(210,215,225,255))
    return cv

Pm,bm,lm,_=mage_pose(0.4,False,0); mage_idle=draw('mage',Pm,bm,lm,label='NEGROMANTE idle')
Pw,bw,lw,cw=mage_pose(0.0,False,0.32); mage_wind=draw('mage',Pw,bw,lw,cast=cw,label='CAST carica')
Ps,bs,ls,cs=mage_pose(0.0,False,0.66); mage_strike=draw('mage',Ps,bs,ls,cast=cs,label='CAST sfera')
# ghoul improvements
Pn={k:[0.,0.,0.] for k in PROF['ghoul']['order']}; Pn['head']=[3,0,1]
gh_norm=draw('ghoul',Pn,6,0,label='ZOMBIE')
gh_hit=draw('ghoul',Pn,6,0,hit=True,label='COLPITO (squash+occhi)')
gh_elite=draw('ghoul',Pn,6,0,elite=True,label='ELITE (tint)')
Pd,bd,ad=gh_death(0.55); gh_death_f=draw('ghoul',Pd,bd,0,alpha=ad,label='MORTE (crollo)')

cells=[mage_idle,mage_wind,mage_strike,gh_norm,gh_hit,gh_elite,gh_death_f]
gap=6; strip=Image.new('RGBA',(300*len(cells)+gap*(len(cells)-1),380),(6,7,11,255))
x=0
for c in cells: strip.alpha_composite(c,(x,0)); x+=300+gap
strip.convert('RGB').save('/home/claude/v139_strip.png'); print('ok')
