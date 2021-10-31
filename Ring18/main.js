import * as THREE from 'https://unpkg.com/three@0.121.0/build/three.module.js'
import { OrbitControls } from 'https://unpkg.com/three@0.121.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.121.0/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://unpkg.com/three@0.121.0/examples/jsm/loaders/RGBELoader.js';
import { data } from './data.js';

var camera, scene, renderer, controls, envMap;
const container = document.getElementById('container');

// LOADING ICON
const load_icon = document.getElementById("loader");
const loadIconHide = (ele) => { ele.style.display = 'none'; }

/* Alphabeta & Graph Side Meshes TO BE LOADED */
const chars = {
    cambria: { bold: {} },
    arial: { bold: {}, regular: {} }
};
var content = {};

/* Clone Letters To Be Removed */
var charPos = { 'neck': [], 'right': [], 'left': [], 'inside': [], };

var ring = {
    body: [],
    color: 'gold',
    textures: { 'gold': null, 'rose': null, 'silver': null },
    core: null, //CORE JEWELRY
};

/* Camera Poisitions For Different Look */
const pos = {
    'left': { x: -70, y: 26, z: -30 },
    'right': { x: 80, y: 0, z: 0 },
    'topCore': { x: -11, y: 68, z: -23 },
    'neckText': { x: -20, y: 66.8, z: -38 },
    'insideText': { x: 0.89, y: 41.74, z: 42.23 }
};

init();
animate();


//INITIALIZATION OF THREE.JS
function init() {
    buildScene();
    buildCamera();
    buildRenderer();
    buildControls();
    buildLight();

    var myPromises = [];

    for (var i = 1; i <= 12; ++i) {

        const id = i;
        myPromises.push(
            new Promise(
                resolve => { new THREE.TextureLoader().load(`../assets/images/${id}.jpg`, resolve) }
            ).then(result => { ring.textures[`${id}`] = result })
        );
    }

    ['gold', 'rose', 'silver'].forEach(color => {
        myPromises.push(
            loadImage(`../assets/images/${color}.jpg`).then(result => { ring.textures[`${color}`] = result })
        );
    });

    myPromises.push(
        new Promise(resolve => {
            new RGBELoader().setDataType(THREE.UnsignedByteType).load('../assets/env/venice_sunset_1k.hdr', resolve)
        }).then(result => {
            var texture = result;
            var pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();
        }),
        loadModel('../assets/ring18.glb').then(result => {
            scene.add(result.scene)
            result.scene.traverse(child => {
                let str = child.name;
                if (child.isMesh) {
                    if (str.includes('body')) {
                        ring.body.push(child);
                    }
                    if (str.includes('core')) {
                        ring.core = child;
                    }
                }
            });
        }),
        loadModel('../assets/chars.glb').then(result => {
            result.scene.traverse(child => {
                if (child.isMesh) {
                    let str = child.name.split('_');
                    chars[str[0]][str[1]][str[2]] = child;
                }
            });
        }),
    )

    Promise.all(myPromises).then(() => {

        content = {
            inside: { text: 'CONGRATULATION!' },
            color: 'gold'
        }
        loadIconHide(load_icon);
        drawContent(content);
        changeText('WESTERNHIGHSCHOOL', 'neck');
        controls.autoRotate = false;
    });

    window.addEventListener('resize', onWindowResize, false);
}

function loadModel(url) {
    return new Promise(resolve => {
        new GLTFLoader().load(url, resolve);
    });
}
function loadImage(url) {
    return new Promise(resolve => {
        const image = new Image();
        image.addEventListener('load', () => {
            resolve(image);
        });
        image.src = url;
    });
}

function buildScene() {
    scene = new THREE.Scene();
    const axisLength = 30;
    // scene.add(new THREE.AxesHelper(axisLength));
    scene.background = new THREE.Color(0xffffff);
}

function buildCamera() {
    camera = new THREE.PerspectiveCamera(30, container.clientWidth / container.clientHeight, 1, 5000);
    camera.position.set(-26, 44, 60);
    scene.add(camera);
}

//BUILD CONTROLS
function buildControls() {
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
}

//BUILD RENDERER
function buildRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    const DPR = window.devicePixelRatio ? window.devicePixelRatio : 1;
    // renderer.setPixelRatio(isMobile() ? 0.7 : DPR);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
}


// CREATE LIGHTS
function buildLight() {
    scene.add(new THREE.AmbientLight(0xffffff, 1));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 1));

    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 100)
    scene.add(directionalLight);

    var pointLight = new THREE.PointLight(0xffffff, 1, 200);
    camera.add(pointLight);
}

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    render();
    controls.update();
}

function render() {
    renderer.render(scene, camera);
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


// RETURN LETTER MESH
function getMesh(code, fontName, fontType) {
    var mesh;
    if (code === 32) {
        mesh = new THREE.Mesh();
    } else {
        mesh = chars[fontName][fontType][code];
    }
    return mesh;
}

function removeChars(side) {
    charPos[side].forEach((v) => { scene.remove(v); v.material.dispose(); v.geometry.dispose(); });
    charPos[side] = [];
}

//CHANGE LETTERS OF EACH AREA
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
                m.material = ring.body[0].material;
                charPos.neck.push(m);
                scene.add(m);
            }
            break;
    }
}

/* Rotate Mesh By Euler From Blender */
function rotate(mesh, e) { //euler
    var qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), e[0]);
    var qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), e[1]);
    var qz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), e[2]);
    mesh.applyQuaternion(qx);
    mesh.applyQuaternion(qz);
    mesh.applyQuaternion(qy);
}
function checkInput(str) {
    var str = str.replace(/[^ -~]+/g, "");
    str = str.replace(/[`{}_\[\]\\|^]/g, '');
    var temp = str.charAt(0).toUpperCase();
    for (var i = 1; i < str.length; i++) {
        if (str.charAt(i - 1) == ' ') {
            temp += str.charAt(i).toUpperCase();
        } else {
            temp += str.charAt(i).toLowerCase();
        }
    }
    return temp;
}
function rd(radians) {
    var pi = Math.PI;
    return radians * (180 / pi);
}



//CHANGE COLOR OF CORE JEWELRY
document.getElementById('colorSelect').onclick = function () {
    moveCamera(pos.topCore);
}
document.getElementById('colorSelect').onchange = function () {
    moveCamera(pos.topCore);
    ring.core.material.map = ring.textures[(parseInt(this.value) + 1) + ''];
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
    // this.value = str;
    changeText(str, 'neck');
}



// CHANGE RING COLOR
document.getElementById('ring_color').onchange = function () {
    content.color = this.value;
    drawContent(content);
}


var ctx;
var overflow = {};
const p = {
    inside: { fontSize: 24, s: 90, e: 360, left: 0, top: 26 },
};

var delta = 300
function drawContent(content) {
    var img = ring.textures[content.color];
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
        ring.body[0].material.map = texture;
        texture.dispose();
        delta = 0;
        loadIconHide(load_icon);

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