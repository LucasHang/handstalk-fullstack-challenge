import DanceRobotAction from "./actions/dance";
import RunningRobotAction from "./actions/running";
import SittingRobotAction from "./actions/sitting";
import WalkingRobotAction from "./actions/walking";
import Robot from "./robot";
import { RobotActionProps } from "./robot-action";

export default function robotActionFactory(
  robot: Robot,
  props: RobotActionProps
) {
  switch (props.name) {
    case "Walking":
      return new WalkingRobotAction(robot, props);
    case "Dance":
      return new DanceRobotAction(robot, props);
    case "Running":
      return new RunningRobotAction(robot, props);
    case "Sitting":
      return new SittingRobotAction(robot, props);
    default:
      throw new Error("Invalid action");
  }
}
