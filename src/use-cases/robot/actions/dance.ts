import * as THREE from "three";
import RobotAction from "../robot-action";

export default class DanceRobotAction extends RobotAction {
  activateSpecific(): void {
    this.robot.scene.background = new THREE.Color(0x000000);
    this.robot.dirLight.color.set(THREE.Color.NAMES.purple);
    this.robot.dirLight.intensity = 10;

    this.robot.camera.position.set(-6, 4, 16);
  }
}
