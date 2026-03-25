/* =========================
   NEBULA STRIKE - FINAL FIX
========================= */

/* ---------- CANVAS SETUP ---------- */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 140;
}
window.addEventListener("resize", resizeGame);

/* ---------- GAME STATE ---------- */
let gameRunning = false;
let paused = false;
let score = 0;
let level = 1;
let coins = 0;
let weaponLevel = 1;
let maxHearts = 5;
let health = maxHearts;
let shieldLevel = 0;
let highestLevel = 1;
let premium = false;
let fireRate = 300;
let lastShot = 0;
let bullets = [];
let enemies = [];
let enemyBullets = [];
let powerups = [];
let boss = null;
let bossHP = 0;
let bossMaxHP = 0;
let damage = 1;
let rapidFire = false;
let rapidTimer = 0;
let shieldActive = false;
let shieldTimer = 0;
let soundOn = true;
let spawnTimer = 0;
let enemySpawnRate = 1500;
let enemySpeed = 2;
let maxEnemies = 5;

/* ---------- PLAYER ---------- */
const player = {
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    speed: 6
};

/* ---------- INPUT ---------- */
let moveLeft=false, moveRight=false, moveUp=false, moveDown=false;
window.addEventListener("keydown", e=>{
    if(e.key==="ArrowLeft") moveLeft=true;
    if(e.key==="ArrowRight") moveRight=true;
    if(e.key==="ArrowUp") moveUp=true;
    if(e.key==="ArrowDown") moveDown=true;
});
window.addEventListener("keyup", e=>{
    if(e.key==="ArrowLeft") moveLeft=false;
    if(e.key==="ArrowRight") moveRight=false;
    if(e.key==="ArrowUp") moveUp=false;
    if(e.key==="ArrowDown") moveDown=false;
});

/* ---------- TOUCH SUPPORT ---------- */
let touchX=null, touchY=null;
canvas.addEventListener("touchstart", e=>{
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchX = t.clientX - rect.left;
    touchY = t.clientY - rect.top;
    shoot();
},{passive:false});
canvas.addEventListener("touchmove", e=>{
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchX = t.clientX - rect.left;
    touchY = t.clientY - rect.top;
},{passive:false});
canvas.addEventListener("touchend", ()=>{touchX=null; touchY=null;},{passive:false});

/* ---------- IMAGES ---------- */
const bgImg = new Image(); bgImg.src = "assets/background.png";
const playerImg = new Image(); playerImg.src = "assets/player.png";
const healthImg = new Image(); healthImg.src = "assets/ui/heart-full.png";
const skins = ["assets/player.png","assets/player2.png","assets/player3.png","assets/player4.png"];
let currentSkin = 0;
function updateSkin(){ playerImg.src = skins[currentSkin]; }

/* ---------- SOUNDS ---------- */
const shootSound = new Audio("assets/sounds/shoot.wav");
const explosionSound = new Audio("assets/sounds/explosion.wav");
const music = new Audio("assets/sounds/music.mp3"); music.loop=true; music.volume=0.5;

/* ---------- HUD ---------- */
function updateHUD(){
    document.getElementById("coinText").innerText = coins;
    document.getElementById("levelText").innerText = "Lv " + level;
    document.getElementById("scoreText").innerText = "Score: " + score;
    updateHeartsUI();
}
function updateHeartsUI(){
    const hearts = document.querySelectorAll("#hearts img");
    for(let i=0;i<hearts.length;i++){
        hearts[i].src = i < health ? "assets/ui/heart-full.png" : "assets/ui/heart-empty.png";
    }
}

/* ---------- GAME LOOP ---------- */
function gameLoop(){
    if(!gameRunning || paused) return;

    // CLEAR CANVAS
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // DRAW BACKGROUND
    if(bgImg.complete) ctx.drawImage(bgImg,0,0,canvas.width,canvas.height);

    // UPDATE PLAYER
    updatePlayer(); drawPlayer();

    // UPDATE BULLETS
    updateBullets();

    // UPDATE ENEMIES
    updateEnemies();

    // UPDATE HUD
    updateHUD();

    // SPAWN ENEMIES
    spawnTimer++;
    if(spawnTimer > enemySpawnRate/16){ spawnEnemy(); spawnTimer=0; }

    requestAnimationFrame(gameLoop);
}

/* ---------- PLAYER MOVEMENT ---------- */
function updatePlayer(){
    if(moveLeft) player.x-=player.speed;
    if(moveRight) player.x+=player.speed;
    if(moveUp) player.y-=player.speed;
    if(moveDown) player.y+=player.speed;

    if(touchX!==null){
        player.x += (touchX - player.x - player.width/2)*0.2;
        player.y += (touchY - player.y - player.height/2)*0.2;
    }

    // Keep player in bounds
    if(player.x<0) player.x=0;
    if(player.x+player.width>canvas.width) player.x=canvas.width-player.width;
    if(player.y<0) player.y=0;
    if(player.y+player.height>canvas.height) player.y=canvas.height-player.height;
}
function drawPlayer(){ ctx.drawImage(playerImg,player.x,player.y,player.width,player.height); }

/* ---------- BULLETS ---------- */
let bullets = [];
function shoot(){
    const now = Date.now();
    if(now - lastShot < fireRate) return;
    lastShot = now;
    if(soundOn){ shootSound.currentTime=0; shootSound.play(); }

    bullets.push({x:player.x+player.width/2-2, y:player.y, w:4,h:10});
}
function updateBullets(){
    for(let i=bullets.length-1;i>=0;i--){
        const b = bullets[i];
        b.y -= 8;
        ctx.fillStyle="cyan";
        ctx.fillRect(b.x,b.y,b.w,b.h);
        if(b.y<0) bullets.splice(i,1);
    }
}

/* ---------- ENEMIES ---------- */
let enemies = [];
function spawnEnemy(){
    if(enemies.length>=5) return;
    const e={x:Math.random()*(canvas.width-40),y:-40,w:40,h:40,hp:3};
    enemies.push(e);
}
function updateEnemies(){
    for(let i=enemies.length-1;i>=0;i--){
        const e=enemies[i];
        e.y+=2;
        ctx.fillStyle="red";
        ctx.fillRect(e.x,e.y,e.w,e.h);
        if(e.y>canvas.height) enemies.splice(i,1);
    }
}

/* ---------- START/PAUSE ---------- */
function startGame(){
    document.getElementById("main-menu").style.display="none";
    health=maxHearts;
    score=0;
    coins=0;
    gameRunning=true;
    if(soundOn) music.play();
    gameLoop();
}
function pauseGame(){
    paused=true;
    document.getElementById("pauseMenu").style.display="flex";
}
function resumeGame(){
    paused=false;
    document.getElementById("pauseMenu").style.display="none";
    gameLoop();
}

/* ---------- SHOP & SETTINGS ---------- */
function openShop(){ document.getElementById("shop").style.display="flex"; }
function closeShop(){ document.getElementById("shop").style.display="none"; }
function openSettings(){ document.getElementById("settings").style.display="flex"; }
function closeSettings(){ document.getElementById("settings").style.display="none"; }

/* ---------- SAVE ---------- */
function saveGame(){ localStorage.setItem("coins",coins); localStorage.setItem("level",level); }

/* ---------- WINDOW LOAD ---------- */
window.addEventListener("load", ()=>{
    resizeGame();
    const splash = document.getElementById("splashScreen");
    if(splash) setTimeout(()=>{ splash.style.display="none"; document.getElementById("main-menu").style.display="block"; },800);
});
