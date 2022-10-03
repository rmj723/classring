import * as THREE from "https://unpkg.com/three@0.121.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.121.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.121.0/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://unpkg.com/three@0.121.0/examples/jsm/loaders/RGBELoader.js";

const el = (eleName) => document.getElementById(`${eleName}`);
const container = el("container");
var camera, scene, renderer, controls;
const chars = {};
var content = {
  color: null,
  inside: null,
  left: null,
  right: null,
  top1: null,
  top2: null,
};

var ring = {
  material: null,
  body: null,
  textures: {},
  core: null,
};
const pos = {
  topCore: { x: -18.2, y: 76, z: 24.8 },
  neckText: { x: -13.58, y: 62.62, z: -46.44 },
  rightText: { x: 47.325, y: 49.59, z: 39.47 },
  leftText: { x: -47.19, y: 60.33, z: 21.82 },
  topText: { x: -10.6, y: 87.5, z: 11.3 },
  insideText: { x: -0.805, y: 50, z: 60.59 },
};
var ctx,
  overflow = {};
const p = {
  inside: { fontSize: 18, s: 0, e: 280, left: 0, top: 36 },
  left: { fontSize: 30, s: 0, e: 250, top: 110 },
  right: { fontSize: 30, s: 10, e: 250, top: 190 },
  top1: { fontSize: 18, s: 220, e: 500, top: 22 },
  top2: { fontSize: 18, s: 220, e: 500, top: 48 },
};
var delta = 300;

init();

async function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  camera = new THREE.PerspectiveCamera(
    25,
    container.clientWidth / container.clientHeight,
    1,
    5000
  );
  camera.position.set(22, 36, 44);
  window.camera = camera;
  scene.add(camera);
  renderer = new THREE.WebGLRenderer({ antialias: true });
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
  ["gold", "silver", "rose"].forEach(async (color) => {
    ring.textures[`${color}`] = await loadImage(
      `../assets/images/${color}.jpg`
    );
    ring.textures[`_${color}`] = await new THREE.TextureLoader().loadAsync(
      `../assets/images/${color}.jpg`
    );
  });
  const envTexture = await new RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    .loadAsync("../assets/env/venice_sunset_1k.hdr");
  var pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  scene.environment = pmremGenerator.fromEquirectangular(envTexture).texture;
  envTexture.dispose();
  pmremGenerator.dispose();

  const ringGLTF = await new GLTFLoader().loadAsync("../assets/ring27.glb");
  scene.add(ringGLTF.scene);
  ringGLTF.scene.traverse((child) => {
    if (!child.isMesh) return;
    if (child.name.includes("body")) ring.body = child;
    if (child.name.includes("core")) ring.core = child;
    if (child.name.includes("Cube")) ring.material = child.material;
  });
  controls.autoRotate = false;
  window.addEventListener("resize", onWindowResize, false);
  animate();
  /* -------------------------------------------------- */
  changeRing({
    ringColor: "gold",
    insideText: "CONGRATULATIONS",
    rightText: "BRIAN",
    leftText: "2025",
    topText1: "WESTERN",
    topText2: "UNIVERSITY",
  });
  /* -------------------------------------------------- */
}
function changeRing({
  ringColor,
  insideText,
  rightText,
  leftText,
  topText1,
  topText2,
}) {
  content = {
    inside: { text: insideText },
    left: { text: leftText },
    right: { text: rightText },
    top1: { text: topText1 },
    top2: { text: topText2 },
    color: ringColor,
  };
  drawContent(content);
  ring.material.map = ring.textures[`_${ringColor}`];
}
function loadImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
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

function drawContent(content) {
  var img = ring.textures[`${content.color}`];
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  ["inside", "left", "right", "top1", "top2"].forEach((side) => {
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
    document.getElementById("loader").style.display = "none";
  }, delta);
}
function drawText(text, info, key) {
  ctx.font = `bold ${info.fontSize}px century`;
  ctx.fillStyle = "black";
  var w = ctx.measureText(text).width;
  var left;
  if (w < info.e) {
    if (key === "inside") left = (info.s + info.e) / 2 - w / 2;
    else if (key.includes("left")) left = info.e - w;
    else if (key.includes("right")) left = info.s;
    else if (key.includes("top")) left = (info.s + info.e) / 2 - w / 2;
    const top = info.top;
    ctx.fillText(text, left, top);
    if (!overflow[key]) overflow[key] = {};
    overflow[key]["text"] = text; /* Save Last Value */
    overflow[key]["left"] = left;
    overflow[key]["top"] = top;
  } else {
    ctx.fillText(overflow[key].text, overflow[key].left, overflow[key].top);
  }
}

function checkInput(element) {
  let str = element.value.replace(/[^ -~]+/g, "");
  str = str.toUpperCase();
  str = str.replace(/[`{}_\[\]\\|^]/g, "");
  element.value = str;
}

// CHANGE TOP TEXT 1
el("top_text1").onfocus = () => moveCamera(pos.topText);
el("top_text1").onkeyup = () => {
  moveCamera(pos.topText);
  checkInput(el("top_text1"));
  content.top1.text = el("top_text1").value;
  drawContent(content);
};

// CHANGE TOP TEXT 2
el("top_text2").onfocus = () => moveCamera(pos.topText);
el("top_text2").onkeyup = () => {
  moveCamera(pos.topText);
  checkInput(el("top_text2"));
  content.top2.text = el("top_text2").value;
  drawContent(content);
};

// CHANGE RIGHT TEXT
el("right_text").onfocus = () => moveCamera(pos.rightText);
el("right_text").onkeyup = () => {
  moveCamera(pos.rightText);
  checkInput(el("right_text"));
  content.right.text = el("right_text").value;
  drawContent(content);
};

// CHANGE LEFT TEXT
el("left_text").onfocus = () => moveCamera(pos.leftText);
el("left_text").onkeyup = () => {
  moveCamera(pos.leftText);
  checkInput(el("left_text"));
  content.left.text = el("left_text").value;
  drawContent(content);
};

// CHANGE INSIDE TEXT
el("inside_text").onfocus = () => moveCamera(pos.insideText);
el("inside_text").onkeyup = () => {
  moveCamera(pos.insideText);
  checkInput(el("inside_text"));
  content.inside.text = el("inside_text").value;
  drawContent(content);
};

// CHANGE RING COLOR
el("ring_color").onchange = () => {
  const color = el("ring_color").value;
  content.color = color;
  ring.material.map = ring.textures[`_${color}`];
  drawContent(content);
};
