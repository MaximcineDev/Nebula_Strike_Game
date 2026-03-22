/* =========================
   NEBULA STRIKE FINAL CLEAN
========================= */


/* ---------- SAFE DEFAULTS ---------- */

let damage = 1;
let fireRate = 300;
let skin = 0;
let premium = false;


/* ---------- SPLASH ---------- */

window.addEventListener("load", () => {

    const splash = document.getElementById("splashScreen");
    const menu = document.getElementById("main-menu");

    if (menu) menu.style.display = "none";

    setTimeout(() => {

        if (splash) splash.style.display = "none";

        if (menu) menu.style.display = "flex";

    }, 2000);

});


/* ---------- CANVAS ---------- */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


/* ---------- IMAGES ---------- */

const playerImg = new Image();
playerImg.src = "assets/player.png";

const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";

const bossImg = new Image();
bossImg.src = "assets/boss.png";

const bgImg = new Image();
bgImg.src = "assets/background.png";


/* ---------- SOUNDS ---------- */

const shootSound = new Audio("sounds/shoot.wav");
const explosionSound = new Audio("sounds/explosion.wav");


/* ---------- GAME STATE ---------- */

let gameRunning = false;
let paused = false;

let score = 0;
let coins = 0;
let level = 1;

let bullets = [];
let enemies = [];
let enemyBullets = [];
let explosions = [];
let stars = [];
let powerups = [];

let boss = null;
let bossHealth = 100;

let weaponLevel = 1;
let shieldActive = false;

let enemiesKilled = 0;


/* ---------- PLAYER ---------- */

const player = {

    x: canvas.width / 2,
    y: canvas.height - 120,
    width: 60,
    height: 60,
    speed: 6

};


/* ---------- UI ---------- */

function updateUI() {

    const scoreText = document.getElementById("scoreText");
    const coinText = document.getElementById("coinText");
    const levelText = document.getElementById("levelText");

    if (scoreText) scoreText.textContent = "Score: " + score;
    if (coinText) coinText.textContent = coins;
    if (levelText) levelText.textContent = "Lv " + level;

}


/* ---------- SAVE ---------- */

function saveGame() {

    localStorage.setItem("coins", coins);
    localStorage.setItem("weaponLevel", weaponLevel);
    localStorage.setItem("level", level);

}


/* ---------- LOAD ---------- */

function loadGame() {

    coins = parseInt(localStorage.getItem("coins")) || 0;
    weaponLevel = parseInt(localStorage.getItem("weaponLevel")) || 1;
    level = parseInt(localStorage.getItem("level")) || 1;

}


/* ---------- START ---------- */

document.getElementById("startBtn").addEventListener("click", startGame);

function startGame() {

    loadGame();

    document.getElementById("main-menu").style.display = "none";

    canvas.style.display = "block";

    createStars();

    gameRunning = true;

    updateUI();

    gameLoop();

}


/* ---------- PAUSE ---------- */

document.getElementById("pauseBtn").addEventListener("click", () => {

    paused = !paused;

    if (!paused) gameLoop();

});


/* ---------- STARS ---------- */

function createStars() {

    stars = [];

    for (let i = 0; i < 80; i++) {

        stars.push({

            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 2 + 1

        });

    }

}


function drawStars() {

    ctx.fillStyle = "white";

    stars.forEach(s => {

        ctx.fillRect(s.x, s.y, s.size, s.size);

        s.y += s.speed;

        if (s.y > canvas.height) s.y = 0;

    });

}


/* ---------- SHOOT ---------- */

function shoot() {

    shootSound.currentTime = 0;
    shootSound.play();

    bullets.push({

        x: player.x + player.width / 2,
        y: player.y,
        w: 4,
        h: 10

    });

}


canvas.addEventListener("click", () => {

    if (gameRunning) shoot();

});


/* ---------- ENEMY SPAWN ---------- */

setInterval(() => {

    if (!gameRunning) return;

    enemies.push({

        x: Math.random() * canvas.width,
        y: -40,
        w: 40,
        h: 40

    });

}, 1500);


/* ---------- BOSS ---------- */

setInterval(() => {

    if (!gameRunning) return;

    if (score > 200 && !boss) {

        boss = {

            x: canvas.width / 2 - 80,
            y: 50,
            w: 160,
            h: 160

        };

        bossHealth = 100;

    }

}, 3000);


/* ---------- GAME LOOP ---------- */

function gameLoop() {

    if (!gameRunning || paused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    drawStars();

    drawPlayer();

    updateBullets();

    updateEnemies();

    updateBoss();

    drawExplosions();

    requestAnimationFrame(gameLoop);

}


/* ---------- PLAYER ---------- */

function drawPlayer() {

    ctx.drawImage(

        playerImg,
        player.x,
        player.y,
        player.width,
        player.height

    );

}


/* ---------- BULLETS ---------- */

function updateBullets() {

    bullets.forEach((b, i) => {

        b.y -= 8;

        ctx.fillStyle = "cyan";

        ctx.fillRect(b.x, b.y, b.w, b.h);

        enemies.forEach((e, ei) => {

            if (

                b.x < e.x + e.w &&
                b.x + b.w > e.x &&
                b.y < e.y + e.h &&
                b.y + b.h > e.y

            ) {

                explosionSound.play();

                enemies.splice(ei, 1);
                bullets.splice(i, 1);

                score += 10;
                coins += 5;

                enemiesKilled++;

                if (enemiesKilled > 10) {

                    level++;
                    enemiesKilled = 0;

                }

                updateUI();
                saveGame();

            }

        });

    });

}


/* ---------- ENEMIES ---------- */

function updateEnemies() {

    enemies.forEach(e => {

        e.y += 2;

        ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);

    });

}


/* ---------- BOSS ---------- */

function updateBoss() {

    if (!boss) return;

    ctx.drawImage(bossImg, boss.x, boss.y, boss.w, boss.h);

}


/* ---------- EXPLOSIONS ---------- */

function drawExplosions() {


}
