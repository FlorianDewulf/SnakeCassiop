function Game(phaser) {
  /*
    Gameplay entities
  */
  this.phaser = null;
  // Input management
  this.keybord = null;
  this.space = null;
  this.timeBetweenFrames = 100;
  this.lastUpdate = 0;
  this.direction = 'down';
  // Score management
  this.score = 0;
  this.scoreTxt = null;
  this.bonusSerie = 0;
  // Phaser object
  this.group = null;
  // Spawn management
  this.isSpawning = true;
  // informations for the pause
  this.isPaused = false;
  this.spawnTime = 0;
  this.spawnPause = 0;
  this.timeLost = 0;
  this.timeToWaitMax = 5000;
  // to stop the asynchronous event
  this.isEnded = false;
  this.suspendedEvent = [];
  /*
    DisplayObjects and informations about it
  */
  this.background = null;
  this.grid = [];
  this.yoshi = {
    sprite: null,
    coord: {
      x: 3,
      y: 3
    },
    originalSize: {
      width: 1,
      height: 1
    }
  };
  this.eggs = [{
    coord: {
      x: 3,
      y: 2
    },
    sprite: null
  }];
  this.eggRatio = 1;
  this.obj = [];
  this.obstacles = [];
  this.button = null;
  // Audio sounds
  this.deadSound = null;
  this.bonusSound = null;
  this.malusSound = null;
  // 'Macro'
  var _WIDTH_EGG = 20;
  var _WIDTH_OBJ = 80;
  var _WIDTH_FIRE = 200;
  var _TIME_TO_SPAWN = 5000;
  var _TIME_TO_DESTROY = 8000;
  var _MAX_OBJ_ON_THE_GROUND = 4;
  var _BONUS_POINT = 10;
  var _MALUS_POINT = -5;

  var idObj = 1;
  var that = this;  // to access to this inside the resize callback and play_pause callback

  /*
    Constructor
    -------------
    phaser = The Phaser Object
  */
  this.initialize = function(phaser) {
    this.phaser = phaser;
  }

  /*
    Function to preload assets
  */
  this.preload = function() {
    if (color != "green" && color != "yellow" && color != "blue" && color != "red") {
      color = "green";
    }

    this.phaser.load.atlas('yoshi', './assets/images/yoshi-' + color + '.png', './assets/images/Yoshi.json');
    this.phaser.load.atlas('fire', './assets/images/fire.png', './assets/images/fire.json');
    this.phaser.load.image('malus', './assets/images/malus.png');
    this.phaser.load.image('bonus', './assets/images/bonus.png');
    this.phaser.load.image('wall', './assets/images/wall.png');
    this.phaser.load.image('background', './assets/images/background.png');
    this.phaser.load.audio('deadSound', ['./assets/audio/owow.ogg']);
    this.phaser.load.audio('malusSound', ['./assets/audio/waaaaah.ogg']);
    this.phaser.load.audio('bonusSound', ['./assets/audio/yoshiii.ogg']);
  }

  /*
    Function to create the scene
  */
  this.create = function () {
    // Init values
    this.resetValues();
    if (this.deadSound == null) { this.deadSound = this.phaser.add.audio('deadSound'); }
    if (this.malusSound == null) { this.malusSound = this.phaser.add.audio('malusSound'); }
    if (this.bonusSound == null) { this.bonusSound = this.phaser.add.audio('bonusSound'); }

    this.keyboard = this.phaser.input.keyboard.createCursorKeys();
    // Bind the space for the pause
    this.space = this.phaser.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    this.space.onDown.add(this.play_pause, this);

    // set the background
    this.background = this.phaser.add.sprite(0, 0, 'background');
    setToRatio(this.background, 100, 100);

    this.button = this.phaser.add.button(ratio_x - 50, 0, 'headphone', this.muteSound, this);
    this.button.scale.setTo(0.5, 0.5);

    this.createGrid();

    // Init score
    var style = {
			font: "16px Arial",
			fill: "#000",
			align: "center"
		};
		this.scoreTxt = this.phaser.add.text(10, 10, '', style);
    this.updateScore(0);

    // Put the player on the grid
    this.yoshi.sprite = this.phaser.add.sprite(this.yoshi.coord.x * box.x, (this.yoshi.coord.y - 1) * box.y, 'yoshi');
    this.eggs[0].sprite = this.phaser.add.sprite(this.eggs[0].coord.x * box.x, (this.eggs[0].coord.y - 1) * box.y, 'yoshi');
    // Group it for the depthness
    this.group = this.phaser.add.group();
    this.group.add(this.yoshi.sprite);
    this.group.add(this.eggs[0].sprite);
    // Creation of the animations
    this.yoshi.sprite.animations.add('walkdown', Phaser.Animation.generateFrameNames('yoshiBottom', 0, 4, '', 4), 10, true);
    this.yoshi.sprite.animations.add('walkup', Phaser.Animation.generateFrameNames('yoshiTop', 0, 4, '', 4), 10, true);
    this.yoshi.sprite.animations.add('walkleft', Phaser.Animation.generateFrameNames('yoshiLeft', 0, 4, '', 4), 10, true);
    this.yoshi.sprite.animations.add('walkright', Phaser.Animation.generateFrameNames('yoshiRight', 0, 4, '', 4), 10, true);
    this.eggs[0].sprite.animations.add('egg', Phaser.Animation.generateFrameNames('yoshiEgg', 0, 1, '', 4), 1, true);
    // Default value because the direction is down
    this.yoshi.sprite.animations.play('walkdown');
    this.eggs[0].sprite.animations.play('egg');
    // Scale to the grid
    this.yoshi.originalSize = {
      width: this.yoshi.sprite.width,
      height: this.yoshi.sprite.height
    }
    this.yoshi.sprite.scale.setTo(box.x / this.yoshi.sprite.width, box.x / this.yoshi.sprite.width);
    this.eggRatio = box.x / _WIDTH_EGG;
    this.eggs[0].sprite.scale.setTo(this.eggRatio, this.eggRatio);

    this.generateMap();

    resizeCallback = this.resize;
  }

  /*
    Update function to refresh the scene
  */
  this.update = function() {
    if(this.isPaused || ((this.getTimeStamp() - this.lastUpdate) < this.timeBetweenFrames)) { return; }  // To avoid a loop of button modification

    if (this.isSpawning == true) {
      this.spawnTime = this.getTimeStamp();
      this.spawnPause = this.spawnTime;
      var id = setTimeout(function() {
        that.spawnSomething(id);
      }, 5000);
      this.suspendedEvent.push(id);
      this.isSpawning = false;
    }

    this.lastUpdate = this.getTimeStamp();

    this.moveMyYoshi(); // Move Yoshi

    /* Collision */
    // With an object
    for (var i = 0 ; i < this.obj.length ; i++) {
      if (this.isCollidingObject(this.yoshi.coord, this.obj[i].coord)) {
        this.obj[i].callback(this.obj[i]);
        if (this.isEnded) { return; }
      }
    }

    for (var i = 0 ; i < that.obstacles.length ; i++) {
        if (this.isCollidingObject(this.yoshi.coord, this.obstacles[i].coord)) {
          this.die(this.obstacles[i]);
          return;
        }
    }

    // With an Yosh'itself
    for (var i = 0 ; i < this.eggs.length ; i++) {
      if (this.isCollidingObject(this.yoshi.coord, this.eggs[i].coord)) {
        this.die(this.eggs[i]);
        return;
      }
    }

    // Modification of the direction
    if (this.keyboard.up.isDown && this.direction != 'down') {
      this.yoshi.sprite.animations.play('walkup');
      this.direction = 'up';
    } else if (this.keyboard.down.isDown && this.direction != 'up') {
      this.yoshi.sprite.animations.play('walkdown');
      this.direction = 'down';
    } else if (this.keyboard.left.isDown && this.direction != 'right') {
      this.yoshi.sprite.animations.play('walkleft');
      this.direction = 'left';
    } else if (this.keyboard.right.isDown && this.direction != 'left') {
      this.yoshi.sprite.animations.play('walkright');
      this.direction = 'right';
    }
    // Sort for the depthness. This second one is because the animation changement creates some trouble (an object above another one)
    this.group.sort('z', Phaser.Group.SORT_DESCENDING);
  }

  /*
    Function to move the character
  */
  this.moveMyYoshi = function() {
    // To move the first egg to the current yoshi position
    var oldPosition = {
      x: this.yoshi.coord.x,
      y: this.yoshi.coord.y,
      z: this.calcZ(this.yoshi.coord.x, this.yoshi.coord.y)
    }

    switch (this.direction) {
      case "down":
        this.yoshi.coord.y = (this.yoshi.coord.y + 1) % (_NB_CASE_Y);
        break;
      case "up":
        this.yoshi.coord.y = (this.yoshi.coord.y == 0) ? _NB_CASE_Y - 1 : this.yoshi.coord.y - 1;
        break;
      case "left":
        this.yoshi.coord.x = (this.yoshi.coord.x == 0) ? _NB_CASE_X - 1 : this.yoshi.coord.x - 1;
        break;
      case "right":
        this.yoshi.coord.x = (this.yoshi.coord.x + 1) % (_NB_CASE_X);
        break;
      default:
        break;
    }

    // update position
    this.yoshi.sprite.position.x = this.yoshi.coord.x * box.x;
    this.yoshi.sprite.position.y = (this.yoshi.coord.y - 1) * box.y;
    this.yoshi.sprite.z = this.calcZ(this.yoshi.coord.x, this.yoshi.coord.y);

    // for each egg, we move it to the previous position of the previous item
    for (var i = 0 ; i < this.eggs.length ; i++) {
      var tmp = {
        x: this.eggs[i].coord.x,
        y: this.eggs[i].coord.y,
        z: this.calcZ(this.eggs[i].coord.x, this.eggs[i].coord.y)
      }
      this.eggs[i].coord.x = oldPosition.x;
      this.eggs[i].coord.y = oldPosition.y;
      this.eggs[i].sprite.position.x = this.eggs[i].coord.x * box.x;
      this.eggs[i].sprite.position.y = (this.eggs[i].coord.y - 1) * box.y;
      this.eggs[i].sprite.z = this.calcZ(this.eggs[i].coord.x, this.eggs[i].coord.y);
      oldPosition = tmp;
    }

    // Sort for the depthness
    this.group.sort('z', Phaser.Group.SORT_DESCENDING);
  }

  /*
    Return the timestamp to not refresh too quickly
  */
  this.getTimeStamp = function() {
		return new Date().getTime();
	}

  /*
    To manage the pause and the animation
  */
  this.play_pause = function() {
    that.isPaused = !that.isPaused;
    if (that.isPaused) {
      this.spawnPause = this.getTimeStamp();
      for (var i = 0 ; i < this.obj.length ; i++) {
        this.obj[i].pauseTime = this.getTimeStamp();
      }
      //this.yoshi.sprite.animations.play('stop' + this.direction);
      this.yoshi.sprite.animations.stop();
    } else {
      this.timeLost += this.spawnPause - this.spawnTime;
      this.yoshi.sprite.animations.play('walk' + this.direction);
      for (var i = 0 ; i < this.obj.length ; i++) {
        this.obj[i].timeLost += this.obj[i].beginTime - this.obj[i].pauseTime;
      }
    }
  }

  /*
    To create a bonus or malus
  */
  this.spawnSomething = function(id) {
    that.deleteProc(id);
    if (that.isEnded) { return; }
    // To avoid spawn during the pause and to keep the delay, even with the pause
    if (that.timeLost != 0 || that.isPaused == true) {
      if (that.isPaused == true) {
        that.timeToWaitMax = Math.min(_TIME_TO_SPAWN, Math.max(that.timeToWaitMax - that.timeLost, 0));
      } else {
        that.spawnTime = that.getTimeStamp();
        that.spawnPause = that.spawnTime;
        that.timeLost = 0;
        that.timeToWaitMax = _TIME_TO_SPAWN;
      }
      var id = setTimeout(function() {
        that.spawnSomething(id);
      }, that.timeToWaitMax);
      that.suspendedEvent.push(id);
      return;
    }
    // To regulate the number of object in the game
    if (that.obj.length >= _MAX_OBJ_ON_THE_GROUND + (level * _MAX_OBJ_ON_THE_GROUND)) {
      return;
    }
    // Determine an available position
    var isSomethingHere = true;
    do {
      var randX = Math.round(Math.random() * (_NB_CASE_X - 2));
      var randY = Math.round(Math.random() * (_NB_CASE_Y - 2));
      var isSomethingHere = false;

      if (that.yoshi.coord.x == randX && that.yoshi.coord.y == randY) {
        isSomethingHere = true;
      } else {
        for (var i = 0 ; i < that.eggs.length ; i++) {
          if (that.eggs[i].coord.x == randX && that.eggs[i].coord.y == randY) { isSomethingHere = true; }
        }
        for (var i = 0 ; i < that.obj.length ; i++) {
          if (that.obj[i].coord.x == randX && that.obj[i].coord.y == randY) { isSomethingHere = true; }
        }
        for (var i = 0 ; i < that.obstacles.length ; i++) {
          if (that.obstacles[i].coord.x == randX && that.obstacles[i].coord.y == randY) { isSomethingHere = true; }
        }
      }
    } while (isSomethingHere == true);
    // Init the object
    var object = that.createEmptyObj(randX, randY);
    // Bonus = 1, malus = 0
    var r = Math.random();
    that.spawn(r, object);
    that.obj.push(object);
    // Sort for the depthness
    that.group.add(object.sprite);
    that.group.sort('z', Phaser.Group.SORT_DESCENDING);

    var ratio = box.x / object.sprite.width;
    object.sprite.scale.setTo(ratio, ratio);
    var id = setTimeout(function() {
      that.destroyObject(object, id);
    }, object.timeToWaitMax);
    that.suspendedEvent.push(id);

    that.spawnPause = that.spawnTime;
    that.isSpawning = true;
    that.timeLost = 0;
    that.timeToWaitMax = _TIME_TO_SPAWN;
  }

  /*
    Callback to destroy an object
  */
  this.destroyObject = function(object, id) {
    that.deleteProc(id);
    if (that.isEnded) { return; }
    // To avoid destruction during the pause and to keep the delay, even with the pause
    if (object.timeLost != 0 || that.isPaused == true) {
      if (that.isPaused == true) {
        object.timeToWaitMax = Math.min(_TIME_TO_SPAWN, Math.max(object.timeToWaitMax - object.timeLost, 0));
      } else {
        object.spawnTime = that.getTimeStamp();
        object.spawnPause = that.spawnTime;
        object.timeLost = 0;
        object.timeToWaitMax = _TIME_TO_SPAWN;
      }
      var id = setTimeout(function() {
        that.destroyObject(object, id);
      }, object.timeToWaitMax);
      that.suspendedEvent.push(id);
      return;
    } else {
      if (object.sprite != null) {
        object.sprite.destroy();
        object.sprite = null;
      }
      for (var i = 0 ; i < that.obj.length ; i++) {
        if (that.obj[i].id == object.id) { that.obj.splice(i, 1); }
      }
    }
  }

  /*
    Callback for the resize event of the window (responsiveness)
  */
  this.resize = function() {
    setToRatio(that.background, 100, 100);
    that.yoshi.sprite.position.x = that.yoshi.coord.x * box.x;
    that.yoshi.sprite.position.y = (that.yoshi.coord.y - 1) * box.y;
    that.yoshi.sprite.scale.setTo(box.x / that.yoshi.originalSize.width, box.x / that.yoshi.originalSize.width);
    that.eggRatio = box.x / _WIDTH_EGG;
    for (var i = 0 ; i < that.eggs.length ; i++) {
      that.eggs[i].sprite.position.x = that.eggs[i].coord.x * box.x;
      that.eggs[i].sprite.position.y = (that.eggs[i].coord.y - 1) * box.y;
      that.eggs[i].sprite.scale.setTo(that.eggRatio, that.eggRatio);
    }
    for (var i = 0 ; i < that.obj.length ; i++) {
      var ratio = box.x / ((that.obj[i].type == "fire") ? _WIDTH_FIRE : _WIDTH_OBJ);
      that.obj[i].sprite.position.x = that.obj[i].coord.x * box.x;
      that.obj[i].sprite.position.y = that.obj[i].coord.y * box.y;
      that.obj[i].sprite.scale.setTo(ratio, ratio);
    }
    for (var i = 0 ; i < that.obstacles.length ; i++) {
      var ratio = box.x / _WIDTH_OBJ;
      that.obstacles[i].sprite.position.x = that.obstacles[i].coord.x * box.x;
      that.obstacles[i].sprite.position.y = that.obstacles[i].coord.y * box.y;
      that.obstacles[i].sprite.scale.setTo(ratio, ratio);
    }
    for (var i = 0 ; i < that.grid.length ; i++) {
      that.phaser.stage.removeChild(that.grid[i]);
    }
    that.createGrid();
    that.button.position.x = ratio_x - 50;
  }

  /*
    To check collision between objects
  */
  this.isCollidingObject = function(yoshiCoord, objCoord) {
		return (yoshiCoord.x == objCoord.x && yoshiCoord.y == objCoord.y) ? true : false;
	}

  /*
    Yoshi is on an object
  */
  this.takeObj = function(objectCollider) {
    var object = {
      coord: {
        x: that.eggs[0].coord.x,
        y: that.eggs[0].coord.y
      },
      sprite: null
    };
    object.sprite = that.phaser.add.sprite(object.coord.x * box.x, (object.coord.y - 1) * box.y, 'yoshi');
    object.sprite.animations.add('egg', Phaser.Animation.generateFrameNames('yoshiEgg', 0, 1, '', 4), 1, true);
    object.sprite.animations.play('egg');
    object.sprite.scale.setTo(that.eggRatio, that.eggRatio);
    that.updateScore((objectCollider.type == "bonus") ? _BONUS_POINT : _MALUS_POINT);
    // sound
    if (objectCollider.type == "bonus" && !isMuted) {
      that.bonusSound.play();
    } else if (objectCollider.type != "bonus" && !isMuted) {
      that.malusSound.play();
    }
    that.group.add(object.sprite);
    that.eggs.push(object);
    if (objectCollider.sprite != null) {
      objectCollider.sprite.destroy();
      objectCollider.sprite = null;
    }
    for (var i = 0 ; i < that.obj.length ; i++) {
      if (that.obj[i].id == objectCollider.id) { that.obj.splice(i, 1); }
    }
    setTimeout(function() {
      that.isSpawning = true;
    }, 3000);
  }

  /*
    Yoshi is dying
  */
  this.die = function(object) {
    if (!isMuted) {
      that.deadSound.play();
    }
    that.isEnded = true;
    score = that.score;
    if (score > bestScore) {
      createCookie("score", score, 365);
      bestScore = score;
    }
    if (that.yoshi.sprite != null) {
      that.yoshi.sprite.destroy();
    }
    for (var i = 0 ; i < that.grid.length ; i++) {
      that.phaser.stage.removeChild(that.grid[i]);
    }
    for (var i = 0 ; i < that.eggs.length ; i++) {
      if (that.eggs[i].sprite != null) {
        that.eggs[i].sprite.destroy();
      }
    }
    for (var i = 0 ; i < that.obj.length ; i++) {
      if (that.obj[i].sprite != null) {
        that.obj[i].sprite.destroy();
      }
    }
    for (var i = 0 ; i < that.obstacles.length ; i++) {
      if (that.obstacles[i].sprite != null) {
        that.obstacles[i].sprite.destroy();
      }
    }
    for (var i = 0 ; i < that.suspendedEvent.length ; i++) {
      clearTimeout(that.suspendedEvent[i]);
    }

    // reset values for next time the scene is called
    that.suspendedEvent = [];
    that.grid = [];
    that.obj = [];
    that.obstacles = [];
    that.yoshi = {
      sprite: null,
      coord: {
        x: 3,
        y: 3
      },
      originalSize: {
        width: 1,
        height: 1
      }
    };
    that.eggs = [{
      coord: {
        x: 3,
        y: 2
      },
      sprite: null
    }];
    that.phaser.state.start('GameOver');
  }

  /*
    To update the score text/value
  */
  this.updateScore = function(point) {
    this.score += point;
    // Because every 5 bonus the 'snake' get a bonus point
    if (point == _BONUS_POINT) {
      this.bonusSerie++;
    } else {
      this.bonusSerie = 0;
    }
    // Here is the bonus point
    if (this.bonusSerie == 5) {
      this.bonusSerie = 0;
      this.score += (_BONUS_POINT * (level + 1));
    }
		this.scoreTxt.setText('SCORE: ' + this.score);
	}

  /*
    To create the grid of the map
  */
  this.createGrid = function() {
    this.grid = [];
    for (var i = 1 ; i <= _NB_CASE_X + 1 ; i++) {
      var line = new Phaser.Graphics(this.phaser, 0, 0);
      line.beginFill(0x000000);
      line.lineStyle(1, 0x000000, 0.1);
      line.moveTo(i * box.x, 0);
      line.lineTo(i * box.x, (_NB_CASE_Y + 1) * box.y);
      line.endFill();
      this.grid.push(this.phaser.stage.addChild(line));
    }
    for (var j = 1 ; j <= _NB_CASE_Y + 1 ; j++) {
      var line = new Phaser.Graphics(this.phaser, 0, 0);
      line.beginFill(0x000000);
      line.lineStyle(1, 0x000000, 0.1);
      line.moveTo(0, j * box.y);
      line.lineTo((_NB_CASE_X + 1) * box.x, j * box.y);
      line.endFill();
      this.grid.push(this.phaser.stage.addChild(line));
    }
  }

  /*
    Delete processID from array
  */
  this.deleteProc = function(value) {
    for (var i = 0 ; i < this.suspendedEvent.length ; i++) {
      if (this.suspendedEvent[i] == value) {
        this.suspendedEvent.splice(i, 1);
        return;
      }
    }
  }

  /*
    Spawn condition depending on the level choosen
  */
  this.spawn = function(valueRandom, object) {
    if (level == 0) {
      // Easy
      if (Math.round(valueRandom) == 0) {
        object.sprite = that.phaser.add.sprite(object.coord.x * box.x, object.coord.y * box.y, 'malus');
        object.type = "malus";
      } else {
        object.sprite = that.phaser.add.sprite(object.coord.x * box.x, object.coord.y * box.y, 'bonus');
        object.type = "bonus";
      }
      object.callback = that.takeObj;
    } else if (level == 1) {
      // Medium level
      if (valueRandom <= 0.4) {
        object.sprite = that.phaser.add.sprite(object.coord.x * box.x, object.coord.y * box.y, 'malus');
        object.type = "malus";
        object.callback = that.takeObj;
      } else if (valueRandom <= 0.8) {
        object.sprite = that.phaser.add.sprite(object.coord.x * box.x, object.coord.y * box.y, 'bonus');
        object.type = "bonus";
        object.callback = that.takeObj;
      } else {
        object.sprite = that.phaser.add.sprite(object.coord.x * box.x, object.coord.y * box.y, 'fire');
        object.sprite.animations.add('burn', Phaser.Animation.generateFrameNames('fire', 0, 15, '', 4), 16, true);
        object.sprite.play('burn');
        object.type = "fire";
        object.callback = that.die;
      }
    } else {
      // Hard, not implemented
      if (valueRandom <= 0.4) {
        object.sprite = that.phaser.add.sprite(object.coord.x * box.x, object.coord.y * box.y, 'malus');
        object.type = "malus";
        object.callback = that.takeObj;
      } else if (valueRandom <= 0.7) {
        object.sprite = that.phaser.add.sprite(object.coord.x * box.x, object.coord.y * box.y, 'bonus');
        object.type = "bonus";
        object.callback = that.takeObj;
      } else {
        object.sprite = that.phaser.add.sprite(object.coord.x * box.x, object.coord.y * box.y, 'fire');
        object.sprite.animations.add('burn', Phaser.Animation.generateFrameNames('fire', 0, 15, '', 4), 16, true);
        object.sprite.play('burn');
        object.type = "fire";
        object.callback = that.die;
      }
    }
  }

  /*
    Create a clone of an empty object
  */
  this.createEmptyObj = function(x, y) {
    var obj = JSON.parse(JSON.stringify({
      id: idObj,
      sprite: null,
      coord: {
        x: x,
        y: y
      },
      beginTime: that.getTimeStamp(),
      pauseTime: that.getTimeStamp(),
      timeLost: 0,
      timeToWaitMax: _TIME_TO_DESTROY,
      type: "",
      callback: function() {}
    }));
    idObj++;
    return obj;
  }

  /*
    To reset the values of this object
  */
  this.resetValues = function() {
    this.lastUpdate = 0;
    this.direction = 'down';
    this.score = 0;
    this.bonusSerie = 0;
    this.isSpawning = true;
    this.isPaused = false;
    this.spawnTime = 0;
    this.spawnPause = 0;
    this.timeLost = 0;
    this.timeToWaitMax = 5000;
    this.isEnded = false;
    this.suspendedEvent = [];
  }

  /*
    Because each "z" must to be different, we calculate the number of the block where the object is
  */
  this.calcZ = function(x, y) {
    return y * _NB_CASE_X + x;
  }

  /*
    Because when it's easy, it's not funny
  */
  this.generateMap = function() {
    if (level == 0) {
      return;
    } else if (level == 1) {
      /*
        Medium difficulty
      */

      var ratio = box.x / _WIDTH_OBJ;

      // First wall
      for (var i = 0 ; i < 9 ; i++) {
        var obs = { sprite: null, coord: { x: 10, y: 5 + i } }
        obs.sprite = this.phaser.add.sprite(obs.coord.x * box.x, obs.coord.y * box.y, 'wall');
        obs.sprite.scale.setTo(ratio, ratio);
        obs.sprite.z = this.calcZ(obs.coord.x, obs.coord.y);
        this.obstacles.push(obs);
        this.group.add(obs.sprite);
      }
      // Second Wall
      for (var i = 0 ; i < 20 ; i++) {
        if (i < 8 || i > 12) {
          var obs = { sprite: null, coord: { x: 10 + i, y: 14 } }
          obs.sprite = this.phaser.add.sprite(obs.coord.x * box.x, obs.coord.y * box.y, 'wall');
          obs.sprite.scale.setTo(ratio, ratio);
          obs.sprite.z = this.calcZ(obs.coord.x, obs.coord.y);
          this.obstacles.push(obs);
          this.group.add(obs.sprite);
        }
      }
      // Last Wall
      for (var i = 0 ; i < 9 ; i++) {
        var obs = { sprite: null, coord: { x: 30, y: 14 + i } }
        obs.sprite = this.phaser.add.sprite(obs.coord.x * box.x, obs.coord.y * box.y, 'wall');
        obs.sprite.scale.setTo(ratio, ratio);
        obs.sprite.z = this.calcZ(obs.coord.x, obs.coord.y);
        this.obstacles.push(obs);
        this.group.add(obs.sprite);
      }
    } else {
      /*
        Hard difficulty
      */

      var ratio = box.x / _WIDTH_OBJ;

      // First wall
      for (var i = 0 ; i < 19 ; i++) {
        if (i < 3 || (i > 6 && i < 13) || i > 15) {
          var obs = { sprite: null, coord: { x: 10, y: 5 + i } }
          var obsbis = { sprite: null, coord: { x: 30, y: 5 + i } }
          obs.sprite = this.phaser.add.sprite(obs.coord.x * box.x, obs.coord.y * box.y, 'wall');
          obsbis.sprite = this.phaser.add.sprite(obsbis.coord.x * box.x, obsbis.coord.y * box.y, 'wall');
          obs.sprite.scale.setTo(ratio, ratio);
          obsbis.sprite.scale.setTo(ratio, ratio);
          obs.sprite.z = this.calcZ(obs.coord.x, obs.coord.y);
          obsbis.sprite.z = this.calcZ(obsbis.coord.x, obsbis.coord.y);
          this.obstacles.push(obs);
          this.obstacles.push(obsbis);
          this.group.add(obs.sprite);
          this.group.add(obsbis.sprite);
        }
      }
      // Second Wall
      for (var i = 0 ; i < 20 ; i++) {
        if (i < 8 || i > 12) {
          var obs = { sprite: null, coord: { x: 10 + i, y: 14 } }
          obs.sprite = this.phaser.add.sprite(obs.coord.x * box.x, obs.coord.y * box.y, 'wall');
          obs.sprite.scale.setTo(ratio, ratio);
          obs.sprite.z = this.calcZ(obs.coord.x, obs.coord.y);
          this.obstacles.push(obs);
          this.group.add(obs.sprite);
        }
      }
    }
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
