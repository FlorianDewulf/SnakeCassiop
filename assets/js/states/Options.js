/*
  I hate menus, what a stupid idea
*/
function Options(phaser) {
  this.phaser = null;
  // Informations
  this.color = 0;
  this.level = 0;
  this.colorChoice = [];
  this.levelChoice = [];
  this.cursorPosition = 0;
  this.updateSpeed = 100;
  // Entities
  this.keyboard = null;
  this.enter = null;
  this.menu = [];
  this.arrow = null;
  this.background = null;
  this.button = null;

  var that = this;

  /*
    Constructor
    -------------
    phaser = The Phaser Object
  */
  this.initialize = function(phaser) {
    this.phaser = phaser;
    this.colorChoice = [
      "green",
      "red",
      "yellow",
      "blue"
    ];
    this.levelChoice = [
      "easy",
      "medium",
      "hard"
    ];
  }

  /*
    Function to preload assets
  */
  this.preload = function() {
    this.phaser.stage.backgroundColor = '#19E268';
    this.phaser.load.image('item-arrow-black', './assets/images/Menu/item-arrow-black.png');
    this.phaser.load.image('optionBackground', './assets/images/Menu/Options.png');
  },

  /*
    Function to create the scene
  */
  this.create = function () {
    this.color = 0;
    this.level = (level >= 0 && level < this.levelChoice.length) ? level : 0;
    for (var i = 0 ; i < this.colorChoice.length ; i++) {
      if (this.colorChoice[i] == color) {
        this.color = i;
      }
    }

    this.background = this.phaser.add.sprite(0, 0, 'optionBackground');
    setToRatio(this.background, 100, 100);

    this.button = this.phaser.add.button(ratio_x - 50, 0, 'headphone', this.muteSound, this);
    this.button.scale.setTo(0.5, 0.5);

    this.keyboard = this.phaser.input.keyboard.createCursorKeys();

    // Bind the enter for the pause
    this.enter = this.phaser.input.keyboard.addKey(Phaser.Keyboard.ENTER);

    this.menu.push({
      txt: this.phaser.add.text(ratio_x / 4, ratio_y / 3, "Color : " + this.colorChoice[this.color], { font: (2 * box.y) + "px cursive", fill: this.colorChoice[this.color], align: "left" }),
      offset: 0,
      conditions: [
        this.keyboard.left,
        this.keyboard.right
      ],
      callbacks: [
        function() { that.changeColor(-1); },
        function() { that.changeColor(1); }
      ]
    });
    this.menu.push({
      txt: this.phaser.add.text(ratio_x / 4, ratio_y / 3  + this.menu[0].txt.height, "Level : " + this.levelChoice[this.level], { font: (2 * box.y) + "px cursive", fill: "#000000", align: "left" }),
      offset: this.menu[0].txt.height,
      conditions: [
        this.keyboard.left,
        this.keyboard.right
      ],
      callbacks: [
        function() { that.changeLevel(-1); },
        function() { that.changeLevel(1); }
      ]
    });
    this.menu.push({
      txt: this.phaser.add.text(ratio_x / 4, ratio_y / 3 + this.menu[1].offset + this.menu[1].txt.height, "Back", { font: (2 * box.y) + "px cursive", fill: "#000000", align: "left" }),
      offset: this.menu[1].offset + this.menu[1].txt.height,
      conditions: [
        this.enter
      ],
      callbacks: [
        function() { that.backToMenu(); }
      ]
    });

    this.arrow = this.phaser.add.sprite(ratio_x / 4, ratio_y / 3, 'item-arrow-black');
    setToRatio(this.arrow, box.y - 3, box.y - 3, true);
    this.arrow.x -= this.arrow.width / 1.5;
    this.arrow.y -= (this.arrow.height / 5)

    this.lastUpdate = this.getTimeStamp();
    resizeCallback = this.resize;
  }

  /*
    Update function to refresh the scene
  */
  this.update = function() {
    if((this.getTimeStamp() - this.lastUpdate) < this.updateSpeed) { return; }  // To avoid a loop of button modification

    this.lastUpdate = this.getTimeStamp();

    // To change the menu button
    if (this.keyboard.down.isDown) {
      this.cursorPosition = (this.cursorPosition + 1) % this.menu.length;
    }
    if (this.keyboard.up.isDown) {
      this.cursorPosition = (this.cursorPosition - 1 < 0) ? this.menu.length - 1 : this.cursorPosition - 1;
    }

    //update position arrow
    this.arrow.y = ratio_y / 3 - (that.arrow.height / 5) + this.menu[this.cursorPosition].offset;

    for (var i = 0 ; i < this.menu[this.cursorPosition].conditions.length ; i++) {
      if (this.menu[this.cursorPosition].conditions[i].isDown) {
        this.menu[this.cursorPosition].callbacks[i]();
        break;
      }
    }
  }

  /*
    Callback for the resize event of the window (responsiveness)
  */
  this.resize = function() {
    setToRatio(that.background, 100, 100);
    var offset = 0;
    for (var i = 0 ; i < that.menu.length ; i++) {
      that.menu[i].txt.x = ratio_x / 4;
      that.menu[i].txt.y = ratio_y / 3 + offset;
      that.menu[i].offset = offset;
      that.menu[i].txt.setStyle({ font: (2 * box.y) + "px cursive", fill: this.colorChoice[this.color] });
      offset += that.menu[i].txt.height;
    }
    setToRatio(that.arrow, box.y - 3, box.y - 3, true);
    that.arrow.x = ratio_x / 4 - that.arrow.width / 1.5;
    that.arrow.y = ratio_y / 3 - (that.arrow.height / 5) + that.menu[that.cursorPosition].offset;
    that.button.position.x = ratio_x - 50;
  }

  /*
    Callback to change level
  */
  this.changeLevel = function(value) {
    this.level = (this.level + value) % this.levelChoice.length;
    if (this.level == -1)
      this.level = this.levelChoice.length - 1;
      this.menu[this.cursorPosition].txt.setText("Level : " + this.levelChoice[this.level]);
  }

  /*
    Callback to change color
  */
  this.changeColor = function(value) {
    this.color = (this.color + value) % this.colorChoice.length;
    if (this.color == -1)
      this.color = this.colorChoice.length - 1;
    this.menu[this.cursorPosition].txt.setText("Color : " + this.colorChoice[this.color]);
    this.menu[this.cursorPosition].txt.setStyle({ font: (2 * box.y) + "px cursive", fill: this.colorChoice[this.color] });
  }

  /*
    Callback to change level
  */
  this.backToMenu = function() {
    for (var i = 0 ; i < this.menu.length ; i++) {
      this.menu[i].txt.destroy();
    }
    this.menu = [];
    this.arrow.destroy();
    this.cursorPosition = 0;
    color = this.colorChoice[this.color];
    level = this.level;
    this.phaser.state.start("MainMenu");
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
