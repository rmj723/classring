import * as THREE from "https://unpkg.com/three@0.124.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.124.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.124.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://unpkg.com/three@0.124.0/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "https://unpkg.com/three@0.124.0/examples/jsm/loaders/RGBELoader.js";
import { neckCurveData, leftCurveData, rightCurveData } from "./data.js";

const el = (eleName) => document.getElementById(`${eleName}`);
const container = el("container");
var camera, scene, renderer, controls;
const chars = {};
var graphs = [];
var content = { color: null, inside: null };
var charPos = {
  neck: [],
  right: [],
  left: [],
  inside: [],
  right_top: [],
  left_top: [],
};
var ring = {
  body: null,
  material: null,
  textures: {},
  core: null,
  left: null,
  right: null,
};
const pos = {
  left: { x: -70, y: 26, z: -30 },
  right: { x: 80, y: 0, z: 0 },
  rightText: { x: 65.8, y: 45.3, z: 2.48 },
  leftText: { x: -66.73, y: 44.96, z: -1.02 },
  topCore: { x: -11, y: 68, z: -23 },
  neckText: { x: 8.58, y: 77, z: 21 },
  insideText: { x: 0.89, y: 41.74, z: 42.23 },
};
var ctx,
  overflow = {};
const p = { inside: { fontSize: 34, s: -20, e: 480, left: 0, top: 58 } };
var delta = 300;

init();

async function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  camera = new THREE.PerspectiveCamera(
    27,
    container.clientWidth / container.clientHeight,
    1,
    5000
  );
  camera.position.set(-26, 44, 60);
  window["camera"] = camera;
  scene.add(camera);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 4, 0);
  controls.zoomSpeed = 0.01;
  controls.minDistance = 70;
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

  const dracoLoader = new DRACOLoader();

  dracoLoader.setDecoderPath(
    "https://unpkg.com/three@0.124.0/examples/js/libs/draco/"
  );
  dracoLoader.setDecoderConfig({ type: "js" });
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const ringGLTF = await loader.loadAsync("../assets/ring49.glb");
  scene.add(ringGLTF.scene);
  ringGLTF.scene.traverse((child) => {
    if (!child.isMesh) return;
    if (child.name.includes("body")) ring.body = child;
    if (child.name.includes("core")) ring.core = child;
    if (child.name.includes("Cube")) ring.material = child.material;
  });
  const charsGLTF = await loader.loadAsync("../assets/chars-transformed.glb");
  charsGLTF.scene.traverse((child) => {
    if (!child.isMesh) return;
    let str = child.name.split("_");
    if (!chars[str[0]]) chars[str[0]] = {};
    if (!chars[str[0]][str[1]]) chars[str[0]][str[1]] = {};
    chars[str[0]][str[1]][str[2]] = child;
  });
  const graphsGLTF = await loader.loadAsync("../assets/graphs-transformed.glb");
  graphsGLTF.scene.traverse((child) => {
    let str = child.name.split("_");
    graphs[parseInt(str[1]) - 1] = child;
  });

  controls.autoRotate = false;
  window.addEventListener("resize", onWindowResize, false);
  animate();

  /* ********************************************** */
  changeRing({
    ringColor: "gold",
    month: 1,
    insideText: "WAY TO GO!",
    neckText: "WESTERN HIGH SCHOOL",
    rightText: "2025",
    leftText: "LISA",
    rightGraph: 1,
    leftGraph: 1,
  });
  /* ********************************************** */
}

function changeRing({
  ringColor,
  insideText,
  neckText,
  month,
  rightText,
  leftText,
  rightGraph,
  leftGraph,
}) {
  content = { inside: { text: insideText }, color: ringColor };
  drawContent(content);
  changeText(neckText, "neck");
  changeText(rightText, "right");
  changeText(leftText, "left");
  changeGraph(leftGraph, "left");
  changeGraph(rightGraph, "right");
  ring.core.material.map = new THREE.TextureLoader().load(
    `../assets/images/${month}.jpg`
  );
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
function changeGraph(index, side) {
  if (ring[side] !== null) {
    ring[side].geometry.dispose();
    scene.remove(ring[side]);
    ring[side] = null;
  }
  ring[side] = graphs[index - 1].clone();
  ring[side].material = ring.material;
  const x = 10;
  ring[side].position.set(side === "left" ? -x : x, 4, 0.07);
  ring[side].rotation.y = side === "left" ? Math.PI : 0;
  ring[side].scale.multiplyScalar(0.7);
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

class TextCurve {
  constructor(curve_pts_data, count) {
    this.pts = [];
    this.step = 1 / (count - 1);
    for (let key in curve_pts_data) {
      this.pts.push(
        new THREE.Vector3(
          curve_pts_data[key][0],
          curve_pts_data[key][1] - 0.1,
          curve_pts_data[key][2]
        )
      );
    }
    this.curve = new THREE.CatmullRomCurve3(this.pts, false);
  }

  generatePose(m, index, angle = -Math.PI / 2.5) {
    const axis = new THREE.Vector3(1, 0, 0);
    const position = this.curve.getPoint(this.step * index);
    const tangent = this.curve.getTangent(this.step * index);
    m.position.copy(position);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tangent);
    const rotQ = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    m.quaternion.multiply(rotQ);
  }

  showCurve() {
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(
      this.curve.getPoints(100)
    );
    const curveMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const curveMesh = new THREE.Line(curveGeometry, curveMaterial);
    scene.add(curveMesh);
  }
}

function changeText(t, side) {
  let text = t;
  const L = text.length;
  var temp;
  switch (side) {
    case "neck":
      removeChars("neck");
      if (text.length < 12) text = " " + text + " ";
      const tc = new TextCurve(neckCurveData, text.length);

      for (var i = 0; i < text.length; ++i) {
        temp = getMesh(text.charCodeAt(i), "cambria", "bold");
        let m = temp.clone();
        m.visible = true;
        m.material = ring.material;
        charPos.neck.push(m);
        tc.generatePose(m, i, -1);
        m.scale.set(1, 0.3, 1.2);
        if (text.length > 20) m.scale.x = 0.9;
        // tc.showCurve();
        scene.add(m);
      }

      break;
    case "right":
      removeChars("right");
      text = " " + text + " ";
      const rightCurve = new TextCurve(rightCurveData, text.length);

      for (var i = 0; i < text.length; ++i) {
        temp = getMesh(text.charCodeAt(i), "arial", "bold");
        let m = temp.clone();

        rightCurve.generatePose(m, i, 0.8);
        m.scale.set(0.8, 1, 1.2);
        if (text.length > 7) m.scale.x = 0.6;

        m.visible = true;
        m.material = ring.material;
        charPos.right.push(m);
        scene.add(m);
      }
      break;
    case "left":
      removeChars("left");
      text = " " + text + " ";
      const leftCurve = new TextCurve(leftCurveData, text.length);

      for (var i = 0; i < text.length; ++i) {
        temp = getMesh(text.charCodeAt(i), "arial", "bold");

        let m = temp.clone();
        leftCurve.generatePose(m, i, 0.8);
        m.scale.set(0.8, 1, 1.2);
        if (text.length > 7) m.scale.x = 0.6;
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
  ["inside"].forEach((side) => {
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

function checkInput(id) {
  const start = el(id).selectionStart;
  const end = el(id).selectionEnd;
  let str = el(id).value.replace(/[^ -~]+/g, "");
  str = str.toUpperCase();
  str = str.replace(/[`{}_\[\]\\|^]/g, "");
  el(id).value = str;
  el(id).setSelectionRange(start, end);
}

// CHANGE INSIDE TEXT
el("inside_text").onfocus = () => moveCamera(pos.insideText);
el("inside_text").onkeyup = () => {
  moveCamera(pos.insideText);
  checkInput("inside_text");
  content.inside.text = el("inside_text").value;
  drawContent(content);
};

//CHANGE Neck TEXT
el("neck_text").onfocus = () => moveCamera(pos.neckText);
el("neck_text").onkeyup = () => {
  moveCamera(pos.neckText);
  checkInput("neck_text");
  changeText(el("neck_text").value, "neck");
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

//CHANGE RIGHT GRAPH
el("right_graph").onclick = () => moveCamera(pos.right);
el("right_graph").onchange = () => {
  moveCamera(pos.right);
  changeGraph(el("right_graph").value, "right");
};

//CHANGE LEFT GRAPH
el("left_graph").onclick = () => moveCamera(pos.left);
el("left_graph").onchange = () => {
  moveCamera(pos.left);
  changeGraph(el("left_graph").value, "left");
};

// CHANGE RIGHT TEXT
el("right_text").onfocus = () => moveCamera(pos.rightText);
el("right_text").onkeyup = () => {
  moveCamera(pos.rightText);
  checkInput("right_text");
  changeText(el("right_text").value, "right");
};

// CHANGE LEFT TEXT
el("left_text").onfocus = () => moveCamera(pos.leftText);
el("left_text").onkeyup = () => {
  moveCamera(pos.leftText);
  checkInput("left_text");
  changeText(el("left_text").value, "left");
};
