import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import "./App.css";
import Robot from "./use-cases/robot/robot";
import { LoadingOverlay } from "./components/loading-overlay/loading-overlay";
import {
  DEFAULT_ACTION,
  DEFAULT_EXPRESSION,
  assets,
  availableActions,
  availableExpressions,
} from "./lib/constants";

function getDimensions(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
}

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
    robot.pmremGenerator.dispose();

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
      pixelRatio: window.devicePixelRatio,
      availableActions: availableActions,
      availableExpressions: availableExpressions,
    });

    const { domElement, animate, resize } = robot.setupRenderer();

    containerRef.current?.appendChild(domElement);

    animate();

    // resize

    const handleResize = () => {
      const { width, height } = getDimensions();
      resize(width, height);
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

    // load models and start action

    loadAndSetupModels(robot).then(() => {
      setLoading(false);

      robot.fadeToAction(DEFAULT_ACTION, 0);
    });

    return () => {
      domElement.remove();

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
