import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
  CSS2DObject
} from "three/examples/jsm/renderers/CSS2DRenderer.js";


let sphereBody;
let football;
function create(scene, world, loader) {
  sphereBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Sphere(0.13),
    material: new CANNON.Material(),
    position: new CANNON.Vec3(0, 10, 2),
    angularVelocity: new CANNON.Vec3(10, 0, 0),
    linearDamping: 0.2,
    angularDamping: 0.5
  });
  
  sphereBody.material.restitution = 0.5;
  world.addBody(sphereBody);
  
  loader.load('football/scene.gltf', (gltf) => {
    football = gltf.scene;
    const scale = 0.003;
    football.scale.set(scale, scale, scale);
    scene.add(gltf.scene);
  });

  setupResetBtn(scene);
}

let resetBtn;
function setupResetBtn(scene) {
  const btn = document.createElement("button");
  btn.innerHTML = "Reset";
  btn.className = "btn";
  btn.id = "reset-btn";
  btn.style.border = "none";

  btn.onclick = () => {
    sphereBody.position.copy(startPos);
    sphereBody.velocity.set(0, 0, 0);
    sphereBody.angularVelocity.copy(initialAngularVelocity);
  };

  resetBtn = new CSS2DObject(btn);
  scene.add(resetBtn);
}

let currentScreen;
const title = document.getElementById("title");
const blinker = document.getElementsByClassName("dot")[0];

function setupCollisions(screens) {
  sphereBody.addEventListener('collide', (e) => {
    const { body } = e;
    const screen = screens.find((s) => s.body === body);
    if (!screen) return;

    if (currentScreen === screen) {
      blinker.classList.remove("blink");
      screen.video.paused ? screen.video.play() : screen.video.pause();
      return;
    }

    if (currentScreen) {
      const { video, surface } = currentScreen;
      video.pause();
      updateBoxOpacity(surface, 0.0);
    }

    currentScreen = screen;
    const { video, surface } = currentScreen;
    video.play();
    updateBoxOpacity(surface, 0.5);

    title.innerHTML = video.dataset.title;
    title.style.opacity = 1;
    blinker.classList.add("blink");
  });
}

function updateBoxOpacity(surface, opacity) {
  const material = surface.children[0].material;
  material.opacity = opacity;
  material.needsUpdate = true;
}

const cameraOffset = new THREE.Vector3(0, 0.5, 1.2);
const resetBtnOffset = new THREE.Vector3(-0.02, 0.2, 0);

function animate(camera) {
  if (football && resetBtn) {
    football.position.copy(sphereBody.position);
    football.quaternion.copy(sphereBody.quaternion);

    const dist = sphereBody.position.distanceTo(new CANNON.Vec3(0, 0, 2));
    resetBtn.element.style.opacity = dist > 1 ? 1 : 0;
    resetBtn.position.copy(sphereBody.position).add(resetBtnOffset);

    camera.position.copy(sphereBody.position).add(cameraOffset);
  }
}

let x;
let y;
document.addEventListener('mousedown', (e) => {
  x = e.clientX;
  y = e.clientY;
});

document.addEventListener('mouseup', (e) => {
  const dx = e.clientX - x;
  const dy = e.clientY - y;

  const VELOCITY_FACTOR = 0.015;
  const mag = Math.sqrt(dx*dx + dy*dy);


  if (sphereBody.position.y < 0.3)
    sphereBody.velocity.set(-dx*VELOCITY_FACTOR, mag * VELOCITY_FACTOR, -dy*VELOCITY_FACTOR);

});

// Touch support for mobile
document.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  if (!t) return;
  x = t.clientX;
  y = t.clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const t = e.changedTouches && e.changedTouches[0];
  if (!t) return;
  const dx = t.clientX - x;
  const dy = t.clientY - y;

  const VELOCITY_FACTOR = 0.015;
  const mag = Math.sqrt(dx*dx + dy*dy);

  if (sphereBody.position.y < 0.3)
    sphereBody.velocity.set(-dx*VELOCITY_FACTOR, mag * VELOCITY_FACTOR, -dy*VELOCITY_FACTOR);
}, { passive: true });

export default { create, animate, setupCollisions };