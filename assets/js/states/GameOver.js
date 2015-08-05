function GameOver(phaser) {
  this.phaser = null;
  this.txt = null;
  this.button = null;

  var that = this;


  this.initialize = function(phaser) {
    this.phaser = phaser;
  }

  this.preload = function() {
    this.phaser.load.image('gameOver', './assets/images/Menu/GameOver.png');
    this.phaser.input.onDown.addOnce(this.exitToMenu, this);
  }


  this.create = function () {
    this.background = this.phaser.add.sprite(0, 0, 'gameOver');
    setToRatio(this.background, 100, 100);

    this.txt = this.phaser.add.text(ratio_x / 3, ratio_y / 2, "Game Over\nBest score : " + bestScore + "\nScore of the last game : " + score + "\nClick to quit", { font: "35px cursive", fill: "#089908", align: "left" });
    this.txt.anchor.setTo(0.5, 0.5);

    this.button = this.phaser.add.button(ratio_x - 50, 0, 'headphone', this.muteSound, this);
    this.button.scale.setTo(0.5, 0.5);

    resizeCallback = this.resize;
  }

  this.exitToMenu = function() {
    if (this.txt != null) {
      this.txt.destroy();
      this.phaser.state.start("MainMenu");
    }
  }

  this.resize = function() {
    setToRatio(that.background, 100, 100);
    that.txt.x = ratio_x / 3;
    that.txt.y = ratio_y / 2;
    that.txt.fontSize = (ratio_x > 600) ? 35 : 17;
    that.button.position.x = ratio_x - 50;
  }

  /*
    Because you are in an open space and you forgot your headphone (or because I can't listen this music anymore)
  */
  this.muteSound = function() {
    isMuted = !isMuted;
    music.volume = (isMuted) ? 0 : 0.3;
  }

  this.initialize(phaser);
}
