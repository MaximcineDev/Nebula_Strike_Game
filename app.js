/* =========================
   NEBULA STRIKE FINAL CLEAN
========================= */


/* ---------- IMAGES ---------- */

const playerImg = new Image();
playerImg.src = "assets/player.png";

const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";

const bossImg = new Image();
bossImg.src = "assets/boss.png";

const bgImg = new Image();
bgImg.src = "assets/background.png";


/* ---------- POWERUPS ---------- */

const healthImg = new Image();
healthImg.src = "assets/ui/health.png";

const rapidImg = new Image();
rapidImg.src = "assets/ui/rapid.png";

const shieldImg = new Image();
shieldImg.src = "assets/ui/shield.png";


/* ---------- SOUNDS ---------- */

const shootSound = new Audio("sounds/shoot.wav");
const explosionSound = new Audio("sounds/explosion.wav");


/* ---------- CANVAS ---------- */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


/* ---------- PLAYER ---------- */

const player = {

    x: 0,
    y: 0,

    width: 60,
    height: 60,

    speed: 6

};


function resizeGame(){

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    player.x = canvas.width/2;
    player.y = canvas.height - 120;

}

window.addEventListener("resize", resizeGame);

resizeGame();


/* ---------- GAME STATE ---------- */

let gameRunning = false;
let paused = false;

let score = 0;
let level = 1;

let health = 5;

let bullets = [];
let enemies = [];
let enemyBullets = [];
let powerups = [];

let boss = null;

let fireRate = 300;
let lastShot = 0;

let coins = 0;
let weaponLevel = 1;
let damage = 1;

let rapidFire = false;
let rapidTimer = 0;

let shieldActive = false;
let shieldTimer = 0;


/* ---------- TOUCH ---------- */

let touchX = null;
let touchY = null;

canvas.addEventListener("touchstart", e=>{

    e.preventDefault();

    let t = e.touches[0];

    touchX = t.clientX;
    touchY = t.clientY;

    shoot();

},{passive:false});

canvas.addEventListener("touchmove", e=>{

    e.preventDefault();

    let t = e.touches[0];

    touchX = t.clientX;
    touchY = t.clientY;

},{passive:false});

canvas.addEventListener("touchend", e=>{

    touchX = null;
    touchY = null;

},{passive:false});


/* ---------- KEYBOARD ---------- */

let moveLeft=false;
let moveRight=false;
let moveUp=false;
let moveDown=false;

window.addEventListener("keydown",e=>{

    if(e.key==="ArrowLeft") moveLeft=true;
    if(e.key==="ArrowRight") moveRight=true;
    if(e.key==="ArrowUp") moveUp=true;
    if(e.key==="ArrowDown") moveDown=true;

});

window.addEventListener("keyup",e=>{

    if(e.key==="ArrowLeft") moveLeft=false;
    if(e.key==="ArrowRight") moveRight=false;
    if(e.key==="ArrowUp") moveUp=false;
    if(e.key==="ArrowDown") moveDown=false;

});


/* ---------- START ---------- */

function startGame(){

    document.getElementById("main-menu").style.display="none";

    gameRunning=true;

    startAutoShoot();

    gameLoop();

}


let autoShootStarted=false;

function startAutoShoot(){

    if(autoShootStarted) return;

    autoShootStarted=true;

    setInterval(()=>{

        if(gameRunning && !paused){

            shoot();

        }

    },250);

}


/* ---------- SHOOT ---------- */

canvas.addEventListener("click",()=>{

    if(gameRunning){

        shoot();

    }

});

function shoot(){

    let now = Date.now();

    if(now-lastShot<fireRate) return;

    lastShot=now;

    shootSound.currentTime=0;
    shootSound.play();

    bullets.push({

        x:player.x+25,
        y:player.y,

        w:4,
        h:10

    });

}


/* ---------- ENEMY SPAWN ---------- */

setInterval(()=>{

    if(!gameRunning) return;
    if(boss) return;

    enemies.push({

        x:Math.random()*canvas.width,
        y:-40,

        w:40,
        h:40,
        hp:2+level

    });

},1500);


/* ---------- LOOP ---------- */

function gameLoop(){

    if(!gameRunning||paused) return;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(bgImg.complete){

        ctx.drawImage(
            bgImg,
            0,
            0,
            canvas.width,
            canvas.height
        );

    }

    updatePlayer();
    drawPlayer();

    updateBullets();
    updateEnemies();
    updateEnemyBullets();
    updatePowerups();
    updateTimers();

    requestAnimationFrame(gameLoop);

}


/* ---------- PLAYER ---------- */

function updatePlayer(){

    if(moveLeft) player.x-=player.speed;
    if(moveRight) player.x+=player.speed;
    if(moveUp) player.y-=player.speed;
    if(moveDown) player.y+=player.speed;

    if(touchX!==null){

        player.x += (touchX-player.x-player.width/2)*0.2;
        player.y += (touchY-player.y-player.height/2)*0.2;

    }

}


function drawPlayer(){

    ctx.drawImage(
        playerImg,
        player.x,
        player.y,
        player.width,
        player.height
    );

}


/* ---------- BULLETS ---------- */

function updateBullets(){

    for(let i=bullets.length-1;i>=0;i--){

        let b=bullets[i];

        b.y-=8;

        ctx.fillStyle="cyan";
        ctx.fillRect(b.x,b.y,b.w,b.h);

        for(let j=enemies.length-1;j>=0;j--){

            let e=enemies[j];

            if(

                b.x<e.x+e.w &&
                b.x+b.w>e.x &&
                b.y<e.y+e.h &&
                b.y+b.h>e.y

            ){

                bullets.splice(i,1);

                e.hp--;

                if(e.hp<=0){

                    enemies.splice(j,1);

                    coins+=5;

                    if(Math.random()<0.3){

                        powerups.push({
                            x:e.x,
                            y:e.y,
                            type:Math.floor(Math.random()*3)
                        });

                    }

                }

                break;

            }

        }

    }

}


/* ---------- ENEMIES ---------- */

function updateEnemies(){

    enemies.forEach(e=>{

        e.y+=2;

        ctx.drawImage(
            enemyImg,
            e.x,
            e.y,
            e.w,
            e.h
        );

        if(Math.random()<0.01){

            enemyBullets.push({

                x:e.x+10,
                y:e.y,

                w:4,
                h:10

            });

        }

    });

}


/* ---------- ENEMY BULLETS ---------- */

function updateEnemyBullets(){

    for(let i=enemyBullets.length-1;i>=0;i--){

        let b=enemyBullets[i];

        b.y+=5;

        ctx.fillStyle="red";
        ctx.fillRect(b.x,b.y,b.w,b.h);

        if(

            b.x<player.x+player.width &&
            b.x+b.w>player.x &&
            b.y<player.y+player.height &&
            b.y+b.h>player.y

        ){

            enemyBullets.splice(i,1);

            if(!shieldActive){

                health--;

            }

            if(health<=0){

                gameOver();

            }

        }

    }

}


/* ---------- POWERUPS ---------- */

function updatePowerups(){

    for(let i=powerups.length-1;i>=0;i--){

        let p=powerups[i];

        p.y+=2;

        let img=healthImg;

        if(p.type===1) img=rapidImg;
        if(p.type===2) img=shieldImg;

        ctx.drawImage(img,p.x,p.y,32,32);

    }

}


/* ---------- TIMERS ---------- */

function updateTimers(){

    if(rapidFire){

        rapidTimer--;

        fireRate=100;

        if(rapidTimer<=0){

            rapidFire=false;
            fireRate=300;

        }

    }

}


/* ---------- GAME OVER ---------- */

function gameOver(){

    gameRunning=false;

    alert("Game Over");

    location.reload();

}
