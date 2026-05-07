import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// ── RENDERER ─────────────────────────────────────────────────────────────────
const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ── SCENE + CAMERA ────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0.5, 6);

// ── LIGHTS ────────────────────────────────────────────────────────────────────
const sunLight = new THREE.DirectionalLight(0xffe8c0, 2.8);
sunLight.position.set(6, 8, 4);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 50;
sunLight.shadow.camera.left = -10;
sunLight.shadow.camera.right = 10;
sunLight.shadow.camera.top = 10;
sunLight.shadow.camera.bottom = -10;
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x1a0a00, 1.2);
scene.add(ambientLight);

const rimLight = new THREE.DirectionalLight(0xff6633, 0.5);
rimLight.position.set(-6, 2, -4);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
fillLight.position.set(0, -3, 6);
scene.add(fillLight);

// ── TEXTURE LOADER ────────────────────────────────────────────────────────────
const texLoader = new THREE.TextureLoader();

// ── STARFIELD ─────────────────────────────────────────────────────────────────
function createStarfield() {
  const count = 6000;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos((Math.random() * 2) - 1);
    const r     = 800 + Math.random() * 400;
    positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.8, sizeAttenuation: true, transparent: true, opacity: 0.9,
  }));
}
scene.add(createStarfield());

// Nebula clouds
function createNebula(color, count, spread, size) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random()-0.5)*spread;
    pos[i*3+1] = (Math.random()-0.5)*spread*0.4;
    pos[i*3+2] = (Math.random()-0.5)*spread*0.1 - 300;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color, size, sizeAttenuation: true, transparent: true, opacity: 0.22,
  }));
}
scene.add(createNebula(0x330066, 800, 600, 3));
scene.add(createNebula(0x660011, 600, 500, 2.5));

// ── EARTH GLOBE ───────────────────────────────────────────────────────────────
const earthMat = new THREE.MeshStandardMaterial({
  map:         texLoader.load('assets/earth/earth.jpg'),
  normalMap:   texLoader.load('assets/earth/earth_normal_map.png'),
  normalScale: new THREE.Vector2(4, 4),
  aoMap:       texLoader.load('assets/earth/earth_ao_map.png'),
  roughness: 0.55, metalness: 0.05,
});
const earth = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 64), earthMat);
earth.position.set(3.5, 2.0, -3);
scene.add(earth);

const cloudMat = new THREE.MeshStandardMaterial({
  map: texLoader.load('assets/earth/earth_clouds.jpg'),
  transparent: true, opacity: 0.5, roughness: 1,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
earth.add(new THREE.Mesh(new THREE.SphereGeometry(1.215, 64, 64), cloudMat));

const atmMat = new THREE.MeshPhongMaterial({
  color: 0x1155aa, transparent: true, opacity: 0.12,
  side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
});
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.28, 32, 32), atmMat);
earth.add(atmosphere);

// ── MARS SURFACE ──────────────────────────────────────────────────────────────
const groundGeo = new THREE.PlaneGeometry(100, 100, 30, 30);
const gPos = groundGeo.attributes.position.array;
for (let i = 0; i < gPos.length; i += 3) gPos[i+2] += (Math.random()-0.5)*0.5;
groundGeo.attributes.position.needsUpdate = true;
groundGeo.computeVertexNormals();

const groundMat = new THREE.MeshStandardMaterial({
  color: 0x7a3010, roughness: 0.97, metalness: 0.0,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -2.2, -5);
ground.receiveShadow = true;
scene.add(ground);

// Horizon haze
const hazeMat = new THREE.MeshBasicMaterial({
  color: 0xcc5522, transparent: true, opacity: 0.13,
  blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
});
const haze = new THREE.Mesh(new THREE.PlaneGeometry(300, 30), hazeMat);
haze.rotation.x = -Math.PI / 2;
haze.position.set(0, -1.6, -40);
scene.add(haze);

// ── SPACESUIT MATERIALS ────────────────────────────────────────────────────────
const suitMat = new THREE.MeshStandardMaterial({
  color: 0xe8ddd0,  // off-white suit body
  roughness: 0.75, metalness: 0.05,
});
const suitAccentMat = new THREE.MeshStandardMaterial({
  color: 0xcc4400,  // Mars orange accent
  roughness: 0.65, metalness: 0.15,
});
const helmetMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.3, metalness: 0.1,
});
const visorMat = new THREE.MeshPhysicalMaterial({
  color: 0x88ccff,
  transparent: true, opacity: 0.55,
  roughness: 0.05, metalness: 0.8,
  reflectivity: 1.0,
  blending: THREE.NormalBlending,
});
const tankMat = new THREE.MeshStandardMaterial({
  color: 0xdddddd, roughness: 0.4, metalness: 0.6,
});
const stripeMat = new THREE.MeshStandardMaterial({
  color: 0xff5500,  // safety orange stripes
  roughness: 0.6, metalness: 0.1,
  emissive: 0xaa2200, emissiveIntensity: 0.3,
});
const bootMat = new THREE.MeshStandardMaterial({
  color: 0x2a1a0a, roughness: 0.9, metalness: 0.1,
});
const gloveMat = new THREE.MeshStandardMaterial({
  color: 0xccbbaa, roughness: 0.8, metalness: 0.05,
});

// ── BUILD MARS SUIT GEO (attached to player bones or anchored to root) ────────
function buildSuit(root) {
  const suit = new THREE.Group();

  // ── HELMET ──────────────────────────────────────────────────────────────────
  const helmetGroup = new THREE.Group();

  // Main dome
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.155, 32, 32), helmetMat);
  helmetGroup.add(dome);

  // Visor cutout (slightly smaller flattened sphere in front)
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.135, 32, 24, 0, Math.PI*2, 0, Math.PI*0.55), visorMat);
  visor.position.z = 0.04;
  visor.rotation.x = -0.3;
  helmetGroup.add(visor);

  // Neck ring
  const neckRing = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.115, 0.06, 24), helmetMat);
  neckRing.position.y = -0.12;
  helmetGroup.add(neckRing);

  // Side light / camera bumps
  [-1,1].forEach(side => {
    const bump = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 10), tankMat);
    bump.rotation.z = Math.PI/2;
    bump.position.set(side * 0.145, 0.04, 0);
    helmetGroup.add(bump);
  });

  // Antenna
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 8), tankMat);
  ant.position.set(0.09, 0.2, 0);
  helmetGroup.add(ant);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), stripeMat);
  antTip.position.set(0.09, 0.31, 0);
  helmetGroup.add(antTip);

  helmetGroup.position.set(0, 1.65, 0);   // head height (adjusted after scale)
  suit.add(helmetGroup);

  // ── TORSO SUIT LAYER ─────────────────────────────────────────────────────────
  // Chest plate
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.16), suitMat);
  chest.position.set(0, 1.22, 0.035);
  suit.add(chest);

  // Chest center stripe
  const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.165), stripeMat);
  chestStripe.position.set(0, 1.22, 0.036);
  suit.add(chestStripe);

  // Life support backpack
  const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.36, 0.12), suitMat);
  packBody.position.set(0, 1.15, -0.12);
  suit.add(packBody);

  // Pack tanks (cylinders on sides)
  [-1, 1].forEach(side => {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 16), tankMat);
    tank.position.set(side * 0.14, 1.15, -0.17);
    suit.add(tank);

    // Tank cap
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), tankMat);
    cap.position.set(side * 0.14, 1.31, -0.17);
    suit.add(cap);
  });

  // Pack connector tube to chest
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.18, 10), suitMat);
  tube.rotation.x = Math.PI/2;
  tube.position.set(0.08, 1.28, -0.03);
  suit.add(tube);

  // ── SHOULDER PADS ────────────────────────────────────────────────────────────
  [-1, 1].forEach(side => {
    const shoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 12, 0, Math.PI*2, 0, Math.PI*0.6),
      suitAccentMat
    );
    shoulder.rotation.z = side * Math.PI/2;
    shoulder.rotation.x = -0.3;
    shoulder.position.set(side * 0.22, 1.35, 0);
    suit.add(shoulder);

    // Arm stripe band
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), stripeMat);
    band.position.set(side * 0.3, 1.12, 0);
    suit.add(band);
  });

  // ── UPPER ARM PUFF ────────────────────────────────────────────────────────────
  [-1, 1].forEach(side => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.22, 16), suitMat);
    arm.position.set(side * 0.3, 1.02, 0);
    suit.add(arm);
  });

  // ── GLOVES ───────────────────────────────────────────────────────────────────
  [-1, 1].forEach(side => {
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), gloveMat);
    glove.scale.y = 1.4;
    glove.position.set(side * 0.3, 0.75, 0);
    suit.add(glove);

    // Glove stripe
    const gs = new THREE.Mesh(new THREE.CylinderGeometry(0.057, 0.057, 0.03, 14), stripeMat);
    gs.position.set(side * 0.3, 0.86, 0);
    suit.add(gs);
  });

  // ── LOWER TORSO / BELT ────────────────────────────────────────────────────────
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.06, 20), suitAccentMat);
  belt.position.set(0, 0.9, 0);
  suit.add(belt);

  // Belt buckle
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.055, 0.155), tankMat);
  buckle.position.set(0, 0.9, 0.07);
  suit.add(buckle);

  // ── THIGH PADS ───────────────────────────────────────────────────────────────
  [-1, 1].forEach(side => {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.25, 14), suitMat);
    thigh.position.set(side * 0.105, 0.66, 0);
    suit.add(thigh);

    // Thigh stripe
    const ts = new THREE.Mesh(new THREE.CylinderGeometry(0.077, 0.077, 0.03, 14), stripeMat);
    ts.position.set(side * 0.105, 0.77, 0);
    suit.add(ts);
  });

  // ── KNEE PADS ────────────────────────────────────────────────────────────────
  [-1, 1].forEach(side => {
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), suitAccentMat);
    knee.scale.z = 0.6;
    knee.position.set(side * 0.105, 0.47, 0.02);
    suit.add(knee);
  });

  // ── BOOTS ────────────────────────────────────────────────────────────────────
  [-1, 1].forEach(side => {
    const bootLower = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.072, 0.22, 14), suitMat);
    bootLower.position.set(side * 0.105, 0.28, 0);
    suit.add(bootLower);

    const bootFoot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.2), bootMat);
    bootFoot.position.set(side * 0.105, 0.12, 0.03);
    suit.add(bootFoot);

    // Boot ankle ring
    const ankleRing = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.04, 14), suitAccentMat);
    ankleRing.position.set(side * 0.105, 0.165, 0);
    suit.add(ankleRing);
  });

  // ── MISSION PATCH on left arm ─────────────────────────────────────────────────
  const patchMat = new THREE.MeshStandardMaterial({
    color: 0x003399, roughness: 0.7,
    emissive: 0x001155, emissiveIntensity: 0.4,
  });
  const patch = new THREE.Mesh(new THREE.CircleGeometry(0.045, 8), patchMat);
  patch.rotation.y = Math.PI/2;
  patch.position.set(-0.36, 1.05, 0);
  suit.add(patch);

  root.add(suit);
  return { helmetGroup, suit };
}

// ── LOAD X_BOT PLAYER ────────────────────────────────────────────────────────
let player     = null;
let suitParts  = null;
let mixer      = null;

function loadPlayer() {
  const fbxLoader = new FBXLoader();
  fbxLoader.load(
    'assets/player.fbx',
    (fbx) => {
      // Scale and position on Mars surface
      fbx.scale.setScalar(0.022);
      fbx.position.set(1.1, -2.2, -0.5);
      fbx.rotation.y = -Math.PI * 0.18;

      // Apply suit material to all mesh parts
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.material = suitMat.clone();
          child.material.roughness = 0.72;
          child.castShadow    = true;
          child.receiveShadow = true;
        }
      });

      // Build and attach the Mars suit
      suitParts = buildSuit(fbx);

      // Play idle animation if present
      if (fbx.animations && fbx.animations.length > 0) {
        mixer = new THREE.AnimationMixer(fbx);
        const idle = mixer.clipAction(fbx.animations[0]);
        idle.play();
      }

      player = fbx;
      scene.add(fbx);
    },
    undefined,
    (err) => {
      console.warn('Player FBX load failed, building fallback:', err);
      buildFallbackPlayer();
    }
  );
}

function buildFallbackPlayer() {
  const group = new THREE.Group();
  group.position.set(1.1, -2.2, -0.5);
  group.rotation.y = -Math.PI * 0.18;

  // Simple humanoid body as fallback
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.45, 14), suitMat);
  torso.position.y = 1.1;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), suitMat);
  head.position.y = 1.5;
  group.add(head);

  [-1,1].forEach(s => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.06,0.5,12), suitMat);
    leg.position.set(s*0.1, 0.7, 0);
    group.add(leg);
  });
  [-1,1].forEach(s => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.05,0.42,12), suitMat);
    arm.position.set(s*0.28, 1.08, 0);
    group.add(arm);
  });

  suitParts = buildSuit(group);
  player = group;
  scene.add(group);
}

loadPlayer();

// ── MARS ROVER ────────────────────────────────────────────────────────────────
let rover = null;
function loadRover() {
  const fbxLoader = new FBXLoader();
  const baseColor = texLoader.load('assets/rover/basecolor.png');
  const normalTex = texLoader.load('assets/rover/normal.png');
  const aoTex     = texLoader.load('assets/rover/ao.png');
  const roughTex  = texLoader.load('assets/rover/roughness.png');
  const metalTex  = texLoader.load('assets/rover/metallic.png');

  fbxLoader.load(
    'assets/rover/mars_rover.fbx',
    (fbx) => {
      fbx.scale.setScalar(0.007);
      fbx.position.set(-2.0, -2.2, -1.5);
      fbx.rotation.y = Math.PI * 0.25;
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: baseColor, normalMap: normalTex,
            normalScale: new THREE.Vector2(1,1),
            aoMap: aoTex, roughnessMap: roughTex,
            roughness: 0.85, metalnessMap: metalTex, metalness: 0.7,
          });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      rover = fbx;
      scene.add(fbx);
    },
    undefined,
    () => buildFallbackRover()
  );
}

function buildFallbackRover() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xbbaa88, roughness: 0.8, metalness: 0.5 });
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.1), mat);
  body.position.y = 0.55; group.add(body);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.9), mat);
  mast.position.set(0.5,1.1,0); group.add(mast);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.2), mat);
  head.position.set(0.5,1.58,0); group.add(head);
  const wGeo = new THREE.CylinderGeometry(0.22,0.22,0.14,20);
  const wMat = new THREE.MeshStandardMaterial({ color:0x333333, roughness:0.95 });
  [[-0.7,0.24,0.65],[0,0.24,0.65],[0.7,0.24,0.65],
   [-0.7,0.24,-0.65],[0,0.24,-0.65],[0.7,0.24,-0.65]].forEach(([x,y,z]) => {
    const w = new THREE.Mesh(wGeo, wMat);
    w.rotation.x = Math.PI/2; w.position.set(x,y,z); group.add(w);
  });
  const pMat = new THREE.MeshStandardMaterial({color:0x1144aa,roughness:0.5,metalness:0.4});
  [[-1.2,0.8,0],[1.2,0.8,0]].forEach(([x,y,z]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.9,0.04,0.6), pMat);
    p.position.set(x,y,z); group.add(p);
  });
  group.scale.setScalar(0.55);
  group.position.set(-2.0,-2.2,-1.5);
  group.rotation.y = Math.PI * 0.25;
  rover = group; scene.add(group);
}
loadRover();

// ── DUST PARTICLES ────────────────────────────────────────────────────────────
const dustGeo = new THREE.BufferGeometry();
const dustCount = 400;
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  dustPos[i*3]   = (Math.random()-0.5)*35;
  dustPos[i*3+1] = Math.random()*4 - 2.2;
  dustPos[i*3+2] = (Math.random()-0.5)*25 - 5;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustPoints = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  color: 0xcc6633, size: 0.06, transparent: true, opacity: 0.45,
}));
scene.add(dustPoints);

// ── RESIZE ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── ANIMATION LOOP ────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const delta   = clock.getDelta ? clock.getDelta() : 0.016;

  // Earth
  earth.rotation.y += 0.0008;
  earth.children[0].rotation.y += 0.0004; // clouds
  atmMat.opacity = 0.10 + Math.sin(elapsed*0.7)*0.03;

  // Rover subtle sway
  if (rover) rover.rotation.y = Math.PI*0.25 + Math.sin(elapsed*0.25)*0.03;

  // Player gentle breathing / idle sway
  if (player) {
    player.rotation.y = -Math.PI*0.18 + Math.sin(elapsed*0.4)*0.05;
    if (suitParts) {
      // Helmet subtle bob
      suitParts.helmetGroup.position.y = 1.65 + Math.sin(elapsed*0.9)*0.005;
    }
  }

  // Mixer (animations)
  if (mixer) mixer.update(clock.getDelta ? 0.016 : 0.016);

  // Dust drift
  const dp = dustGeo.attributes.position.array;
  for (let i = 0; i < dustCount; i++) {
    dp[i*3]   += 0.012;
    dp[i*3+1] += Math.sin(elapsed*0.5+i)*0.002;
    if (dp[i*3] > 17) dp[i*3] = -17;
  }
  dustGeo.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}

animate();
