/* =========================
   NEBULA STRIKE
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


/* ---------- SOUNDS ---------- */

const shootSound = new Audio("sounds/shoot.wav");
const explosionSound = new Audio("sounds/explosion.wav");


/* ---------- CANVAS ---------- */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


/* ---------- GAME STATE ---------- */

let gameRunning = false;
let paused = false;

let score = 0;
let coins = 0;
let level = 1;

let health = 5;

let bullets = [];
let enemies = [];
let enemyBullets = [];

let boss = null;
let bossHealth = 100;

let enemiesKilled = 0;


/* ---------- UPGRADES ---------- */

let damage = 1;
let fireRate = 300;
let skin = 0;
let premium = false;

let lastShot = 0;


/* ---------- SAVE / LOAD ---------- */

function saveGame() {

    localStorage.setItem("coins", coins);
    localStorage.setItem("damage", damage);
    localStorage.setItem("fireRate", fireRate);
    localStorage.setItem("skin", skin);
    localStorage.setItem("premium", premium);

}

function loadGame() {

    coins = parseInt(localStorage.getItem("coins")) || 0;
    damage = parseInt(localStorage.getItem("damage")) || 1;
    fireRate = parseInt(localStorage.getItem("fireRate")) || 300;
    skin = parseInt(localStorage.getItem("skin")) || 0;

    premium = localStorage.getItem("premium") === "true";

}

loadGame();


/* ---------- PLAYER ---------- */

const player = {

    x: canvas.width / 2,
    y: canvas.height - 120,

    width: 60,
    height: 60,

    speed: 6

};


/* ---------- MOVEMENT ---------- */

let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;


window.addEventListener("keydown", e => {

    if (e.key === "ArrowLeft") moveLeft = true;
    if (e.key === "ArrowRight") moveRight = true;
    if (e.key === "ArrowUp") moveUp = true;
    if (e.key === "ArrowDown") moveDown = true;

});

window.addEventListener("keyup", e => {

    if (e.key === "ArrowLeft") moveLeft = false;
    if (e.key === "ArrowRight") moveRight = false;
    if (e.key === "ArrowUp") moveUp = false;
    if (e.key === "ArrowDown") moveDown = false;

});


/* ---------- SPLASH ---------- */

window.addEventListener("load", () => {

    const splash = document.getElementById("splashScreen");

    setTimeout(() => {

        splash.style.display = "none";

    }, 2000);

});


/* ---------- START ---------- */

function startGame() {

    document.getElementById("main-menu").style.display = "none";

    gameRunning = true;

    updateHearts();

    gameLoop();

}


/* ---------- PAUSE ---------- */

document.getElementById("pauseBtn").addEventListener("click", () => {

    paused = !paused;

    if (!paused) gameLoop();

});


/* ---------- SHOP / SETTINGS ---------- */

function openShop() {

    document.getElementById("main-menu").style.display = "none";
    document.getElementById("shop").style.display = "block";

}

function closeShop() {

    document.getElementById("shop").style.display = "none";
    document.getElementById("main-menu").style.display = "flex";

}

function openSettings() {

    document.getElementById("main-menu").style.display = "none";
    document.getElementById("settings").style.display = "block";

}

function closeSettings() {

    document.getElementById("settings").style.display = "none";
    document.getElementById("main-menu").style.display = "flex";

}


/* ---------- SHOOT ---------- */

canvas.addEventListener("click", () => {

    if (!gameRunning) return;

    shoot();

});

function shoot() {

    let now = Date.now();

    if (now - lastShot < fireRate) return;

    lastShot = now;

    shootSound.currentTime = 0;
    shootSound.play();

    bullets.push({

        x: player.x + 25,
        y: player.y,

        w: 4,
        h: 10,

        dmg: damage

    });

}


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


/* ---------- BOSS SPAWN ---------- */

setInterval(() => {

    if (!gameRunning) return;

    if (level >= 5 && !boss) {

        boss = {

            x: canvas.width / 2 - 80,
            y: 40,

            w: 160,
            h: 160

        };

        bossHealth = 100;

    }

}, 2000);


/* ---------- GAME LOOP ---------- */

function gameLoop() {

    if (!gameRunning || paused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgImg.complete) {

        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    }

    updatePlayer();
    drawPlayer();

    updateBullets();
    updateEnemies();
    updateEnemyBullets();
    updateBoss();

    updateUI();

    requestAnimationFrame(gameLoop);

}


/* ---------- PLAYER ---------- */

function updatePlayer() {

    if (moveLeft) player.x -= player.speed;
    if (moveRight) player.x += player.speed;
    if (moveUp) player.y -= player.speed;
    if (moveDown) player.y += player.speed;

}

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

                score += 10 * damage;
                coins += 5;

                enemiesKilled++;

                if (enemiesKilled >= 10) {

                    level++;
                    enemiesKilled = 0;

                }

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

        if (Math.random() < 0.01) {

            enemyBullets.push({

                x: e.x + 10,
                y: e.y,

                w: 4,
                h: 10

            });

        }

    });

}


/* ---------- ENEMY BULLETS ---------- */

function updateEnemyBullets() {

    enemyBullets.forEach((b, i) => {

        b.y += 5;

        ctx.fillStyle = "red";
        ctx.fillRect(b.x, b.y, b.w, b.h);

        if (

            b.x < player.x + player.width &&
            b.x + b.w > player.x &&
            b.y < player.y + player.height &&
            b.y + b.h > player.y

        ) {

            enemyBullets.splice(i, 1);

            health--;

            updateHearts();

            if (health <= 0) {

                gameOver();

            }

        }

    });

}


/* ---------- HEARTS ---------- */
function updateHearts() {

    const hearts =
        document.querySelectorAll(".heart");

    hearts.forEach((h, i) => {

        if (i < health) {

            h.src = "ui/heart-full.png";

        } else {

            h.src = "ui/heart-empty.png";

        }

    });

}

/* ---------- GAMEOVER ---------- */
function gameOver() {

    gameRunning = false;

    alert("Game Over");

    location.reload();

}


/* ---------- BOSS ---------- */

function updateBoss() {

    if (!boss) return;

    ctx.drawImage(
        bossImg,
        boss.x,
        boss.y,
        boss.w,
        boss.h
    );

}


/* ---------- UI ---------- */

function updateUI() {

    document.getElementById("scoreText").textContent =
        "Score: " + score;

    document.getElementById("coinText").textContent =
        coins;

    document.getElementById("levelText").textContent =
        "Lv " + level;

}


/* ---------- SHOP ---------- */

function buyWeapon() {

    if (coins >= 50) {

        coins -= 50;
        damage++;

        saveGame();

    }

}

function buyShield() {

    if (coins >= 30) {

        coins -= 30;

        saveGame();

    }

}
