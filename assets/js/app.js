/*
** All the variables I need.
*/
var game;           // My Phaser object
var myScenes = [];  // My different 'states'
var music = null;
var audioManager = null;

// For responsiveness
var ratio_x;
var ratio_y;
// 'Macro' for the game
var _NB_CASE_X = 40;  //50;
var _NB_CASE_Y = 29;  //37;
var resizeCallback = function() {};
var resizeId = 0;
// Global informations
var score = 0;
var bestScore = 0;
var level = 0;
var color = "green";
var isMuted = false;
// One block of the game
var box = {
  x: 10,
  y: 10
}

/*
** Used for responsiveness, calculate the new sizes on resize of the window
*/
var resizeCalc = function() {
  var w = window.innerWidth * 0.9;
  var h = window.innerHeight * 0.9;

  ratio_x = w;
  ratio_y = h;

  // With a 16/9 ratio, what is the short side ?
  if (w / 16 * 9 > h) {
    ratio_x = ~~(h * 16 / 9);
    ratio_y = Math.round(ratio_y);
  } else {
    ratio_x = Math.round(ratio_x);
    ratio_y = ~~(w * 9 / 16);
  }

  // Update the block size
  box.x = ratio_x / _NB_CASE_X;
  box.y = ratio_y / _NB_CASE_Y;
}


/*
** Utility classes
*/
var setToRatio = function(img, percentageX, percentageY, keepRatio) {
  if (keepRatio == undefined) {
    keepRatio = false;
  }

  if (keepRatio == false) {
    img.width = ratio_x * percentageX / 100;
    img.height = ratio_y * percentageY / 100;
  } else {
    var imgRatioX = img.width / ratio_x;
    var imgRatioY = img.height / ratio_y;
    if (imgRatioX > imgRatioY) {
      img.width = img.width / imgRatioX * percentageX / 100;
      img.height = img.height / imgRatioX * percentageY / 100;
    } else {
      img.width = img.width / imgRatioY * percentageX / 100;
      img.height = img.height / imgRatioY * percentageY / 100;
    }
  }
}

/*
  To manage the cookies. Found on developpez.com
*/
var createCookie = function(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

var readCookie = function(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}
/* end cookie */

// Upgrade of parseInt function
var toInt = function(value) {
  var tmp = parseInt(value);
  if (isNaN(tmp)) {
    return 0;
  }
  return tmp;
}

// Code find on internet to call the function only at the end of the event
var waitForFinalEvent = (function () {
  var timers = {};
  return function (callback, ms, uniqueId) {
    if (timers[uniqueId]) {
      clearTimeout (timers[uniqueId]);
    }
    timers[uniqueId] = setTimeout(callback, ms);
  };
})();

window.addEventListener("resize", function() {
  waitForFinalEvent(function(){
    resizeId++;
    resizeCalc();
    if (game.renderType === Phaser.WEBGL) {
      game.width = ratio_x;
      game.height = ratio_y;
    	game.renderer.resize(ratio_x, ratio_y);
      resizeCallback();
      game.scale.refresh();
    }
  }, 500, "event" + resizeId);
});

// Phaser initialization
resizeCalc();
game = new Phaser.Game(ratio_x, ratio_y, Phaser.AUTO, 'gameContainer');

myScenes.push(new Game(game));
myScenes.push(new GameOver(game));
myScenes.push(new Options(game));
myScenes.push(new MainMenu(game));

for (var i = 0 ; i < myScenes.length ; i++) {
  game.state.add(myScenes[i].constructor.name, myScenes[i]);
}

// Let's start the game !
game.state.start('MainMenu');
bestScore = toInt(readCookie("score"));
