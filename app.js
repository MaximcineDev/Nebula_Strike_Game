/* =========================
        NEBULA STRIKE
   FINAL PLAY STORE VERSION
   ========================= */

let canvas, ctx;
let score = 0;
let coins = 0;
let running = false;
let playerX = 0;

let bullets = [], enemies = [], explosions = [];
let stars = [], stars2 = [], stars3 = [];
let boss = null;
let shake = 0;
let particles = [];
let bossBullets = [];
let level = 1;

const LOW_MODE = true;

/* ---------- ASSET LOADER ---------- */

let assetsLoaded = 0;
let assetsToLoad = 0;

function assetLoaded() {

    assetsLoaded++;

    if (assetsLoaded >= assetsToLoad) {

        console.log("All assets loaded");

        init(); // start game only after load

    }

}

/* ---------- SAVE ---------- */

const SAVE_KEY = "nebula_save";

function getCoins() {

    let c = localStorage.getItem("coins");

    if (!c) c = 0;

    return parseInt(c);

}

function setCoins(v) {

    localStorage.setItem("coins", v);

}

coins = getCoins();

/* ---------- IMAGES ---------- */

assetsToLoad++;
const playerImg = new Image();
playerImg.onload = assetLoaded;
playerImg.onerror = assetLoaded;
playerImg.src = "assets/player.png";

assetsToLoad++;
const enemyImg = new Image();
enemyImg.onload = assetLoaded;
enemyImg.onerror = assetLoaded;
enemyImg.src = "assets/enemy.png";

assetsToLoad++;
const bossImg = new Image();
bossImg.onload = assetLoaded;
bossImg.onerror = assetLoaded;
bossImg.src = "assets/boss.png";

assetsToLoad++;
const explosionImg = new Image();
explosionImg.onload = assetLoaded;
explosionImg.onerror = assetLoaded;
explosionImg.src = "assets/explosion.png";

assetsToLoad++;
const starImg = new Image();
starImg.onload = assetLoaded;
starImg.onerror = assetLoaded;
starImg.src = "assets/star.png";

/* ---------- UI ---------- */

const coinIcon = new Image();
coinIcon.src = "assets/ui/coin-icon.png";

const lockedLevel = new Image();
lockedLevel.src = "assets/ui/locked-level.png";

const premiumBadge = new Image();
premiumBadge.src = "assets/ui/premium-badge.png";

const premiumScreen = new Image();
premiumScreen.src = "assets/ui/premium-screen.png";

const shopPremium = new Image();
shopPremium.src = "assets/ui/shop-premium.png";

const upgradeButton = new Image();
upgradeButton.src = "assets/ui/upgrade-button.png";

/* ---------- SOUND ---------- */

const boomSound = new Audio("assets/sounds/explosion.wav");
const shootSound = new Audio("assets/sounds/shoot.wav");

function playSound(s) {

    if (!s) return;

    s.currentTime = 0;

    s.play().catch(() => {});

}

/* ---------- START ---------- */

function startGame() {

    document.getElementById("main-menu").style.display = "none";

    running = true;

}

/* ---------- INIT ---------- */

function init() {

    canvas = document.getElementById("gameCanvas");

    if (!canvas) return;

    ctx = canvas.getContext("2d");

    if (!ctx) return;

    resize();

    requestAnimationFrame(loop);

    for (let i = 0; i < (LOW_MODE ? 15 : 40); i++)
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        });

    for (let i = 0; i < (LOW_MODE ? 10 : 30); i++)
        stars2.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        });

    for (let i = 0; i < (LOW_MODE ? 5 : 20); i++)
        stars3.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        });

    canvas.addEventListener("click", shoot);

}

/* ---------- RESIZE ---------- */

function resize() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

}

window.addEventListener("resize", resize);

window.addEventListener("mousemove", e => {
    playerX = e.clientX;
});

window.addEventListener("touchmove", e => {

    if (!e.touches[0]) return;

    playerX = e.touches[0].clientX;

});

/* ---------- LOOP ---------- */

function loop() {

    if (!ctx) return;

    if (running) {

        update();

        draw();

    }

    requestAnimationFrame(loop);

}

/* ---------- UPDATE ---------- */

function update() {

    score++;

    coins += 0.05;

    setCoins(Math.floor(coins));

    bullets.forEach(b => b.y -= 10);

    bullets = bullets.filter(b => b.y > 0);

    if (Math.random() < 0.02) {

        enemies.push({

            x: Math.random() * canvas.width,

            y: -20

        });

    }

    enemies.forEach(e => e.y += 3);

    bullets.forEach(b => {

        enemies.forEach(e => {

            if (

                Math.abs(b.x - e.x) < 20 &&

                Math.abs(b.y - e.y) < 20

            ) {

                explosions.push({

                    x: e.x,

                    y: e.y,

                    frame: 0

                });

                playSound(boomSound);

                coins += 1;

                e.y = 9999;

            }

        });

    });

    explosions.forEach(ex => ex.frame++);

    explosions = explosions.filter(ex => ex.frame < 20);

    stars.forEach(s => {
        s.y += 1;
        if (s.y > canvas.height) s.y = 0;
    });

    stars2.forEach(s => {
        s.y += 2;
        if (s.y > canvas.height) s.y = 0;
    });

    stars3.forEach(s => {
        s.y += 3;
        if (s.y > canvas.height) s.y = 0;
    });

}

/* ---------- SHOOT ---------- */

function shoot() {

    if (!running) return;

    bullets.push({

        x: playerX,

        y: canvas.height - 80

    });

    playSound(shootSound);

}

/* ---------- DRAW ---------- */

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(s => {
        ctx.fillStyle = "white";
        ctx.fillRect(s.x, s.y, 2, 2);
    });

    stars2.forEach(s => {
        ctx.fillStyle = "lightblue";
        ctx.fillRect(s.x, s.y, 2, 2);
    });

    stars3.forEach(s => {
        ctx.fillStyle = "cyan";
        ctx.fillRect(s.x, s.y, 2, 2);
    });

    ctx.drawImage(playerImg, playerX - 25, canvas.height - 80, 50, 50);

    bullets.forEach(b => {
        ctx.fillStyle = "yellow";
        ctx.fillRect(b.x - 2, b.y, 4, 10);
    });

    enemies.forEach(e => {
        ctx.drawImage(enemyImg, e.x - 20, e.y - 20, 40, 40);
    });

    explosions.forEach(ex => {
        ctx.drawImage(explosionImg, ex.x - 25, ex.y - 25, 50, 50);
    });

    ctx.drawImage(coinIcon, 10, 10, 32, 32);

    ctx.fillStyle = "gold";

    ctx.font = "20px Arial";

    ctx.fillText(Math.floor(coins), 50, 32);

}
