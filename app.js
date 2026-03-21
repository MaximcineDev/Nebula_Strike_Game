let coins = 0;
let score = 0;

let weaponLevel = 1;
let skin = 0;
let premium = false;

let gameRunning = false;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const playerImg = new Image();
playerImg.src = "assets/player.png";

let bullets = [];

const player = {
    x: 200,
    y: 400,
    width: 50,
    height: 50
};

window.addEventListener("load", () => {
    loadGame();

    const splash = document.getElementById("splashScreen");

    setTimeout(() => {
        splash.style.opacity = 0;

        setTimeout(() => {
            splash.style.display = "none";
        }, 1000);

    }, 2000);
});

document.getElementById("startBtn").addEventListener("click", startGame);

function startGame() {
    gameRunning = true;
    score = 0;
    updateUI();
    loop();
}

function loop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer();
    updateBullets();

    requestAnimationFrame(loop);
}

function drawPlayer() {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

function shoot() {
    if (weaponLevel === 1) {
        bullets.push({ x: player.x + 20, y: player.y });
    }

    if (weaponLevel >= 2) {
        bullets.push({ x: player.x + 10, y: player.y });
        bullets.push({ x: player.x + 30, y: player.y });
    }
}

canvas.addEventListener("click", shoot);
canvas.addEventListener("touchstart", shoot);

function updateBullets() {
    bullets.forEach(b => {
        b.y -= 10;
        ctx.fillRect(b.x, b.y, 4, 10);
    });
}

/* SAVE & LOAD */

function saveGame() {
    localStorage.setItem(
        "nebulaSave",
        JSON.stringify({
            coins,
            weaponLevel,
            skin,
            premium
        })
    );
}

function loadGame() {
    let s = localStorage.getItem("nebulaSave");
    if (!s) return;

    let d = JSON.parse(s);
    coins = d.coins || 0;
    weaponLevel = d.weaponLevel || 1;
    skin = d.skin || 0;
    premium = d.premium || false;
}

/* UI */

function updateUI() {
    document.getElementById("coinText").textContent = coins;
    document.getElementById("scoreText").textContent = "Score: " + score;
}

/* SHOP */

function openShop() {
    document.getElementById("shop").style.display = "block";
}

function closeShop() {
    document.getElementById("shop").style.display = "none";
}

function buyWeapon() {
    if (coins < 20) return;

    coins -= 20;
    weaponLevel++;
    saveGame();
    updateUI();
}

function buySkin() {
    if (coins < 15) return;

    coins -= 15;
    skin++;
    saveGame();
    updateUI();
}

function buyPremium() {
    if (coins < 50) return;

    coins -= 50;
    premium = true;
    saveGame();
    updateUI();
}
