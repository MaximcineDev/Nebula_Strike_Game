/* =========================
   NEBULA STRIKE
========================= */

console.log("APP STARTED - FINAL VERSION");

/* ---------- IMAGES ---------- */

const playerImg = new Image();
playerImg.src = "assets/player.png";

const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";

const enemyFastImg = new Image();
enemyFastImg.src = "assets/enemies/enemy-fast.png";

const enemyTankImg = new Image();
enemyTankImg.src = "assets/enemies/enemy-tank.png";

const enemyShooterImg = new Image();
enemyShooterImg.src = "assets/enemies/enemy-shooter.png";

const bossImg = new Image();
bossImg.src = "assets/boss.png";

const bgImg = new Image();
bgImg.src = "assets/background.png";

bgImg.onerror = function() {
    console.error("Background image failed to load!");
    window.bgGradient = true;
};

const explosionImg = new Image();
explosionImg.src = "assets/effects/explosion.png";

const coinImg = new Image();
coinImg.src = "assets/ui/coin-icon.png";

let currentSkin = 0;

const skins = [
    "assets/player.png",
    "assets/skins/skin1.png",
    "assets/skins/skin2.png",
    "assets/skins/skin3.png",
    "assets/skins/skin4.png"
];

function updateSkin(){
    playerImg.src = skins[currentSkin];
}
updateSkin();

/* ---------- POWERUPS ---------- */

const healthImg = new Image();
healthImg.src = "assets/ui/health.png";

const rapidImg = new Image();
rapidImg.src = "assets/ui/rapid.png";

const shieldImg = new Image();
shieldImg.src = "assets/ui/shield.png";

const ENEMY_NORMAL = 0;
const ENEMY_FAST = 1;
const ENEMY_TANK = 2;
const ENEMY_SHOOTER = 3;

/* ---------- SOUNDS ---------- */

const shootSound = new Audio("assets/sounds/shoot.wav");
const explosionSound = new Audio("assets/sounds/explosion.wav");
const powerupSound = new Audio("assets/sounds/powerup.wav");

let menuMusic = new Audio("assets/sounds/menu.mp3");
menuMusic.loop = true;
menuMusic.volume = 0.7;

let gameMusic = new Audio("assets/sounds/music.mp3");
gameMusic.loop = true;
gameMusic.volume = 0.7;

/* ---------- AUDIO FIX ---------- */

let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioUnlocked = false;

function unlockAudio(){
    if(audioUnlocked) return;
    audioUnlocked = true;

    if(audioContext.state === "suspended"){
        audioContext.resume().then(() => {
            console.log("AudioContext resumed, playing music");
            playMenuMusic();
        }).catch(e => console.log("Resume failed:", e));
    } else {
        playMenuMusic();
    }
}

function playMenuMusic(){
    if(soundOn && menuMusic.paused){
        menuMusic.currentTime = 0;
        menuMusic.play().catch(e => console.log("Music play failed:", e));
    }
}

function playSilentSound(){
    const silentBuffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = silentBuffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function setupAudioUnlock(){
    const unlockEvents = ['click', 'touchstart', 'touchend', 'keydown'];
    
    const tryUnlock = (e) => {
        unlockAudio();

        menuMusic.currentTime = 0;
        menuMusic.play().catch(()=>{});
    };
    
    unlockEvents.forEach(event => {
        document.addEventListener(event, tryUnlock, {once: true, passive: true});
    });
}

window.addEventListener('load', () => {
    setupAudioUnlock();
    const interactiveElements = ['main-menu', 'gameCanvas', 'pauseBtn'];
    
    const tryUnlock = () => {
        if(!audioUnlocked) unlockAudio();
    };
   
    document.addEventListener('click', tryUnlock, {once: true});
    document.addEventListener('touchstart', tryUnlock, {once: true});
});

let stars = [];
for(let i=0;i<80;i++){
    stars.push({
        x: Math.random()*window.innerWidth,
        y: Math.random()*window.innerHeight,
        s: Math.random()*3+1
    });
}

/* ---------- CANVAS ---------- */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// FIXED: Proper pause button handler
const pauseBtn = document.getElementById("pauseBtn");
if(pauseBtn){
    pauseBtn.onclick = () => {
        if(!gameRunning) return;
        togglePause();
    };
}

/* ---------- PLAYER ---------- */

const player = {
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    speed: 6
};

function resizeGame(){
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    
    player.x = Math.min(Math.max(player.x, 0), canvas.width - player.width);
    player.y = Math.min(Math.max(player.y, 0), canvas.height - player.height);
    
    if(player.x === 0 && player.y === 0){
        player.x = canvas.width / 2;
        player.y = canvas.height - 120;
    }
}

window.addEventListener("resize", () => {
    setTimeout(resizeGame, 100);
});
window.addEventListener("orientationchange", () => {
    setTimeout(resizeGame, 300);
});

/* ---------- GAME STATE ---------- */

let combo = 0;
let comboTimer = 0;

let gameRunning = false;
let paused = false;

let score = 0;
let level = 1;

let maxHearts = 5;
let health = maxHearts;

let bullets = [];
let enemies = [];
let enemyBullets = [];
let powerups = [];

let boss = null;
let bossMaxHP = 0;

let fireRate = 300;
let lastShot = 0;

let coins = 0;
let coinFX = [];
let explosions = [];
let weaponLevel = 1;
let shieldLevel = 0;
let highestLevel = 1;
let premium = false;

let damage = 1;

let rapidFire = false;
let rapidTimer = 0;

let shieldActive = false;
let shieldTimer = 0;

let soundOn = true;

let playerHitCooldown = 0;

// WAVE SYSTEM VARIABLES
let enemySpawnRate = 1500;
let enemySpeed = 2;
let enemyHPBase = 2;
let maxEnemies = 5;
let spawnTimer = 0;
let waveInProgress = false;
let waveNumber = 0;
let enemiesInWave = 0;
let waveSpawnTimer = 0;
let isTroopFormation = false;

let lastReward = 0;
let achievements = [];
let totalKills = 0;
let hitFlash = 0;
let screenShake = 0;
let sfxVolume = 1;

// LOOP TIMING
let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

let playerPerformance = {
    shotsFired: 0,
    shotsHit: 0,
    damageTaken: 0
};

/* ---------- TOUCH ---------- */

let touchX = null;
let touchY = null;

canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    const t = e.touches[0];
    player.x = t.clientX;
    player.y = t.clientY;
}, { passive:false });

canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    const t = e.touches[0];
    player.x += (t.clientX - player.x) * 0.4;
    player.y += (t.clientY - player.y) * 0.4;
}, { passive:false });

canvas.addEventListener("touchend", e => {
    touchX = null;
    touchY = null;
}, {passive:false});

function updateHUD(){
    const coinText = document.getElementById("coinText");
    const shopText = document.getElementById("shopCoinText");
    const levelText = document.getElementById("levelText");
    const scoreText = document.getElementById("scoreText");
    const comboText = document.getElementById("comboText");

    // Force update with multiple methods
    if(coinText) {
        coinText.innerText = coins.toString();
        coinText.textContent = coins.toString();
    }
    if(levelText) levelText.innerText = "Lv " + level;
    if(scoreText) scoreText.innerText = "Score: " + score;
    
    // Debug - remove after testing
    console.log("HUD Update - Coins:", coins, "Score:", score);
}

// Also fix coinPulse to ensure it works
function coinPulse(){
    const coinBox = document.getElementById("coinBox");
    if(!coinBox) return;
    coinBox.style.transform = "scale(1.3)";
    coinBox.style.transition = "transform 0.1s";
    setTimeout(()=>{
        coinBox.style.transform = "scale(1)";
    },150);
}

function animateCoinsToHUD(amount) {
    const hud = document.getElementById("coinBox");
    if (!hud) return;

    const hudRect = hud.getBoundingClientRect();

    for (let i = 0; i < 8; i++) {
        const coin = document.createElement("div");
        coin.className = "flyingCoin";
        coin.innerText = "🪙";

        document.body.appendChild(coin);

        // Start position (center of screen)
        coin.style.left = "50%";
        coin.style.top = "50%";

        // Random spread before going to HUD
        const offsetX = (Math.random() - 0.5) * 150;
        const offsetY = (Math.random() - 0.5) * 150;

        setTimeout(() => {
            coin.style.transform = `translate(${hudRect.left + offsetX - window.innerWidth/2}px, ${hudRect.top + offsetY - window.innerHeight/2}px) scale(0.5)`;
            coin.style.opacity = "0";
        }, 50);

        setTimeout(() => {
            coin.remove();
        }, 800);
    }
}

function updateHeartsUI(){
    const hearts = document.querySelectorAll("#hearts img");
    for(let i=0;i<hearts.length;i++){
        if(i < health){
            hearts[i].src = "assets/ui/heart-full.png";
        }else{
            hearts[i].src = "assets/ui/heart-empty.png";
        }
    }
}

/* ---------- KEYBOARD ---------- */

let moveLeft=false;
let moveRight=false;
let moveUp=false;
let moveDown=false;

window.addEventListener("keydown",e=>{
    if(e.key==="ArrowLeft") moveLeft=true;
    if(e.key==="ArrowRight") moveRight=true;
    if(e.key==="ArrowUp") moveUp=true;
    if(e.key==="ArrowDown") moveDown=true;
    if(e.key==="p" || e.key==="P") togglePause();
});

window.addEventListener("keyup",e=>{
    if(e.key==="ArrowLeft") moveLeft=false;
    if(e.key==="ArrowRight") moveRight=false;
    if(e.key==="ArrowUp") moveUp=false;
    if(e.key==="ArrowDown") moveDown=false;
});

/* ---------- PAUSE SYSTEM ---------- */

function togglePause(){
    console.log("Toggle pause called, current state:", {gameRunning, paused});
    
    if(!gameRunning) return;
    
    paused = !paused;
    const pauseMenu = document.getElementById("pauseMenu");
    
    if(paused){
        console.log("Pausing game");
        if(pauseMenu) {
            pauseMenu.style.display = "flex";
        } else {
            console.error("pauseMenu NOT FOUND");
        }
        if(gameMusic) gameMusic.pause();
    } else {
        if(pauseMenu) pauseMenu.style.display = "none";
        if(soundOn && gameMusic){
            gameMusic.play().catch(()=>{});
        }
        lastTime = 0;
        requestAnimationFrame(gameLoop);
    }
}

function resumeGame(){
    console.log("Resume game button clicked");
    if(paused){
        togglePause();
    }
}

/* ---------- QUIT GAME ---------- */

function quitGame(){
    console.log("Quitting game...");
    
    try {
        saveGame();
    } catch(e) {
        console.log("Save failed:", e);
    }
    
    try {
        gameMusic.pause();
        menuMusic.currentTime = 0;
        if(soundOn) menuMusic.play().catch(e => console.log("Menu music failed"));
    } catch(e) {
        console.log("Audio error:", e);
    }
    
    paused = false;
    gameRunning = false;
    
    const elements = {
        pauseMenu: document.getElementById("pauseMenu"),
        gameCanvas: document.getElementById("gameCanvas"),
        hud: document.getElementById("hud"),
        bossBar: document.getElementById("bossBar"),
        bossWarning: document.getElementById("bossWarning"),
        levelComplete: document.getElementById("levelComplete"),
        gameOverScreen: document.getElementById("gameOverScreen")
    };
    
    for(let [name, el] of Object.entries(elements)){
        if(el) el.style.display = "none";
    }
    
    const menu = document.getElementById("main-menu");
    if(menu){
        menu.style.display = "flex";
        menu.style.visibility = "visible";
        menu.style.opacity = "1";
        menu.classList.add("show");
    }
    
    enemies = [];
    bullets = [];
    enemyBullets = [];
    powerups = [];
    boss = null;
    waveInProgress = false;
    waveNumber = 0;
    enemiesInWave = 0;
    
    console.log("Game quit successfully");
}

/* ---------- START GAME ---------- */

function startGame(){
    unlockAudio();
    resizeGame();
    
    setTimeout(() => resizeGame(), 100);

    health = maxHearts;
    score = 0;
    level = 1;
    coins = 0; // Reset coins or keep from save? Your choice

    gameRunning = true;
    paused = false;

    enemies = [];
    bullets = [];
    enemyBullets = [];
    powerups = [];

    waveInProgress = false;
    waveNumber = 0;
    enemiesInWave = 0;
    
    // RESET TIMERS
    lastWaveTime = 0;
    lastEnemySpawnTime = 0;

    updateHUD();
    updateHeartsUI();

    const menu = document.getElementById("main-menu");
    if(menu) {
        menu.style.display = "none";
        menu.classList.remove("show");
    }

    const gameCanvas = document.getElementById("gameCanvas");
    const hud = document.getElementById("hud");
    
    if(gameCanvas) gameCanvas.style.display = "block";
    if(hud) hud.style.display = "flex";

    menuMusic.pause();

    if(soundOn){
        gameMusic.currentTime = 0;
        gameMusic.play().catch(()=>{});
    }

    // REMOVE force spawn - let wave system handle it
    
    startAutoShoot();
    startWave();

    lastTime = 0;
    lastWaveTime = performance.now(); // Initialize wave timer
    lastEnemySpawnTime = performance.now(); // Initialize spawn timer
    
    requestAnimationFrame(gameLoop);
}

function checkDailyReward() {

    loadDailyData();

    const today = new Date().toDateString();

    if (dailyData.lastLogin === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (dailyData.lastLogin === yesterday.toDateString()) {
        dailyData.streak++;
    } else {
        dailyData.streak = 1;
    }

    if (dailyData.streak > 7) dailyData.streak = 1;

    dailyData.lastLogin = today;

    saveDailyData();

    showDailyRewardUI();
}

function getDailyReward(streak) {
    const rewards = [50, 75, 100, 150, 200, 300, 500];
    return rewards[Math.min(streak, 6)];
}

function showDailyReward(streak) {
    const reward = getDailyReward(streak);

    const popup = document.createElement("div");
    popup.id = "dailyRewardPopup";

    popup.innerHTML = `
        <div class="rewardBox">
            <h2>DAILY REWARD</h2>

            <div class="calendar">
                ${generateCalendar(streak)}
            </div>

            <div class="chest" onclick="openChest(${reward}, ${streak})">
                🎁
            </div>

            <p>Day ${streak + 1} → ${reward} 🪙</p>

            <button onclick="claimDailyReward(${reward}, ${streak})">
                CLAIM
            </button>

            <button class="doubleBtn" onclick="doubleReward(${reward}, ${streak})">
                📺 DOUBLE
            </button>
        </div>
    `;

    document.body.appendChild(popup);
}

function generateCalendar(streak){
    let html = "";

    const rewards = [50, 75, 100, 150, 200, 300, 500];

    for(let i = 0; i < 7; i++){
        let state = "";

        if(i < streak) state = "claimed";
        else if(i === streak) state = "today";

        html += `
            <div class="day ${state}">
                <span>Day ${i+1}</span>
                <b>${rewards[i]}</b>
            </div>
        `;
    }

    return html;
}

function claimDailyReward(amount, streak) {

    animateCoinsToHUD(amount); // ✨ animation first

    setTimeout(() => {
        coins += amount;
        saveRewardProgress(streak);
        closeReward();
    }, 600);
}

function giveReward(amount) {

    coins += amount;

    document.getElementById("shopCoinText").innerText = coins;

    updateHUD();

    showCoinGain(amount);

    document.getElementById("dailyReward").style.display = "none";
}


/* ---------- CLOSE APP ---------- */
function closeApp(){
    gameRunning = false;
    paused = false;

    gameMusic.pause();
    menuMusic.pause();

    window.close();

    document.body.innerHTML = `
        <div style="
            display:flex;
            justify-content:center;
            align-items:center;
            height:100vh;
            background:black;
            color:#00ffff;
            font-family:Orbitron;
            font-size:24px;
        ">
            Game Closed
        </div>
    `;
}

/* ---------- AUTO SHOOT ---------- */

let autoShootTimeout = null;

function startAutoShoot(){
    if(autoShootTimeout) return;

    function shootLoop(){
        if(gameRunning && !paused){
            playerShoot();
        }

        // ✅ dynamic fire rate (this was missing)
        autoShootTimeout = setTimeout(shootLoop, fireRate);
    }

    shootLoop();
}

function playerShoot(){
    let now = Date.now();
    if(now - lastShot < 100) return;
    lastShot = now;

    if(soundOn){
        shootSound.volume = sfxVolume;
        shootSound.currentTime = 0;
        shootSound.play().catch(()=>{});
    }

    const bulletY = player.y;
    const centerX = player.x + player.width / 2;
    
    switch(weaponLevel){
        case 1:
            createBullet(centerX, bulletY, 0, -10);
            break;
        case 2:
            createBullet(centerX - 15, bulletY, -0.5, -10);
            createBullet(centerX + 15, bulletY, 0.5, -10);
            break;
        case 3:
            createBullet(centerX - 20, bulletY, -1, -10);
            createBullet(centerX, bulletY, 0, -12);
            createBullet(centerX + 20, bulletY, 1, -10);
            break;
        default:
            for(let i = -2; i <= 2; i++){
                createBullet(centerX, bulletY, i * 1.5, -10);
            }
    }
}

function createBullet(x, y, dx, dy){
    bullets.push({
        x: x,
        y: y,
        w: 4,
        h: 12,
        dx: dx,
        dy: dy || -10,
        active: true,
        skin: currentSkin   // ✅ lock skin at fire time
    });
}


/* ---------- WAVE & SPAWN SYSTEM ---------- */

function getDifficultySettings(){

    if(level < 5){
        return {
            speed: 2,
            hpBase: 2,
            waveSize: 6 + waveNumber * 2,
            troopMode: false
        };
    }

    let difficultyLevel = level - 4;
    let dynamic = getDynamicMultiplier();

    return {
        speed: (2 + difficultyLevel * 0.3) * dynamic,
        hpBase: Math.floor((2 + difficultyLevel / 2) * dynamic),
        waveSize: Math.floor((10 + waveNumber * 4 + difficultyLevel * 2) * dynamic),
        troopMode: true
    };
}

function getDynamicMultiplier(){
    let accuracy = playerPerformance.shotsHit / (playerPerformance.shotsFired || 1);

    let multiplier = 1;

    // Player is strong → increase difficulty
    if(accuracy > 0.6 && playerPerformance.damageTaken < 3){
        multiplier = 1.3;
    }

    // Player struggling → reduce difficulty
    if(playerPerformance.damageTaken > 5){
        multiplier = 0.8;
    }

    return multiplier;
}

function startWave(){
    if(!gameRunning || paused || boss) return;
    
    const diff = getDifficultySettings();
    
    waveInProgress = true;
    waveNumber++;
    enemiesInWave = diff.waveSize;
    isTroopFormation = diff.troopMode;
    waveSpawnTimer = 0;
    
    // Reset spawn timer when wave starts
    lastEnemySpawnTime = performance.now();
    
    showWaveNotification(waveNumber);
}

function spawnSingleEnemy(){
    const diff = getDifficultySettings();
    
    let type = ENEMY_NORMAL;
    let r = Math.random();
    
    if(level > 2 && r < 0.25) type = ENEMY_FAST;
    else if(level > 4 && r < 0.15) type = ENEMY_TANK;
    else if(level > 6 && r < 0.15) type = ENEMY_SHOOTER;
    
    let enemy = {
        x: Math.random() * (canvas.width - 40),
        y: -50,
        w: 40,
        h: 40,
        type: type,
        hp: diff.hpBase + level,
        speed: diff.speed,
        shootChance: 0.20,
        active: true
    };
    
    if(type === ENEMY_FAST){
        enemy.speed = diff.speed + 2;
        enemy.hp = Math.max(1, diff.hpBase + level - 1);
    } else if(type === ENEMY_TANK){
        enemy.speed = Math.max(0.5, diff.speed - 1);
        enemy.hp = (diff.hpBase + level) * 2;
    } else if(type === ENEMY_SHOOTER){
        enemy.speed = diff.speed;
        enemy.hp = diff.hpBase + level + 1;
        enemy.shootChance = 0.30;
    }
    
    if(isTroopFormation){
        let row = Math.floor(waveSpawnTimer / 5) % 3;
        let col = waveSpawnTimer % 5;
        enemy.x = (canvas.width / 6) * (col + 1);
        enemy.y = -60 - (row * 40);
        enemy.speed *= 0.5;
    }
    
    enemies.push(enemy);
    enemiesInWave--;
    waveSpawnTimer++;
}

let lastWaveTime = 0;
let lastEnemySpawnTime = 0;

function updateSpawning(currentTime){
    if(boss) return;

    if(!waveInProgress){
        // Time between waves
        if(currentTime - lastWaveTime > 2000){
            startWave();
            lastWaveTime = currentTime;
            lastEnemySpawnTime = currentTime; // Reset spawn timer too
        }
        return;
    }

    // Wave in progress - spawn enemies
    if(enemiesInWave > 0){
        let spawnDelay = isTroopFormation ? 800 : 500; // Faster spawning
        
        if(currentTime - lastEnemySpawnTime > spawnDelay){
            spawnSingleEnemy();
            lastEnemySpawnTime = currentTime;
        }
    } else if(enemiesInWave <= 0 && enemies.length === 0){
         endWave();
    }
}

function endWave(){
    waveInProgress = false;
    waveSpawnTimer = 0;

    console.log("Wave ended:", waveNumber);

    // Safety cleanup
    enemies = [];

   // Boss FIRST
   if(level >= 5 && waveNumber % 3 === 0){
      setTimeout(() => spawnBoss(), 1500);
      return;
   }
   
   // Then level complete
   if(waveNumber % 3 === 0){
      setTimeout(() => levelComplete(), 1000);
      return;
   }

    coins += 20 + level * 5;
    updateHUD();
    coinPulse();

    // ✅ GUARANTEED next wave
    setTimeout(() => {
        startWave();
    }, 1500);
}

function showWaveNotification(waveNum){
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 255, 255, 0.9);
        color: black;
        padding: 20px 40px;
        border-radius: 10px;
        font-family: Orbitron, sans-serif;
        font-size: 24px;
        font-weight: bold;
        z-index: 9999;
        animation: pop 0.5s ease;
    `;
    notif.textContent = `WAVE ${waveNum}`;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.5s';
        setTimeout(() => notif.remove(), 500);
    }, 1500);
}

function isBossLevel(){
    return level % 5 === 0;
}

function spawnBoss(){
    if(boss) return;

    boss = {
        x: canvas.width / 2,
        y: 100,
        hp: 100 + level * 20,
        maxHp: 100 + level * 20,
        pattern: getBossPattern()
    };

    bossMaxHP = boss.hp;

    document.getElementById("bossBar").style.display = "block";
    const bossWarning = document.getElementById("bossWarning");

    const bossBar = document.getElementById("bossBar");
    if(bossBar) bossBar.style.display = "block";

    if(bossWarning){
        bossWarning.style.display = "block";
        setTimeout(()=>{
            bossWarning.style.display = "none";
        }, 2000);
    }
   if(!document.getElementById("bossBar")){
      console.error("bossBar missing!");
      return;
   }
}

function getBossPattern(){

    const patterns = ["spray", "burst", "laser"];

    return patterns[(level / 5 - 1) % patterns.length];
}

function bossAttack(){

    if(!boss) return;

    switch(boss.pattern){

        case "spray":
            // spread bullets
            shootSpread();
            break;

        case "burst":
            // rapid fire
            shootBurst();
            break;

        case "laser":
            // single powerful shot
            shootLaser();
            break;
    }
}

function giveBossReward(){
    let baseReward = 200 + (level * 50);

    // Bonus scaling (makes late game worth it)
    let reward = Math.floor(baseReward * 1.2);

    coins += reward;

    showBossRewardPopup(reward);

    updateHUD();
    saveGame();
}

function showBossRewardPopup(amount){

    const popup = document.createElement("div");
    popup.id = "bossRewardPopup";

    popup.innerHTML = `
        <div class="rewardBox">
            <h2>BOSS DEFEATED!</h2>

            <p style="color: gold; font-size: 22px;">
                +${amount} 🪙
            </p>

            <button onclick="closeBossReward()">
                CLAIM
            </button>

            <button class="doubleBtn" onclick="doubleBossReward(${amount})">
                📺 DOUBLE REWARD
            </button>
        </div>
    `;

    document.body.appendChild(popup);
}

function doubleBossReward(amount){

    // 🔥 FUTURE: AdMob Rewarded Ad here
    // showRewardedAd().then(() => { ... });

    coins += amount; // already got base, so just add same again

    closeBossReward();

    updateHUD();
    saveGame();
}

function closeBossReward(){
    const popup = document.getElementById("bossRewardPopup");
    if(popup) popup.remove();
}

/* ---------- MAIN GAME LOOP ---------- */

function gameLoop(currentTime = 0){
    if(!gameRunning) return;

    if(!paused){
        requestAnimationFrame(gameLoop);
    }

    const deltaTime = currentTime - lastTime;
    if(deltaTime < frameInterval) return;

    lastTime = currentTime - (deltaTime % frameInterval);

    if(!gameRunning || paused) return;

    // ✅ CRITICAL FIX: Reset ALL canvas transforms every frame
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Clear canvas AFTER reset
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Screen shake
    if(screenShake > 0){
        ctx.restore();
        screenShake *= 0.7;   // ✅ faster decay (was 0.85)
        if(screenShake < 0.3) screenShake = 0;
    }

    if(boss && boss.y > canvas.height){
        boss = null;
        document.getElementById("bossBar").style.display = "none";
    }

    // Draw background
    if(bgImg && bgImg.complete && bgImg.naturalWidth > 0){
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#000022");
        gradient.addColorStop(0.5, "#000044");
        gradient.addColorStop(1, "#000011");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Stars
    drawStars();

    // Systems
    updateSpawning(currentTime);
    updatePlayer();
    drawPlayer();
    updateBullets();
    updateEnemies();
    updateEnemyBullets();
    updateExplosions();
    updateCoinFX();
    updatePowerups();
    updateBoss();
    updateTimers();

    // Restore after shake
    if(screenShake > 0){
        screenShake *= 0.85;
        if(screenShake < 0.5) screenShake = 0;
    }

    // Hit flash overlay (draw LAST)
    if(hitFlash > 0){
        ctx.fillStyle = `rgba(255, 0, 0, ${hitFlash * 0.1})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        hitFlash = Math.max(0, hitFlash - 1);
    }
}

/* ---------- PLAYER ---------- */

function updatePlayer(){
    if(moveLeft) player.x -= player.speed;
    if(moveRight) player.x += player.speed;
    if(moveUp) player.y -= player.speed;
    if(moveDown) player.y += player.speed;

    if(touchX !== null){
        player.x += (touchX - player.x - player.width/2) * 0.2;
        player.y += (touchY - player.y - player.height/2) * 0.2;
    }
    
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function drawPlayer(){
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x + player.width/2 - 3, player.y + player.height, 6, 10);

    if(shieldActive){
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(
            player.x + player.width/2,
            player.y + player.height/2,
            player.width,
            0,
            Math.PI * 2
        );
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00ffff";
        ctx.stroke();
        ctx.restore();
    }
}

/* ---------- BULLETS ---------- */

function updateBullets(){
    for(let i = bullets.length - 1; i >= 0; i--){
        let b = bullets[i];
        
        b.y += b.dy || -8;
        if(b.dx) b.x += b.dx;
        
        ctx.save();
        ctx.shadowBlur = 10;
        // ✅ BULLET COLOR BASED ON SKIN (NOT weaponLevel)
        switch(b.skin){
            case 0:
                ctx.fillStyle = "cyan";
                ctx.shadowColor = "cyan";
                break;
            case 1:
                ctx.fillStyle = "lime";
                ctx.shadowColor = "lime";
                break;
            case 2:
                ctx.fillStyle = "yellow";
                ctx.shadowColor = "yellow";
                break;
            case 3:
                ctx.fillStyle = "orange";
                ctx.shadowColor = "orange";
                break;
            default:
                ctx.fillStyle = "white";
                ctx.shadowColor = "white";
        }
        
        ctx.fillRect(b.x - b.w/2, b.y, b.w, b.h);
        ctx.restore();
        
        let hit = false;
        
        for(let j = enemies.length - 1; j >= 0; j--){
            let e = enemies[j];
            
            if(b.x < e.x + e.w && b.x + b.w > e.x &&
               b.y < e.y + e.h && b.y + b.h > e.y){
                
                bullets.splice(i, 1);
                hit = true;
                e.hp--;
                screenShake = 3;
                
                if(e.hp <= 0){
                    enemies.splice(j, 1);
                    
                    if(soundOn){
                        explosionSound.currentTime = 0;
                        explosionSound.volume = sfxVolume;
                        explosionSound.play().catch(()=>{});
                    }
                    
                    explosions.push({
                        x: e.x + e.w/2,
                        y: e.y + e.h/2,
                        frame: 0,
                        maxFrame: 10
                    });
                    
                    // REWARD CALCULATION
                    let reward = 50;
                    if(e.type === ENEMY_FAST) reward = 8;
                    if(e.type === ENEMY_TANK) reward = 15;
                    if(e.type === ENEMY_SHOOTER) reward = 12;
                    
                    // UPDATE SCORE AND COINS
                    coins += reward;
                    combo++;
                    comboTimer = 60;
                    score += reward * 2;
                    totalKills++;
                    
                    // Visual effects
                    for(let k = 0; k < Math.min(reward, 10); k++){
                        coinFX.push({
                            x: e.x + e.w/2,
                            y: e.y + e.h/2,
                            vx: (Math.random() - 0.5) * 6,
                            vy: -Math.random() * 4 - 2,
                            life: 30,
                            maxLife: 30
                        });
                    }
                    
                    // UPDATE HUD IMMEDIATELY
                    coinPulse();
                    updateHUD();
                    
                    // Powerup drop
                    if(Math.random() < 0.3){
                        powerups.push({
                            x: e.x + e.w/2 - 16,
                            y: e.y + e.h/2,
                            type: Math.floor(Math.random() * 3),
                            w: 32,
                            h: 32
                        });
                    }
                    
                    saveGame();
                }
                
                break;
            }
        }
        
        if(hit) continue;
        
        // Boss collision (ONLY when visible)
        if(boss && boss.y >= 80){
            if(
                b.x < boss.x + boss.w &&
                b.x + b.w > boss.x &&
                b.y < boss.y + boss.h &&
                b.y + b.h > boss.y
            ){
                bullets.splice(i, 1);

                boss.hp -= damage;
                screenShake = 8;
                hitFlash = 5;
                updateBossBar();

                if(boss.hp <= 0){
                   boss = null;
                   
                   document.getElementById("bossBar").style.display = "none";
                   
                   giveBossReward();
                }

                continue;
            }
        }
        
        // Remove off-screen
        if(b.y < -50 || b.x < -50 || b.x > canvas.width + 50){
            bullets.splice(i, 1);
        }
    }
}

function bossDefeated(){
    boss = null;
    document.getElementById("bossBar").style.display = "none";
    let bossReward = 150;

    coins += bossReward;
    score += bossReward * 2;
    
    for(let i=0; i<20; i++){
        explosions.push({
            x: canvas.width/2 + (Math.random()-0.5)*200,
            y: 100 + (Math.random()-0.5)*100,
            frame: Math.random()*5,
            maxFrame: 15
        });
    }
    
    updateHUD();
    
    setTimeout(() => {
        waveInProgress = false;
        startWave();
    }, 3000);
    
    saveGame();
}

function updateExplosions(){
    for(let i = explosions.length - 1; i >= 0; i--){
        let ex = explosions[i];

        // Animate size
        let size = 20 + ex.frame * 4;

        ctx.save();
        ctx.globalAlpha = 1 - (ex.frame / ex.maxFrame);
        ctx.drawImage(explosionImg, ex.x - size/2, ex.y - size/2, size, size);
        ctx.restore();

        ex.frame++;

        if(ex.frame > ex.maxFrame){
            explosions.splice(i, 1);
        }
    }
}

function updateBoss(){
    if(!boss) return;

    // Smooth entry
    if(boss.y < 120){
        boss.y += boss.speed + 1; // slightly faster entry
        return; // ⛔ don't allow shooting/damage yet
    }

    ctx.drawImage(bossImg, boss.x, boss.y, boss.w, boss.h);

    // Shooting
    if(Math.random() < 0.02){
        enemyBullets.push({
            x: boss.x + boss.w / 2 - 5,
            y: boss.y + boss.h,
            w: 10,
            h: 25
        });
    }
}

function updateBossBar(){
    if(!boss) return;

    const hp = document.getElementById("bossHealth");
    if(hp){
        hp.style.width = (boss.hp / bossMaxHP * 100) + "%";
    }
}

function drawStars(){
    ctx.fillStyle = "white";
    for(let s of stars){
        s.y += s.s * 0.5;
        if(s.y > canvas.height){
            s.y = 0;
            s.x = Math.random()*canvas.width;
        }
        ctx.fillRect(s.x, s.y, s.s, s.s);
    }
}

function updateCoinFX(){
    for(let i=coinFX.length-1;i>=0;i--){
        let c = coinFX[i];
        c.x += c.vx;
        c.y += c.vy;
        c.life--;
        
        ctx.drawImage(coinImg, c.x, c.y, 16, 16);
        
        if(c.life <= 0){
            coinFX.splice(i,1);
        }
    }
}

/* ---------- ENEMIES ---------- */

function updateEnemies(){
    for(let i = enemies.length - 1; i >= 0; i--){
        let e = enemies[i];

        e.y += e.speed;

        let img = enemyImg;
        if(e.type === ENEMY_FAST) img = enemyFastImg;
        if(e.type === ENEMY_TANK) img = enemyTankImg;
        if(e.type === ENEMY_SHOOTER) img = enemyShooterImg;

        if(img.complete){
            ctx.drawImage(img, e.x, e.y, e.w, e.h);
        }

        if(e.y > canvas.height + 50){
            enemies.splice(i, 1);
            continue;
        }

        // GUARANTEED shooting - every 2 seconds per enemy
        if(!e.lastShotTime) e.lastShotTime = 0;
        
        let shootInterval = (e.type === ENEMY_SHOOTER) ? 1000 : 2000; // ms between shots
        
        if(performance.now() - e.lastShotTime > shootInterval && e.y > 100){
            enemyBullets.push({
                x: e.x + e.w/2 - 4,
                y: e.y + e.h,
                w: 8,
                h: 20
            });
            e.lastShotTime = performance.now();
        }
       // FORCE CLEANUP (prevents stuck waves)
       if(enemies.length === 0 && enemiesInWave <= 0 && waveInProgress){
           endWave();
       }
    }
}

/* ---------- ENEMY BULLETS ---------- */

function updateEnemyBullets(){
    if(!gameRunning) return;

    for(let i = enemyBullets.length - 1; i >= 0; i--){
        let b = enemyBullets[i];
        b.y += 10;

        // DRAW BULLET
        ctx.save();
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        ctx.fillRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);

        ctx.fillStyle = "#ff0044";
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#ff0044";
        ctx.fillRect(b.x, b.y, b.w, b.h);

        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ffffff";
        ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
        ctx.restore();

        // NEAR MISS EFFECT
        let dx = (b.x + b.w/2) - (player.x + player.width/2);
        let dy = (b.y + b.h/2) - (player.y + player.height/2);
        let dist = Math.sqrt(dx*dx + dy*dy);

        if(dist < 80 && dist > 40){
            ctx.shadowBlur = 20;
            ctx.shadowColor = "orange";
        }

        // COLLISION WITH PLAYER
        if(
            b.x < player.x + player.width &&
            b.x + b.w > player.x &&
            b.y < player.y + player.height &&
            b.y + b.h > player.y
        ){
            enemyBullets.splice(i, 1);

            // 🛡️ SHIELD HANDLING
            if(shieldActive){
                screenShake = 5;
                hitFlash = 3;

                shieldTimer -= 20;

                if(shieldTimer <= 0){
                    shieldActive = false;
                }

                continue; // 🚫 NO DAMAGE
            }

            // ❤️ DAMAGE (with cooldown)
            if(playerHitCooldown <= 0){
                health--;

                hitFlash = 10;
                screenShake = 6;

                updateHeartsUI();
                updateHUD();

                console.log("PLAYER HIT! Health:", health);

                if(health <= 0){
                    gameOver();
                    return;
                }

                playerHitCooldown = 10;
            }

            continue;
        }

        // REMOVE OFF SCREEN
        if(b.y > canvas.height + 50){
            enemyBullets.splice(i, 1);
        }
    }
}

/* ---------- POWERUPS ---------- */

function updatePowerups(){
    for(let i=powerups.length-1;i>=0;i--){
        let p=powerups[i];
        p.y += 2;
        
        let img = healthImg;
        if(p.type === 1) img = rapidImg;
        if(p.type === 2) img = shieldImg;
        
        ctx.drawImage(img, p.x, p.y, 32, 32);
        
        if(p.x < player.x + player.width &&
           p.x + 32 > player.x &&
           p.y < player.y + player.height &&
           p.y + 32 > player.y){
            
            powerups.splice(i, 1);
            
            if(p.type === 0){
                health = Math.min(maxHearts, health + 1);
                updateHeartsUI();
            }
            else if(p.type === 1){
                rapidFire = true;
                rapidTimer = 300;
            }
            else if(p.type === 2){
                shieldActive = true;

                // duration scales with upgrade
                shieldTimer = 300 + (shieldLevel * 150);

                // visual feedback
                screenShake = 5;
                hitFlash = 3;

                if(soundOn){
                    powerupSound.currentTime = 0;
                    powerupSound.play().catch(()=>{});
                }
            }
        }
        
        if(p.y > canvas.height){
            powerups.splice(i, 1);
        }
    }
}

/* ---------- TIMERS ---------- */

function updateTimers(){
    // RAPID FIRE
    if(rapidFire){
        fireRate = 100;
        rapidTimer--;

        if(rapidTimer <= 0){
            rapidFire = false;
            fireRate = Math.max(80, 300 - level * 10);
        }
    }

    // SHIELD TIMER
    if(shieldActive){
        shieldTimer--;

        if(shieldTimer <= 0){
            shieldActive = false;
        }
    }

    // COMBO
    if(comboTimer > 0){
        comboTimer--;
    } else {
        combo = 0;
    }

    // HIT COOLDOWN
    playerHitCooldown--;
    if(playerHitCooldown < 0) playerHitCooldown = 0;
}

/* ---------- SAVE/LOAD ---------- */

function saveGame() {
    const data = {
        coins,
        weaponLevel,
        skin,
        dailyData
    };

    localStorage.setItem("coins", coins);
    localStorage.setItem("nebulaSave", JSON.stringify(data));
}

function loadGame() {
    localStorage.setItem("coins", coins);
    const save = localStorage.getItem("nebulaSave");

    if (!save) return;

    const data = JSON.parse(save);

    coins = data.coins || 0;
    weaponLevel = data.weaponLevel || 1;
    skin = data.skin || 0;
    dailyData = data.dailyData || dailyData;
}


/* ---------- SHOP FUNCTIONS ---------- */

let unlockedSkins = [0];

function selectSkin(id){
    if(!unlockedSkins.includes(id)) return;
    currentSkin = id;
    updateSkin();
    saveGame();
    
    document.querySelectorAll('.skinBtn').forEach((btn, idx) => {
        btn.style.borderColor = (idx === id) ? '#00ff88' : '#444';
    });
}

function tryBuySkin(id, price){
    if(unlockedSkins.includes(id)){
        selectSkin(id);
        return;
    }
    
    if(coins >= price){
        coins -= price;
        unlockedSkins.push(id);
        selectSkin(id);
        updateHUD();
        updateShopCoins();
        saveGame();
        
        const skinBtn = document.getElementById('skin' + (id-1));
        if(skinBtn){
            skinBtn.classList.remove('locked');
            skinBtn.classList.add('unlocked');
            const lockIcon = skinBtn.querySelector('.lockIcon');
            if(lockIcon) lockIcon.style.display = 'none';
            const priceLabel = skinBtn.querySelector('.skinPrice');
            if(priceLabel) priceLabel.textContent = 'OWNED';
        }
    } else {
        const btn = document.getElementById('skin' + (id-1));
        if(btn){
            btn.style.animation = 'shake 0.5s';
            setTimeout(() => btn.style.animation = '', 500);
        }
    }
}

function updateShopCoins(){
    const coinText = document.getElementById('shopCoinText');
    if(coinText) coinText.textContent = coins;
}

function updateShopUI(){
    unlockedSkins.forEach(id => {
        if(id > 0){
            const btn = document.getElementById('skin' + (id-1));
            if(btn){
                btn.classList.remove('locked');
                btn.classList.add('unlocked');
                const lockIcon = btn.querySelector('.lockIcon');
                if(lockIcon) lockIcon.style.display = 'none';
                const priceLabel = btn.querySelector('.skinPrice');
                if(priceLabel) priceLabel.textContent = 'OWNED';
            }
        }
    });
}

function openShop() {
    const shop = document.getElementById("shop");
    const menu = document.getElementById("main-menu");

    menu.classList.remove("show");
    menu.style.display = "none";

    shop.style.display = "flex";
}

function closeShop() {
    const shop = document.getElementById("shop");
    const menu = document.getElementById("main-menu");

    shop.style.display = "none";

    menu.style.display = "flex";
    setTimeout(() => {
        menu.classList.add("show");
    }, 10);
}

function buyShield(){
    if(coins >= 50){
        coins -= 50;
        shieldLevel++;

        // ✅ ACTIVATE SHIELD IMMEDIATELY
        shieldActive = true;
        shieldTimer = 300 + (shieldLevel * 150);

        updateHUD();
        updateShopCoins(); // ✅ ADD THIS
        saveGame();
    }
}

function buyWeapon() {

    let weaponCost = 150 * weaponLevel;

    if (coins >= weaponCost) {

        coins -= weaponCost;

        weaponLevel++;

        Damage += 2;
        fireRate *= 0.9;

        saveGame();

    } else {
        showCoinWarning("Not enough coins!");
    }
}

function buyHearts() {

    let heartCost = 50 + (level * 5);

    if (coins >= heartCost) {

        coins -= heartCost;

        health++;

        saveGame();

    } else {
        showCoinWarning("Not enough coins!");
    }
}

function buyCoins(amount) {
    coins += amount;

    // update UI
    document.getElementById("shopCoinText").innerText = coins;

    // feedback
    showCoinGain(amount);
}

let adCooldown = false;

function watchAdReward() {

    if (adCooldown) {
        showCoinWarning("Ad not ready yet!");
        return;
    }

    // simulate watching ad
    showFakeAd(() => {

        coins += 100;
        document.getElementById("shopCoinText").innerText = coins;

        showCoinGain(100);

        // cooldown (prevents spam)
        adCooldown = true;

        setTimeout(() => {
            adCooldown = false;
        }, 30000); // 30 sec cooldown
    });
}

function showFakeAd(callback) {

    const ad = document.createElement("div");

    ad.style.position = "fixed";
    ad.style.top = "0";
    ad.style.left = "0";
    ad.style.width = "100vw";
    ad.style.height = "100vh";
    ad.style.background = "black";
    ad.style.color = "white";
    ad.style.display = "flex";
    ad.style.justifyContent = "center";
    ad.style.alignItems = "center";
    ad.style.flexDirection = "column";
    ad.style.zIndex = "99999";

    ad.innerHTML = `
        <h2>Ad Playing...</h2>
        <p id="adTimer">3</p>
    `;

    document.body.appendChild(ad);

    let time = 3;

    const interval = setInterval(() => {
        time--;
        ad.querySelector("#adTimer").innerText = time;

        if (time <= 0) {
            clearInterval(interval);
            ad.remove();
            callback();
        }
    }, 1000);
}

function showCoinGain(amount) {
    const popup = document.createElement("div");
    popup.innerText = "+" + amount + " 🪙";

    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.color = "gold";
    popup.style.fontSize = "24px";
    popup.style.zIndex = "9999";

    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 1000);
}

function showCoinWarning(){
    const warn = document.getElementById("coinWarning");
    if(!warn) return;

    warn.classList.add("show");

    setTimeout(() => {
        warn.classList.remove("show");
    }, 1200);
}


let dailyData = {
    lastLogin: null,
    streak: 0
};

function loadDailyData() {
    const saved = localStorage.getItem("dailyReward");
    if (saved) {
        dailyData = JSON.parse(saved);
    }
}

function saveDailyData() {
    localStorage.setItem("dailyReward", JSON.stringify(dailyData));
}


let chestOpened = false;

function openChest() {

    if (chestOpened) return;

    chestOpened = true;

    const chest = document.getElementById("rewardChest");

    chest.innerText = "✨";

    chest.style.transform = "scale(1.5)";

    setTimeout(() => {
        chest.style.display = "none";
    }, 500);
}

/* ---------- SETTINGS FUNCTIONS ---------- */

function openSettings(){
    console.log("Opening settings...");
    const settings = document.getElementById("settings");
    const mainMenu = document.getElementById("main-menu");
    
    if(!settings){
        console.error("Settings element not found!");
        return;
    }
    
    if(mainMenu) mainMenu.style.display = "none";
    
    updateSoundButton();
    settings.style.display = "flex";
    
    console.log("Settings opened");
}

function closeSettings(){
    console.log("Closing settings...");
    const settings = document.getElementById("settings");
    const mainMenu = document.getElementById("main-menu");
    
    if(settings) settings.style.display = "none";
    
    if(mainMenu){
        mainMenu.style.display = "flex";
        mainMenu.classList.add("show");
    }
}

function updateSoundButton(){
    console.log("Updating sound button UI, soundOn:", soundOn);
    const soundIcon = document.getElementById("soundIcon");
    const soundText = document.getElementById("soundText");
    const soundBtn = document.querySelector(".soundBtn");
    
    if(!soundIcon || !soundText){
        console.error("Sound button elements not found!");
        return;
    }
    
    if(soundOn){
        soundIcon.textContent = "🔊";
        soundText.textContent = "Sound: ON";
        if(soundBtn) soundBtn.classList.remove("sound-off");
    } else {
        soundIcon.textContent = "🔇";
        soundText.textContent = "Sound: OFF";
        if(soundBtn) soundBtn.classList.add("sound-off");
    }
}

function toggleSound(){
    console.log("Toggling sound, current:", soundOn);
    soundOn = !soundOn;
    
    if(!soundOn){
        console.log("Muting all audio");
        menuMusic.pause();
        gameMusic.pause();
        shootSound.volume = 0;
        explosionSound.volume = 0;
    } else {
        console.log("Unmuting audio");
        shootSound.volume = sfxVolume; // Use sfxVolume, not 1
        explosionSound.volume = sfxVolume; // Use sfxVolume, not 1
        
        if(gameRunning && gameMusic.paused){
            gameMusic.play().catch(e => console.log("Game music failed"));
        } else if(!gameRunning && menuMusic.paused){
            menuMusic.play().catch(e => console.log("Menu music failed"));
        }
    }
    
    updateSoundButton();
    saveGame();
    console.log("Sound is now:", soundOn ? "ON" : "OFF");
}

function setMusicVolume(val){
    const vol = val / 100;
    if(menuMusic) menuMusic.volume = vol;
    if(gameMusic) gameMusic.volume = vol;
}

function setSFXVolume(val){
    sfxVolume = val / 100;

    shootSound.volume = sfxVolume;
    explosionSound.volume = sfxVolume;
}

/* ---------- LEVEL & GAME OVER ---------- */

function levelComplete(){

    gameRunning = false;
    paused = false;
    
    if(gameMusic) gameMusic.pause();

    let reward = 50 + (level * 10); // 🔥 better scaling

    const levelCompleteScreen = document.getElementById("levelComplete");

    if(levelCompleteScreen) {
        levelCompleteScreen.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 3px solid #00ff80;
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 0 40px rgba(0, 255, 128, 0.5);
                animation: pop 0.5s ease;
            ">
                <h1 style="
                    color: #00ff80;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 32px;
                    margin: 0 0 20px 0;
                    text-shadow: 0 0 20px rgba(0, 255, 128, 0.8);
                ">LEVEL ${level} COMPLETE!</h1>
                
                <p style="color:white;font-size:18px;">Score: ${score}</p>
                
                <p style="color:#ffd700;font-size:20px;margin:20px 0;">
                    Reward: +${reward} 🪙
                </p>

                <!-- 🔥 ADD THIS -->
                <button onclick="doubleLevelReward(${reward})" class="menu-btn rewardBtn">
                    🎥 DOUBLE REWARD
                </button>

                <br><br>

                <button onclick="nextLevel()" class="menu-btn">
                    NEXT LEVEL →
                </button>
            </div>
        `;

        levelCompleteScreen.style.display = "flex";
        levelCompleteScreen.style.justifyContent = "center";
        levelCompleteScreen.style.alignItems = "center";
    }

    // Give base reward
    giveReward(reward);

    saveGame();
}

function doubleLevelReward(baseReward){

    showFakeAd(() => {

        let extra = baseReward; // give same amount again

        coins += extra;

        showCoinGain(extra);

        updateHUD();

        saveGame();
    });
}

function nextLevel(){
    level++;
    const levelCompleteScreen = document.getElementById("levelComplete");
    if(levelCompleteScreen) {
        levelCompleteScreen.style.display = "none";
        // Reset innerHTML for next time
        levelCompleteScreen.innerHTML = '';
    }
    
    if(level > 50) level = 50;
    if(level > highestLevel){
        highestLevel = level;
    }
    
    // Reset game state
    enemies = [];
    enemyBullets = [];
    bullets = [];
    powerups = [];
    boss = null;
    waveInProgress = false;
    waveNumber = 0;
    
    gameRunning = true;
    paused = false;
    
    updateHUD();
    
    // Restart music
    if(soundOn && gameMusic){
        gameMusic.currentTime = 0;
        gameMusic.play().catch(()=>{});
    }
    
    // Start first wave
    setTimeout(() => startWave(), 500);
    
    lastTime = 0;
    lastWaveTime = 0;
    lastEnemySpawnTime = 0;
    
    requestAnimationFrame(gameLoop);
    saveGame();
}

function gameOver(){
    console.log("GAME OVER TRIGGERED");

    gameRunning = false;
    paused = false;

    // Stop all audio safely
    if(gameMusic) gameMusic.pause();

    // 🔥 FORCE HIDE GAME ELEMENTS
    const canvas = document.getElementById("gameCanvas");
    const hud = document.getElementById("hud");

    if(canvas) canvas.style.display = "none";
    if(hud) hud.style.display = "none";

    // 🔥 CLEAR ARRAYS (prevents ghost updates)
    bullets = [];
    enemyBullets = [];
    enemies = [];

    // 🔥 SHOW GAME OVER UI CLEANLY
    const go = document.getElementById("gameOverScreen");
    if(go){
        go.style.display = "flex";
    }

    // Play menu music again
    if(soundOn){
        menuMusic.currentTime = 0;
        menuMusic.play().catch(()=>{});
    }
}

function restartGame(){
    document.getElementById("gameOverScreen").style.display = "none";
    
    health = maxHearts;
    level = 1;
    score = 0;
    enemies = [];
    enemyBullets = [];
    bullets = [];
    powerups = [];
    boss = null;
    waveInProgress = false;
    
    startGame();
}

function backToMenu(){
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("gameCanvas").style.display = "none";
    document.getElementById("main-menu").style.display = "flex";
}


/* ---------- INITIALIZATION ---------- */

window.addEventListener("load", () => {
    console.log("Window loaded, initializing...");

    loadGame();
    resizeGame();
    checkDailyReward();

    const splash = document.getElementById("splashScreen");
    const menu = document.getElementById("main-menu");
    const canvas = document.getElementById("gameCanvas");
    const hud = document.getElementById("hud");

    if(canvas) canvas.style.display = "none";
    if(hud) hud.style.display = "none";

    /* ---------- TAP TO START OVERLAY ---------- */

    const tapOverlay = document.createElement("div");
    tapOverlay.id = "tapToStart";
    tapOverlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        color: #00ffff;
        font-family: Orbitron, sans-serif;
        text-align: center;
        cursor: pointer;
        flex-direction: column;
    `;

    tapOverlay.innerHTML = `
        <div style="font-size: 30px; margin-bottom: 20px;">⚡ NEBULA STRIKE ⚡</div>
        <div style="font-size: 18px; color: #ffffff;">TAP TO START</div>
    `;

    document.body.appendChild(tapOverlay);

    /* ---------- SAFE START HANDLER ---------- */

    let started = false; // ✅ prevents double trigger

    const handleStart = (e) => {
        if(started) return;
        started = true;

        if(e && e.preventDefault) e.preventDefault();

        console.log("User interaction detected → unlocking audio");

        // ✅ CRITICAL: Resume AudioContext
        if(audioContext && audioContext.state === "suspended"){
            audioContext.resume();
        }

        unlockAudio();

        if(soundOn){
            menuMusic.currentTime = 0;
            menuMusic.play().catch(() => {});
        }

        if(tapOverlay && tapOverlay.parentNode){
            tapOverlay.remove();
        }

        if(splash){
           splash.style.opacity = "0";
           splash.style.pointerEvents = "none";
           setTimeout(() => {
              splash.style.display = "none";
           }, 500);
        }

        if(menu){
           menu.style.display = "flex";
           menu.style.visibility = "visible";
           menu.style.opacity = "1";
           menu.classList.add("show");
        }

        console.log("Game ready");
    };

    ["click", "touchstart"].forEach(evt => {
       tapOverlay.addEventListener(evt, handleStart, { once: true, passive: false });
    });
    /* ---------- FALLBACK ---------- */

    setTimeout(() => {
        if(!started && document.getElementById("tapToStart")){
            console.log("Fallback trigger");
            handleStart();
        }
    }, 4000);

    console.log("Initialization complete - waiting for tap");
});
