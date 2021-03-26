import { GLTFLoader } from 'https://unpkg.com/three@0.121.0/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

var fileNames = []
fileNames.push('graphs.glb');
for (var i = 1; i < 12; ++i) fileNames.push(`ring${i}.glb`);

fileNames.forEach(fn => {
    loader.load(`../assets/${fn}`, (gltf) => {

        const parser = gltf.parser;
        var sourceURIs = [];
        var imageMaps = [];
        if (parser.json.images) {

            const bufferPromises = parser.json.images.map((imageDef) => {
                return parser.getDependency('bufferView', imageDef.bufferView);
            });

            Promise.all(bufferPromises).then((buffer) => {

                for (let i = 0; i < buffer.length; i++) {
                    let sourceURI = URL.createObjectURL(new Blob([buffer[i]], { type: "image/png" }));
                    sourceURIs.push(sourceURI)
                }

                parser.parse(gltf, function () {

                    for (let [key, value] of parser.associations) {

                        if (value.type === 'textures' && key.image.uuid) {

                            let obj = {};
                            obj.id = key.image.uuid;
                            obj.index = parser.json.textures[value.index].source;
                            imageMaps.push(obj);
                        }
                    }

                })

                let modelData = JSON.stringify(gltf.scene);

                setTimeout(() => {
                    postMessage([
                        modelData,
                        JSON.stringify(sourceURIs),
                        JSON.stringify(imageMaps),
                        fn
                    ]);
                }, 1000);
            });

        }

    })
})


loader.load(`../assets/chars.glb`, (gltf) => {
    const json = gltf.scene.toJSON();
    var str = JSON.stringify(json);
    postMessage(['', '', str, 'chars.glb'])
})
