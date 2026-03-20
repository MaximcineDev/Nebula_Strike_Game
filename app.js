let canvas;
let ctx;

let score = 0;
let coins = 0;

let running = false;

let playerX = 0;

let bullets = [];
let enemies = [];
let explosions = [];
let stars = [];
let stars2 = [];
let stars3 = [];

let boss = null;

let shake = 0;

let particles = [];

let bossBullets = [];

let level = 1;

let combo = 0;
let comboTimer = 0;

const SAVE_KEY = "nebula_save";


/* ---------- IMAGES ---------- */

const playerImg = new Image();
playerImg.src = "./assets/player.png";

const enemyImg = new Image();
enemyImg.src = "./assets/enemy.png";

const bossImg = new Image();
bossImg.src = "./assets/boss.png";

const explosionImg = new Image();
explosionImg.src = "./assets/explosion.png";

const starImg = new Image();
starImg.src = "./assets/star.png";


/* ---------- SOUND ---------- */

const boomSound = new Audio("./assets/sounds/explosion.wav");

const shootSound = new Audio("./assets/sounds/shoot.wav");


/* ---------- SAVE ---------- */

function loadSave() {

    let s = localStorage.getItem(SAVE_KEY);

    if (!s) {
        return {
            coins: 0,
            skin: "default",
            achievements: {}
        };
    }

    return JSON.parse(s);
}

function saveGame(data) {

    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(data)
    );
}

let SAVE = loadSave();


/* ---------- START ---------- */

function startGame() {

    document.getElementById(
        "main-menu"
    ).style.display = "none";

    running = true;

    init();
}


function openShop() {
    window.location.href = "./shop.html";
}

function openAchievements() {
    window.location.href = "./achievements.html";
}

function screenShake(power) {
    shake = power;
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


function playSound(s) {

    if (!s) return;

    s.currentTime = 0;

    s.play().catch(() => {});
}


/* ---------- INIT ---------- */

function init() {

    canvas = document.getElementById("gameCanvas");

    if (!canvas) {
        alert("Canvas missing");
        return;
    }

    ctx = canvas.getContext("2d");

    resize();

    requestAnimationFrame(loop);

    // stars
    for (let i = 0; i < 40; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        });
    }

    for (let i = 0; i < 30; i++) {
        stars2.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        });
    }

    for (let i = 0; i < 20; i++) {
        stars3.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        });
    }
}


function resize() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);


window.addEventListener("mousemove", e => {
    playerX = e.clientX;
});

window.addEventListener("touchmove", e => {
    playerX = e.touches[0].clientX;
});


/* ---------- LOOP ---------- */

function loop() {

    if (!running) return;

    update();
    draw();

    requestAnimationFrame(loop);
}


/* ---------- UPDATE ---------- */

function update() {

    score++;

    coins += 0.1;

    SAVE.coins = Math.floor(coins);
    saveGame(SAVE);

    document.getElementById("score").innerText = score;
    document.getElementById("coins").innerText = Math.floor(coins);

    if (shake > 0) {
        shake--;
    }
    
    /* bullets */

    bullets.forEach(b => {
        b.y -= 10;
    });

    bullets = bullets.filter(b => b.y > 0);


    /* spawn enemies */

    if (Math.random() < 0.03) {

        enemies.push({

            x: Math.random() * canvas.width,
            y: -20,
            type: Math.floor(Math.random() * 3)

        });

    }

    if (Math.random() < 0.02 + level * 0.002)


    /* bullet hit */

    bullets.forEach(b => {

        enemies.forEach(e => {

            if (
                Math.abs(b.x - e.x) < 20 &&
                Math.abs(b.y - e.y) < 20
            ) {

                explosions.push({
                    x: boss.x,
                    y: boss.y,
                    frame: 0
                });

                playSound(boomSound);

                e.y = 9999;

                score += 10;
                coins += 1;
            }

        });

    });

    enemies.forEach(e => {

        if (e.type === 0) e.y += 3;

        if (e.type === 1) {
            e.y += 2;
            e.x += Math.sin(e.y * 0.05) * 2;
        }

        if (e.type === 2) {
            e.y += 4;
        }

    });


    enemies = enemies.filter(
        e => e.y < canvas.height
    );

    screenShake(10);

    for (let i = 0; i < 5; i++) {

        particles.push({

            x: e.x,
            y: e.y,
            vx: Math.random() * 4 - 2,
            vy: Math.random() * 4 - 2,
            life: 20

        });

    }

    combo++;
    comboTimer = 60;
    score += combo * 2;

    if (comboTimer > 0) {
        comboTimer--;
    } else {
        combo = 0;
    }

    /* boss */

    if (score > 500 && !boss) {

        boss = {
            x: canvas.width / 2,
            y: 50,
            hp: 30
        };
    }

    if (boss) {

        bullets.forEach(b => {

            if (
                Math.abs(b.x - boss.x) < 50 &&
                Math.abs(b.y - boss.y) < 50
            ) {
                boss.hp--;
            }

        });

        if (boss.hp <= 0) {

            explosions.push({
                x: boss.x,
                y: boss.y,
                time: 40
            });

            boss = null;

            score += 200;
            coins += 50;
        }
    }

    if (boss && Math.random() < 0.05) {

        bossBullets.push({

            x: boss.x,
            y: boss.y,
            vy: 5

        });

    }

    bossBullets.forEach(b => {
        b.y += b.vy;
    });

    screenShake(20);

    /* explosions */

    explosions.forEach(ex => {
        ex.frame++;
    });

    explosions = explosions.filter(
        ex => ex.frame < 20
    );


    /* stars */

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

    particles.forEach(p => {

        p.x += p.vx;
        p.y += p.vy;
        p.life--;

    });

    particles = particles.filter(
        p => p.life > 0
    );

    if (score > level * 500) {
        level++;
    }

}


/* ---------- DRAW ---------- */

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.save();

    if (shake > 0) {

        ctx.translate(
            Math.random() * shake - shake / 2,
            Math.random() * shake - shake / 2
        );

    }


    /* stars */

    stars.forEach(s => {
        ctx.drawImage(starImg, s.x, s.y, 2, 2);
    });

    stars2.forEach(s => {
        ctx.drawImage(starImg, s.x, s.y, 3, 3);
    });

    stars3.forEach(s => {
        ctx.drawImage(starImg, s.x, s.y, 4, 4);
    });


    /* player */

    ctx.drawImage(
        playerImg,
        playerX - 32,
        canvas.height - 80,
        64,
        64
    );


    /* bullets */

    bullets.forEach(b => {

        ctx.shadowBlur = 10;
        ctx.shadowColor = "cyan";

        ctx.fillStyle = "cyan";

        ctx.fillRect(
            b.x,
            b.y,
            4,
            12
        );

        ctx.shadowBlur = 0;

    });


    /* enemies */

    enemies.forEach(e => {

        ctx.drawImage(
            enemyImg,
            e.x - 32,
            e.y - 32,
            64,
            64
        );

    });


    /* boss */

    if (boss) {

        ctx.drawImage(
            bossImg,
            boss.x - 64,
            boss.y - 32,
            128,
            64
        );
    }

    if (boss) {

        let maxHP = 30;

        let w = 300;
        let h = 20;

        let x = canvas.width / 2 - w / 2;
        let y = 20;

        ctx.fillStyle = "black";
        ctx.fillRect(x, y, w, h);

        ctx.fillStyle = "red";

        ctx.fillRect(
            x,
            y,
            w * (boss.hp / maxHP),
            h
        );

        ctx.strokeStyle = "white";
        ctx.strokeRect(x, y, w, h);
    }

    bossBullets.forEach(b => {

        ctx.fillStyle = "red";

        ctx.fillRect(
            b.x,
            b.y,
            4,
            10
        );

    });


    /* explosions */

    explosions.forEach(ex => {

        ctx.drawImage(
            explosionImg,
            ex.frame * 64, 0,   // sprite frame
            64, 64,
            ex.x - 32,
            ex.y - 32,
            64,
            64
        );

    });

    particles.forEach(p => {

        ctx.fillStyle = "orange";

        ctx.fillRect(
            p.x,
            p.y,
            2,
            2
        );

    });

    ctx.fillStyle = "white";
    ctx.fillText(
        "Level " + level,
        20,
        60
    );

    ctx.fillText(
        "Combo " + combo,
        20,
        90
    );

    ctx.restore();
}
