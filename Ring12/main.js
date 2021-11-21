import * as THREE from 'https://unpkg.com/three@0.121.0/build/three.module.js'
import { OrbitControls } from 'https://unpkg.com/three@0.121.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.121.0/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://unpkg.com/three@0.121.0/examples/jsm/loaders/RGBELoader.js';

var camera, scene, renderer, controls, envMap;
const container = document.getElementById('container');
var content = {};

// LOADING ICON
var load_icon = document.getElementById("loader");
function loadIconShow(ele) {
    ele.style.display = 'block';
}
function loadIconHide(ele) {
    ele.style.display = 'none';
}



var ring = {
    body: [],
    textures: { 'gold': null, 'rose': null, 'silver': null },
    core: null, //CORE JEWELRY
};

/* Camera Poisitions For Different Look */
const pos = {
    'topCore': { x: -18.2, y: 76, z: 24.8 },
    'neckText': { x: -13.58, y: 62.62, z: -46.44 },
    'rightText': { x: 47.325, y: 49.59, z: 39.47 },
    'leftText': { x: -47.19, y: 60.33, z: 21.82 },
    'insideText': { x: -0.805, y: 50, z: 60.59 }
};
window['camera'] = camera;
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

        loadModel('../assets/ring12.glb').then(result => {
            const model = result.scene;
            model.scale.multiplyScalar(1.4);
            scene.add(model)
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
        })
    )

    Promise.all(myPromises).then(() => {

        content = {
            inside: { text: 'Proud Of You!' },
            left1: { text: 'Western' },
            left2: { text: 'Jessica' },
            right1: { text: '2023' },
            right2: { text: 'High School' },
            color: 'gold'
        }

        drawContent(content);

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
    window['camera'] = camera;
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



//CHANGE COLOR OF CORE JEWELRY
document.getElementById('colorSelect').onclick = function () {
    moveCamera(pos.topCore);
}
document.getElementById('colorSelect').onchange = function () {
    moveCamera(pos.rightText);
    ring.core.material.map = ring.textures[(parseInt(this.value) + 1) + ''];
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

// CHANGE LEFT TEXT
document.getElementById('left_1').onfocus = function () {
    moveCamera(pos.leftText);
}

document.getElementById('left_1').onkeyup = function () {
    moveCamera(pos.leftText);
    this.value = checkInput(this.value);
    content.left1.text = this.value;
    drawContent(content);
}


document.getElementById('left_2').onfocus = function () {
    moveCamera(pos.leftText);
}

document.getElementById('left_2').onkeyup = function () {
    moveCamera(pos.leftText);
    this.value = checkInput(this.value);
    content.left2.text = this.value;
    drawContent(content);
}


// CHANGE RIGHT TEXT 
document.getElementById('right_1').onfocus = function () {
    moveCamera(pos.rightText);
}
document.getElementById('right_1').onkeyup = function () {
    moveCamera(pos.rightText);
    this.value = checkInput(this.value);
    content.right1.text = this.value;
    drawContent(content);
}

document.getElementById('right_2').onfocus = function () {
    moveCamera(pos.rightText);
}
document.getElementById('right_2').onkeyup = function () {
    moveCamera(pos.rightText);
    this.value = checkInput(this.value);
    content.right2.text = this.value;
    drawContent(content);
}




// CHANGE INSIDE TEXT
document.getElementById('inside_text').onfocus = function () {
    moveCamera(pos.insideText);
}
document.getElementById('inside_text').onkeyup = function () {
    moveCamera(pos.insideText);
    this.value = checkInput(this.value);
    content.inside.text = this.value;
    drawContent(content);
}



// CHANGE RING COLOR
document.getElementById('ring_color').onchange = function () {
    content.color = this.value;
    drawContent(content);
}

var ctx;
var overflow = {};
const p = {

    inside: { fontSize: 25, s: 0, e: 300, left: 0, top: 23 },
    left1: { fontSize: 22, s: 0, e: 195, top: 58 },
    left2: { fontSize: 22, s: 0, e: 180, top: 94 },
    right1: { fontSize: 22, s: 20, e: 200, top: 125 },
    right2: { fontSize: 22, s: 10, e: 200, top: 165 }
};


var delta = 300;
function drawContent(content) {

    var img = ring.textures[content.color];
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height
    ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    ['inside', 'left1', 'left2', 'right1', 'right2'].forEach(side => {
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

    }, delta)
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

setTimeout(() => { addGUI() }, 1000)
function addGUI() {
    var canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.left = '10px'
    canvas.style.top = '0px';
    canvas.style.zIndes = 10;
    container.appendChild(canvas);
    console.log(canvas)
    window.c = canvas
    var ctx = canvas.getContext('2d');
    ctx.font = `bold 20px century`;
    ctx.fillStyle = "black";
    ctx.fillText('Spin 360', 50, 50)

}