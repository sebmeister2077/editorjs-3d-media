import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import './index.css';


declare function showOpenFilePicker(options?: any): Promise<FileSystemFileHandle[]>;

const input = document.getElementById('loadFile') as HTMLInputElement;

input.addEventListener('change', async () => {
    console.log("File selected");
    try {
        const file = input.files?.[0];
        if (!file) return;
        const tempUrl = URL.createObjectURL(file);
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension) {
            console.error("Could not determine file extension.");
            return;
        }

        const outputElement = document.getElementById('output');
        if (!outputElement) return;

        const width = outputElement.clientWidth, height = outputElement.clientHeight;

        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        // Create camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0, 1, 3);

        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        outputElement.innerHTML = '';
        outputElement.appendChild(renderer.domElement);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
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
});