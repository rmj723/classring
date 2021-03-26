import {
    Scene, Color, PerspectiveCamera, HemisphereLight, PMREMGenerator, UnsignedByteType, AmbientLight, PointLight, sRGBEncoding,
    DirectionalLight, WebGLRenderer, AxesHelper, ObjectLoader
} from 'https://unpkg.com/three@0.121.0/build/three.module.js';

import { OrbitControls } from 'https://unpkg.com/three@0.121.0/examples/jsm/controls/OrbitControls.js';

import { RGBELoader } from '../three/examples/jsm/loaders/RGBELoader.js';

const container = document.getElementById('scene-container');
const scene = new Scene();
scene.background = new Color('skyblue');
scene.add(new AxesHelper(10))

const camera = new PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 0, 100);



const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight)
renderer.outputEncoding = sRGBEncoding;
container.append(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
    controls.update();
})

new Promise(resolve => {
    new RGBELoader().setDataType(UnsignedByteType).load('../assets/env/venice_sunset_1k.hdr', resolve)
}).then(result => {
    var texture = result;
    var pmremGenerator = new PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    scene.environment = pmremGenerator.fromEquirectangular(texture).texture;;
    texture.dispose();
    pmremGenerator.dispose();
})


var directionalLight = new DirectionalLight(0xffffff, 1);
directionalLight.position.set(100, 100, 100)

scene.add(
    new AmbientLight(0xffffff, 1),
    new HemisphereLight(0xffffff, 0xffffff, 1),
    directionalLight
);

var pointLight = new PointLight(0xffffff, 1, 200);
camera.add(pointLight);


var worker = new Worker('worker.js', { type: "module" });

var numOfModels = 0;

var allModels = {};

worker.onmessage = function (e) {

    numOfModels++;

    document.getElementById('numOfModels').innerHTML = numOfModels;

    /* Here */
    if (e.data[0] !== '') {
        let modelData = JSON.parse(e.data[0]);
        let textureURIs = JSON.parse(e.data[1]);
        let imageMaps = JSON.parse(e.data[2]);

        if (modelData.images) {
            modelData.images.forEach(img => {

                let image = imageMaps.find(x => x.id === img.uuid);
                img.url = image ? textureURIs[image.index] : img.url;
            })
        }

        const model = new ObjectLoader().parse(modelData);
        allModels[e.data[3]] = model;
        if (e.data[3] === 'ring1.glb') {
            scene.add(model)
        }
    } else {
        var str = e.data[2];
        var json = JSON.parse(str);
        var m = new ObjectLoader().parse(json);
        allModels[e.data[3]] = m;
    }
}

// worker.terminate();