let canvas;
let ctx;

let score = 0;
let coins = 0;

let running = false;

let playerX = 0;

let bullets = [];

let enemies = [];

let boss = null;

const SAVE_KEY = "nebula_save";

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


function shoot() {

    if (!running) return;

    bullets.push({
        x: playerX,
        y: canvas.height - 80
    });

    playSound(shootSound);

}


let shootSound = new Audio(
    "./assets/sounds/shoot.wav"
);


function playSound(s) {

    if (!s) return;

    s.currentTime = 0;

    s.play().catch(() => { });

}


function init() {

    canvas = document.getElementById(
        "gameCanvas"
    );

    if (!canvas) {

        alert("Canvas missing");

        return;
    }

    ctx = canvas.getContext("2d");

    resize();

    requestAnimationFrame(loop);
}


function resize() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

}


window.addEventListener(
    "resize",
    resize
);


function loop() {

    if (!running) return;

    update();
    draw();

    requestAnimationFrame(loop);
}


function update() {

    score++;

    coins += 0.1;

    SAVE.coins = Math.floor(coins);

    saveGame(SAVE);

    document.getElementById("score").innerText = score;

    document.getElementById("coins").innerText =
        Math.floor(coins);

    playerX += 0;

    window.addEventListener("mousemove", e => {

        playerX = e.clientX;

    });

    window.addEventListener("touchmove", e => {

        playerX = e.touches[0].clientX;

    });

    bullets.forEach(b => {

        b.y -= 10;

    });

    bullets = bullets.filter(b => b.y > 0);

    if (Math.random() < 0.02) {

        enemies.push({

            x: Math.random() * canvas.width,
            y: -20

        });

    }

    enemies.forEach(e => {

        e.y += 3;

    });

    bullets.forEach(b => {

        enemies.forEach(e => {

            if (
                Math.abs(b.x - e.x) < 20 &&
                Math.abs(b.y - e.y) < 20
            ) {

                e.y = 9999;

                score += 10;

                coins += 1;

            }

        });

    });

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

            boss = null;

            score += 200;

            coins += 50;

        }

    }
}


function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "cyan";

    ctx.fillRect(
        playerX - 20,
        canvas.height - 60,
        40,
        40
    );

    ctx.fillStyle = "cyan";

    bullets.forEach(b => {

        ctx.fillRect(
            b.x,
            b.y,
            4,
            10
        );

    });

    ctx.fillStyle = "red";

    enemies.forEach(e => {

        ctx.fillRect(
            e.x,
            e.y,
            30,
            30
        );

    });

    if (boss) {

        ctx.fillStyle = "orange";

        ctx.fillRect(
            boss.x - 50,
            boss.y,
            100,
            40
        );

    }
}
