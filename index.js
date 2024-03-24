import { Game } from "./game";

const config = {
  type: Phaser.AUTO,
  with: 800,
  height: 800,
  scene: [Game],
  Physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 400 },
      debug: false,
    },
  },
};

var game = new Phaser.game(config);
