/* =========================
   NEBULA STRIKE FINAL
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


/* ---------- POWERUP IMAGES ---------- */

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

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


/* ---------- SHOP DATA ---------- */

let coins = parseInt(localStorage.getItem("coins")) || 0;
let weaponLevel = parseInt(localStorage.getItem("weaponLevel")) || 1;
let shieldOwned = localStorage.getItem("shieldOwned") === "yes";

let damage = weaponLevel;


/* ---------- GAME STATE ---------- */

let gameRunning = false;
let paused = false;

let score = 0;
let level = 1;

let health = 5;
let hitFlash = 0;

let bullets = [];
let enemies = [];
let enemyBullets = [];

let boss = null;
let bossHealth = 100;
let bossMaxHealth = 100;
let bossWarning = false;

let enemiesKilled = 0;


/* ---------- POWERUPS ---------- */

let powerups = [];

let rapidFire = false;
let rapidTimer = 0;

let shieldActive = false;
let shieldTimer = 0;


/* ---------- UPGRADES ---------- */

let fireRate = 300;
let skin = 0;
let premium = false;

let lastShot = 0;


/* ---------- SAVE ---------- */

function saveGame() {

    localStorage.setItem("coins", coins);
    localStorage.setItem("damage", damage);
    localStorage.setItem("fireRate", fireRate);
    localStorage.setItem("skin", skin);
    localStorage.setItem("premium", premium);
    localStorage.setItem("weaponLevel", weaponLevel);
    localStorage.setItem("shieldOwned", shieldOwned ? "yes" : "no");

}

function loadGame() {

    coins = parseInt(localStorage.getItem("coins")) || 0;
    damage = parseInt(localStorage.getItem("damage")) || 1;
    fireRate = parseInt(localStorage.getItem("fireRate")) || 300;
    skin = parseInt(localStorage.getItem("skin")) || 0;

    premium = localStorage.getItem("premium") === "true";

}

loadGame();

function resizeGame() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

}

window.addEventListener("resize", resizeGame);

resizeGame();


/* ---------- UPDATE HUD ---------- */

function updateHUD() {

    document.getElementById("coinText").innerText = coins;

}


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


/* ---------- TOUCH CONTROL ---------- */

let touchX = null;
let touchY = null;

canvas.addEventListener("touchstart", e => {

    let t = e.touches[0];

    touchX = t.clientX;
    touchY = t.clientY;

});

canvas.addEventListener("touchmove", e => {

    let t = e.touches[0];

    touchX = t.clientX;
    touchY = t.clientY;

});

canvas.addEventListener("touchend", () => {

    touchX = null;
    touchY = null;

});


/* ---------- SPLASH ---------- */

window.addEventListener("load", () => {

    const splash = document.getElementById("splashScreen");
    const menu = document.getElementById("main-menu");

    setTimeout(() => {

        splash.classList.add("hide");
        menu.classList.add("show");

        setTimeout(() => {

            splash.style.display = "none";

        }, 1000);

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

document.getElementById("pauseBtn").onclick = () => {

    paused = !paused;

    if (!paused) gameLoop();

};


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

   setInterval(() => {

        if (gameRunning) shoot();

    }, 250);

}


/* ---------- ENEMY SPAWN ---------- */

setInterval(() => {

    if (!gameRunning || boss) return;

    enemies.push({

        x: Math.random() * canvas.width,
        y: -40,

        w: 40,
        h: 40,

        hp: 2 + level

    });

}, 1500);


/* ---------- BOSS SPAWN ---------- */

setInterval(() => {

    if (!gameRunning) return;

    if (level >= 5 && !boss && !bossWarning) {

        bossWarning = true;
        showBossWarning();

    }

}, 2000);


function showBossWarning() {

    paused = true;

    const w = document.getElementById("bossWarning");

    w.style.display = "block";

    setTimeout(() => {

        w.style.display = "none";

        spawnBoss();

        paused = false;
        bossWarning = false;

    }, 2000);

}


function spawnBoss() {

    boss = {

        x: canvas.width / 2 - 80,
        y: 40,

        w: 160,
        h: 160

    };

    bossHealth = 100;
    bossMaxHealth = 100;

    document.getElementById("bossBar").style.display = "block";

}


function updateBossBar() {

    if (!boss) return;

    let bar = document.getElementById("bossHealth");

    let percent = (bossHealth / bossMaxHealth) * 100;

    bar.style.width = percent + "%";

}


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
    updateBossBar();
    updatePowerups();
    updateTimers();
    updateUI();

    requestAnimationFrame(gameLoop);

}


/* ---------- PLAYER ---------- */

function updatePlayer() {

    // keyboard

    if (moveLeft) player.x -= player.speed;
    if (moveRight) player.x += player.speed;
    if (moveUp) player.y -= player.speed;
    if (moveDown) player.y += player.speed;


    // touch follow

    if (touchX !== null) {

        player.x = touchX - player.width / 2;
        player.y = touchY - player.height / 2;

    }


    // keep inside screen

    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;

    if (player.x > canvas.width - player.width)
        player.x = canvas.width - player.width;

    if (player.y > canvas.height - player.height)
        player.y = canvas.height - player.height;

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

                e.hp -= damage;

                bullets.splice(i, 1);

                if (e.hp <= 0) {

                    explosionSound.play();

                    enemies.splice(ei, 1);

                    score += 10;
                    coins += 5;

                    /* powerup drop */

                    if (Math.random() < 0.3) {

                        let type = Math.floor(Math.random() * 3);

                        powerups.push({

                            x: e.x,
                            y: e.y,
                            type: type

                        });

                    }

                    updateHUD();
                    saveGame();

                    enemiesKilled++;

                    if (enemiesKilled >= 10) {

                        level++;
                        enemiesKilled = 0;

                    }

                }

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


/* ---------- POWERUPS ---------- */

function updatePowerups(){

    powerups.forEach((p,i)=>{

        p.y += 2;

        let img = healthImg;

        if(p.type===1) img = rapidImg;
        if(p.type===2) img = shieldImg;

        ctx.drawImage(img,p.x,p.y,32,32);


        if(

            p.x < player.x+player.width &&
            p.x+32 > player.x &&
            p.y < player.y+player.height &&
            p.y+32 > player.y

        ){

            if(p.type===0){

                if(health<5) health++;
                updateHearts();

            }

            if(p.type===1){

                rapidFire=true;
                rapidTimer=300;

            }

            if(p.type===2){

                shieldActive=true;
                shieldTimer=300;

            }

            powerups.splice(i,1);

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

            if(!shieldActive){

                health -= b.boss ? 2 : 1;

            }

            hitFlash = 10;

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

            h.src = "assets/ui/heart-full.png";

        } else {

            h.src = "assets/ui/heart-empty.png";

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
        boss.w,
        boss.h
    );

    if (Math.random() < 0.02) {

        enemyBullets.push({

            x: boss.x + boss.w / 2,
            y: boss.y + boss.h,

            w: 6,
            h: 14,

            boss: true

        });

    }

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


/* ---------- GAMEOVER ---------- */

function gameOver() {

    gameRunning = false;

    alert("Game Over");

    location.reload();

}


/* ---------- TIMERS ---------- */

function updateTimers(){

    if(rapidFire){

        rapidTimer--;

        fireRate = 100;

        if(rapidTimer <= 0){

            rapidFire = false;
            fireRate = 300;

        }

    }

    if(shieldActive){

        shieldTimer--;

        if(shieldTimer <= 0){

            shieldActive = false;

        }

    }

}


/* ---------- SHOP ---------- */

function openShop() {

    document.getElementById("shop").style.display = "block";

}

function closeShop() {

    document.getElementById("shop").style.display = "none";

}


/* ---------- PURCHASE WEAPON ---------- */

function buyWeapon() {

    let cost = weaponLevel * 20;

    if (coins >= cost) {

        coins -= cost;

        weaponLevel++;
        damage = weaponLevel;

        saveGame();
        updateHUD();

        alert("Weapon upgraded to Lv " + weaponLevel);

    } else {

        alert("Not enough coins");

    }

}


/* ---------- PURCHASE SHIELD ---------- */

function buyShield() {

    let cost = 50;

    if (shieldOwned) {

        alert("Shield already owned");
        return;

    }

    if (coins >= cost) {

        coins -= cost;

        shieldOwned = true;

        saveGame();
        updateHUD();

        alert("Shield unlocked!");

    } else {

        alert("Not enough coins");

    }

}


/* ---------- SETTINGS ---------- */

function openSettings() {

    document.getElementById("settings").style.display = "block";

}

function closeSettings() {

    document.getElementById("settings").style.display = "none";

}
