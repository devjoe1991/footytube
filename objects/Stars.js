import * as THREE from "three";

const numStars = 1000;
let starsMaterial;
function create(scene) {
  const starsGeometry = new THREE.BufferGeometry();
  starsMaterial = new THREE.PointsMaterial({ color: 0xffffff });

  const starsVertices = [];

  for (let i = 0; i < numStars; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;

    starsVertices.push(x, y, z);
  }
  starsGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starsVertices, 3)
  );

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);
}

function animate() {
  for (let i = 0; i < numStars; i++) {
    if (Math.random() > 0.7) {
      starsMaterial.color.setRGB(Math.random(), Math.random(), Math.random());
    }
  }
}

export default { create, animate };