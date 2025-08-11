import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import videoSrcs from '../videos.json';

const screens = [];
const rowSize = 2;
const videoWidth = 1.778;
const videoHeight = 1;
const videoThickness = 0.05;

const zOffset = -4.2;
const yOffset = videoHeight + 0.1;

const spacing = 0.15;
const videoWidthThree = videoWidth * 2;
const videoHeightThree = videoHeight * 2;
// Center the grid horizontally based on number of columns
const stepX = videoWidthThree + spacing;
const gridCols = rowSize;
const gridWidth = stepX * (gridCols - 1);
const xOffset = -gridWidth / 2;

function create(scene, world) {
  for (let i = 0;i < 4;i++) {
    addScreen(scene, world);
  }
  return screens;
}

function animate() {
  // Ensure video textures keep updating across browsers
  for (const s of screens) {
    if (s.texture && s.video && s.video.readyState >= 2 && !s.video.paused) {
      s.texture.needsUpdate = true;
    }
  }
}

function addScreen(scene, world) {
  const rowPos = screens.length % rowSize;
  const colPos = Math.floor(screens.length / rowSize);

  const screenShape = new CANNON.Box(
    new CANNON.Vec3(videoWidth, videoHeight, videoThickness)
  );

  const screenBody = new CANNON.Body({
    mass: 0,
    shape: screenShape,
  });
  world.addBody(screenBody);

  screenBody.position.set(
    xOffset + (videoWidthThree + spacing)*rowPos,
    yOffset + (videoHeightThree + spacing)*colPos,
    zOffset
  );

  const vidObj = getVideoObject(scene);
  vidObj.surface.position.copy(screenBody.position);

  screens.push({
    body: screenBody,
    ...vidObj
  });
}

function getVideoObject(scene) {
  let i = screens.length;

  const video = document.createElement('video');
  // Enable remote-link playback (requires CORS on the server)
  video.crossOrigin = 'anonymous';
  video.setAttribute('crossorigin', 'anonymous');
  // Autoplay-safe flags for mobile
  video.muted = true;
  video.setAttribute('muted', '');
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  // Prefer preloading and looping for seamless playback
  video.preload = 'auto';
  video.loop = true;

  const index = videoSrcs.length > 0 ? (i % videoSrcs.length) : 0;
  const src = videoSrcs.length > 0 ? videoSrcs[index].src : '';
  const title = videoSrcs.length > 0 ? (videoSrcs[index].title || videoSrcs[index].src) : '';

  video.src = src;
  // Helpful diagnostics in dev
  video.addEventListener('error', () => {
    console.error('Video error for src:', video.src, video.error);
  });
  video.dataset.title = title;

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  // Use RGBA format for broadest compatibility
  videoTexture.format = THREE.RGBAFormat;
  videoTexture.generateMipmaps = false;
  if ('SRGBColorSpace' in THREE) {
    videoTexture.colorSpace = THREE.SRGBColorSpace;
  }
  // Ensure the texture updates once data is available
  video.addEventListener('loadeddata', () => {
    videoTexture.needsUpdate = true;
    video.currentTime = 0.1;
  });

  const geometry = new THREE.BoxGeometry(
    videoWidthThree,
    videoHeightThree,
    videoThickness * 2
  );
  const material = new THREE.MeshBasicMaterial({ 
    map: videoTexture,
    side: THREE.DoubleSide
  });
  const surface = new THREE.Mesh(geometry, material);
  addBorderBox(surface);

  scene.add(surface);

  return {
    video,
    surface,
    texture: videoTexture
  };
}

function addBorderBox(surface) {
  const borderBox = new THREE.BoxGeometry(
    videoWidthThree + 0.1,
    videoHeightThree + 0.1,
    videoThickness
  );

  const borderBoxMaterial = new THREE.MeshBasicMaterial({
    color: "red",
    transparent: true,
    opacity: 0
  });

  const borderMesh = new THREE.Mesh(borderBox, borderBoxMaterial);
  surface.add(borderMesh);
}

export default { create, animate };