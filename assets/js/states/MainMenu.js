function MainMenu(phaser) {
  this.phaser = null;
  this.background = null;
  this.enter = null;
  this.menus = [];
  this.buttons = [];
  this.currentMenu = 0;
  this.keyboard = null;
  this.lastUpdate = 0;
  this.updateSpeed = 100;
  this.arrow = null;
  this.button = null;

  var that = this;  // to access to this inside the resize callback

  /*
    Constructor
    -------------
    phaser = The Phaser Object
  */
  this.initialize = function(phaser) {
    this.phaser = phaser;
    this.menus = [
      { menuName: "Game", img: "item-play" },
      { menuName: "Options", img: "item-option" }
    ];
  }

  /*
    Function to preload assets
  */
  this.preload = function() {
    this.phaser.load.audio('shadow', ['./assets/audio/ShadowsAwait.ogg']);// ogg because Firefox don't like mp3
    this.phaser.load.image('menuBackground', './assets/images/Menu/Background.png');
    this.phaser.load.image('item-play', './assets/images/Menu/item-play.png');
    this.phaser.load.image('item-option', './assets/images/Menu/item-option.png');
    this.phaser.load.image('item-arrow-white', './assets/images/Menu/item-arrow-white.png');
    this.phaser.load.image('headphone', './assets/images/Menu/headphone.png');
  }

  /*
    Function to create the scene
  */
  this.create = function () {
    if (music == null) {
      music = this.phaser.add.audio('shadow', 0.3, true);
      music.play();
    }

    this.keyboard = this.phaser.input.keyboard.createCursorKeys();

    // Bind the enter for the pause
    this.enter = this.phaser.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    this.enter.onDown.add(this.changeScene, this);

    this.background = this.phaser.add.sprite(0, 0, 'menuBackground');
    setToRatio(this.background, 100, 100);
    this.currentMenu = 0;

    this.button = this.phaser.add.button(ratio_x - 50, 0, 'headphone', this.muteSound, this);
    this.button.scale.setTo(0.5, 0.5);

    var offset = 0;
    for (var i = 0 ; i < this.menus.length ; i++) {
      var button = this.game.add.sprite(ratio_x / 6, 2 * ratio_y / 3 + offset, this.menus[i].img);
      this.buttons.push({
        obj: button,
        offset: offset
      });
      setToRatio(button, 30, 30, true);
      offset += button.height;
    }

    this.arrow = this.phaser.add.sprite(ratio_x / 6, 2 * ratio_y / 3 - 10, 'item-arrow-white');
    setToRatio(this.arrow, 20, 20, true);
    this.arrow.x -= this.arrow.width / 1.5;

    this.lastUpdate = this.getTimeStamp();
    resizeCallback = this.resize;
  }

  /*
    Callback for the buttons to change scene
  */
  this.changeScene = function() {
    for (var i = 0 ; i < this.buttons.length ; i++) {
      this.buttons[i].obj.destroy();
    }
    this.button.destroy();
    this.buttons = [];
    this.phaser.state.start(this.menus[this.currentMenu].menuName);
  }

  /*
    Update function to refresh the scene
  */
  this.update = function() {
    if((this.getTimeStamp() - this.lastUpdate) < this.updateSpeed) { return; }  // To avoid a loop of button modification

    this.lastUpdate = this.getTimeStamp();

    // To change the menu button
    if (this.keyboard.down.isDown) {
      this.currentMenu = (this.currentMenu + 1) % this.menus.length;
    }
    if (this.keyboard.up.isDown) {
      this.currentMenu = (this.currentMenu - 1 < 0) ? this.menus.length - 1 : this.currentMenu - 1;
    }

    //update position arrow
    this.arrow.y = 2 * ratio_y / 3 + this.buttons[this.currentMenu].offset - 10;
  }

  /*
    Callback for the resize event of the window (responsiveness)
  */
  this.resize = function() {
    setToRatio(that.background, 100, 100);
    var offset = 0;
    for (var i = 0 ; i < that.buttons.length ; i++) {
      setToRatio(that.buttons[i].obj, 30, 30, true);
      that.buttons[i].obj.x = ratio_x / 6;
      that.buttons[i].obj.y = 2 * ratio_y / 3 + offset;
      that.buttons[i].offset = offset;
      offset += that.buttons[i].obj.height;
    }
    setToRatio(that.arrow, 20, 20, true);
    that.arrow.x = ratio_x / 6 - that.arrow.width / 1.5;
    that.arrow.y = 2 * ratio_y / 3 + that.buttons[that.currentMenu].offset;
    that.button.position.x = ratio_x - 50;
  }

  /*
    Return the timestamp to not refresh too quickly
  */
  this.getTimeStamp = function() {
		return new Date().getTime();
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
