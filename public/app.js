/* =========================
   NEBULA STRIKE
========================= */

if (location.hostname !== "localhost") {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
}

console.log("APP STARTED - FINAL VERSION");

if (!window.location.href.includes("localhost")) {
    console.log = () => {};
}

console.log("=== SCRIPT LOADED ===");
console.log("Canvas exists:", !!document.getElementById("gameCanvas"));
let AdMob = window.AdMob || null;

let started = false;

/* ---------- ADMOB SETUP ---------- */

let admobReady = false;
let pendingRewardAction = null;

const BANNER_AD_ID = 'ca-app-pub-5850163781981893/7518088125';

async function initAds() {
  if (!AdMob) {
    console.log("AdMob not available (browser mode)");
    return;
  }

  try {
    await AdMob.initialize();
    admobReady = true;
    console.log("AdMob initialized");
  } catch (err) {
    console.log("AdMob init error:", err);
  }
}

initAds();

let adReady = false;

async function loadRewardAd() {
  try {
    await AdMob.prepareRewardVideoAd({
      adId: 'ca-app-pub-5850163781981893/3862181045',
    });
    adReady = true;
    console.log("Ad ready ✅");
  } catch {
    adReady = false;
  }
}

/* ---------- REWARDED AD ---------- */

async function showRewardAd() {
    console.log("Attempting to show ad...");

    if (window.showingRewardAd) {
        console.log("Already showing ad, ignoring duplicate call");
        return;
    }
    window.showingRewardAd = true;

    if (!AdMob) {
        console.log("Browser mode → simulate reward");
        
        setTimeout(() => {
            handleReward(true);
            window.showingRewardAd = false;
        }, 1000);
        
        return;
    }

    if (!admobReady) {
        console.log("Ad not ready → fallback");
        window.showingRewardAd = false;
        fallbackRevive();
        return;
    }

    try {
        await AdMob.prepareRewardVideoAd({
            adId: 'ca-app-pub-5850163781981893/3862181045'
        });

        await AdMob.showRewardVideoAd();
        
        window.showingRewardAd = false;
        
    } catch (err) {
        console.log("Ad failed:", err);
        pendingRewardAction = null;
        gameState = "gameover";
        window.showingRewardAd = false;
        
        // Re-enable button
        const reviveBtn = document.getElementById("reviveBtn");
        if (reviveBtn) {
            reviveBtn.disabled = false;
            reviveBtn.style.opacity = "1";
            reviveBtn.innerText = "▶ Watch Ad to Continue";
        }
        
        fallbackRevive();
    }
}

/* ---------- BANNER AD ---------- */

async function loadBannerAd() {
  try {
    await AdMob.showBanner({
      adId: BANNER_AD_ID,
      position: 'bottom',
      margin: 0
    });
    console.log("Banner ad loaded");
  } catch (err) {
    console.log("Banner ad failed:", err);
  }
}

function hideBannerAd() {
  try {
    AdMob.hideBanner();
    console.log("Banner hidden");
  } catch (err) {
    console.log("Hide banner failed:", err);
  }
}

/* ---------- REWARD HANDLER ---------- */

function handleReward(success) {
    if (!success) {
        console.log("Reward failed or skipped");
        
        // Re-enable button on failure
        const reviveBtn = document.getElementById("reviveBtn");
        if (reviveBtn && pendingRewardAction === 'revive') {
            reviveBtn.disabled = false;
            reviveBtn.style.opacity = "1";
            reviveBtn.innerText = "▶ Watch Ad to Continue";
        }
        
        pendingRewardAction = null;
        gameState = "gameover";
        return;
    }

    console.log("Reward granted:", pendingRewardAction);
    
    const action = pendingRewardAction;
    pendingRewardAction = null;

    switch (action) {
        case 'revive':
            if (reviveUsed) {
                console.log("Already revived, ignoring duplicate");
                return;
            }
            
            health = Math.ceil(maxHearts * 0.5);
            updateHeartsUI();
            hideReviveScreen();

            gameRunning = true;
            reviveUsed = true;
            gameState = "playing";
            paused = false;

            hitFlash = 0;
            screenShake = 0;

            lastTime = 0;
            if (window.gameLoopId) {
                cancelAnimationFrame(window.gameLoopId);
            }
            window.gameLoopId = requestAnimationFrame(gameLoop);
            
            console.log("Revive complete, health:", health);
            break;

        case 'freeCoins':
            coins += 100;
            updateHUD();
            coinPulse();
            showCoinGain(100);
            break;

        case 'doubleLevel':
            coins += rewardAmount;
            updateHUD();
            coinPulse();
            showCoinGain(rewardAmount);
            break;

        case 'dailyDouble':
            claimDailyReward(false);
            break;

        default:
            console.log("Unknown reward action:", action);
    }

    saveGame();
}

function fallbackRevive() {
    console.log("Fallback revive triggered");

    health = Math.ceil(maxHearts * 0.5);
    updateHeartsUI();

    hideReviveScreen();

    gameRunning = true;
    reviveUsed = true;

    hitFlash = 0;
    screenShake = 0;

    lastTime = 0;
    requestAnimationFrame(gameLoop);
}


if (AdMob) {
    let rewardHandled = false;
    
    AdMob.addListener('onRewardedVideoAdReward', () => {
        if (rewardHandled) {
            console.log("Reward already handled, ignoring duplicate");
            return;
        }
        rewardHandled = true;
        
        handleReward(true);
        
        setTimeout(() => { rewardHandled = false; }, 1000);
    });
    
    AdMob.addListener('onRewardedVideoAdClosed', () => {
        console.log("Ad closed");
        window.showingRewardAd = false;
        
        if (pendingRewardAction === 'revive') {
            console.log("Ad closed without reward");
            gameState = "gameover";
            pendingRewardAction = null;
            
            const reviveBtn = document.getElementById("reviveBtn");
            if (reviveBtn) {
                reviveBtn.disabled = false;
                reviveBtn.style.opacity = "1";
                reviveBtn.innerText = "▶ Watch Ad to Continue";
            }
        }
    });
}

/* ---------- IMAGES ---------- */

const playerImg = new Image(); playerImg.src = "assets/player.png";
const enemyImg = new Image(); enemyImg.src = "assets/enemy.png";
const enemyFastImg = new Image(); enemyFastImg.src = "assets/enemies/enemy-fast.png";
const enemyTankImg = new Image(); enemyTankImg.src = "assets/enemies/enemy-tank.png";
const enemyShooterImg = new Image(); enemyShooterImg.src = "assets/enemies/enemy-shooter.png";
const bossImg = new Image(); bossImg.src = "assets/boss.png";
const bgImg = new Image(); bgImg.src = "assets/background.png";
const explosionImg = new Image(); explosionImg.src = "assets/effects/explosion.png";
const coinImg = new Image(); coinImg.src = "assets/ui/coin-icon.png";
const healthImg = new Image(); healthImg.src = "assets/ui/health.png";
const rapidImg = new Image(); rapidImg.src = "assets/ui/rapid.png";
const shieldImg = new Image(); shieldImg.src = "assets/ui/shield.png";

/* ---------- LOAD TRACKING ---------- */

const imagesToLoad = [
    { img: playerImg, name: "player" },
    { img: enemyImg, name: "enemy" },
    { img: enemyFastImg, name: "enemyFast" },
    { img: enemyTankImg, name: "enemyTank" },
    { img: enemyShooterImg, name: "enemyShooter" },
    { img: bossImg, name: "boss" },
    { img: bgImg, name: "background" },
    { img: explosionImg, name: "explosion" },
    { img: coinImg, name: "coin" },
    { img: healthImg, name: "health" },
    { img: rapidImg, name: "rapid" },
    { img: shieldImg, name: "shield" }
];

let loadedCount = 0;
let imagesLoaded = false;
let failedImages = [];

function checkImageActuallyLoaded(imgObj) {
    return imgObj.img.complete && imgObj.img.naturalWidth > 0;
}

function onImageLoad(imgObj) {
    if (checkImageActuallyLoaded(imgObj)) {
        loadedCount++;
        console.log(`✅ ${imgObj.name} loaded successfully (${imgObj.img.naturalWidth}x${imgObj.img.naturalHeight})`);
    } else {
        console.error(`❌ ${imgObj.name} failed to load (complete=${imgObj.img.complete}, naturalWidth=${imgObj.img.naturalWidth})`);
        failedImages.push(imgObj);
    }
    
    if (loadedCount + failedImages.length >= imagesToLoad.length) {
        if (failedImages.length === 0) {
            imagesLoaded = true;
            console.log("ALL IMAGES READY ✅");
        } else {
            console.warn(`${failedImages.length} images failed, retrying...`);
            retryFailedImages();
        }
    }
}

function retryFailedImages() {
    const toRetry = [...failedImages];
    failedImages = [];
    
    if (toRetry.length === 0) {
        imagesLoaded = true;
        return;
    }
    
    let retryCount = 0;
    const totalToRetry = toRetry.length;
    
    toRetry.forEach(imgObj => {
        console.log(`🔄 Retrying ${imgObj.name}...`);
        const retryImg = new Image();
        retryImg.src = imgObj.img.src + "?retry=" + Date.now();
        
        retryImg.addEventListener('load', () => {
            imgObj.img.src = retryImg.src;
            loadedCount++;
            retryCount++;
            console.log(`✅ ${imgObj.name} retry succeeded`);
            if (retryCount >= totalToRetry) {
                imagesLoaded = true;
                console.log("ALL IMAGES READY AFTER RETRY ✅");
            }
        });
        
        retryImg.addEventListener('error', () => {
            console.error(`❌ ${imgObj.name} retry failed`);
            retryCount++;
            if (retryCount >= totalToRetry) {
                imagesLoaded = true;
                console.log("ALL IMAGES READY (with failures) ✅");
            }
        });
    });
}

// Set up listeners
imagesToLoad.forEach(imgObj => {
    imgObj.img.addEventListener('load', () => onImageLoad(imgObj));
    imgObj.img.addEventListener('error', () => onImageLoad(imgObj));
    
    // If already cached/complete, verify it actually loaded
    if (imgObj.img.complete) {
        onImageLoad(imgObj);
    }
});

/* ---------- SKINS ---------- */

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

const ENEMY_NORMAL = 0;
const ENEMY_FAST = 1;
const ENEMY_TANK = 2;
const ENEMY_SHOOTER = 3;

/* ---------- REVIVE UI ---------- */

const reviveScreen = document.getElementById("reviveScreen");
const reviveBtn = document.getElementById("reviveBtn");

console.log("Revive elements:", {reviveScreen: !!reviveScreen, reviveBtn: !!reviveBtn});

document.getElementById("reviveBtn").addEventListener("click", () => {
    console.log("Revive clicked");
    
    if (pendingRewardAction === 'revive' || gameState === "reviving") {
        console.log("Already processing revive, ignoring click");
        return;
    }

    if (gameState !== "gameover") {
        console.log("Not in gameover state, ignoring. Current state:", gameState);
        return;
    }

    pendingRewardAction = "revive";
    gameState = "reviving";
    
    const reviveBtn = document.getElementById("reviveBtn");
    if (reviveBtn) {
        reviveBtn.disabled = true;
        reviveBtn.style.opacity = "0.5";
        reviveBtn.innerText = "Loading...";
    }

    showRewardAd();
});
   
function showReviveScreen() {
    console.log("showReviveScreen called, reviveUsed:", reviveUsed);
    
    const reviveBtn = document.getElementById("reviveBtn");
    if (reviveBtn) {
        if (reviveUsed) {
            reviveBtn.style.display = "none";
        } else {
            reviveBtn.style.display = "block";
            reviveBtn.disabled = false;
            reviveBtn.style.opacity = "1";
            reviveBtn.innerText = "▶ Watch Ad to Continue";
        }
    }
    
    reviveScreen.style.display = "flex";
    
    if (admobReady && !reviveUsed) {
        AdMob.prepareRewardVideoAd({
            adId: 'ca-app-pub-5850163781981893/3862181045'
        }).catch(err => console.log("Ad prep failed:", err));
    }
}

function hideReviveScreen() {
  reviveScreen.style.display = "none";
}

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

/* ---------- AUDIO ---------- */

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

let playerId = localStorage.getItem("playerId");

if (!playerId) {
    playerId = "player_" + Math.random().toString(36).substring(2);
    localStorage.setItem("playerId", playerId);
}

function resizeGame(){
    if(!canvas) {
        console.error("Canvas not found!");
        return;
    }
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    // Re-init stars on resize so they fill the new canvas
    if (stars.length === 0 || stars[0].x > width) {
        initStars();
    }

    if(player && typeof player.x === 'number' && typeof player.y === 'number'){
        player.x = Math.min(Math.max(player.x, 0), canvas.width - player.width);
        player.y = Math.min(Math.max(player.y, 0), canvas.height - player.height);
    }
    
    if(player && player.x === 0 && player.y === 0 && canvas.width > 0){
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
let gameState = "menu";

let reviveUsed = false;

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

let rewardAmount = 0;

let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

let playerPerformance = {
    shotsFired: 0,
    shotsHit: 0,
    damageTaken: 0
};

let isTrusted = true;

let lastWaveTime = 0;
let lastEnemySpawnTime = 0
let score = 0;

function detectTamper() {
    const allowedDomains = [
        "chinabel.github.io",
        "localhost"
    ];

    const isAndroidNative = typeof Capacitor !== 'undefined' && 
                            Capacitor.getPlatform() === 'android';

    if (isAndroidNative) return;

    const isAllowed = allowedDomains.some(domain =>
        window.location.hostname.includes(domain)
    );

    if (!isAllowed) {
        document.body.innerHTML = "<h1>Unauthorized Copy</h1>";
        throw new Error("Tampering detected");
    }
}

detectTamper();

/* ---------- TOUCH ---------- */

let touchX = null;
let touchY = null;

canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    const t = e.touches[0];

    touchX = t.clientX;
    touchY = t.clientY;
}, { passive: false });

canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    const t = e.touches[0];

    touchX = t.clientX;
    touchY = t.clientY;
}, { passive: false });

canvas.addEventListener("touchend", () => {
    touchX = null;
    touchY = null;
});

function updateHUD(){
    document.getElementById("coinText").innerText = coins;
    const shopText = document.getElementById("shopCoinText");
    if (shopText) shopText.innerText = coins;
   
    const levelText = document.getElementById("levelText");
    const comboText = document.getElementById("comboText");
    if(comboText){
        comboText.innerText = combo > 1 ? "x" + combo : "";
    }

    const coinText = document.getElementById("coinText");
    if(coinText) {
        coinText.innerText = coins.toString();
        coinText.textContent = coins.toString();
    }
    if(levelText) levelText.innerText = "Lv " + level;
    
    // Debug
    console.log("HUD Update - Coins:", coins);

     // Update new HUD elements
    const energyBar = document.getElementById("energyBar");
    const energyText = document.getElementById("energyText");
    const missionProgress = document.getElementById("missionProgress");
    
    if(energyBar && energyText) {
        // Calculate health percentage
        const maxEnergy = maxHearts * 480;
        const currentEnergy = health * 480;
        const percentage = (health / maxHearts) * 100;
        
        energyBar.style.width = percentage + "%";
        energyText.innerText = currentEnergy + " / " + maxEnergy;
    }
    
    if(missionProgress) {
        // Update with current wave progress
        const killed = Math.max(0, (waveNumber - 1) * 6 + (6 - enemiesInWave));
        const total = waveNumber * 6;
        missionProgress.innerText = killed + " / " + total;
    }
}

function coinPulse(){
    const coinBox = document.getElementById("coinBox");
    if(!coinBox) return;

    coinBox.style.transition = "transform 0.15s, box-shadow 0.15s";
    coinBox.style.transform = "scale(1.25)";
    coinBox.style.boxShadow = "0 0 15px gold";

    setTimeout(()=>{
        coinBox.style.transform = "scale(1)";
        coinBox.style.boxShadow = "none";
    },150);
}

function updateHeartsUI(){
    const hearts = document.querySelectorAll("#hearts img");
    for(let i=0; i<hearts.length; i++){
        if(i < health){
            hearts[i].src = "assets/ui/heart-full.png";
            hearts[i].style.display = "none";
        } else {
            hearts[i].src = "assets/ui/heart-empty.png";
            hearts[i].style.display = "none";
        }
    }
    
    // Add energy bar update
    const maxEnergy = maxHearts * 480;
    const currentEnergy = health * 480;
    const percentage = (health / maxHearts) * 100;
    
    const energyBar = document.getElementById("energyBar");
    const energyText = document.getElementById("energyText");
    
    if(energyBar) {
        energyBar.style.width = percentage + "%";
        
        // Color based on health
        if(percentage > 60) {
            energyBar.style.background = "linear-gradient(90deg, #0066cc, #00ffff)";
        } else if(percentage > 30) {
            energyBar.style.background = "linear-gradient(90deg, #cc6600, #ffcc00)";
        } else {
            energyBar.style.background = "linear-gradient(90deg, #cc0000, #ff4444)";
        }
    }
    
    if(energyText) {
        energyText.innerText = currentEnergy + " / " + maxEnergy;
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
        if(pauseMenu) pauseMenu.style.display = "flex";
        if(gameMusic) gameMusic.pause();
       
        if(window.gameLoopId) {
            cancelAnimationFrame(window.gameLoopId);
            window.gameLoopId = null;
        }
    } else {
        if(pauseMenu) pauseMenu.style.display = "none";
        if(soundOn && gameMusic){
            gameMusic.play().catch(()=>{});
        }
        lastTime = 0;
        if(!window.gameLoopId) {
            window.gameLoopId = requestAnimationFrame(gameLoop);
        }
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
    
    gameRunning = false;
    paused = false;
    gameState = "menu";
    
    if (window.gameLoopId) {
        cancelAnimationFrame(window.gameLoopId);
        window.gameLoopId = null;
    }
    
    // Stop auto-shoot
    if(autoShootTimeout) {
        clearTimeout(autoShootTimeout);
        autoShootTimeout = null;
    }
    
    try { saveGame(); } catch(e) {}
    
    // Audio cleanup
    try {
        gameMusic.pause();
        gameMusic.currentTime = 0;
        menuMusic.currentTime = 0;
        if(soundOn) menuMusic.play().catch(()=>{});
    } catch(e) {}
    
    // Hide ALL game UI elements
    const elements = [
        "pauseMenu", "gameCanvas", "hud", "bossBar", 
        "bossWarning", "levelComplete", "gameOverScreen",
        "reviveScreen"
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = "none";
    });
    
    // Show main menu
    const menu = document.getElementById("main-menu");
    if(menu){
        menu.style.display = "flex";
        menu.style.visibility = "visible";
        menu.style.opacity = "1";
        menu.classList.add("show");
    }
    
    // Reset game entities
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
    if (!imagesLoaded) {
        setTimeout(startGame, 100);
        return;
    }

    hideBannerAd();
    console.log("=== startGame() CALLED ===");
    
    if (window.gameLoopId) {
        cancelAnimationFrame(window.gameLoopId);
        window.gameLoopId = null;
    }
    
    if(autoShootTimeout) {
        clearTimeout(autoShootTimeout);
        autoShootTimeout = null;
    }
    
    unlockAudio();

    // SHOW CANVAS FIRST
    const gameCanvas = document.getElementById("gameCanvas");
    const hud = document.getElementById("hud");
    
    if(gameCanvas) {
        gameCanvas.style.display = "block";
        gameCanvas.style.pointerEvents = "auto";
    }
    if(hud) hud.style.display = "flex";

    // FORCE BROWSER TO CALCULATE LAYOUT
    document.body.offsetHeight; // trigger reflow
    
    // NOW resize (canvas will have correct dimensions)
    resizeGame();

    // GUARD: if canvas still 0, retry
    if(!canvas || canvas.width === 0 || canvas.height === 0){
        console.warn("Canvas not ready, retrying...");
        setTimeout(startGame, 100);
        return;
    }

    // INITIALIZE STARS WITH CORRECT CANVAS SIZE
    initStars();

    // RESET PLAYER POSITION BASED ON ACTUAL CANVAS SIZE
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 150;
    
    // Ensure player is within bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    // Reset ALL game state variables
    health = maxHearts;
    score = 0;
    level = 1;
    gameRunning = true;
    paused = false;
    gameState = "playing";

    enemies = [];
    bullets = [];
    enemyBullets = [];
    powerups = [];
    boss = null;

    waveInProgress = false;
    waveNumber = 0;
    enemiesInWave = 0;
    reviveUsed = false;

    playerPerformance = { shotsFired: 0, shotsHit: 0, damageTaken: 0 };
    lastWaveTime = performance.now();
    lastEnemySpawnTime = performance.now();
    lastTime = 0;

    updateHUD();
    updateHeartsUI();

    // Hide menu
    const menu = document.getElementById("main-menu");
    if(menu){
        menu.style.display = "none";
        menu.classList.remove("show");
    }

    if(menuMusic) menuMusic.pause();

    if(soundOn && gameMusic){
        gameMusic.currentTime = 0;
        gameMusic.play().catch(()=>{});
    }
   
    startAutoShoot();
    startWave();

    // Single, clean loop start
    window.gameLoopId = requestAnimationFrame(gameLoop);
    
    console.log("=== GAME STARTED === Canvas:", canvas.width, "x", canvas.height);
    console.log("Player at:", player.x, player.y);
}

/* ---------- DAILY REWARD FUNCTIONS ---------- */

// Check if today is day 7 (chest day)
function isChestDay() {
    return dailyData.streak === 7;
}

function claimDailyReward(useDoubleReward = false){
    console.log("Claiming daily reward, double:", useDoubleReward, "chest day:", isChestDay());
    
    // If requesting double reward, show ad first
    if (useDoubleReward) {
        if (!admobReady) {
            showCoinWarning("Ads not ready! Claiming normal reward...");
            // Fall back to normal claim
            claimDailyReward(false);
            return;
        }
        
        pendingRewardAction = 'dailyDouble';
        showRewardAd();
        return;
    }
    
    // Calculate reward based on day
    let rewards = {
        coins: 0,
        weaponUpgraded: false,
        shieldUpgraded: false
    };
    
    if (isChestDay()) {
        // DAY 7 - MEGA CHEST REWARD
        rewards.coins = 1000;
        rewards.weaponUpgraded = true;
        rewards.shieldUpgraded = true;
        
        // Apply upgrades
        if (weaponLevel < 5) {
            weaponLevel++;
            damage += 1;
            fireRate = Math.max(80, fireRate - 40);
        }
        if (shieldLevel < 5) {
            shieldLevel++;
        }
        
        // Activate shield immediately
        shieldActive = true;
        shieldTimer = 600; // 10 seconds at 60fps
        
    } else {
        // Normal days 1-6
        rewards.coins = getDailyReward(dailyData.streak);
    }
    
    // Double if applicable
    if (pendingRewardAction === 'dailyDouble') {
        rewards.coins *= 2;
    }
    
    // Clear pending action
    pendingRewardAction = null;
    
    // Add coins
    coins += rewards.coins;
    
    // Update login date and streak
    const today = new Date().toDateString();
    dailyData.lastLogin = today;
    
    // Reset streak after day 7, otherwise increment
    if (dailyData.streak >= 7) {
        dailyData.streak = 1;
    } else {
        dailyData.streak++;
    }
    
    // Save and update UI
    saveDailyData();
    saveGame();
    updateHUD();
    coinPulse();
    
    // Show appropriate message
    if (isChestDay()) {
        showCoinGain(rewards.coins);
        // Show special popup for chest rewards
        setTimeout(() => {
            alert(`🎉 MEGA CHEST OPENED! 🎉\n+${rewards.coins} coins\nWeapon Upgraded!\nShield Upgraded!`);
        }, 100);
    } else {
        showCoinGain(rewards.coins);
    }
    
    // Hide daily reward and return to menu
    const dailyRewardEl = document.getElementById("dailyReward");
    if (dailyRewardEl) {
        dailyRewardEl.style.display = "none";
    }
    
    // Go to main menu
    const menu = document.getElementById("main-menu");
    if (menu) {
        menu.style.display = "flex";
        menu.classList.add("show");
    }
    
    console.log("Daily reward claimed:", rewards, "New streak:", dailyData.streak);
}

function getDailyReward(streakDay){
    // Rewards for days 1-6 (day 7 is special chest)
    const rewards = [50, 100, 150, 200, 300, 400];
    const index = Math.min(Math.max(streakDay - 1, 0), 5);
    return rewards[index];
}

function saveDailyData(){
    try {
        localStorage.setItem("dailyData", JSON.stringify(dailyData));
    } catch (e) {
        console.error("Failed to save daily data:", e);
    }
}

function loadDailyData(){
    try {
        const saved = localStorage.getItem("dailyData");
        if (saved) {
            const parsed = JSON.parse(saved);
            dailyData = {
                lastLogin: parsed.lastLogin || null,
                streak: parsed.streak || 1
            };
        } else {
            dailyData = {
                lastLogin: null,
                streak: 1
            };
        }
    } catch (e) {
        console.error("Failed to load daily data:", e);
        dailyData = {
            lastLogin: null,
            streak: 1
        };
    }
}

// Open normal chest (days 1-6)
function openChest(){
    console.log("Opening normal chest...");
    
    if (chestOpened) return;
    chestOpened = true;
    
    // Show reward amount
    const rewardAmount = getDailyReward(dailyData.streak);
    const amountDisplay = document.getElementById("rewardAmount");
    if (amountDisplay) {
        amountDisplay.innerText = `+${rewardAmount} 🪙`;
        amountDisplay.style.display = "block";
    }
    
    // Enable buttons
    const claimBtn = document.querySelector(".claimBtn");
    const doubleBtn = document.querySelector(".doubleRewardBtn");
    if (claimBtn) claimBtn.disabled = false;
    if (doubleBtn) doubleBtn.disabled = false;
    
    // Update reward text
    const rewardText = document.getElementById("rewardText");
    if (rewardText) {
        rewardText.innerText = `You found ${rewardAmount} coins!`;
    }
}

// Open BIG chest (day 7)
function openBigChest(){
    console.log("Opening BIG chest for day 7!");
    
    if (chestOpened) return;
    chestOpened = true;
    
    const bigChest = document.getElementById("bigRewardChest");
    if (bigChest) {
        bigChest.innerText = "✨";
        bigChest.style.transform = "scale(1.3)";
    }
    
    // Show reward info
    const rewardInfo = document.getElementById("rewardInfo");
    const rewardText = document.getElementById("rewardText");
    if (rewardInfo) {
        rewardInfo.style.display = "flex";
        rewardInfo.innerHTML = `
            <span class="big-reward">🎉 MEGA CHEST! 🎉</span>
            <span>1000 coins + Weapon + Shield</span>
        `;
    }
    
    // Enable buttons
    const claimBtn = document.querySelector(".claimBtn");
    const doubleBtn = document.querySelector(".doubleRewardBtn");
    if (claimBtn) {
        claimBtn.disabled = false;
        claimBtn.innerText = "CLAIM MEGA REWARD!";
    }
    if (doubleBtn) {
        doubleBtn.disabled = false;
        doubleBtn.innerText = "🎥 WATCH AD FOR 2X COINS";
    }
    
    // Hide chest after animation
    setTimeout(() => {
        if (bigChest) bigChest.style.display = "none";
    }, 500);
}

function updateDailyRewardUI(){
    console.log("Updating daily reward UI, streak:", dailyData.streak);
    
    // Update streak display
    const streakNumber = document.getElementById("streakNumber");
    if (streakNumber) {
        streakNumber.innerText = `${dailyData.streak} / 7`;
    }
    
    // Check if day 7 (chest day)
    const isDay7 = isChestDay();
    
    // Show/hide appropriate elements
    const normalReward = document.getElementById("normalReward");
    const bigChest = document.getElementById("bigRewardChest");
    const rewardInfo = document.getElementById("rewardInfo");
    
    // Get buttons
    const claimBtn = document.querySelector(".claimBtn");
    const doubleBtn = document.querySelector(".doubleRewardBtn");
    
    if (isDay7) {
        // Day 7 - show big chest, DISABLE buttons until chest opened
        if (normalReward) normalReward.style.display = "none";
        if (bigChest) {
            bigChest.style.display = "block";
            bigChest.style.cursor = "pointer";
        }
        if (rewardInfo) {
            rewardInfo.style.display = "flex";
            rewardInfo.innerHTML = `<span id="rewardText">Tap the chest for MEGA reward!</span>`;
        }
        
        // Buttons disabled until chest opened
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.innerText = "CLAIM MEGA REWARD!";
        }
        if (doubleBtn) {
            doubleBtn.disabled = true;
            doubleBtn.innerText = "🎥 WATCH AD FOR 2X COINS";
        }
        
        chestOpened = false;
        
    } else {
        // Days 1-6 - ENABLE buttons immediately, show reward info
        if (normalReward) normalReward.style.display = "block";
        if (bigChest) bigChest.style.display = "none";
        if (rewardInfo) {
            rewardInfo.style.display = "flex";
            const rewardAmount = getDailyReward(dailyData.streak);
            rewardInfo.innerHTML = `<span id="rewardText">Daily Reward: ${rewardAmount} coins</span>`;
        }
        
        // Buttons ENABLED immediately for days 1-6
        if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.innerText = "CLAIM REWARD";
        }
        if (doubleBtn) {
            doubleBtn.disabled = false;
            doubleBtn.innerText = "🎥 WATCH AD FOR 2X";
        }
        
        chestOpened = true;
    }
    
    // Update all day boxes
    const rewards = [50, 100, 150, 200, 300, 400, "MEGA!"];
    
    for (let i = 1; i <= 7; i++) {
        const dayEl = document.getElementById(`day${i}`);
        if (!dayEl) continue;
        
        // Reset classes
        dayEl.className = i === 7 ? "day day7-chest" : "day";
        
        // Set content
        if (i === 7) {
            dayEl.innerHTML = `Day 7<br><b>MEGA!</b>`;
        } else {
            dayEl.innerHTML = `Day ${i}<br><b>${rewards[i-1]}</b>`;
        }
        
        if (i < dailyData.streak) {
            dayEl.classList.add("claimed");
            if (i === 7) {
                dayEl.innerHTML = `Day 7<br><b>✓</b>`;
            } else {
                dayEl.innerHTML += "<br>✓";
            }
        } else if (i === dailyData.streak) {
            // Today's reward
            dayEl.classList.add("active", "today");
        }
    }
}

function showDailyReward(){
    console.log("Showing daily reward screen");
    
    updateDailyRewardUI();
    
    const dailyRewardEl = document.getElementById("dailyReward");
    if (dailyRewardEl) {
        dailyRewardEl.style.display = "flex";
    }
}

function checkDailyReward(){
    console.log("Checking daily reward...");
    
    // Ensure dailyData exists
    if (!dailyData || typeof dailyData !== "object") {
        dailyData = {
            lastLogin: null,
            streak: 1
        };
    }
    
    loadDailyData();
    
    const today = new Date().toDateString();
    
    // First time ever
    if (!dailyData.lastLogin) {
        console.log("First time user - showing daily reward");
        dailyData.streak = 1;
        saveDailyData();
        showDailyReward();
        return;
    }
    
    // Already claimed today
    if (dailyData.lastLogin === today) {
        console.log("Already claimed today");
        return;
    }
    
    // Check if streak continues
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    if (dailyData.lastLogin !== yesterdayString) {
        // Streak broken
        console.log("Streak broken, resetting to day 1");
        dailyData.streak = 1;
    } else {
        // Streak continues
        console.log("Streak continues:", dailyData.streak);
    }
    
    saveDailyData();
    showDailyReward();
}

async function giveReward(amount) {
    await addCoins(amount);
   
    const shopCoinText = document.getElementById("shopCoinText");
    if (shopCoinText) {
        shopCoinText.innerText = coins;
    }

    updateHUD();
    showCoinGain(amount);
    
    const dailyRewardEl = document.getElementById("dailyReward");
    if (dailyRewardEl) {
        dailyRewardEl.style.display = "none";
    }
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

async function endWave(){
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

    await addCoins(20 + level * 5);
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
        x: canvas.width / 2 - 100,
        y: -150,
        w: 200,
        h: 200,

        hp: 100 + level * 25,
        maxHp: 100 + level * 25,

        speed: 2 + level * 0.1,

        // ✅ AI SYSTEM
        vx: 2,
        attackCooldown: 0,
        attackRate: 60, // frames between attacks

        pattern: getBossPattern()
    };

    bossMaxHP = boss.hp;

    document.getElementById("bossBar").style.display = "block";
    const bossWarning = document.getElementById("bossWarning");

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
    if(level < 5) return "spray";
    if(level < 10) return Math.random() < 0.5 ? "spray" : "burst";
    return ["spray", "burst", "laser"][Math.floor(Math.random()*3)];
}

function bossAttack(){
    if(!boss) return;

    const centerX = boss.x + boss.w / 2;
    const y = boss.y + boss.h;

    switch(boss.pattern){

        // 🔵 SPRAY (fan spread)
        case "spray":
            for(let i = -3; i <= 3; i++){
                enemyBullets.push({
                    x: centerX,
                    y: y,
                    w: 6,
                    h: 20,
                    dx: i * 1.5,
                    dy: 6
                });
            }
            break;

        // 🔴 BURST (rapid straight shots)
        case "burst":
            for(let i = 0; i < 5; i++){
                setTimeout(() => {
                    enemyBullets.push({
                        x: centerX - 4,
                        y: y,
                        w: 8,
                        h: 25,
                        dy: 10
                    });
                }, i * 120);
            }
            break;

        // 🟣 LASER (heavy shot)
        case "laser":
            enemyBullets.push({
                x: centerX - 6,
                y: y,
                w: 12,
                h: 40,
                dy: 14
            });
            break;
    }
}

async function giveBossReward(){
    let baseReward = 200 + (level * 50);
    let reward = Math.floor(baseReward * 1.2);
    await addCoins(reward);  // ✅ Now valid
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
   coins += amount;
   pendingRewardAction = 'doubleBoss';
   showRewardAd().catch(err => {
       console.log("Ad failed:", err);
       pendingRewardAction = null;
   });
}

function closeBossReward(){
    const popup = document.getElementById("bossRewardPopup");
    if(popup) popup.remove();
}

async function loadCoins() {
    // Try native plugin first
    if (window.FirebaseFirestore) {
        try {
            const { snapshot } = await window.FirebaseFirestore.getDocument({
                reference: `players/${playerId}`,
            });
            coins = snapshot?.data?.coins || 0;
            updateHUD();
            return;
        } catch (e) {
            console.warn("Native Firebase failed, falling back", e);
        }
    }
    
    // Fallback to localStorage
    coins = parseInt(localStorage.getItem("coins") || "0");
    updateHUD();
}

async function addCoins(amount) {
    const newAmount = coins + amount;
    
    // Try native plugin first
    if (window.FirebaseFirestore) {
        try {
            await window.FirebaseFirestore.setDocument({
                reference: `players/${playerId}`,
                data: { coins: newAmount },
                merge: true,
            });
        } catch (e) {
            console.warn("Native Firebase failed", e);
            localStorage.setItem("coins", newAmount);
        }
    } else {
        // No plugin, use localStorage
        localStorage.setItem("coins", newAmount);
    }
    
    coins = newAmount;
    updateHUD();
}

async function setCoins(amount) {
    if (window.FirebaseFirestore) {
        try {
            await window.FirebaseFirestore.setDocument({
                reference: `players/${playerId}`,
                data: { coins: amount },
                merge: true,
            });
            return;
        } catch (e) {
            console.warn("Native Firebase save failed", e);
        }
    }
    
    // Fallback to localStorage
    localStorage.setItem("coins", amount);
}

/* ---------- MAIN GAME LOOP ---------- */

function gameLoop(currentTime) {
    if (!gameRunning) return;
    
    if (paused) {
        window.gameLoopId = requestAnimationFrame(gameLoop);
        return;
    }
    
    if (gameState !== "playing") {
        window.gameLoopId = requestAnimationFrame(gameLoop);
        return;
    }

    if (currentTime % 1000 < 20) { // log once per second
        console.log("Canvas:", canvas.width, "x", canvas.height, 
                    "Player:", player.x, player.y,
                    "Stars:", stars.length,
                    "Enemies:", enemies.length);
    }

    const deltaTime = currentTime - lastTime;
    if (deltaTime < frameInterval) {
        window.gameLoopId = requestAnimationFrame(gameLoop);
        return;
    }

    lastTime = currentTime;

    // CLEAR SCREEN
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;  // ✅ RESET ALPHA
    ctx.shadowBlur = 0;     // ✅ RESET SHADOW
    ctx.shadowColor = "transparent";
    

    // DRAW BACKGROUND
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#0a0a1a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // UPDATE & DRAW EVERYTHING
    updateSpawning(currentTime);
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateEnemyBullets();
    updateExplosions();
    updateCoinFX();
    updatePowerups();
    updateBoss();
    updateTimers();

    drawStars();
    drawEnemies();
    drawPlayer();

    if (hitFlash > 0) {
        ctx.fillStyle = `rgba(255,0,0,${hitFlash * 0.1})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        hitFlash--;
    }

        // DEBUG - log once per second
    if (Math.floor(currentTime / 1000) !== Math.floor((currentTime - deltaTime) / 1000)) {
        console.log("=== FRAME DEBUG ===");
        console.log("Canvas:", canvas.width, "x", canvas.height);
        console.log("Player:", "x=" + player.x, "y=" + player.y, "img.complete=" + playerImg.complete, "naturalWidth=" + playerImg.naturalWidth);
        console.log("Enemies count:", enemies.length);
        if (enemies.length > 0) {
            console.log("First enemy:", "x=" + enemies[0].x, "y=" + enemies[0].y, "img.complete=" + enemyImg.complete, "naturalWidth=" + enemyImg.naturalWidth);
        }
        console.log("Stars:", stars.length);
        console.log("Bullets:", bullets.length);
        console.log("gameRunning:", gameRunning, "paused:", paused, "gameState:", gameState);
    }

    window.gameLoopId = requestAnimationFrame(gameLoop);
}

function resetToMenu() {
    console.log("Resetting to menu");

    gameState = "menu";

    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("main-menu").style.display = "flex";
}

/* ---------- PLAYER ---------- */

function updatePlayer(){
    if(moveLeft) player.x -= player.speed;
    if(moveRight) player.x += player.speed;
    if(moveUp) player.y -= player.speed;
    if(moveDown) player.y += player.speed;

    if(touchX !== null){
        player.x += (touchX - player.x - player.width/2) * 0.15;
        player.y += (touchY - player.y - player.height/2) * 0.15;
    }
    
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function drawPlayer(){
    ctx.save();  // ✅ SAVE STATE
    
    // EMERGENCY: Always draw a visible fallback first
    ctx.fillStyle = "#00ff00";  // Bright green - impossible to miss
    ctx.globalAlpha = 1.0;  // Ensure full opacity
    ctx.shadowBlur = 0;  // Clear any shadows
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Then try the image on top
    if(playerImg.complete && playerImg.naturalWidth > 0) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
        // fallback triangle
        ctx.fillStyle = "cyan";
        ctx.beginPath();
        ctx.moveTo(player.x + player.width/2, player.y);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.closePath();
        ctx.fill();
    }

    // Engine flame
    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x + player.width/2 - 3, player.y + player.height, 6, 10);

    // Shield
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
    
    ctx.restore();  // ✅ RESTORE STATE
}

function drawEnemies(){
    ctx.save();  // ✅ SAVE STATE
    ctx.globalAlpha = 1.0;  // Ensure full opacity
    ctx.shadowBlur = 0;  // Clear any shadows
    
    enemies.forEach(e => {
        // EMERGENCY: Always draw visible fallback
        ctx.fillStyle = "#ff0000";  // Bright red
        ctx.fillRect(e.x, e.y, e.w, e.h);
        
        let img = enemyImg;
        if(e.type === ENEMY_FAST) img = enemyFastImg;
        if(e.type === ENEMY_TANK) img = enemyTankImg;
        if(e.type === ENEMY_SHOOTER) img = enemyShooterImg;

        if(img.complete && img.naturalWidth > 0){
            ctx.drawImage(img, e.x, e.y, e.w, e.h);
        } else {
            ctx.fillStyle =
                e.type === ENEMY_FAST ? "#ff4444" :
                e.type === ENEMY_TANK ? "#ff8800" : "#ff0000";
            ctx.fillRect(e.x, e.y, e.w, e.h);
        }
    });
    
    ctx.restore();  // ✅ RESTORE STATE
}

/* ---------- BULLETS ---------- */

function updateBullets(){
    if (DEBUG) console.log("Bullets:", bullets.length);
    for(let i = bullets.length - 1; i >= 0; i--){
        let b = bullets[i];
        
        b.y += (b.dy !== undefined ? b.dy : -8);
        if(b.dx) b.x += b.dx;
        
        ctx.save();
        ctx.shadowBlur = 10;
       
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
                    
                    addCoins(reward).then(() => {
                    });
                    combo++;
                    comboTimer = 60;
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

async function bossDefeated(){
    boss = null;
    document.getElementById("bossBar").style.display = "none";
    let bossReward = 150;

    await addCoins(bossReward);
    
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
        let size = 20 + ex.frame * 4;
        ctx.save();
        ctx.globalAlpha = 1 - (ex.frame / ex.maxFrame);
        
        if(explosionImg.complete && explosionImg.naturalWidth > 0) {
            ctx.drawImage(explosionImg, ex.x - size/2, ex.y - size/2, size, size);
        } else {
            ctx.fillStyle = `rgba(255, 165, 0, ${1 - ex.frame / ex.maxFrame})`;
            ctx.beginPath();
            ctx.arc(ex.x, ex.y, size/2, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
        ex.frame++;
        if(ex.frame > ex.maxFrame) explosions.splice(i, 1);
    }
}

function updateBoss(){
    if(!boss) return;

    if(boss.y < 120){
        boss.y += boss.speed + 1;
        return;
    }

    // Side-to-side movement
    boss.x += boss.vx;

    if(boss.x <= 0 || boss.x + boss.w >= canvas.width){
        boss.vx *= -1; // bounce
    }

    boss.attackCooldown--;

    if(boss.attackCooldown <= 0){
        bossAttack();
        boss.attackCooldown = boss.attackRate;
    }

    /* ---------- DRAW ---------- */

    ctx.drawImage(bossImg, boss.x, boss.y, boss.w, boss.h);
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

function initStars() {
    stars = [];
    if (!canvas || canvas.width === 0) return;
    
    for(let i=0; i<80; i++){
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            s: Math.random()*3+1
        });
    }
    console.log("Stars initialized:", stars.length);
}

function updateCoinFX(){
    for(let i = coinFX.length - 1; i >= 0; i--){
        let ex = coinFX[i];
        let size = 20 + ex.frame * 4;
        ctx.save();
        ctx.globalAlpha = 1 - (ex.frame / ex.maxFrame);
        
        if(coinImg.complete && coinImg.naturalWidth > 0) {
            ctx.drawImage(coinImg, ex.x - size/2, ex.y - size/2, size, size);
        } else {
            ctx.fillStyle = `rgba(255, 165, 0, ${1 - ex.frame / ex.maxFrame})`;
            ctx.beginPath();
            ctx.arc(ex.x, ex.y, size/2, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
        ex.frame++;
        if(ex.frame > ex.maxFrame) coinFX.splice(i, 1);
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
        b.y += b.dy || 10;
        if(b.dx) b.x += b.dx;

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

            // ❤  HEALTH DAMAGE (with cooldown)
            if(playerHitCooldown <= 0){
                health--;

                hitFlash = 10;
                screenShake = 6;

                updateHeartsUI();
                updateHUD();

                console.log("PLAYER HIT! Health:", health);

                if (health <= 0) {
                   console.log("Health depleted, checking revive...");
                   
                   if (!gameRunning) return;
                   
                   gameRunning = false;
                   
                   if (reviveUsed) {
                      console.log("Revive already used, game over");
                      gameState = "gameover";
                      gameOver();
                      return;
                   }
                   
                   console.log("Showing revive screen");
                   gameState = "gameover";
                   showReviveScreen();
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
    for(let i = powerups.length - 1; i >= 0; i--){
        let p = powerups[i];
        p.y += 2;
        
        let img = healthImg;
        let fallbackColor = "#00ff00"; // Green for health
        let label = "+";
        
        if(p.type === 1) {
            img = rapidImg;
            fallbackColor = "#ff6600"; // Orange for rapid fire
            label = "⚡";
        }
        if(p.type === 2) {
            img = shieldImg;
            fallbackColor = "#00ccff"; // Cyan for shield
            label = "🛡";
        }
        
        if(img.complete && img.naturalWidth > 0){
            ctx.drawImage(img, p.x, p.y, 32, 32);
        } else {
            ctx.fillStyle = fallbackColor;
            ctx.beginPath();
            ctx.arc(p.x + 16, p.y + 16, 16, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = "white";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(label, p.x + 16, p.y + 16);
        }
        
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
                shieldTimer = 300 + (shieldLevel * 150);
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

async function saveGame() {
    await setCoins(coins);
    const data = {
        weaponLevel,
        currentSkin,
        unlockedSkins,
        dailyData
    };

    localStorage.setItem("nebulaSave", JSON.stringify(data));
}

async function loadGame() {
    const save = localStorage.getItem("nebulaSave");
    if (!save) return;

    const data = JSON.parse(save);

    await loadCoins();
   
    weaponLevel = data.weaponLevel || 1;
    currentSkin = data.currentSkin || 0;
    unlockedSkins = data.unlockedSkins || [0];
    dailyData = data.dailyData || dailyData;

    updateSkin();
}

/* ---------- SHOP FUNCTIONS ---------- */

let unlockedSkins = [0];

function selectSkin(id){

    if(!unlockedSkins.includes(id)){
        console.log("Skin not unlocked:", id);
        return;
    }

    currentSkin = id;
    updateSkin();
    saveGame();

    // 🔥 RESET ALL BUTTONS
    document.querySelectorAll('.skinBtn').forEach(btn => {
        btn.style.borderColor = '#444';
        btn.style.boxShadow = 'none';

        const badge = btn.querySelector('.equippedBadge');
        if(badge) badge.remove();
    });

    // ✅ TARGET CORRECT BUTTON
    const skinBtn = document.getElementById('skin' + id);

    if(!skinBtn){
        console.error("Skin button NOT FOUND:", 'skin' + id);
        return;
    }

    // 🟢 APPLY GREEN BORDER
    skinBtn.style.borderColor = "#00ff88";
    skinBtn.style.boxShadow = "0 0 15px #00ff88";

    // 🏷️ ADD EQUIPPED BADGE
    const badge = document.createElement("div");
    badge.className = "equippedBadge";
    badge.innerText = "EQUIPPED";

    badge.style.position = "absolute";
    badge.style.bottom = "5px";
    badge.style.left = "50%";
    badge.style.transform = "translateX(-50%)";
    badge.style.background = "#00ff88";
    badge.style.color = "black";
    badge.style.fontSize = "12px";
    badge.style.padding = "3px 8px";
    badge.style.borderRadius = "6px";
    badge.style.fontWeight = "bold";

    skinBtn.appendChild(badge);

    console.log("Equipped skin:", id);
}

async function tryBuySkin(id, price){
    if(unlockedSkins.includes(id)){
        selectSkin(id);
        return;
    }

    if(coins < price){
        showCoinWarning("Not enough coins!");
        return;
    }

    await addCoins(-price);
    showCoinSpend(price);

    // Unlock
    unlockedSkins.push(id);

    // ✅ FORCE UI UPDATE FIRST
    updateHUD();
    updateShopCoins();
    saveGame();

    // ✅ UPDATE BUTTON UI
    const skinBtn = document.getElementById('skin' + id);

    if(skinBtn){

        // Remove lock
        skinBtn.classList.remove('locked');
        skinBtn.classList.add('unlocked');

        // Remove lock icon
        const lockIcon = skinBtn.querySelector('.lockIcon');
        if(lockIcon) lockIcon.remove();

        // Change text
        const priceLabel = skinBtn.querySelector('.skinPrice');
        if(priceLabel){
            priceLabel.textContent = "OWNED";
            priceLabel.style.color = "#00ff88";
        }

        // 🔥 Small pop effect
        skinBtn.style.transform = "scale(1.1)";
        setTimeout(() => skinBtn.style.transform = "scale(1)", 200);
    }

    // ✅ VERY IMPORTANT → EQUIP AFTER UI UPDATE
    setTimeout(() => {
        selectSkin(id);
    }, 50);

    console.log("Skin unlocked:", id);
}

function updateShopCoins(){
    const coinText = document.getElementById('shopCoinText');
    if(coinText) coinText.textContent = coins;
}

function updateShopUI(){
    unlockedSkins.forEach(id => {

        const btn = document.getElementById('skin' + id);

        if(btn){
            btn.classList.remove('locked');
            btn.classList.add('unlocked');

            const lockIcon = btn.querySelector('.lockIcon');
            if(lockIcon) lockIcon.remove();

            const priceLabel = btn.querySelector('.skinPrice');
            if(priceLabel){
                priceLabel.textContent = 'OWNED';
                priceLabel.style.color = '#00ff88';
            }
        }
    });
}

function openShop(){
    const shop = document.getElementById("shop");
    const menu = document.getElementById("main-menu");

    menu.classList.remove("show");
    menu.style.display = "none";

    shop.style.display = "flex";

    // ✅ ADD THIS
    updateShopUI();
    updateShopCoins();
}

function closeShop(){
    const shop = document.getElementById("shop");
    const menu = document.getElementById("main-menu");

    shop.style.display = "none";

    menu.style.display = "flex";
    setTimeout(() => {
        menu.classList.add("show");
    }, 10);
}

async function buyShield(){

    const shieldCost = 50;

    const maxShieldLevel = 5;

    if (shieldLevel >= maxShieldLevel) {
        showCoinWarning("Shield is max level!");
        return;
    }

    if (coins < shieldCost) {
        showCoinWarning("Not enough coins!");
        return;
    }

    // ✅ Deduct coins
    await addCoins(-shieldCost);
    showCoinSpend(shieldCost);
    shieldLevel++;
    shieldActive = true;

    shieldTimer = Math.max(shieldTimer, 300 + (shieldLevel * 150));

    hitFlash = 3;
    screenShake = 4;

    updateHUD();
    updateShopCoins();

    saveGame();

    coinPulse();
    showCoinGain(0);
    console.log("Shield upgraded:", shieldLevel);
}

async function buyWeapon() {

    const weaponCost = 150 * weaponLevel;

    if (weaponLevel >= 5) {
        showCoinWarning("Weapon is max level!");
        return;
    }

    if (coins >= weaponCost) {

        await addCoins(-weaponCost);
        showCoinSpend(weaponCost);
        weaponLevel++;

        // ✅ Correct damage system
        damage += 1;

        // ✅ Faster shooting (lower = faster)
        fireRate = Math.max(80, fireRate - 40);

        updateHUD();
        saveGame();
        coinPulse();

        showCoinGain(0); // optional effect only

        console.log("Weapon upgraded:", weaponLevel);

    } else {
        showCoinWarning("Not enough coins!");
    }
}

async function buyCoins(amount) {

    if (typeof amount !== "number" || amount <= 0) {
        console.warn("Invalid coin amount:", amount);
        showCoinWarning("Invalid amount");
        return;
    }

    coins += amount;

    await setCoins(coins);

    const shopText = document.getElementById("shopCoinText");
    if (shopText) {
        shopText.innerText = coins;
    }

    updateHUD();
    coinPulse();
    showCoinGain(amount);
}

function watchAdReward(){

    if (!admobReady) {
        showCoinWarning("Ads not ready yet!");
        return;
    }

    pendingRewardAction = 'freeCoins';
    showRewardAd();
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

function showCoinSpend(amount){
    const popup = document.createElement("div");
    popup.innerText = "-" + amount + " 🪙";

    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.color = "#ff4444"; // red for spending
    popup.style.fontSize = "26px";
    popup.style.fontWeight = "bold";
    popup.style.zIndex = "9999";
    popup.style.pointerEvents = "none";

    popup.style.transition = "all 0.6s ease";

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.style.transform = "translate(-50%, -80%) scale(1.2)";
        popup.style.opacity = "0";
    }, 50);

    setTimeout(() => popup.remove(), 700);
}

function showCoinWarning(message = "Something went wrong"){
    const warn = document.getElementById("coinWarning");
    if(!warn) return;

    warn.innerText = message; // 🔥 dynamic message
    warn.classList.add("show");

    setTimeout(() => {
        warn.classList.remove("show");
    }, 1200);
}


let dailyData = {
    lastLogin: null,
    streak: 0
};

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
    rewardAmount = baseReward;
    pendingRewardAction = 'doubleLevel';
    showRewardAd().catch(err => {
        console.log("Ad failed:", err);
        pendingRewardAction = null;
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
    console.log("=== GAME OVER ===");

    gameState = "gameover";
    gameRunning = false;

    // Stop loop completely
    if (window.gameLoopId) {
        cancelAnimationFrame(window.gameLoopId);
    }

    // Show UI
    const screen = document.getElementById("gameOverScreen");
    if (screen) {
        screen.style.display = "flex";
        screen.style.opacity = "0";
        
        setTimeout(() => {
            screen.style.transition = "opacity 0.3s ease";
            screen.style.opacity = "1";
        }, 10);
    }
}

function restartGame(){
    document.getElementById("gameOverScreen").style.display = "none";
    
    health = maxHearts;
    level = 1;
    score = 0;
    reviveUsed = false;
    enemies = [];
    enemyBullets = [];
    bullets = [];
    powerups = [];
    boss = null;
    waveInProgress = false;
    autoShootTimeout = null;
    
    startGame();
}

function backToMenu(){
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("gameCanvas").style.display = "none";
    document.getElementById("main-menu").style.display = "flex";
}

/* ---------- FIREBASE CONFIG ---------- */
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "nebula-strike-2c357.firebaseapp.com",
    projectId: "nebula-strike-2c357",
    storageBucket: "nebula-strike-2c357.firebasestorage.app",
    messagingSenderId: "656562876567",
    appId: "1:656562876567:android:38aef3fff6b0dff2abb9d2"
};

/* ---------- INITIALIZATION ---------- */

window.addEventListener("load", async () => {
    console.log("Window loaded, initializing...");

   const isAndroidNative = typeof Capacitor !== 'undefined' && Capacitor.getPlatform() === 'android';

    if (isAndroidNative) {
        console.log("Using native Android Firebase");
        // Android: Firebase initialized natively via Capacitor plugin
    } else {
        console.log("Using web Firebase with App Check");
        // Web: Initialize Firebase with CDN
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            firebase.appCheck().activate('YOUR_RECAPTCHA_SITE_KEY', true);
        } else {
            console.warn("Firebase SDK not loaded");
        }
    }

    detectTamper();
   
    await loadCoins();

    await loadGame();
    loadDailyData();
    setTimeout(() => {
        if(document.querySelectorAll('.skinBtn').length){
            selectSkin(currentSkin);
        }
    }, 100);
   
    resizeGame();

    checkDailyReward();

    const splash = document.getElementById("splashScreen");
    const menu = document.getElementById("main-menu");
    const canvas = document.getElementById("gameCanvas");
    const hud = document.getElementById("hud");

    // Hide game at start
    if(canvas){
        canvas.style.display = "none";
        canvas.style.pointerEvents = "auto"; // 🔥 IMPORTANT FIX
    }

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

    /* ---------- START HANDLER ---------- */

    const handleStart = (e) => {
        if (started) return;
        started = true;
    
        clearTimeout(fallbackTimer);  // Stop the fallback
    
        if (e && e.preventDefault) e.preventDefault();
    
        console.log("User tapped → unlocking audio and starting");
       
       if(audioContext && audioContext.state === "suspended"){
          audioContext.resume();
       }
       unlockAudio();
       
       if(soundOn && menuMusic){
          menuMusic.currentTime = 0;
          menuMusic.play().catch(()=>{});
       }
       
       tapOverlay.remove();
       
       if(splash){
          splash.style.opacity = "0";
          splash.style.pointerEvents = "none";
          setTimeout(() => splash.style.display = "none", 500);
       }
       
       if(menu){
          menu.style.display = "flex";
          menu.style.visibility = "visible";
          menu.style.opacity = "1";
          menu.classList.add("show");
       }
       
       console.log("Tap handler complete - menu shown, waiting for player to click START");
    };

    // Click + touch support
    ["click", "touchstart"].forEach(evt => {
        tapOverlay.addEventListener(evt, handleStart, { once: true, passive: false });
    });

    /* ---------- FALLBACK ---------- */

    let fallbackTriggered = false;

    const fallbackTimer = setTimeout(() => {
        if (started || fallbackTriggered) return;  // Don't run if already started
        fallbackTriggered = true;
    
        console.log("Fallback timer running...");
    
        const splash = document.getElementById("splashScreen");
        const menu = document.getElementById("main-menu");

        if (splash) {
            splash.style.opacity = "0";
            splash.style.pointerEvents = "none";
            setTimeout(() => {
                if (splash) splash.style.display = "none";
            }, 500);
        }
    
        if (menu) {
            menu.style.display = "flex";
            menu.style.visibility = "visible";
            menu.style.opacity = "1";
            menu.classList.add("show");
        }

        loadBannerAd();

    }, 1500);

    console.log("Initialization complete - waiting for tap");
});
