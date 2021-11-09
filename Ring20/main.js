import * as THREE from 'https://unpkg.com/three@0.121.0/build/three.module.js';
import {OrbitControls} from 'https://unpkg.com/three@0.121.0/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'https://unpkg.com/three@0.121.0/examples/jsm/loaders/GLTFLoader.js';
import {RGBELoader} from 'https://unpkg.com/three@0.121.0/examples/jsm/loaders/RGBELoader.js';
import {data} from './data.js';

const el = (eleName) => document.getElementById(`${eleName}`);
const container = el('container');
var camera, scene, renderer, controls;
const chars = {};
var graphs = [];
var content = {color: null, inside: null};
var charPos = {neck: [], right: [], left: [], inside: [], neckRight: [], neckLeft: []};
var ring = {
  material: null,
  body: null,
  textures: {},
  core: null,
  left: null,
  right: null,
};
const pos = {
  left: {x: -70, y: 26, z: -30},
  right: {x: 80, y: 0, z: 0},
  topCore: {x: -11, y: 68, z: -23},
  neckText: {x: -1.18, y: 34.98, z: -50.25},
  rightNeck: {x: 51, y: 61, z: 34},
  leftNeck: {x: -48.55, y: 64.75, z: 34.29},
  rightText: {x: 65.8, y: 45.3, z: 2.48},
  leftText: {x: -66.73, y: 44.96, z: -1.02},
  insideText: {x: 0.89, y: 41.74, z: 42.23},
};
var ctx,
  overflow = {};
const p = {inside: {fontSize: 27, s: 0, e: 450, left: 0, top: 60}};
var delta = 300;

init();

async function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  camera = new THREE.PerspectiveCamera(30, container.clientWidth / container.clientHeight, 1, 5000);
  camera.position.set(22, 36, 44);
  window.camera = camera;
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

  const ringGLTF = await new GLTFLoader().loadAsync('../assets/ring20.glb');
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

  controls.autoRotate = false;
  window.addEventListener('resize', onWindowResize, false);
  animate();
  /* --------------------------------------- */
  changeRing({
    ringColor: 'silver',
    month: 1,
    insideText: 'CONGRATULATION!',
    rightText: 'MBA',
    leftText: 'JOHN',
    neckRightText: '23',
    neckLeftText: '20',
    rightGraph: 1,
    leftGraph: 1,
  });
  /* --------------------------------------- */
}
function changeRing({
  ringColor,
  month,
  insideText,
  rightText,
  leftText,
  neckRightText,
  neckLeftText,
  rightGraph,
  leftGraph,
}) {
  content = {inside: {text: insideText}, color: ringColor};
  drawContent(content);
  changeText(rightText, 'right');
  changeText(leftText, 'left');
  changeText(neckLeftText, 'leftNeck');
  changeText(neckRightText, 'rightNeck');
  changeGraph(leftGraph, 'left');
  changeGraph(rightGraph, 'right');
  ring.core.material.map = new THREE.TextureLoader().load(`../assets/images/${month}.jpg`);
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
  var a = data[side + '_graph'];
  ring[side].position.set(a.position[0], a.position[1] + 0.3, a.position[2]);
  rotate(ring[side], a.rotation);
  ring[side].scale.set(a.scale[0], a.scale[1], a.scale[2]);
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
    case 'rightNeck':
      removeChars('neckRight');
      for (var i = 0; i < L; ++i) {
        temp = getMesh(text.charCodeAt(i), 'arial', 'regular');
        let m = temp.clone();
        var a = data['neckRight_' + L + '_' + (i + 1)];
        m.position.set(a.position[0], a.position[1], a.position[2]);
        rotate(m, a.rotation);
        m.scale.set(a.scale[0], a.scale[1], a.scale[2]);
        m.visible = true;
        m.material = ring.material;
        charPos.neckRight.push(m);
        scene.add(m);
      }
      break;
    case 'leftNeck':
      removeChars('neckLeft');
      for (var i = 0; i < L; ++i) {
        temp = getMesh(text.charCodeAt(i), 'arial', 'regular');
        let m = temp.clone();
        var a = data['neckLeft_' + L + '_' + (i + 1)];
        m.position.set(a.position[0], a.position[1], a.position[2]);
        rotate(m, a.rotation);
        m.scale.set(a.scale[0], a.scale[1], a.scale[2]);
        m.visible = true;
        m.material = ring.material;
        charPos.neckLeft.push(m);
        scene.add(m);
      }
      break;
    case 'right':
      removeChars('right');
      for (var i = 0; i < L; ++i) {
        temp = getMesh(text.charCodeAt(i), 'arial', 'bold');
        let m = temp.clone();
        let a = data['right_' + L + '_' + (i + 1)];
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
        let a = data['left_' + L + '_' + (i + 1)];
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
  var qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), e[0]);
  var qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), e[1]);
  var qz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -e[2]);
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

// CHANGE NECK LEFT TEXT
el('left_neck_text').onfocus = () => moveCamera(pos.leftNeck);
el('left_neck_text').onkeyup = () => {
  moveCamera(pos.leftNeck);
  checkInput(el('left_neck_text'));
  changeText(el('left_neck_text').value, 'leftNeck');
};

// CHANGE NECK RIGHT TEXT
el('right_neck_text').onfocus = () => moveCamera(pos.rightNeck);
el('right_neck_text').onkeyup = () => {
  moveCamera(pos.rightNeck);
  checkInput(el('right_neck_text'));
  changeText(el('right_neck_text').value, 'rightNeck');
};

// CHANGE RING COLOR
el('ring_color').onchange = () => {
  const color = el('ring_color').value;
  content.color = color;
  ring.material.map = ring.textures[`_${color}`];
  drawContent(content);
};
//CHANGE MONTH
el('monthSelect').onclick = () => moveCamera(pos.topCore);
el('monthSelect').onchange = () => {
  moveCamera(pos.topCore);
  ring.core.material.map = new THREE.TextureLoader().load(
    `../assets/images/${parseInt(el('monthSelect').value) + 1}.jpg`,
  );
};
