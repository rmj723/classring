import * as THREE from 'https://unpkg.com/three@0.121.0/build/three.module.js';
import {OrbitControls} from 'https://unpkg.com/three@0.121.0/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'https://unpkg.com/three@0.121.0/examples/jsm/loaders/GLTFLoader.js';
import {RGBELoader} from 'https://unpkg.com/three@0.121.0/examples/jsm/loaders/RGBELoader.js';
import {sideData} from './data.js';
import {data} from './top-data.js';

const el = (eleName) => document.getElementById(`${eleName}`);
const container = el('container');
var camera, scene, renderer, controls;
const chars = {};
var graphs = [];
var content = {color: null, inside: null};
var charPos = {top: [], right: [], left: [], inside: []};
var ring = {body: null, material: null, textures: {}, core: null, right: null, left: null, top: null};
const pos = {
  left: {x: -70, y: 26, z: -30},
  right: {x: 80, y: 0, z: 0},
  top: {x: -6.4, y: 80, z: 35},
  topCore: {x: -11, y: 68, z: -23},
  neckText: {x: -17.8, y: 74.8, z: 43.4},
  rightText: {x: 65.8, y: 45.3, z: 2.48},
  leftText: {x: -66.73, y: 44.96, z: -1.02},
  insideText: {x: 0.89, y: 41.74, z: 42.23},
  color: {x: -51.25, y: 36.16, z: 59.7},
};
var ctx,
  overflow = {};
const p = {inside: {fontSize: 30, s: 10, e: 400, left: 0, top: 50}};
var delta = 300;

init();

async function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  camera = new THREE.PerspectiveCamera(30, container.clientWidth / container.clientHeight, 1, 5000);
  window['camera'] = camera;
  camera.position.set(-51.25, 36.16, 59.7);
  scene.add(camera);
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 4, 0);
  controls.zoomSpeed = 0.01;
  controls.minDistance = 85;
  controls.maxDistance = 100;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.enableKeys = false;
  controls.autoRotate = true;
  scene.add(new THREE.AmbientLight(0xffffff, 1));
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 1));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(100, 100, 100);
  scene.add(directionalLight);
  const pointLight = new THREE.PointLight(0xffffff, 1, 200);
  camera.add(pointLight);
  ['gold', 'silver', 'rose'].forEach(async (color) => {
    ring.textures[`${color}`] = await loadImage(`../assets/images/${color}.jpg`);
    ring.textures[`_${color}`] = await new THREE.TextureLoader().loadAsync(`../assets/images/${color}.jpg`);
  });
  const envTexture = await new RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    .loadAsync('../assets/env/venice_sunset_1k.hdr');
  var pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  scene.environment = pmremGenerator.fromEquirectangular(envTexture).texture;
  envTexture.dispose();
  pmremGenerator.dispose();

  const ringGLTF = await new GLTFLoader().loadAsync('../assets/ring19.glb');
  scene.add(ringGLTF.scene);
  ringGLTF.scene.traverse((child) => {
    if (!child.isMesh) return;
    if (child.name.includes('body')) ring.body = child;
    if (child.name.includes('core')) ring.core = child;
    if (child.name.includes('Cube')) ring.material = child.material;
  });
  const charsGLTF = await new GLTFLoader().loadAsync('../assets/chars.glb');
  charsGLTF.scene.traverse((child) => {
    if (!child.isMesh) return;
    let str = child.name.split('_');
    if (!chars[str[0]]) chars[str[0]] = {};
    if (!chars[str[0]][str[1]]) chars[str[0]][str[1]] = {};
    chars[str[0]][str[1]][str[2]] = child;
  });
  const graphsGLTF = await new GLTFLoader().loadAsync('../assets/graphs.glb');
  graphsGLTF.scene.traverse((child) => {
    let str = child.name.split('_');
    graphs[parseInt(str[1]) - 1] = child;
  });

  window.addEventListener('resize', onWindowResize, false);
  animate();
  controls.autoRotate = false;

  /* ********************************************** */
  changeRing({
    ringColor: 'gold',
    topText: 'WESTERN HIGH SCHOOL',
    rightText: '320',
    leftText: 'JASON',
    insideText: 'CONGRATULATION!',
    rightGraph: 1,
    leftGraph: 1,
    topGraph: 1,
  });
  /* ********************************************** */
}

function changeRing({ringColor, rightText, leftText, insideText, topText, rightGraph, leftGraph, topGraph}) {
  changeText(topText, 'top');
  changeText(rightText, 'right');
  changeText(leftText, 'left');
  changeGraph(leftGraph, 'left');
  changeGraph(rightGraph, 'right');
  changeGraph(topGraph, 'top');
  content = {inside: {text: insideText}, color: ringColor};
  drawContent(content);
  ring.material.map = ring.textures[`_${ringColor}`];
}

function loadImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.src = url;
  });
}
function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();
}
function moveCamera(camPos) {
  gsap.to(camera.position, {
    duration: 0.8,
    x: camPos.x,
    y: camPos.y,
    z: camPos.z,
    onUpdate: function () {
      controls.update();
    },
  });
}
function changeGraph(index, side) {
  if (ring[side] !== null) {
    ring[side].geometry.dispose();
    scene.remove(ring[side]);
    ring[side] = null;
  }
  ring[side] = graphs[index - 1].clone();
  ring[side].material = ring.material;
  var a = side !== 'top' ? sideData[side + '_graph'] : data[side + '_graph'];
  ring[side].position.set(a.position[0], a.position[1], a.position[2]);
  if (side !== 'top') rotate(ring[side], a.rotation);
  else ring[side].rotation.set(a.rotation[0], a.rotation[1], -a.rotation[2]);
  ring[side].scale.set(a.scale[0] - 0.1, a.scale[1] - 0.1, a.scale[2] - 0.1);
  ring[side].visible = true;
  scene.add(ring[side]);
}
function getMesh(code, fontName, fontType) {
  return code === 32 ? new THREE.Mesh() : chars[fontName][fontType][code];
}
function removeChars(side) {
  charPos[side].forEach((v) => {
    scene.remove(v);
    v.geometry.dispose();
  });
  charPos[side] = [];
}
function changeText(text, side) {
  const L = text.length;
  var temp;
  switch (side) {
    case 'top':
      removeChars('top');
      for (var i = 0; i < L; ++i) {
        temp = getMesh(text.charCodeAt(i), 'arial', 'regular');
        let m = temp.clone();
        var a = data['top_' + L + '_' + (i + 1)];
        m.position.set(a.position[0], a.position[1], a.position[2]);
        m.rotation.x = a.rotation[0];
        m.rotation.y = a.rotation[1];
        m.rotation.z = a.rotation[2];
        m.scale.set(a.scale[0], a.scale[1], -a.scale[2]);
        m.visible = true;
        m.material = ring.material;
        charPos.top.push(m);
        scene.add(m);
      }
      break;
    case 'right':
      removeChars('right');
      for (var i = 0; i < L; ++i) {
        temp = getMesh(text.charCodeAt(i), 'arial', 'bold');
        let m = temp.clone();
        let a = sideData['right_' + L + '_' + (i + 1)];
        m.position.set(a.position[0], a.position[1], a.position[2]);
        rotate(m, a.rotation);
        m.scale.set(a.scale[0], 1.2, a.scale[2]);
        m.visible = true;
        m.material = ring.material;
        charPos.right.push(m);
        scene.add(m);
      }
      break;
    case 'left':
      removeChars('left');
      for (var i = 0; i < L; ++i) {
        temp = getMesh(text.charCodeAt(i), 'arial', 'bold');
        let m = temp.clone();
        let a = sideData['left_' + L + '_' + (i + 1)];
        m.position.set(a.position[0], a.position[1], a.position[2]);
        rotate(m, a.rotation);
        m.scale.set(a.scale[0], 1.2, a.scale[2]);
        m.visible = true;
        m.material = ring.material;
        charPos.left.push(m);
        scene.add(m);
      }
      break;
  }
}
function rotate(mesh, e) {
  //euler
  var qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), e[0]);
  var qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), e[1]);
  var qz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), e[2]);
  mesh.applyQuaternion(qx);
  mesh.applyQuaternion(qy);
  mesh.applyQuaternion(qz);
}
function drawContent(content) {
  var img = ring.textures[`${content.color}`];
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  ['inside'].forEach((side) => {
    drawText(content[side].text, p[side], side);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.anisotropy = 16;

  setTimeout(() => {
    ring.body.material.map = texture;
    texture.dispose();
    delta = 0;
    document.getElementById('loader').style.display = 'none';
  }, delta);
}
function drawText(text, info, key) {
  ctx.font = `bold ${info.fontSize}px century`;
  ctx.fillStyle = 'black';
  var w = ctx.measureText(text).width;
  var left;
  if (w < info.e) {
    if (key === 'inside') left = (info.s + info.e) / 2 - w / 2;
    else if (key.includes('left')) left = info.e - w;
    else if (key.includes('right')) left = info.s;
    else if (key.includes('top')) left = (info.s + info.e) / 2 - w / 2;
    const top = info.top;
    ctx.fillText(text, left, top);
    if (!overflow[key]) overflow[key] = {};
    overflow[key]['text'] = text; /* Save Last Value */
    overflow[key]['left'] = left;
    overflow[key]['top'] = top;
  } else {
    ctx.fillText(overflow[key].text, overflow[key].left, overflow[key].top);
  }
}

function checkInput(element) {
  let str = element.value.replace(/[^ -~]+/g, '');
  str = str.toUpperCase();
  str = str.replace(/[`{}_\[\]\\|^]/g, '');
  element.value = str;
}

//CHANGE RIGHT GRAPH
el('right_graph').onclick = () => moveCamera(pos.right);
el('right_graph').onchange = () => {
  moveCamera(pos.right);
  changeGraph(el('right_graph').value, 'right');
};

//CHANGE LEFT GRAPH
el('left_graph').onclick = () => moveCamera(pos.left);
el('left_graph').onchange = () => {
  moveCamera(pos.left);
  changeGraph(el('left_graph').value, 'left');
};

//CHANGE LEFT GRAPH
el('top_graph').onclick = () => moveCamera(pos.top);
el('top_graph').onchange = () => {
  moveCamera(pos.top);
  changeGraph(el('top_graph').value, 'top');
};

// CHANGE RIGHT TEXT
el('right_text').onfocus = () => moveCamera(pos.rightText);
el('right_text').onkeyup = () => {
  moveCamera(pos.rightText);
  checkInput(el('right_text'));
  changeText(el('right_text').value, 'right');
};

// CHANGE LEFT TEXT
el('left_text').onfocus = () => moveCamera(pos.leftText);
el('left_text').onkeyup = () => {
  moveCamera(pos.leftText);
  checkInput(el('left_text'));
  changeText(el('left_text').value, 'left');
};

// CHANGE INSIDE TEXT
el('inside_text').onfocus = () => moveCamera(pos.insideText);
el('inside_text').onkeyup = () => {
  moveCamera(pos.insideText);
  checkInput(el('inside_text'));
  content.inside.text = el('inside_text').value;
  drawContent(content);
};

// CHANGE TOP TEXT
el('top_text').onfocus = () => moveCamera(pos.neckText);
el('top_text').onkeyup = () => {
  moveCamera(pos.neckText);
  checkInput(el('top_text'));
  changeText(el('top_text').value, 'top');
};

// CHANGE RING COLOR
el('ring_color').onchange = () => {
  const color = el('ring_color').value;
  content.color = color;
  ring.material.map = ring.textures[`_${color}`];
  drawContent(content);
};
