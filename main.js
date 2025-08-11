import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Stadium from './objects/Stadium';
import Football from './objects/Football';
import Screens from './objects/Screens';
import Stars from './objects/Stars';
import Helicopter from './objects/Helicopter';
import {
  CSS2DRenderer
} from "three/examples/jsm/renderers/CSS2DRenderer.js";


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth/window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene')
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const cssRenderer = new CSS2DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = "fixed";
cssRenderer.domElement.style.top = 0;
cssRenderer.domElement.style.zIndex = 0;
document.body.appendChild(cssRenderer.domElement);

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0)
});

const gltfLoader = new GLTFLoader();

Stadium.create(scene, world, gltfLoader);
Football.create(scene, world, gltfLoader);
const createdScreens = Screens.create(scene, world);
Football.setupCollisions(createdScreens);
Stars.create(scene);
Helicopter.create(scene, gltfLoader);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
scene.add(directionalLight);
directionalLight.position.set(0,10,0);


const animate = () => {
  Stars.animate();
  Football.animate(camera);
  Screens.animate();
  Helicopter.animate(camera);

  world.fixedStep();
  cssRenderer.render(scene, camera);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.onresize = () => {
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
}

const startBtn = document.getElementById('start-btn');
startBtn.addEventListener('click', () => {
  for (const screen of Screens.screens) {
    screen.video.play();
    screen.video.pause();
  }
  startBtn.remove();
});