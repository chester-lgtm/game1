// Loads the Blender GLB vehicles/pickups into a real Three.js WebGL scene.
// The 2D canvas remains as a fallback if WebGL or the CDN is unavailable.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';

const host = document.querySelector('#threeViewport');
const fallback = document.querySelector('#raceCanvas');
if (!host || !window.WebGLRenderingContext) throw new Error('WebGL is not available; using the canvas fallback.');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#8ec9d2');
scene.fog = new THREE.Fog('#8ec9d2', 38, 135);
const camera = new THREE.PerspectiveCamera(48, 1, .1, 220);
camera.position.set(0, 8.5, 15);
camera.lookAt(0, 0, -14);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
host.appendChild(renderer.domElement);
fallback.style.display = 'none';

scene.add(new THREE.HemisphereLight('#d9f8ff', '#304336', 2.2));
const sun = new THREE.DirectionalLight('#fff0ce', 3.2);
sun.position.set(-8, 18, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); scene.add(sun);

const mat = (color, roughness=.8, metalness=0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const grass = mat('#5c9b6d'), asphalt = mat('#33383f'), edge = mat('#d7d0bb'), gold = mat('#ffc34a'), rail = mat('#ece3ce', .45, .2);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), grass); ground.rotation.x=-Math.PI/2; ground.position.set(0,-.13,-50); ground.receiveShadow=true; scene.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(12, 180), asphalt); road.rotation.x=-Math.PI/2; road.position.set(0,0,-48); road.receiveShadow=true; scene.add(road);
// Rumbling curbs, lane stripes and rails provide clear depth cues.
for (let z=24; z>-128; z-=5) {
  for (const side of [-1,1]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(.7,.12,2.5), Math.floor(z/5)%2 ? rail : mat('#e66c59'));
    curb.position.set(side*6.35,.02,z); curb.castShadow=true; scene.add(curb);
  }
}
for(let z=22;z>-125;z-=8){const dash=new THREE.Mesh(new THREE.BoxGeometry(.13,.025,3.2),gold);dash.position.set(0,.025,z);scene.add(dash)}
for(const side of [-1,1]){
  const barrier=new THREE.Mesh(new THREE.BoxGeometry(.23,.58,175),rail);barrier.position.set(side*7.15,.29,-48);barrier.castShadow=true;barrier.receiveShadow=true;scene.add(barrier);
  for(let z=18;z>-125;z-=12){const post=new THREE.Mesh(new THREE.BoxGeometry(.38,1.1,.45),mat(side<0?'#ff9e45':'#48c8b7',.36));post.position.set(side*8,.42,z);post.castShadow=true;scene.add(post)}
}
// Low-poly scenery: colorful trees and a distant finish gantry.
for(let i=0;i<23;i++) for(const side of [-1,1]){
  const z=12-i*6.2, x=side*(11+(i%3)*2);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.19,1.3,6),mat('#72513d'));trunk.position.set(x,.55,z);scene.add(trunk);
  const crown=new THREE.Mesh(new THREE.DodecahedronGeometry(.9+(i%3)*.16,0),mat(['#4c9e78','#72b986','#e8b858'][i%3]));crown.position.set(x,1.65,z);crown.castShadow=true;scene.add(crown);
}
const finish=new THREE.Group();finish.position.set(0,0,-104);scene.add(finish);
for(const x of [-6.8,6.8]){const pillar=new THREE.Mesh(new THREE.BoxGeometry(.55,4,.55),gold);pillar.position.set(x,2,0);finish.add(pillar)}
const beam=new THREE.Mesh(new THREE.BoxGeometry(14,.6,.7),mat('#18222d'));beam.position.y=4;finish.add(beam);
const loader=new GLTFLoader();
const cars=[];
const race=window.mathRushRace;
const vehiclePaths=['assets/models/turbo-racer.glb','assets/models/aqua-racer.glb'];
const vehicleColors=['#ff9a3c','#42d3c3'];
async function loadVehicle(path,index){
  const gltf=await loader.loadAsync(path);const model=gltf.scene;
  model.scale.setScalar(.78);model.rotation.y=-Math.PI/2;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  scene.add(model);cars[index]=model;return model;
}
try {
  await Promise.all(vehiclePaths.map(loadVehicle));
  const turbo=(await loader.loadAsync('assets/models/lightning-turbo.glb')).scene;turbo.scale.setScalar(.8);turbo.position.set(-3.8,1.1,-18);turbo.rotation.x=-Math.PI/2;scene.add(turbo);
  const shield=(await loader.loadAsync('assets/models/stardust-shield.glb')).scene;shield.scale.setScalar(.8);shield.position.set(3.8,1.1,-37);scene.add(shield);
} catch (error) {
  console.warn('Could not load a Blender GLB. Using built-in 3D car meshes.',error);
  const colors=[0xff873f,0x32cbbb];
  for(let i=0;i<2;i++){
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.8,.55,3.1),new THREE.MeshStandardMaterial({color:colors[i],roughness:.3,metalness:.2}));body.castShadow=true;
    const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.1,.55,1.35),mat('#b9e9ed',.18,.25));cabin.position.set(0,.48,-.15);body.add(cabin);scene.add(body);cars[i]=body;
  }
}
const resize=()=>{const r=host.getBoundingClientRect();if(r.width<2||r.height<2)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()};
new ResizeObserver(resize).observe(host);resize();
const clock=new THREE.Clock();
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);const active=race?.active;
  cars.forEach((car,i)=>{if(!car)return;const p=race?.racer?.[i]||{x:0,y:i?0.35:-0.35,speed:0};car.position.set(p.y*4,.22,5-p.x*.82);car.rotation.z=-p.y*.12;});
  // Speed changes the scenery scroll just enough to communicate motion.
  const average=((race?.racer||[]).reduce((n,p)=>n+p.speed,0)/2)||0;
  if(active){road.position.z+=average*dt*.05;if(road.position.z>0)road.position.z=-48;scene.children.forEach(o=>{if(o.userData.scrolling){o.position.z+=average*dt*.05;if(o.position.z>26)o.position.z=-130}})}
  camera.position.x+=(Math.sin((race?.animation||0)*.013)*.9-camera.position.x)*.025;
  renderer.render(scene,camera);
}
frame();
