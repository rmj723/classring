import * as THREE from "https://unpkg.com/three@0.121.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.121.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.121.0/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://unpkg.com/three@0.121.0/examples/jsm/loaders/RGBELoader.js";
import { data } from "./data.js";

const el = (eleName) => document.getElementById(`${eleName}`);
const container = el("container");
var camera, scene, renderer, controls;
const chars = {};
var content = {
  color: null,
  inside: null,
  left1: null,
  left2: null,
  right1: null,
  right2: null,
  top1: null,
  top2: null,
};
const charPos = { top1: [], top2: [] };
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
  inside: { fontSize: 12, s: 0, e: 200, left: 0, top: 32 },
  left1: { fontSize: 22, s: 0, e: 200, top: 85 },
  left2: { fontSize: 22, s: 0, e: 200, top: 135 },
  right1: { fontSize: 22, s: 240, e: 400, top: 35 },
  right2: { fontSize: 22, s: 10, e: 250, top: 190 },
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

  const ringGLTF = await new GLTFLoader().loadAsync("../assets/ring26.glb");
  scene.add(ringGLTF.scene);
  ringGLTF.scene.traverse((child) => {
    if (!child.isMesh) return;
    if (child.name.includes("body")) ring.body = child;
    if (child.name.includes("core")) ring.core = child;
    if (child.name.includes("Cube")) ring.material = child.material;
  });
  const charsGLTF = await new GLTFLoader().loadAsync("../assets/chars.glb");
  charsGLTF.scene.traverse((child) => {
    if (!child.isMesh) return;
    let str = child.name.split("_");
    if (!chars[str[0]]) chars[str[0]] = {};
    if (!chars[str[0]][str[1]]) chars[str[0]][str[1]] = {};
    chars[str[0]][str[1]][str[2]] = child;
  });

  controls.autoRotate = false;
  window.addEventListener("resize", onWindowResize, false);
  animate();
  /* -------------------------------------------------- */
  changeRing({
    ringColor: "gold",
    insideText: "CONGRATULATIONS",
    rightText1: "JAMES",
    rightText2: "JOHNSON",
    leftText1: "BASKETBALL",
    leftText2: "2025",
    topText1: "WESTERN",
    topText2: "UNIVERSITY",
  });
  /* -------------------------------------------------- */
}
function changeRing({
  ringColor,
  insideText,
  rightText1,
  rightText2,
  leftText1,
  leftText2,
  topText1,
  topText2,
}) {
  content = {
    inside: { text: insideText },
    left1: { text: leftText1 },
    left2: { text: leftText2 },
    right1: { text: rightText1 },
    right2: { text: rightText2 },
    color: ringColor,
  };
  drawContent(content);
  changeText(topText1, "top1");
  changeText(topText2, "top2");
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
    case "top1":
      removeChars("top1");
      for (var i = 0; i < L; ++i) {
        temp = getMesh(text.charCodeAt(i), "arial", "bold");
        let m = temp.clone();
        let a = data["top1_" + L + "_" + (i + 1)];
        m.position.set(a.position[0], a.position[1], a.position[2]);
        rotate(m, a.rotation);
        m.scale.set(a.scale[0], 1.2, a.scale[2]);
        m.visible = true;
        m.material = ring.material;
        charPos.top1.push(m);
        scene.add(m);
      }
      break;
    case "top2":
      removeChars("top2");
      for (var i = 0; i < L; ++i) {
        temp = getMesh(text.charCodeAt(i), "arial", "bold");
        let m = temp.clone();
        let a = data["top2_" + L + "_" + (i + 1)];
        m.position.set(a.position[0], a.position[1], a.position[2]);
        rotate(m, a.rotation);
        m.scale.set(a.scale[0], 1.2, a.scale[2]);
        m.visible = true;
        m.material = ring.material;
        charPos.top2.push(m);
        scene.add(m);
      }
      break;
  }
}
function rotate(mesh, e) {
  //euler
  var qx = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    e[0]
  );
  var qy = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    e[1]
  );
  var qz = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    e[2]
  );
  mesh.applyQuaternion(qx);
  mesh.applyQuaternion(qz);
  mesh.applyQuaternion(qy);
}
function drawContent(content) {
  var img = ring.textures[`${content.color}`];
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  ["inside", "left1", "left2", "right1", "right2"].forEach((side) => {
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
  changeText(el("top_text1").value, "top1");
};

// CHANGE TOP TEXT 2
el("top_text2").onfocus = () => moveCamera(pos.topText);
el("top_text2").onkeyup = () => {
  moveCamera(pos.topText);
  checkInput(el("top_text2"));
  changeText(el("top_text2").value, "top2");
};

// CHANGE RIGHT TEXT 1
el("right_text1").onfocus = () => moveCamera(pos.rightText);
el("right_text1").onkeyup = () => {
  moveCamera(pos.rightText);
  checkInput(el("right_text1"));
  content.right1.text = el("right_text1").value;
  drawContent(content);
};

// CHANGE RIGHT TEXT 2
el("right_text2").onfocus = () => moveCamera(pos.rightText);
el("right_text2").onkeyup = () => {
  moveCamera(pos.rightText);
  checkInput(el("right_text2"));
  content.right2.text = el("right_text2").value;
  drawContent(content);
};

// CHANGE LEFT TEXT 1
el("left_text1").onfocus = () => moveCamera(pos.leftText);
el("left_text1").onkeyup = () => {
  moveCamera(pos.leftText);
  checkInput(el("left_text1"));
  content.left1.text = el("left_text1").value;
  drawContent(content);
};

// CHANGE LEFT TEXT 2
el("left_text2").onfocus = () => moveCamera(pos.leftText);
el("left_text2").onkeyup = () => {
  moveCamera(pos.leftText);
  checkInput(el("left_text2"));
  content.left2.text = el("left_text2").value;
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
//CHANGE MONTH
el("monthSelect").onclick = () => moveCamera(pos.topCore);
el("monthSelect").onchange = () => {
  moveCamera(pos.topCore);
  ring.core.material.map = new THREE.TextureLoader().load(
    `../assets/images/${parseInt(el("monthSelect").value) + 1}.jpg`
  );
};
