/* =========================
   NEBULA STRIKE
========================= */


/* ---------- SPLASH ---------- */

window.addEventListener("load", () => {

    const splash = document.getElementById("splashScreen");
    const menu = document.getElementById("main-menu");

    if (menu) menu.style.display = "none";

    setTimeout(() => {

        splash.style.opacity = "0";

        setTimeout(() => {

            splash.style.display = "none";

            if (menu) menu.style.display = "flex";

        }, 1000);

    }, 2500);

});


/* ---------- CANVAS ---------- */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


/* ---------- UI UPDATE ---------- */

function updateUI() {

    const scoreText = document.getElementById("scoreText");
    const coinText = document.getElementById("coinText");
    const badge = document.getElementById("premiumBadge");

    if (scoreText)
        scoreText.textContent = "Score: " + score;

    if (coinText)
        coinText.textContent = coins;

    if (badge) {

        if (damage > 1 || fireRate < 300)
            badge.style.display = "block";
        else
            badge.style.display = "none";

    }

}


/* ---------- IMAGES ---------- */

const playerImg = new Image();
playerImg.src = "./assets/player.png";

const enemyImg = new Image();
enemyImg.src = "./assets/enemy.png";

const bossImg = new Image();
bossImg.src = "./assets/boss.png";

const bgImg = new Image();
bgImg.src = "./assets/background.png";


/* ---------- GAME STATE ---------- */

let gameRunning = false;

let score = 0;
let playerHealth = 100;

let bullets = [];
let enemies = [];
let enemyBullets = [];
let explosions = [];
let stars = [];

let boss = null;
let bossHealth = 100;


/* ---------- PLAYER ---------- */

const player = {
    x: canvas.width / 2,
    y: canvas.height - 120,
    width: 50,
    height: 50,
    speed: 6
};


/* ---------- MOVEMENT FLAGS ---------- */

let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;


/* ---------- START GAME ---------- */

document.getElementById("startBtn").addEventListener("click", startGame);

function startGame() {

    document.getElementById("main-menu").style.display = "none";

    score = 0;
    updateUI();

    createStars();

    gameRunning = true;

    gameLoop();

}


/* ---------- TAP TO SHOOT ---------- */

canvas.addEventListener("touchstart", () => {

    if (!gameRunning) return;

    shoot();

});

canvas.addEventListener("click", () => {

    if (!gameRunning) return;

    shoot();

});


/* ---------- STARS ---------- */

function createStars() {

    stars = [];

    for (let i = 0; i < 100; i++) {

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

    stars.forEach(star => {

        ctx.fillRect(star.x, star.y, star.size, star.size);

        star.y += star.speed;

        if (star.y > canvas.height) {

            star.y = 0;
            star.x = Math.random() * canvas.width;

        }

    });

}


/* ---------- MOVEMENT ---------- */

function updatePlayerMove() {

    if (moveLeft) player.x -= player.speed;
    if (moveRight) player.x += player.speed;
    if (moveUp) player.y -= player.speed;
    if (moveDown) player.y += player.speed;

    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width)
        player.x = canvas.width - player.width;

    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.height)
        player.y = canvas.height - player.height;

}


/* ---------- KEYBOARD ---------- */

window.addEventListener("keydown", (e) => {

    if (e.key === "ArrowLeft") moveLeft = true;
    if (e.key === "ArrowRight") moveRight = true;
    if (e.key === "ArrowUp") moveUp = true;
    if (e.key === "ArrowDown") moveDown = true;

});

window.addEventListener("keyup", (e) => {

    if (e.key === "ArrowLeft") moveLeft = false;
    if (e.key === "ArrowRight") moveRight = false;
    if (e.key === "ArrowUp") moveUp = false;
    if (e.key === "ArrowDown") moveDown = false;

});


/* ---------- TOUCH MOVE ---------- */

canvas.addEventListener("touchmove", (e) => {

    const t = e.touches[0];

    player.x = t.clientX - player.width / 2;
    player.y = t.clientY - player.height / 2;

});


/* ---------- MOUSE MOVE ---------- */

canvas.addEventListener("mousemove", (e) => {

    player.x = e.clientX - player.width / 2;
    player.y = e.clientY - player.height / 2;

});


/* ---------- SHOOT ---------- */

function shoot() {

    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 12
    });

}


/* ---------- ENEMY SPAWN ---------- */

setInterval(() => {

    if (!gameRunning) return;

    enemies.push({
        x: Math.random() * canvas.width,
        y: -50,
        width: 40,
        height: 40
    });

}, 1500);


/* ---------- BOSS SPAWN ---------- */

setInterval(() => {

    if (!gameRunning) return;

    if (score > 200 && !boss) {

        boss = {
            x: canvas.width / 2 - 80,
            y: 50,
            width: 160,
            height: 160
        };

        bossHealth = 100;

    }

}, 4000);


/* ---------- EXPLOSION ---------- */

function createExplosion(x, y) {

    explosions.push({
        x,
        y,
        size: 10,
        life: 20
    });

}


/* ---------- GAME LOOP ---------- */

function gameLoop() {

    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    drawStars();

    updatePlayerMove();

    drawPlayer();

    updateBullets();
    updateEnemies();
    updateEnemyBullets();
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

        b.y -= 10;

        ctx.fillStyle = "#00ffff";
        ctx.fillRect(b.x, b.y, b.width, b.height);

        enemies.forEach((e, ei) => {

            if (
                b.x < e.x + e.width &&
                b.x + b.width > e.x &&
                b.y < e.y + e.height &&
                b.y + b.height > e.y
            ) {

                createExplosion(e.x, e.y);

                enemies.splice(ei, 1);
                bullets.splice(i, 1);

                score += 10;
                updateUI();

            }

        });

        if (boss) {

            if (
                b.x < boss.x + boss.width &&
                b.x + b.width > boss.x &&
                b.y < boss.y + boss.height &&
                b.y + b.height > boss.y
            ) {

                bossHealth -= 5;

                bullets.splice(i, 1);

                if (bossHealth <= 0) {

                    createExplosion(boss.x, boss.y);

                    boss = null;

                    score += 500;
                    updateUI();

                }

            }

        }

    });

}


/* ---------- ENEMIES ---------- */

function updateEnemies() {

    enemies.forEach((e) => {

        e.y += 2;

        ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);

        if (Math.random() < 0.01) {

            enemyBullets.push({
                x: e.x + 10,
                y: e.y,
                width: 4,
                height: 10
            });

        }

    });

}


/* ---------- ENEMY BULLETS ---------- */

function updateEnemyBullets() {

    enemyBullets.forEach((b, i) => {

        b.y += 5;

        ctx.fillStyle = "red";
        ctx.fillRect(b.x, b.y, b.width, b.height);

        if (
            b.x < player.x + player.width &&
            b.x + b.width > player.x &&
            b.y < player.y + player.height &&
            b.y + b.height > player.y
        ) {

            playerHealth -= 10;

            enemyBullets.splice(i, 1);

            if (playerHealth <= 0) gameOver();

        }

    });

}


/* ---------- BOSS ---------- */

function updateBoss() {

    if (!boss) return;

    ctx.drawImage(
        bossImg,
        boss.x,
        boss.y,
        boss.width,
        boss.height
    );

    ctx.fillStyle = "red";

    ctx.fillRect(
        boss.x,
        boss.y - 10,
        boss.width * (bossHealth / 100),
        6
    );

}


/* ---------- EXPLOSIONS ---------- */

function drawExplosions() {

    explosions.forEach((ex, i) => {

        ctx.beginPath();

        ctx.arc(ex.x, ex.y, ex.size, 0, Math.PI * 2);

        ctx.fillStyle = "orange";

        ctx.fill();

        ex.size += 2;
        ex.life--;

        if (ex.life <= 0) explosions.splice(i, 1);

    });

}


/* ---------- GAME OVER ---------- */

function gameOver() {

    gameRunning = false;

    alert("Game Over");

    location.reload();

}

/* ---------- SHOP ---------- */
function openShop() {

    document.getElementById("main-menu").style.display = "none";
    document.getElementById("shop").style.display = "block";

    loadGame();
    updateUI();

}

function closeShop() {

    document.getElementById("shop").style.display = "none";
    document.getElementById("main-menu").style.display = "flex";

}
