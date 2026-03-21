/* =========================
        NEBULA STRIKE
   ========================= */

let canvas, ctx;
let score = 0;
let coins = 0;
let running = false;
let playerX = 0;

let bullets = [], enemyBullets = [], enemies = [], explosions = [], bossBullets = [];
let stars = [], stars2 = [], stars3 = [];
let LOW_MODE = true;

// ---------------- ASSETS ----------------
let assetsLoaded = 0;
let assetsToLoad = 0;

function assetLoaded() {
    assetsLoaded++;
    if (assetsLoaded >= assetsToLoad) {
        console.log("All assets loaded");
        init();
    }
}

// ---------------- SAVE ----------------
function getCoins() { let c = localStorage.getItem("coins"); if (!c) c = 0; return parseInt(c); }
function setCoins(v) { localStorage.setItem("coins", v); }
coins = getCoins();

// ---------------- IMAGES ----------------
assetsToLoad++;
const playerImg = new Image(); playerImg.onload = assetLoaded; playerImg.onerror = assetLoaded;
playerImg.src = "./assets/player.png";

assetsToLoad++;
const enemyImg = new Image(); enemyImg.onload = assetLoaded; enemyImg.onerror = assetLoaded;
enemyImg.src = "./assets/enemy.png";

assetsToLoad++;
const bossImg = new Image(); bossImg.onload = assetLoaded; bossImg.onerror = assetLoaded;
bossImg.src = "./assets/boss.png";

assetsToLoad++;
const explosionImg = new Image(); explosionImg.onload = assetLoaded; explosionImg.onerror = assetLoaded;
explosionImg.src = "./assets/explosion.png";

assetsToLoad++;
const starImg = new Image(); starImg.onload = assetLoaded; starImg.onerror = assetLoaded;
starImg.src = "./assets/star.png";

const bgImg = new Image(); bgImg.src = "./assets/background.png"; // background

// ---------------- UI ----------------
const coinIcon = new Image(); coinIcon.src = "./assets/ui/coin-icon.png";

// ---------------- SOUND ----------------
const boomSound = new Audio("./assets/sounds/explosion.wav");
const shootSound = new Audio("./assets/sounds/shoot.wav");

function playSound(s) { if (!s) return; s.currentTime = 0; s.play().catch(() => {}); }

// ---------------- PLAYER & BOSS ----------------
let boss = { x: 0, y: 100, width: 80, height: 80, health: 100, alive: false };

// ---------------- START ----------------
function startGame() {
    document.getElementById("main-menu").style.display = "none";
    running = true;
}

// ---------------- INIT ----------------
function init() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    resize();

    for (let i = 0; i < (LOW_MODE ? 15 : 40); i++) stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height });
    for (let i = 0; i < (LOW_MODE ? 10 : 30); i++) stars2.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height });
    for (let i = 0; i < (LOW_MODE ? 5 : 20); i++) stars3.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height });

    window.addEventListener("mousemove", e => playerX = e.clientX);
    window.addEventListener("touchmove", e => { if(e.touches[0]) playerX = e.touches[0].clientX; });

    document.getElementById("shootBtn").addEventListener("click", shoot);
    canvas.addEventListener("click", shoot);
    canvas.addEventListener("touchstart", shoot);

    requestAnimationFrame(loop);
}

// ---------------- RESIZE ----------------
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener("resize", resize);

// ---------------- LOOP ----------------
function loop() { if(running){ update(); draw(); } requestAnimationFrame(loop); }

// ---------------- UPDATE ----------------
function update() {
    score++;
    coins += 0.05;
    setCoins(Math.floor(coins));

    // ---------------- BULLETS ----------------
    bullets.forEach(b => b.y -= 10);
    bullets = bullets.filter(b => b.y > 0);

    // ---------------- ENEMIES ----------------
    if (Math.random() < 0.02) enemies.push({ x: Math.random()*canvas.width, y: -20 });
    enemies.forEach(e => {
        e.y += 3;
        if(Math.random() < 0.01) enemyBullets.push({ x: e.x, y: e.y });
    });

    // ---------------- PLAYER BULLETS HIT ENEMIES ----------------
    bullets.forEach(b => {
        enemies.forEach(e => {
            if(Math.abs(b.x - e.x) < 20 && Math.abs(b.y - e.y) < 20) {
                explosions.push({ x: e.x, y: e.y, frame: 0 });
                playSound(boomSound);
                coins += 1;
                e.y = 9999;
                b.y = -10;
            }
        });
    });

    // ---------------- PLAYER BULLETS HIT BOSS ----------------
    if (boss.alive) {
        bullets.forEach(b => {
            if(b.x > boss.x - boss.width/2 && b.x < boss.x + boss.width/2 && b.y > boss.y - boss.height/2 && b.y < boss.y + boss.height/2) {
                boss.health -= 10;
                explosions.push({ x: b.x, y: b.y, frame: 0 });
                playSound(boomSound);
                b.y = -10;
                if(boss.health <= 0) { boss.alive = false; coins += 50; console.log("Boss defeated!"); }
            }
        });
    }

    // ---------------- ENEMY BULLETS HIT PLAYER ----------------
    enemyBullets.forEach(b => {
        if(Math.abs(b.x - playerX) < 25 && b.y > canvas.height - 100){
            console.log("Player hit!");
        }
        b.y += 5;
    });
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height);

    explosions.forEach(ex => ex.frame++);
    explosions = explosions.filter(ex => ex.frame < 20);

    // ---------------- STARS ----------------
    stars.forEach(s => { s.y += 1; if(s.y > canvas.height) s.y = 0; });
    stars2.forEach(s => { s.y += 2; if(s.y > canvas.height) s.y = 0; });
    stars3.forEach(s => { s.y += 3; if(s.y > canvas.height) s.y = 0; });

    // ---------------- SPAWN BOSS ----------------
    if(!boss.alive && score > 1000) {
        boss.alive = true;
        boss.health = 100;
        boss.x = canvas.width / 2;
        boss.y = 100;
    }
}

// ---------------- SHOOT ----------------
function shoot() {
    if(!running) return;
    bullets.push({ x: playerX, y: canvas.height - 80 });
    playSound(shootSound);
}

// ---------------- DRAW ----------------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    if(bgImg.complete) ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    // Stars
    stars.forEach(s => { ctx.fillStyle="white"; ctx.fillRect(s.x, s.y, 2,2); });
    stars2.forEach(s => { ctx.fillStyle="lightblue"; ctx.fillRect(s.x, s.y, 2,2); });
    stars3.forEach(s => { ctx.fillStyle="cyan"; ctx.fillRect(s.x, s.y, 2,2); });

    // Player
    ctx.drawImage(playerImg, playerX-25, canvas.height-80, 50, 50);

    // Bullets
    bullets.forEach(b => { ctx.fillStyle="yellow"; ctx.fillRect(b.x-2, b.y, 4, 10); });
    enemyBullets.forEach(b => { ctx.fillStyle="red"; ctx.fillRect(b.x-2, b.y, 4, 10); });

    // Enemies
    enemies.forEach(e => ctx.drawImage(enemyImg, e.x-20, e.y-20, 40, 40));

    // Boss
    if(boss.alive){
        ctx.drawImage(bossImg, boss.x-boss.width/2, boss.y-boss.height/2, boss.width, boss.height);
        // Health bar
        ctx.fillStyle="red";
        ctx.fillRect(boss.x-40, boss.y-50, 80, 10);
        ctx.fillStyle="green";
        ctx.fillRect(boss.x-40, boss.y-50, boss.health*0.8, 10);
    }

    // Explosions
    explosions.forEach(ex => ctx.drawImage(explosionImg, ex.x-25, ex.y-25, 50,50));

    // HUD
    ctx.drawImage(coinIcon, 10, 10, 32, 32);
    ctx.fillStyle="gold";
    ctx.font="20px Arial";
    ctx.fillText(Math.floor(coins), 50, 32);

    ctx.fillStyle="white";
    ctx.fillText("Score: "+score, 10, 60);
}
