/* =========================
   NEBULA STRIKE - APP.JS
========================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// =========================
// GAME STATE
// =========================
let gameRunning = false;
let paused = false;
let level = 1;
let score = 0;
let coins = 0;
let health = 5;
let maxHearts = 5;
let weaponLevel = 1;
let shieldLevel = 0;
let premium = false;

// =========================
// PLAYER
// =========================
let player = {
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    speed: 6
};
let bullets = [];

// =========================
// ENEMIES & POWERUPS
// =========================
let enemies = [];
let enemyBullets = [];
let powerups = [];

// =========================
// IMAGES
// =========================
const playerImg = new Image();
playerImg.src = "assets/player.png";

const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";

const bgImg = new Image();
bgImg.src = "assets/background.png";

// =========================
// HUD ELEMENTS
// =========================
const heartsEl = document.querySelectorAll("#hearts img");
const coinText = document.getElementById("coinText");
const levelText = document.getElementById("levelText");
const scoreText = document.getElementById("scoreText");

// =========================
// GAME SETUP
// =========================
function resizeGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 140;
}

function updateHUD() {
    heartsEl.forEach((h, i) => {
        h.src = i < health ? "assets/ui/heart-full.png" : "assets/ui/heart-empty.png";
    });
    coinText.innerText = coins;
    levelText.innerText = "Lv " + level + " | W" + weaponLevel;
    scoreText.innerText = "Score: " + score;
}

// =========================
// SPLASH SCREEN
// =========================
window.onload = () => {
    resizeGame();
    const splash = document.getElementById("splashScreen");
    const mainMenu = document.getElementById("main-menu");
    setTimeout(() => {
        splash.classList.add("hide");
        setTimeout(() => {
            splash.style.display = "none";
            mainMenu.style.display = "flex";
        }, 800);
    }, 1500); // simulate loading
};

// =========================
// GAME LOOP
// =========================
function startGame() {
    document.getElementById("main-menu").style.display = "none";
    gameRunning = true;
    paused = false;
    updateHUD();
    gameLoop();
}

function gameLoop() {
    if (!gameRunning || paused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    // Draw bullets
    bullets.forEach(b => {
        ctx.fillStyle = "yellow";
        ctx.fillRect(b.x, b.y, b.width, b.height);
        b.y -= b.speed;
    });
    bullets = bullets.filter(b => b.y + b.height > 0);

    // Draw enemies
    enemies.forEach(e => {
        ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);
        e.y += e.speed;
    });
    enemies = enemies.filter(e => e.y < canvas.height);

    // Next frame
    requestAnimationFrame(gameLoop);

    updateHUD();
}

// =========================
// PLAYER CONTROL
// =========================
window.addEventListener("keydown", e => {
    if (!gameRunning) return;
    if (e.key === "ArrowLeft") player.x -= player.speed;
    if (e.key === "ArrowRight") player.x += player.speed;
    if (e.key === " ") shootBullet();
});

function shootBullet() {
    bullets.push({
        x: player.x + player.width / 2 - 5,
        y: player.y,
        width: 10,
        height: 20,
        speed: 10
    });
}

// =========================
// MENU BUTTONS
// =========================
function openShop() { document.getElementById("shop").style.display = "flex"; }
function closeShop() { document.getElementById("shop").style.display = "none"; }

function openSettings() { document.getElementById("settings").style.display = "flex"; }
function closeSettings() { document.getElementById("settings").style.display = "none"; }

function pauseGame() {
    paused = true;
    document.getElementById("pauseMenu").style.display = "flex";
}

function resumeGame() {
    paused = false;
    document.getElementById("pauseMenu").style.display = "none";
    gameLoop();
}

function quitGame() {
    gameRunning = false;
    document.getElementById("main-menu").style.display = "flex";
}

// =========================
// SHOP FUNCTIONS
// =========================
function buySkin(n) { alert("Skin " + (n+1) + " purchased!"); }
function buyWeapon() { alert("Weapon upgraded!"); }
function buyShield() { alert("Shield purchased!"); }
function buyHearts() { health = maxHearts; updateHUD(); alert("Hearts restored!"); }

// =========================
// LEVEL FUNCTIONS
// =========================
function nextLevel() {
    level++;
    document.getElementById("levelComplete").style.display = "none";
    updateHUD();
    gameLoop();
}

// =========================
// WINDOW RESIZE
// =========================
window.addEventListener("resize", resizeGame);
