"use strict";
/*
MIT License

Copyright (c) 2020 Fredy Rogez (https://rogez.games)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const game = {
  debug: false,
  width: 960,
  height: 540,
  limitFPS: 1000 / 60,
  canvas: document.getElementById("cvs"),
  grav: 0.001,
  maxVx: 3,
  maxVy: 3,
  gridSize: 16,
  vxLandingMax: 0.3,
  vyLandingMax: 0.3,
  angleLandingMax: 4,
  score: 0,
  state: "run",
  game_over_timeout: 0,
  game_win_timeout: 0
};

const sprites = {
  lander: new Image(),
  blast: new Image()
}
sprites.lander.src = 'img/lander-sprites.png';
sprites.blast.src = 'img/boom-sprites.png';

function wait(ms) {
  const t1 = performance.now();
  let t2 = null;
  do {
    t2 = performance.now();
  } while (t2 - t1 < ms);
}

function distance(x0, y0, x1, y1) {
  return Math.hypot(x1 - x0, y1 - y0);
}

function collisionTest(x0, y0, x1, y1, r) {
  if (Math.hypot(x1 - x0, y1 - y0) <= r) {
    return true;
  }
  else {
    return false;
  }
}

//// debugRender
function debugRender() {
  const ctx = game.ctx;

  ctx.save();

  ctx.lineStyle = "#00ff00";
  ctx.strokeRect(myLander.x, myLander.y, 20, 20);

  ctx.restore();

}

//// Lander
class Lander {
  constructor(x, y, ctx) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.img = sprites.lander;
    this.spriteOffset = 0;

    this.img.onload = function () {
      console.log('# sprite lander loaded #');
    };

    this.spriteWidth = 20;
    this.spriteHeight = 22;
    this.spriteCenter = { x: 10, y: 10 };

    this.ctx = ctx;
    this.enginePower = 0;
    this.state = 'flying'; // 'landed', 'crashed'
    this.burstState = false;

    this.vxLandingMax = game.vxLandingMax; 
    this.vyLandingMax = game.vyLandingMax;
    this.angleLandingMax = game.angleLandingMax;
  }

  rotate(dir) {
    if (dir === 'right') {
      this.angle += 1;
    } else if (dir === 'left') {
      this.angle -= 1;
    }
  }

  burst() {
    this.enginePower = 2;
    this.vx -= Math.cos(((this.angle + 90) * Math.PI) / 180) * 0.04;
    this.vy -= Math.sin(((this.angle + 90) * Math.PI) / 180) * 0.04;
  }

  update() {
    if (this.state === "flying") {
      this.vy += game.grav * game.dt;
      this.x += this.vx;
      this.y += this.vy;
    }

    if (this.state === 'landed') {
      this.vx = 0;
      this.vy = 0;
    }

    if (this.state === 'crashed') {
      if (this.burstState === 0) {
        this.img = sprites.lander;
      }
      this.vx = 0;
      this.vy = 0;
    }
  }

  isColliding(x1, y2, r) {
    return collisionTest(this.x + this.spriteWidth / 2,
      this.y + this.spriteHeight / 2,
      x1,
      y2,
      this.spriteWidth / 2 + r);
  }

  groundContact() {
    const x1 = Math.max(Math.round(this.x - this.spriteWidth / 2), 0);
    const x2 = Math.min(Math.round(this.x + this.spriteWidth / 2), game.width - 1);
    const y = Math.round(this.y);

    for (let i = x1; i <= x2; i++) {
      if (this.isColliding(i, myGround.heights[i], 0)) {
        return true;
      }
    }
    return false;
  }

  padZone() {
    if ((this.x >= myGround.landindPad.x) && (this.x <= myGround.landindPad.x + myGround.landindPad.width - this.spriteWidth)) {
      return true;
    }
    else {
      return false;
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    switch (this.state) {
      case 'flying':
        ctx.translate(this.x + this.spriteWidth / 2, this.y + this.spriteHeight / 2);
        ctx.rotate((this.angle * Math.PI) / 180);
        ctx.translate(-this.x - this.spriteWidth / 2, -this.y - this.spriteHeight / 2);

        switch (this.enginePower) {
          case 1:
            this.spriteOffset = 20;
            break;
          case 2:
            this.spriteOffset = 40;
            break;
          default:
            this.spriteOffset = 0;
        }

        ctx.drawImage(
          this.img,
          this.spriteOffset,
          0,
          this.spriteWidth,
          this.spriteHeight,
          this.x,
          this.y,
          this.spriteWidth,
          this.spriteHeight
        );
        break;

      case 'landed':
        ctx.drawImage(
          this.img,
          0,
          0,
          this.spriteWidth,
          this.spriteHeight,
          this.x,
          this.y,
          this.spriteWidth,
          this.spriteHeight          
        );        
        break;

      case 'crashed':
        if (!this.burstState) {
          this.spriteOffset = 0;
          setTimeout(() => this.spriteOffset = 64, 75);
          setTimeout(() => this.spriteOffset = 64 * 2, 75 * 2);
          setTimeout(() => this.spriteOffset = 64, 75 * 3);
          setTimeout(() => this.spriteOffset = 0, 75 * 4);
          setTimeout(() => this.spriteOffset = -64, 75 * 5);
          this.burstState = true;
        }

        ctx.drawImage(
          sprites.blast,
          this.spriteOffset,
          0,
          64,
          64,
          this.x - ((64 - 20) / 2),
          this.y - ((64 - 22) / 2),
          64,
          64
        );

        break;
    }

    ctx.restore();
  }
}

//// LandingPad
class LandingPad {
  constructor(x, y, width) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.blink = true;
    this.blinkLandHere = this.blinkLandHere.bind(this);
    this.blinkEnd = 14;
    this.blinkLandHere();
  }

  blinkLandHere() {
    this.blinkEnd--;
    if (this.blinkEnd > 0) {
      this.blink = !this.blink;
      const t = this.blink ? 250 : 30;
      setTimeout(this.blinkLandHere, t);
    }
  }

  render() {
    const ctx = game.ctx;

    ctx.font = "15px sans-serif";
    const info = "LAND HERE !";
    const arrow = "⮟";

    const infoX = this.x - Math.round(ctx.measureText(info).width / 2) + this.width / 2;
    const arrowX = this.x - Math.round(ctx.measureText(arrow).width / 2) + this.width / 2;

    ctx.save();

    if (this.blink) {
      ctx.fillStyle = "#00ff00";
      ctx.fillText(info, infoX, this.y - 30);
      ctx.fillText(arrow, arrowX, this.y - 10);
    }
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(this.x, this.y, this.width, 2);

    ctx.restore();
  }
}

//// Ground
class Ground {
  constructor({ landindPadSize = 32 } = {}) {
    this.landindPadSize = landindPadSize;
    this.path = [];
    this.genRandomPath();
    this.heights = Array(game.width);
    this.heightsInit();
  }

  genRandomPath() {
    const groundNbPoints = game.width / game.gridSize;

    this.path[0] = [];
    this.path[0][0] = 0;
    this.path[0][1] = Math.round(Math.random() * 200 + 320);
    this.path[0][2] = Math.round(Math.random() * 200 + 220);

    const landingPadCellSize = this.landindPadSize / game.gridSize;
    const landingPadCellX = Math.round(
      Math.random() * (groundNbPoints - landingPadCellSize - 4) +
      landingPadCellSize / 2
    );

    for (let p = 1; p <= groundNbPoints; p++) {
      this.path[p] = [];
      this.path[p][0] = p * game.gridSize;
      if (p > landingPadCellX && p <= landingPadCellX + landingPadCellSize) {
        this.path[p][1] = this.path[p - 1][1];
      } else {
        this.path[p][1] = Math.max(
          128,
          Math.min(
            game.height - 16,
            this.path[p - 1][1] + Math.random() * 60 - 30
          )
        );
      }
      this.path[p][2] = Math.max(
        128,
        Math.min(
          this.path[p][1] - 16,
          this.path[p - 1][2] + Math.random() * 60 - 30
        )
      );
    }

    this.landindPad = new LandingPad(
      this.path[landingPadCellX][0],
      this.path[landingPadCellX][1],
      this.landindPadSize
    );
  }

  heightsInit() {
    for (let p = 0; p < this.path.length - 1; p++) {
      const x1 = this.path[p][0];
      const y1 = this.path[p][1];
      const x2 = this.path[p + 1][0];
      const y2 = this.path[p + 1][1];

      for (let xp = x1; xp < x2; xp++) {
        const yp = (y1 * (x2 - xp) + y2 * (xp - x1)) / (x2 - x1);
        this.heights[xp] = Math.round(yp);
      }
    }
    this.heights[this.heights.length - 1] = this.path[this.path.length - 1][1];
  }

  render() {
    const ctx = game.ctx;

    ctx.beginPath();

    ctx.moveTo(0, game.height - 1);

    for (let p = 0; p < this.path.length; p++) {
      ctx.lineTo(this.path[p][0], this.path[p][2]);
    }

    ctx.lineTo(game.width - 1, game.height - 1);
    ctx.lineTo(0, game.height - 1);

    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.fillStyle = "#AD4F0933";
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "#AD4F09DD";
    ctx.moveTo(0, game.height - 1);

    for (let p = 0; p < this.path.length; p++) {
      ctx.lineTo(this.path[p][0], this.path[p][1]);
    }

    ctx.lineTo(game.width - 1, game.height - 1);
    ctx.lineTo(0, game.height - 1);
    ctx.fill();

    this.landindPad.render();
  }
}

//// ShootingStar
class ShootingStar {
  constructor() {
    this.init();
  }

  init() {
    this.x = Math.trunc(Math.random() * (game.width - 20) + 10);
    this.y = -2;
    this.speed = Math.random();
    this.vx = Math.random() * 3 - 3;
    this.vy = Math.random() * 3 + 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.y > game.height || this.x > game.width || this.x < 0) {
      this.init();
    }
  }

  render() {
    const ctx = game.ctx;
    ctx.fillStyle = "#888888ff";
    ctx.fillRect(this.x, this.y, 3, 3);
  }
}

//// BackGround
class BackGround {
  constructor() {
    this.stars = [];
    this.shootingStars = [];
    this.nbShootingStars = Math.round(Math.random() * 2 + 1);

    for (let i = 0; i < this.nbShootingStars; i++) {
      this.shootingStars.push(new ShootingStar());
    }

    for (let i = 0; i < 50; i++) {
      this.stars[i] = [
        Math.trunc(Math.random() * game.width),
        Math.trunc(Math.random() * game.height)
      ];
    }
  }

  update() {
    this.shootingStars.forEach(s => s.update());
  }

  render() {
    const ctx = game.ctx;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, game.width, game.height);

    ctx.fillStyle = "#88888855";
    for (let i = 0; i < this.stars.length; i++) {
      ctx.fillRect(this.stars[i][0], this.stars[i][1], 2, 2);
    }
    this.shootingStars.forEach(s => s.render());
  }
}

//// HUD
class Hud {
  constructor() {
    this.refresh = 0;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.altitude = 0;
  }

  render() {
    const ctx = game.ctx;

    if (this.refresh >= 10) {
      this.vx = Math.round(myLander.vx * 100) / 100;
      this.vy = Math.round(myLander.vy * 100) / 100;
      this.angle = Math.round(myLander.angle * 100) / 100;
      //this.altitude = (game.height-myLander.y) - (game.height - myGround.heights[Math.round(myLander.x)]) ;
      this.altitude = Math.round(
        myGround.heights[Math.round(myLander.x + myLander.spriteCenter.x)] -
        myLander.y -
        myLander.spriteHeight
      );
      this.refresh = 0;
    }

    ctx.font = "15px sans-serif";

    let vxTxtWidth = 0;
    let vyTxtWidth = 0;
    let angTxtWidth = 0;
    let altTxtWidth = 0;
    let vxTxt = 'XXX';
    let vyTxt = 'XXX';
    let angTx = 'XXX';
    let altTx = 'XXX';

    if (myLander.state === 'crashed') {
      vxTxtWidth = ctx.measureText(Math.abs(this.vx).toString()).width;
      vyTxtWidth = ctx.measureText(Math.abs(this.vy).toString()).width;
      angTxtWidth = ctx.measureText(this.angle.toString()).width;
      altTxtWidth = ctx.measureText(this.altitude.toString()).width;
    }
    else {
      vxTxt = Math.abs(this.vx).toString();
      vyTxt = Math.abs(this.vy).toString();
      angTx = this.angle.toString();
      altTx = this.altitude.toString();
    }
    vxTxtWidth = ctx.measureText(vxTxt).width;
    vyTxtWidth = ctx.measureText(vyTxt).width;
    angTxtWidth = ctx.measureText(angTx).width;
    altTxtWidth = ctx.measureText(altTx).width;

    ctx.fillStyle = "#dddddd";
    ctx.fillText(`HORIZONTAL SPEED :`, 700, 24);
    ctx.fillStyle =
      Math.abs(this.vx) > game.vxLandingMax ? "#ff5555" : "#55ff55";
    ctx.fillText(
      `${Math.abs(this.vx)}  ${this.vx <= 0 ? "⭠" : "⭢"}`,
      900 - vxTxtWidth,
      24
    );

    ctx.fillStyle = "#dddddd";
    ctx.fillText(`VERTICAL SPEED :`, 700, 24 + 20);
    ctx.fillStyle = this.vy > game.vyLandingMax ? "#ff5555" : "#55ff55";
    ctx.fillText(
      `${Math.abs(this.vy)}  ${this.vy <= 0 ? "⭡" : "⭣"}`,
      900 - vyTxtWidth,
      24 + 20
    );

    ctx.fillStyle = "#dddddd";
    ctx.fillText(`ANGLE :`, 700, 24 + 20 + 20);
    ctx.fillStyle =
      Math.abs(this.angle) > game.angleLandingMax ? "#ff5555" : "#55ff55";
    ctx.fillText(`${this.angle} °`, 900 - angTxtWidth, 24 + 20 + 20);

    ctx.fillStyle = "#dddddd";
    ctx.fillText(`ALTITUDE :`, 700, 24 + 20 + 20 + 20);
    ctx.fillText(`${this.altitude}`, 900 - altTxtWidth, 24 + 20 + 20 + 20);

    ctx.font = "30px sans-serif";
    ctx.fillText(`SCORE : ${game.score}`, 400, 34);    

    this.refresh++;

    ctx.fillStyle = "#00ff00";
    ctx.strokeStyle = "rgb(255, 255, 255)";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, game.width, game.height);
    ctx.strokeStyle = "#ff0000";


    if (game.state === "game over") {
      game.game_over_timeout++;
      if (game.game_over_timeout<60*3) {
        ctx.fillStyle = "#dddddd77";
        ctx.strokeStyle = "#dddddd";
        ctx.fillRect(200, game.height/2-50, game.width-400, 100);
        ctx.strokeRect(200, game.height/2-50, game.width-400, 100);
        ctx.font = "40px sans-serif";
        ctx.fillStyle = "#ffffff";

        let goWidth = ctx.measureText("CRASH !").width;
        let xgo = (game.width/2)-(goWidth/2);

        ctx.fillText("CRASH !", xgo, game.height/2-10);    

        let scoreWidth = ctx.measureText(`SCORE : ${game.score}`).width;
        let xsco = (game.width/2)-(scoreWidth/2);
        ctx.fillText(`SCORE : ${game.score}`, xsco, game.height/2+40);    
      } else {
        game.game_over_timeout = 0;
        game.state = "next game";  
        nextGame(0);      
      }
    }

    if (game.state === "game win") {
      if (game.game_win_timeout == 0) {
        game.score++;
      }
      game.game_win_timeout++;
      if (game.game_win_timeout<60*2) {
        ctx.fillStyle = "#dddddd77";
        ctx.strokeStyle = "#dddddd";
        ctx.fillRect(200, game.height/2-50, game.width-400, 100);
        ctx.strokeRect(200, game.height/2-50, game.width-400, 100);
        ctx.font = "40px sans-serif";
        ctx.fillStyle = "#ffffff";

        let goWidth = ctx.measureText("PERFECT LANDING !").width;
        let xgo = (game.width/2)-(goWidth/2);

        ctx.fillText("PERFECT LANDING !", xgo, game.height/2+10);    

      } else {
        game.game_win_timeout = 0;
        game.state = "next game";  
        nextGame(game.score);      
      }      
    }
  }
}

//// gameUpdate
function gameUpdate() {
  if (myLander.state === "flying") {
    if (keys.left) {
      myLander.rotate("left");
    }

    if (keys.right) {
      myLander.rotate("right");
    }

    if (keys.up) {
      myLander.burst();
    } else {
      myLander.enginePower = 0;
    }
  }

  if ((myLander.state === 'flying') && myLander.groundContact()) {
    if (myLander.padZone()) {
      if (
        myLander.vy <= myLander.vxLandingMax &&
        Math.abs(myLander.vx) <= myLander.vyLandingMax &&
        Math.abs(myLander.angle) <= myLander.angleLandingMax
      ) {
        myLander.angle = 0;
        myLander.enginePower = 0;
        myLander.y = myGround.landindPad.y - 22;
        myLander.state = "landed";

      }
      else {
        myLander.state = 'crashed';
      }
    }
    else {
      myLander.state = 'crashed';
    }
  }

  if (myLander.state === 'crashed') {
    game.state = 'game over';
  }

  if (myLander.state === 'landed') {
    game.state = 'game win';    
  }

  marsBackground.update();
  myLander.update();
}

//// gameRender
function gameRender() {
  marsBackground.render();
  myGround.render();
  myLander.render();
  myHud.render();
  if (game.debug)
    debugRender();
}

let keys = { up: false, down: false, right: false, left: false };

addEventListener("keydown", function (e) {
  switch (e.code) {
    case "ArrowUp":
      keys.up = true;
      break;

    case "ArrowDown":
      keys.down = true;
      break;

    case "ArrowRight":
      keys.right = true;
      break;

    case "ArrowLeft":
      keys.left = true;
      break;
  }
});

addEventListener("keyup", function (e) {
  switch (e.code) {
    case "ArrowUp":
      keys.up = false;
      break;

    case "ArrowDown":
      keys.down = false;
      break;

    case "ArrowRight":
      keys.right = false;
      break;

    case "ArrowLeft":
      keys.left = false;
      break;
  }
});

addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    // retour au jeu
  } else {
    for (let item in keys) {
      keys[item] = false;
    }
  }
});

addEventListener(
  "scroll",
  function (e) {
    window.scrollTo(0, 0);
  },
  false
);

game.canvas.setAttribute("width", game.width + "px");
game.canvas.setAttribute("height", game.height + "px");
game.ctx = game.canvas.getContext("2d");
game.dt = game.limitFPS;
game.oldTimestamp = performance.now();

let marsBackground = new BackGround();
let myGround = new Ground({ landindPadSize: 64 });
const myHud = new Hud();
const myLander = new Lander(32, 32, game.ctx);
myLander.vx = 2.5;
myLander.angle = -20;

function nextGame(score) {  
  myLander.x = 32;
  myLander.y = 32;
  myLander.vx = 2.5;
  myLander.angle = -20;
  myLander.state = "flying";
  myLander.burstState = false;
  marsBackground = new BackGround();
  myGround = new Ground({ landindPadSize: 64 });
  game.score = score;
  
}

//// gameLoop
function gameLoop() {
  const timestamp = performance.now();
  game.dt = Math.min(timestamp - game.oldTimestamp, 500);

  gameUpdate();
  gameRender();

  const delta = game.limitFPS - (performance.now() - timestamp);
  wait(delta);
  game.oldTimestamp = timestamp;
  requestAnimationFrame(gameLoop);
}

gameLoop();
