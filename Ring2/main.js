import * as THREE from 'https://unpkg.com/three@0.121.0/build/three.module.js'
import { OrbitControls } from 'https://unpkg.com/three@0.121.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.121.0/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://unpkg.com/three@0.121.0/examples/jsm/loaders/RGBELoader.js';
import { data } from './data.js';

var camera, scene, renderer, controls, envMap;
const container = document.getElementById('container');
// LOADING ICON
var load_icon = document.getElementById("loader");
function loadIconShow(ele) {
    ele.style.display = 'block';
}
function loadIconHide(ele) {
    ele.style.display = 'none';
}

/* Alphabeta & Graph Side Meshes TO BE LOADED */
var chars = {
    cambria: { bold: {} },
    arial: {
        bold: {},
        regular: {}
    }
},
    graphs = [];

/* Clone Letters To Be Removed */
var charPos = {
    'top1': [],
    'top2': [],
    'right': [],
    'left': [],
    'inside': [],
};

var ring = {
    body: [],
    color: 'gold',
    textures: { 'gold': null, 'rose': null, 'silver': null },
    core: null, //CORE JEWELRY
    left: null, //LEFT GRAPH
    right: null
};

/* Camera Poisitions For Different Look */
const pos = {
    'left': { x: -70, y: 26, z: -30 },
    'right': { x: 80, y: 0, z: 0 },
    'topCore': { x: -11, y: 68, z: -23 },
    'topText1': { x: -20, y: 66.8, z: -38 },
    'topText2': { x: -1.54, y: 60.59, z: 51.68 },
    'neckText': { x: -1.18, y: 34.98, z: -50.25 },
    'rightText': { x: 65.8, y: 45.3, z: 2.48 },
    'leftText': { x: -66.73, y: 44.96, z: -1.02 },
    'insideText': { x: 0.89, y: 41.74, z: 42.23 }
};

init();
animate();


//INITIALIZATION OF THREE.JS
function init() {
    for (var i = 0; i < 6; ++i) {
        graphs[i] = null;
    }

    buildScene();
    buildCamera();
    buildRenderer();
    buildControls();
    buildLight();

    Promise.all([
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/1.jpg', resolve) }).then(result => { ring.textures['1'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/2.jpg', resolve) }).then(result => { ring.textures['2'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/3.jpg', resolve) }).then(result => { ring.textures['3'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/4.jpg', resolve) }).then(result => { ring.textures['4'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/5.jpg', resolve) }).then(result => { ring.textures['5'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/6.jpg', resolve) }).then(result => { ring.textures['6'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/7.jpg', resolve) }).then(result => { ring.textures['7'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/8.jpg', resolve) }).then(result => { ring.textures['8'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/9.jpg', resolve) }).then(result => { ring.textures['9'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/10.jpg', resolve) }).then(result => { ring.textures['10'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/11.jpg', resolve) }).then(result => { ring.textures['11'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/12.jpg', resolve) }).then(result => { ring.textures['12'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/gold.jpg', resolve) }).then(result => { ring.textures['gold'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/rose.jpg', resolve) }).then(result => { ring.textures['rose'] = result }),
        new Promise(resolve => { new THREE.TextureLoader().load('../assets/images/silver.jpg', resolve) }).then(result => { ring.textures['silver'] = result }),
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
        loadModel('../assets/ring2.glb').then(result => {
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
        loadModel('../assets/graphs.glb').then(result => {
            result.scene.traverse(child => {
                let str = child.name.split('_');
                graphs[parseInt(str[1]) - 1] = child;
            });
        }),
    ]).then(() => {
        loadIconHide(load_icon);
        changeText('WESTERN', 'top1');
        changeText('HIGH SCHOOL', 'top2');
        changeText('NEWBURYPARK HIGHSCHOOL', 'neck');
        changeText('JEREMY', 'right');
        changeText('VIRGINIO', 'left');
        changeText('CONGRATULATIONS', 'inside');
        changeGraph(1, 'left');
        changeGraph(1, 'right')
        controls.autoRotate = false;
    });

    window.addEventListener('resize', onWindowResize, false);
}

function loadModel(url) {
    return new Promise(resolve => {
        new GLTFLoader().load(url, resolve);
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
    controls.zoomSpeed = 0.05;
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

function changeGraph(index, side) {
    if (ring[side] !== null) {
        ring[side].geometry.dispose();

        scene.remove(ring[side]);
        ring[side] = null;
    }

    ring[side] = graphs[index - 1].clone();
    var a = data[side + '_graph'];
    ring[side].position.set(a.position[0], a.position[1], a.position[2]);
    rotate(ring[side], a.rotation);
    ring[side].scale.set(a.scale[0], a.scale[1], a.scale[2]);

    ring[side].visible = true;
    scene.add(ring[side]);
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
    var temp, index;
    switch (side) {
        case 'top1':
            removeChars('top1');
            for (var i = 0; i < L; ++i) {
                temp = getMesh(text.charCodeAt(L - i - 1), 'arial', 'regular');
                let m = temp.clone();
                var a = data['top1_' + L + '_' + (i + 1)];
                m.position.set(a.position[0], a.position[1], a.position[2]);
                rotate(m, a.rotation);
                m.scale.set(-a.scale[0], a.scale[1], -a.scale[2]);
                m.visible = true;
                m.material = ring.body[0].material;
                charPos.top1.push(m);
                scene.add(m);
            }
            break;
        case 'top2':
            removeChars('top2');
            for (var i = 0; i < L; ++i) {
                temp = getMesh(text.charCodeAt(i), 'arial', 'regular');
                let m = temp.clone();
                var a = data['top2_' + L + '_' + (i + 1)];
                m.position.set(a.position[0], a.position[1], a.position[2]);
                rotate(m, a.rotation);
                m.scale.set(a.scale[0], a.scale[1], a.scale[2]);
                m.visible = true;
                m.material = ring.body[0].material;
                charPos.top2.push(m);
                scene.add(m);
            }
            break;
        case 'right':
            removeChars('right');
            for (var i = 0; i < L; ++i) {
                temp = getMesh(text.charCodeAt(i), 'arial', 'bold')
                let m = temp.clone();
                let a = data['right_' + L + '_' + (i + 1)];
                m.position.set(a.position[0], a.position[1], a.position[2]);
                rotate(m, a.rotation);
                m.scale.set(a.scale[0], 1.2, a.scale[2]);
                m.visible = true;
                m.material = ring.body[0].material;
                charPos.right.push(m);
                scene.add(m);
            }
            break;
        case 'left':
            removeChars('left');
            for (var i = 0; i < L; ++i) {
                temp = getMesh(text.charCodeAt(i), 'arial', 'bold')
                let m = temp.clone();
                let a = data['left_' + L + '_' + (i + 1)];
                m.position.set(a.position[0], a.position[1], a.position[2]);
                rotate(m, a.rotation);
                m.scale.set(a.scale[0], 1.2, a.scale[2]);
                m.visible = true;
                m.material = ring.body[0].material;
                charPos.left.push(m);
                scene.add(m);
            }
            break;
        case 'inside':
            removeChars('inside');
            for (var i = 0; i < L; ++i) {
                temp = getMesh(text.charCodeAt(i), 'cambria', 'bold')
                const mid = (L <= 10) ? 4 : 8;
                if (L % 2) {
                    index = i + mid - Math.floor(L / 2);
                    let m = temp.clone();
                    var a = (L <= 10) ? data['inside_bigodd_' + (index + 1)] : data['inside_odd_' + (index + 1)]
                    m.position.set(a.position[0], a.position[1], a.position[2]);
                    rotate(m, a.rotation);
                    m.scale.set(a.scale[0], a.scale[1], a.scale[2]);
                    m.visible = true;
                    m.material = new THREE.MeshBasicMaterial({ color: 0x000000 });
                    charPos.inside.push(m);
                    scene.add(m);
                } else {
                    index = i + mid + 1 - Math.floor(L / 2);
                    let m = temp.clone();
                    var a = (L <= 10) ? data['inside_bigeven_' + (index + 1)] : data['inside_even_' + (index + 1)];
                    m.position.set(a.position[0], a.position[1], a.position[2]);
                    rotate(m, a.rotation);
                    m.scale.set(a.scale[0], a.scale[1], a.scale[2]);
                    m.visible = true;
                    m.material = new THREE.MeshBasicMaterial({ color: 0x000000 });
                    charPos.inside.push(m);
                    scene.add(m);
                }

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
    mesh.applyQuaternion(qy);
    mesh.applyQuaternion(qz);
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


//CHANGE RIGHT GRAPH
document.getElementById('right_graph').onclick = function () {
    moveCamera(pos.right);
}
document.getElementById('right_graph').onchange = function () {
    moveCamera(pos.right);
    changeGraph(this.value, 'right');
}


//CHANGE LEFT GRAPH
document.getElementById('left_graph').onclick = function () {
    moveCamera(pos.left);
}
document.getElementById('left_graph').onchange = function () {
    moveCamera(pos.left);
    changeGraph(this.value, 'left');
}


// CHANGE RIGHT TEXT 
document.getElementById('right_text').onfocus = function () {
    moveCamera(pos.rightText);
}
document.getElementById('right_text').onkeyup = function () {
    moveCamera(pos.rightText);
    var str = this.value.replace(/[^ -~]+/g, "");
    str = str.toUpperCase();
    str = str.replace(/[\s`{}_\[\]\\|^]/g, '');
    this.value = str;
    changeText(str, 'right')
}


// CHANGE LEFT TEXT
document.getElementById('left_text').onfocus = function () {
    moveCamera(pos.leftText);
}
document.getElementById('left_text').onkeyup = function () {
    moveCamera(pos.leftText);
    var str = this.value.replace(/[^ -~]+/g, "");
    str = str.toUpperCase();
    str = str.replace(/[\s`{}_\[\]\\|^]/g, '');
    this.value = str;
    changeText(str, 'left');
}


// CHANGE INSIDE TEXT
document.getElementById('inside_text').onfocus = function () {
    moveCamera(pos.insideText);
}
document.getElementById('inside_text').onkeyup = function () {
    moveCamera(pos.insideText);
    var str = this.value.replace(/[^ -~]+/g, "");
    str = str.toUpperCase();
    str = str.replace(/[`{}_\[\]\\|^]/g, '');
    this.value = str;
    changeText(str, 'inside');
}

// CHANGE TOP TEXT 1
document.getElementById('top_text1').onfocus = function () {
    moveCamera(pos.topText1);
}
document.getElementById('top_text1').onkeyup = function () {
    moveCamera(pos.topText1);
    var str = this.value.replace(/[^ -~]+/g, "");
    str = str.toUpperCase();
    str = str.replace(/[`{}_\[\]\\|^]/g, '');
    this.value = str;
    changeText(str, 'top1');
}

//CHANGE TOP TEXT 2
document.getElementById('top_text2').onfocus = function () {
    moveCamera(pos.topText2);
}
document.getElementById('top_text2').onkeyup = function () {
    moveCamera(pos.topText2);
    var str = this.value.replace(/[^ -~]+/g, "");
    str = str.toUpperCase();
    str = str.replace(/[`{}_\[\]\\|^]/g, '');
    this.value = str;
    changeText(str, 'top2');
}



// CHANGE RING COLOR
document.getElementById('ring_color').onchange = function () {
    ring.color = this.value;
    ring.body.forEach((mesh) => {
        mesh.material.map = ring.textures[ring.color];
    });
    charPos.right[0].material.map = ring.textures[ring.color];
    charPos.left[0].material.map = ring.textures[ring.color];
    charPos.top1[0].material.map = ring.textures[ring.color];
    charPos.top2[0].material.map = ring.textures[ring.color];
    graphs[0].material.map = ring.textures[ring.color];
}

