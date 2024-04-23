import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import "./App.css";
import Robot from "./use-cases/robot/robot";
import { LoadingOverlay } from "./components/loading-overlay/loading-overlay";

const assets = {
  models: {
    robot: "./RobotExpressive.glb",
    discoBall: "./disco_ball_animated.glb",
    runningTrack: "./lowpoly_road.glb",
    ironThrone: "./iron_throne.glb",
  },
  textures: {
    party: "party.jpg",
  },
};

const availableActions = ["Walking", "Dance", "Running", "Sitting"];
const availableExpressions = ["Neutral", "Angry", "Surprised", "Sad"];

const DEFAULT_ACTION = "Walking";
const DEFAULT_EXPRESSION = "Neutral";

function getDimensions(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
}

// function setupActions(
//   mixer: THREE.AnimationMixer,
//   model: THREE.Group<THREE.Object3DEventMap>,
//   animations: THREE.AnimationClip[]
// ) {
//   const actions: Record<string, THREE.AnimationAction> = {};

//   for (let i = 0; i < animations.length; i++) {
//     const clip = animations[i];

//     if (!states.includes(clip.name)) {
//       continue;
//     }

//     const action = mixer.clipAction(clip);

//     actions[clip.name] = action;

//     if (clip.name === "Sitting") {
//       action.clampWhenFinished = true;
//       action.loop = THREE.LoopOnce;
//     }
//   }

//   const face = model.getObjectByName("Head_4") as THREE.Mesh | undefined;
//   const expressionsKeys = face?.morphTargetDictionary
//     ? Object.keys(face.morphTargetDictionary).filter((name) =>
//         expressions.includes(name)
//       )
//     : [];

//   return { actions, expressions: expressionsKeys, face };
// }

// function init() {
//   const [w, h] = getDimensions();

//   const camera = new THREE.PerspectiveCamera(45, w / h, 0.25, 100);
//   camera.position.set(-5, 3, 10);
//   camera.lookAt(0, 2, 0);

//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xe0e0e0);
//   scene.fog = new THREE.Fog(0xe0e0e0, 20, 100);

//   const clock = new THREE.Clock();

//   let robotMixer: THREE.AnimationMixer | undefined;
//   let discoBallMixer: THREE.AnimationMixer | undefined;

//   let actions: Record<string, THREE.AnimationAction> = {};
//   let expressions: string[] = [];

//   let activeAction: THREE.AnimationAction | undefined;
//   let face: THREE.Mesh | undefined;

//   let discoBall: THREE.Group<THREE.Object3DEventMap> | undefined;
//   let discoBallAction: THREE.AnimationAction | undefined;
//   let discoBallEnvironment: THREE.Texture | undefined;

//   let runningTrack: THREE.Group<THREE.Object3DEventMap> | undefined;

//   let ironThrone: THREE.Group<THREE.Object3DEventMap> | undefined;

//   // lights

//   const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
//   hemiLight.position.set(0, 20, 0);
//   scene.add(hemiLight);

//   const dirLight = new THREE.DirectionalLight(0xffffff, 3);
//   dirLight.position.set(0, 20, 10);
//   scene.add(dirLight);

//   // ground

//   const mesh = new THREE.Mesh(
//     new THREE.PlaneGeometry(2000, 2000),
//     new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
//   );
//   mesh.rotation.x = -Math.PI / 2;
//   scene.add(mesh);

//   const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
//   grid.material.opacity = 0.2;
//   grid.material.transparent = true;
//   scene.add(grid);

//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setPixelRatio(window.devicePixelRatio);
//   renderer.setSize(w, h);

//   const pmremGenerator = new THREE.PMREMGenerator(renderer);
//   pmremGenerator.compileEquirectangularShader();

//   const neutralEnvironment = pmremGenerator.fromScene(
//     new RoomEnvironment()
//   ).texture;

//   // model

//   new THREE.TextureLoader().load(
//     "party.jpg",
//     (image) => {
//       const envMap = pmremGenerator.fromEquirectangular(image).texture;
//       pmremGenerator.dispose();
//       discoBallEnvironment = envMap;
//     },
//     undefined,
//     console.error
//   );

//   const loader = new GLTFLoader();

//   loader.load(
//     "./disco_ball_animated.glb",
//     (gltf) => {
//       gltf.scene.scale.set(0.02, 0.02, 0.02);
//       gltf.scene.position.set(5, 4, 1);

//       discoBall = gltf.scene;

//       discoBallMixer = new THREE.AnimationMixer(discoBall);
//       const clip = gltf.animations[0];
//       discoBallAction = discoBallMixer.clipAction(clip);
//     },
//     undefined,
//     (error) => {
//       console.error(error);
//     }
//   );

//   loader.load(
//     "./lowpoly_road.glb",
//     (gltf) => {
//       gltf.scene.scale.set(0.1, 0.1, 0.1);
//       gltf.scene.position.set(2, 0, -5);
//       gltf.scene.rotation.y = Math.PI / 2;

//       runningTrack = gltf.scene;
//     },
//     undefined,
//     (error) => {
//       console.error(error);
//     }
//   );

//   loader.load(
//     "./iron_throne.glb",
//     (gltf) => {
//       gltf.scene.scale.set(3, 3, 3);
//       gltf.scene.position.set(0, -0.4, -1);

//       ironThrone = gltf.scene;
//     },
//     undefined,
//     (error) => {
//       console.error(error);
//     }
//   );

//   loader.load(
//     "./RobotExpressive.glb",
//     (gltf) => {
//       scene.add(gltf.scene);

//       robotMixer = new THREE.AnimationMixer(gltf.scene);

//       const {
//         actions: newActions,
//         expressions: newExpressions,
//         face: newFace,
//       } = setupActions(robotMixer, gltf.scene, gltf.animations);

//       actions = newActions;
//       expressions = newExpressions;
//       face = newFace;

//       fadeToAction("Walking", 0);
//     },
//     undefined,
//     (error) => {
//       console.error(error);
//     }
//   );

//   // callbacks

//   function renderScene() {
//     const dt = clock.getDelta();

//     if (robotMixer) robotMixer.update(dt);

//     if (discoBallMixer) discoBallMixer.update(dt);

//     requestAnimationFrame(renderScene);

//     renderer.render(scene, camera);
//   }

//   function handleResize() {
//     const [width, height] = getDimensions();

//     camera.aspect = width / height;
//     camera.updateProjectionMatrix();

//     renderer.setSize(width, height);
//   }

//   // change actions and expressions

//   function fadeToAction(name: string, duration: number) {
//     const previousAction = activeAction;
//     activeAction = actions[name];

//     if (previousAction && previousAction !== activeAction) {
//       previousAction.fadeOut(duration);
//     }

//     activeAction
//       .reset()
//       .setEffectiveTimeScale(1)
//       .setEffectiveWeight(1)
//       .fadeIn(duration)
//       .play();

//     scene.environment = neutralEnvironment;
//     scene.background = new THREE.Color(0xe0e0e0);
//     dirLight.color.set(0xffffff);
//     dirLight.intensity = 3;
//     camera.position.set(-5, 3, 10);
//     camera.lookAt(0, 2, 0);

//     if (discoBall) {
//       scene.remove(discoBall);
//       discoBallAction?.stop();
//     }
//     if (runningTrack) scene.remove(runningTrack);
//     if (ironThrone) scene.remove(ironThrone);

//     if (name === "Dance" && discoBall) {
//       if (discoBallEnvironment) {
//         scene.environment = discoBallEnvironment;
//       }
//       scene.background = new THREE.Color(0x000000);
//       scene.add(discoBall);
//       dirLight.color.set(THREE.Color.NAMES.purple);
//       dirLight.intensity = 10;

//       camera.position.set(-2, 4, 10);

//       discoBallAction?.play();
//     }

//     if (name === "Running" && runningTrack) {
//       scene.add(runningTrack);
//       scene.background = new THREE.Color(THREE.Color.NAMES.lightblue);
//       dirLight.color.set(THREE.Color.NAMES.green);

//       camera.position.set(0, 2, 10);
//       camera.lookAt(0, 2, -5);
//     }

//     if (name === "Sitting" && ironThrone) {
//       scene.add(ironThrone);
//       scene.background = new THREE.Color(THREE.Color.NAMES.brown);
//       dirLight.color.set(THREE.Color.NAMES.red);

//       camera.position.set(0, 3, 8);
//       camera.lookAt(0, 2, 0);
//     }
//   }

//   function fadeToExpression(name: string) {
//     if (!face) {
//       return;
//     }

//     face.morphTargetInfluences = face.morphTargetInfluences?.map((_, i) =>
//       i === expressions.indexOf(name) ? 1 : 0
//     );
//   }

//   return {
//     renderScene,
//     handleResize,
//     renderer,
//     fadeToAction,
//     fadeToExpression,
//   };
// }

async function loadAndSetupModels(robot: Robot) {
  try {
    const textureLoader = new THREE.TextureLoader();
    const gltfLoader = new GLTFLoader();

    const [
      robotGltf,
      discoBallGltf,
      runningTrackGltf,
      ironThroneGltf,
      partyTexture,
    ] = await Promise.all([
      gltfLoader.loadAsync(assets.models.robot),
      gltfLoader.loadAsync(assets.models.discoBall),
      gltfLoader.loadAsync(assets.models.runningTrack),
      gltfLoader.loadAsync(assets.models.ironThrone),
      textureLoader.loadAsync(assets.textures.party),
    ]);

    // setup robot model

    robot.scene.add(robotGltf.scene);
    robot.setupLoadedRobot(robotGltf.scene, robotGltf.animations);

    // setup disco ball model

    discoBallGltf.scene.scale.set(0.02, 0.02, 0.02);
    discoBallGltf.scene.position.set(3, 4, 1);
    const discoBallAction = robot.addMixerAndClipAction(
      discoBallGltf.scene,
      discoBallGltf.animations[0]
    );
    const discoBallEnvMap =
      robot.pmremGenerator.fromEquirectangular(partyTexture).texture;

    robot.updateActionComplement("Dance", {
      object: discoBallGltf.scene,
      action: discoBallAction,
      texture: discoBallEnvMap,
    });

    // setup running track model

    runningTrackGltf.scene.scale.set(0.1, 0.1, 0.1);
    runningTrackGltf.scene.position.set(2, 0, -5);
    runningTrackGltf.scene.rotation.y = Math.PI / 2;

    robot.updateActionComplement("Running", {
      object: runningTrackGltf.scene,
    });

    // setup iron throne model

    ironThroneGltf.scene.scale.set(3, 3, 3);
    ironThroneGltf.scene.position.set(0, -0.4, -1);

    robot.updateActionComplement("Sitting", {
      object: ironThroneGltf.scene,
    });

    robot.fadeToAction(DEFAULT_ACTION, 0);
  } catch (error) {
    alert(
      "Sinto muito. Tivemos um erro ao carregar os modelos 3D. Tente recarregar a página."
    );
  }
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsSelectRef = useRef<HTMLSelectElement>(null);
  const expressionsSelectRef = useRef<HTMLSelectElement>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const robot = new Robot({
      dimensions: getDimensions(),
      availableActions,
      availableExpressions,
    });

    containerRef.current?.appendChild(robot.renderer.domElement);

    const renderScene = () => {
      robot.updateMixers();

      requestAnimationFrame(renderScene);

      robot.render();
    };

    renderScene();

    // resize

    const handleResize = () => {
      robot.resize({ dimensions: getDimensions() });
    };

    window.addEventListener("resize", handleResize);

    // add select change events

    const actionsSelectElement = actionsSelectRef.current;
    const expressionsSelectElement = expressionsSelectRef.current;

    const handleActionChange = () => {
      const action = actionsSelectRef.current?.value;

      if (action) {
        robot.fadeToAction(action, 0.5);
      }
    };

    const handleExpressionChange = () => {
      const expression = expressionsSelectRef.current?.value;

      if (expression) {
        robot.changeExpression(expression);
      }
    };

    actionsSelectElement?.addEventListener("change", handleActionChange);

    expressionsSelectElement?.addEventListener(
      "change",
      handleExpressionChange
    );

    // load models

    loadAndSetupModels(robot).then(() => {
      setLoading(false);
    });

    return () => {
      robot.renderer.domElement.remove();

      window.removeEventListener("resize", handleResize);

      actionsSelectElement?.removeEventListener("change", handleActionChange);
      expressionsSelectElement?.removeEventListener(
        "change",
        handleExpressionChange
      );
    };
  }, []);

  return (
    <main className="container">
      <div className="actions">
        <h3>Full Stack Generation - Desafio técnico</h3>

        <div className="field">
          <label htmlFor="actions">Estado</label>

          <select
            id="actions"
            ref={actionsSelectRef}
            defaultValue={DEFAULT_ACTION}
          >
            {availableActions.map((state) => (
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
            defaultValue={DEFAULT_EXPRESSION}
          >
            {availableExpressions.map((expression) => (
              <option key={expression} value={expression}>
                {expression}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div ref={containerRef}></div>

      {loading && <LoadingOverlay />}
    </main>
  );
}

export default App;
