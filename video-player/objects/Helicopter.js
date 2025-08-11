import * as THREE from 'three';

let mixer, heli, heliAudio;
function create(scene, loader) {
  loader.load("helicopter/scene.gltf", (gltf) => {
    heli = gltf.scene;
    const scale = 0.006;
    heli.scale.set(scale, scale, scale);
    heli.position.set(15,5,35);
    heli.rotation.y = Math.PI;
    scene.add(heli);

    mixer = new THREE.AnimationMixer(heli);
    const animations = gltf.animations;
    if (animations) {
      const action = mixer.clipAction(animations[2]);
      action.play();

      heliAudio = new Audio("helicopter/sound.mp3");
      heliAudio.addEventListener('ended', () => {
        heliAudio.currentTime = 0;
        heliAudio.play();
      });
    }
  });
}

function animate(camera) {
  if (heli === undefined) return;
  mixer.update(0.016);

  moveHeli();
  updateVolume(camera);
}


let dirn = 'S';
let dis = 0;
let rotation = 0;
const speed = 0.1;
const rotationSpeed = 0.01;

function moveHeli() {
  switch(dirn) {
    case 'B':
    case 'S':
      if (dis < 65) {
        heli.position.z -= dirn == 'S' ? speed : speed * -1;
        dis += speed;
      } else if (rotation < Math.PI/2) {
        heli.rotation.y += rotationSpeed;
        rotation += rotationSpeed;
      } else {
        dirn = dirn == 'S' ? 'L': 'R';
        dis = 0;
        rotation = 0;
      }
      break;
    case 'R':
    case 'L':
      if (dis < 30) {
        heli.position.x -= dirn == 'L' ? speed : speed * -1;
        dis += speed;
      } else if (rotation < Math.PI/2) {
        heli.rotation.y += rotationSpeed;
        rotation += rotationSpeed;
      } else {
        dirn = dirn == 'L' ? 'B' : 'S';
        dis = 0;
        rotation = 0;
      }
  }
}

function updateVolume(camera) {
  const heliDistance = heli ? heli.position.distanceTo(camera.position) : -1;
  if (heliDistance != -1) {
    const vol = 1 - (heliDistance / 799);
    heliAudio.volume = vol < 0.01 ? 0.01 : vol;
  }
}

let audio = false;
const audioBtn = document.getElementById('audio-btn');

audioBtn.onclick = () => {
  audio = !audio;
  if (audio) {
    audioBtn.innerHTML = 'Audio: On';
    heliAudio.play();
  } else {
    audioBtn.innerHTML = 'Audio: Off';
    heliAudio.pause();
  }
}

export default { create, animate };