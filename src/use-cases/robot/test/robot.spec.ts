import * as THREE from "three";
import { describe, expect, test, vi } from "vitest";

import Robot from "../robot";
import { availableActions, availableExpressions } from "../../../lib/constants";

function mockRobot() {
  const robot = new Robot({
    dimensions: { width: 100, height: 100 },
    pixelRatio: 1,
    availableActions: availableActions,
    availableExpressions: availableExpressions,
  });

  return robot;
}

function mockRobotGltf() {
  const robotGltf = new THREE.Group();
  const robotHead = new THREE.Mesh();
  robotHead.name = "Head_4";
  availableExpressions.forEach((name) => {
    if (!robotHead.morphTargetDictionary) {
      robotHead.morphTargetDictionary = {};
    }

    robotHead.morphTargetDictionary[name] = 0;
  });
  robotHead.morphTargetInfluences = Array(availableExpressions.length).fill(0);
  robotGltf.children.push(robotHead);

  const animations = availableActions.map(
    (name) => new THREE.AnimationClip(name)
  );

  return { robotGltf, animations };
}

describe("Robot", () => {
  test("should initialize", () => {
    const robot = mockRobot();

    expect(robot).toBeDefined();
    expect(robot.scene).toBeDefined();
    expect(robot.camera).toBeDefined();
    expect(robot.dirLight).toBeDefined();
  });

  test("should setup loaded robot", () => {
    const robot = mockRobot();
    const { robotGltf, animations } = mockRobotGltf();

    robot.setupLoadedRobot(robotGltf, animations);

    expect(Object.keys(robot.state.actions)).toHaveLength(
      availableActions.length
    );
    expect(robot.state.expressions).toHaveLength(availableExpressions.length);
    expect(robot.state.activeAction).toBeNull();
    expect(robot.state.robotFace).toBeTruthy();
  });

  test("should throw if setupRenderer is not called", () => {
    const robot = mockRobot();
    const { robotGltf, animations } = mockRobotGltf();

    robot.setupLoadedRobot(robotGltf, animations);

    expect(() => robot.pmremGenerator).toThrowError(
      "`setupRender` must be called"
    );
    expect(() => robot.fadeToAction("Dance", 0)).toThrowError(
      "`setupRender` must be called"
    );
  });

  test("should fade to action", () => {
    const robot = mockRobot();
    const { robotGltf, animations } = mockRobotGltf();

    robot.setupLoadedRobot(robotGltf, animations);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(robot as any, "neutralEnvironment", "get").mockImplementationOnce(
      () => new THREE.Texture()
    );

    robot.fadeToAction("Dance", 0);

    expect(robot.state.activeAction).toBeTruthy();
    expect(robot.state.activeAction?.name).toBe("Dance");
    expect(robot.scene.background).toEqual(new THREE.Color(0x000000));
    expect(robot.dirLight.intensity).toEqual(10);
    expect(robot.camera.position.x).toEqual(-6);
    expect(robot.camera.position.y).toEqual(4);
    expect(robot.camera.position.z).toEqual(16);
  });

  test("should change expression", () => {
    const robot = mockRobot();
    const { robotGltf, animations } = mockRobotGltf();

    robot.setupLoadedRobot(robotGltf, animations);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(robot as any, "neutralEnvironment", "get").mockImplementationOnce(
      () => new THREE.Texture()
    );

    robot.changeExpression("Angry");

    expect(robot.state.robotFace?.morphTargetInfluences).toEqual(
      availableExpressions.map((name) => (name === "Angry" ? 1 : 0))
    );
  });
});
