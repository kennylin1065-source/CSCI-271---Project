import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// ── RENDERER ─────────────────────────────────────────────────────────────────
const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ── SCENE + CAMERA ────────────────────────────────────────────────────────────
const scene  = new THREE.Scene();
scene.fog    = new THREE.FogExp2(0x1a0800, 0.018);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 800);

// ── LIGHTS ────────────────────────────────────────────────────────────────────
const sunLight = new THREE.DirectionalLight(0xffe8c0, 3.0);
sunLight.position.set(40, 60, 30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far  = 200;
sunLight.shadow.camera.left = sunLight.shadow.camera.bottom = -50;
sunLight.shadow.camera.right = sunLight.shadow.camera.top   = 50;
scene.add(sunLight);

scene.add(new THREE.AmbientLight(0x3a1a0a, 2.0));

const rimLight = new THREE.DirectionalLight(0xff6633, 0.6);
rimLight.position.set(-30, 10, -20);
scene.add(rimLight);

// ── TEXTURE LOADER ────────────────────────────────────────────────────────────
const texLoader = new THREE.TextureLoader();

// ── STARFIELD ─────────────────────────────────────────────────────────────────
function makeStars() {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(8000 * 3);
  for (let i = 0; i < 8000; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(Math.random() * 2 - 1);
    const r  = 400 + Math.random() * 200;
    pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
    pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
    pos[i*3+2] = r * Math.cos(ph);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color:0xffffff, size:0.9, sizeAttenuation:true, transparent:true, opacity:0.9,
    depthWrite: false,
  }));
}
scene.add(makeStars());

// ── EARTH (far background) ─────────────────────────────────────────────────────
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(18, 64, 64),
  new THREE.MeshStandardMaterial({
    map:         texLoader.load('assets/earth/earth.jpg'),
    normalMap:   texLoader.load('assets/earth/earth_normal_map.png'),
    normalScale: new THREE.Vector2(3,3),
    aoMap:       texLoader.load('assets/earth/earth_ao_map.png'),
    roughness:0.6, metalness:0.05,
  })
);
earth.position.set(120, 80, -280);
scene.add(earth);

const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(18.3, 64, 64),
  new THREE.MeshStandardMaterial({
    map: texLoader.load('assets/earth/earth_clouds.jpg'),
    transparent:true, opacity:0.45, roughness:1,
    blending:THREE.AdditiveBlending, depthWrite:false,
  })
);
earth.add(clouds);

const atmMat = new THREE.MeshPhongMaterial({
  color:0x1155cc, transparent:true, opacity:0.15,
  side:THREE.BackSide, blending:THREE.AdditiveBlending, depthWrite:false,
});
earth.add(new THREE.Mesh(new THREE.SphereGeometry(19.2, 32, 32), atmMat));

// ── MARS GROUND ───────────────────────────────────────────────────────────────
const GROUND_Y = 0;
const groundGeo = new THREE.PlaneGeometry(400, 400, 60, 60);
const gp = groundGeo.attributes.position.array;
for (let i = 0; i < gp.length; i += 3) gp[i+2] += (Math.random()-0.5)*0.8;
groundGeo.attributes.position.needsUpdate = true;
groundGeo.computeVertexNormals();

const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({
  color:0x6b2a0e, roughness:0.98, metalness:0.0,
}));
ground.rotation.x = -Math.PI/2;
ground.position.y  = GROUND_Y;
ground.receiveShadow = true;
scene.add(ground);

// Rocks scattered around
function makeRock(x, z, scale) {
  const geo = new THREE.DodecahedronGeometry(scale, 0);
  const verts = geo.attributes.position.array;
  for (let i=0;i<verts.length;i++) verts[i] += (Math.random()-0.5)*scale*0.3;
  geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color:0x5a2008, roughness:0.95, metalness:0.0,
  }));
  mesh.position.set(x, GROUND_Y + scale*0.5, z);
  mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
  mesh.castShadow = true; mesh.receiveShadow = true;
  scene.add(mesh);
}
for (let i=0;i<60;i++) {
  const angle = Math.random()*Math.PI*2;
  const dist  = 8 + Math.random()*60;
  makeRock(Math.cos(angle)*dist, Math.sin(angle)*dist, 0.2+Math.random()*1.2);
}

// Horizon haze
const hazePlane = new THREE.Mesh(
  new THREE.PlaneGeometry(600,30),
  new THREE.MeshBasicMaterial({ color:0xcc4411, transparent:true, opacity:0.10,
    blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide })
);
hazePlane.rotation.x = -Math.PI/2;
hazePlane.position.set(0, 0.5, -150);
scene.add(hazePlane);

// ── SPACESUIT MATERIALS ───────────────────────────────────────────────────────
const suitMat = new THREE.MeshStandardMaterial({ color:0xe8ddd0, roughness:0.75, metalness:0.05 });
const accentMat = new THREE.MeshStandardMaterial({ color:0xcc4400, roughness:0.65, metalness:0.15 });
const helmetMat = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.25, metalness:0.1 });
const visorMat  = new THREE.MeshPhysicalMaterial({
  color:0x88ccff, transparent:true, opacity:0.5,
  roughness:0.05, metalness:0.8,
});
const tankMat   = new THREE.MeshStandardMaterial({ color:0xdddddd, roughness:0.4, metalness:0.6 });
const stripeMat = new THREE.MeshStandardMaterial({ color:0xff5500, roughness:0.6,
  emissive:0xaa2200, emissiveIntensity:0.3 });
const bootMat   = new THREE.MeshStandardMaterial({ color:0x2a1a0a, roughness:0.9, metalness:0.1 });
const gloveMat  = new THREE.MeshStandardMaterial({ color:0xccbbaa, roughness:0.8, metalness:0.05 });

function buildSuit(root) {
  const suit = new THREE.Group();

  // Helmet
  const helmGrp = new THREE.Group();
  helmGrp.add(new THREE.Mesh(new THREE.SphereGeometry(0.155,32,32), helmetMat));
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.135,32,24,0,Math.PI*2,0,Math.PI*0.55), visorMat);
  visor.position.z=0.04; visor.rotation.x=-0.3; helmGrp.add(visor);
  const neckRing = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.115,0.06,24), helmetMat);
  neckRing.position.y=-0.12; helmGrp.add(neckRing);
  [-1,1].forEach(s => {
    const bump = new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.05,10), tankMat);
    bump.rotation.z=Math.PI/2; bump.position.set(s*0.145,0.04,0); helmGrp.add(bump);
  });
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.2,8), tankMat);
  ant.position.set(0.09,0.2,0); helmGrp.add(ant);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.014,8,8), stripeMat);
  antTip.position.set(0.09,0.31,0); helmGrp.add(antTip);
  helmGrp.position.set(0,1.65,0);
  suit.add(helmGrp);

  // Chest
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.32,0.28,0.16), suitMat);
  chest.position.set(0,1.22,0.035); suit.add(chest);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.26,0.165), stripeMat);
  stripe.position.set(0,1.22,0.036); suit.add(stripe);

  // Backpack
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.26,0.36,0.12), suitMat);
  pack.position.set(0,1.15,-0.12); suit.add(pack);
  [-1,1].forEach(s => {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.32,16), tankMat);
    tank.position.set(s*0.14,1.15,-0.17); suit.add(tank);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.045,12,8), tankMat);
    cap.position.set(s*0.14,1.31,-0.17); suit.add(cap);
  });

  // Shoulder pads
  [-1,1].forEach(s => {
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.1,16,12,0,Math.PI*2,0,Math.PI*0.6), accentMat);
    sh.rotation.z=s*Math.PI/2; sh.rotation.x=-0.3; sh.position.set(s*0.22,1.35,0); suit.add(sh);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.04,16), stripeMat);
    band.position.set(s*0.3,1.12,0); suit.add(band);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.055,0.22,16), suitMat);
    arm.position.set(s*0.3,1.02,0); suit.add(arm);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.055,12,10), gloveMat);
    glove.scale.y=1.4; glove.position.set(s*0.3,0.75,0); suit.add(glove);
    const gs = new THREE.Mesh(new THREE.CylinderGeometry(0.057,0.057,0.03,14), stripeMat);
    gs.position.set(s*0.3,0.86,0); suit.add(gs);
  });

  // Belt
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.145,0.145,0.06,20), accentMat);
  belt.position.set(0,0.9,0); suit.add(belt);

  // Legs
  [-1,1].forEach(s => {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.065,0.25,14), suitMat);
    thigh.position.set(s*0.105,0.66,0); suit.add(thigh);
    const ts = new THREE.Mesh(new THREE.CylinderGeometry(0.077,0.077,0.03,14), stripeMat);
    ts.position.set(s*0.105,0.77,0); suit.add(ts);
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.065,12,10), accentMat);
    knee.scale.z=0.6; knee.position.set(s*0.105,0.47,0.02); suit.add(knee);
    const bootLow = new THREE.Mesh(new THREE.CylinderGeometry(0.068,0.072,0.22,14), suitMat);
    bootLow.position.set(s*0.105,0.28,0); suit.add(bootLow);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.07,0.2), bootMat);
    foot.position.set(s*0.105,0.12,0.03); suit.add(foot);
    const ar = new THREE.Mesh(new THREE.CylinderGeometry(0.072,0.072,0.04,14), accentMat);
    ar.position.set(s*0.105,0.165,0); suit.add(ar);
  });

  suit.traverse(c => { if (c.isMesh) { c.castShadow=true; c.receiveShadow=true; } });
  root.add(suit);
  return { helmGrp };
}

// ── PLAYER STATE ─────────────────────────────────────────────────────────────
const player = new THREE.Group();
player.position.set(0, GROUND_Y, 0);
scene.add(player);

let suitRef    = null;
let mixer      = null;
let idleAction = null;
let walkAction = null;
let isWalking  = false;

// Load X_Bot
const fbxLoader = new FBXLoader();
fbxLoader.load('assets/player.fbx',
  (fbx) => {
    fbx.scale.setScalar(0.022);
    fbx.position.y = 0;
    fbx.traverse(c => {
      if (c.isMesh) { c.material=suitMat.clone(); c.castShadow=true; c.receiveShadow=true; }
    });
    player.add(fbx);
    suitRef = buildSuit(fbx);

    if (fbx.animations.length > 0) {
      mixer = new THREE.AnimationMixer(fbx);
      idleAction = mixer.clipAction(fbx.animations[0]);
      idleAction.play();
      if (fbx.animations.length > 1) {
        walkAction = mixer.clipAction(fbx.animations[1]);
      }
    }
  },
  undefined,
  () => {
    // Fallback capsule player
    const cap = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.9, 8, 16), suitMat);
    cap.position.y = 0.88;
    cap.castShadow = true;
    player.add(cap);
    suitRef = buildSuit(player);
  }
);

// ── MARS ROVER (near starting area) ──────────────────────────────────────────
fbxLoader.load('assets/rover/mars_rover.fbx',
  (fbx) => {
    const b = texLoader.load('assets/rover/basecolor.png');
    const n = texLoader.load('assets/rover/normal.png');
    const a = texLoader.load('assets/rover/ao.png');
    const r = texLoader.load('assets/rover/roughness.png');
    const m = texLoader.load('assets/rover/metallic.png');
    fbx.scale.setScalar(0.007);
    fbx.position.set(-8, GROUND_Y, -6);
    fbx.rotation.y = 0.4;
    fbx.traverse(c => {
      if (c.isMesh) {
        c.material=new THREE.MeshStandardMaterial({ map:b, normalMap:n,
          normalScale:new THREE.Vector2(1,1), aoMap:a, roughnessMap:r,
          roughness:0.85, metalnessMap:m, metalness:0.7 });
        c.castShadow=true; c.receiveShadow=true;
      }
    });
    scene.add(fbx);
  },
  undefined,
  () => {} // silent fallback
);

// ── OUTPOST STRUCTURES ────────────────────────────────────────────────────────
function makeHabitat(x, z) {
  const grp = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color:0xd4c8b8, roughness:0.7, metalness:0.2 });
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3, 16), mat);
  cyl.castShadow=true; cyl.receiveShadow=true;
  grp.add(cyl);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 8, 0, Math.PI*2, 0, Math.PI*0.5), mat);
  dome.position.y=1.5; dome.castShadow=true; grp.add(dome);
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.35,12),
    new THREE.MeshPhysicalMaterial({ color:0x88ccff, transparent:true, opacity:0.6,
      roughness:0.1, metalness:0.5, blending:THREE.NormalBlending }));
  win.position.set(1.95, 0.5, 0); win.rotation.y=Math.PI/2; grp.add(win);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(2.01,2.01,0.15,16), stripeMat);
  stripe.position.y=0.8; grp.add(stripe);
  grp.position.set(x, GROUND_Y+1.5, z);
  scene.add(grp);
}
makeHabitat(-14, -5);
makeHabitat(-18,  4);
makeHabitat(-10, -14);

// Solar panels
function makeSolarPanel(x, z, angle) {
  const grp = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,2.5,8),
    new THREE.MeshStandardMaterial({ color:0x888888, metalness:0.7, roughness:0.3 }));
  pole.castShadow=true; grp.add(pole);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(3.5,0.06,1.4),
    new THREE.MeshStandardMaterial({ color:0x1a3a88, roughness:0.4, metalness:0.5,
      emissive:0x0a1844, emissiveIntensity:0.2 }));
  panel.position.y=1.5; panel.rotation.x=-0.3; panel.castShadow=true; grp.add(panel);
  grp.position.set(x, GROUND_Y+1.25, z);
  grp.rotation.y=angle; scene.add(grp);
}
makeSolarPanel(-6, -10, 0.2);
makeSolarPanel(-4, -13, -0.3);
makeSolarPanel(-9, -18,  0.1);
makeSolarPanel( 6,  -8, -0.2);

// ── DUST PARTICLES ────────────────────────────────────────────────────────────
const DUST_COUNT = 600;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(DUST_COUNT*3);
for (let i=0;i<DUST_COUNT;i++) {
  dustPos[i*3]   = (Math.random()-0.5)*80;
  dustPos[i*3+1] = Math.random()*6;
  dustPos[i*3+2] = (Math.random()-0.5)*80;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustPoints = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  color:0xcc6633, size:0.06, transparent:true, opacity:0.5, depthWrite:false,
}));
scene.add(dustPoints);

// ── INPUT ─────────────────────────────────────────────────────────────────────
const keys = { w:false, a:false, s:false, d:false, shift:false };
document.addEventListener('keydown', e => {
  if (document.getElementById('mgmt-modal') && !document.getElementById('mgmt-modal').classList.contains('hidden')) return;
  const k = e.key.toLowerCase();
  if (k==='w'||k==='arrowup')    keys.w=true;
  if (k==='s'||k==='arrowdown')  keys.s=true;
  if (k==='a'||k==='arrowleft')  keys.a=true;
  if (k==='d'||k==='arrowright') keys.d=true;
  if (k==='shift') keys.shift=true;
});
document.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (k==='w'||k==='arrowup')    keys.w=false;
  if (k==='s'||k==='arrowdown')  keys.s=false;
  if (k==='a'||k==='arrowleft')  keys.a=false;
  if (k==='d'||k==='arrowright') keys.d=false;
  if (k==='shift') keys.shift=false;
});

// ── POINTER LOCK (mouse look) ─────────────────────────────────────────────────
let yaw   = 0; // camera/player horizontal angle
let pitch = 0; // camera vertical tilt

canvas.addEventListener('click', () => {
  const hud = document.getElementById('hud');
  if (hud && !hud.classList.contains('hidden')) {
    const mgmt = document.getElementById('mgmt-modal');
    if (mgmt && !mgmt.classList.contains('hidden')) return;
    canvas.requestPointerLock();
  }
});

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  const prompt = document.getElementById('lock-prompt');
  if (prompt) prompt.classList.toggle('hidden', locked);
});

document.addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas) return;
  const sens = 0.002;
  yaw   -= e.movementX * sens;
  pitch -= e.movementY * sens;
  pitch  = Math.max(-0.5, Math.min(0.6, pitch));
});

// ── CAMERA CONSTANTS ──────────────────────────────────────────────────────────
const CAM_DIST   = 4.5;
const CAM_HEIGHT = 1.8;
const camOffset  = new THREE.Vector3();
const camTarget  = new THREE.Vector3();

// ── RESIZE ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── ANIMATION LOOP ────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
const moveDir = new THREE.Vector3();
const WALK_SPEED = 4.5;
const RUN_SPEED  = 9.0;
let   gameStarted = false;

// Watch for game start
document.getElementById('btn-start').addEventListener('click', () => { gameStarted = true; });

function animate() {
  requestAnimationFrame(animate);
  const delta   = clock.getDelta();
  const elapsed = clock.elapsedTime;

  // ── Earth rotate
  earth.rotation.y += 0.0003;
  clouds.rotation.y += 0.0002;
  atmMat.opacity = 0.12 + Math.sin(elapsed*0.5)*0.03;

  // ── Dust drift
  const dp = dustPos;
  for (let i=0;i<DUST_COUNT;i++) {
    dp[i*3]   += 0.008 + Math.sin(elapsed*0.2+i)*0.003;
    dp[i*3+1] += Math.sin(elapsed*0.4+i)*0.004;
    if (dp[i*3] > 40)  dp[i*3] = -40;
    if (dp[i*3+1]>6)   dp[i*3+1]=0;
    if (dp[i*3+1]<0)   dp[i*3+1]=0.1;
  }
  dustGeo.attributes.position.needsUpdate = true;

  if (!gameStarted) { renderer.render(scene, camera); return; }

  // ── Mixer
  if (mixer) mixer.update(delta);

  // ── Player movement (GTA-style)
  const mgmtOpen = document.getElementById('mgmt-modal') &&
    !document.getElementById('mgmt-modal').classList.contains('hidden');

  if (!mgmtOpen) {
    const speed   = keys.shift ? RUN_SPEED : WALK_SPEED;
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right   = new THREE.Vector3( Math.cos(yaw), 0, -Math.sin(yaw));

    moveDir.set(0,0,0);
    if (keys.w) moveDir.addScaledVector(forward,  1);
    if (keys.s) moveDir.addScaledVector(forward, -1);
    if (keys.a) moveDir.addScaledVector(right,   -1);
    if (keys.d) moveDir.addScaledVector(right,    1);

    const moving = moveDir.lengthSq() > 0.001;

    if (moving) {
      moveDir.normalize();
      player.position.addScaledVector(moveDir, speed * delta);
      // Rotate player to face movement direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      let cur = player.rotation.y;
      let diff = targetAngle - cur;
      while (diff >  Math.PI) diff -= Math.PI*2;
      while (diff < -Math.PI) diff += Math.PI*2;
      player.rotation.y += diff * Math.min(1, 12 * delta);
    }

    // Keep player on ground
    player.position.y = GROUND_Y;

    // Walk / idle animation blend
    if (moving !== isWalking) {
      isWalking = moving;
      if (mixer) {
        if (moving && walkAction) {
          idleAction?.fadeOut(0.2);
          walkAction.reset().fadeIn(0.2).play();
        } else if (!moving && idleAction) {
          walkAction?.fadeOut(0.2);
          idleAction.reset().fadeIn(0.2).play();
        }
      }
    }

    // Leg swing on suit (visual walk bob)
    if (suitRef && moving) {
      const bob = Math.sin(elapsed * (keys.shift ? 12 : 8)) * 0.008;
      suitRef.helmGrp.position.y = 1.65 + bob;
    }
  }

  // ── Third-person camera (GTA-style)
  camOffset.set(
    Math.sin(yaw) * CAM_DIST,
    CAM_HEIGHT + Math.sin(pitch) * CAM_DIST * 0.8,
    Math.cos(yaw) * CAM_DIST
  );
  const desiredCamPos = player.position.clone().add(camOffset);

  // Smooth camera follow
  camera.position.lerp(desiredCamPos, 8 * delta);

  // Look at player (slightly above center)
  camTarget.copy(player.position).y += 1.1;
  camera.lookAt(camTarget);

  renderer.render(scene, camera);
}
animate();
