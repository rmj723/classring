import * as THREE from "https://unpkg.com/three@0.124.0/build/three.module.js";
import { TextCurve, initScene } from "../utils/utils.js";

const el = (eleName) => document.getElementById(`${eleName}`);
const container = el("container");
var camera, scene, renderer, controls;
const chars = {};
var graphs = [];
var content = { color: null, inside: null, left: null, right: null };
var charPos = { neck: [], right: [], left: [], inside: [] };
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
var ctx;
const overflow = {};
const r = 10; // resolution
const p = {
  inside: { fontSize: 30 * r, s: 0, e: 450 * r, left: 0, top: 36 * r },
  left: { fontSize: 34 * r, s: 30 * r, e: 220 * r, top: 88 * r },
  right: { fontSize: 34 * r, s: 10 * r, e: 220 * r, top: 135 * r },
};
var delta = 300;

init();

async function init() {
  const settings = await initScene(container, 64, {
    ring,
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
    insideText: "WESTERN HIGH SCHOOL",
    rightText: "SOPHIA",
    leftText: "2023",
  });
  /* ********************************************** */
}

function changeRing({ ringColor, insideText, month, rightText, leftText }) {
  content = {
    inside: { text: insideText },
    left: { text: leftText },
    right: { text: rightText },
    color: ringColor,
  };

  drawContent(content);

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
// function changeGraph(index, side) {
//   if (ring[side] !== null) {
//     ring[side].geometry.dispose();
//     scene.remove(ring[side]);
//     ring[side] = null;
//   }
//   ring[side] = graphs[index - 1].clone();
//   ring[side].material = ring.material;
//   var a = data[side + "_graph"];
//   ring[side].position.set(a.position[0], a.position[1], a.position[2]);
//   rotate(ring[side], a.rotation);
//   ring[side].scale.set(a.scale[0], a.scale[1], a.scale[2]);
//   ring[side].visible = true;
//   scene.add(ring[side]);
// }
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
    case "neck":
      removeChars("neck");
      for (var i = 0; i < L; ++i) {
        temp = getMesh(text.charCodeAt(i), "cambria", "bold");
        let m = temp.clone();
        var a = data["neck_" + L + "_" + (i + 1)];
        m.position.set(a.position[0], a.position[1], a.position[2]);
        rotate(m, a.rotation);
        m.scale.set(a.scale[0] + 0.2, a.scale[1] - 0.2, a.scale[2]);
        m.visible = true;
        m.material = ring.material;
        charPos.neck.push(m);
        scene.add(m);
      }
      break;
    // case "right":
    //   removeChars("right");
    //   for (var i = 0; i < L; ++i) {
    //     temp = getMesh(text.charCodeAt(i), "arial", "bold");
    //     let m = temp.clone();
    //     let a = data["right_" + L + "_" + (i + 1)];
    //     m.position.set(a.position[0], a.position[1], a.position[2]);
    //     rotate(m, a.rotation);
    //     m.scale.set(a.scale[0], 1.2, a.scale[2]);
    //     m.visible = true;
    //     m.material = ring.material;
    //     charPos.right.push(m);
    //     scene.add(m);
    //   }
    //   break;
    // case "left":
    //   removeChars("left");
    //   for (var i = 0; i < L; ++i) {
    //     temp = getMesh(text.charCodeAt(i), "arial", "bold");
    //     let m = temp.clone();
    //     let a = data["left_" + L + "_" + (i + 1)];
    //     m.position.set(a.position[0], a.position[1], a.position[2]);
    //     rotate(m, a.rotation);
    //     m.scale.set(a.scale[0], 1.2, a.scale[2]);
    //     m.visible = true;
    //     m.material = ring.material;
    //     charPos.left.push(m);
    //     scene.add(m);
    //   }
    //   break;
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

async function drawContent(content) {
  var img = ring.textures[`${content.color}`];
  const canvas = document.createElement("canvas");
  // document.body.appendChild(canvas);
  canvas.width = img.width * r;
  canvas.height = img.height * r;
  ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, img.width * r, img.height * r);
  ["inside", "left", "right"].forEach((side) => {
    drawText(content[side].text, p[side], side);
  });

  /* Image Graph */
  // const lefgImg = await loadImage(
  //   `../assets/images/graphs/${content.leftGraph}.png`
  // );
  // const rightImg = await loadImage(
  //   `../assets/images/graphs/${content.rightGraph}.png`
  // );

  // ctx.drawImage(lefgImg, 255 * r, 65 * r, 65 * r, 55 * r);
  // ctx.drawImage(rightImg, 365 * r, 65 * r, 65 * r, 55 * r);

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;

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
    // else if (key.includes("top")) left = (info.s + info.e) / 2 - w / 2;
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
// el("neck_text").onfocus = () => moveCamera(pos.neckText);
// el("neck_text").onkeyup = () => {
//   moveCamera(pos.neckText);
//   checkInput("neck_text");
//   changeText(el("neck_text").value, "neck");
// };

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
// el("right_graph").onclick = () => moveCamera(pos.right);
// el("right_graph").onchange = () => {
//   moveCamera(pos.right);
//   content.rightGraph = el("right_graph").value;
//   drawContent(content);
// };

//CHANGE LEFT GRAPH
// el("left_graph").onclick = () => moveCamera(pos.left);
// el("left_graph").onchange = () => {
//   moveCamera(pos.left);
//   content.leftGraph = el("left_graph").value;
//   drawContent(content);
// };

// CHANGE RIGHT TEXT
el("right_text").onfocus = () => moveCamera(pos.rightText);
el("right_text").onkeyup = () => {
  moveCamera(pos.rightText);
  checkInput("right_text");
  content.right.text = el("right_text").value;
  drawContent(content);
};

// CHANGE LEFT TEXT
el("left_text").onfocus = () => moveCamera(pos.leftText);
el("left_text").onkeyup = () => {
  moveCamera(pos.leftText);
  checkInput("left_text");
  content.left.text = el("left_text").value;
  drawContent(content);
};
