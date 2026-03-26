/* =========================
   NEBULA STRIKE
========================= */

console.log("APP STARTED");

/* ---------- IMAGES ---------- */

const playerImg = new Image();
playerImg.src = "assets/player.png";

const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";

const enemyFastImg = new Image();
enemyImg.src = "assets/enemy-fast.png";

const enemyTankImg = new Image();
enemyImg.src = "assets/enemy-tank.png";

const enemyShooterImg = new Image();
enemyImg.src = "assets/enemy-shooter.png";

const bossImg = new Image();
bossImg.src = "assets/boss.png";

const bgImg = new Image();
bgImg.src = "assets/background.png";

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

let gameMusic = new Audio("assets/music.mp3");
gameMusic.loop = true;

const explosionImg = new Image();
explosionImg.src = "assets/explosion.png";

let explosions = [];
let coinFX = [];
const coinImg = new Image();
coinImg.src = "assets/ui/coin-icon.png";

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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    player.x = canvas.width / 2;
    player.y = canvas.height - 120;
}
window.addEventListener("resize", resizeGame);
window.addEventListener("orientationchange", resizeGame);

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
    // Pause with P key
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
    if(!gameRunning) return;
    
    paused = !paused;
    const pauseMenu = document.getElementById("pauseMenu");
    
    if(paused){
        // Show pause menu
        if(pauseMenu) pauseMenu.style.display = "flex";
        // Pause music
        if(gameMusic) gameMusic.pause();
    } else {
        // Hide pause menu and resume
        if(pauseMenu) pauseMenu.style.display = "none";
        // Resume music
        if(soundOn && gameMusic) gameMusic.play().catch(e => console.log("Audio resume failed"));
        // Resume game loop
        gameLoop();
    }
}

function resumeGame(){
    if(!paused) return;
    togglePause(); // This will set paused to false and resume
}

function quitGame(){
    saveGame();
    
    // Stop all game audio
    gameMusic.pause();
    menuMusic.currentTime = 0;
    if(soundOn) menuMusic.play().catch(e => console.log("Menu music failed"));
    
    // Reset game state
    paused = false;
    gameRunning = false;
    
    // Hide all game screens
    document.getElementById("pauseMenu").style.display = "none";
    document.getElementById("gameCanvas").style.display = "none";
    document.getElementById("hud").style.display = "none";
    document.getElementById("bossBar").style.display = "none";
    document.getElementById("bossWarning").style.display = "none";
    document.getElementById("levelComplete").style.display = "none";
    document.getElementById("gameOverScreen").style.display = "none";
    
    // Show main menu
    const menu = document.getElementById("main-menu");
    if(menu) {
        menu.style.display = "flex";
        menu.classList.add("show");
    }
    
    // Reset game objects
    enemies = [];
    bullets = [];
    enemyBullets = [];
    powerups = [];
    boss = null;
    waveInProgress = false;
}

/* ---------- START ---------- */

function startGame(){
    const menu = document.getElementById("main-menu");
    const canvasEl = document.getElementById("gameCanvas");
    const hud = document.getElementById("hud");

    if(menu) menu.style.display = "none";
    if(canvasEl) canvasEl.style.display = "block";
    if(hud) hud.style.display = "flex";

    health = maxHearts;
    gameRunning = true;
    paused = false;
    
    // Reset wave system
    waveInProgress = false;
    waveNumber = 0;
    enemiesInWave = 0;

    updateHUD();
    startAutoShoot();
    gameLoop();
}

let autoShootStarted=false;

function startAutoShoot(){
    if(autoShootStarted) return;
    autoShootStarted=true;

    setInterval(()=>{
        if(gameRunning && !paused){
            shoot();
        }
    },250);

    menuMusic.pause();
    if(soundOn){
        gameMusic.currentTime = 0;
        gameMusic.play().catch(e => console.log("Game music failed"));
    }
}

/* ---------- SHOOT ---------- */

canvas.addEventListener("click",()=>{
    if(gameRunning && !paused){
        shoot();
    }
});

function shoot(){
    let now = Date.now();
    if(now - lastShot < fireRate) return;
    lastShot = now;

    if(soundOn){
        shootSound.currentTime = 0;
        shootSound.play().catch(e => console.log("Shoot sound failed"));
    }

    if(weaponLevel === 1){
        bullets.push({
            x: player.x + 28,
            y: player.y,
            w: 4,
            h: 10,
            dx: 0
        });
    }
    else if(weaponLevel === 2){
        bullets.push({
            x: player.x + 15,
            y: player.y,
            w: 4,
            h: 10,
            dx: -1
        });
        bullets.push({
            x: player.x + 40,
            y: player.y,
            w: 4,
            h: 10,
            dx: 1
        });
    }
    else if(weaponLevel === 3){
        bullets.push({
            x: player.x + 10,
            y: player.y,
            w: 5,
            h: 12,
            dx: -1.5
        });
        bullets.push({
            x: player.x + 28,
            y: player.y,
            w: 5,
            h: 12,
            dx: 0
        });
        bullets.push({
            x: player.x + 46,
            y: player.y,
            w: 5,
            h: 12,
            dx: 1.5
        });
    }
    else{
        for(let i=-2;i<=2;i++){
            bullets.push({
                x: player.x + 28,
                y: player.y,
                w: 6,
                h: 14,
                dx: i * 1.2
            });
        }
    }
}

/* ---------- WAVE & ENEMY SPAWN SYSTEM ---------- */

function getDifficultySettings(){
    // Base settings that scale with level
    let settings = {
        speed: 2 + (level - 1) * 0.3,
        spawnRate: Math.max(400, 1500 - (level - 1) * 100),
        hpBase: 2 + Math.floor((level - 1) / 2),
        maxEnemies: 5 + level,
        waveSize: 3 + Math.floor(level / 2),
        troopMode: level >= 5 // Troop formations for level 5+
    };
    
    // Level 2+ slight speed increase and boss chance
    if(level >= 2){
        settings.bossChance = 0.3; // 30% chance for boss after wave
    }
    
    return settings;
}

function spawnWave(){
    if(!gameRunning || paused || boss) return;
    
    const diff = getDifficultySettings();
    
    if(!waveInProgress){
        // Start new wave
        waveInProgress = true;
        waveNumber++;
        enemiesInWave = diff.waveSize;
        isTroopFormation = diff.troopMode;
        waveSpawnTimer = 0;
        
        console.log(`Wave ${waveNumber} started! Troop mode: ${isTroopFormation}`);
    }
}

function spawnEnemyInWave(){
    if(!waveInProgress || enemiesInWave <= 0) return;
    
    const diff = getDifficultySettings();
    
    let type = ENEMY_NORMAL;
    let r = Math.random() + level * 0.02;
    
    if(level > 2 && r < 0.25) type = ENEMY_FAST;
    if(level > 4 && r < 0.15) type = ENEMY_TANK;
    if(level > 6 && r < 0.15) type = ENEMY_SHOOTER;
    
    let enemy = {
        x: Math.random() * (canvas.width - 40),
        y: -40,
        w: 40,
        h: 40,
        type: type,
        hp: diff.hpBase + level,
        speed: diff.speed,
        shootChance: 0.01
    };
    
    // Apply type modifiers
    if(type === ENEMY_FAST){
        enemy.speed = diff.speed + 2;
        enemy.hp = Math.max(1, diff.hpBase + level - 1);
    }
    if(type === ENEMY_TANK){
        enemy.speed = Math.max(1, diff.speed - 1);
        enemy.hp = (diff.hpBase + level) * 2;
    }
    if(type === ENEMY_SHOOTER){
        enemy.speed = diff.speed;
        enemy.hp = diff.hpBase + level + 1;
        enemy.shootChance = 0.03;
    }
    
    // TROOP FORMATION for level 5+
    if(isTroopFormation){
        // Spawn in organized rows
        let row = Math.floor((waveSpawnTimer / 10) % 3); // 3 rows
        let col = (waveSpawnTimer % 5); // 5 columns per row
        
        enemy.x = (canvas.width / 6) * (col + 1) - 20;
        enemy.y = -40 - (row * 50); // Staggered vertical positions
        
        // Slower speed for troop formation
        enemy.speed *= 0.6;
    }
    
    enemies.push(enemy);
    enemiesInWave--;
    
    // Wave complete
    if(enemiesInWave <= 0){
        waveInProgress = false;
        
        // Chance to spawn boss after wave (level 2+)
        if(level >= 2 && Math.random() < diff.bossChance && !boss){
            setTimeout(() => spawnBoss(), 2000);
        }
        
        // Start next wave after delay
        setTimeout(() => spawnWave(), 3000);
    }
}

function spawnEnemy(){
    // Legacy function - now handled by wave system
    if(!waveInProgress){
        spawnWave();
    }
}

/* ---------- BOSS SPAWN ---------- */

function spawnBoss(){
    if(boss) return;
    
    boss = {
        x: canvas.width / 2 - 80,
        y: -120,
        w: 160,
        h: 160,
        speed: 1.5 + (level * 0.2) // Faster at higher levels
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

function updateBoss(){
    if(!boss) return;

    if(boss.y < 40){
        boss.y += boss.speed;
    }

    ctx.drawImage(bossImg, boss.x, boss.y, boss.w, boss.h);

    // Boss shooting pattern
    if(Math.random() < 0.03 + (level * 0.005)){
        // Multiple bullets for higher levels
        let bulletCount = level >= 5 ? 3 : 1;
        for(let i=0; i<bulletCount; i++){
            enemyBullets.push({
                x: boss.x + boss.w/2 + (i-1)*30,
                y: boss.y + boss.h,
                w: 6,
                h: 12
            });
        }
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

/* ---------- MAIN GAME LOOP ---------- */

function gameLoop(){
    if(!gameRunning) return;
    if(paused) return; // Don't continue if paused
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if(screenShake > 0){
        ctx.save();
        let shakeX = (Math.random() - 0.5) * 10;
        let shakeY = (Math.random() - 0.5) * 10;
        ctx.translate(shakeX, shakeY);
        screenShake--;
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
        
        // Wave spawning logic
        spawnTimer++;
        const diff = getDifficultySettings();
        
        if(waveInProgress){
            // Spawn enemies in wave with delay between each
            let spawnDelay = isTroopFormation ? 15 : 10; // Slower for troops
            if(spawnTimer > spawnDelay && enemiesInWave > 0){
                spawnEnemyInWave();
                spawnTimer = 0;
                waveSpawnTimer++;
            }
        } else {
            // Start new wave if no enemies left
            if(enemies.length === 0 && !boss && spawnTimer > 60){
                spawnWave();
                spawnTimer = 0;
            }
        }
        
    } catch(e) {
        console.error("Game loop error:", e);
    }
    
    if(screenShake > 0){
        ctx.restore();
    }
    
    if(hitFlash > 0){
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        hitFlash--;
    }
    
    if(gameRunning && !paused){
        requestAnimationFrame(gameLoop);
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
    
    // Keep player on screen
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
        if(!bullets[i]) continue;
        
        let b = bullets[i];
        b.y -= 8;
        if(b.dx) b.x += b.dx;
        
        if(weaponLevel === 1) ctx.fillStyle = "cyan";
        else if(weaponLevel === 2) ctx.fillStyle = "lime";
        else if(weaponLevel === 3) ctx.fillStyle = "yellow";
        else ctx.fillStyle = "orange";
        
        ctx.fillRect(b.x, b.y, b.w, b.h);
        
        let hit = false;
        
        for(let j = enemies.length - 1; j >= 0; j--){
            if(!enemies[j]) continue;
            
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
    
    // Create explosion effect
    for(let i=0; i<20; i++){
        explosions.push({
            x: canvas.width/2 + (Math.random()-0.5)*200,
            y: 100 + (Math.random()-0.5)*100,
            frame: Math.random()*5,
            maxFrame: 15
        });
    }
    
    updateHUD();
    
    // Continue to next wave after boss
    setTimeout(() => {
        waveInProgress = false;
        spawnWave();
    }, 3000);
    
    saveGame();
}

function updateExplosions(){
    for(let i=explosions.length-1;i>=0;i--){
        let ex = explosions[i];
        ctx.drawImage(explosionImg, ex.x, ex.y, 40, 40);
        ex.frame++;
        if(ex.frame > ex.maxFrame || 10){
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
        
        // Remove offscreen bullets
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
        
        // Check collision with player
        if(p.x < player.x + player.width &&
           p.x + 32 > player.x &&
           p.y < player.y + player.height &&
           p.y + 32 > player.y){
            
            powerups.splice(i, 1);
            
            if(p.type === 0){ // Health
                health = Math.min(maxHearts, health + 1);
                updateHeartsUI();
            }
            else if(p.type === 1){ // Rapid fire
                rapidFire = true;
                rapidTimer = 300; // 5 seconds at 60fps
            }
            else if(p.type === 2){ // Shield
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
        unlockedSkins: unlockedSkins
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
    
    console.log("Shop opened successfully");
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
    
    console.log("Shop closed");
}

function updateShopCoins(){
    const coinText = document.getElementById("shopCoinText");
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

function animateShopButtons(){
    const btns = document.querySelectorAll(".shopBtn");
    btns.forEach(b=>{
        b.style.transform = "scale(1.1)";
        setTimeout(()=>{
            b.style.transform = "scale(1)";
        },200);
    });
}


// ================= SETTINGS FUNCTIONS =================

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
    
    console.log("Settings opened successfully");
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
    
    console.log("Settings closed");
}

function updateSoundButton(){
    const soundIcon = document.getElementById("soundIcon");
    const soundText = document.getElementById("soundText");
    const soundBtn = document.querySelector(".soundBtn");
    
    if(soundOn){
        if(soundIcon) soundIcon.textContent = "🔊";
        if(soundText) soundText.textContent = "Sound: ON";
        if(soundBtn) soundBtn.classList.remove("sound-off");
    } else {
        if(soundIcon) soundIcon.textContent = "🔇";
        if(soundText) soundText.textContent = "Sound: OFF";
        if(soundBtn) soundBtn.classList.add("sound-off");
    }
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
        setTimeout(() => spawnWave(), 1000);
    }
    
    gameLoop();
    saveGame();
}

function resetSave(){
    localStorage.removeItem("nebulaSave");
    location.reload();
}


/* ---------- GAME OVER ---------- */

function gameOver(){
    gameRunning = false;
    document.getElementById("gameOverScreen").style.display = "flex";
    document.getElementById("hud").style.display = "none";
    gameMusic.pause();
    menuMusic.play().catch(e => console.log("Menu music failed"));
}

function showGameOver(){
    gameRunning = false;
    const go = document.getElementById("gameOverScreen");
    if(go) go.style.display = "flex";
}

function restartGame(){
    document.getElementById("gameOverScreen").style.display = "none";
    
    // Reset game state
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

window.addEventListener('load', () => {
    console.log("=== DEBUG INFO ===");
    
    const shopBtn = document.querySelector('.shop-btn');
    const settingsBtn = document.querySelector('.settings-btn');
    const mainMenu = document.getElementById('main-menu');
    const shop = document.getElementById('shop');
    const settings = document.getElementById('settings');
    
    console.log("Shop button:", shopBtn);
    console.log("Settings button:", settingsBtn);
    console.log("Main menu:", mainMenu);
    console.log("Shop element:", shop);
    console.log("Settings element:", settings);
    
    if(shopBtn){
        shopBtn.addEventListener('click', (e) => {
            console.log("Shop button clicked!");
            e.preventDefault();
            e.stopPropagation();
            openShop();
        });
    }
    
    if(settingsBtn){
        settingsBtn.addEventListener('click', (e) => {
            console.log("Settings button clicked!");
            e.preventDefault();
            e.stopPropagation();
            openSettings();
        });
    }
    
    document.addEventListener('click', (e) => {
        console.log("Clicked element:", e.target.tagName, e.target.className, e.target.id);
    });
});
