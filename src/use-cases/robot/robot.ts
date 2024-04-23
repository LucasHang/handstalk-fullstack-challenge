import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import RobotAction, { RobotActionProps } from "./actions/robot-action";
import robotActionFactory from "./actions/robot-action-factory";

interface RobotProps {
  dimensions: { width: number; height: number };
  pixelRatio: number;
  availableActions: string[];
  availableExpressions: string[];
}

export default class Robot {
  private dimensions: { width: number; height: number };
  private pixelRatio: number;

  public camera: THREE.PerspectiveCamera;
  public scene: THREE.Scene;
  private _renderer: THREE.WebGLRenderer | null = null;
  private clock: THREE.Clock;

  public dirLight: THREE.DirectionalLight;

  private _pmremGenerator: THREE.PMREMGenerator | null = null;
  private _neutralEnvironment: THREE.Texture | null = null;

  private mixers: THREE.AnimationMixer[] = [];

  private availableActions: string[] = [];
  private availableExpressions: string[] = [];

  private actions: Record<string, RobotAction> = {};
  private expressions: string[] = [];

  private activeAction: RobotAction | null = null;
  private robotFace: THREE.Mesh | null = null;

  constructor({
    dimensions,
    pixelRatio,
    availableActions,
    availableExpressions,
  }: RobotProps) {
    this.dimensions = dimensions;
    this.pixelRatio = pixelRatio;
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
  }

  private get renderer() {
    if (!this._renderer) {
      throw setupRenderNoCalledError;
    }

    return this._renderer;
  }

  get pmremGenerator() {
    if (!this._pmremGenerator) {
      throw setupRenderNoCalledError;
    }

    return this._pmremGenerator;
  }

  private get neutralEnvironment() {
    if (!this._neutralEnvironment) {
      throw setupRenderNoCalledError;
    }

    return this._neutralEnvironment;
  }

  get state() {
    return {
      actions: this.actions,
      expressions: this.expressions,
      activeAction: this.activeAction,
      robotFace: this.robotFace,
    };
  }

  public setupRenderer(): {
    animate: typeof Robot.prototype.animate;
    resize: typeof Robot.prototype.resize;
    domElement: HTMLCanvasElement;
  } {
    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(this.dimensions.width, this.dimensions.height);

    this._pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();

    this._neutralEnvironment = this.pmremGenerator.fromScene(
      new RoomEnvironment()
    ).texture;

    return {
      animate: this.animate.bind(this),
      resize: this.resize.bind(this),
      domElement: this.renderer.domElement,
    };
  }

  private resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private animate() {
    this.updateMixers();
    this.render();

    requestAnimationFrame(this.animate.bind(this));
  }

  private updateMixers() {
    const delta = this.clock.getDelta();

    this.mixers.forEach((mixer) => mixer.update(delta));
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
    if (!this.availableActions.includes(name)) {
      return;
    }

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
    if (!this.availableExpressions.includes(name)) {
      return;
    }

    if (!this.robotFace) {
      return;
    }

    this.robotFace.morphTargetInfluences =
      this.robotFace.morphTargetInfluences?.map((_, i) =>
        i === this.expressions.indexOf(name) ? 1 : 0
      );
  }
}

const setupRenderNoCalledError = new Error(
  "Renderer not set. `setupRender` must be called first"
);
