import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';


declare function showOpenFilePicker(options?: any): Promise<FileSystemFileHandle[]>;

const textureFilesInput = document.getElementById('textureFiles') as HTMLInputElement;
const input = document.getElementById('loadFile') as HTMLInputElement;
input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (file) {
        await start(file);
    }
})
let mtlFile: File | null = null;
const textureFiles: File[] = [];
textureFilesInput.addEventListener('change', async () => {
    const files = textureFilesInput.files;
    if (files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (fileExtension === 'mtl') {
                mtlFile = file;
            }
            else {
                if (textureFiles.find(f => f.name === file.name)) continue;
                textureFiles.push(file);
            }
        }
    }
})
queueMicrotask(() => {
    start();
})
const lastFileNamesKey = 'lastFileName';
async function getFileFromCache(fileName: string): Promise<File | null> {
    const cache = await caches.open('my-cache');
    const response = await cache.match(fileName);
    const blob = await response?.blob();
    if (blob) {
        return new File([blob], fileName, { type: blob.type });
    }
    return null
};
async function saveFileToCache(file: File): Promise<void> {
    const cache = await caches.open('my-cache');
    await cache.put(file.name, new Response(file));
}
async function start(file?: File) {
    const lastFileNames = localStorage.getItem(lastFileNamesKey)
    const previousFileNames: string[] = JSON.parse(lastFileNames ?? '{}')?.fileNames ?? [];
    const fileName = file ? file.name : previousFileNames.find(name => name.endsWith(".obj"));
    console.log("🚀 ~ start ~ fileName:", fileName)
    if (!fileName) return;
    // input.addEventListener('change', async () => {
    console.log("File selected");

    try {
        // const file = input.files?.[0];
        // if (!file) return;

        let tempUrl: string;
        if (file) {
            await saveFileToCache(file);
            if (mtlFile)
                await saveFileToCache(mtlFile as File);
            await Promise.all(textureFiles.map(async (textureFile) => {
                await saveFileToCache(textureFile);
            }));
            localStorage.setItem(lastFileNamesKey, JSON.stringify({ fileNames: [fileName, mtlFile!.name, ...textureFiles.map(f => f.name)] }));
            tempUrl = URL.createObjectURL(file);
        }
        else {
            const file = await getFileFromCache(fileName);
            if (!file) return;
            mtlFile = await getFileFromCache(previousFileNames.find(name => name.endsWith(".mtl")) as string);
            textureFiles.push(...await Promise.all(previousFileNames.filter(name => {
                const ext = name.split('.').pop()?.toLowerCase();
                return ext === 'jpg' || ext === 'png';
            }).map(async (name) => {
                const file = await getFileFromCache(name);
                return file as File;
            })));
            tempUrl = URL.createObjectURL(file);
        }
        const fileExtension: string = "obj"//blob.name.split('.').pop()?.toLowerCase();
        if (!fileExtension) {
            console.error("Could not determine file extension.");
            return;
        }

        const outputElement = document.getElementById('output');
        if (!outputElement) return;
        outputElement.replaceChildren();

        const width = outputElement.clientWidth, height = outputElement.clientHeight;

        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        // Create camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0, 5, 20);

        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, });
        renderer.setSize(width, height);
        outputElement.appendChild(renderer.domElement);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 10);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Add controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // Load GLB model
        if (fileExtension === 'glb' || fileExtension === 'gltf') {
            const loader = new GLTFLoader();
            loader.load(tempUrl, (gltf) => {
                scene.add(gltf.scene);

                // Center and scale the model
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const center = box.getCenter(new THREE.Vector3());
                gltf.scene.position.sub(center);

                URL.revokeObjectURL(tempUrl);
            }, undefined, (error) => {
                console.error('Error loading model:', error);
            });
        }
        else if (fileExtension === 'fbx') {
            const textureFiles = await showOpenFilePicker({ multiple: true });

            const textures = []// bottle_normal.jpg,cap_normal.jpg,ship_albedo.jpg,ship_normal.jpg
            const texturePromises = textureFiles.map(async (handle) => {
                const file = await handle.getFile();
                const tempTextureUrl = URL.createObjectURL(file);
                const textureLoader = new THREE.TextureLoader();
                const fileName = file.name.toLowerCase();
                return new Promise<{ name: string; texture: THREE.Texture }>((resolve) => {
                    const textureLoader = new THREE.TextureLoader();
                    textureLoader.load(tempTextureUrl, (texture) => {
                        texture.flipY = false; // FBX models often need this
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        resolve({ name: fileName, texture });
                    });
                });

                // const texture = textureLoader.load(tempTextureUrl);
                // textures.push(texture);
                // Load texture and apply to model later
                // You would need to implement logic to match textures to model materials
            });


            const loadedTextures = await Promise.all(texturePromises);
            const loader = new FBXLoader();
            loader.load(tempUrl, (fbx) => {
                scene.add(fbx);
                // Center and scale the model
                const box = new THREE.Box3().setFromObject(fbx);
                const center = box.getCenter(new THREE.Vector3());
                fbx.position.sub(center);
                // debugger
                //TODO everything is white, need to add materials, i have the textures separately in jpg files
                fbx.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh;
                        const meshName = mesh.name.toLowerCase();
                        const material = new THREE.MeshStandardMaterial();

                        // Match textures by naming convention
                        loadedTextures.forEach(({ name, texture }) => {

                            let texturePart: string;
                            if (name.includes("_")) {
                                texturePart = name.split("_")[0];
                            }
                            else {
                                texturePart = name.split(".")[0];
                            }
                            if (meshName.includes(texturePart)) {

                                if (name.includes('albedo') || name.includes('diffuse') || name.includes('color') || name === 'sea.jpg') {
                                    material.map = texture;
                                } else if (name.includes('normal')) {
                                    material.normalMap = texture;
                                } else if (name.includes('roughness')) {
                                    material.roughnessMap = texture;
                                } else if (name.includes('metallic') || name.includes('metalness')) {
                                    material.metalnessMap = texture;
                                } else if (name.includes('ao') || name.includes('ambient')) {
                                    material.aoMap = texture;
                                }
                            }
                        });

                        material.needsUpdate = true;
                        mesh.material = material;
                    }
                });




                URL.revokeObjectURL(tempUrl);
            }, undefined, (error) => {
                console.error('Error loading model:', error);
            });


        }
        //#region  OBJ loader with MTL
        // works, colors are missing
        else if (fileExtension === 'obj') {
            if (!mtlFile) return;
            console.log("🚀 ~ start ~ mtlFile:", mtlFile)
            const mtlTempUrl = URL.createObjectURL(mtlFile);
            //transform file to base64
            const base64Jpegs = new Map<string, string>();
            await Promise.all(textureFiles.map(async (file) => {
                // jpg, png
                const fileExtension = file.name.split('.').pop()?.toLowerCase();
                const base64Content = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve(reader.result as string);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                base64Jpegs.set(file.name, base64Content);
            }));

            const manager = new THREE.LoadingManager();
            manager.setURLModifier((url) => {
                const fileName = url.split('/').pop() || url;
                if (base64Jpegs.has(fileName)) {
                    return base64Jpegs.get(fileName) as string;
                }
                return url;
            });

            const mtlLoader = new MTLLoader(manager);
            mtlLoader.setResourcePath('/');
            mtlLoader.load(mtlTempUrl, (materials) => {
                console.log("🚀 ~ start ~ materials:", materials)
                materials.preload();
                const objLoader = new OBJLoader();
                objLoader.setMaterials(materials);
                objLoader.load(tempUrl, (obj) => {
                    // Center and scale the model
                    const box = new THREE.Box3().setFromObject(obj);
                    const center = box.getCenter(new THREE.Vector3());
                    obj.position.sub(center);

                    URL.revokeObjectURL(tempUrl);

                    // //? Call external function to apply materials
                    obj.traverse((child) => {
                        if ((child as THREE.Mesh).isMesh) {
                            const mesh = child as THREE.Mesh & any;
                            mesh.material.side = THREE.DoubleSide;
                            // mesh.material = new THREE.MeshStandardMaterial();
                        }
                        scene.add(obj);
                    })
                }, (progress) => {
                    console.log('OBJ file loading progress:', (progress.loaded / progress.total) * 100);
                }, (error) => {
                    console.error('Error loading OBJ file:', error);
                });
            }, (progress) => {
                console.log('MTL file loading progress:', (progress.loaded / progress.total) * 100);
            }, (error) => {
                console.error('Error loading MTL file:', error);
            })
        }

        // Render loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

    } catch (err) {
        console.error("Error:", err);
    }
}

// });