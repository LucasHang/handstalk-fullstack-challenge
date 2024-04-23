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

export {
  assets,
  availableActions,
  availableExpressions,
  DEFAULT_ACTION,
  DEFAULT_EXPRESSION,
};
