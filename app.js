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
enemyFastImg.src = "assets/enemy-fast.png";

const enemyTankImg = new Image();
enemyTankImg.src = "assets/enemy-tank.png";

const enemyShooterImg = new Image();
enemyShooterImg.src = "assets/enemy-shooter.png";

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

document.getElementById("pauseBtn").onclick = () => {

    if(!gameRunning) return;

    paused = true;

    document.getElementById("pauseMenu").style.display = "flex";

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

    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;

    canvas.style.width =
        window.innerWidth + "px";

    canvas.style.height =
        window.innerHeight + "px";

    player.x =
        canvas.width / 2;

    player.y =
        canvas.height - 120;

}
window.addEventListener(
    "resize",
    resizeGame
);

window.addEventListener(
    "orientationchange",
    resizeGame
);


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

let enemySpawnRate = 1500;
let enemySpeed = 2;
let enemyHPBase = 2;
let maxEnemies = 5;

let spawnTimer = 0;

let lastReward = 0;

let achievements = [];
let totalKills = 0;

let hitFlash = 0;
let screenShake = 0;

/* ---------- TOUCH ---------- */

let touchX = null;
let touchY = null;

canvas.addEventListener(
    "touchstart",
    e => {

        e.preventDefault();

        const t = e.touches[0];

        player.x = t.clientX;
        player.y = t.clientY;

    },
    { passive:false }
);

canvas.addEventListener(
    "touchmove",
    e => {

        e.preventDefault();

        const t = e.touches[0];

        player.x +=
            (t.clientX - player.x) * 0.4;

        player.y +=
            (t.clientY - player.y) * 0.4;

    },
    { passive:false }
);

canvas.addEventListener("touchend", e=>{

    touchX = null;
    touchY = null;

},{passive:false});


function updateHUD(){

    const coinText =
        document.getElementById("coinText");

    const levelText =
        document.getElementById("levelText");

    const scoreText =
        document.getElementById("scoreText");

    if(coinText)
        coinText.innerText = coins;

    if(levelText)
        levelText.innerText = "Lv " + level;

    if(scoreText)
        scoreText.innerText =
            "Score: " + score;

}

function updateHeartsUI(){

    const hearts =
        document.querySelectorAll("#hearts img");

    for(let i=0;i<hearts.length;i++){

        if(i < health){

            hearts[i].src =
            "assets/ui/heart-full.png";

        }else{

            hearts[i].src =
            "assets/ui/heart-empty.png";

        }

    }

}

function coinPulse(){

    const coinBox =
        document.getElementById("coinBox");

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

});

window.addEventListener("keyup",e=>{

    if(e.key==="ArrowLeft") moveLeft=false;
    if(e.key==="ArrowRight") moveRight=false;
    if(e.key==="ArrowUp") moveUp=false;
    if(e.key==="ArrowDown") moveDown=false;

});


/* ---------- START ---------- */

function startGame(){

    const menu =
        document.getElementById("main-menu");

    const canvasEl =
        document.getElementById("gameCanvas");

    const hud =
        document.getElementById("hud");

    if(menu) menu.style.display = "none";

    if(canvasEl) canvasEl.style.display = "block";

    if(hud) hud.style.display = "flex";

    health = maxHearts;

    gameRunning = true;

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
        gameMusic.play();

    }

}


/* ---------- SHOOT ---------- */

canvas.addEventListener("click",()=>{

    if(gameRunning){

        shoot();

    }

});

function shoot(){

    let now = Date.now();

    if(now - lastShot < fireRate) return;

    lastShot = now;

    if(soundOn){
        shootSound.currentTime = 0;
        shootSound.play();
    }


    // LEVEL 1
    if(weaponLevel === 1){

        bullets.push({
            x: player.x + 28,
            y: player.y,
            w: 4,
            h: 10,
            dx: 0
        });

    }


    // LEVEL 2 (double shot)
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


    // LEVEL 3 (triple shot)
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


    // LEVEL 4+ (spread)
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


/* ---------- ENEMY SPAWN ---------- */

function spawnEnemy(){

    if(!gameRunning) return;
    if(boss) return;

    if(enemies.length >= 30) return;

    let type = ENEMY_NORMAL;

    let r = Math.random() + level * 0.02;

    if(level > 2 && r < 0.25)
        type = ENEMY_FAST;

    if(level > 4 && r < 0.15)
        type = ENEMY_TANK;

    if(level > 6 && r < 0.15)
        type = ENEMY_SHOOTER;


    let enemy = {

        x: Math.random() * (canvas.width - 40),
        y: -40,

        w: 40,
        h: 40,

        type: type,

        hp: 2 + level,
        speed: enemySpeed,
        shootChance: 0.01

    };


    // FAST
    if(type === ENEMY_FAST){

        enemy.speed = enemySpeed + 2;
        enemy.hp = 1 + level;

    }

    // TANK
    if(type === ENEMY_TANK){

        enemy.speed = enemySpeed - 1;
        enemy.hp = 6 + level * 2;

    }

    // SHOOTER
    if(type === ENEMY_SHOOTER){

        enemy.speed = enemySpeed;
        enemy.hp = 3 + level;
        enemy.shootChance = 0.03;

    }

    enemies.push(enemy);

}


/* ---------- BOSS SPAWN ---------- */
function spawnBoss(){

    boss = {

        x: canvas.width / 2 - 80,
        y: -120,

        w: 160,
        h: 160,

        speed: 1.5

    };

    bossMaxHP = 100 + level * 25;
    bossHP = bossMaxHP;

    document.getElementById("bossBar").style.display = "block";
    document.getElementById("bossWarning").style.display = "block";

    setTimeout(()=>{

        document.getElementById("bossWarning").style.display = "none";

    },2000);

}


function updateBoss(){

    if(!boss) return;

    if(boss.y < 40){
        boss.y += boss.speed;
    }

    ctx.drawImage(
        bossImg,
        boss.x,
        boss.y,
        boss.w,
        boss.h
    );

    if(Math.random() < 0.03){

        enemyBullets.push({

            x: boss.x + boss.w/2,
            y: boss.y + boss.h,

            w: 6,
            h: 12

        });

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

        ctx.drawImage(
            coinImg,
            c.x,
            c.y,
            16,
            16
        );

        if(c.life <= 0){

            coinFX.splice(i,1);

        }

    }

}


/* ---------- LOOP ---------- */

function gameLoop(){

   if(boss && boss.hp <= 0){
       boss = null;
   }
   
   if(!gameRunning || paused) return;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(screenShake > 0){

        ctx.save();

        ctx.translate(
            Math.random()*10-5,
            Math.random()*10-5
        );

        screenShake--;

    }

    if(bgImg.complete){

        ctx.drawImage(
            bgImg,
            0,
            0,
            canvas.width,
            canvas.height
        );
        
       drawStars();

    } 

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

    spawnTimer++;

    if(spawnTimer > enemySpawnRate/16){

        spawnEnemy();

        spawnTimer = 0;

    }

    updateHUD();

    if(screenShake > 0){
        ctx.restore();
    }
    requestAnimationFrame(gameLoop);

    if(hitFlash > 0){

        ctx.fillStyle = "rgba(255,0,0,0.3)";
        ctx.fillRect(0,0,canvas.width,canvas.height);

        hitFlash--;

    }

}


/* ---------- PLAYER ---------- */

function updatePlayer(){

    if(moveLeft) player.x-=player.speed;
    if(moveRight) player.x+=player.speed;
    if(moveUp) player.y-=player.speed;
    if(moveDown) player.y+=player.speed;

    if(touchX!==null){

        player.x += (touchX-player.x-player.width/2)*0.2;
        player.y += (touchY-player.y-player.height/2)*0.2;

    }

}


function drawPlayer(){

    ctx.drawImage(
        playerImg,
        player.x,
        player.y,
        player.width,
        player.height
    );

    ctx.fillStyle = "cyan";

    ctx.fillRect(
        player.x + player.width/2 - 3,
        player.y + player.height,
        6,
        10
    );

}


/* ---------- BULLETS ---------- */

function updateBullets(){

    for(let i = bullets.length - 1; i >= 0; i--){

        let b = bullets[i];

        b.y -= 8;

        if(b.dx){
            b.x += b.dx;
        }


        // bullet color

        if(weaponLevel === 1)
            ctx.fillStyle = "cyan";
        else if(weaponLevel === 2)
            ctx.fillStyle = "lime";
        else if(weaponLevel === 3)
            ctx.fillStyle = "yellow";
        else
            ctx.fillStyle = "orange";


        ctx.fillRect(b.x,b.y,b.w,b.h);


        // =========================
        // HIT ENEMIES
        // =========================

        let hitSomething = false;

        for(let j = enemies.length - 1; j >= 0; j--){

            let e = enemies[j];

            if(

                b.x < e.x + e.w &&
                b.x + b.w > e.x &&
                b.y < e.y + e.h &&
                b.y + b.h > e.y

            ){

                bullets.splice(i,1);

                e.hp--;

                if(e.hp <= 0){

                    explosionSound.currentTime = 0;
                    explosionSound.play();

                    explosions.push({

                        x:e.x,
                        y:e.y,
                        frame:0

                    });
                    
                    enemies.splice(j,1);


                    // ===== REWARD BY TYPE =====

                    let reward = 5;

                    if(e.type === ENEMY_FAST)
                        reward = 8;

                    if(e.type === ENEMY_TANK)
                        reward = 15;

                    if(e.type === ENEMY_SHOOTER)
                        reward = 12;

                    coins += reward;
                    coinPulse();
                    score += reward * 2;

                    for(let k=0;k<reward;k++){

                        coinFX.push({

                            x:e.x,
                            y:e.y,
                            vx:(Math.random()-0.5)*4,
                            vy:-Math.random()*3,
                            life:40

                        });

                    }

                    updateHUD();
                    try{
                       saveGame();
                    }catch(e){
                       console.log(e);
                    }


                    // ===== POWERUP =====

                    if(Math.random() < 0.3){

                        powerups.push({
                            x: e.x,
                            y: e.y,
                            type: Math.floor(Math.random()*3)
                        });

                    }

                }

                hitSomething = true;
                break;

            }

        }


        if(hitSomething) continue;


        // =========================
        // HIT BOSS (OUTSIDE LOOP)
        // =========================

        if(boss){

            if(

                b.x < boss.x + boss.w &&
                b.x + b.w > boss.x &&
                b.y < boss.y + boss.h &&
                b.y + b.h > boss.y

            ){

                bullets.splice(i,1);

                bossHP -= damage;

                updateBossBar();

                if(boss && boss.hp <= 0){

                    boss = null;

                    const bar =
                    document.getElementById("bossBar");

                    if(bar)
                        bar.style.display = "none";

                    coins += 50;

                    saveGame();

                }

                continue;

            }

        }


        // remove offscreen

        if(b.y < -20){

            bullets.splice(i,1);

        }

    }

}


function updateExplosions(){

    for(let i=explosions.length-1;i>=0;i--){

        let ex = explosions[i];

        ctx.drawImage(
            explosionImg,
            ex.x,
            ex.y,
            40,
            40
        );

        ex.frame++;

        if(ex.frame > 10){

            explosions.splice(i,1);

        }

    }

}


function updateBossBar(){

    if(!boss) return;

    const bar =
        document.getElementById("bossBar");

    const hp =
        document.getElementById("bossHealth");

    if(!bar || !hp) return;

    if(boss.maxHp <= 0) return;

    bar.style.display = "block";

    hp.style.width =
        (boss.hp / boss.maxHp * 100) + "%";

}


/* ---------- ENEMIES ---------- */

function updateEnemies(){

    enemies.forEach(e=>{

        e.y += e.speed;

        if(e.type === ENEMY_FAST)
            ctx.filter = "hue-rotate(90deg)";

        else if(e.type === ENEMY_TANK)
            ctx.filter = "brightness(0.6)";

        else if(e.type === ENEMY_SHOOTER)
            ctx.filter = "hue-rotate(200deg)";

        else
            ctx.filter = "none";

        // draw enemy

        let img = enemyImg;

        if(e.type === ENEMY_FAST)
            img = enemyFastImg;

        if(e.type === ENEMY_TANK)
            img = enemyTankImg;

        if(e.type === ENEMY_SHOOTER)
            img = enemyShooterImg;

        ctx.drawImage(
            img,
            e.x,
            e.y,
            e.w,
            e.h
        );

        // shooting

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

        b.y+=5;

        ctx.fillStyle="red";
        ctx.fillRect(b.x,b.y,b.w,b.h);

        if(

            b.x<player.x+player.width &&
            b.x+b.w>player.x &&
            b.y<player.y+player.height &&
            b.y+b.h>player.y

        ){

            enemyBullets.splice(i,1);

            if(!shieldActive){

                hitFlash = 5;
                screenShake = 6;
               
                health--;

                updateHUD();

            }

            if(health<=0){

                gameOver();

            }

        }

    }

}


/* ---------- POWERUPS ---------- */

function updatePowerups(){

    for(let i=powerups.length-1;i>=0;i--){

        let p=powerups[i];

        p.y+=2;

        let img=healthImg;

        if(p.type===1) img=rapidImg;
        if(p.type===2) img=shieldImg;

        ctx.drawImage(img,p.x,p.y,32,32);

    }

}


/* ---------- TIMERS ---------- */

function updateTimers(){

    if(rapidFire){

        rapidTimer--;

        fireRate=100;

        if(rapidTimer<=0){

            rapidFire=false;
            fireRate=300;

        }

    }

}


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

    };

    localStorage.setItem(
        "nebulaSave",
        JSON.stringify(saveData)
    );

}

function loadGame(){

    try{

        const data =
        localStorage.getItem("nebulaSave");

        if(!data) return;

        const save =
        JSON.parse(data);

        coins = save.coins || 0;
        weaponLevel = save.weaponLevel || 1;
        maxHearts = save.maxHearts || 5;
        shieldLevel = save.shieldLevel || 0;
        highestLevel = save.highestLevel || 1;
        premium = save.premium || false;

        soundOn = save.soundOn ?? true;

        achievements = save.achievements || achievements;
        totalKills = save.totalKills || 0;

        currentSkin = save.skin || 0;
        updateSkin();

        lastReward = save.lastReward || 0;

    }catch(e){

        console.log("Save load error", e);

    }

   menuMusic.play();

}


function buySkin(id){

    if(coins < 100) return;

    coins -= 100;

    currentSkin = id;

    updateSkin();

    saveGame();

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

    if(weaponLevel > 5)
        weaponLevel = 5;

    saveGame();
    updateHUD();

}

function buyPremiumWeapon(){

    if(!premium){

        alert("Premium required");
        return;

    }

    weaponLevel = 5;

}


function buyHearts(){

    if(coins >= 50){

        coins -= 50;
        maxHearts++;

       updateHUD(); 
       saveGame();

    }

}

function animateShopButtons(){

    const btns =
        document.querySelectorAll(".shopBtn");

    btns.forEach(b=>{

        b.style.transform =
            "scale(1.1)";

        setTimeout(()=>{

            b.style.transform =
                "scale(1)";

        },200);

    });

}

function levelComplete(){

    gameRunning = false;

    document.getElementById(
        "levelComplete"
    ).style.display = "block";

}

function nextLevel(){

    document.getElementById(
        "levelComplete"
    ).style.display = "none";

    gameRunning = true;

    level++;

    if(level > highestLevel){
        highestLevel = level;
    }

    /* difficulty scaling */

    enemySpeed = 2 + level * 0.3;

    enemyHPBase = 2 + Math.floor(level / 2);

    maxEnemies = 5 + level;

    enemySpawnRate = Math.max(
        400,
        1500 - level * 100
    );

    fireRate = Math.max(
        80,
        300 - level * 10
    );

    /* reset */

    enemies = [];
    enemyBullets = [];

    if(level % 5 === 0){
        spawnBoss();
    }
    
    gameLoop();

    checkAchievements();
    saveGame();

}

function resetSave(){

    localStorage.removeItem("nebulaSave");

    location.reload();

}

/* ---------- GAME OVER ---------- */

function gameOver(){

    gameRunning = false;

    document.getElementById(
        "gameOverScreen"
    ).style.display = "flex";

    document.getElementById(
       "hud"
    ).style.display = "none";

    gameMusic.pause();
    menuMusic.play();

}

function restartGame(){

    document.getElementById(
        "gameOverScreen"
    ).style.display = "none";

    document.getElementById(
       "hud"
    ).style.display = "none";

    health = maxHearts;
    level = 1;
    score = 0;

    enemies = [];
    enemyBullets = [];
    bullets = [];

    gameRunning = true;

    gameLoop();

}

function resumeGame(){

    paused = false;

    document.getElementById("pauseMenu").style.display = "none";

    gameLoop();

}

function quitGame(){

    saveGame();

    gameMusic.pause();

    paused = false;
    gameRunning = false;

    document.getElementById("pauseMenu").style.display = "none";

    document.getElementById("main-menu").style.display = "block";

}


function checkDailyReward(){

    let last =
        localStorage.getItem("dailyReward");

    let today =
        new Date().toDateString();

    if(last !== today){

        coins += 20;

        localStorage.setItem(
            "dailyReward",
            today
        );

        console.log("Daily reward given");

    }
   
}

function toggleSound(){

    soundOn = !soundOn;

    if(!soundOn){

        menuMusic.pause();
        gameMusic.pause();

    }else{

        if(gameRunning){
            gameMusic.play();
        }else{
            menuMusic.play();
        }

    }

    saveGame();

}

setTimeout(()=>{

    const loading =
    document.getElementById("loadingText");

    if(loading){

        loading.style.display = "none";

    }

},1000);


function openShop(){

    const shop =
        document.getElementById("shop");

    if(!shop) return;

    shop.style.display = "flex";

    animateShopButtons();

}

function openShop(){

    const shop =
        document.getElementById("shop");

    if(!shop) return;

    shop.style.display = "flex";

    animateShopButtons();

}

function openSettings(){

    document.getElementById("settingsMenu").style.display = "flex";

}

function closeSettings(){

    document.getElementById("settingsMenu").style.display = "none";

}

window.addEventListener("load", () => {

    loadGame();

    resizeGame();

    checkDailyReward();

    const splash =
        document.getElementById("splashScreen");

    const menu =
        document.getElementById("main-menu");

    if(menu){

        menu.style.display = "flex";

    }

    if(splash){

        setTimeout(()=>{

            splash.style.display = "none";

        }, 800);

    }

});
