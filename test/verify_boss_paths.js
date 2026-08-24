// Verificatore passaggio boss — celle "boss-navigabili" = pavimento con i 4 vicini (N/E/S/W) liberi
// (coerente con la collisione _blk a raggio 0.8*radius per il mega dragon r=52 → ~41.6px → tocca le celle adiacenti)
const path = require('path');
const C = require('../shared/constants.js');
const MU = require('../shared/mathutils.js');
const MG = require('../shared/mapgen.js');
const T_WALL = C.T_WALL;

function navGrid(map){
  const {w:W,h:H,grid}=map; const nav=new Uint8Array(W*H);
  const isFloor=(x,y)=> x>=0&&y>=0&&x<W&&y<H && grid[y*W+x]!==T_WALL;
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
    if(isFloor(x,y)&&isFloor(x-1,y)&&isFloor(x+1,y)&&isFloor(x,y-1)&&isFloor(x,y+1)) nav[y*W+x]=1;
  }
  return nav;
}
function nearestNav(nav,W,H,tx,ty){ // BFS ring search for a navigable tile near (tx,ty)
  for(let rad=0;rad<12;rad++){for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){
    const x=tx+dx,y=ty+dy; if(x<0||y<0||x>=W||y>=H)continue; if(nav[y*W+x])return[x,y];
  }} return null;
}
function connected(nav,W,H,a,b){
  const seen=new Uint8Array(W*H); const st=[a]; seen[a[1]*W+a[0]]=1;
  while(st.length){const [x,y]=st.pop(); if(x===b[0]&&y===b[1])return true;
    for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1],[x+1,y+1],[x-1,y-1],[x+1,y-1],[x-1,y+1]]){
      if(nx<0||ny<0||nx>=W||ny>=H)continue; const i=ny*W+nx; if(seen[i]||!nav[i])continue; seen[i]=1; st.push([nx,ny]);
    }} return false;
}

let ok=0, tot=0, fails=[];
const levels=[1,2,3,4,5,6,7];
for(let seed=1; seed<=300; seed++){
  for(const lv of levels){
    tot++;
    const map=MG.generate(seed, lv);
    const {w:W,h:H,tile}=map;
    const nav=navGrid(map);
    const sx=(map.spawn.x/tile)|0, sy=(map.spawn.y/tile)|0;
    const ex=map.exit? map.exit.x : (W>>1), ey=map.exit? map.exit.y : (H>>1);
    const a=nearestNav(nav,W,H,sx,sy), b=nearestNav(nav,W,H,ex,ey);
    if(a&&b&&connected(nav,W,H,a,b)) ok++; else fails.push(`seed=${seed} lv=${lv}`);
  }
}
console.log(`Boss-navigabile spawn↔exit: ${ok}/${tot} (${(100*ok/tot).toFixed(1)}%)`);
if(fails.length) console.log('  Falliti (primi 10):', fails.slice(0,10).join(', '));
process.exit(ok===tot?0:1);
