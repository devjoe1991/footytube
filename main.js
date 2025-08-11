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

// Browser compatibility check
function checkBrowserCompatibility() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    throw new Error('WebGL not supported in this browser');
  }
  
  // Check for required WebGL extensions
  const extensions = gl.getSupportedExtensions();
  if (!extensions.includes('OES_texture_float')) {
    console.warn('OES_texture_float not supported - some features may not work');
  }
  
  return true;
}


// Initialize the app with error handling
try {
  checkBrowserCompatibility();
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
  );
  
  const canvas = document.getElementById('scene');
  if (!canvas) {
    throw new Error('Canvas element not found');
  }
  
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
  });

  // Set pixel ratio with fallback for older browsers
  const pixelRatio = window.devicePixelRatio || 1;
  renderer.setPixelRatio(Math.min(pixelRatio, 2)); // Cap at 2 for performance
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

  // Initialize all objects with error handling
  try {
    Stadium.create(scene, world, gltfLoader);
    Football.create(scene, world, gltfLoader);
    const createdScreens = Screens.create(scene, world);
    Football.setupCollisions(createdScreens);
    Stars.create(scene);
    Helicopter.create(scene, gltfLoader);
  } catch (error) {
    console.error('Error initializing objects:', error);
  }

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
  scene.add(directionalLight);
  directionalLight.position.set(0,10,0);


  const animate = () => {
    try {
      Stars.animate();
      Football.animate(camera);
      Screens.animate();
      Helicopter.animate(camera);

      world.fixedStep();
      cssRenderer.render(scene, camera);
      renderer.render(scene, camera);
    } catch (error) {
      console.error('Animation error:', error);
    }
    requestAnimationFrame(animate);
  }

  animate();

  window.onresize = () => {
    try {
      cssRenderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
    } catch (error) {
      console.error('Resize error:', error);
    }
  }

  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      try {
        for (const screen of Screens.screens) {
          if (screen.video) {
            screen.video.play().catch(e => console.error('Video play error:', e));
            screen.video.pause();
          }
        }
        startBtn.remove();
      } catch (error) {
        console.error('Start button error:', error);
      }
    });
  }

} catch (error) {
  console.error('App initialization error:', error);
  // Show user-friendly error message
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    z-index: 1000;
    font-family: Arial, sans-serif;
  `;
  errorDiv.innerHTML = `
    <h3>Browser Compatibility Issue</h3>
    <p>This app requires a modern browser with WebGL support.</p>
    <p>Please try using Chrome, Firefox, Safari, or Edge.</p>
    <p>Error: ${error.message}</p>
  `;
  document.body.appendChild(errorDiv);
}