import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import "./App.css";

const states = ["Walking", "Dance", "Running", "Sitting"];
const expressions = ["Neutral", "Angry", "Surprised", "Sad"];

function getDimensions(): [width: number, height: number] {
  return [window.innerWidth, window.innerHeight];
}

function setupActions(
  mixer: THREE.AnimationMixer,
  model: THREE.Group<THREE.Object3DEventMap>,
  animations: THREE.AnimationClip[]
) {
  const actions: Record<string, THREE.AnimationAction> = {};

  for (let i = 0; i < animations.length; i++) {
    const clip = animations[i];

    if (!states.includes(clip.name)) {
      continue;
    }

    const action = mixer.clipAction(clip);

    actions[clip.name] = action;

    if (clip.name === "Sitting") {
      action.clampWhenFinished = true;
      action.loop = THREE.LoopOnce;
    }
  }

  const face = model.getObjectByName("Head_4");
  const expressionsKeys = Object.keys(face?.morphTargetDictionary).filter(
    (name) => expressions.includes(name)
  );

  return { actions, expressions: expressionsKeys, face };
}

function init() {
  const [w, h] = getDimensions();

  const camera = new THREE.PerspectiveCamera(45, w / h, 0.25, 100);
  camera.position.set(-5, 3, 10);
  camera.lookAt(0, 2, 0);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe0e0e0);
  scene.fog = new THREE.Fog(0xe0e0e0, 20, 100);

  const clock = new THREE.Clock();

  let robotMixer: THREE.AnimationMixer | undefined;
  let discoBallMixer: THREE.AnimationMixer | undefined;

  let actions: Record<string, THREE.AnimationAction> = {};
  let expressions: string[] = [];

  let activeAction: THREE.AnimationAction | undefined;
  let face: THREE.Object3D<THREE.Object3DEventMap> | undefined;

  let discoBall: THREE.Group<THREE.Object3DEventMap> | undefined;
  let discoBallAction: THREE.AnimationAction | undefined;
  let discoBallLight: THREE.SpotLight | undefined;
  let runningTrack: THREE.Group<THREE.Object3DEventMap> | undefined;
  let ironThrone: THREE.Group<THREE.Object3DEventMap> | undefined;

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
    "./RobotExpressive.glb",
    (gltf) => {
      scene.add(gltf.scene);

      robotMixer = new THREE.AnimationMixer(gltf.scene);

      const {
        actions: newActions,
        expressions: newExpressions,
        face: newFace,
      } = setupActions(robotMixer, gltf.scene, gltf.animations);

      actions = newActions;
      expressions = newExpressions;
      face = newFace;

      fadeToAction("Walking", 0);
    },
    undefined,
    (error) => {
      console.error(error);
    }
  );

  loader.load(
    "./disco_ball_animated.glb",
    (gltf) => {
      gltf.scene.scale.set(0.02, 0.02, 0.02);
      gltf.scene.position.set(5, 4, 1);

      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.color = new THREE.Color(0xffffff);
          child.material.emissive = new THREE.Color(0x737373);
          child.material.metalness = 0.5;
          child.material.roughness = 0;
          child.material.flatShading = true;
        }
      });

      discoBall = gltf.scene;

      discoBallMixer = new THREE.AnimationMixer(discoBall);
      const clip = gltf.animations[0];
      discoBallAction = discoBallMixer.clipAction(clip);

      discoBallLight = new THREE.SpotLight(
        THREE.Color.NAMES.green,
        20,
        0,
        Math.PI / 2,
        1,
        0
      );
      discoBallLight.position.set(-2, 0, -2);
      discoBallLight.target = discoBall;
    },
    undefined,
    (error) => {
      console.error(error);
    }
  );

  loader.load(
    "./lowpoly_road.glb",
    (gltf) => {
      gltf.scene.scale.set(0.1, 0.1, 0.1);
      gltf.scene.position.set(2, 0, -5);
      gltf.scene.rotation.y = Math.PI / 2;

      runningTrack = gltf.scene;
    },
    undefined,
    (error) => {
      console.error(error);
    }
  );

  loader.load(
    "./iron_throne.glb",
    (gltf) => {
      gltf.scene.scale.set(3, 3, 3);
      gltf.scene.position.set(0, -0.4, -1);

      ironThrone = gltf.scene;
    },
    undefined,
    (error) => {
      console.error(error);
    }
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);

  // callbacks

  function renderScene() {
    const dt = clock.getDelta();

    if (robotMixer) robotMixer.update(dt);

    if (discoBallMixer) discoBallMixer.update(dt);

    requestAnimationFrame(renderScene);

    renderer.render(scene, camera);
  }

  function handleResize() {
    const [width, height] = getDimensions();

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  }

  // change actions and expressions

  function fadeToAction(name: string, duration: number) {
    const previousAction = activeAction;
    activeAction = actions[name];

    if (previousAction && previousAction !== activeAction) {
      previousAction.fadeOut(duration);
    }

    activeAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();

    dirLight.color.set(0xffffff);
    dirLight.intensity = 3;
    scene.background = new THREE.Color(0xe0e0e0);
    camera.position.set(-5, 3, 10);
    camera.lookAt(0, 2, 0);

    if (discoBall) {
      scene.remove(discoBall);
      if (discoBallLight) scene.remove(discoBallLight);
      discoBallAction?.stop();
    }
    if (runningTrack) scene.remove(runningTrack);
    if (ironThrone) scene.remove(ironThrone);

    if (name === "Dance" && discoBall) {
      scene.add(discoBall);
      scene.background = new THREE.Color(THREE.Color.NAMES.black);
      dirLight.color.set(THREE.Color.NAMES.purple);
      dirLight.intensity = 10;

      camera.position.set(-2, 4, 10);

      if (discoBallLight) scene.add(discoBallLight);

      discoBallAction?.play();
    }

    if (name === "Running" && runningTrack) {
      scene.add(runningTrack);
      scene.background = new THREE.Color(THREE.Color.NAMES.lightblue);
      dirLight.color.set(THREE.Color.NAMES.green);

      camera.position.set(0, 2, 10);
      camera.lookAt(0, 2, -5);
    }

    if (name === "Sitting" && ironThrone) {
      scene.add(ironThrone);
      scene.background = new THREE.Color(THREE.Color.NAMES.brown);
      dirLight.color.set(THREE.Color.NAMES.red);

      camera.position.set(0, 3, 8);
      camera.lookAt(0, 2, 0);
    }
  }

  function fadeToExpression(name: string) {
    if (!face) {
      return;
    }

    face.morphTargetInfluences = face.morphTargetInfluences.map((_, i) =>
      i === expressions.indexOf(name) ? 1 : 0
    );
  }

  return {
    renderScene,
    handleResize,
    renderer,
    fadeToAction,
    fadeToExpression,
  };
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsSelectRef = useRef<HTMLSelectElement>(null);
  const expressionsSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const {
      renderScene,
      handleResize,
      renderer,
      fadeToAction,
      fadeToExpression,
    } = init();

    containerRef.current?.appendChild(renderer.domElement);

    // Add this inside the useEffect hook after initializing the camera
    window.addEventListener("resize", handleResize);

    // Call the renderScene function to start the animation loop
    renderScene();

    const handleActionChange = () => {
      const action = actionsSelectRef.current?.value;

      if (action) {
        fadeToAction(action, 0.5);
      }
    };

    const handleExpressionChange = () => {
      const expression = expressionsSelectRef.current?.value;

      if (expression) {
        fadeToExpression(expression);
      }
    };

    actionsSelectRef.current?.addEventListener("change", handleActionChange);

    expressionsSelectRef.current?.addEventListener(
      "change",
      handleExpressionChange
    );

    const actionsSelectElement = actionsSelectRef.current;
    const expressionsSelectElement = expressionsSelectRef.current;

    // Add this inside the useEffect hook
    return () => {
      window.removeEventListener("resize", handleResize);
      actionsSelectElement?.removeEventListener("change", handleActionChange);
      expressionsSelectElement?.removeEventListener(
        "change",
        handleExpressionChange
      );

      renderer.domElement.remove();
    };
  }, []);

  return (
    <main className="container">
      <div className="actions">
        <h3>Full Stack Generation - Desafio técnico</h3>

        <div className="field">
          <label htmlFor="actions">Estado</label>

          <select id="actions" ref={actionsSelectRef} defaultValue={states[0]}>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="expressions">Expressão</label>

          <select
            id="expressions"
            ref={expressionsSelectRef}
            defaultValue={expressions[0]}
          >
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
