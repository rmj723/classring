import * as THREE from 'https://unpkg.com/three@0.121.0/build/three.module.js'
import { OrbitControls } from 'https://unpkg.com/three@0.121.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.121.0/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://unpkg.com/three@0.121.0/examples/jsm/loaders/RGBELoader.js';
import { data } from './data.js';

const container = document.getElementById('container');
var camera, scene, renderer, controls;
const chars = {};
var content = { color: null, inside: null };
var charPos = { 'neck': [], 'right': [], 'left': [], 'inside': [], };
var ring = { body: null, color: 'gold', textures: {}, core: null, };
const pos = {
    'topCore': { x: -11, y: 68, z: -23 },
    'neckText': { x: 8.58, y: 77, z: 21 },
    'insideText': { x: 0.89, y: 41.74, z: 42.23 }
};
var ctx, overflow = {};
const p = { inside: { fontSize: 24, s: 90, e: 360, left: 0, top: 26 } };
var delta = 300


init();

async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    camera = new THREE.PerspectiveCamera(30, container.clientWidth / container.clientHeight, 1, 5000);
    camera.position.set(-26, 44, 60); window['camera'] = camera;
    scene.add(camera);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 4, 0);
    controls.zoomSpeed = 0.01;
    controls.minDistance = 70
    controls.maxDistance = 100;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.enableKeys = false;
    controls.autoRotate = true;
    scene.add(new THREE.AmbientLight(0xffffff, 1));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 1));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 100)
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 200);
    camera.add(pointLight);
    ['gold', 'silver', 'rose'].forEach(async color => {
        ring.textures[`${color}`] = await loadImage(`../assets/images/${color}.jpg`);
        ring.textures[`_${color}`] = await new THREE.TextureLoader().loadAsync(`../assets/images/${color}.jpg`);
    });
    const envTexture = await new RGBELoader().setDataType(THREE.UnsignedByteType).loadAsync('../assets/env/venice_sunset_1k.hdr')
    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    scene.environment = pmremGenerator.fromEquirectangular(envTexture).texture;
    envTexture.dispose();
    pmremGenerator.dispose();

    const ringGLTF = await new GLTFLoader().loadAsync('../assets/ring18.glb')
    scene.add(ringGLTF.scene)
    ringGLTF.scene.traverse(child => {
        if (!child.isMesh) return
        if (child.name.includes('body')) ring.body = child;
        if (child.name.includes('core')) ring.core = child;
    });
    const charsGLTF = await new GLTFLoader().loadAsync('../assets/chars.glb')
    charsGLTF.scene.traverse(child => {
        if (!child.isMesh) return;
        let str = child.name.split('_');
        if (!chars[str[0]]) chars[str[0]] = {};
        if (!chars[str[0]][str[1]]) chars[str[0]][str[1]] = {};
        chars[str[0]][str[1]][str[2]] = child;
    });
    window.addEventListener('resize', onWindowResize, false);
    animate();
    controls.autoRotate = false;

    /* ********************************************** */
    setValues({
        ringColor: 'gold',
        month: 1,
        insideText: 'CONGRATULATION!',
        neckText: 'WESTERNHIGHSCHOOL'
    });
    /* ********************************************** */
}

function setValues({ ringColor, insideText, neckText, month }) {
    content = { inside: { text: insideText }, color: ringColor };
    drawContent(content);
    changeText(neckText, 'neck');
    ring.core.material.map = new THREE.TextureLoader().load(`../assets/images/${month}.jpg`);
    ring.color = ringColor;
}

function loadImage(url) {
    return new Promise(resolve => {
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
        duration: 0.8, x: camPos.x, y: camPos.y, z: camPos.z,
        onUpdate: function () { controls.update(); },
    });
}
function getMesh(code, fontName, fontType) {
    return code === 32 ? new THREE.Mesh() : chars[fontName][fontType][code];
}
function removeChars(side) {
    charPos[side].forEach((v) => { scene.remove(v); v.geometry.dispose(); });
    charPos[side] = [];
}
function changeText(text, side) {
    const L = text.length;
    var temp;
    switch (side) {
        case 'neck':
            removeChars('neck');
            for (var i = 0; i < L; ++i) {
                temp = getMesh(text.charCodeAt(i), 'cambria', 'bold');
                let m = temp.clone();
                var a = data['neck_' + L + '_' + (i + 1)];
                m.position.set(a.position[0], a.position[1], a.position[2]);
                rotate(m, a.rotation);
                m.scale.set(-a.scale[0], a.scale[1], -a.scale[2]);
                m.visible = true;
                m.material = ring.body.material;
                charPos.neck.push(m);
                scene.add(m);
            }
            break;
    }
}
function rotate(mesh, e) { //euler
    var qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), e[0]);
    var qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), e[1]);
    var qz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), e[2]);
    mesh.applyQuaternion(qx);
    mesh.applyQuaternion(qz);
    mesh.applyQuaternion(qy);
}
function drawContent(content) {
    var img = ring.textures[`${content.color}`];
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height
    ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ['inside'].forEach(side => {
        drawText(content[side].text, p[side], side);
    })
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.anisotropy = 16;

    setTimeout(() => {
        ring.body.material.map = texture;

        texture.dispose();
        delta = 0;
        document.getElementById("loader").style.display = "none"
    }, delta);
}
function drawText(text, info, key) {
    ctx.font = `bold ${info.fontSize}px century`;
    ctx.fillStyle = "black";

    var w = ctx.measureText(text).width;
    var left;

    if (w < info.e) {

        if (key === 'inside')

            left = (info.s + info.e) / 2 - w / 2;
        else if (key.includes('left'))

            left = info.e - w;
        else if (key.includes('right'))

            left = info.s;
        else if (key.includes('top'))

            left = (info.s + info.e) / 2 - w / 2;

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


//CHANGE COLOR OF CORE JEWELRY
document.getElementById('colorSelect').onclick = function () {
    moveCamera(pos.topCore);
}
document.getElementById('colorSelect').onchange = function () {
    moveCamera(pos.topCore);
    ring.core.material.map = new THREE.TextureLoader().load(`../assets/images/${parseInt(this.value) + 1}.jpg`);
}

// CHANGE INSIDE TEXT
document.getElementById('inside_text').onfocus = function () {
    moveCamera(pos.insideText);
}
document.getElementById('inside_text').onkeyup = function () {
    moveCamera(pos.insideText);
    this.value = this.value.toUpperCase();
    content.inside.text = this.value;
    drawContent(content);
}

//CHANGE Neck TEXT 
document.getElementById('neck_text').onfocus = function () {
    moveCamera(pos.neckText);
}
document.getElementById('neck_text').onkeyup = function () {
    moveCamera(pos.neckText);
    var str = this.value.replace(/[^ -~]+/g, "");
    str = str.toUpperCase();
    str = str.replace(/[`{}_\[\]\\|^]/g, '');
    this.value = str;
    changeText(str, 'neck');
}

// CHANGE RING COLOR
document.getElementById('ring_color').onchange = function () {
    content.color = this.value;
    drawContent(content);
}
