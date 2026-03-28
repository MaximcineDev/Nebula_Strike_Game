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
enemyFastImg.src = "assets/enemy-fast.png";

const enemyTankImg = new Image();
enemyTankImg.src = "assets/enemy-tank.png";

const enemyShooterImg = new Image();
enemyShooterImg.src = "assets/enemy-shooter.png";

const bossImg = new Image();
bossImg.src = "assets/boss.png";

const bgImg = new Image();
bgImg.src = "assets/background.png";

const explosionImg = new Image();
explosionImg.src = "assets/explosion.png";

const coinImg = new Image();
coinImg.src = "assets/ui/coin-icon.png";

let currentSkin = 0;

const skins = [
    "assets/player.png",
    "assets/player2.png",
    "assets/player3.png",
    "assets/player4.png"
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

let menuMusic = new Audio("assets/menu.mp3");
menuMusic.loop = true;
menuMusic.volume = 0.7;

let gameMusic = new Audio("assets/music.mp3");
gameMusic.loop = true;
gameMusic.volume = 0.7;

let audioUnlocked = false;
let audioContext = null;

function unlockAudio(){
    if(audioUnlocked) return;
    
    // Create AudioContext on user gesture (required for iOS)
    if(!audioContext){
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Resume AudioContext (critical for iOS)
    if(audioContext.state === 'suspended' || audioContext.state === 'interrupted'){
        audioContext.resume().then(() => {
            console.log("AudioContext resumed");
        }).catch(e => console.log("Resume failed:", e));
    }
    
    // Play silent sound to fully unlock iOS audio
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    
    audioUnlocked = true;
    
    // Start menu music
    if(soundOn){
        menuMusic.currentTime = 0;
        menuMusic.play().catch(e => console.log("Menu music failed:", e));
    }
    
    console.log("Audio unlocked");
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
        if(!audioUnlocked){
            console.log("Unlocking audio via:", e.type);
            unlockAudio();
        }
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
document.getElementById("pauseBtn").onclick = () => {
    if(!gameRunning) return;
    togglePause();
};

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
let bossHP = 0;
let bossMaxHP = 0;

let fireRate = 300;
let lastShot = 0;

let coins = 0;
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

// LOOP TIMING
let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

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
    const levelText = document.getElementById("levelText");
    const scoreText = document.getElementById("scoreText");

    if(coinText) coinText.innerText = coins;
    if(levelText) levelText.innerText = "Lv " + level;
    if(scoreText) scoreText.innerText = "Score: " + score;
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

function coinPulse(){
    const coinBox = document.getElementById("coinBox");
    if(!coinBox) return;
    coinBox.style.transform = "scale(1.2)";
    setTimeout(()=>{
        coinBox.style.transform = "scale(1)";
    },120);
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
        if(pauseMenu) pauseMenu.style.display = "flex";
        if(gameMusic) gameMusic.pause();
    } else {
        console.log("Resuming game");
        if(pauseMenu) pauseMenu.style.display = "none";
        if(soundOn && gameMusic) {
            gameMusic.play().catch(e => console.log("Resume music failed"));
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
    if(menu) {
        menu.style.display = "flex";
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
    console.log(">>> STARTING GAME <<<");
    
    unlockAudio();
    
    const menu = document.getElementById("main-menu");
    const canvasEl = document.getElementById("gameCanvas");
    const hud = document.getElementById("hud");

    if(menu) {
        menu.style.display = "none";
        menu.classList.remove("show");
    }
    if(canvasEl) canvasEl.style.display = "block";
    if(hud) hud.style.display = "flex";

    health = maxHearts;
    score = 0;
    level = 1;
    gameRunning = true;
    paused = false;
    
    enemies = [];
    bullets = [];
    enemyBullets = [];
    powerups = [];
    explosions = [];
    coinFX = [];
    
    waveInProgress = false;
    waveNumber = 0;
    enemiesInWave = 0;
    waveSpawnTimer = 0;
    spawnTimer = 0;
    boss = null;

    updateHUD();
    updateHeartsUI();
    
    menuMusic.pause();
    if(soundOn && audioUnlocked){
        gameMusic.currentTime = 0;
        gameMusic.play().catch(e => console.log("Game music failed:", e));
    }
    
    startAutoShoot();
    
    setTimeout(() => {
        console.log("Triggering first wave...");
        startWave();
    }, 500);
    
    lastTime = 0;
    requestAnimationFrame(gameLoop);
    
    console.log("Game started, loop running");
}


/* ---------- AUTO SHOOT ---------- */

let autoShootInterval = null;
let autoShootStarted = false;

function startAutoShoot(){
    if(autoShootStarted) return;
    autoShootStarted = true;
    
    console.log("Auto-shoot started");
    
    if(autoShootInterval){
        clearInterval(autoShootInterval);
    }
    
    autoShootInterval = setInterval(() => {
        if(gameRunning && !paused){
            playerShoot();
        }
    }, fireRate);
    
    menuMusic.pause();
    if(soundOn){
        gameMusic.currentTime = 0;
        gameMusic.play().catch(e => console.log("Game music failed:", e));
    }
}

function playerShoot(){
    let now = Date.now();
    if(now - lastShot < 100) return;
    lastShot = now;

    if(soundOn){
        shootSound.currentTime = 0;
        shootSound.play().catch(e => {});
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
        active: true
    });
}


/* ---------- WAVE & SPAWN SYSTEM ---------- */

function getDifficultySettings(){
    return {
        speed: 2 + (level - 1) * 0.3,
        spawnRate: Math.max(400, 1500 - (level - 1) * 100),
        hpBase: 2 + Math.floor((level - 1) / 2),
        maxEnemies: 10 + level,
        waveSize: 3 + Math.floor(level / 2),
        troopMode: level >= 5,
        bossChance: level >= 2 ? 0.3 : 0
    };
}

function startWave(){
    if(!gameRunning || paused || boss) return;
    
    const diff = getDifficultySettings();
    
    waveInProgress = true;
    waveNumber++;
 
    enemiesInWave = diff.waveSize;
    isTroopFormation = diff.troopMode;
    waveSpawnTimer = 0;
    spawnTimer = 0;
    
    console.log(`>>> WAVE ${waveNumber} STARTED! Size: ${enemiesInWave}, Troop: ${isTroopFormation}`);
    
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
        y: -50, // Start above screen
        w: 40,
        h: 40,
        type: type,
        hp: diff.hpBase + level,
        speed: diff.speed,
        shootChance: 0.01,
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
        enemy.shootChance = 0.03;
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
    
    console.log(`Spawned enemy type ${type}. Remaining: ${enemiesInWave}, Active: ${enemies.length}`);
}

function updateSpawning(){
    if(boss) return;
    
    spawnTimer++;
    
    if(waveInProgress){
        if(enemiesInWave > 0){
            let spawnDelay = isTroopFormation ? 30 : 20;
            if(spawnTimer >= spawnDelay){
                spawnSingleEnemy();
                spawnTimer = 0;
            }
        } else if(enemies.length === 0){
            console.log("Wave complete!");
            endWave();
        }
    } else {
        if(spawnTimer > 180){
            startWave();
            spawnTimer = 0;
        }
    }
}

function endWave(){
    waveInProgress = false;
    waveSpawnTimer = 0;
    spawnTimer = 0;
    
    if(level >= 2 && Math.random() < 0.3){
        console.log("Spawning boss after wave!");
        setTimeout(() => spawnBoss(), 1500);
    }
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

function spawnBoss(){
    if(boss) return;
    
    boss = {
        x: canvas.width / 2 - 80,
        y: -120,
        w: 160,
        h: 160,
        speed: 1.5 + (level * 0.2)
    };
    
    bossMaxHP = 100 + level * 25;
    bossHP = bossMaxHP;

    const bossBar = document.getElementById("bossBar");
    const bossWarning = document.getElementById("bossWarning");
    
    if(bossBar) bossBar.style.display = "block";
    if(bossWarning) {
        bossWarning.style.display = "block";
        setTimeout(()=>{
            bossWarning.style.display = "none";
        }, 2000);
    }
}

/* ---------- MAIN GAME LOOP ---------- */

function gameLoop(currentTime = 0){
    if(gameRunning && !paused){
        requestAnimationFrame(gameLoop);
    }
    
    const deltaTime = currentTime - lastTime;
    if(deltaTime < frameInterval) return;
    
    lastTime = currentTime - (deltaTime % frameInterval);
    
    if(!gameRunning || paused) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if(screenShake > 0){
        ctx.save();
        let shakeX = (Math.random() - 0.5) * 10;
        let shakeY = (Math.random() - 0.5) * 10;
        ctx.translate(shakeX, shakeY);
    }
    
    if(bgImg && bgImg.complete && bgImg.naturalWidth > 0){
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        drawStars();
    } else {
        ctx.fillStyle = "#000011";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawStars();
    }
    
    try {
        updatePlayer();
        drawPlayer();
        updateBullets();
        updateEnemies();
        updateExplosions();
        updateCoinFX();
        updateEnemyBullets();
        updatePowerups();
        updateBoss();
        updateTimers();
        updateSpawning();
    } catch(e) {
        console.error("Game loop error:", e);
    }
    
    ctx.fillStyle = "#00ff00";
    ctx.font = "12px monospace";
    ctx.fillText(`Enemies: ${enemies.length}`, 10, canvas.height - 60);
    ctx.fillText(`Wave: ${waveNumber} (left: ${enemiesInWave})`, 10, canvas.height - 45);
    ctx.fillText(`InWave: ${waveInProgress}`, 10, canvas.height - 30);
    ctx.fillText(`SpawnTimer: ${spawnTimer}`, 10, canvas.height - 15);
    
    if(screenShake > 0){
        ctx.restore();
        screenShake--;
    }
    
    if(hitFlash > 0){
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        hitFlash--;
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
}

/* ---------- BULLETS ---------- */

function updateBullets(){
    for(let i = bullets.length - 1; i >= 0; i--){
        let b = bullets[i];
        
        b.y += b.dy || -8;
        if(b.dx) b.x += b.dx;
        
        ctx.save();
        ctx.shadowBlur = 10;
        if(weaponLevel === 1){
            ctx.fillStyle = "cyan";
            ctx.shadowColor = "cyan";
        } else if(weaponLevel === 2){
            ctx.fillStyle = "lime";
            ctx.shadowColor = "lime";
        } else if(weaponLevel === 3){
            ctx.fillStyle = "yellow";
            ctx.shadowColor = "yellow";
        } else {
            ctx.fillStyle = "orange";
            ctx.shadowColor = "orange";
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
                
                if(e.hp <= 0){
                    enemies.splice(j, 1);
                    
                    if(soundOn){
                        explosionSound.currentTime = 0;
                        explosionSound.play().catch(e => console.log("Explosion sound failed"));
                    }
                    
                    explosions.push({
                        x: e.x,
                        y: e.y,
                        frame: 0,
                        maxFrame: 10
                    });
                    
                    let reward = 5;
                    if(e.type === ENEMY_FAST) reward = 8;
                    if(e.type === ENEMY_TANK) reward = 15;
                    if(e.type === ENEMY_SHOOTER) reward = 12;
                    
                    coins += reward;
                    score += reward * 2;
                    totalKills++;
                    
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
                    
                    coinPulse();
                    updateHUD();
                    
                    if(Math.random() < 0.3){
                        powerups.push({
                            x: e.x + e.w/2 - 16,
                            y: e.y + e.h/2,
                            type: Math.floor(Math.random() * 3),
                            w: 32,
                            h: 32
                        });
                    }
                    
                    try{
                        saveGame();
                    } catch(err){
                        console.log("Save failed:", err);
                    }
                }
                
                break;
            }
        }
        
        if(hit) continue;
        
        if(boss && boss.hp > 0){
            if(b.x < boss.x + boss.w && b.x + b.w > boss.x &&
               b.y < boss.y + boss.h && b.y + b.h > boss.y){
                
                bullets.splice(i, 1);
                boss.hp -= damage;
                updateBossBar();
                
                if(boss.hp <= 0){
                    bossDefeated();
                }
                continue;
            }
        }
        
        if(b.y < -50 || b.x < -50 || b.x > canvas.width + 50){
            bullets.splice(i, 1);
        }
    }
}

function bossDefeated(){
    boss = null;
    document.getElementById("bossBar").style.display = "none";
    coins += 50;
    score += 100;
    
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
    for(let i=explosions.length-1;i>=0;i--){
        let ex = explosions[i];
        ctx.drawImage(explosionImg, ex.x, ex.y, 40, 40);
        ex.frame++;
        if(ex.frame > (ex.maxFrame || 10)){
            explosions.splice(i,1);
        }
    }
}

function updateBossBar(){
    if(!boss) return;
    const bar = document.getElementById("bossBar");
    const hp = document.getElementById("bossHealth");
    
    if(!bar || !hp) return;
    bar.style.display = "block";
    hp.style.width = (boss.hp / bossMaxHP * 100) + "%";
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
    enemies.forEach(e=>{
        e.y += e.speed;
        
        if(e.type === ENEMY_FAST) ctx.filter = "hue-rotate(90deg)";
        else if(e.type === ENEMY_TANK) ctx.filter = "brightness(0.6)";
        else if(e.type === ENEMY_SHOOTER) ctx.filter = "hue-rotate(200deg)";
        else ctx.filter = "none";
        
        let img = enemyImg;
        if(e.type === ENEMY_FAST) img = enemyFastImg;
        if(e.type === ENEMY_TANK) img = enemyTankImg;
        if(e.type === ENEMY_SHOOTER) img = enemyShooterImg;
        
        ctx.drawImage(img, e.x, e.y, e.w, e.h);
        
        if(Math.random() < e.shootChance){
            enemyBullets.push({
                x: e.x + e.w/2,
                y: e.y,
                w: 4,
                h: 10
            });
        }
    });
    ctx.filter = "none";
}

/* ---------- ENEMY BULLETS ---------- */

function updateEnemyBullets(){
    for(let i=enemyBullets.length-1;i>=0;i--){
        let b=enemyBullets[i];
        b.y += 5;
        ctx.fillStyle = "red";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        
        if(b.x < player.x + player.width &&
           b.x + b.w > player.x &&
           b.y < player.y + player.height &&
           b.y + b.h > player.y){
            
            enemyBullets.splice(i,1);
            
            if(!shieldActive){
                hitFlash = 5;
                screenShake = 6;
                health--;
                updateHUD();
                updateHeartsUI();
            }
            
            if(health <= 0){
                gameOver();
            }
        }
        
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
                shieldTimer = 300;
            }
        }
        
        if(p.y > canvas.height){
            powerups.splice(i, 1);
        }
    }
}

/* ---------- TIMERS ---------- */

function updateTimers(){
    if(rapidFire){
        rapidTimer--;
        fireRate = 100;
        if(rapidTimer <= 0){
            rapidFire = false;
            fireRate = Math.max(80, 300 - level * 10);
        }
    }
    
    if(shieldActive){
        shieldTimer--;
        if(shieldTimer <= 0){
            shieldActive = false;
        }
    }
}

/* ---------- SAVE/LOAD ---------- */

function saveGame(){
    const saveData = {
        coins: coins,
        weaponLevel: weaponLevel,
        maxHearts: maxHearts,
        shieldLevel: shieldLevel,
        highestLevel: highestLevel,
        premium: premium,
        soundOn: soundOn,
        skin: currentSkin,
        lastReward: lastReward,
        achievements: achievements,
        totalKills: totalKills,
        unlockedSkins: unlockedSkins || [0]
    };
    localStorage.setItem("nebulaSave", JSON.stringify(saveData));
}

function loadGame(){
    try{
        const data = localStorage.getItem("nebulaSave");
        if(!data) return;
        
        const save = JSON.parse(data);
        
        coins = save.coins || 0;
        weaponLevel = save.weaponLevel || 1;
        maxHearts = save.maxHearts || 5;
        shieldLevel = save.shieldLevel || 0;
        highestLevel = save.highestLevel || 1;
        premium = save.premium || false;
        soundOn = save.soundOn ?? true;
        achievements = save.achievements || [];
        totalKills = save.totalKills || 0;
        currentSkin = save.skin || 0;
        unlockedSkins = save.unlockedSkins || [0];
        
        updateSkin();
        lastReward = save.lastReward || 0;
        
    }catch(e){
        console.log("Save load error", e);
    }
    
    menuMusic.play().catch(e => console.log("Menu music failed"));
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

function openShop(){
    console.log("Opening shop...");
    const shop = document.getElementById("shop");
    const mainMenu = document.getElementById("main-menu");
    
    if(!shop){
        console.error("Shop element not found!");
        return;
    }

    if(mainMenu) mainMenu.style.display = "none";
    
    updateShopCoins();
    shop.style.display = "flex";
    updateShopUI();
    
    console.log("Shop opened");
}

function closeShop(){
    console.log("Closing shop...");
    const shop = document.getElementById("shop");
    const mainMenu = document.getElementById("main-menu");
    
    if(shop) shop.style.display = "none";
    
    if(mainMenu){
        mainMenu.style.display = "flex";
        mainMenu.classList.add("show");
    }
}

function buyShield(){
    if(coins >= 50){
        coins -= 50;
        shieldLevel++;
        updateHUD();
        saveGame();
    }
}

function buyWeapon(){
    if(coins < 150) return;
    coins -= 150;
    weaponLevel++;
    if(weaponLevel > 5) weaponLevel = 5;
    saveGame();
    updateHUD();
}

function buyHearts(){
    if(coins >= 50){
        coins -= 50;
        maxHearts++;
        health = maxHearts;
        updateHUD();
        updateHeartsUI();
        saveGame();
    }
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
        shootSound.volume = 1;
        explosionSound.volume = 1;
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
    const vol = val / 100;
    if(shootSound) shootSound.volume = vol;
    if(explosionSound) explosionSound.volume = vol;
}

/* ---------- LEVEL & GAME OVER ---------- */

function levelComplete(){
    gameRunning = false;
    document.getElementById("levelComplete").style.display = "block";
}

function nextLevel(){
    document.getElementById("levelComplete").style.display = "none";
    gameRunning = true;
    level++;
    
    if(level > highestLevel){
        highestLevel = level;
    }
    
    enemies = [];
    enemyBullets = [];
    bullets = [];
    waveInProgress = false;
    
    if(level >= 2 && Math.random() < 0.5){
        setTimeout(() => spawnBoss(), 1000);
    } else {
        setTimeout(() => startWave(), 1000);
    }
    
    lastTime = 0;
    requestAnimationFrame(gameLoop);
    saveGame();
}

function gameOver(){
    gameRunning = false;
    document.getElementById("gameOverScreen").style.display = "flex";
    document.getElementById("hud").style.display = "none";
    gameMusic.pause();
    menuMusic.play().catch(e => console.log("Menu music failed"));
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

function checkDailyReward(){
    let last = localStorage.getItem("dailyReward");
    let today = new Date().toDateString();
    
    if(last !== today){
        coins += 20;
        localStorage.setItem("dailyReward", today);
        console.log("Daily reward given");
    }
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
   
    // Create TAP TO START overlay for iOS audio unlock
    const tapOverlay = document.createElement('div');
    tapOverlay.id = 'tapToStart';
    tapOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        color: #00ffff;
        font-family: Orbitron, sans-serif;
        font-size: 28px;
        font-weight: bold;
        text-align: center;
        cursor: pointer;
        flex-direction: column;
    `;
    tapOverlay.innerHTML = `
        <div style="margin-bottom: 20px;">⚡ NEBULA STRIKE ⚡</div>
        <div style="font-size: 20px; color: #fff;">TAP TO START</div>
    `;
    
    document.body.appendChild(tapOverlay);
    
    // Handle tap to unlock audio and show menu
    const handleStart = (e) => {
        e.preventDefault();
        
        // CRITICAL: Unlock audio first
        if(!audioUnlocked){
            unlockAudio();
        }
        
        // Remove overlay
        tapOverlay.remove();
        
        // Show menu
        if(splash) splash.style.display = "none";
        if(menu) {
            menu.style.display = "flex";
            menu.classList.add("show");
        }
        
        console.log("Game started via user tap");
    };
    
    tapOverlay.addEventListener('click', handleStart);
    tapOverlay.addEventListener('touchstart', handleStart, {passive: false});
    
    // Emergency fallback: Auto-start after 4 seconds
    setTimeout(() => {
        if(document.getElementById('tapToStart')) {
            handleStart({preventDefault: () => {}});
        }
    }, 4000);
    
    console.log("Initialization complete - waiting for tap");
});
