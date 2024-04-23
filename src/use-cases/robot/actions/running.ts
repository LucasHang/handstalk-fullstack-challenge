import * as THREE from "three";
import RobotAction from "../robot-action";

export default class RunningRobotAction extends RobotAction {
  activateSpecific(): void {
    this.robot.scene.background = new THREE.Color(THREE.Color.NAMES.lightblue);
    this.robot.dirLight.color.set(THREE.Color.NAMES.green);

    this.robot.camera.position.set(0, 2, 10);
    this.robot.camera.lookAt(0, 2, -5);
  }
}
