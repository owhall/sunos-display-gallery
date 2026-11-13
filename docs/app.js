const canvas = document.querySelector('#screen');
const ctx = canvas.getContext('2d');
const wrap = document.querySelector('#screen-wrap');
const lockPanel = document.querySelector('#lock-panel');

const TAU = Math.PI * 2;
const palette = { bg: '#08110d', green: '#9bea91', pale: '#dff8d7', orange: '#f05a28', amber: '#ffc54a', dim: '#31533a', blue: '#63b7af' };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const rnd = (a = 1, b = 0) => b + Math.random() * (a - b);

const programs = [
  { id: 'life', kind: 'CELLULAR', label: 'Documented core', path: '/usr/games/life', description: 'Conway’s cellular automaton evolves on a phosphor-green grid. Click or drag to edit living cells while it runs.', caveat: 'Documented purpose: Conway’s Game of Life. Grid dimensions, starting density, color, and tick rate are interpretive.' },
  { id: 'rain', kind: 'TERMINAL', label: 'Source-supported core', path: '/usr/games/rain', description: 'Viewed head-on, drops strike the terminal at random points and expand from . to o to O, then into small and large ASCII splashes before disappearing.', caveat: 'The staged glyph sequence follows surviving Berkeley rain source, while the SunOS manual identifies the same VAX/VMS-modeled effect. Timing, phosphor color, density, and scaling are browser interpretations.' },
  { id: 'worms', kind: 'TERMINAL', label: 'Source-supported core', path: '/usr/games/worms', description: 'Three 16-character worms—O, *, and #—crawl an eight-direction character grid, turning no more than 45° per step and respecting the screen edges.', caveat: 'Characters, default count and length, starting corner, eight headings, and constrained turns follow surviving 4.3BSD source. Font, terminal size, speed, and random path remain browser-dependent.' },
  { id: 'snake', kind: 'GAME', label: 'Source-supported core', path: '/usr/games/snake', description: 'A screensaver-style attract mode moves I automatically while the six-character S/s snake pursues it. Press arrows, hjkl, or sefc to take control; W performs a penalized space warp.', caveat: 'Characters, controls, scoring unit, warp penalty, and weighted eight-direction chase follow surviving 4.3BSD source. The self-playing attract mode reflects recollection of the display version, but its player strategy is a browser reconstruction.' },
  { id: 'rotobj', kind: '3D DEMO', label: 'Interpretive render', path: '/usr/demo/rotobj', description: 'A wireframe geometric object rotates through three axes with perspective projection and vector trails.', caveat: 'Object rotation is documented; this polyhedron, camera, shading, and motion are a Canvas-based interpretation rather than graphics-processor emulation.' },
  { id: 'flight', kind: '3D DEMO', label: 'Documented controls', path: '/usr/demo/flight', description: 'Move the pointer forward/back to dive or climb and left/right to bank. Left click slows, right click accelerates, middle click restarts; right-drag rolls without banking.', caveat: 'The mouse controls follow gp_demos(6). The terrain, cockpit, gates, physics, palette, and camera treatment remain an original Canvas interpretation.' },
  { id: 'bsuncube', kind: '3D DEMO', label: 'Documented modes', path: '/usr/demo/bsuncube', description: 'A perspective cube with hidden faces and procedural Sun emblems. Right click switches between DisplayObject and SelectView; use the diagrams to set the viewpoint.', caveat: 'The two modes and mouse mapping follow bsuncube(6). The logo artwork, projection math, proportions, and browser rendering are clean-room interpretations.' },
  { id: 'brotcube', kind: '3D DEMO', label: 'Documented geometry', path: '/usr/demo/brotcube', description: 'A skeletal cube made from 14 vectors turns through a 100-view rotation, demonstrating the old SunCore 3-D projection pipeline.', caveat: 'The 14-vector skeleton and 100-view cycle follow brotcube(6). Projection, rotation axes, line treatment, timing, and phosphor persistence remain browser interpretations.' },
  { id: 'lockscreen_default', kind: 'LOCK DEMO', label: 'Documented core', path: '/usr/bin/lockscreen_default', description: 'Recognizable Life patterns arrive in sequence—glider, pulsar, lightweight spaceship, and pentadecathlon.', caveat: 'A sequence of Game of Life patterns is documented as the default. The exact original pattern set, scale, order, and timing remain uncertain.' },
  { id: 'lockscreen', kind: 'LAUNCHER', label: 'Safe simulation', path: '/usr/bin/lockscreen', description: 'A safe browser simulation of the SunOS launcher that could run a user-supplied graphics program while the workstation was locked.', caveat: 'This page does not lock your computer and never asks for a password. The launcher role is historical; the interface shown here is interpretive.' }
];

let activeId = 'life';
let state = {};
let paused = false;
let speed = 1;
let frame = 0;
let lastTime = performance.now();
let elapsed = 0;

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const previousWidth = state.w;
  const previousHeight = state.h;
  canvas.width = Math.max(320, Math.floor(rect.width * dpr));
  canvas.height = Math.max(300, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.w = rect.width;
  state.h = rect.height;
  const materiallyChanged = previousWidth && (Math.abs(previousWidth - rect.width) > 2 || Math.abs(previousHeight - rect.height) > 2);
  if (materiallyChanged && starters[activeId]) starters[activeId]();
  else if (state.resize) state.resize();
}

function clear(color = palette.bg) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, state.w, state.h);
}

function makeGrid(cols, rows, chance = 0) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.random() < chance ? 1 : 0));
}

const starters = {
  life() {
    const cell = 12;
    const cols = Math.ceil(state.w / cell), rows = Math.ceil(state.h / cell);
    state = { ...state, cell, cols, rows, grid: makeGrid(cols, rows, .16), acc: 0, draw: drawLife, step: stepLife };
  },
  rain() {
    const fontSize = clamp(Math.floor(state.w / 55), 15, 23), charW = fontSize*.62, lineH = fontSize*1.12;
    const cols = Math.max(16,Math.floor(state.w/charW)),rows=Math.max(12,Math.floor(state.h/lineH));
    const newDrop = stage => ({x:3+Math.floor(rnd(cols-7)),y:3+Math.floor(rnd(rows-7)),stage});
    state = { ...state, fontSize, charW, lineH, cols, rows, rainAcc: 0, drops: Array.from({length:5},(_,i)=>newDrop(i)), newRainDrop:newDrop, draw: drawRain };
  },
  worms() {
    const cell = 14, cols = Math.max(18, Math.floor(state.w / cell)), rows = Math.max(12, Math.floor(state.h / cell));
    const flavors = ['O', '*', '#'];
    state = { ...state, cell, cols, rows, acc: 0, worms: flavors.map(glyph => ({ body: [{ x: 0, y: rows - 1 }], orientation: 0, max: 16, glyph })), draw: drawWorms, step: stepWorms };
  },
  snake() {
    const cell = 20, cols = Math.max(18, Math.floor(state.w / cell)), rows = Math.max(14, Math.floor(state.h / cell));
    const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
    const snake = Array.from({length: 6}, (_, i) => ({x: 3 + i, y: 3}));
    state = { ...state, cell, cols, rows, player: {x:cx,y:cy}, snake, snakeDir: 4, money: {x:cols-4,y:3}, exit: {x:cols-2,y:rows-2}, loot: 0, penalty: 0, turn: 0, ended: false, escaped: false, demo: true, demoAcc: 0, demoEndAcc: 0, message: 'AUTO DEMO · PRESS A MOVE KEY', draw: drawSnake };
    placeSnakeItem('money');
  },
  rotobj() { state = { ...state, angle: 0, draw: drawRotobj }; },
  flight() { state = { ...state, t: 0, flightSpeed: 1, pitch: 0, bank: 0, roll: 0, draw: drawFlight }; },
  bsuncube() { state = { ...state, cubeMode: 'display', view: {x:2.4,y:1.8,z:3.2}, draw: drawSunCube }; },
  brotcube() { state = { ...state, cubeView: 0, cubeAcc: 0, draw: drawRotCube }; },
  lockscreen_default() { state = { ...state, cell: 10, phase: 0, acc: 0, pattern: 0, grid: [], draw: drawLockDefault, step: stepLockDefault }; seedPattern(0); },
  lockscreen() { state = { ...state, angle: 0, draw: drawLockscreen }; renderLockPanel(); }
};

function stepLife() {
  const next = makeGrid(state.cols, state.rows);
  for (let y = 0; y < state.rows; y++) for (let x = 0; x < state.cols; x++) {
    let n = 0;
    for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) if (xx || yy) n += state.grid[(y + yy + state.rows) % state.rows][(x + xx + state.cols) % state.cols];
    next[y][x] = n === 3 || (n === 2 && state.grid[y][x]) ? 1 : 0;
  }
  state.grid = next;
}

function drawLife(dt) {
  state.acc += dt * speed;
  if (state.acc > .12) { stepLife(); state.acc = 0; }
  clear();
  ctx.strokeStyle = '#102419'; ctx.lineWidth = 1;
  for (let x = 0; x < state.w; x += state.cell) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,state.h); ctx.stroke(); }
  for (let y = 0; y < state.h; y += state.cell) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(state.w,y); ctx.stroke(); }
  ctx.fillStyle = palette.green;
  state.grid.forEach((row,y) => row.forEach((v,x) => { if (v) ctx.fillRect(x*state.cell+2,y*state.cell+2,state.cell-3,state.cell-3); }));
}

function drawRain(dt) {
  state.rainAcc+=dt*speed;
  if(state.rainAcc>.13){
    state.rainAcc=0;
    state.drops=state.drops.map(d=>d.stage>=4?state.newRainDrop(0):{...d,stage:d.stage+1});
  }
  clear();ctx.font=`${state.fontSize}px monospace`;ctx.textAlign='left';ctx.textBaseline='top';
  const patterns=[['.'],['o'],['O'],[' - ','|.|',' - '],['  -  ',' / \\ ','| O |',' \\ / ','  -  ']];
  state.drops.forEach(d=>{
    const lines=patterns[d.stage],alpha=.5+d.stage*.12;
    ctx.fillStyle=`rgba(155,234,145,${alpha})`;
    lines.forEach((line,i)=>ctx.fillText(line,(d.x-(line.length-1)/2)*state.charW,(d.y-(lines.length-1)/2+i)*state.lineH));
  });
  ctx.textBaseline='alphabetic';
  hud('RAIN / IMPACT VIEW · .  o  O  SPLASH');
}

function stepWorms() {
  const directions = [{x:1,y:-1},{x:1,y:0},{x:1,y:1},{x:0,y:1},{x:-1,y:1},{x:-1,y:0},{x:-1,y:-1},{x:0,y:-1}];
  state.worms.forEach(w => {
    const head = w.body[0];
    let choices = [-1, 0, 1].map(turn => (w.orientation + turn + 8) % 8)
      .filter(i => { const d=directions[i]; return head.x+d.x>=0 && head.x+d.x<state.cols && head.y+d.y>=0 && head.y+d.y<state.rows; });
    if (!choices.length) choices = directions.map((_,i)=>i).filter(i => { const d=directions[i]; return head.x+d.x>=0 && head.x+d.x<state.cols && head.y+d.y>=0 && head.y+d.y<state.rows; });
    w.orientation = choices[Math.floor(rnd(choices.length))];
    const d = directions[w.orientation];
    w.body.unshift({ x: head.x + d.x, y: head.y + d.y });
    if (w.body.length > w.max) w.body.pop();
  });
}

function drawWorms(dt) {
  state.acc += dt * speed; if (state.acc > .075) { stepWorms(); state.acc = 0; }
  clear(); ctx.font = `${state.cell + 2}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = palette.green;
  state.worms.forEach(w => w.body.forEach(p => ctx.fillText(w.glyph, (p.x+.5)*state.cell, (p.y+.5)*state.cell)));
  ctx.textBaseline='alphabetic'; hud('WORMS · 3 CREATURES · LENGTH 16');
}

function snakeOccupied(x, y) {
  return state.snake.some(p => p.x === x && p.y === y) || (state.player.x === x && state.player.y === y);
}

function placeSnakeItem(which) {
  let point;
  do point = {x: 1 + Math.floor(rnd(state.cols - 2)), y: 2 + Math.floor(rnd(state.rows - 3))};
  while (snakeOccupied(point.x, point.y) || (which === 'money' && point.x === state.exit.x && point.y === state.exit.y));
  state[which] = point;
}

function advancePursuer() {
  const head = state.snake[0];
  const dirs = [{x:1,y:0},{x:1,y:1},{x:0,y:1},{x:-1,y:1},{x:-1,y:0},{x:-1,y:-1},{x:0,y:-1},{x:1,y:-1}];
  const ideal = dirs.reduce((best,d,i) => {
    const distance=Math.hypot(head.x+d.x-state.player.x,head.y+d.y-state.player.y);
    return distance<best.distance?{i,distance}:best;
  },{i:0,distance:Infinity}).i;
  const candidates = dirs.map((d,i) => ({x:head.x+d.x,y:head.y+d.y,dir:i}))
    .filter(p => p.x > 0 && p.y > 1 && p.x < state.cols-1 && p.y < state.rows-1)
    .filter(p => !state.snake.slice(0,-1).some(s => s.x === p.x && s.y === p.y))
    .filter(p => !(p.x === state.money.x && p.y === state.money.y) && !(p.x === state.exit.x && p.y === state.exit.y));
  const weighted = candidates.map(p => ({...p, weight: 1 + (p.dir===ideal ? Math.max(1,state.loot/10) : 0) + (p.dir===state.snakeDir ? Math.max(1,state.loot/20) : 0)}));
  let pick=rnd(weighted.reduce((sum,p)=>sum+p.weight,0)),next=weighted[weighted.length-1];
  for(const candidate of weighted){pick-=candidate.weight;if(pick<=0){next=candidate;break;}}
  next = next || state.snake[state.snake.length-1];
  state.snakeDir = next.dir ?? state.snakeDir;
  state.snake.unshift(next); state.snake.pop();
  if (next.x === state.player.x && next.y === state.player.y) { state.ended = true; state.message = 'EATEN · SCORE FORFEITED'; }
}

function snakeCash() { return Math.max(0, state.loot - state.penalty); }

function moveSnakePlayer(dx, dy) {
  if (state.ended) return;
  const next = {x:clamp(state.player.x+dx,1,state.cols-2),y:clamp(state.player.y+dy,2,state.rows-2)};
  state.player = next; state.turn++;
  if (state.snake.some(p => p.x === next.x && p.y === next.y)) { state.ended=true;state.message='EATEN · SCORE FORFEITED';return; }
  if (next.x === state.money.x && next.y === state.money.y) {
    state.loot += 25; state.message = `MONEY COLLECTED · $${snakeCash()}`; placeSnakeItem('money');
  }
  if (next.x === state.exit.x && next.y === state.exit.y) { state.ended=true;state.escaped=true;state.message=`ESCAPED · BANKED $${snakeCash()}`;return; }
  advancePursuer();
}

function snakeWarp() {
  if (state.ended) return;
  const cost=Math.floor(state.loot/10); state.penalty+=cost;
  let point; do point={x:1+Math.floor(rnd(state.cols-2)),y:2+Math.floor(rnd(state.rows-3))}; while(snakeOccupied(point.x,point.y));
  state.player=point;state.message=`SPACE WARP · $${cost} PENALTY`;advancePursuer();
}

function snakeDirectionHint(){
  const dx=state.money.x-state.player.x,dy=state.money.y-state.player.y;
  const vertical=dy<0?'N':dy>0?'S':'',horizontal=dx<0?'W':dx>0?'E':'';
  state.message=`THE PRIZE LIES ${vertical}${horizontal || (vertical?'':'HERE')}`;
}

function snakeDemoMove(){
  const target=state.loot>=75?state.exit:state.money;
  const head=state.snake[0];
  const moves=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]
    .map(d=>({x:state.player.x+d.x,y:state.player.y+d.y,dx:d.x,dy:d.y}))
    .filter(p=>p.x>0&&p.y>1&&p.x<state.cols-1&&p.y<state.rows-1)
    .filter(p=>!state.snake.some(s=>s.x===p.x&&s.y===p.y))
    .map(p=>({...p,score:-Math.abs(p.x-target.x)-Math.abs(p.y-target.y)+Math.hypot(p.x-head.x,p.y-head.y)*.7+rnd(1)}))
    .sort((a,b)=>b.score-a.score);
  const move=moves[0];if(move)moveSnakePlayer(move.dx,move.dy);else snakeWarp();
}

function takeSnakeControl(){
  if(!state.demo)return;
  state.demo=false;state.message='MANUAL CONTROL · COLLECT $ · EXIT AT #';
}

function drawSnake(dt) {
  if(state.demo){
    if(state.ended){state.demoEndAcc+=dt;if(state.demoEndAcc>1.1)starters.snake();}
    else{state.demoAcc+=dt*speed;if(state.demoAcc>.24){state.demoAcc=0;snakeDemoMove();}}
  }
  clear();
  const boardW=state.cols*state.cell, boardH=state.rows*state.cell;
  ctx.strokeStyle=palette.green;ctx.lineWidth=2;ctx.strokeRect(.5, state.cell+.5, boardW-1, boardH-state.cell-1);
  ctx.fillStyle=palette.dim;ctx.fillRect(0,0,boardW,state.cell);
  ctx.font=`bold ${Math.max(13,state.cell-4)}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle=palette.amber;ctx.fillText('$',(state.money.x+.5)*state.cell,(state.money.y+.5)*state.cell);
  ctx.fillStyle=palette.orange;ctx.fillText('#',(state.exit.x+.5)*state.cell,(state.exit.y+.5)*state.cell);
  state.snake.forEach((p,i)=>{ctx.fillStyle=i?palette.green:palette.pale;ctx.fillText(i?'s':'S',(p.x+.5)*state.cell,(p.y+.5)*state.cell);});
  ctx.fillStyle=palette.pale;ctx.fillText('I',(state.player.x+.5)*state.cell,(state.player.y+.5)*state.cell);
  ctx.textAlign='left';ctx.font='11px monospace';ctx.fillStyle=palette.pale;ctx.fillText(`$${String(snakeCash()).padStart(4,'0')}  ${state.message}`,10,state.cell*.55);
  if(state.ended){ctx.fillStyle='rgba(0,0,0,.76)';ctx.fillRect(0,0,state.w,state.h);ctx.textAlign='center';ctx.fillStyle=state.escaped?palette.green:palette.orange;ctx.font='bold 28px monospace';ctx.fillText(state.escaped?'WINDOW CONTEXT SAVED':'THE SNAKE GOT YOU',state.w/2,state.h/2-10);ctx.fillStyle=palette.pale;ctx.font='12px monospace';ctx.fillText(state.message,state.w/2,state.h/2+22);ctx.fillText('PRESS RESTART TO PLAY AGAIN',state.w/2,state.h/2+45);ctx.textAlign='left';}
  ctx.textBaseline='alphabetic';
}

const cubeVerts = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const cubeEdges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

function rotatePoint([x,y,z], ax, ay, az) {
  let y1=y*Math.cos(ax)-z*Math.sin(ax), z1=y*Math.sin(ax)+z*Math.cos(ax), x1=x;
  let x2=x1*Math.cos(ay)+z1*Math.sin(ay), z2=-x1*Math.sin(ay)+z1*Math.cos(ay), y2=y1;
  return [x2*Math.cos(az)-y2*Math.sin(az),x2*Math.sin(az)+y2*Math.cos(az),z2];
}
function project(p, scale=110, depth=5) { const q=scale/(p[2]+depth); return [state.w/2+p[0]*q,state.h/2+p[1]*q,q]; }
function drawEdges(points, color=palette.green, width=2) { ctx.strokeStyle=color;ctx.lineWidth=width; cubeEdges.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(...points[a]);ctx.lineTo(...points[b]);ctx.stroke();}); }

function drawRotobj(dt) {
  state.angle += dt * speed; clear();
  const phi = (1+Math.sqrt(5))/2;
  const verts = [[0,1,phi],[0,-1,phi],[0,1,-phi],[0,-1,-phi],[1,phi,0],[-1,phi,0],[1,-phi,0],[-1,-phi,0],[phi,0,1],[-phi,0,1],[phi,0,-1],[-phi,0,-1]];
  const pts = verts.map(v=>project(rotatePoint(v,state.angle*.63,state.angle,state.angle*.24),80,6));
  const distances=[]; for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){const a=verts[i],b=verts[j],d=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);if(d<2.1)distances.push([i,j]);}
  ctx.strokeStyle=palette.green;ctx.lineWidth=1.5;distances.forEach(([a,b])=>{ctx.globalAlpha=.35+pts[a][2]/180;ctx.beginPath();ctx.moveTo(pts[a][0],pts[a][1]);ctx.lineTo(pts[b][0],pts[b][1]);ctx.stroke();});ctx.globalAlpha=1;
  ctx.fillStyle=palette.orange;pts.forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],2.3,0,TAU);ctx.fill();});
  hud('ROTATING OBJECT / VECTOR MODE');
}

function drawFlight(dt) {
  state.t += dt * speed * state.flightSpeed; clear('#071019');
  const horizon = state.h*.48 + state.pitch*state.h*.16;
  const attitude = state.bank*.42 + state.roll*.65;
  ctx.save();ctx.translate(state.w/2,horizon);ctx.rotate(attitude);
  const grad=ctx.createLinearGradient(0,0,0,state.h);grad.addColorStop(0,'#173c35');grad.addColorStop(1,'#07100b');ctx.fillStyle=grad;ctx.fillRect(-state.w,-2,state.w*2,state.h);
  ctx.strokeStyle='#5aa77d';ctx.lineWidth=1;
  for(let i=1;i<18;i++){const y=(i*i*5+(state.t*90)%45);ctx.globalAlpha=clamp(y/state.h,.08,.65);ctx.beginPath();ctx.moveTo(-state.w,y);ctx.lineTo(state.w,y);ctx.stroke();}
  for(let x=-10;x<=10;x++){ctx.beginPath();ctx.moveTo(x*22,0);ctx.lineTo(x*170,state.h);ctx.stroke();}
  ctx.restore();ctx.globalAlpha=1;
  for(let i=0;i<7;i++){const z=((state.t*.24+i/7)%1);const size=12+z*z*180;const x=state.w/2+Math.sin(i*9.7)*state.w*.22*z;const y=horizon+Math.cos(i*5.3)*50*z;ctx.strokeStyle=`rgba(255,197,74,${.2+z*.7})`;ctx.strokeRect(x-size/2,y-size/3,size,size*.66);}
  ctx.strokeStyle=palette.orange;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(state.w*.16,state.h);ctx.lineTo(state.w*.32,state.h*.83);ctx.lineTo(state.w*.68,state.h*.83);ctx.lineTo(state.w*.84,state.h);ctx.stroke();
  ctx.beginPath();ctx.moveTo(state.w/2-18,state.h/2);ctx.lineTo(state.w/2+18,state.h/2);ctx.moveTo(state.w/2,state.h/2-8);ctx.lineTo(state.w/2,state.h/2+8);ctx.stroke();
  hud(`SPD ${state.flightSpeed.toFixed(1)}  PITCH ${(state.pitch*45).toFixed(0).padStart(3,' ')}  BANK ${(state.bank*45).toFixed(0).padStart(3,' ')}`);
}

function sunStripe(cx,cy,size,angle=0){ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);ctx.strokeStyle=palette.orange;ctx.lineWidth=Math.max(2,size*.055);for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(-size*.34,i*size*.09);ctx.lineTo(size*.34,i*size*.09);ctx.stroke();}ctx.restore();}

function drawViewMarker(cx,cy,w,h,a,b,label){
  ctx.strokeStyle=palette.green;ctx.lineWidth=1.5;ctx.strokeRect(cx-w/2,cy-h/2,w,h);ctx.beginPath();ctx.moveTo(cx-w/2,cy);ctx.lineTo(cx+w/2,cy);ctx.moveTo(cx,cy-h/2);ctx.lineTo(cx,cy+h/2);ctx.stroke();
  const px=cx+clamp(a,-4,4)/4*w*.42,py=cy-clamp(b,-4,4)/4*h*.42;ctx.fillStyle=palette.orange;ctx.beginPath();ctx.arc(px,py,6,0,TAU);ctx.fill();ctx.fillStyle=palette.pale;ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(label,cx,cy+h/2+22);ctx.textAlign='left';
}

function drawSunCube(){
  clear();
  if(state.cubeMode==='select'){
    ctx.fillStyle=palette.pale;ctx.font='bold 17px monospace';ctx.fillText('SELECT VIEW',18,34);ctx.font='11px monospace';ctx.fillStyle=palette.green;ctx.fillText('LEFT: SET X · MIDDLE: SET Y/Z · RIGHT: DISPLAY OBJECT',18,56);
    const panelW=Math.min(260,state.w*.34),panelH=Math.min(230,state.h*.45),cy=state.h*.52;
    drawViewMarker(state.w*.3,cy,panelW,panelH,state.view.x,state.view.y,'FRONT VIEW · X / Y');
    drawViewMarker(state.w*.7,cy,panelW,panelH,state.view.x,state.view.z,'TOP VIEW · X / Z');
    ctx.fillStyle=palette.dim;ctx.fillText(`VIEWPOINT  X ${state.view.x.toFixed(1)}  Y ${state.view.y.toFixed(1)}  Z ${state.view.z.toFixed(1)}`,18,state.h-26);return;
  }
  const yaw=Math.atan2(state.view.x,state.view.z),pitch=-Math.atan2(state.view.y,Math.hypot(state.view.x,state.view.z));
  const r=cubeVerts.map(v=>rotatePoint(v,pitch,yaw,0));const p=r.map(v=>project(v,300,5));
  const faces=[
    {f:[0,3,2,1],n:[0,0,-1]},{f:[4,5,6,7],n:[0,0,1]},
    {f:[0,1,5,4],n:[0,-1,0]},{f:[3,7,6,2],n:[0,1,0]},
    {f:[1,2,6,5],n:[1,0,0]},{f:[0,4,7,3],n:[-1,0,0]}
  ].map(face=>({...face,nr:rotatePoint(face.n,pitch,yaw,0),z:face.f.reduce((s,i)=>s+r[i][2],0)/4})).filter(face=>face.nr[2]<0).sort((a,b)=>b.z-a.z);
  faces.forEach(({f,z})=>{ctx.beginPath();ctx.moveTo(p[f[0]][0],p[f[0]][1]);f.slice(1).forEach(i=>ctx.lineTo(p[i][0],p[i][1]));ctx.closePath();ctx.fillStyle=z<0?'rgba(214,226,204,.82)':'rgba(74,99,79,.82)';ctx.fill();ctx.strokeStyle=palette.green;ctx.stroke();const cx=f.reduce((s,i)=>s+p[i][0],0)/4,cy=f.reduce((s,i)=>s+p[i][1],0)/4;sunStripe(cx,cy,Math.max(24,Math.min(90,Math.hypot(p[f[0]][0]-p[f[2]][0],p[f[0]][1]-p[f[2]][1])*.32)),0);});
  hud('DISPLAY OBJECT · RIGHT CLICK: SELECT VIEW');
}

function drawRotCube(dt){
  state.cubeAcc+=dt*speed;if(state.cubeAcc>.045){state.cubeView=(state.cubeView+1)%100;state.cubeAcc=0;}
  ctx.fillStyle='rgba(8,17,13,.2)';ctx.fillRect(0,0,state.w,state.h);
  const angle=state.cubeView/100*TAU,p=cubeVerts.map(v=>project(rotatePoint(v,angle*.56,angle,angle*.27),170,5));
  drawEdges(p,palette.green,2);
  ctx.strokeStyle=palette.green;ctx.lineWidth=2;[[0,2],[4,6]].forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(p[a][0],p[a][1]);ctx.lineTo(p[b][0],p[b][1]);ctx.stroke();});
  p.forEach(q=>{ctx.fillStyle=palette.orange;ctx.fillRect(q[0]-2,q[1]-2,4,4);});hud('BROT CUBE / WIREFRAME');
}

const patternSets = [
  [[1,0],[2,1],[0,2],[1,2],[2,2]],
  [[2,0],[3,0],[4,0],[8,0],[9,0],[10,0],[0,2],[5,2],[7,2],[12,2],[0,3],[5,3],[7,3],[12,3],[0,4],[5,4],[7,4],[12,4],[2,5],[3,5],[4,5],[8,5],[9,5],[10,5],[2,7],[3,7],[4,7],[8,7],[9,7],[10,7],[0,8],[5,8],[7,8],[12,8],[0,9],[5,9],[7,9],[12,9],[0,10],[5,10],[7,10],[12,10],[2,12],[3,12],[4,12],[8,12],[9,12],[10,12]],
  [[1,0],[4,0],[0,1],[0,2],[4,2],[0,3],[1,3],[2,3],[3,3]],
  [[2,0],[3,0],[4,0],[8,0],[9,0],[10,0],[0,1],[5,1],[7,1],[12,1],[0,2],[5,2],[7,2],[12,2],[0,3],[5,3],[7,3],[12,3],[2,4],[3,4],[4,4],[8,4],[9,4],[10,4]]
];
function seedPattern(index){
  const cols=Math.ceil(state.w/state.cell),rows=Math.ceil(state.h/state.cell);state.cols=cols;state.rows=rows;state.grid=makeGrid(cols,rows);const pat=patternSets[index%patternSets.length];const ox=Math.floor(cols/2-7),oy=Math.floor(rows/2-7);pat.forEach(([x,y])=>{if(state.grid[oy+y]?.[ox+x]!==undefined)state.grid[oy+y][ox+x]=1;});
}
function stepLockDefault(){state.phase++;if(state.phase%38===0){state.pattern=(state.pattern+1)%patternSets.length;seedPattern(state.pattern);}else stepLife();}
function drawLockDefault(dt){state.acc+=dt*speed;if(state.acc>.11){stepLockDefault();state.acc=0;}clear();ctx.fillStyle=palette.green;state.grid.forEach((r,y)=>r.forEach((v,x)=>{if(v){ctx.fillRect(x*state.cell+1,y*state.cell+1,state.cell-2,state.cell-2);}}));ctx.fillStyle=palette.orange;ctx.font='11px monospace';ctx.fillText(`PATTERN ${state.pattern+1}/${patternSets.length}`,14,24);}

function renderLockPanel(){
  lockPanel.hidden=false;
  lockPanel.innerHTML=`<div class="lock-card"><p class="eyebrow">LOCKSCREEN SIMULATOR</p><h3>Choose graphics program</h3><p>Historical role, safe browser behavior. This will not lock your workstation.</p><label for="lock-choice">GFX-PROGRAM</label><select id="lock-choice"><option>life</option><option>rain</option><option>worms</option><option>brotcube</option></select><button id="engage-lock" type="button">Engage simulated lock</button></div>`;
  document.querySelector('#engage-lock').addEventListener('click',()=>{const choice=document.querySelector('#lock-choice').value;lockPanel.innerHTML=`<div class="lock-card"><p class="eyebrow">WORKSTATION LOCKED · SIMULATION</p><h3>${choice} is running</h3><p>Press any key or click to return. No password is requested or stored.</p></div>`;lockPanel.dataset.engaged='true';});
}
function drawLockscreen(dt){state.angle+=dt*speed;clear();ctx.strokeStyle=palette.dim;for(let i=0;i<18;i++){const r=(i*42+state.angle*90)%(Math.max(state.w,state.h));ctx.beginPath();ctx.arc(state.w/2,state.h/2,r,0,TAU);ctx.stroke();}sunStripe(state.w/2,state.h/2,130,state.angle*.2);}

function hud(text){ctx.save();ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(12,12,Math.min(270,text.length*8+18),27);ctx.fillStyle=palette.pale;ctx.font='11px monospace';ctx.fillText(text,22,30);ctx.restore();}

function setProgram(id){
  activeId=id; lockPanel.hidden=true;lockPanel.removeAttribute('data-engaged');
  const p=programs.find(x=>x.id===id);document.querySelectorAll('.program-button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.id===id)));
  document.querySelector('#window-title').textContent=p.path;document.querySelector('#program-name').textContent=p.id;document.querySelector('#program-description').textContent=p.description;document.querySelector('#program-caveat').textContent=p.caveat;document.querySelector('#accuracy-label').textContent=p.label.toUpperCase();
  state={w:canvas.clientWidth,h:canvas.clientHeight};starters[id]();paused=false;syncPause();canvas.focus({preventScroll:true});
}

function syncPause(){document.querySelector('#pause-button').innerHTML=paused?'▶&nbsp; Resume':'Ⅱ&nbsp; Pause';document.querySelector('#status-text').textContent=paused?'PAUSED':'RUNNING';document.querySelector('#status-light').style.background=paused?'#ffc54a':'#5fe064';document.querySelector('#status-light').style.boxShadow=paused?'0 0 8px #ffc54a':'0 0 8px #5fe064';}

programs.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='program-button';b.dataset.id=p.id;b.innerHTML=`<span class="number">${String(i+1).padStart(2,'0')}</span><strong>${p.id}</strong><span class="kind">${p.kind}</span>`;b.addEventListener('click',()=>setProgram(p.id));document.querySelector('#program-list').append(b);});
document.querySelector('#pause-button').addEventListener('click',()=>{paused=!paused;syncPause();});
document.querySelector('#restart-button').addEventListener('click',()=>setProgram(activeId));
document.querySelector('#speed').addEventListener('input',e=>speed=Number(e.target.value));
document.querySelector('#fullscreen-button').addEventListener('click',()=>{if(!document.fullscreenElement)wrap.requestFullscreen?.();else document.exitFullscreen?.();});
lockPanel.addEventListener('pointerdown',()=>{if(lockPanel.dataset.engaged){lockPanel.hidden=true;lockPanel.removeAttribute('data-engaged');}});
window.addEventListener('keydown',e=>{
  if(lockPanel.dataset.engaged){lockPanel.hidden=true;lockPanel.removeAttribute('data-engaged');return;}
  if(activeId==='snake'){
    if(e.key==='W'){e.preventDefault();takeSnakeControl();snakeWarp();return;}
    if(e.key==='p'||e.key==='d'){e.preventDefault();takeSnakeControl();snakeDirectionHint();return;}
    const edgeMoves={A:[-state.cols,0],T:[0,-state.rows],P:[state.cols,0],B:[0,state.rows]};
    if(edgeMoves[e.key]){e.preventDefault();takeSnakeControl();moveSnakePlayer(edgeMoves[e.key][0],edgeMoves[e.key][1]);return;}
    const map={ArrowUp:[0,-1],k:[0,-1],e:[0,-1],ArrowDown:[0,1],j:[0,1],c:[0,1],ArrowLeft:[-1,0],h:[-1,0],s:[-1,0],ArrowRight:[1,0],l:[1,0],f:[1,0]};
    const move=map[e.key];if(move){e.preventDefault();takeSnakeControl();moveSnakePlayer(move[0],move[1]);return;}
  }
  if(e.key===' '){e.preventDefault();paused=!paused;syncPause();}
});

let painting=false;
function paintCell(e){if(activeId!=='life')return;const r=canvas.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/state.cell),y=Math.floor((e.clientY-r.top)/state.cell);if(state.grid[y]?.[x]!==undefined)state.grid[y][x]=painting?1:1-state.grid[y][x];}
canvas.addEventListener('pointerdown',e=>{
  const r=canvas.getBoundingClientRect(),nx=clamp((e.clientX-r.left)/r.width,-1,1),ny=clamp((e.clientY-r.top)/r.height,-1,1);
  if(activeId==='life'){painting=true;canvas.setPointerCapture(e.pointerId);paintCell(e);return;}
  if(activeId==='flight'){
    e.preventDefault();
    if(e.button===0)state.flightSpeed=clamp(state.flightSpeed-.2,.2,3);
    if(e.button===1){setProgram('flight');return;}
    if(e.button===2)state.flightSpeed=clamp(state.flightSpeed+.2,.2,3);
    return;
  }
  if(activeId==='bsuncube'){
    e.preventDefault();
    if(e.button===2){state.cubeMode=state.cubeMode==='display'?'select':'display';return;}
    if(state.cubeMode==='select'){
      const valueX=clamp((nx-.3)/.34*4,-4,4),valueY=clamp((.52-ny)/.45*4,-4,4);
      if(nx<.5&&e.button===0)state.view.x=valueX;
      if(nx<.5&&e.button===1)state.view.y=valueY;
      if(nx>=.5&&e.button===1)state.view.z=valueY;
      if(Math.hypot(state.view.x,state.view.y,state.view.z)<.6)state.view.z=1;
    }
  }
});
canvas.addEventListener('pointermove',e=>{
  if(painting)paintCell(e);
  if(activeId==='flight'){
    const r=canvas.getBoundingClientRect(),x=clamp(((e.clientX-r.left)/r.width-.5)*2,-1,1),y=clamp(((e.clientY-r.top)/r.height-.5)*2,-1,1);
    state.pitch=y;
    if(e.buttons&2)state.roll=x;else{state.bank=x;state.roll*=.86;}
  }
});
canvas.addEventListener('pointerup',()=>painting=false);
canvas.addEventListener('contextmenu',e=>{if(activeId==='flight'||activeId==='bsuncube')e.preventDefault();});
new ResizeObserver(resize).observe(canvas);

function loop(now){const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;if(!paused&&state.draw)state.draw(dt);frame++;elapsed+=dt;if(elapsed>1){document.querySelector('#fps-label').textContent=`${Math.round(frame/elapsed)} FPS`;frame=0;elapsed=0;}requestAnimationFrame(loop);}
setProgram('life');requestAnimationFrame(loop);
