/* =============================================================
   NEBULA STRIKE  — Version: 1.0.0
   ============================================================= */

// ─── LOGGING ──────────────────────────────────────────────────
if (!window.location.href.includes("localhost")) {
    console.log = () => {};
}
console.log("=== NEBULA STRIKE LOADED ===");

// ─── ADMOB ────────────────────────────────────────────────────
let AdMob = window.AdMob || null;
let admobReady = false;
let pendingRewardAction = null;
let rewardAmount = 0;

const AD_IDS = {
    banner:   'ca-app-pub-5850163781981893/7518088125',
    rewarded: 'ca-app-pub-5850163781981893/3862181045'
};

async function initAds() {
    if (!AdMob) { console.log("AdMob: browser mode"); return; }
    try {
        await AdMob.initialize();
        admobReady = true;
        console.log("AdMob initialized ✅");
    } catch (err) {
        console.log("AdMob init error:", err);
    }
}
initAds();

async function loadBannerAd() {
    if (noAds) {
        console.log("No Ads active — skipping banner");
        return;
    }
    if (!AdMob) return;
    try {
        await AdMob.showBanner({ adId: AD_IDS.banner, position: 'bottom', margin: 0 });
    } catch (err) { console.log("Banner ad failed:", err); }
}

function hideBannerAd() {
    if (!AdMob) return;
    try { AdMob.hideBanner(); } catch (err) { console.log("Hide banner failed:", err); }
}

async function showRewardAd() {
    if (noAds) {
        console.log("No Ads active — granting reward instantly");
        setTimeout(() => {
            handleReward(true);
            window.showingRewardAd = false;
        }, 300);
        return;
    }
    if (window.showingRewardAd) return;
    window.showingRewardAd = true;

    // Browser / test mode
    if (!AdMob) {
        setTimeout(() => { handleReward(true); window.showingRewardAd = false; }, 1000);
        return;
    }

    if (!admobReady) {
        window.showingRewardAd = false;
        fallbackRevive();
        return;
    }

    try {
        await AdMob.prepareRewardVideoAd({ adId: AD_IDS.rewarded });
        await AdMob.showRewardVideoAd();
        window.showingRewardAd = false;
    } catch (err) {
        console.log("Ad failed:", err);
        pendingRewardAction = null;
        gameState = "gameover";
        window.showingRewardAd = false;
        const btn = document.getElementById("reviveBtn");
        if (btn) { btn.disabled = false; btn.style.opacity = "1"; btn.innerText = "▶ Watch Ad to Continue"; }
        fallbackRevive();
    }
}

// AdMob listeners
if (AdMob) {
    let rewardHandled = false;

    AdMob.addListener('onRewardedVideoAdReward', () => {
        if (rewardHandled) return;
        rewardHandled = true;
        handleReward(true);
        setTimeout(() => { rewardHandled = false; }, 1000);
    });

    AdMob.addListener('onRewardedVideoAdClosed', () => {
        window.showingRewardAd = false;
        if (pendingRewardAction === 'revive') {
            gameState = "gameover";
            pendingRewardAction = null;
            const btn = document.getElementById("reviveBtn");
            if (btn) { btn.disabled = false; btn.style.opacity = "1"; btn.innerText = "▶ Watch Ad to Continue"; }
        }
    });
}

// ─── REWARD HANDLER ───────────────────────────────────────────
function handleReward(success) {
    if (!success) {
        const btn = document.getElementById("reviveBtn");
        if (btn && pendingRewardAction === 'revive') {
            btn.disabled = false; btn.style.opacity = "1"; btn.innerText = "▶ Watch Ad to Continue";
        }
        pendingRewardAction = null;
        gameState = "gameover";
        return;
    }

    const action = pendingRewardAction;
    pendingRewardAction = null;

    switch (action) {
        case 'revive':
            if (reviveUsed) return;
            health = Math.ceil(maxHearts * 0.5);
            updateHeartsUI();
            hideReviveScreen();
            gameRunning = true;
            reviveUsed = true;
            gameState = "playing";
            paused = false;
            hitFlash = 0; screenShake = 0; lastTime = 0;
            if (window.gameLoopId) cancelAnimationFrame(window.gameLoopId);
            window.gameLoopId = requestAnimationFrame(gameLoop);
            break;

        case 'freeCoins':
            coins += 100;
            updateHUD(); coinPulse(); showCoinGain(100);
            break;

        case 'doubleLevel':
            coins += rewardAmount;
            updateHUD(); coinPulse(); showCoinGain(rewardAmount);
            break;

        case 'doubleBoss':
            coins += rewardAmount;
            updateHUD(); coinPulse(); showCoinGain(rewardAmount);
            const popup = document.getElementById("bossRewardPopup");
            if (popup) popup.remove();
            setTimeout(() => levelComplete(), 300);
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
    health = Math.ceil(maxHearts * 0.5);
    updateHeartsUI();
    hideReviveScreen();
    gameRunning = true;
    reviveUsed = true;
    hitFlash = 0; screenShake = 0; lastTime = 0;
    requestAnimationFrame(gameLoop);
}

// ─── IMAGES ───────────────────────────────────────────────────
const playerImg     = new Image(); playerImg.src     = "assets/player.png";
const enemyImg      = new Image(); enemyImg.src      = "assets/enemy.png";
const enemyFastImg  = new Image(); enemyFastImg.src  = "assets/enemies/enemy-fast.png";
const enemyTankImg  = new Image(); enemyTankImg.src  = "assets/enemies/enemy-tank.png";
const enemyShooterImg = new Image(); enemyShooterImg.src = "assets/enemies/enemy-shooter.png";
const bossImg       = new Image(); bossImg.src       = "assets/boss.png";
const bgImg         = new Image(); bgImg.src         = "assets/background.png";
const explosionImg  = new Image(); explosionImg.src  = "assets/effects/explosion.png";
const coinImg       = new Image(); coinImg.src       = "assets/ui/coin-icon.png";
const healthImg     = new Image(); healthImg.src     = "assets/ui/health.png";
const rapidImg      = new Image(); rapidImg.src      = "assets/ui/rapid.png";
const shieldImg     = new Image(); shieldImg.src     = "assets/ui/shield.png";

const imagesToLoad = [
    { img: playerImg, name: "player" }, { img: enemyImg, name: "enemy" },
    { img: enemyFastImg, name: "enemyFast" }, { img: enemyTankImg, name: "enemyTank" },
    { img: enemyShooterImg, name: "enemyShooter" }, { img: bossImg, name: "boss" },
    { img: bgImg, name: "background" }, { img: explosionImg, name: "explosion" },
    { img: coinImg, name: "coin" }, { img: healthImg, name: "health" },
    { img: rapidImg, name: "rapid" }, { img: shieldImg, name: "shield" }
];

let loadedCount = 0, imagesLoaded = false, failedImages = [];

function onImageLoad(imgObj) {
    const ok = imgObj.img.complete && imgObj.img.naturalWidth > 0;
    if (ok) { loadedCount++; }
    else { failedImages.push(imgObj); }

    if (loadedCount + failedImages.length >= imagesToLoad.length) {
        failedImages.length === 0 ? (imagesLoaded = true) : retryFailedImages();
    }
}

function retryFailedImages() {
    const toRetry = [...failedImages];
    failedImages = [];
    if (!toRetry.length) { imagesLoaded = true; return; }

    let done = 0;
    toRetry.forEach(imgObj => {
        const retry = new Image();
        retry.src = imgObj.img.src + "?retry=" + Date.now();
        retry.addEventListener('load', () => { imgObj.img.src = retry.src; loadedCount++; if (++done >= toRetry.length) imagesLoaded = true; });
        retry.addEventListener('error', () => { if (++done >= toRetry.length) imagesLoaded = true; });
    });
}

imagesToLoad.forEach(imgObj => {
    imgObj.img.addEventListener('load',  () => onImageLoad(imgObj));
    imgObj.img.addEventListener('error', () => onImageLoad(imgObj));
    if (imgObj.img.complete) onImageLoad(imgObj);
});

// ─── SKINS ────────────────────────────────────────────────────
let currentSkin = 0;
const skins = [
    "assets/player.png",
    "assets/skins/skin1.png",
    "assets/skins/skin2.png",
    "assets/skins/skin3.png",
    "assets/skins/skin4.png",
];
function updateSkin() { playerImg.src = skins[currentSkin]; }
updateSkin();

// ─── ENEMY TYPES ──────────────────────────────────────────────
const ENEMY_NORMAL  = 0;
const ENEMY_FAST    = 1;
const ENEMY_TANK    = 2;
const ENEMY_SHOOTER = 3;

// ─── CANVAS ───────────────────────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

document.getElementById("pauseBtn").onclick = () => { if (gameRunning) togglePause(); };

// ─── PLAYER ───────────────────────────────────────────────────
const player = { x: 0, y: 0, width: 60, height: 60, speed: 6 };

let playerId = localStorage.getItem("playerId");
if (!playerId) {
    playerId = "player_" + Math.random().toString(36).substring(2);
    localStorage.setItem("playerId", playerId);
}

// ─── GAME STATE ───────────────────────────────────────────────
let gameRunning = false, paused = false, gameState = "menu";
let level = 1, health, maxHearts = 5;
let score = 0, coins = 0, totalKills = 0;
let combo = 0, comboTimer = 0;
let reviveUsed = false;

let weaponLevel = 1, shieldLevel = 0, damage = 1;
let fireRate = 300, lastShot = 0;
let rapidFire = false, rapidTimer = 0;
let shieldActive = false, shieldTimer = 0;
let soundOn = true, sfxVolume = 1;
let highestLevel = 1;

let bullets = [], enemies = [], enemyBullets = [], powerups = [];
let boss = null, bossMaxHP = 0;
let coinFX = [], explosions = [];

let waveInProgress = false, waveNumber = 0, enemiesInWave = 0;
let waveSpawnTimer = 0, isTroopFormation = false;
let lastWaveTime = 0, lastEnemySpawnTime = 0;

let hitFlash = 0, screenShake = 0;
let playerHitCooldown = 0;
let lastTime = 0;
const targetFPS = 60, frameInterval = 1000 / targetFPS;

let playerPerformance = { shotsFired: 0, shotsHit: 0, damageTaken: 0 };

let stars = [];
for (let i = 0; i < 80; i++) {
    stars.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, s: Math.random() * 3 + 1 });
}

let dailyData = { lastLogin: null, streak: 0 };
let unlockedSkins = [0];
let started = false;
let noAds = false;

// ─── SECURITY ─────────────────────────────────────────────────
function detectTamper() {
    const allowed = ["chinabel.github.io", "localhost"];
    const isAndroid = typeof Capacitor !== 'undefined' && Capacitor.getPlatform() === 'android';
    if (isAndroid) return;
    if (!allowed.some(d => window.location.hostname.includes(d))) {
        document.body.innerHTML = "<h1>Unauthorized Copy</h1>";
        throw new Error("Tampering detected");
    }
}
detectTamper();

// ─── RESIZE ───────────────────────────────────────────────────
function resizeGame() {
    if (!canvas) return;
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = w; canvas.height = h;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";

    if (stars.length === 0 || stars[0].x > w) initStars();

    if (typeof player.x === 'number') {
        player.x = Math.min(Math.max(player.x, 0), canvas.width - player.width);
        player.y = Math.min(Math.max(player.y, 0), canvas.height - player.height);
    }
    if (player.x === 0 && player.y === 0 && canvas.width > 0) {
        player.x = canvas.width / 2;
        player.y = canvas.height - 120;
    }
}
window.addEventListener("resize",          () => setTimeout(resizeGame, 100));
window.addEventListener("orientationchange", () => setTimeout(resizeGame, 300));

// ─── TOUCH ────────────────────────────────────────────────────
let touchX = null, touchY = null;
canvas.addEventListener("touchstart", e => { e.preventDefault(); touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: false });
canvas.addEventListener("touchmove",  e => { e.preventDefault(); touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: false });
canvas.addEventListener("touchend",   () => { touchX = null; touchY = null; });

// ─── KEYBOARD ─────────────────────────────────────────────────
let moveLeft = false, moveRight = false, moveUp = false, moveDown = false;
window.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft")  moveLeft  = true;
    if (e.key === "ArrowRight") moveRight = true;
    if (e.key === "ArrowUp")    moveUp    = true;
    if (e.key === "ArrowDown")  moveDown  = true;
    if (e.key === "p" || e.key === "P") togglePause();
});
window.addEventListener("keyup", e => {
    if (e.key === "ArrowLeft")  moveLeft  = false;
    if (e.key === "ArrowRight") moveRight = false;
    if (e.key === "ArrowUp")    moveUp    = false;
    if (e.key === "ArrowDown")  moveDown  = false;
});

// ─── AUDIO ────────────────────────────────────────────────────
const shootSound    = new Audio("assets/sounds/shoot.wav");
const explosionSound = new Audio("assets/sounds/explosion.wav");
const powerupSound  = new Audio("assets/sounds/powerup.wav");
let menuMusic = new Audio("assets/sounds/menu.mp3");
let gameMusic = new Audio("assets/sounds/music.mp3");
menuMusic.loop = gameMusic.loop = true;
menuMusic.volume = gameMusic.volume = 0.7;

let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioUnlocked = false;

function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    if (audioContext.state === "suspended") {
        audioContext.resume().then(() => playMenuMusic()).catch(() => {});
    } else {
        playMenuMusic();
    }
}
function playMenuMusic() {
    if (soundOn && menuMusic.paused) { menuMusic.currentTime = 0; menuMusic.play().catch(() => {}); }
}

function setupAudioUnlock() {
    ['click','touchstart','touchend','keydown'].forEach(evt =>
        document.addEventListener(evt, unlockAudio, { once: true, passive: true })
    );
}

// ─── BUTTON CLICK SOUND ───────────────────────────────────────
function playClickSound() {
    if (!soundOn || !audioContext) return;
    if (audioContext.state === 'suspended') audioContext.resume();

    const osc   = audioContext.createOscillator();
    const gain  = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15 * sfxVolume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);

    osc.start();
    osc.stop(audioContext.currentTime + 0.05);
}

function attachButtonSounds() {
    const selectors = [
        'button', '.menu-btn', '.pauseBtn', '.settingsBtn',
        '.claimBtn', '.doubleRewardBtn', '.shopBtn', '.skinBtn',
        '.coinCard', '.rewardBtn', '.next-level-btn', '.double-reward-btn'
    ];
    document.querySelectorAll(selectors.join(', ')).forEach(btn => {
        if (btn.dataset.clickSound) return;
        btn.dataset.clickSound = 'true';
        // pointerdown = instant on touch & mouse
        btn.addEventListener('pointerdown', playClickSound);
    });
}

window.addEventListener('load', () => {
    setupAudioUnlock();
    document.addEventListener('click',      () => { if (!audioUnlocked) unlockAudio(); }, { once: true });
    document.addEventListener('touchstart', () => { if (!audioUnlocked) unlockAudio(); }, { once: true });
});

// ─── REVIVE UI ────────────────────────────────────────────────
const reviveScreen = document.getElementById("reviveScreen");

document.getElementById("reviveBtn").addEventListener("click", () => {
    if (pendingRewardAction === 'revive' || gameState === "reviving") return;
    if (gameState !== "gameover") return;

    pendingRewardAction = "revive";
    gameState = "reviving";
    const btn = document.getElementById("reviveBtn");
    if (btn) { btn.disabled = true; btn.style.opacity = "0.5"; btn.innerText = "Loading..."; }
    showRewardAd();
});

function showReviveScreen() {
    const btn = document.getElementById("reviveBtn");
    if (btn) {
        btn.style.display = reviveUsed ? "none" : "block";
        btn.disabled = false; btn.style.opacity = "1"; btn.innerText = "▶ Watch Ad to Continue";
    }
    reviveScreen.style.display = "flex";
    if (admobReady && !reviveUsed) {
        AdMob.prepareRewardVideoAd({ adId: AD_IDS.rewarded }).catch(() => {});
    }
}
function hideReviveScreen() { reviveScreen.style.display = "none"; }

function updateLevelBadge(level) {
    const badge = document.getElementById('levelBadge');
    if (badge) {
        badge.textContent = 'Lv ' + level;
    }
}

// ─── HUD ──────────────────────────────────────────────────────
function updateHUD() {
    const coinText = document.getElementById("coinText");
    if (coinText) { coinText.innerText = coins; coinText.textContent = coins; }

    const shopText = document.getElementById("shopCoinText");
    if (shopText) shopText.innerText = coins;

    const levelText = document.getElementById("levelText");
    if (levelText) levelText.innerText = "Lv " + level;

    updateLevelBadge(level);

    const comboText = document.getElementById("comboText");
    if (comboText) comboText.innerText = combo > 1 ? "x" + combo : "";

    const energyBar  = document.getElementById("energyBar");
    const energyText = document.getElementById("energyText");
    if (energyBar && energyText) {
        const pct = (health / maxHearts) * 100;
        energyBar.style.width = pct + "%";
        energyText.innerText = (health * 480) + " / " + (maxHearts * 480);
    }

    const missionProgress = document.getElementById("missionProgress");
    if (missionProgress) {
        const killed = Math.max(0, (waveNumber - 1) * 6 + (6 - enemiesInWave));
        missionProgress.innerText = killed + " / " + (waveNumber * 6);
    }
}

function coinPulse() {
    const coinBox = document.getElementById("coinBox");
    if (!coinBox) return;
    coinBox.style.cssText += "transition:transform .15s,box-shadow .15s;transform:scale(1.25);box-shadow:0 0 15px gold;";
    setTimeout(() => { coinBox.style.transform = "scale(1)"; coinBox.style.boxShadow = "none"; }, 150);
}

function updateHeartsUI() {
    const pct = (health / maxHearts) * 100;
    const bar = document.getElementById("energyBar");
    const txt = document.getElementById("energyText");
    if (bar) {
        bar.style.width = pct + "%";
        bar.style.background = pct > 60 ? "linear-gradient(90deg,#0066cc,#00ffff)"
            : pct > 30 ? "linear-gradient(90deg,#cc6600,#ffcc00)"
            : "linear-gradient(90deg,#cc0000,#ff4444)";
    }
    if (txt) txt.innerText = (health * 480) + " / " + (maxHearts * 480);
}

// ─── PAUSE ────────────────────────────────────────────────────
function togglePause() {
    if (!gameRunning) return;
    paused = !paused;
    const menu = document.getElementById("pauseMenu");
    if (paused) {
        if (menu) menu.style.display = "flex";
        if (gameMusic) gameMusic.pause();
        if (window.gameLoopId) { cancelAnimationFrame(window.gameLoopId); window.gameLoopId = null; }
    } else {
        if (menu) menu.style.display = "none";
        if (soundOn && gameMusic) gameMusic.play().catch(() => {});
        lastTime = 0;
        if (!window.gameLoopId) window.gameLoopId = requestAnimationFrame(gameLoop);
    }
}
function resumeGame() { if (paused) togglePause(); }

// ─── QUIT ─────────────────────────────────────────────────────
function quitGame() {
    gameRunning = false; paused = false; gameState = "menu";
    if (window.gameLoopId) { cancelAnimationFrame(window.gameLoopId); window.gameLoopId = null; }
    if (autoShootTimeout) { clearTimeout(autoShootTimeout); autoShootTimeout = null; }

    try { saveGame(); } catch (e) {}
    try { gameMusic.pause(); gameMusic.currentTime = 0; menuMusic.currentTime = 0; if (soundOn) menuMusic.play().catch(() => {}); } catch (e) {}

    ["pauseMenu","gameCanvas","hud","bossBar","bossWarning","levelComplete","gameOverScreen","reviveScreen"]
        .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "none"; });

    const mainMenu = document.getElementById("main-menu");
    if (mainMenu) { mainMenu.style.cssText += "display:flex;visibility:visible;opacity:1;"; mainMenu.classList.add("show"); }

    enemies = []; bullets = []; enemyBullets = []; powerups = [];
    boss = null; waveInProgress = false; waveNumber = 0; enemiesInWave = 0;
}

// ─── START GAME ───────────────────────────────────────────────
function startGame() {
    if (!imagesLoaded) { setTimeout(startGame, 100); return; }

    hideBannerAd();
    if (window.gameLoopId) { cancelAnimationFrame(window.gameLoopId); window.gameLoopId = null; }
    if (autoShootTimeout) { clearTimeout(autoShootTimeout); autoShootTimeout = null; }

    unlockAudio();

    const gameCanvas = document.getElementById("gameCanvas");
    const hud        = document.getElementById("hud");
    if (gameCanvas) { gameCanvas.style.display = "block"; gameCanvas.style.pointerEvents = "auto"; }
    if (hud) hud.style.display = "flex";

    document.body.offsetHeight; // reflow
    resizeGame();

    if (!canvas || !canvas.width || !canvas.height) { setTimeout(startGame, 100); return; }

    initStars();
    player.x = Math.max(0, Math.min(canvas.width / 2 - player.width / 2, canvas.width - player.width));
    player.y = Math.max(0, Math.min(canvas.height - 150, canvas.height - player.height));

    // Reset state
    health = maxHearts; score = 0;
    level = (highestLevel > 1) ? highestLevel : 1;
    gameRunning = true; paused = false; gameState = "playing";
    enemies = []; bullets = []; enemyBullets = []; powerups = []; boss = null;
    waveInProgress = false; waveNumber = 0; enemiesInWave = 0; reviveUsed = false;
    playerPerformance = { shotsFired: 0, shotsHit: 0, damageTaken: 0 };
    lastWaveTime = lastEnemySpawnTime = performance.now();
    lastTime = 0;

    updateHUD(); updateHeartsUI();

    const menu = document.getElementById("main-menu");
    if (menu) { menu.style.display = "none"; menu.classList.remove("show"); }

    if (menuMusic) menuMusic.pause();
    if (soundOn && gameMusic) { gameMusic.currentTime = 0; gameMusic.play().catch(() => {}); }

    startAutoShoot();
    startWave();
    window.gameLoopId = requestAnimationFrame(gameLoop);
}

// ─── AUTO SHOOT ───────────────────────────────────────────────
let autoShootTimeout = null;

function startAutoShoot() {
    if (autoShootTimeout) return;
    function shootLoop() {
        if (gameRunning && !paused) playerShoot();
        autoShootTimeout = setTimeout(shootLoop, fireRate);
    }
    shootLoop();
}

function playerShoot() {
    const now = Date.now();
    if (now - lastShot < 100) return;
    lastShot = now;

    if (soundOn) { shootSound.volume = sfxVolume; shootSound.currentTime = 0; shootSound.play().catch(() => {}); }

    const cx = player.x + player.width / 2;
    const y  = player.y;

    switch (weaponLevel) {
        case 1: createBullet(cx, y, 0, -10); break;
        case 2: createBullet(cx - 15, y, -0.5, -10); createBullet(cx + 15, y, 0.5, -10); break;
        case 3: createBullet(cx - 20, y, -1, -10); createBullet(cx, y, 0, -12); createBullet(cx + 20, y, 1, -10); break;
        default: for (let i = -2; i <= 2; i++) createBullet(cx, y, i * 1.5, -10);
    }
}

function createBullet(x, y, dx, dy) {
    bullets.push({ x, y, w: 4, h: 12, dx, dy: dy || -10, active: true, skin: currentSkin });
}

// ─── WAVE SYSTEM ──────────────────────────────────────────────
function getDifficultySettings() {
    if (level < 5) return { speed: 2, hpBase: 2, waveSize: 6 + waveNumber * 2, troopMode: false };
    const d = level - 4, m = getDynamicMultiplier();
    return {
        speed:     (2 + d * 0.3) * m,
        hpBase:    Math.floor((2 + d / 2) * m),
        waveSize:  Math.floor((10 + waveNumber * 4 + d * 2) * m),
        troopMode: true
    };
}

function getDynamicMultiplier() {
    const acc = playerPerformance.shotsHit / (playerPerformance.shotsFired || 1);
    if (acc > 0.6 && playerPerformance.damageTaken < 3) return 1.3;
    if (playerPerformance.damageTaken > 5) return 0.8;
    return 1;
}

function startWave() {
    if (!gameRunning || paused || boss) return;
    const diff = getDifficultySettings();
    waveInProgress = true; waveNumber++;
    enemiesInWave = diff.waveSize;
    isTroopFormation = diff.troopMode;
    waveSpawnTimer = 0;
    lastEnemySpawnTime = performance.now();
    showWaveNotification(waveNumber);
}

function spawnSingleEnemy() {
    const diff = getDifficultySettings();
    const r = Math.random();
    let type = ENEMY_NORMAL;
    if      (level > 6 && r < 0.15) type = ENEMY_SHOOTER;
    else if (level > 4 && r < 0.15) type = ENEMY_TANK;
    else if (level > 2 && r < 0.25) type = ENEMY_FAST;

    const e = {
        x: Math.random() * (canvas.width - 40), y: -50,
        w: 40, h: 40, type, hp: diff.hpBase + level,
        speed: diff.speed, shootChance: 0.20, active: true
    };

    if (type === ENEMY_FAST)    { e.speed = diff.speed + 2; e.hp = Math.max(1, e.hp - 1); }
    if (type === ENEMY_TANK)    { e.speed = Math.max(0.5, diff.speed - 1); e.hp *= 2; }
    if (type === ENEMY_SHOOTER) { e.shootChance = 0.30; e.hp += 1; }

    if (isTroopFormation) {
        const row = Math.floor(waveSpawnTimer / 5) % 3;
        const col = waveSpawnTimer % 5;
        e.x = (canvas.width / 6) * (col + 1);
        e.y = -60 - (row * 40);
        e.speed *= 0.5;
    }

    enemies.push(e);
    enemiesInWave--;
    waveSpawnTimer++;
}

function updateSpawning(now) {
    if (boss) return;
    if (!waveInProgress) {
        if (now - lastWaveTime > 2000) { startWave(); lastWaveTime = lastEnemySpawnTime = now; }
        return;
    }
    if (enemiesInWave > 0) {
        const delay = isTroopFormation ? 800 : 500;
        if (now - lastEnemySpawnTime > delay) { spawnSingleEnemy(); lastEnemySpawnTime = now; }
    } else if (enemies.length === 0) {
        endWave();
    }
}

async function endWave() {
    waveInProgress = false; waveSpawnTimer = 0; enemies = [];

    if (waveNumber % 3 === 0) {
        if (level % 5 === 0) { setTimeout(() => spawnBoss(), 1500); return; }
        setTimeout(() => levelComplete(), 1000);
        return;
    }

    await addCoins(20 + level * 5);
    updateHUD(); coinPulse();
    setTimeout(() => startWave(), 1500);
}

function showWaveNotification(num) {
    const n = document.createElement('div');
    n.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,255,255,.9);color:#000;padding:20px 40px;border-radius:10px;font-family:Orbitron,sans-serif;font-size:24px;font-weight:bold;z-index:9999;";
    n.textContent = "WAVE " + num;
    document.body.appendChild(n);
    setTimeout(() => { n.style.opacity = "0"; n.style.transition = "opacity .5s"; setTimeout(() => n.remove(), 500); }, 1500);
}

// ─── BOSS ─────────────────────────────────────────────────────
function spawnBoss() {
    if (boss) return;
    boss = {
        x: canvas.width / 2 - 100, y: -150,
        w: 200, h: 200,
        hp: 100 + level * 25, maxHp: 100 + level * 25,
        speed: 2 + level * 0.1, vx: 2,
        attackCooldown: 0, attackRate: 60,
        pattern: getBossPattern()
    };
    bossMaxHP = boss.hp;
    const bar = document.getElementById("bossBar");
    if (bar) bar.style.display = "block";
    const warn = document.getElementById("bossWarning");
    if (warn) { warn.style.display = "block"; setTimeout(() => { warn.style.display = "none"; }, 2000); }
}

function getBossPattern() {
    if (level < 5)  return "spray";
    if (level < 10) return Math.random() < 0.5 ? "spray" : "burst";
    return ["spray","burst","laser"][Math.floor(Math.random() * 3)];
}

function bossAttack() {
    if (!boss) return;
    const cx = boss.x + boss.w / 2, y = boss.y + boss.h;
    switch (boss.pattern) {
        case "spray":
            for (let i = -3; i <= 3; i++) enemyBullets.push({ x: cx, y, w: 6, h: 20, dx: i * 1.5, dy: 6 });
            break;
        case "burst":
            for (let i = 0; i < 5; i++) setTimeout(() => enemyBullets.push({ x: cx - 4, y, w: 8, h: 25, dy: 10 }), i * 120);
            break;
        case "laser":
            enemyBullets.push({ x: cx - 6, y, w: 12, h: 40, dy: 14 });
            break;
    }
}

function updateBoss() {
    if (!boss) return;
    if (boss.y < 120) { boss.y += boss.speed + 1; ctx.drawImage(bossImg, boss.x, boss.y, boss.w, boss.h); return; }

    boss.x += boss.vx;
    if (boss.x <= 0 || boss.x + boss.w >= canvas.width) boss.vx *= -1;

    boss.attackCooldown--;
    if (boss.attackCooldown <= 0) { bossAttack(); boss.attackCooldown = boss.attackRate; }

    ctx.drawImage(bossImg, boss.x, boss.y, boss.w, boss.h);
}

function updateBossBar() {
    if (!boss) return;
    const hp = document.getElementById("bossHealth");
    if (hp) hp.style.width = (boss.hp / bossMaxHP * 100) + "%";
}

async function giveBossReward() {
    const reward = Math.floor((200 + level * 50) * 1.2);
    await addCoins(reward);
    updateHUD(); saveGame();
    showBossRewardPopup(reward);
}

function showBossRewardPopup(amount) {
    const popup = document.createElement("div");
    popup.id = "bossRewardPopup";
    popup.innerHTML = `
        <div class="rewardBox">
            <h2>BOSS DEFEATED!</h2>
            <p style="color:gold;font-size:22px;">+${amount} 🪙</p>
            <button onclick="closeBossReward()">CLAIM</button>
            <button class="doubleBtn" onclick="doubleBossReward(${amount})">📺 DOUBLE REWARD</button>
        </div>`;
    document.body.appendChild(popup);
}

function doubleBossReward(amount) {
    rewardAmount = amount;
    pendingRewardAction = 'doubleBoss';
    showRewardAd();
}

function closeBossReward() {
    const popup = document.getElementById("bossRewardPopup");
    if (popup) popup.remove();
    setTimeout(() => levelComplete(), 300);
}

// ─── GAME LOOP ────────────────────────────────────────────────
function gameLoop(now) {
    if (!gameRunning) return;
    if (paused || gameState !== "playing") { window.gameLoopId = requestAnimationFrame(gameLoop); return; }

    if (now - lastTime < frameInterval) { window.gameLoopId = requestAnimationFrame(gameLoop); return; }
    lastTime = now;

    try {
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.shadowColor = "transparent";

        if (bgImg.complete && bgImg.naturalWidth > 0) {
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0,0,canvas.width,canvas.height);
        }

        updateSpawning(now);
        updatePlayer(); updateBullets(); updateEnemies(); updateEnemyBullets();
        updateExplosions(); updateCoinFX(); updatePowerups(); updateBoss(); updateTimers();
        drawStars(); drawEnemies(); drawPlayer();

        if (hitFlash > 0) {
            ctx.fillStyle = `rgba(255,0,0,${hitFlash * 0.1})`;
            ctx.fillRect(0,0,canvas.width,canvas.height);
            hitFlash--;
        }
    } catch (err) {
        console.error("Game loop crash:", err);
    }

    window.gameLoopId = requestAnimationFrame(gameLoop);
}

// ─── PLAYER MOVEMENT & DRAW ───────────────────────────────────
function updatePlayer() {
    if (moveLeft)  player.x -= player.speed;
    if (moveRight) player.x += player.speed;
    if (moveUp)    player.y -= player.speed;
    if (moveDown)  player.y += player.speed;

    if (touchX !== null) {
        player.x += (touchX - player.x - player.width / 2)  * 0.15;
        player.y += (touchY - player.y - player.height / 2) * 0.15;
    }

    player.x = Math.max(0, Math.min(canvas.width  - player.width,  player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function drawPlayer() {
    ctx.save(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    if (playerImg.complete && playerImg.naturalWidth > 0)
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x + player.width / 2 - 3, player.y + player.height, 6, 10);
    if (shieldActive) {
        ctx.save(); ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width, 0, Math.PI * 2);
        ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 4; ctx.shadowBlur = 20; ctx.shadowColor = "#00ffff";
        ctx.stroke(); ctx.restore();
    }
    ctx.restore();
}

function drawEnemies() {
    ctx.save(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    enemies.forEach(e => {
        const img = e.type === ENEMY_FAST ? enemyFastImg
            : e.type === ENEMY_TANK ? enemyTankImg
            : e.type === ENEMY_SHOOTER ? enemyShooterImg : enemyImg;
        if (img.complete && img.naturalWidth > 0) ctx.drawImage(img, e.x, e.y, e.w, e.h);
    });
    ctx.restore();
}

// ─── BULLETS ─────────────────────────────────────────────────
function updateBullets() {
    const bulletColors = ["cyan","lime","yellow","orange","white"];

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y += b.dy; if (b.dx) b.x += b.dx;

        ctx.save(); ctx.shadowBlur = 10;
        ctx.fillStyle = ctx.shadowColor = bulletColors[b.skin] || "white";
        ctx.fillRect(b.x - b.w / 2, b.y, b.w, b.h);
        ctx.restore();

        let hit = false;

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
                bullets.splice(i, 1); hit = true; e.hp--; screenShake = 3;
                if (e.hp <= 0) {
                    enemies.splice(j, 1);
                    if (soundOn) { explosionSound.currentTime = 0; explosionSound.volume = sfxVolume; explosionSound.play().catch(() => {}); }
                    explosions.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, frame: 0, maxFrame: 10 });
                    const reward = e.type === ENEMY_SHOOTER ? 30 : e.type === ENEMY_TANK ? 25 : e.type === ENEMY_FAST ? 15 : 10;
                    addCoins(reward);
                    combo++; comboTimer = 60; totalKills++;
                    for (let k = 0; k < Math.min(reward, 10); k++)
                        coinFX.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: (Math.random() - .5) * 6, vy: -Math.random() * 4 - 2, life: 30, maxLife: 30 });
                    coinPulse(); updateHUD();
                    if (Math.random() < 0.3)
                        powerups.push({ x: e.x + e.w / 2 - 16, y: e.y + e.h / 2, type: Math.floor(Math.random() * 3), w: 32, h: 32 });
                    saveGame();
                }
                break;
            }
        }

        if (hit) continue;

        if (boss && boss.y >= 80 &&
            b.x < boss.x + boss.w && b.x + b.w > boss.x &&
            b.y < boss.y + boss.h && b.y + b.h > boss.y) {
            bullets.splice(i, 1);
            boss.hp -= damage; screenShake = 8; hitFlash = 5;
            updateBossBar();
            if (boss.hp <= 0) { boss = null; document.getElementById("bossBar").style.display = "none"; giveBossReward(); }
            continue;
        }

        if (b.y < -50 || b.x < -50 || b.x > canvas.width + 50) bullets.splice(i, 1);
    }
}

// ─── ENEMIES ─────────────────────────────────────────────────
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += e.speed;
        if (e.y > canvas.height + 50) { enemies.splice(i, 1); continue; }

        if (!e.lastShotTime) e.lastShotTime = 0;
        const interval = e.type === ENEMY_SHOOTER ? 1000 : 2000;
        if (performance.now() - e.lastShotTime > interval && e.y > 100) {
            enemyBullets.push({ x: e.x + e.w / 2 - 4, y: e.y + e.h, w: 8, h: 20 });
            e.lastShotTime = performance.now();
        }

        if (enemies.length === 0 && enemiesInWave <= 0 && waveInProgress) endWave();
    }
}

// ─── ENEMY BULLETS ────────────────────────────────────────────
function updateEnemyBullets() {
    if (!gameRunning) return;
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.y += b.dy || 10; if (b.dx) b.x += b.dx;

        ctx.save();
        ctx.fillStyle = "rgba(255,0,0,.3)"; ctx.fillRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
        ctx.fillStyle = "#ff0044"; ctx.shadowBlur = 30; ctx.shadowColor = "#ff0044"; ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = "#fff"; ctx.shadowBlur = 10; ctx.shadowColor = "#fff"; ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
        ctx.restore();

        if (b.x < player.x + player.width && b.x + b.w > player.x &&
            b.y < player.y + player.height && b.y + b.h > player.y) {

            enemyBullets.splice(i, 1);
            if (shieldActive) { screenShake = 5; hitFlash = 3; shieldTimer -= 20; if (shieldTimer <= 0) shieldActive = false; continue; }

            if (playerHitCooldown <= 0) {
                health--; hitFlash = 10; screenShake = 6;
                updateHeartsUI(); updateHUD();
                if (health <= 0) {
                    if (!gameRunning) return;
                    gameRunning = false;
                    gameState = "gameover";
                    reviveUsed ? gameOver() : showReviveScreen();
                    return;
                }
                playerHitCooldown = 10;
            }
            continue;
        }

        if (b.y > canvas.height + 50) enemyBullets.splice(i, 1);
    }
}

// ─── POWERUPS ─────────────────────────────────────────────────
function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.y += 2;

        const img   = p.type === 1 ? rapidImg : p.type === 2 ? shieldImg : healthImg;
        const color = p.type === 1 ? "#ff6600" : p.type === 2 ? "#00ccff" : "#00ff00";
        const label = p.type === 1 ? "⚡" : p.type === 2 ? "🛡" : "+";

        if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, p.x, p.y, 32, 32);
        } else {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(p.x + 16, p.y + 16, 16, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = "white"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(label, p.x + 16, p.y + 16);
        }

        if (p.x < player.x + player.width && p.x + 32 > player.x &&
            p.y < player.y + player.height && p.y + 32 > player.y) {
            powerups.splice(i, 1);
            if      (p.type === 0) { health = Math.min(maxHearts, health + 1); updateHeartsUI(); }
            else if (p.type === 1) { rapidFire = true; rapidTimer = 300; }
            else if (p.type === 2) {
                shieldActive = true; shieldTimer = 300 + shieldLevel * 150;
                screenShake = 5; hitFlash = 3;
                if (soundOn) { powerupSound.currentTime = 0; powerupSound.play().catch(() => {}); }
            }
            continue;
        }
        if (p.y > canvas.height) powerups.splice(i, 1);
    }
}

// ─── EFFECTS ──────────────────────────────────────────────────
function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const ex = explosions[i];
        const size = 20 + ex.frame * 4;
        ctx.save(); ctx.globalAlpha = 1 - ex.frame / ex.maxFrame;
        if (explosionImg.complete && explosionImg.naturalWidth > 0)
            ctx.drawImage(explosionImg, ex.x - size / 2, ex.y - size / 2, size, size);
        else {
            ctx.fillStyle = `rgba(255,165,0,${1 - ex.frame / ex.maxFrame})`;
            ctx.beginPath(); ctx.arc(ex.x, ex.y, size / 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        ex.frame++;
        if (ex.frame > ex.maxFrame) explosions.splice(i, 1);
    }
}

function updateCoinFX() {
    for (let i = coinFX.length - 1; i >= 0; i--) {
        const ex = coinFX[i];
        const size = 20 + ex.frame * 4;
        ctx.save(); ctx.globalAlpha = 1 - ex.frame / ex.maxFrame;
        if (coinImg.complete && coinImg.naturalWidth > 0)
            ctx.drawImage(coinImg, ex.x - size / 2, ex.y - size / 2, size, size);
        else {
            ctx.fillStyle = `rgba(255,165,0,${1 - ex.frame / ex.maxFrame})`;
            ctx.beginPath(); ctx.arc(ex.x, ex.y, size / 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        ex.frame++;
        if (ex.frame > ex.maxFrame) coinFX.splice(i, 1);
    }
}

function drawStars() {
    ctx.fillStyle = "white";
    stars.forEach(s => {
        s.y += s.s * 0.5;
        if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
        ctx.fillRect(s.x, s.y, s.s, s.s);
    });
}

function initStars() {
    stars = [];
    if (!canvas || !canvas.width) return;
    for (let i = 0; i < 80; i++)
        stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, s: Math.random() * 3 + 1 });
}

// ─── SHIELD METER ─────────────────────────────────────────────
function updateShieldMeter() {
    const meter = document.getElementById("shieldMeter");
    const bar   = document.getElementById("shieldBar");
    const text  = document.getElementById("shieldText");
    if (!meter || !bar || !text) return;

    if (!shieldActive) { meter.style.display = "none"; meter.classList.remove("low-shield"); return; }

    meter.style.display = "flex";
    const max = 300 + shieldLevel * 150;
    const pct = Math.max(0, Math.min(100, (shieldTimer / max) * 100));
    bar.style.width = pct + "%";
    text.innerText = Math.round(pct) + "%";
    pct < 25 ? meter.classList.add("low-shield") : meter.classList.remove("low-shield");
}

// ─── TIMERS ───────────────────────────────────────────────────
function updateTimers() {
    if (rapidFire) {
        fireRate = 100;
        if (--rapidTimer <= 0) { rapidFire = false; fireRate = Math.max(80, 300 - level * 10); }
    }
    if (shieldActive && --shieldTimer <= 0) shieldActive = false;
    updateShieldMeter();
    if (comboTimer > 0) { comboTimer--; } else { combo = 0; }
    if (--playerHitCooldown < 0) playerHitCooldown = 0;
}

// ─── FIREBASE / COINS ─────────────────────────────────────────
async function loadCoins() {
    if (window.FirebaseFirestore) {
        try {
            const { snapshot } = await window.FirebaseFirestore.getDocument({ reference: `players/${playerId}` });
            coins = snapshot?.data?.coins || 0; updateHUD(); return;
        } catch (e) { console.warn("Firebase load failed:", e); }
    }
    coins = parseInt(localStorage.getItem("coins") || "0");
    updateHUD();
}

async function addCoins(amount) {
    const next = coins + amount;
    if (window.FirebaseFirestore) {
        try { await window.FirebaseFirestore.setDocument({ reference: `players/${playerId}`, data: { coins: next }, merge: true }); }
        catch (e) { localStorage.setItem("coins", next); }
    } else {
        localStorage.setItem("coins", next);
    }
    coins = next; updateHUD();
}

async function setCoins(amount) {
    if (window.FirebaseFirestore) {
        try { await window.FirebaseFirestore.setDocument({ reference: `players/${playerId}`, data: { coins: amount }, merge: true }); return; }
        catch (e) { console.warn("Firebase save failed:", e); }
    }
    localStorage.setItem("coins", amount);
}

// ─── SAVE / LOAD ──────────────────────────────────────────────
async function saveGame() {
    await setCoins(coins);
    const saveData = {
        weaponLevel, currentSkin, unlockedSkins, dailyData, noAds,
        savedLevel: level, highestLevel, totalKills,
        lastSaved: Date.now()
    };
    
    // Save locally
    localStorage.setItem("nebulaSave", JSON.stringify(saveData));
    
    // Save to cloud
    if (window.FirebaseFirestore) {
        try {
            await window.FirebaseFirestore.setDocument({
                reference: `players/${playerId}`,
                data: saveData,
                merge: true
            });
        } catch (e) { console.warn("Cloud save failed:", e); }
    }
}

async function loadGame() {
    // Try cloud first
    if (window.FirebaseFirestore) {
        try {
            const { snapshot } = await window.FirebaseFirestore.getDocument({
                reference: `players/${playerId}`
            });
            if (snapshot?.data) {
                applySaveData(snapshot.data);
                return;
            }
        } catch (e) { console.warn("Cloud load failed:", e); }
    }
    
    // Fallback to local
    const raw = localStorage.getItem("nebulaSave");
    if (raw) applySaveData(JSON.parse(raw));
}

function applySaveData(d) {
    weaponLevel = d.weaponLevel || 1;
    currentSkin = d.currentSkin || 0;
    unlockedSkins = d.unlockedSkins || [0];
    dailyData = d.dailyData || { lastLogin: null, streak: 0 };
    noAds = d.noAds || false;
    highestLevel = d.highestLevel || 1;
    totalKills = d.totalKills || 0;
    
    // Always restore level if it exists, regardless of value
    if (typeof d.savedLevel === 'number') {
        level = d.savedLevel;
    }
    
    updateSkin();
    if (noAds) updateNoAdsUI();
}

// ─── LEADERBOARD ──────────────────────────────────────────────
async function submitScore(levelReached, kills) {
    if (!window.FirebaseFirestore) return;
    try {
        await window.FirebaseFirestore.setDocument({
            reference: `leaderboard/${playerId}`,
            data: { playerId, level: levelReached, kills, coins, timestamp: Date.now() },
            merge: false
        });
    } catch (e) { console.warn("Score submit failed:", e); }
}

async function loadLeaderboard() {
    const screen = document.getElementById("leaderboardScreen");
    if (screen) screen.style.display = "flex";

    const list = document.getElementById("leaderboardList");
    if (list) list.innerHTML = '<p style="color:#aaa;text-align:center;font-family:Orbitron">Loading...</p>';

    if (!window.FirebaseFirestore) { showCoinWarning("Leaderboard requires internet"); return; }

    try {
        const { snapshot } = await window.FirebaseFirestore.getCollection({ reference: "leaderboard" });
        const entries = snapshot.documents
            .map(d => d.data)
            .sort((a, b) => b.level - a.level || b.kills - a.kills)
            .slice(0, 10);
        renderLeaderboard(entries);
    } catch (e) {
        console.warn("Leaderboard load failed:", e);
        showCoinWarning("Could not load leaderboard");
    }
}

function renderLeaderboard(entries) {
    const list = document.getElementById("leaderboardList");
    if (!list) return;

    if (!entries.length) { list.innerHTML = '<p style="color:#aaa;text-align:center;font-family:Orbitron">No scores yet!</p>'; return; }

    list.innerHTML = entries.map((e, i) => {
        const isMe = e.playerId === playerId;
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
        return `
            <div class="lb-row ${isMe ? 'lb-me' : ''}">
                <span class="lb-rank">${medal}</span>
                <span class="lb-name">${isMe ? '⭐ YOU' : 'Player'}</span>
                <span class="lb-level">Lv ${e.level}</span>
                <span class="lb-kills">${e.kills} kills</span>
            </div>`;
    }).join('');
}

function closeRanks() {
    document.getElementById('leaderboardScreen').style.display = 'none';
    const menu = document.getElementById('main-menu');
    if (menu) {
        menu.style.display = 'flex';
        menu.classList.add('show');
    }
}

// ─── SHOP ─────────────────────────────────────────────────────
function openShop() {
    document.getElementById("shop").style.display = "flex";
    const menu = document.getElementById("main-menu");
    if (menu) { menu.classList.remove("show"); menu.style.display = "none"; }
    updateShopUI(); updateShopCoins();
}

function closeShop() {
    document.getElementById("shop").style.display = "none";
    if (window.shopOpenedFromGame) {
        window.shopOpenedFromGame = false;
        paused = false; gameState = "playing"; gameRunning = true;
        if (soundOn && gameMusic) gameMusic.play().catch(() => {});
        lastTime = 0; window.gameLoopId = requestAnimationFrame(gameLoop);
        document.getElementById("gameCanvas").style.display = "block";
        document.getElementById("hud").style.display = "flex";
    } else {
        const menu = document.getElementById("main-menu");
        if (menu) { menu.style.display = "flex"; setTimeout(() => menu.classList.add("show"), 10); }
    }
}

function openShopUpgrades() {
    document.querySelector('.coin-display')?.classList.add('clicked');
    window.shopOpenedFromGame = (gameState === "playing" || gameRunning);
    if (gameRunning && !paused) {
        paused = true;
        if (gameMusic) gameMusic.pause();
        if (window.gameLoopId) { cancelAnimationFrame(window.gameLoopId); window.gameLoopId = null; }
    }
    openShop();
    setTimeout(() => document.getElementById("upgradesSection")?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
}

function updateShopCoins() {
    const el = document.getElementById('shopCoinText');
    if (el) el.textContent = coins;
}

function updateShopUI() {
    unlockedSkins.forEach(id => {
        const btn = document.getElementById('skin' + id);
        if (!btn) return;
        btn.classList.replace('locked', 'unlocked');
        const lock  = btn.querySelector('.lockIcon');  if (lock)  lock.remove();
        const price = btn.querySelector('.skinPrice'); if (price) { price.textContent = 'OWNED'; price.style.color = '#00ff88'; }
    });
}

function selectSkin(id) {
    if (!unlockedSkins.includes(id)) return;
    currentSkin = id; updateSkin(); saveGame();

    document.querySelectorAll('.skinBtn').forEach(btn => {
        btn.style.borderColor = '#444'; btn.style.boxShadow = 'none';
        btn.querySelector('.equippedBadge')?.remove();
    });

    const skinBtn = document.getElementById('skin' + id);
    if (!skinBtn) return;
    skinBtn.style.borderColor = "#00ff88"; skinBtn.style.boxShadow = "0 0 15px #00ff88";

    const badge = document.createElement("div");
    badge.className = "equippedBadge"; badge.innerText = "EQUIPPED";
    Object.assign(badge.style, { position: "absolute", bottom: "5px", left: "50%", transform: "translateX(-50%)", background: "#00ff88", color: "black", fontSize: "12px", padding: "3px 8px", borderRadius: "6px", fontWeight: "bold" });
    skinBtn.appendChild(badge);
}

async function tryBuySkin(id, price) {
    if (unlockedSkins.includes(id)) { selectSkin(id); return; }
    if (coins < price) { showCoinWarning("Not enough coins!"); return; }

    await addCoins(-price); showCoinSpend(price);
    unlockedSkins.push(id);
    updateHUD(); updateShopCoins(); saveGame();

    const btn = document.getElementById('skin' + id);
    if (btn) {
        btn.classList.replace('locked', 'unlocked');
        btn.querySelector('.lockIcon')?.remove();
        const price = btn.querySelector('.skinPrice');
        if (price) { price.textContent = "OWNED"; price.style.color = "#00ff88"; }
        btn.style.transform = "scale(1.1)";
        setTimeout(() => btn.style.transform = "scale(1)", 200);
    }
    setTimeout(() => selectSkin(id), 50);
}

async function buyWeapon() {
    if (weaponLevel >= 5) { showCoinWarning("Weapon is max level!"); return; }
    const cost = 150 * weaponLevel;
    if (coins < cost) { showCoinWarning("Not enough coins!"); return; }
    await addCoins(-cost); showCoinSpend(cost);
    weaponLevel++; damage++; fireRate = Math.max(80, fireRate - 40);
    updateHUD(); saveGame(); coinPulse();
}

async function buyShield() {
    if (shieldLevel >= 5) { showCoinWarning("Shield is max level!"); return; }
    if (coins < 50) { showCoinWarning("Not enough coins!"); return; }
    await addCoins(-50); showCoinSpend(50);
    shieldLevel++; shieldActive = true;
    shieldTimer = Math.max(shieldTimer, 300 + shieldLevel * 150);
    hitFlash = 3; screenShake = 4;
    updateHUD(); updateShopCoins(); saveGame(); coinPulse();
}

async function buyCoins(amount) {
    if (!amount || amount <= 0) { showCoinWarning("Invalid amount"); return; }
    coins += amount; await setCoins(coins);
    const el = document.getElementById("shopCoinText"); if (el) el.innerText = coins;
    updateHUD(); coinPulse(); showCoinGain(amount);
}

/* ---------- NO ADS PURCHASE ---------- */

let storeReady = false;

function initStore() {
    if (typeof CdvPurchase === 'undefined') {
        console.warn('Billing plugin not loaded');
        return;
    }

    const store = CdvPurchase.store;

    store.register({
        id: 'remove_ads_premium',
        type: CdvPurchase.ProductType.NON_CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY
    });

    store.when().productUpdated(p => {
        // Update UI with real price from Play Console
        const priceEl = document.querySelector('#noAdsCard .coinPrice');
        if (priceEl) priceEl.textContent = p.price;
        storeReady = true;
    });

    store.when().approved(t => {
        noAds = true;
        saveGame();
        hideBannerAd();
        updateNoAdsUI();
        showCoinGain("NO ADS ACTIVATED!");
        t.finish();
    });

    store.when().cancelled(() => {
        showCoinWarning("Purchase cancelled");
    });

    store.when().error(err => {
        console.error('Store error:', err);
        showCoinWarning("Purchase failed");
    });

    store.initialize([CdvPurchase.Platform.GOOGLE_PLAY]);
}

async function buyNoAds() {
    if (noAds) { showCoinWarning("No Ads already active!"); return; }

    if (typeof CdvPurchase === 'undefined') {
        // Fallback for browser testing
        if (confirm("Test: Purchase Remove Ads for $12.99?")) {
            noAds = true;
            await saveGame();
            hideBannerAd();
            updateNoAdsUI();
            showCoinGain("NO ADS ACTIVATED! (TEST)");
        }
        return;
    }

    if (!storeReady) {
        showCoinWarning("Store loading... try again");
        return;
    }

    const store = CdvPurchase.store;
    const product = store.get('remove_ads_premium');
    if (!product) {
        showCoinWarning("Product not available");
        return;
    }

    await store.order(product);
}

function updateNoAdsUI() {
    const card = document.getElementById("noAdsCard");
    if (!card) return;

    if (noAds) {
        card.classList.add("purchased");
        card.innerHTML = `
            <div class="noAdsIcon" style="color:#00ff88; font-size:32px;">✓</div>
            <div class="coinLabel" style="color:#00ff88; font-weight:bold; font-size:14px;">Ads Removed</div>
            <div class="coinPrice" style="color:#888;">Purchased</div>
        `;
    }
}

function shouldShowAds() {
    return !noAds;
}

// ─── LEVEL / GAME OVER ────────────────────────────────────────
function levelComplete() {
    gameRunning = false; paused = false; gameState = "levelcomplete";
    if (gameMusic) gameMusic.pause();

    const reward = 50 + level * 10;
    const screen = document.getElementById("levelComplete");
    if (screen) {
        screen.innerHTML = `
            <div class="level-complete-box">
                <h2>LEVEL ${level}<br>COMPLETE!</h2>
                <div class="reward-text">Reward: +${reward} 🪙</div>
                <div class="level-complete-buttons">
                    <button onclick="doubleLevelReward(${reward})" class="double-reward-btn">🎥 DOUBLE REWARD</button>
                    <button onclick="nextLevel()" class="next-level-btn">NEXT LEVEL →</button>
                </div>
            </div>`;
        screen.style.display = "flex";
    }
    giveReward(reward); saveGame();
}

function doubleLevelReward(base) {
    rewardAmount = base;
    pendingRewardAction = 'doubleLevel';
    showRewardAd();
}

function nextLevel() {
    level++; if (level > 100) level = 100;
    if (level > highestLevel) highestLevel = level;

    const screen = document.getElementById("levelComplete");
    if (screen) { screen.style.display = "none"; screen.innerHTML = ''; }

    waveNumber = 0; enemies = []; enemyBullets = []; bullets = []; powerups = [];
    boss = null; waveInProgress = false;
    gameRunning = true; paused = false; gameState = "playing";

    updateHUD();
    if (soundOn && gameMusic) { gameMusic.currentTime = 0; gameMusic.play().catch(() => {}); }

    lastTime = 0;
    lastWaveTime = lastEnemySpawnTime = performance.now();
    setTimeout(() => startWave(), 500);
    window.gameLoopId = requestAnimationFrame(gameLoop);
    saveGame();
}

async function gameOver() {
    gameState = "gameover"; gameRunning = false;
    if (window.gameLoopId) cancelAnimationFrame(window.gameLoopId);

    await submitScore(level, totalKills);

    const screen = document.getElementById("gameOverScreen");
    if (screen) {
        screen.style.display = "flex"; screen.style.opacity = "0";
        setTimeout(() => { screen.style.transition = "opacity .3s ease"; screen.style.opacity = "1"; }, 10);
    }
}

function restartGame() {
    document.getElementById("gameOverScreen").style.display = "none";
    const savedLevel = level;
    health = maxHearts; score = 0; reviveUsed = false;
    enemies = []; enemyBullets = []; bullets = []; powerups = [];
    boss = null; waveInProgress = false; autoShootTimeout = null;
    startGame();
    level = savedLevel; updateHUD();
}

function backToMenu() {
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("gameCanvas").style.display = "none";
    document.getElementById("main-menu").style.display = "flex";
}

function resetToMenu() {
    gameState = "menu";
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("main-menu").style.display = "flex";
}

// ─── SETTINGS ─────────────────────────────────────────────────
function openSettings() {
    const s = document.getElementById("settings"), m = document.getElementById("main-menu");
    if (!s) return;
    if (m) m.style.display = "none";
    updateSoundButton(); s.style.display = "flex";
}

function closeSettings() {
    document.getElementById("settings").style.display = "none";
    const m = document.getElementById("main-menu");
    if (m) { m.style.display = "flex"; m.classList.add("show"); }
}

function updateSoundButton() {
    const icon = document.getElementById("soundIcon");
    const text = document.getElementById("soundText");
    const btn  = document.querySelector(".soundBtn");
    if (!icon || !text) return;
    icon.textContent = soundOn ? "🔊" : "🔇";
    text.textContent = soundOn ? "Sound: ON" : "Sound: OFF";
    btn && (soundOn ? btn.classList.remove("sound-off") : btn.classList.add("sound-off"));
}

function toggleSound() {
    soundOn = !soundOn;
    if (!soundOn) {
        menuMusic.pause(); gameMusic.pause();
        shootSound.volume = explosionSound.volume = 0;
    } else {
        shootSound.volume = explosionSound.volume = sfxVolume;
        if (gameRunning && gameMusic.paused) gameMusic.play().catch(() => {});
        else if (!gameRunning && menuMusic.paused) menuMusic.play().catch(() => {});
    }
    updateSoundButton(); saveGame();
}

function setMusicVolume(val) { const v = val / 100; if (menuMusic) menuMusic.volume = v; if (gameMusic) gameMusic.volume = v; }
function setSFXVolume(val)   { sfxVolume = val / 100; shootSound.volume = explosionSound.volume = sfxVolume; }

// ─── DAILY REWARD ─────────────────────────────────────────────
function isChestDay()     { return dailyData.streak === 7; }
function getDailyReward(d){ return [50,100,150,200,300,400][Math.min(Math.max(d - 1, 0), 5)]; }

function saveDailyData() {
    try { localStorage.setItem("dailyData", JSON.stringify(dailyData)); } catch (e) {}
}

function loadDailyData() {
    try {
        const raw = localStorage.getItem("dailyData");
        dailyData = raw ? JSON.parse(raw) : { lastLogin: null, streak: 1 };
    } catch (e) { dailyData = { lastLogin: null, streak: 1 }; }
}

function checkDailyReward() {
    if (!dailyData || typeof dailyData !== "object") dailyData = { lastLogin: null, streak: 1 };
    loadDailyData();
    const today = new Date().toDateString();
    if (!dailyData.lastLogin) { dailyData.streak = 1; saveDailyData(); showDailyReward(); return; }
    if (dailyData.lastLogin === today) return;

    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (dailyData.lastLogin !== yesterday.toDateString()) dailyData.streak = 1;
    saveDailyData(); showDailyReward();
}

function showDailyReward() {
    updateDailyRewardUI();
    const el = document.getElementById("dailyReward");
    if (el) el.style.display = "flex";
}

function updateDailyRewardUI() {
    const streakEl = document.getElementById("streakNumber");
    if (streakEl) streakEl.innerText = `${dailyData.streak} / 7`;

    const isDay7 = isChestDay();
    const normalReward = document.getElementById("normalReward");
    const bigChest  = document.getElementById("bigRewardChest");
    const rewardInfo = document.getElementById("rewardInfo");
    const claimBtn  = document.querySelector(".claimBtn");
    const doubleBtn = document.querySelector(".doubleRewardBtn");

    if (isDay7) {
        if (normalReward) normalReward.style.display = "none";
        if (bigChest)  { bigChest.style.display = "block"; bigChest.style.cursor = "pointer"; }
        if (rewardInfo){ rewardInfo.style.display = "flex"; rewardInfo.innerHTML = `<span>Tap chest for MEGA reward!</span>`; }
        if (claimBtn)  { claimBtn.disabled = true; claimBtn.innerText = "CLAIM MEGA REWARD!"; }
        if (doubleBtn) { doubleBtn.disabled = true; doubleBtn.innerText = "🎥 WATCH AD FOR 2X COINS"; }
    } else {
        if (normalReward) normalReward.style.display = "block";
        if (bigChest)  bigChest.style.display = "none";
        if (rewardInfo){ rewardInfo.style.display = "flex"; rewardInfo.innerHTML = `<span>Daily Reward: ${getDailyReward(dailyData.streak)} coins</span>`; }
        if (claimBtn)  { claimBtn.disabled = false; claimBtn.innerText = "CLAIM REWARD"; }
        if (doubleBtn) { doubleBtn.disabled = false; doubleBtn.innerText = "🎥 WATCH AD FOR 2X"; }
    }

    const labels = [50,100,150,200,300,400,"MEGA!"];
    for (let i = 1; i <= 7; i++) {
        const el = document.getElementById(`day${i}`); if (!el) continue;
        el.className = i === 7 ? "day day7-chest" : "day";
        el.innerHTML = i === 7 ? `Day 7<br><b>MEGA!</b>` : `Day ${i}<br><b>${labels[i-1]}</b>`;
        if (i < dailyData.streak)  { el.classList.add("claimed"); el.innerHTML += i === 7 ? "" : "<br>✓"; }
        if (i === dailyData.streak) el.classList.add("active","today");
    }
}

function claimDailyReward(useDouble = false) {
    if (useDouble) {
        if (!admobReady) { showCoinWarning("Ads not ready!"); claimDailyReward(false); return; }
        pendingRewardAction = 'dailyDouble'; showRewardAd(); return;
    }

    let amount = 0;
    if (isChestDay()) {
        amount = 1000;
        if (weaponLevel < 5) { weaponLevel++; damage++; fireRate = Math.max(80, fireRate - 40); }
        if (shieldLevel < 5) { shieldLevel++; }
        shieldActive = true; shieldTimer = 600;
    } else {
        amount = getDailyReward(dailyData.streak);
    }

    if (pendingRewardAction === 'dailyDouble') amount *= 2;
    pendingRewardAction = null;

    coins += amount;
    dailyData.lastLogin = new Date().toDateString();
    dailyData.streak = dailyData.streak >= 7 ? 1 : dailyData.streak + 1;

    saveDailyData(); saveGame(); updateHUD(); coinPulse(); showCoinGain(amount);

    const el = document.getElementById("dailyReward"); if (el) el.style.display = "none";
    const menu = document.getElementById("main-menu"); if (menu) { menu.style.display = "flex"; menu.classList.add("show"); }
}

async function giveReward(amount) {
    await addCoins(amount);
    const el = document.getElementById("shopCoinText"); if (el) el.innerText = coins;
    updateHUD(); showCoinGain(amount);
    const dr = document.getElementById("dailyReward"); if (dr) dr.style.display = "none";
}

// ─── UI HELPERS ───────────────────────────────────────────────
function showCoinGain(amount) {
    const el = document.createElement("div");
    el.innerText = "+" + amount + " 🪙";
    Object.assign(el.style, { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "gold", fontSize: "24px", zIndex: "9999", pointerEvents: "none", fontFamily: "Orbitron,sans-serif" });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function showCoinSpend(amount) {
    const el = document.createElement("div");
    el.innerText = "-" + amount + " 🪙";
    Object.assign(el.style, { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#ff4444", fontSize: "26px", fontWeight: "bold", zIndex: "9999", pointerEvents: "none", transition: "all .6s ease" });
    document.body.appendChild(el);
    setTimeout(() => { el.style.transform = "translate(-50%,-80%) scale(1.2)"; el.style.opacity = "0"; }, 50);
    setTimeout(() => el.remove(), 700);
}

function showCoinWarning(msg = "Something went wrong") {
    const el = document.getElementById("coinWarning");
    if (!el) return;
    el.innerText = msg; el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1200);
}

function watchAdReward() {
    if (!admobReady) { showCoinWarning("Ads not ready yet!"); return; }
    pendingRewardAction = 'freeCoins'; showRewardAd();
}

function closeApp() {
    gameRunning = false; paused = false;
    gameMusic.pause(); menuMusic.pause();
    window.close();
    document.body.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:black;color:#00ffff;font-family:Orbitron;font-size:24px;">Closing...</div>`;
}

// ─── FIREBASE CONFIG ──────────────────────────────────────────
const firebaseConfig = {
    apiKey:            "YOUR_API_KEY",
    authDomain:        "nebula-strike-2c357.firebaseapp.com",
    projectId:         "nebula-strike-2c357",
    storageBucket:     "nebula-strike-2c357.firebasestorage.app",
    messagingSenderId: "656562876567",
    appId:             "1:656562876567:android:38aef3fff6b0dff2abb9d2"
};

// ─── INITIALIZATION ───────────────────────────────────────────
window.addEventListener("load", async () => {
    const isAndroid = typeof Capacitor !== 'undefined' && Capacitor.getPlatform() === 'android';

    if (isAndroid) {
        console.log("Native Android Firebase");
    } else if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        firebase.appCheck().activate('YOUR_RECAPTCHA_SITE_KEY', true);
    }

    detectTamper();
    await loadCoins();
    await loadGame();
    loadDailyData();
    if (noAds) updateNoAdsUI();

    setTimeout(() => { if (document.querySelectorAll('.skinBtn').length) selectSkin(currentSkin); }, 100);

    resizeGame();
    checkDailyReward();
    // initStore();

    const canvas = document.getElementById("gameCanvas");
    const hud    = document.getElementById("hud");
    if (canvas) { canvas.style.display = "none"; canvas.style.pointerEvents = "auto"; }
    if (hud)    hud.style.display = "none";

    // Tap-to-start overlay
    const overlay = document.createElement("div");
    overlay.id = "tapToStart";
    document.body.appendChild(overlay);

    let fallbackTriggered = false;

    const handleStart = (e) => {
        if (started) return;
        started = true;
        clearTimeout(fallbackTimer);
        if (e?.preventDefault) e.preventDefault();
        if (audioContext?.state === "suspended") audioContext.resume();
        unlockAudio();
        if (soundOn && menuMusic) { menuMusic.currentTime = 0; menuMusic.play().catch(() => {}); }
        overlay.remove();
        const splash = document.getElementById("splashScreen");
        if (splash) { splash.style.opacity = "0"; splash.style.pointerEvents = "none"; setTimeout(() => splash.style.display = "none", 500); }
        const menu = document.getElementById("main-menu");
        if (menu) { menu.style.cssText += "display:flex;visibility:visible;opacity:1;"; menu.classList.add("show"); }
    };

    ["click","touchstart"].forEach(evt => overlay.addEventListener(evt, handleStart, { once: true, passive: false }));

    attachButtonSounds();

    const fallbackTimer = setTimeout(() => {
        if (started || fallbackTriggered) return;
        fallbackTriggered = true;
        const splash = document.getElementById("splashScreen");
        if (splash) { splash.style.opacity = "0"; splash.style.pointerEvents = "none"; setTimeout(() => splash.style.display = "none", 500); }
        const menu = document.getElementById("main-menu");
        if (menu) { menu.style.cssText += "display:flex;visibility:visible;opacity:1;"; menu.classList.add("show"); }
        loadBannerAd();
    }, 1500);
});