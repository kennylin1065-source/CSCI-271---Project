import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── RENDERER ─────────────────────────────────────────────────────────────────
const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// ── SCENE + CAMERA ────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 5);

// ── LIGHTS ────────────────────────────────────────────────────────────────────
const sunLight = new THREE.DirectionalLight(0xffe8c0, 2.5);
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x112244, 0.8);
scene.add(ambientLight);

const rimLight = new THREE.DirectionalLight(0x4488ff, 0.6);
rimLight.position.set(-5, -2, -3);
scene.add(rimLight);

// ── STARFIELD ─────────────────────────────────────────────────────────────────
function createStarfield() {
  const count = 6000;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos((Math.random() * 2) - 1);
    const r     = 800 + Math.random() * 400;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = Math.random() * 2.5 + 0.5;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff, sizeAttenuation: true,
    size: 0.8, transparent: true, opacity: 0.85,
  });
  return new THREE.Points(geo, mat);
}
scene.add(createStarfield());

// ── NEBULA PARTICLES ──────────────────────────────────────────────────────────
function createNebula(color, count, spread, size) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random()-0.5)*spread;
    pos[i*3+1] = (Math.random()-0.5)*spread*0.4;
    pos[i*3+2] = (Math.random()-0.5)*spread * 0.1 - 300;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity: 0.25 });
  return new THREE.Points(geo, mat);
}
scene.add(createNebula(0x330066, 800, 600, 3));
scene.add(createNebula(0x003355, 600, 500, 2.5));

// ── TEXTURE LOADER ────────────────────────────────────────────────────────────
const loader = new THREE.TextureLoader();

// ── EARTH GLOBE ───────────────────────────────────────────────────────────────
const earthGeo = new THREE.SphereGeometry(1.2, 64, 64);
const earthMat = new THREE.MeshStandardMaterial({
  map:         loader.load('assets/earth/earth.jpg'),
  normalMap:   loader.load('assets/earth/earth_normal_map.png'),
  normalScale: new THREE.Vector2(4, 4),
  aoMap:       loader.load('assets/earth/earth_ao_map.png'),
  roughness:   0.55,
  metalness:   0.05,
});
const earth = new THREE.Mesh(earthGeo, earthMat);
earth.position.set(3.2, 1.6, -2);
scene.add(earth);

// Clouds layer
const cloudGeo = new THREE.SphereGeometry(1.215, 64, 64);
const cloudMat = new THREE.MeshStandardMaterial({
  map: loader.load('assets/earth/earth_clouds.jpg'),
  transparent: true,
  opacity: 0.55,
  roughness: 1,
  metalness: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const clouds = new THREE.Mesh(cloudGeo, cloudMat);
earth.add(clouds);

// Atmospheric glow (additive shell)
const atmGeo = new THREE.SphereGeometry(1.28, 32, 32);
const atmMat = new THREE.MeshPhongMaterial({
  color: 0x1155aa,
  transparent: true,
  opacity: 0.12,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const atmosphere = new THREE.Mesh(atmGeo, atmMat);
earth.add(atmosphere);

// ── MARS SURFACE GROUND ────────────────────────────────────────────────────────
const groundGeo = new THREE.PlaneGeometry(80, 80, 20, 20);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x8b3a1a,
  roughness: 0.95,
  metalness: 0.0,
});

// Add some terrain displacement via vertex colors
const positions = groundGeo.attributes.position.array;
for (let i = 0; i < positions.length; i += 3) {
  positions[i + 2] += (Math.random() - 0.5) * 0.4;
}
groundGeo.attributes.position.needsUpdate = true;
groundGeo.computeVertexNormals();

const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2.2;
ground.position.z = -5;
scene.add(ground);

// ── MARS HORIZON HAZE ─────────────────────────────────────────────────────────
const hazeGeo = new THREE.PlaneGeometry(200, 20);
const hazeMat = new THREE.MeshBasicMaterial({
  color: 0xaa4411, transparent: true, opacity: 0.15,
  blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
});
const haze = new THREE.Mesh(hazeGeo, hazeMat);
haze.rotation.x = -Math.PI / 2;
haze.position.set(0, -1.8, -30);
scene.add(haze);

// ── MARS ROVER ────────────────────────────────────────────────────────────────
let rover = null;

function loadRover() {
  const fbxLoader = new FBXLoader();
  const texLoader = new THREE.TextureLoader();

  const baseColor = texLoader.load('assets/rover/basecolor.png');
  const normalTex = texLoader.load('assets/rover/normal.png');
  const aoTex     = texLoader.load('assets/rover/ao.png');
  const roughTex  = texLoader.load('assets/rover/roughness.png');
  const metalTex  = texLoader.load('assets/rover/metallic.png');

  fbxLoader.load(
    'assets/rover/mars_rover.fbx',
    (fbx) => {
      fbx.scale.setScalar(0.007);
      fbx.position.set(-1.8, -2.2, -2);
      fbx.rotation.y = Math.PI * 0.2;

      fbx.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map:          baseColor,
            normalMap:    normalTex,
            normalScale:  new THREE.Vector2(1, 1),
            aoMap:        aoTex,
            roughnessMap: roughTex,
            roughness:    0.85,
            metalnessMap: metalTex,
            metalness:    0.7,
          });
          child.castShadow    = true;
          child.receiveShadow = true;
        }
      });

      rover = fbx;
      scene.add(fbx);
    },
    undefined,
    (err) => {
      console.warn('FBX load failed, using placeholder rover:', err);
      buildFallbackRover();
    }
  );
}

function buildFallbackRover() {
  const texLoader = new THREE.TextureLoader();
  const baseColor = texLoader.load('assets/rover/basecolor.png');
  const roughTex  = texLoader.load('assets/rover/roughness.png');
  const metalTex  = texLoader.load('assets/rover/metallic.png');

  const mat = new THREE.MeshStandardMaterial({
    map: baseColor, roughnessMap: roughTex, metalnessMap: metalTex,
    roughness: 0.8, metalness: 0.6,
  });

  const group = new THREE.Group();

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.1), mat);
  body.position.y = 0.55;
  group.add(body);

  // Mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9), mat);
  mast.position.set(0.5, 1.1, 0);
  group.add(mast);

  // Camera head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), mat);
  head.position.set(0.5, 1.58, 0);
  group.add(head);

  // Wheels (6)
  const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 20);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.95, metalness: 0.2 });
  const wheelPos = [
    [-0.7,  0.24,  0.65], [0, 0.24, 0.65],  [0.7, 0.24, 0.65],
    [-0.7,  0.24, -0.65], [0, 0.24, -0.65], [0.7, 0.24, -0.65],
  ];
  wheelPos.forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, y, z);
    group.add(w);
  });

  // Solar panels
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1144aa, roughness: 0.5, metalness: 0.4 });
  [[-1.2, 0.8, 0], [1.2, 0.8, 0]].forEach(([x, y, z]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.6), panelMat);
    p.position.set(x, y, z);
    group.add(p);
  });

  group.scale.setScalar(0.55);
  group.position.set(-1.8, -2.2, -2);
  group.rotation.y = Math.PI * 0.2;

  rover = group;
  scene.add(group);
}

loadRover();

// ── DUST PARTICLES ────────────────────────────────────────────────────────────
const dustGeo = new THREE.BufferGeometry();
const dustCount = 300;
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  dustPos[i*3]   = (Math.random()-0.5)*30;
  dustPos[i*3+1] = Math.random()*3 - 2;
  dustPos[i*3+2] = (Math.random()-0.5)*20 - 5;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustMat = new THREE.PointsMaterial({ color: 0xcc6633, size: 0.05, transparent: true, opacity: 0.4 });
const dust = new THREE.Points(dustGeo, dustMat);
scene.add(dust);

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

  earth.rotation.y  += 0.0008;
  clouds.rotation.y += 0.0004;

  if (rover) {
    rover.rotation.y = Math.PI * 0.2 + Math.sin(elapsed * 0.3) * 0.04;
  }

  // Animate dust particles
  const dp = dustGeo.attributes.position.array;
  for (let i = 0; i < dustCount; i++) {
    dp[i*3]   += 0.01;
    dp[i*3+1] += Math.sin(elapsed * 0.5 + i) * 0.002;
    if (dp[i*3] > 15) dp[i*3] = -15;
  }
  dustGeo.attributes.position.needsUpdate = true;

  // Atmospheric pulse
  atmMat.opacity = 0.10 + Math.sin(elapsed * 0.7) * 0.03;

  renderer.render(scene, camera);
}

animate();
