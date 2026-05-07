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

// ── CHARACTER MATERIALS ───────────────────────────────────────────────────────
const mSuit    = new THREE.MeshStandardMaterial({color:0xe8ddd0, roughness:0.72, metalness:0.06});
const mAccent  = new THREE.MeshStandardMaterial({color:0xcc4400, roughness:0.62, metalness:0.15});
const mHelmet  = new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.22, metalness:0.12});
const mVisor   = new THREE.MeshPhysicalMaterial({color:0x66aaff, transparent:true, opacity:0.52, roughness:0.04, metalness:0.85});
const mTank    = new THREE.MeshStandardMaterial({color:0xcccccc, roughness:0.38, metalness:0.65});
const mStripe  = new THREE.MeshStandardMaterial({color:0xff5500, roughness:0.55, emissive:0xaa2200, emissiveIntensity:0.35});
const mBoot    = new THREE.MeshStandardMaterial({color:0x221208, roughness:0.92, metalness:0.08});
const mGlove   = new THREE.MeshStandardMaterial({color:0xbbaa99, roughness:0.82, metalness:0.04});
const mPatch   = new THREE.MeshStandardMaterial({color:0x003399, roughness:0.7,  emissive:0x001155, emissiveIntensity:0.5});

// ── BUILD RIGGED CHARACTER ────────────────────────────────────────────────────
// Returns joint refs for walk-cycle animation.
// All dimensions are for a ~1.1-unit-tall astronaut figure.
function buildCharacter() {
  const root = new THREE.Group();   // placed at GROUND_Y (feet level)

  function mesh(geo, mat, shadow=true) {
    const m = new THREE.Mesh(geo, mat);
    if(shadow){ m.castShadow=true; m.receiveShadow=true; }
    return m;
  }

  // ── pivot helper: group placed at jointPos, child mesh offset so geometry
  //    hangs correctly and rotation pivots at the joint
  function limb(geo, mat, length, side=1) {
    const joint = new THREE.Group();
    const m = mesh(geo, mat);
    m.position.y = -length/2;  // hang below the pivot
    joint.add(m);
    return { joint, mesh: m };
  }

  // ── LEGS ──────────────────────────────────────────────────────────────────
  const legJoints = [];
  [-1, 1].forEach(s => {
    // Hip joint (pivot)
    const hipJoint = new THREE.Group();
    hipJoint.position.set(s * 0.082, 0.56, 0);

    // Thigh
    const thighMesh = mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.22, 14), mSuit);
    thighMesh.position.y = -0.11;
    hipJoint.add(thighMesh);

    // Thigh stripe band
    const tsBand = mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.025, 14), mStripe);
    tsBand.position.y = -0.04;
    hipJoint.add(tsBand);

    // Knee joint (child of hipJoint)
    const kneeJoint = new THREE.Group();
    kneeJoint.position.y = -0.22;
    hipJoint.add(kneeJoint);

    // Knee cap
    const kneeCap = mesh(new THREE.SphereGeometry(0.062, 12, 10), mAccent);
    kneeCap.scale.z = 0.58;
    kneeCap.position.set(0, 0, 0.012);
    kneeJoint.add(kneeCap);

    // Shin
    const shinMesh = mesh(new THREE.CylinderGeometry(0.058, 0.052, 0.20, 14), mSuit);
    shinMesh.position.y = -0.10;
    kneeJoint.add(shinMesh);

    // Ankle ring
    const ankleRing = mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.028, 14), mAccent);
    ankleRing.position.y = -0.21;
    kneeJoint.add(ankleRing);

    // Boot
    const bootMesh = mesh(new THREE.BoxGeometry(0.092, 0.065, 0.18), mBoot);
    bootMesh.position.set(0, -0.245, 0.022);
    kneeJoint.add(bootMesh);

    root.add(hipJoint);
    legJoints.push({ hipJoint, kneeJoint, side: s });
  });

  // ── HIPS BLOCK ────────────────────────────────────────────────────────────
  const hipsMesh = mesh(new THREE.CylinderGeometry(0.13, 0.125, 0.085, 18), mSuit);
  hipsMesh.position.y = 0.60;
  root.add(hipsMesh);

  // ── TORSO ─────────────────────────────────────────────────────────────────
  const torso = new THREE.Group();
  torso.position.y = 0.78;
  root.add(torso);

  // Body
  const bodyMesh = mesh(new THREE.CylinderGeometry(0.118, 0.13, 0.26, 16), mSuit);
  torso.add(bodyMesh);

  // Chest plate (front)
  const chestPlate = mesh(new THREE.BoxGeometry(0.26, 0.22, 0.13), mSuit);
  chestPlate.position.set(0, 0.01, 0.03);
  torso.add(chestPlate);

  // Chest center stripe
  const chestStripe = mesh(new THREE.BoxGeometry(0.048, 0.20, 0.132), mStripe);
  chestStripe.position.set(0, 0.01, 0.031);
  torso.add(chestStripe);

  // Backpack body
  const packBody = mesh(new THREE.BoxGeometry(0.21, 0.28, 0.10), mSuit);
  packBody.position.set(0, 0, -0.10);
  torso.add(packBody);

  // Backpack tanks ×2
  [-1, 1].forEach(s => {
    const tank = mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.25, 14), mTank);
    tank.position.set(s * 0.115, 0.01, -0.135);
    torso.add(tank);
    const tankCap = mesh(new THREE.SphereGeometry(0.038, 10, 8), mTank);
    tankCap.position.set(s * 0.115, 0.135, -0.135);
    torso.add(tankCap);
  });

  // Belt
  const belt = mesh(new THREE.CylinderGeometry(0.132, 0.132, 0.052, 18), mAccent);
  belt.position.y = -0.155;
  torso.add(belt);

  // Buckle
  const buckle = mesh(new THREE.BoxGeometry(0.058, 0.045, 0.135), mTank);
  buckle.position.set(0, -0.155, 0.055);
  torso.add(buckle);

  // Mission patch (left chest)
  const patch = mesh(new THREE.CircleGeometry(0.038, 8), mPatch);
  patch.rotation.y = Math.PI / 2;
  patch.position.set(-0.145, 0.06, 0);
  torso.add(patch);

  // ── ARMS ─────────────────────────────────────────────────────────────────
  const armJoints = [];
  [-1, 1].forEach(s => {
    // Shoulder pad (decorative)
    const shoulderPad = mesh(
      new THREE.SphereGeometry(0.088, 14, 10, 0, Math.PI*2, 0, Math.PI*0.58), mAccent);
    shoulderPad.rotation.z = s * Math.PI / 2;
    shoulderPad.rotation.x = -0.28;
    shoulderPad.position.set(s * 0.175, 0.115, 0);
    torso.add(shoulderPad);

    // Shoulder joint (pivot for whole arm)
    const shoulderJoint = new THREE.Group();
    shoulderJoint.position.set(s * 0.175, 0.10, 0);
    torso.add(shoulderJoint);

    // Upper arm
    const upperArm = mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.185, 14), mSuit);
    upperArm.position.y = -0.0925;
    shoulderJoint.add(upperArm);

    // Arm band stripe
    const armBand = mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.025, 14), mStripe);
    armBand.position.y = -0.06;
    shoulderJoint.add(armBand);

    // Elbow joint
    const elbowJoint = new THREE.Group();
    elbowJoint.position.y = -0.185;
    shoulderJoint.add(elbowJoint);

    // Forearm
    const forearm = mesh(new THREE.CylinderGeometry(0.047, 0.042, 0.155, 14), mSuit);
    forearm.position.y = -0.0775;
    elbowJoint.add(forearm);

    // Wrist ring
    const wristRing = mesh(new THREE.CylinderGeometry(0.049, 0.049, 0.022, 14), mStripe);
    wristRing.position.y = -0.168;
    elbowJoint.add(wristRing);

    // Glove / hand
    const hand = mesh(new THREE.SphereGeometry(0.048, 10, 8), mGlove);
    hand.scale.y = 1.3;
    hand.position.y = -0.195;
    elbowJoint.add(hand);

    armJoints.push({ shoulderJoint, elbowJoint, side: s });
  });

  // ── NECK ──────────────────────────────────────────────────────────────────
  const neck = mesh(new THREE.CylinderGeometry(0.048, 0.055, 0.055, 12), mSuit);
  neck.position.y = 0.148;
  torso.add(neck);

  // ── HEAD + HELMET ─────────────────────────────────────────────────────────
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.065, 0);   // y from root (feet)
  root.add(headGroup);

  // Helmet dome
  const helmDome = mesh(new THREE.SphereGeometry(0.125, 28, 22), mHelmet);
  headGroup.add(helmDome);

  // Visor
  const visor = mesh(
    new THREE.SphereGeometry(0.108, 26, 18, 0, Math.PI*2, 0, Math.PI*0.52), mVisor);
  visor.position.z = 0.028;
  visor.rotation.x = -0.32;
  headGroup.add(visor);

  // Neck ring (collar)
  const neckRing = mesh(new THREE.CylinderGeometry(0.082, 0.094, 0.048, 20), mHelmet);
  neckRing.position.y = -0.096;
  headGroup.add(neckRing);

  // Side camera bumps
  [-1, 1].forEach(s => {
    const bump = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.04, 10), mTank);
    bump.rotation.z = Math.PI / 2;
    bump.position.set(s * 0.118, 0.03, 0);
    headGroup.add(bump);
  });

  // Antenna
  const ant = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.175, 8), mTank);
  ant.position.set(0.07, 0.17, 0);
  headGroup.add(ant);
  const antTip = mesh(new THREE.SphereGeometry(0.011, 8, 8), mStripe);
  antTip.position.set(0.07, 0.262, 0);
  headGroup.add(antTip);

  // Cast shadows on everything
  root.traverse(c => { if(c.isMesh){ c.castShadow=true; c.receiveShadow=true; } });

  return { root, legJoints, armJoints, headGroup };
}

// ── PLAYER ────────────────────────────────────────────────────────────────────
const player = new THREE.Group();
player.position.set(0, GROUND_Y, 0);
scene.add(player);

const charData = buildCharacter();
player.add(charData.root);

let walkTime = 0;
let isWalking = false;

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

  // (no FBX mixer — character is procedural)

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

    // ── WALK CYCLE ANIMATION ────────────────────────────────────────────────
    isWalking = moving;
    const freq   = keys.shift ? 12 : 8;    // stride frequency
    const legAmp = moving ? (keys.shift ? 0.55 : 0.38) : 0;   // leg swing amount
    const armAmp = moving ? (keys.shift ? 0.32 : 0.22) : 0;   // arm swing amount

    if(moving) walkTime += delta * freq;
    // smoothly return to rest when stopped
    const legSwing = Math.sin(walkTime) * legAmp;
    const armSwing = Math.sin(walkTime) * armAmp;

    charData.legJoints.forEach(({ hipJoint, kneeJoint, side }) => {
      // alternate legs (side −1 = left leads when sin>0)
      hipJoint.rotation.x   = legSwing * side;
      // knee bends on the back-swing (never hyper-extend forward)
      kneeJoint.rotation.x  = Math.max(0, -legSwing * side) * 0.7;
    });

    charData.armJoints.forEach(({ shoulderJoint, elbowJoint, side }) => {
      // arms swing opposite to legs on same side
      shoulderJoint.rotation.x = -armSwing * side;
      // slight elbow bend while walking
      elbowJoint.rotation.x    = moving ? 0.18 : 0;
    });

    // Head bob
    charData.headGroup.position.y = 1.065 + Math.sin(walkTime * 2) * (moving ? 0.006 : 0);
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
