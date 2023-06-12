import * as THREE from "https://unpkg.com/three@0.124.0/build/three.module.js";
import { TextCurve, initScene } from "../utils/utils.js";
import { neckCurveData, leftCurveData, rightCurveData } from "./data.js";

const el = (eleName) => document.getElementById(`${eleName}`);
const container = el("container");
var camera, scene, renderer, controls;
const chars = {};
var graphs = [];
var content = { color: null, inside: null };
var charPos = {};
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
  overflow = {},
  fonts = {};
const p = { inside: { fontSize: 34, s: -20, e: 480, left: 0, top: 48 } };
var delta = 300;

init();

async function init() {
  const settings = await initScene(container, 40, {
    ring,
    graphs,
    chars,
    fonts,
  });
  scene = settings.scene;
  camera = settings.camera;
  renderer = settings.renderer;
  controls = settings.controls;

  window.addEventListener("resize", onWindowResize, false);
  animate();

  /* ********************************************** */
  changeRing({
    ringColor: "gold",
    month: 1,
    insideText: "LOVE, MOM & DAD",
    neckText: "WESTERN HIGH SCHOOL",
    rightText: "2027",
    leftText: "EMILY",
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
  const x = 9.3;
  ring[side].position.set(side === "left" ? -x : x, 5, 0.07);
  ring[side].rotation.y = side === "left" ? Math.PI : 0;
  ring[side].rotation.z = 0.2;
  ring[side].scale.multiplyScalar(0.6);
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

function changeText(t, side) {
  let text = t;
  const L = text.length;
  var temp;

  if (!charPos[side]) charPos[side] = [];
  removeChars(side);

  switch (side) {
    case "neck":
      if (text.length < 12) text = " " + text + " ";
      const tc = new TextCurve(neckCurveData, text.length);

      for (var i = 0; i < text.length; ++i) {
        temp = getMesh(text.charCodeAt(i), "cambria", "bold");
        let m = temp.clone();
        m.visible = true;
        m.material = ring.material;
        charPos.neck.push(m);
        tc.generatePose(m, i, -1.2);
        m.scale.set(1.1, 0.4, 1.25);
        if (text.length > 20) m.scale.x = 0.9;
        // tc.showCurve();
        scene.add(m);
      }

      break;
    case "right":
    case "left":
      text = " " + text + " ";
      const curveData = side === "right" ? rightCurveData : leftCurveData;
      const sideCurve = new TextCurve(curveData, text.length);

      for (var i = 0; i < text.length; ++i) {
        temp = getMesh(text.charCodeAt(i), "arial", "bold");
        let m = temp.clone();

        sideCurve.generatePose(m, i, 0.8);
        m.scale.set(0.8, 0.6, 1.15);
        m.scale.x = 1.28 - 0.1 * text.length;

        m.visible = true;
        m.material = ring.material;
        charPos[side].push(m);
        scene.add(m);
      }
      break;
  }
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
