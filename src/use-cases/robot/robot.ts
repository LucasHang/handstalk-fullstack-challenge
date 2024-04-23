import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import RobotAction, { RobotActionProps } from "./robot-action";
import robotActionFactory from "./robot-action-factory";

interface RobotProps {
  dimensions: { width: number; height: number };
  availableActions: string[];
  availableExpressions: string[];
}

export default class Robot {
  public camera: THREE.PerspectiveCamera;
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  public dirLight: THREE.DirectionalLight;

  public pmremGenerator: THREE.PMREMGenerator;
  public neutralEnvironment: THREE.Texture;

  private mixers: THREE.AnimationMixer[] = [];

  private availableActions: string[] = [];
  private availableExpressions: string[] = [];

  private actions: Record<string, RobotAction> = {};
  private expressions: string[] = [];

  private activeAction: RobotAction | null = null;
  private robotFace: THREE.Mesh | null = null;

  constructor({
    dimensions,
    availableActions,
    availableExpressions,
  }: RobotProps) {
    this.availableActions = availableActions;
    this.availableExpressions = availableExpressions;

    this.camera = new THREE.PerspectiveCamera(
      45,
      dimensions.width / dimensions.height,
      0.25,
      100
    );
    this.camera.position.set(-5, 3, 10);
    this.camera.lookAt(0, 2, 0);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe0e0e0);
    this.scene.fog = new THREE.Fog(0xe0e0e0, 20, 100);

    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(dimensions.width, dimensions.height);

    // lights

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 3);
    this.dirLight.position.set(0, 20, 10);
    this.scene.add(this.dirLight);

    // ground

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000),
      new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);

    const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    this.scene.add(grid);

    // environment

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();

    this.neutralEnvironment = this.pmremGenerator.fromScene(
      new RoomEnvironment()
    ).texture;
  }

  public resize({ dimensions }: Pick<RobotProps, "dimensions">) {
    this.camera.aspect = dimensions.width / dimensions.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(dimensions.width, dimensions.height);
  }

  public updateMixers() {
    const delta = this.clock.getDelta();

    this.mixers.forEach((mixer) => mixer.update(delta));
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public setupLoadedRobot(
    model: THREE.Group<THREE.Object3DEventMap>,
    animations: THREE.AnimationClip[]
  ) {
    const mixer = new THREE.AnimationMixer(model);

    // define actions
    for (let i = 0; i < animations.length; i++) {
      const clip = animations[i];

      if (!this.availableActions.includes(clip.name)) {
        continue;
      }

      const action = mixer.clipAction(clip);

      this.actions[clip.name] = robotActionFactory(this, {
        name: clip.name,
        action,
      });
    }

    // define expressions
    this.robotFace = (model.getObjectByName("Head_4") as THREE.Mesh) || null;
    this.expressions = this.robotFace?.morphTargetDictionary
      ? Object.keys(this.robotFace.morphTargetDictionary).filter((name) =>
          this.availableExpressions.includes(name)
        )
      : [];

    this.mixers.push(mixer);

    return model;
  }

  public updateActionComplement(
    actionName: string,
    complement: RobotActionProps["complement"]
  ) {
    this.actions[actionName]?.updateComplement(complement);
  }

  public addMixerAndClipAction(
    model: THREE.Group<THREE.Object3DEventMap>,
    animation: THREE.AnimationClip
  ) {
    const mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(animation);

    this.mixers.push(mixer);

    return action;
  }

  public fadeToAction(name: string, duration: number) {
    const previousAction = this.activeAction;
    this.activeAction = this.actions[name];

    if (previousAction && previousAction.name !== this.activeAction.name) {
      previousAction.action.fadeOut(duration);
    }

    this.activeAction.action
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();

    this.resetDefaultScene();

    this.activeAction.activate();
  }

  private resetDefaultScene() {
    this.scene.environment = this.neutralEnvironment;
    this.scene.background = new THREE.Color(0xe0e0e0);
    this.dirLight.color.set(0xffffff);
    this.dirLight.intensity = 3;
    this.camera.position.set(-5, 3, 10);
    this.camera.lookAt(0, 2, 0);

    // also remove actions complements
    Object.keys(this.actions).forEach((actionName) => {
      this.actions[actionName].deactivate();
    });
  }

  public changeExpression(name: string) {
    if (!this.robotFace) {
      return;
    }

    this.robotFace.morphTargetInfluences =
      this.robotFace.morphTargetInfluences?.map((_, i) =>
        i === this.expressions.indexOf(name) ? 1 : 0
      );
  }
}
