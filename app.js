/* =========================
   NEBULA STRIKE
========================= */


/* ---------- IMAGES ---------- */

const playerImg = new Image();

function updateSkin(){

    playerImg.src = skins[currentSkin];

}

const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";

const bossImg = new Image();
bossImg.src = "assets/boss.png";

const bgImg = new Image();
bgImg.src = "assets/background.png";

const skins = [

    "assets/player.png",
    "assets/player2.png",
    "assets/player3.png",
    "assets/player4.png"

];

let currentSkin = 0;


/* ---------- POWERUPS ---------- */

const healthImg = new Image();
healthImg.src = "assets/ui/health.png";

const rapidImg = new Image();
rapidImg.src = "assets/ui/rapid.png";

const shieldImg = new Image();
shieldImg.src = "assets/ui/shield.png";


/* ---------- SOUNDS ---------- */

const shootSound = new Audio("sounds/shoot.wav");
const explosionSound = new Audio("sounds/explosion.wav");

const music = new Audio("sounds/music.mp3");

music.loop = true;
music.volume = 0.5;


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

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    player.x = canvas.width / 2;
    player.y = canvas.height - 140;

}


/* ---------- GAME STATE ---------- */

let gameRunning = false;
let paused = false;

let score = 0;
let level = 1;

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
let maxHearts = 5;
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


/* ---------- TOUCH ---------- */

let touchX = null;
let touchY = null;

canvas.addEventListener("touchstart", e=>{

    e.preventDefault();

    let t = e.touches[0];

    const rect = canvas.getBoundingClientRect();

    touchX = t.clientX - rect.left;
    touchY = t.clientY - rect.top;

    shoot();

},{passive:false});

canvas.addEventListener("touchmove", e=>{

    e.preventDefault();

    let t = e.touches[0];

    const rect = canvas.getBoundingClientRect();

    touchX = t.clientX;
    touchY = t.clientY;

},{passive:false});

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


    updateHeartsUI();

}

function updateHeartsUI(){

    const hearts =
        document.querySelectorAll("#hearts img");

    for(let i=0;i<hearts.length;i++){

        if(i < health){

            hearts[i].src =
            "ui/heart-full.png";

        }else{

            hearts[i].src =
            "ui/heart-empty.png";

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

});

window.addEventListener("keyup",e=>{

    if(e.key==="ArrowLeft") moveLeft=false;
    if(e.key==="ArrowRight") moveRight=false;
    if(e.key==="ArrowUp") moveUp=false;
    if(e.key==="ArrowDown") moveDown=false;

});


/* ---------- START ---------- */

function startGame(){

    document.getElementById("main-menu").style.display="none";

    health = maxHearts;

    updateHUD();

    gameRunning = true;

    if(soundOn){
        music.play();
    }

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

}


/* ---------- SHOOT ---------- */

canvas.addEventListener("click",()=>{

    if(gameRunning){

        shoot();

    }

});

function shoot(){

    let now = Date.now();

    if(now-lastShot<fireRate) return;

    lastShot=now;

    shootSound.currentTime=0;
    shootSound.play();

    bullets.push({

        x:player.x+25,
        y:player.y,

        w:4,
        h:10

    });

   let speed = 8 + level * 0.2;
   b.y -= speed;
}


/* ---------- ENEMY SPAWN ---------- */

function spawnEnemy(){

    if(!gameRunning) return;
    if(boss) return;

    if(enemies.length >= maxEnemies) return;

    enemies.push({

        x: Math.random() * (canvas.width - 40),
        y: -40,

        w: 40,
        h: 40,

        hp: enemyHPBase + level

    });

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

/* ---------- LOOP ---------- */

function gameLoop(){

    if(!gameRunning || paused) return;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(bgImg.complete){

        ctx.drawImage(
            bgImg,
            0,
            0,
            canvas.width,
            canvas.height
        );

    } 

    updatePlayer();
    drawPlayer();

    updateBullets();
    updateEnemies();
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
   
    requestAnimationFrame(gameLoop);

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

}


/* ---------- BULLETS ---------- */

function updateBullets(){

    for(let i=bullets.length-1;i>=0;i--){

        let b=bullets[i];

        b.y-=8;

        ctx.fillStyle="cyan";
        ctx.fillRect(b.x,b.y,b.w,b.h);

        for(let j=enemies.length-1;j>=0;j--){

            let e=enemies[j];

            if(

                b.x<e.x+e.w &&
                b.x+b.w>e.x &&
                b.y<e.y+e.h &&
                b.y+b.h>e.y

            ){

                bullets.splice(i,1);

                e.hp--;

                if(e.hp<=0){

                    explosionSound.currentTime = 0;
                    explosionSound.play();

                    enemies.splice(j,1);

                    coins += 5 + level;
                    score += 10 * level;

                    updateHUD();

                    saveGame();

                    if(Math.random()<0.3){

                        powerups.push({
                            x:e.x,
                            y:e.y,
                            type:Math.floor(Math.random()*3)
                        });

                    }

                }

                break;

            }
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

                   if(bossHP <= 0){

                       boss = null;

                       document.getElementById("bossBar").style.display = "none";

                       coins += 50;

                       levelComplete();

                   }

                   break;

               }

           }

        }

    }

}

function updateBossBar(){

    const bar =
        document.getElementById("bossHealth");

    if(!bar) return;

    const percent =
        (bossHP / bossMaxHP) * 100;

    bar.style.width =
        percent + "%";

}

/* ---------- ENEMIES ---------- */

function updateEnemies(){

    enemies.forEach(e=>{

        e.y += enemySpeed;

        ctx.drawImage(
            enemyImg,
            e.x,
            e.y,
            e.w,
            e.h
        );

        if(Math.random()<0.01){

            enemyBullets.push({

                x:e.x+10,
                y:e.y,

                w:4,
                h:10

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
        soundOn: soundOn

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
        weaponLevel++;

       updateHUD(); 
       saveGame();

    }

}

function buyWeapon(){

    if(coins >= 150){

        coins -= 150;
        weaponLevel++;

       updateHUD(); 
       saveGame();

    }

}

function buyHearts(){

    if(coins >= 50){

        coins -= 50;
        maxHearts++;

       updateHUD(); 
       saveGame();

    }

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

    gameRunning=false;

    alert("Game Over");

    location.reload();

}


function resumeGame(){

    paused = false;

    document.getElementById("pauseMenu").style.display = "none";

    gameLoop();

}

function quitGame(){

    saveGame();

    music.pause();

    paused = false;
    gameRunning = false;

    document.getElementById("pauseMenu").style.display = "none";

    document.getElementById("main-menu").style.display = "block";

}


function checkDailyReward(){

    const now = Date.now();

    const day = 24 * 60 * 60 * 1000;

    if(now - lastReward > day){

        coins += 100;

        lastReward = now;

        alert("Daily Reward +100 coins");

        saveGame();

    }

}

function toggleSound(){

    soundOn = !soundOn;

    if(!soundOn){

        music.pause();

    }else{

        music.play();

    }

    saveGame();

}

setTimeout(()=>{

    const loading =
    document.getElementById("loading");

    if(loading){

        loading.style.display = "none";

    }

},1000);


window.addEventListener("load", () => {

    loadGame();

    resizeGame();

    checkDailyReward();

    const splash =
        document.getElementById("splashScreen");

    const menu =
        document.getElementById("main-menu");

    if(menu){
        menu.style.display = "block";
    }

    if(splash){

        setTimeout(()=>{

            splash.style.display = "none";

        }, 800);

    }

});
