import * as THREE from "three";
import RobotAction, { RobotActionProps } from "../robot-action";
import Robot from "../robot";

export default class SittingRobotAction extends RobotAction {
  constructor(robot: Robot, props: RobotActionProps) {
    super(robot, props);

    this.action.clampWhenFinished = true;
    this.action.loop = THREE.LoopOnce;
  }

  activateSpecific(): void {
    this.robot.scene.background = new THREE.Color(THREE.Color.NAMES.brown);
    this.robot.dirLight.color.set(THREE.Color.NAMES.red);

    this.robot.camera.position.set(0, 3, 8);
    this.robot.camera.lookAt(0, 2, 0);
  }
}
