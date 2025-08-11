import * as CANNON from 'cannon-es';

function create(scene, world, loader) {
  const groundBody = new CANNON.Body({
    mass: 0,
    material: new CANNON.Material('ground'),
    shape: new CANNON.Plane()
  });
  groundBody.material.restitution = 0.8
  groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
  world.addBody(groundBody);

  loader.load('stadium/scene.gltf', (gltf) => {
    const stadium = gltf.scene;
    const scale = 2;
  
    stadium.scale.set(scale, scale, scale);
    stadium.position.set(23.5, -1.1, 45);
    stadium.rotation.y = Math.PI/2;
  
    scene.add(gltf.scene);
  });
}

export default { create };