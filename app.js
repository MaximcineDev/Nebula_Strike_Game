let canvas;
let ctx;

let score = 0;
let coins = 0;

let running = false;

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
        canvas.width / 2 - 20,
        canvas.height - 60,
        40,
        40
    );
}
