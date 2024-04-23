import * as THREE from "three";
import Robot from "../robot";

export interface RobotActionProps {
  name: string;
  action: THREE.AnimationAction;
  complement?: {
    object?: THREE.Group<THREE.Object3DEventMap>;
    action?: THREE.AnimationAction;
    texture?: THREE.Texture;
  };
}

export default abstract class RobotAction {
  name: string;
  action: THREE.AnimationAction;
  complement: RobotActionProps["complement"];

  constructor(protected robot: Robot, props: RobotActionProps) {
    this.name = props.name;
    this.action = props.action;
    this.complement = props.complement;
  }

  abstract activateSpecific(): void;

  protected activateComplement(): void {
    if (this.complement?.texture) {
      this.robot.scene.environment = this.complement.texture;
    }

    if (this.complement?.object) {
      this.robot.scene.add(this.complement.object);
    }

    if (this.complement?.action) {
      this.complement.action.play();
    }
  }

  protected deactivateComplement(): void {
    // texture does not need to be removed here, it is removed by default in robot.ts

    if (this.complement?.object) {
      this.robot.scene.remove(this.complement.object);
    }

    if (this.complement?.action) {
      this.complement.action.stop();
    }
  }

  activate(): void {
    this.activateComplement();
    this.activateSpecific();
  }

  deactivate(): void {
    this.deactivateComplement();
    // deactivateSpecific is not called here, because it is not necessary to override it in every action
  }

  updateComplement(complement: RobotActionProps["complement"]) {
    this.complement = {
      ...this.complement,
      ...complement,
    };
  }
}
