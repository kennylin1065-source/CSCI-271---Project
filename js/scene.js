import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// ── RENDERER ─────────────────────────────────────────────────────────────────
const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ── SCENE ─────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.fog   = new THREE.FogExp2(0x200800, 0.014);

// ── CAMERA ────────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.05, 600);
// Over-the-shoulder constants
const CAM_DIST       = 5.0;   // distance behind player
const CAM_HEIGHT     = 2.2;   // height above player feet
const CAM_SHOULDER   = 0.55;  // right-side offset
const CAM_LOOK_UP    = 1.0;   // look-at point height above feet
const CAM_LERP       = 10;    // smoothness (higher = tighter)

// ── LIGHTS ────────────────────────────────────────────────────────────────────
const sunLight = new THREE.DirectionalLight(0xffe8a0, 3.2);
sunLight.position.set(50, 80, 40);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far  = 250;
sunLight.shadow.camera.left = sunLight.shadow.camera.bottom = -60;
sunLight.shadow.camera.right = sunLight.shadow.camera.top   = 60;
scene.add(sunLight);

scene.add(new THREE.AmbientLight(0x4a1a06, 2.2));

const rimLight = new THREE.DirectionalLight(0xff5500, 0.7);
rimLight.position.set(-40, 15, -25);
scene.add(rimLight);

// ── TEXTURES ──────────────────────────────────────────────────────────────────
const texLoader = new THREE.TextureLoader();

// ── STARFIELD ─────────────────────────────────────────────────────────────────
{
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(8000 * 3);
  for (let i = 0; i < 8000; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random()*2-1), r = 350+Math.random()*150;
    pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.sin(ph)*Math.sin(th); pos[i*3+2]=r*Math.cos(ph);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color:0xffffff, size:0.7, sizeAttenuation:true, transparent:true, opacity:0.85, depthWrite:false })));
}

// ── EARTH ─────────────────────────────────────────────────────────────────────
const earth = new THREE.Mesh(new THREE.SphereGeometry(20,64,64), new THREE.MeshStandardMaterial({
  map:texLoader.load('assets/earth/earth.jpg'), normalMap:texLoader.load('assets/earth/earth_normal_map.png'),
  normalScale:new THREE.Vector2(3,3), aoMap:texLoader.load('assets/earth/earth_ao_map.png'),
  roughness:0.6, metalness:0.05,
}));
earth.position.set(130, 90, -300);
scene.add(earth);
const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(20.4,64,64), new THREE.MeshStandardMaterial({
  map:texLoader.load('assets/earth/earth_clouds.jpg'), transparent:true, opacity:0.45, roughness:1,
  blending:THREE.AdditiveBlending, depthWrite:false,
}));
earth.add(cloudMesh);
const atmMat = new THREE.MeshPhongMaterial({ color:0x1155cc, transparent:true, opacity:0.14, side:THREE.BackSide, blending:THREE.AdditiveBlending, depthWrite:false });
earth.add(new THREE.Mesh(new THREE.SphereGeometry(21.2,32,32), atmMat));

// ── GROUND ────────────────────────────────────────────────────────────────────
const GROUND_Y = 0;
const groundGeo = new THREE.PlaneGeometry(500, 500, 80, 80);
const gp = groundGeo.attributes.position.array;
for (let i=0;i<gp.length;i+=3) gp[i+2]+=(Math.random()-0.5)*0.9;
groundGeo.attributes.position.needsUpdate=true; groundGeo.computeVertexNormals();
const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color:0x6b2a0e, roughness:0.98, metalness:0.0 }));
ground.rotation.x=-Math.PI/2; ground.position.y=GROUND_Y; ground.receiveShadow=true;
scene.add(ground);

// ── ROCKS ─────────────────────────────────────────────────────────────────────
function makeRock(x,z,s) {
  const g=new THREE.DodecahedronGeometry(s,0), v=g.attributes.position.array;
  for(let i=0;i<v.length;i++) v[i]+=(Math.random()-0.5)*s*0.35;
  g.attributes.position.needsUpdate=true; g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x5a2008,roughness:0.96,metalness:0}));
  m.position.set(x,GROUND_Y+s*0.5,z); m.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
  m.castShadow=true; m.receiveShadow=true; scene.add(m);
}
for(let i=0;i<80;i++){const a=Math.random()*Math.PI*2,d=6+Math.random()*80;makeRock(Math.cos(a)*d,Math.sin(a)*d,0.15+Math.random()*1.4);}

// ── HABITATS ──────────────────────────────────────────────────────────────────
function makeHabitat(x,z) {
  const g=new THREE.Group(), m=new THREE.MeshStandardMaterial({color:0xd4c8b8,roughness:0.7,metalness:0.2});
  const cyl=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.5,3.5,20),m); cyl.castShadow=true; cyl.receiveShadow=true; g.add(cyl);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(2.5,20,10,0,Math.PI*2,0,Math.PI*0.5),m); dome.position.y=1.75; dome.castShadow=true; g.add(dome);
  const winMat=new THREE.MeshPhysicalMaterial({color:0x88ccff,transparent:true,opacity:0.6,roughness:0.1,metalness:0.5});
  const win=new THREE.Mesh(new THREE.CircleGeometry(0.4,12),winMat); win.position.set(2.45,0.5,0); win.rotation.y=Math.PI/2; g.add(win);
  const stripe=new THREE.Mesh(new THREE.CylinderGeometry(2.51,2.51,0.2,20),new THREE.MeshStandardMaterial({color:0xff5500,roughness:0.6,emissive:0xaa2200,emissiveIntensity:0.25}));
  stripe.position.y=0.9; g.add(stripe);
  const door=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.6,0.1),new THREE.MeshStandardMaterial({color:0x888888,roughness:0.4,metalness:0.6}));
  door.position.set(0,-0.75,2.5); g.add(door);
  g.position.set(x,GROUND_Y+1.75,z); scene.add(g);
}
makeHabitat(-14,-5); makeHabitat(-20,6); makeHabitat(-10,-16); makeHabitat(18,-12);

// ── SOLAR PANELS ─────────────────────────────────────────────────────────────
function makeSolarPanel(x,z,ang) {
  const g=new THREE.Group();
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,3,8),new THREE.MeshStandardMaterial({color:0x888888,metalness:0.7,roughness:0.3}));
  pole.castShadow=true; g.add(pole);
  const panel=new THREE.Mesh(new THREE.BoxGeometry(4,0.07,1.6),new THREE.MeshStandardMaterial({color:0x1a3a88,roughness:0.3,metalness:0.6,emissive:0x0a1844,emissiveIntensity:0.3}));
  panel.position.y=1.7; panel.rotation.x=-0.25; panel.castShadow=true; g.add(panel);
  g.position.set(x,GROUND_Y+1.5,z); g.rotation.y=ang; scene.add(g);
}
makeSolarPanel(-6,-10,0.2); makeSolarPanel(-4,-14,-0.3); makeSolarPanel(-9,-19,0.1);
makeSolarPanel(6,-8,-0.2); makeSolarPanel(20,-8,0.4); makeSolarPanel(22,-14,-0.1);

// ── COLLECTIBLE SYSTEM ───────────────────────────────────────────────────────
const COLLECT_RADIUS = 2.2;
const collectibles   = [];

const PICKUP_DEFS = {
  oxygen: {
    color: 0x00ccff, emissive: 0x004488, amount: 12, label: '⚗️ +12 O₂',
    make(grp) {
      // Main canister body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.75,16),
        new THREE.MeshStandardMaterial({color:0x00aadd,roughness:0.3,metalness:0.5,emissive:0x003366,emissiveIntensity:0.4}));
      grp.add(body);
      // Top cap
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22,12,8),
        new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.2,metalness:0.6}));
      cap.position.y=0.375; grp.add(cap);
      // Valve
      const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.15,8),
        new THREE.MeshStandardMaterial({color:0xdddddd,roughness:0.3,metalness:0.8}));
      valve.position.y=0.62; grp.add(valve);
      // Stripe
      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.225,0.225,0.08,16),
        new THREE.MeshStandardMaterial({color:0x00ffff,roughness:0.4,emissive:0x008888,emissiveIntensity:0.8}));
      stripe.position.y=0.1; grp.add(stripe);
    }
  },
  food: {
    color: 0x44ff44, emissive: 0x114411, amount: 10, label: '🌱 +10 Food',
    make(grp) {
      // Crate body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55,0.45,0.55),
        new THREE.MeshStandardMaterial({color:0x226622,roughness:0.6,metalness:0.1,emissive:0x0a2a0a,emissiveIntensity:0.3}));
      grp.add(body);
      // Crate lid
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.57,0.06,0.57),
        new THREE.MeshStandardMaterial({color:0x33aa33,roughness:0.5,metalness:0.15}));
      lid.position.y=0.255; grp.add(lid);
      // Cross planks
      const plankMat = new THREE.MeshStandardMaterial({color:0x55ff55,roughness:0.4,emissive:0x225522,emissiveIntensity:0.6});
      const hPlank = new THREE.Mesh(new THREE.BoxGeometry(0.56,0.04,0.09), plankMat);
      hPlank.position.y=0.21; grp.add(hPlank);
      const vPlank = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.04,0.56), plankMat);
      vPlank.position.y=0.21; grp.add(vPlank);
      // Corner bolts
      [[-0.24,-0.24],[0.24,-0.24],[-0.24,0.24],[0.24,0.24]].forEach(([bx,bz])=>{
        const bolt=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.46,6),
          new THREE.MeshStandardMaterial({color:0x888888,metalness:0.8,roughness:0.2}));
        bolt.position.set(bx,0,bz); grp.add(bolt);
      });
    }
  },
  power: {
    color: 0xffcc00, emissive: 0x664400, amount: 15, label: '⚡ +15 Power',
    make(grp) {
      // Battery body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.38,0.7,0.25),
        new THREE.MeshStandardMaterial({color:0xdd8800,roughness:0.4,metalness:0.3,emissive:0x664400,emissiveIntensity:0.4}));
      grp.add(body);
      // Terminal top
      const term = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.12,10),
        new THREE.MeshStandardMaterial({color:0xdddddd,roughness:0.2,metalness:0.9}));
      term.position.y=0.41; grp.add(term);
      // Charge indicator bars
      [0.18,0.06,-0.06,-0.18].forEach((y,i)=>{
        const bar=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.06,0.04),
          new THREE.MeshStandardMaterial({
            color:i<2?0xffee00:0x333300, roughness:0.3,
            emissive:i<2?0xffaa00:0x000000, emissiveIntensity:i<2?1.2:0
          }));
        bar.position.set(0,y,0.135); grp.add(bar);
      });
      // Bolt symbol
      const bolt1=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.28,0.04),
        new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffff00,emissiveIntensity:1.5}));
      bolt1.position.set(0,0,0.14); bolt1.rotation.z=0.4; grp.add(bolt1);
    }
  }
};

// Glow ring under each pickup
function makeGlowRing(color) {
  const geo = new THREE.RingGeometry(0.5, 0.8, 24);
  const mat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.5, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = -Math.PI/2;
  ring.position.y = 0.02;
  return { mesh:ring, mat };
}

// Floating label sprite above pickup
function makeLabel(text, color) {
  const canvas2 = document.createElement('canvas');
  canvas2.width=256; canvas2.height=64;
  const ctx = canvas2.getContext('2d');
  ctx.font='bold 28px Orbitron, monospace';
  ctx.fillStyle = `#${color.toString(16).padStart(6,'0')}`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text, 128, 32);
  const tex=new THREE.CanvasTexture(canvas2);
  const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});
  const sprite=new THREE.Sprite(mat);
  sprite.scale.set(2.2,0.55,1);
  sprite.position.y=1.4;
  return sprite;
}

// Spawn a collectible
function spawnPickup(type, x, z) {
  const def   = PICKUP_DEFS[type];
  const group = new THREE.Group();
  group.position.set(x, GROUND_Y+0.6, z);

  // Build the item mesh
  const itemGrp = new THREE.Group();
  def.make(itemGrp);
  group.add(itemGrp);

  // Glow ring
  const { mesh:ring, mat:ringMat } = makeGlowRing(def.color);
  group.add(ring);

  // Point light glow
  const light = new THREE.PointLight(def.color, 1.5, 4.5);
  light.position.y = 0.6;
  group.add(light);

  // Label sprite
  const label = makeLabel(def.label, def.color);
  group.add(label);

  scene.add(group);

  collectibles.push({
    type, group, itemGrp, ring, ringMat, light, label,
    collected: false,
    respawnAt:  0,
    baseY:      GROUND_Y+0.6,
    def,
  });
  return collectibles[collectibles.length-1];
}

// Place pickups across the world
const pickupPositions = [
  // Oxygen canisters
  { type:'oxygen', x:6,   z:4   }, { type:'oxygen', x:-5,  z:8   },
  { type:'oxygen', x:14,  z:3   }, { type:'oxygen', x:-18, z:-8  },
  { type:'oxygen', x:3,   z:-18 }, { type:'oxygen', x:20,  z:10  },
  // Food crates
  { type:'food',   x:-8,  z:4   }, { type:'food',   x:10,  z:-6  },
  { type:'food',   x:-14, z:12  }, { type:'food',   x:8,   z:16  },
  { type:'food',   x:-3,  z:-12 }, { type:'food',   x:22,  z:-4  },
  // Power cells
  { type:'power',  x:4,   z:-8  }, { type:'power',  x:-10, z:-20 },
  { type:'power',  x:16,  z:-18 }, { type:'power',  x:-20, z:16  },
  { type:'power',  x:12,  z:12  }, { type:'power',  x:-6,  z:20  },
];
pickupPositions.forEach(p => spawnPickup(p.type, p.x, p.z));

// Particle burst on collection
const BURST_PARTICLES = [];
function spawnBurst(pos, color) {
  const count=18;
  const geo=new THREE.BufferGeometry();
  const positions=new Float32Array(count*3);
  const velocities=[];
  for(let i=0;i<count;i++){
    positions[i*3]=pos.x; positions[i*3+1]=pos.y+0.6; positions[i*3+2]=pos.z;
    const theta=Math.random()*Math.PI*2, phi=Math.random()*Math.PI;
    velocities.push(new THREE.Vector3(
      Math.sin(phi)*Math.cos(theta)*3,
      Math.abs(Math.cos(phi))*4+1,
      Math.sin(phi)*Math.sin(theta)*3
    ));
  }
  geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({color,size:0.18,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending}));
  scene.add(pts);
  BURST_PARTICLES.push({ pts, velocities, positions, life:1.0, geo });
}

// ── SUIT MATERIALS ─────────────────────────────────────────────────────────────
const suitMat   = new THREE.MeshStandardMaterial({color:0xe8ddd0,roughness:0.75,metalness:0.05});
const accentMat = new THREE.MeshStandardMaterial({color:0xcc4400,roughness:0.65,metalness:0.15});
const helmetMat = new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.25,metalness:0.1});
const visorMat  = new THREE.MeshPhysicalMaterial({color:0x88ccff,transparent:true,opacity:0.5,roughness:0.05,metalness:0.8});
const tankMat   = new THREE.MeshStandardMaterial({color:0xdddddd,roughness:0.4,metalness:0.6});
const stripeMat = new THREE.MeshStandardMaterial({color:0xff5500,roughness:0.6,emissive:0xaa2200,emissiveIntensity:0.3});
const bootMat   = new THREE.MeshStandardMaterial({color:0x2a1a0a,roughness:0.9,metalness:0.1});
const gloveMat  = new THREE.MeshStandardMaterial({color:0xccbbaa,roughness:0.8,metalness:0.05});

function buildSuit(root) {
  const suit=new THREE.Group();
  const helmGrp=new THREE.Group();
  helmGrp.add(new THREE.Mesh(new THREE.SphereGeometry(0.155,32,32),helmetMat));
  const visor=new THREE.Mesh(new THREE.SphereGeometry(0.135,32,24,0,Math.PI*2,0,Math.PI*0.55),visorMat);
  visor.position.z=0.04; visor.rotation.x=-0.3; helmGrp.add(visor);
  const neckRing=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.115,0.06,24),helmetMat);
  neckRing.position.y=-0.12; helmGrp.add(neckRing);
  [-1,1].forEach(s=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.05,10),tankMat);b.rotation.z=Math.PI/2;b.position.set(s*0.145,0.04,0);helmGrp.add(b);});
  const ant=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.22,8),tankMat);ant.position.set(0.09,0.22,0);helmGrp.add(ant);
  const antTip=new THREE.Mesh(new THREE.SphereGeometry(0.014,8,8),stripeMat);antTip.position.set(0.09,0.33,0);helmGrp.add(antTip);
  helmGrp.position.set(0,1.65,0); suit.add(helmGrp);
  const chest=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.28,0.16),suitMat);chest.position.set(0,1.22,0.035);suit.add(chest);
  const cs=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.26,0.165),stripeMat);cs.position.set(0,1.22,0.036);suit.add(cs);
  const pack=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.36,0.12),suitMat);pack.position.set(0,1.15,-0.12);suit.add(pack);
  [-1,1].forEach(s=>{
    const t=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.32,16),tankMat);t.position.set(s*0.14,1.15,-0.17);suit.add(t);
    const c=new THREE.Mesh(new THREE.SphereGeometry(0.045,12,8),tankMat);c.position.set(s*0.14,1.31,-0.17);suit.add(c);
    const sh=new THREE.Mesh(new THREE.SphereGeometry(0.1,16,12,0,Math.PI*2,0,Math.PI*0.6),accentMat);sh.rotation.z=s*Math.PI/2;sh.rotation.x=-0.3;sh.position.set(s*0.22,1.35,0);suit.add(sh);
    const band=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.04,16),stripeMat);band.position.set(s*0.3,1.12,0);suit.add(band);
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.055,0.22,16),suitMat);arm.position.set(s*0.3,1.02,0);suit.add(arm);
    const glove=new THREE.Mesh(new THREE.SphereGeometry(0.055,12,10),gloveMat);glove.scale.y=1.4;glove.position.set(s*0.3,0.75,0);suit.add(glove);
    const gs=new THREE.Mesh(new THREE.CylinderGeometry(0.057,0.057,0.03,14),stripeMat);gs.position.set(s*0.3,0.86,0);suit.add(gs);
    const thigh=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.065,0.25,14),suitMat);thigh.position.set(s*0.105,0.66,0);suit.add(thigh);
    const ts=new THREE.Mesh(new THREE.CylinderGeometry(0.077,0.077,0.03,14),stripeMat);ts.position.set(s*0.105,0.77,0);suit.add(ts);
    const knee=new THREE.Mesh(new THREE.SphereGeometry(0.065,12,10),accentMat);knee.scale.z=0.6;knee.position.set(s*0.105,0.47,0.02);suit.add(knee);
    const bootLow=new THREE.Mesh(new THREE.CylinderGeometry(0.068,0.072,0.22,14),suitMat);bootLow.position.set(s*0.105,0.28,0);suit.add(bootLow);
    const foot=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.07,0.2),bootMat);foot.position.set(s*0.105,0.12,0.03);suit.add(foot);
    const ar=new THREE.Mesh(new THREE.CylinderGeometry(0.072,0.072,0.04,14),accentMat);ar.position.set(s*0.105,0.165,0);suit.add(ar);
  });
  const belt=new THREE.Mesh(new THREE.CylinderGeometry(0.145,0.145,0.06,20),accentMat);belt.position.set(0,0.9,0);suit.add(belt);
  suit.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
  root.add(suit);
  return {helmGrp};
}

// ── PLAYER ────────────────────────────────────────────────────────────────────
const player = new THREE.Group();
player.position.set(0, GROUND_Y, 0);
scene.add(player);

let suitRef=null, mixer=null, idleAction=null, walkAction=null, isWalking=false;

new FBXLoader().load('assets/player.fbx', fbx=>{
  fbx.scale.setScalar(0.022); fbx.position.y=0;
  fbx.traverse(c=>{if(c.isMesh){c.material=suitMat.clone();c.castShadow=true;c.receiveShadow=true;}});
  player.add(fbx);
  suitRef=buildSuit(fbx);
  if(fbx.animations.length>0){
    mixer=new THREE.AnimationMixer(fbx);
    idleAction=mixer.clipAction(fbx.animations[0]); idleAction.play();
    if(fbx.animations.length>1){walkAction=mixer.clipAction(fbx.animations[1]);}
  }
}, undefined, ()=>{
  const cap=new THREE.Mesh(new THREE.CapsuleGeometry(0.22,0.9,8,16),suitMat);
  cap.position.y=0.88; cap.castShadow=true; player.add(cap);
  suitRef=buildSuit(player);
});

// ── ROVER ─────────────────────────────────────────────────────────────────────
new FBXLoader().load('assets/rover/mars_rover.fbx', fbx=>{
  const b=texLoader.load('assets/rover/basecolor.png');
  const n=texLoader.load('assets/rover/normal.png');
  const a=texLoader.load('assets/rover/ao.png');
  const r=texLoader.load('assets/rover/roughness.png');
  const m=texLoader.load('assets/rover/metallic.png');
  fbx.scale.setScalar(0.007); fbx.position.set(-9,GROUND_Y,-7); fbx.rotation.y=0.5;
  fbx.traverse(c=>{if(c.isMesh){c.material=new THREE.MeshStandardMaterial({map:b,normalMap:n,normalScale:new THREE.Vector2(1,1),aoMap:a,roughnessMap:r,roughness:0.85,metalnessMap:m,metalness:0.7});c.castShadow=true;c.receiveShadow=true;}});
  scene.add(fbx);
}, undefined, ()=>{});

// ── DUST ──────────────────────────────────────────────────────────────────────
const DUST_N=700;
const dustGeo=new THREE.BufferGeometry();
const dustPos=new Float32Array(DUST_N*3);
for(let i=0;i<DUST_N;i++){dustPos[i*3]=(Math.random()-0.5)*120;dustPos[i*3+1]=Math.random()*5;dustPos[i*3+2]=(Math.random()-0.5)*120;}
dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
scene.add(new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xcc6633,size:0.07,transparent:true,opacity:0.45,depthWrite:false})));

// ── INPUT ─────────────────────────────────────────────────────────────────────
const keys={w:false,a:false,s:false,d:false,shift:false};
const isMgmtOpen=()=>!document.getElementById('mgmt-modal').classList.contains('hidden');

document.addEventListener('keydown', e=>{
  if(isMgmtOpen()) return;
  const k=e.key.toLowerCase();
  if(k==='w'||k==='arrowup')    keys.w=true;
  if(k==='s'||k==='arrowdown')  keys.s=true;
  if(k==='a'||k==='arrowleft')  keys.a=true;
  if(k==='d'||k==='arrowright') keys.d=true;
  if(k==='shift') keys.shift=true;
});
document.addEventListener('keyup', e=>{
  const k=e.key.toLowerCase();
  if(k==='w'||k==='arrowup')    keys.w=false;
  if(k==='s'||k==='arrowdown')  keys.s=false;
  if(k==='a'||k==='arrowleft')  keys.a=false;
  if(k==='d'||k==='arrowright') keys.d=false;
  if(k==='shift') keys.shift=false;
});

// ── POINTER LOCK ──────────────────────────────────────────────────────────────
let yaw=0, pitch=0.28; // start with slight downward tilt

canvas.addEventListener('click',()=>{
  if(!document.getElementById('hud').classList.contains('hidden') && !isMgmtOpen())
    canvas.requestPointerLock();
});
document.addEventListener('pointerlockchange',()=>{
  const locked=document.pointerLockElement===canvas;
  const p=document.getElementById('lock-prompt');
  if(p) p.classList.toggle('hidden',locked);
});
document.addEventListener('mousemove',e=>{
  if(document.pointerLockElement!==canvas) return;
  yaw  -=e.movementX*0.002;
  pitch -=e.movementY*0.0018;
  pitch  =Math.max(-0.15, Math.min(0.7, pitch)); // limit pitch range
});

// ── CAMERA VECTORS ────────────────────────────────────────────────────────────
const camPos     = new THREE.Vector3(0,3,5);
const camLookAt  = new THREE.Vector3();
const moveDir    = new THREE.Vector3();
const tmpVec     = new THREE.Vector3();

// ── RESIZE ────────────────────────────────────────────────────────────────────
window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});

// ── GAME START GATE ────────────────────────────────────────────────────────────
let gameStarted=false;
document.getElementById('btn-start').addEventListener('click',()=>{gameStarted=true;});

// ── ANIMATE ───────────────────────────────────────────────────────────────────
const clock=new THREE.Clock();
const WALK_SPEED=4.5, RUN_SPEED=9.0;

function animate() {
  requestAnimationFrame(animate);
  const delta  = Math.min(clock.getDelta(), 0.05);
  const elapsed= clock.elapsedTime;

  // Earth
  earth.rotation.y+=0.00025; cloudMesh.rotation.y+=0.00015;
  atmMat.opacity=0.12+Math.sin(elapsed*0.4)*0.03;

  // Dust
  for(let i=0;i<DUST_N;i++){
    dustPos[i*3]  +=0.01+Math.sin(elapsed*0.15+i)*0.003;
    dustPos[i*3+1]+=Math.sin(elapsed*0.35+i)*0.003;
    if(dustPos[i*3]>60)  dustPos[i*3]=-60;
    if(dustPos[i*3+1]>5) dustPos[i*3+1]=0.1;
    if(dustPos[i*3+1]<0) dustPos[i*3+1]=0.05;
  }
  dustGeo.attributes.position.needsUpdate=true;

  if(!gameStarted){ renderer.render(scene,camera); return; }

  if(mixer) mixer.update(delta);

  // ── MOVEMENT ──────────────────────────────────────────────────────────────
  const mgmtOpen=isMgmtOpen();
  if(!mgmtOpen){
    const speed=keys.shift?RUN_SPEED:WALK_SPEED;
    const fwd  =new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
    const right =new THREE.Vector3( Math.cos(yaw),0,-Math.sin(yaw));
    moveDir.set(0,0,0);
    if(keys.w) moveDir.addScaledVector(fwd,  1);
    if(keys.s) moveDir.addScaledVector(fwd, -1);
    if(keys.a) moveDir.addScaledVector(right,-1);
    if(keys.d) moveDir.addScaledVector(right, 1);
    const moving=moveDir.lengthSq()>0.001;
    if(moving){
      moveDir.normalize();
      player.position.addScaledVector(moveDir,speed*delta);
      // Smooth rotation to face direction
      const tgt=Math.atan2(moveDir.x,moveDir.z);
      let diff=tgt-player.rotation.y;
      while(diff>Math.PI)diff-=Math.PI*2; while(diff<-Math.PI)diff+=Math.PI*2;
      player.rotation.y+=diff*Math.min(1,14*delta);
    }
    player.position.y=GROUND_Y;

    // Walk/idle blend
    if(moving!==isWalking){
      isWalking=moving;
      if(mixer){
        if(moving&&walkAction){idleAction?.fadeOut(0.2);walkAction.reset().fadeIn(0.2).play();}
        else if(!moving&&idleAction){walkAction?.fadeOut(0.2);idleAction.reset().fadeIn(0.2).play();}
      }
    }
    // Helmet bob
    if(suitRef&&moving){
      suitRef.helmGrp.position.y=1.65+Math.sin(elapsed*(keys.shift?13:9))*0.007;
    }
  }

  // ── OVER-THE-SHOULDER CAMERA ──────────────────────────────────────────────
  // Compute the right vector from yaw
  const rightVec=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));

  // Camera sits behind and above player, offset to the right shoulder
  const behind=new THREE.Vector3(Math.sin(yaw)*CAM_DIST, 0, Math.cos(yaw)*CAM_DIST);
  const desired=player.position.clone()
    .add(behind)
    .addScaledVector(rightVec, CAM_SHOULDER)
    .add(new THREE.Vector3(0, CAM_HEIGHT + Math.sin(pitch)*CAM_DIST*0.7, 0));

  // Ground clamp — never go below 0.3
  desired.y=Math.max(0.3, desired.y);

  // Smooth lerp
  camPos.lerp(desired, Math.min(1, CAM_LERP*delta));
  camera.position.copy(camPos);

  // Look slightly in front of player, crosshair aims forward
  camLookAt.copy(player.position);
  camLookAt.y+=CAM_LOOK_UP;
  // Shift look-at right to match shoulder offset slightly
  camLookAt.addScaledVector(rightVec, CAM_SHOULDER*0.3);
  camera.lookAt(camLookAt);

  // ── COLLECTIBLES ─────────────────────────────────────────────────────────
  const now=performance.now()*0.001;
  for(const c of collectibles){
    if(c.collected){
      // Respawn check
      if(now>=c.respawnAt){
        c.collected=false;
        c.group.visible=true;
      } else continue;
    }

    // Float + spin
    c.itemGrp.position.y=Math.sin(now*1.8+c.baseY)*0.18+0.18;
    c.itemGrp.rotation.y+=delta*1.2;

    // Glow ring pulse
    c.ringMat.opacity=0.3+Math.sin(now*3)*0.25;
    c.ring.rotation.z+=delta*0.8;

    // Light pulse
    c.light.intensity=1.2+Math.sin(now*4)*0.5;

    // Label bob
    c.label.position.y=1.6+Math.sin(now*2)*0.06;

    // Proximity collection
    if(!mgmtOpen){
      const dx=player.position.x-c.group.position.x;
      const dz=player.position.z-c.group.position.z;
      if(Math.sqrt(dx*dx+dz*dz)<COLLECT_RADIUS){
        c.collected=true;
        c.respawnAt=now+45; // respawn after 45 seconds
        c.group.visible=false;
        spawnBurst(c.group.position, c.def.color);
        if(window.collectResource) window.collectResource(c.type, c.def.amount);
      }
    }
  }

  // ── BURST PARTICLES ───────────────────────────────────────────────────────
  for(let i=BURST_PARTICLES.length-1;i>=0;i--){
    const b=BURST_PARTICLES[i];
    b.life-=delta*1.5;
    if(b.life<=0){ scene.remove(b.pts); b.geo.dispose(); BURST_PARTICLES.splice(i,1); continue; }
    const pos=b.positions;
    for(let j=0;j<b.velocities.length;j++){
      pos[j*3]  +=b.velocities[j].x*delta;
      pos[j*3+1]+=b.velocities[j].y*delta;
      pos[j*3+2]+=b.velocities[j].z*delta;
      b.velocities[j].y-=8*delta; // gravity
    }
    b.geo.attributes.position.needsUpdate=true;
    b.pts.material.opacity=b.life;
  }

  renderer.render(scene,camera);
}

animate();
