export class Game extends Phaser.Scene {
    constructor() {
        super({key: "game"});
    }

    preload() {
        this.load.image('background', 'hhhh.jpg');
        this.load.image('gameover', 'pngegg.png');
        this.load.image('mosca', 'mosca.png');

    }

    create() {
        this.add.image(400,250, 'background');
        this.gameoverImage = this.add.image(400, 90, 'gameover');


        this.gameoverImage = this.add.image(400, 300, 'mosca');

    }
}