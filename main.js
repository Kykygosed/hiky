import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
const onKeyUp = function(event){
switch(event.code){
case 'ArrowUp': case 'KeyW': move.forward = false; break;
case 'ArrowLeft': case 'KeyA': move.left = false; break;
case 'ArrowDown': case 'KeyS': move.backward = false; break;
case 'ArrowRight': case 'KeyD': move.right = false; break;
}
};


const move = {forward:false, backward:false, left:false, right:false};


document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);


// position initiale
controls.getObject().position.set(0, 2, 5);
scene.add(controls.getObject());


// click pour pointer lock
document.body.addEventListener('click', ()=>{ controls.lock(); });


// simple collision/ground check: raycaster vers le bas
const downRay = new THREE.Raycaster();


const clock = new THREE.Clock();


function animate(){
requestAnimationFrame(animate);
const delta = Math.min(0.1, clock.getDelta());
// mouvement
velocity.x -= velocity.x * 10.0 * delta;
velocity.z -= velocity.z * 10.0 * delta;
velocity.y -= 9.8 * 5.0 * delta; // gravity


direction.z = Number(move.forward) - Number(move.backward);
direction.x = Number(move.right) - Number(move.left);
direction.normalize();


const speed = 10.0;
if(move.forward || move.backward) velocity.z -= direction.z * speed * delta;
if(move.left || move.right) velocity.x -= direction.x * speed * delta;


controls.moveRight(-velocity.x * delta);
controls.moveForward(-velocity.z * delta);
controls.getObject().position.y += velocity.y * delta;


// ground collision simple: si y < 1 => au sol
if(controls.getObject().position.y < 2){
velocity.y = 0; controls.getObject().position.y = 2; canJump = true;
}


renderer.render(scene, camera);
}
animate();


// window resize
window.addEventListener('resize', ()=>{
camera.aspect = window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth, window.innerHeight);
});


// GUI hooks
document.getElementById('toggle-grid').addEventListener('change', (e)=>{ grid.visible = e.target.checked; });
document.getElementById('toggle-wire').addEventListener('change', (e)=>{ instanced.forEach(m=>{ m.material.wireframe = e.target.checked; }); });
document.getElementById('render-distance').addEventListener('input', (e)=>{ const d = Number(e.target.value); camera.far = d; camera.updateProjectionMatrix(); });


// petit helper: position camera behind player
camera.position.set(0,0,0);


// fin main.js
