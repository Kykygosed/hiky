import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/PointerLockControls.js';
import { WORLD } from './world.js';


// === INITIALISATION DE BASE ===
const canvas = document.getElementById('c');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x87ceeb, 0.0025);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio || 1);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// === LUMIÈRES ===
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
hemi.position.set(0, 200, 0);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(-100, 100, -50);
scene.add(dir);

// === GRILLE AU SOL ===
let grid = new THREE.GridHelper(64, 64, 0x000000, 0x888888);
grid.position.y = 0.01;
scene.add(grid);

// === MATÉRIAUX ===
const mats = {
  grass: new THREE.MeshLambertMaterial({ color: 0x55a630 }),
  dirt: new THREE.MeshLambertMaterial({ color: 0x8b5a2b }),
  wood: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
  leaf: new THREE.MeshLambertMaterial({ color: 0x2e8b57 }),
  stone: new THREE.MeshLambertMaterial({ color: 0x808080 })
};

// === GÉNÉRATION DU MONDE ===
const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
const instanced = new Map();

function buildInstanced() {
  const buckets = {};
  WORLD.forEach(b => {
    buckets[b.type] = buckets[b.type] || [];
    buckets[b.type].push(b);
  });

  for (const type in buckets) {
    const arr = buckets[type];
    const mesh = new THREE.InstancedMesh(cubeGeo, mats[type] || mats.stone, arr.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < arr.length; i++) {
      const b = arr[i];
      dummy.position.set(b.x + 0.5, b.y + 0.5, b.z + 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    instanced.set(type, mesh);
    scene.add(mesh);
  }
}

buildInstanced();

// === CONTRÔLES / JOUEUR ===
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let canJump = false;

// === GESTION CLAVIER ===
const move = { forward: false, backward: false, left: false, right: false };

function onKeyDown(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW': move.forward = true; break;
    case 'ArrowLeft':
    case 'KeyA': move.left = true; break;
    case 'ArrowDown':
    case 'KeyS': move.backward = true; break;
    case 'ArrowRight':
    case 'KeyD': move.right = true; break;
    case 'Space':
      if (canJump) {
        velocity.y += 8;
        canJump = false;
      }
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW': move.forward = false; break;
    case 'ArrowLeft':
    case 'KeyA': move.left = false; break;
    case 'ArrowDown':
    case 'KeyS': move.backward = false; break;
    case 'ArrowRight':
    case 'KeyD': move.right = false; break;
  }
}

// Écouteurs clavier (doivent venir APRÈS les définitions)
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// === INITIALISATION DU JOUEUR ===
controls.getObject().position.set(0, 2, 5);

// Click pour activer la caméra
document.body.addEventListener('click', () => controls.lock());

// === ANIMATION ===
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(0.1, clock.getDelta());

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;
  velocity.y -= 9.8 * 5.0 * delta; // gravité

  direction.z = Number(move.forward) - Number(move.backward);
  direction.x = Number(move.right) - Number(move.left);
  direction.normalize();

  const speed = 10.0;
  if (move.forward || move.backward) velocity.z -= direction.z * speed * delta;
  if (move.left || move.right) velocity.x -= direction.x * speed * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);
  controls.getObject().position.y += velocity.y * delta;

  // Collision simple au sol
  if (controls.getObject().position.y < 2) {
    velocity.y = 0;
    controls.getObject().position.y = 2;
    canJump = true;
  }

  renderer.render(scene, camera);
}

animate();

// === ÉVÉNEMENTS SUPPLÉMENTAIRES ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('toggle-grid').addEventListener('change', (e) => {
  grid.visible = e.target.checked;
});

document.getElementById('toggle-wire').addEventListener('change', (e) => {
  instanced.forEach(m => { m.material.wireframe = e.target.checked; });
});

document.getElementById('render-distance').addEventListener('input', (e) => {
  const d = Number(e.target.value);
  camera.far = d;
  camera.updateProjectionMatrix();
});
