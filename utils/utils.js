import * as THREE from "https://unpkg.com/three@0.124.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.124.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.124.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://unpkg.com/three@0.124.0/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "https://unpkg.com/three@0.124.0/examples/jsm/loaders/RGBELoader.js";

export async function initScene(
  container,
  ringNumber,
  { ring, chars, graphs, fonts }
) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  const camera = new THREE.PerspectiveCamera(
    27,
    container.clientWidth / container.clientHeight,
    1,
    5000
  );
  camera.position.set(-26, 44, 60);
  window["camera"] = camera;
  scene.add(camera);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  const controls = new OrbitControls(camera, renderer.domElement);
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

  if (fonts) {
    ["Milky", "Helvetiker"].forEach(async (fontName) => {
      fonts[fontName] = await new THREE.FontLoader().loadAsync(
        `../assets/fonts/${fontName}.json`
      );
    });
    console.log("fonts loaded");
  }

  const dracoLoader = new DRACOLoader();

  dracoLoader.setDecoderPath(
    "https://unpkg.com/three@0.124.0/examples/js/libs/draco/"
  );
  dracoLoader.setDecoderConfig({ type: "js" });
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const ringGLTF = await loader.loadAsync(`../assets/ring${ringNumber}.glb`);
  scene.add(ringGLTF.scene);
  ringGLTF.scene.traverse((child) => {
    if (!child.isMesh) return;
    if (child.name.includes("body")) ring.body = child;
    if (child.name.includes("core")) ring.core = child;
    if (child.name.includes("Cube")) ring.material = child.material;
  });
  console.log("ring loaded", ringNumber);

  if (chars) {
    const charsGLTF = await loader.loadAsync("../assets/chars-transformed.glb");
    charsGLTF.scene.traverse((child) => {
      if (!child.isMesh) return;
      let str = child.name.split("_");
      if (!chars[str[0]]) chars[str[0]] = {};
      if (!chars[str[0]][str[1]]) chars[str[0]][str[1]] = {};
      chars[str[0]][str[1]][str[2]] = child;
    });
    console.log("chars loaded");
  }

  if (graphs) {
    const graphsGLTF = await loader.loadAsync(
      "../assets/graphs-transformed.glb"
    );
    graphsGLTF.scene.traverse((child) => {
      let str = child.name.split("_");
      graphs[parseInt(str[1]) - 1] = child;
    });
    console.log("graphs loaded");
  }

  controls.autoRotate = false;

  return {
    scene,
    camera,
    renderer,
    controls,
  };
}

export function rotate(mesh, e) {
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

export function loadImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.src = url;
  });
}

export function getCharMesh(c, fonts) {
  const geo = new THREE.TextGeometry(c, {
    font: c === "0" ? fonts.Helvetiker : fonts.Milky,
    size: c === "0" ? 2.15 : 2.3,
    height: 0.6,
    curveSegments: 2,
    bevelEnabled: false,
  });
  geo.center();
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
}

export class TextCurve {
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

  showCurve(scene) {
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(
      this.curve.getPoints(100)
    );
    const curveMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const curveMesh = new THREE.Line(curveGeometry, curveMaterial);
    scene.add(curveMesh);
  }
}
