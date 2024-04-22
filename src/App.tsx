import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import "./App.css";

const states = ["Walking", "Dance", "Running", "Sitting"];
const expressions = ["Neutral", "Angry", "Surprised", "Sad"];

function getDimensions(): [width: number, height: number] {
  return [window.innerWidth, window.innerHeight];
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const [w, h] = getDimensions();

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.25, 100);
    camera.position.set(-5, 3, 10);
    camera.lookAt(0, 2, 0);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe0e0e0);
    scene.fog = new THREE.Fog(0xe0e0e0, 20, 100);

    const clock = new THREE.Clock();

    let mixer: THREE.AnimationMixer | undefined;

    // lights

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(0, 20, 10);
    scene.add(dirLight);

    // ground

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000),
      new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);

    const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    // model

    const loader = new GLTFLoader();

    loader.load(
      "../src/assets/RobotExpressive.glb",
      (gltf) => {
        scene.add(gltf.scene);
        createGUI(gltf.scene, gltf.animations);
      },
      undefined,
      (error) => {
        console.error(error);
      }
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);

    containerRef.current?.appendChild(renderer.domElement);

    const createGUI = (
      model: THREE.Group,
      animations: THREE.AnimationClip[]
    ) => {
      mixer = new THREE.AnimationMixer(model);

      const actions: Record<string, THREE.AnimationAction> = {};

      for (let i = 0; i < animations.length; i++) {
        const clip = animations[i];

        const action = mixer.clipAction(clip);

        actions[clip.name] = action;

        if (clip.name === "Sitting") {
          action.clampWhenFinished = true;
          action.loop = THREE.LoopOnce;
        }
      }

      const face = model.getObjectByName("Head_4");

      const expressions = Object.keys(face?.morphTargetDictionary);

      for (let i = 0; i < expressions.length; i++) {
        console.log("expressions", expressions[i]);
      }

      const activeAction = actions["Walking"];
      activeAction.play();

      setTimeout(() => {
        face.morphTargetInfluences[0] = 1;
      }, 5000);
    };

    const handleResize = () => {
      const [width, height] = getDimensions();

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    // Add this inside the useEffect hook after initializing the camera
    window.addEventListener("resize", handleResize);

    // Add this function inside the useEffect hook
    const renderScene = () => {
      const dt = clock.getDelta();

      if (mixer) mixer.update(dt);

      requestAnimationFrame(renderScene);

      renderer.render(scene, camera);
    };
    // Call the renderScene function to start the animation loop
    renderScene();

    // Add this inside the useEffect hook
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.remove();
    };
  }, []);

  return (
    <main className="container">
      <div className="actions">
        <h3>Full Stack Generation - Desafio técnico</h3>

        <div className="field">
          <label>Estado</label>

          <select>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Expressão</label>

          <select>
            {expressions.map((expression) => (
              <option key={expression} value={expression}>
                {expression}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div ref={containerRef}></div>
    </main>
  );
}

export default App;
