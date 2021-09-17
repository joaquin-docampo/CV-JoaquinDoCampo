//Reference: "Make JavaScript Asteroids in One Video", Derek Banas, https://www.youtube.com/watch?v=HWuU5ly0taA
const canvasWidth = 1400;
const canvasHeight = 900;
const nbOfAsteroids = 8;

let canvas;
let ctx;
let keys = [];
let ship;
let bullets = [];
let asteroids = [];
let score = 0;
let lives = 3;
let killed = false;

function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function () {
        this.sound.play();
    }
    this.stop = function () {
        this.sound.pause();
    }
}
const soundAsteroidHit = new sound("asteroidHit.mp3");
const soundShipHit = new sound("shipHit.m4a");
const soundYouWin = new sound("youWin.mp3");
const soundYouLoose = new sound("youLoose.m4a");
const soundMainRocket = new sound("mainRocket.mp3");
const soundSideRocket = new sound("sideRocket.mp3");

document.addEventListener('DOMContentLoaded', SetupCanvas);

function SetupCanvas() {
    canvas = document.getElementById('my-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx.fillSytle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ship = new Ship();
    for (let i = 0; i < nbOfAsteroids; i++) {
        asteroids.push(new Asteroid());

    }
    document.body.addEventListener("keydown", function (e) {
        //console.log("down e.keyCode = " + e.keyCode)
        keys[e.keyCode] = true;
    });
    document.body.addEventListener("keyup", function (e) {
        //console.log("up e.keyCode = " + e.keyCode)
        keys[e.keyCode] = false;
        if (e.keyCode === 13) {//32 = spacebar, 13 = enter
            if (killed) {
                killed = false;
                Render();
            }
            if (lives > 0) {
                new sound("fire.m4a").play();
            }
            bullets.push(new Bullet(ship.yaw_deg));

        }
    });
    Render();
}

function deg2rad(angle_deg) {
    return angle_deg * Math.PI / 180;
}

class Ship {
    constructor() {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.movingForward = false;
        this.turnLeft = false;
        this.turnRight = false;
        this.speed = 0.1;
        this.velX = 0;
        this.velY = 0;
        this.rotateSpeed_degps = 2;
        this.radius = 15;
        this.yaw_deg = 0;
        this.strokeColor = 'white';
        this.noseX = canvasWidth / 2 + this.radius;
        this.noseY = canvasHeight / 2;
    }

    Rotate(dir) {
        this.yaw_deg += this.rotateSpeed_degps * dir;
        
    }

    Update() {
        let yaw_rad = deg2rad(this.yaw_deg);
        if (this.movingForward) {
            this.velX += this.speed * Math.cos(yaw_rad);
            this.velY += this.speed * Math.sin(yaw_rad);
        }
        if (this.x < this.radius) {
            this.x = canvasWidth;
        }
        if (this.x > canvasWidth) {
            this.x = this.radius;
        }
        if (this.y < this.radius) {
            this.y = canvasHeight;
        }
        if (this.y > canvasHeight) {
            this.y = this.radius;
        }
        this.velX *= 0.99;
        this.velY *= 0.99;
        this.x -= this.velX;
        this.y -= this.velY;
    }

    DrawSideThrust(thrustLength, thrustWidth, isLeftThrust) {
        let hOffset = 0;
        if (isLeftThrust) {
            hOffset = this.radius / 2;
        } else {
            hOffset = -this.radius / 2;
        }
        //thrust 1
        let x0 = this.noseX + 0.75 * this.radius;
        let x1 = x0 + thrustLength;
        let y0 = this.noseY - thrustWidth / 2 + hOffset;
        let y1 = this.noseY + thrustWidth / 2 + hOffset;
        let grd = ctx.createLinearGradient(x0, y0, x1, y1);
        grd.addColorStop(0, "red");
        grd.addColorStop(0.5, "yellow");
        grd.addColorStop(1, "black");
        ctx.fillStyle = grd;
        ctx.fillRect(x0, y0, thrustLength, thrustWidth);
        //thrust 2
        x0 = this.noseX + 0.75 * this.radius - thrustLength;
        x1 = x0 + thrustLength;
        y0 = this.noseY - thrustWidth / 2 - hOffset;
        y1 = this.noseY + thrustWidth / 2 - hOffset;
        grd = ctx.createLinearGradient(x0, y0, x1, y1);
        grd.addColorStop(0, "black");
        grd.addColorStop(0.5, "yellow");
        grd.addColorStop(1, "red");
        ctx.fillStyle = grd;
        ctx.fillRect(x0, y0, thrustLength, thrustWidth);
    }

    DrawForwardThrust(thrustLength, thrustWidth) {
        let x0 = this.noseX + this.radius;
        let x1 = x0 + thrustLength;
        let y0 = this.noseY - thrustWidth / 2;
        let y1 = this.noseY + thrustWidth / 2;
        let grd = ctx.createLinearGradient(x0, y0, x1, y1);
        grd.addColorStop(0, "red");
        grd.addColorStop(0.5, "yellow");
        grd.addColorStop(1, "black");
        ctx.fillStyle = grd;
        ctx.fillRect(x0, y0, thrustLength, thrustWidth);
    }

    Draw() {
        let yaw_rad = deg2rad(this.yaw_deg);
        this.noseX = this.x - this.radius;
        this.noseY = this.y;
        ctx.translate(this.noseX + this.radius / 2, this.noseY); //center of rotation is at radius/2
        ctx.rotate(yaw_rad);
        ctx.translate(-this.noseX - this.radius / 2, -this.noseY);
        //Draw ship lines
        ctx.strokeStyle = this.strokeColor;
        ctx.beginPath();
        ctx.moveTo(this.noseX, this.noseY);
        let vertAngle_rad = (Math.PI * 2) / 3; 
        ctx.lineTo(this.x - this.radius * Math.cos(vertAngle_rad * 1),
            this.y - this.radius * Math.sin(vertAngle_rad * 1));
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(this.x - this.radius * Math.cos(vertAngle_rad * 2),
            this.y - this.radius * Math.sin(vertAngle_rad * 2));
        ctx.closePath(); 
        ctx.stroke();
       
        ctx.beginPath();
        const circleRadius = 2;
        const startAngle_rad = 0;
        const endAngle_rad = 2 * Math.PI;
        ctx.arc(this.noseX, this.noseY, circleRadius, startAngle_rad, endAngle_rad);
        ctx.fillStyle = "red";
        ctx.fill();
        //Draw thrust vectors
        if (this.movingForward) {
            this.DrawForwardThrust(50, 4);
        }
        if (this.turnLeft) {
            this.DrawSideThrust(30, 4, false);
        }
        if (this.turnRight) {
            this.DrawSideThrust(30, 4, true);
        }
       
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}

class Bullet {
    constructor(yaw_deg) {
        this.x = ship.noseX;
        this.y = ship.noseY;
        this.yaw_deg = yaw_deg;
        this.height = 4;
        this.width = 4;
        this.speed = 7;
    }
    Update() {
        let yaw_rad = deg2rad(this.yaw_deg);
        this.x -= this.speed * Math.cos(yaw_rad);
        this.y -= this.speed * Math.sin(yaw_rad);
    }
    Draw() {
        ctx.fillStyle = "yellow";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Asteroid {
    constructor(x, y, radius, level, collisionRadius) {
        this.x = x || Math.floor(Math.random() * canvasWidth);
        this.y = y || Math.floor(Math.random() * canvasHeight);
        //Make sure no asteroid spawns near ship spawn location
        if (Math.abs(this.x - canvasWidth / 2) < 2 * ship.radius &&
            Math.abs(this.x - canvasWidth / 2) < 2 * ship.radius) {
            console.log("Asteroid near ship spawn location, changing x to zero");
            this.x = 0;
        }
        this.speed = 2;
        this.radius = radius || 50;
        this.yaw_deg = Math.floor(Math.random() * 359);
        this.strokeColor = "white";
        this.numberOfSides = 7; //6 = Hexagon
        this.collisionRadius = collisionRadius || 46;
        this.level = level || 1;
    }
    Update() {
        let yaw_rad = deg2rad(this.yaw_deg);
        this.x += Math.cos(yaw_rad) * this.speed;
        this.y += Math.sin(yaw_rad) * this.speed;
        if (this.x < this.radius) {
            this.x = canvasWidth;
        }
        if (this.x > canvasWidth) {
            this.x = this.radius;
        }
        if (this.y < this.radius) {
            this.y = canvasHeight;
        }
        if (this.y > canvasHeight) {
            this.y = this.radius;
        }
    }

    Draw() {
        ctx.beginPath();
        ctx.strokeStyle = this.strokeColor;
        let vertAngle_rad = 2 * Math.PI / this.numberOfSides;
        let yaw_rad = deg2rad(this.yaw_deg);
        for (let i = 0; i < this.numberOfSides; i++) {
            ctx.lineTo(this.x - this.radius * Math.cos(vertAngle_rad * i + yaw_rad),
                this.y - this.radius * Math.sin(vertAngle_rad * i + yaw_rad));
        }
        ctx.closePath();
        ctx.stroke();
    }
}

function CircleCollision(x1, y1, r1, x2, y2, r2) {
    let radiusSum = r1 + r2;
    let xDiff = x1 - x2;
    let yDiff = y1 - y2;
    return (radiusSum > Math.sqrt(xDiff * xDiff + yDiff * yDiff));
}

function showTextOnScreen(text, x, y, font) {
    //console.log("show text: " + text);
    ctx.fillStyle = "white";
    ctx.font = font;
    ctx.fillText(text, x, y);
}

function clearScreen() {
    
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}


function DrawLifeShips() {
    let startX = 1350;
    let startY = 10;
    let points = [[9, 9], [-9, 9]];
    ctx.strokeStyle = 'white'; 
    for (let i = 0; i < lives; i++) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        for (let j = 0; j < points.length; j++) {
            ctx.lineTo(startX + points[j][0], startY + points[j][1]);
        }
       
        ctx.closePath();
       
        ctx.stroke();
        
        startX -= 30;
    }
}

function Render() {
    clearScreen();
    showTextOnScreen('W↑  S↓   A←  D →   Disparo: ENTER                              Puntaje: ' + score.toString(), 20, 35, "21px Arial" + ' W');
    
   
    if (lives <= 0) {
        showTextOnScreen("PERDISTE!", canvasWidth / 2 - 180, canvasHeight / 2, '50px Arial');
        showTextOnScreen("Refresca para vovler a jugar.", canvasWidth / 2 - 350, canvasHeight / 2 + 50, '50px Arial');
        soundYouLoose.play();
        return;
    } else if (killed) {
        showTextOnScreen("Te quedan " + lives + " vidas. Presiona enter", canvasWidth / 2 - 350, canvasHeight / 2, '50px Arial');
        return;
    }
    DrawLifeShips();

    ship.movingForward = keys[87]; 
    ship.turnRight = keys[68];
    ship.turnLeft = keys[65];
    if (ship.movingForward) {
        soundMainRocket.play();
    } else {
        soundMainRocket.stop();
    }
    if (ship.turnRight) { 
        soundSideRocket.play();
        ship.Rotate(1);
    }
    if (ship.turnLeft) { 
        soundSideRocket.play();
        ship.Rotate(-1); 
    }
    if (!ship.turnLeft && !ship.turnRight) {
        soundSideRocket.stop();
    }
    if (asteroids.length !== 0) {
        for (let i = 0; i < asteroids.length; i++) {
            if (CircleCollision(ship.x, ship.y, 11, asteroids[i].x, asteroids[i].y, asteroids[i].collisionRadius)) {
                showTextOnScreen("Ship collided with asteroid #" + i);
                ship.x = canvasWidth / 2;
                ship.y = canvasHeight / 2;
                ship.velX = 0;
                ship.velY = 0;
               
                asteroids[i].x -= 200;
                asteroids[i].y -= 200;
                lives--;
                killed = true;
                soundShipHit.play();
            }
        }
    } else {
        showTextOnScreen("GANASTE!", canvasWidth / 2 - 150, canvasHeight / 2, '50px Arial');
        showTextOnScreen("Refresca la pagina para volver a jugar.", canvasWidth / 2 - 350, canvasHeight / 2 + 50, '50px Arial');
        soundYouWin.play();
        return;
    }

    if (asteroids.length !== 0 && bullets.length !== 0) {
        loop1:
        for (let i = 0; i < asteroids.length; i++) {
            for (let j = 0; j < bullets.length; j++) {
                if (CircleCollision(bullets[j].x, bullets[j].y, 3, asteroids[i].x, asteroids[i].y,
                    asteroids[i].collisionRadius)) {
                    showTextOnScreen("Bullet collided with asteroid #" + i);
                    if (asteroids[i].level === 1) {
                        asteroids.push(new Asteroid(asteroids[i].x - 5, asteroids[i].y - 5, 25, 2, 22));
                        asteroids.push(new Asteroid(asteroids[i].x + 5, asteroids[i].y + 5, 25, 2, 22));
                    } else if (asteroids[i].level === 2) {
                        asteroids.push(new Asteroid(asteroids[i].x - 5, asteroids[i].y - 5, 15, 3, 12));
                        asteroids.push(new Asteroid(asteroids[i].x + 5, asteroids[i].y + 5, 15, 3, 12));
                    }
                    asteroids.splice(i, 1);
                    bullets.splice(j, 1);
                    score += 20;
                    soundAsteroidHit.play();
                    break loop1;
                }
            }
        }
    }

    ship.Update();
    ship.Draw();

    if (bullets.length !== 0) {
        for (let i = 0; i < bullets.length; i++) {
            bullets[i].Update();
            bullets[i].Draw();
        }
    }
    if (asteroids.length !== 0) {
        for (let i = 0; i < asteroids.length; i++) {
            asteroids[i].Update();
            asteroids[i].Draw();
        }
    }
    requestAnimationFrame(Render);
}