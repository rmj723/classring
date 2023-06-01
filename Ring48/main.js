import * as THREE from "https://unpkg.com/three@0.124.0/build/three.module.js";
import { TextCurve, getCharMesh, rotate, initScene } from "../utils/utils.js";
import {
  neck1CurveData,
  neck2CurveData,
  leftCurveData,
  rightCurveData,
  top1Data,
  top2Data,
} from "./data.js";

const el = (eleName) => document.getElementById(`${eleName}`);
const container = el("container");
var camera, scene, renderer, controls;
const chars = {};
var graphs = [];
var content = { color: null, inside: null };
var charPos = {
  neck1: [],
  neck2: [],
  top1: [],
  top2: [],
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
  top: null,
};
const pos = {
  left: { x: -70, y: 26, z: -30 },
  right: { x: 80, y: 0, z: 0 },
  rightText: { x: 65.8, y: 45.3, z: 2.48 },
  leftText: { x: -66.73, y: 44.96, z: -1.02 },
  topCore: { x: -11, y: 68, z: -23 },
  insideText: { x: 0.89, y: 41.74, z: 42.23 },
  neckText1: { x: 0.89, y: 41.74, z: -42.23 },
  neckText2: { x: -44.9, y: 39.6, z: 50.55 },
  topText1: { x: -54.6, y: 46.1, z: 25.9 },
  topText2: { x: 51.6, y: 54.5, z: 23.5 },
};
var ctx,
  overflow = {},
  fonts = {};
const p = { inside: { fontSize: 34, s: -20, e: 480, left: 0, top: 50 } };
var delta = 300;
const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

init();

async function init() {
  const settings = await initScene(container, 48, {
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
    insideText: "CONGRATULATIONS!",
    topText1: "20",
    topText2: "25",
    neckText1: "REGIONAL",
    neckText2: "CHAMPIONS",
    rightText: "ROBERT",
    leftText: "42",
    rightGraph: 1,
    leftGraph: 1,
  });
  /* ********************************************** */
}

function changeRing({
  ringColor,
  insideText,
  topText1,
  topText2,
  neckText1,
  neckText2,
  month,
  rightText,
  leftText,
  rightGraph,
  leftGraph,
}) {
  content = { inside: { text: insideText }, color: ringColor };
  drawContent(content);
  changeText(topText1, "top1");
  changeText(topText2, "top2");
  changeText(neckText1, "neck1");
  changeText(neckText2, "neck2");
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
  if (side === "top") {
    ring[side].position.set(0, 14.5, 0);
    ring[side].rotation.set(0, -Math.PI / 2, 1.3);
    ring[side].scale.multiplyScalar(0.9);
  } else {
    const x = 10.7;
    ring[side].position.set(side === "left" ? -x : x, 3.8, 0.07);
    ring[side].rotation.y = side === "left" ? Math.PI : 0;
    ring[side].rotation.z = -0.1;
    ring[side].scale.multiplyScalar(0.8);
  }
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
  removeChars(side);

  switch (side) {
    case "neck1":
    case "neck2":
      if (side === "neck1" && text.length < 20) text = " " + text + " ";
      if (side === "neck2" && text.length < 3) text = " " + text + " ";
      const neckCurve = new TextCurve(
        side === "neck1" ? neck1CurveData : neck2CurveData,
        text.length
      );

      for (var i = 0; i < text.length; ++i) {
        temp = getMesh(text.charCodeAt(i), "cambria", "bold");
        let m = temp.clone();

        m.visible = true;
        m.material = ring.material;
        charPos[side].push(m);

        if (side === "neck1") {
          neckCurve.generatePose(m, i, -1);
          m.scale.set(1.4, 0.5, 1.6);
          m.scale.x = 2.18 - 0.1 * text.length;
        } else {
          neckCurve.generatePose(m, i, 0.9);
          m.scale.set(1.4, 0.5, 1.6);
          m.scale.x = 2.6 - 0.1 * text.length;
        }

        // neckCurve.showCurve();
        scene.add(m);
      }
      break;

    case "top1":
    case "top2":
      const topData = side === "top1" ? top1Data : top2Data;
      for (var i = 0; i < L; ++i) {
        temp = getMesh(text.charCodeAt(i), "cambria", "bold");
        let m = temp.clone();
        var a = topData["top_" + L + "_" + (i + 1)];
        m.position.set(a.position[0], a.position[1], a.position[2]);
        rotate(m, a.rotation);
        m.scale.set(a.scale[0] + 0.5, a.scale[1] + 0.1, a.scale[2]);
        m.visible = true;
        m.material = blackMat;
        charPos[side].push(m);
        scene.add(m);
      }
      break;

    case "right":
    case "left":
      text = " " + text + " ";
      const curveData = side === "right" ? rightCurveData : leftCurveData;
      const sideCurve = new TextCurve(curveData, text.length);

      for (var i = 0; i < text.length; ++i) {
        let m = getCharMesh(text[i], fonts);

        sideCurve.generatePose(m, i, -0.48);
        m.scale.set(0.8, 0.6, 1);
        m.scale.x = 1.57 - 0.1 * text.length;

        m.geometry.translate(0, 0, 0);
        m.scale.y = Math.abs(i - text.length / 2 + 0.5) * 0.1 + 0.9;

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

//CHANGE NECK TEXT 1
el("neck_text1").onfocus = () => moveCamera(pos.neckText1);
el("neck_text1").onkeyup = () => {
  moveCamera(pos.neckText1);
  checkInput("neck_text1");
  changeText(el("neck_text1").value, "neck1");
};

//CHANGE NECK TEXT 2
el("neck_text2").onfocus = () => moveCamera(pos.neckText2);
el("neck_text2").onkeyup = () => {
  moveCamera(pos.neckText2);
  checkInput("neck_text2");
  changeText(el("neck_text2").value, "neck2");
};

//CHANGE TOP TEXT 1
el("top_text1").onfocus = () => moveCamera(pos.topText1);
el("top_text1").onkeyup = () => {
  moveCamera(pos.topText1);
  checkInput("top_text1");
  changeText(el("top_text1").value, "top1");
};

//CHANGE TOP TEXT 2
el("top_text2").onfocus = () => moveCamera(pos.topText2);
el("top_text2").onkeyup = () => {
  moveCamera(pos.topText2);
  checkInput("top_text2");
  changeText(el("top_text2").value, "top2");
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
