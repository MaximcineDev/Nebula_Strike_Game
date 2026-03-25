/* =========================
   NEBULA STRIKE - FIXED
========================= */

/* ---------- IMAGES & SKINS ---------- */
const skins = [
    "assets/player.png",
    "assets/player2.png",
    "assets/player3.png",
    "assets/player4.png"
];

let currentSkin = 0;
const playerImg = new Image();
function updateSkin(){ playerImg.src = skins[currentSkin]; }
updateSkin();

const enemyImg = new Image(); enemyImg.src = "assets/enemy.png";
const bossImg = new Image(); bossImg.src = "assets/boss.png";
const bgImg = new Image(); bgImg.src = "assets/background.png";

const healthImg = new Image(); healthImg.src = "assets/ui/health.png";
const rapidImg = new Image(); rapidImg.src = "assets/ui/rapid.png";
const shieldImg = new Image(); shieldImg.src = "assets/ui/shield.png";

/* ---------- ENEMY TYPES ---------- */
const ENEMY_NORMAL = 0, ENEMY_FAST = 1, ENEMY_TANK = 2, ENEMY_SHOOTER = 3;

/* ---------- SOUNDS ---------- */
const shootSound = new Audio("assets/sounds/shoot.wav");
const explosionSound = new Audio("assets/sounds/explosion.wav");
const music = new Audio("assets/sounds/music.mp3");
music.loop = true; music.volume = 0.5;

/* ---------- CANVAS ---------- */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

document.getElementById("pauseBtn").onclick = () => {
    if(!gameRunning) return;
    paused = true;
    document.getElementById("pauseMenu").style.display = "flex";
};

/* ---------- PLAYER ---------- */
const player = { x:0, y:0, width:60, height:60, speed:6 };
let maxHearts = 5, health = maxHearts;
function resizeGame(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width/2;
    player.y = canvas.height-140;
}

/* ---------- GAME STATE ---------- */
let gameRunning=false, paused=false;
let score=0, level=1, coins=0;
let weaponLevel=1, shieldLevel=0, highestLevel=1, premium=false, damage=1;
let bullets=[], enemies=[], enemyBullets=[], powerups=[];
let boss=null, bossHP=0, bossMaxHP=0;
let fireRate=300, lastShot=0;
let rapidFire=false, rapidTimer=0, shieldActive=false, shieldTimer=0; let rapidAlpha = 1; let shieldAlpha = 1;
let soundOn=true, enemySpawnRate=1500, enemySpeed=2, enemyHPBase=2, maxEnemies=5;
let spawnTimer=0, lastReward=0;
let achievements=[], totalKills=0;

/* ---------- TOUCH INPUT ---------- */
let touchX=null, touchY=null;
canvas.addEventListener("touchstart", e=>{
    e.preventDefault();
    let t=e.touches[0];
    const rect=canvas.getBoundingClientRect();
    touchX=t.clientX-rect.left;
    touchY=t.clientY-rect.top;
    shoot();
},{passive:false});
canvas.addEventListener("touchmove", e=>{
    e.preventDefault();
    let t=e.touches[0];
    touchX=t.clientX; touchY=t.clientY;
},{passive:false});
canvas.addEventListener("touchend", e=>{ touchX=null; touchY=null; },{passive:false});

/* ---------- HUD ---------- */
function updateHUD(){
    const coinText=document.getElementById("coinText");
    const levelText=document.getElementById("levelText");
    const scoreText=document.getElementById("scoreText");
    if(coinText) coinText.innerText=coins;
    if(levelText) levelText.innerText="Lv "+level+" | W "+weaponLevel;
    if(scoreText) scoreText.innerText="Score: "+score;
    updateHeartsUI();
}
function updateHeartsUI(){
    const hearts=document.querySelectorAll("#hearts img");
    for(let i=0;i<hearts.length;i++){
        hearts[i].src=i<health?"assets/ui/heart-full.png":"assets/ui/heart-empty.png";
    }
}
// ---------- POWERUP HUD ----------
// ---------- POWERUP HUD ----------
const hudX = canvas.width - 120;
const hudY = 10;
const iconSize = 32;

if(rapidFire){
    ctx.globalAlpha = rapidAlpha;
    ctx.drawImage(rapidImg, hudX, hudY, iconSize, iconSize);
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("Rapid", hudX, hudY + iconSize + 14);
    ctx.globalAlpha = 1;
}

if(shieldActive){
    ctx.globalAlpha = shieldAlpha;
    ctx.drawImage(shieldImg, hudX, hudY + 50, iconSize, iconSize);
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("Shield", hudX, hudY + 50 + iconSize + 14);
    ctx.globalAlpha = 1;
}

/* ---------- KEYBOARD ---------- */
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

/* ---------- START GAME ---------- */
function startGame(){
    document.getElementById("main-menu").style.display="none";
    health=maxHearts;
    updateHUD();
    gameRunning=true;
    if(soundOn) music.play();
    startAutoShoot();
    gameLoop();
}
let autoShootStarted=false;
function startAutoShoot(){
    if(autoShootStarted) return;
    autoShootStarted=true;
    setInterval(()=>{ if(gameRunning && !paused) shoot(); },250);
}

/* ---------- SHOOT ---------- */
canvas.addEventListener("click", ()=>{ if(gameRunning) shoot(); });
function shoot(){
    let now=Date.now(); if(now-lastShot<fireRate) return; lastShot=now;
    if(soundOn){ shootSound.currentTime=0; shootSound.play(); }
    if(weaponLevel===1){ bullets.push({x:player.x+28,y:player.y,w:4,h:10,dx:0}); }
    else if(weaponLevel===2){ bullets.push({x:player.x+15,y:player.y,w:4,h:10,dx:-1}); bullets.push({x:player.x+40,y:player.y,w:4,h:10,dx:1}); }
    else if(weaponLevel===3){ bullets.push({x:player.x+10,y:player.y,w:5,h:12,dx:-1.5}); bullets.push({x:player.x+28,y:player.y,w:5,h:12,dx:0}); bullets.push({x:player.x+46,y:player.y,w:5,h:12,dx:1.5}); }
    else{ for(let i=-2;i<=2;i++){ bullets.push({x:player.x+28,y:player.y,w:6,h:14,dx:i*1.2}); } }
}

/* ---------- PLAYER ---------- */
function updatePlayer(){
    if(moveLeft) player.x-=player.speed; if(moveRight) player.x+=player.speed; if(moveUp) player.y-=player.speed; if(moveDown) player.y+=player.speed;
    if(touchX!==null){ player.x += (touchX-player.x-player.width/2)*0.2; player.y += (touchY-player.y-player.height/2)*0.2; }
}
function drawPlayer(){ ctx.drawImage(playerImg,player.x,player.y,player.width,player.height); }

/* ---------- BULLETS ---------- */
function updateBullets(){
    for(let i=bullets.length-1;i>=0;i--){
        let b=bullets[i]; b.y-=8; if(b.dx)b.x+=b.dx;
        ctx.fillStyle=weaponLevel===1?"cyan":weaponLevel===2?"lime":weaponLevel===3?"yellow":"orange";
        ctx.fillRect(b.x,b.y,b.w,b.h);
        // Enemy collision
        let hit=false;
        for(let j=enemies.length-1;j>=0;j--){
            let e=enemies[j];
            if(b.x<b.x+e.w && b.x+b.w>e.x && b.y<b.y+e.h && b.y+b.h>e.y){
                bullets.splice(i,1); e.hp--; if(e.hp<=0){ explosionSound.currentTime=0; explosionSound.play(); enemies.splice(j,1); let reward=5;if(e.type===ENEMY_FAST) reward=8;if(e.type===ENEMY_TANK) reward=15;if(e.type===ENEMY_SHOOTER) reward=12; coins+=reward; score+=reward*2; updateHUD(); saveGame(); if(Math.random()<0.3){ powerups.push({x:e.x,y:e.y,type:Math.floor(Math.random()*3)}); } } hit=true; break;
            }
        }
        if(hit) continue;
        // Boss collision
        if(boss && b.x<boss.x+boss.w && b.x+b.w>boss.x && b.y<boss.y+boss.h && b.y+b.h>boss.y){
            bullets.splice(i,1); bossHP-=damage; updateBossBar(); if(bossHP<=0){ boss=null; document.getElementById("bossBar").style.display="none"; coins+=50; score+=200; levelComplete(); } continue;
        }
        if(b.y<-20) bullets.splice(i,1);
    }
}

/* ---------- ENEMIES ---------- */
function spawnEnemy(){
    if(!gameRunning || boss) return; if(enemies.length>=maxEnemies) return;
    let type=ENEMY_NORMAL; let r=Math.random()+level*0.02;
    if(level>2 && r<0.25) type=ENEMY_FAST;
    if(level>4 && r<0.15) type=ENEMY_TANK;
    if(level>6 && r<0.15) type=ENEMY_SHOOTER;
    let enemy={x:Math.random()*(canvas.width-40),y:-40,w:40,h:40,type:type,hp:2+level,speed:enemySpeed,shootChance:0.01};
    if(type===ENEMY_FAST){ enemy.speed=enemySpeed+2; enemy.hp=1+level; }
    if(type===ENEMY_TANK){ enemy.speed=enemySpeed-1; enemy.hp=6+level*2; }
    if(type===ENEMY_SHOOTER){ enemy.speed=enemySpeed; enemy.hp=3+level; enemy.shootChance=0.03; }
    enemies.push(enemy);
}
function updateEnemies(){
    enemies.forEach(e=>{
        e.y+=e.speed;
        if(e.type===ENEMY_FAST) ctx.filter="hue-rotate(90deg)";
        else if(e.type===ENEMY_TANK) ctx.filter="brightness(0.6)";
        else if(e.type===ENEMY_SHOOTER) ctx.filter="hue-rotate(200deg)";
        else ctx.filter="none";
        ctx.drawImage(enemyImg,e.x,e.y,e.w,e.h);
        ctx.filter="none";
        if(Math.random()<e.shootChance) enemyBullets.push({x:e.x+e.w/2,y:e.y,w:4,h:10});
    });
}

/* ---------- ENEMY BULLETS ---------- */
function updateEnemyBullets(){
    for(let i=enemyBullets.length-1;i>=0;i--){
        let b=enemyBullets[i]; b.y+=5;
        ctx.fillStyle="red"; ctx.fillRect(b.x,b.y,b.w,b.h);
        if(b.x<player.x+player.width && b.x+b.w>player.x && b.y<player.y+player.height && b.y+b.h>player.y){
            enemyBullets.splice(i,1);
            if(!shieldActive){ health--; updateHUD(); }
            if(health<=0) gameOver();
        }
    }
}

/* ---------- POWERUPS ---------- */
function updatePowerups(){
    for(let i=powerups.length-1;i>=0;i--){
        let p = powerups[i];
        p.y += 2;

        // Draw the powerup
        let img = healthImg;
        if(p.type === 1) img = rapidImg;
        if(p.type === 2) img = shieldImg;
        ctx.drawImage(img, p.x, p.y, 32, 32);

        // Collision with player
        if(p.x < player.x + player.width &&
           p.x + 32 > player.x &&
           p.y < player.y + player.height &&
           p.y + 32 > player.y) {

            // Apply effect
            if(p.type === 0){ // Heart
                health = Math.min(health + 1, maxHearts);
            } else if(p.type === 1){ // Rapid Fire
                rapidFire = true;
                rapidTimer = 200; // lasts ~200 frames (~3s)
            } else if(p.type === 2){ // Shield
                shieldActive = true;
                shieldTimer = 200; // lasts ~200 frames (~3s)
            }

            // Remove collected powerup
            powerups.splice(i,1);

            // Update HUD
            updateHUD();
        }
    }
}

/* ---------- BOSS ---------- */
function spawnBoss(){ boss={x:canvas.width/2-80,y:-120,w:160,h:160,speed:1.5}; bossMaxHP=100+level*25; bossHP=bossMaxHP;
    document.getElementById("bossBar").style.display="block";
    document.getElementById("bossWarning").style.display="block";
    setTimeout(()=>{ document.getElementById("bossWarning").style.display="none"; },2000);
}
function updateBoss(){ if(!boss) return; if(boss.y<40) boss.y+=boss.speed; ctx.drawImage(bossImg,boss.x,boss.y,boss.w,boss.h); if(Math.random()<0.03) enemyBullets.push({x:boss.x+boss.w/2,y:boss.y+boss.h,w:6,h:12}); }
function updateBossBar(){ const bar=document.getElementById("bossHealth"); if(!bar) return; bar.style.width=(bossHP/bossMaxHP*100)+"%"; }

/* ---------- LOOP ---------- */
function gameLoop(){
    if(!gameRunning || paused) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(bgImg.complete) ctx.drawImage(bgImg,0,0,canvas.width,canvas.height);
    updatePlayer(); drawPlayer();
    updateBullets(); updateEnemies(); updateEnemyBullets(); updatePowerups(); updateBoss(); updateTimers();
    spawnTimer++; if(spawnTimer>enemySpawnRate/16){ spawnEnemy(); spawnTimer=0; }
    updateHUD(); requestAnimationFrame(gameLoop);
}

/* ---------- TIMERS ---------- */
function updateTimers(){

    if(rapidFire){
        rapidTimer--;

        fireRate = 100;

        // Fade out in last 60 frames (~1 sec at 60fps)
        if(rapidTimer < 60){
            rapidAlpha = rapidTimer / 60;
        } else {
            rapidAlpha = 1;
        }

        if(rapidTimer <= 0){
            rapidFire = false;
            fireRate = 300;
            rapidAlpha = 1;
        }

    }

    if(shieldActive){
        shieldTimer--;

        if(shieldTimer < 60){
            shieldAlpha = shieldTimer / 60;
        } else {
            shieldAlpha = 1;
        }

        if(shieldTimer <= 0){
            shieldActive = false;
            shieldAlpha = 1;
        }
    }

}

/* ---------- GAME SAVE ---------- */
function saveGame(){ localStorage.setItem("nebulaSave",JSON.stringify({coins,weaponLevel,maxHearts,shieldLevel,highestLevel,premium,soundOn,skin:currentSkin,lastReward,achievements,totalKills})); }
function loadGame(){ try{ const data=localStorage.getItem("nebulaSave"); if(!data) return; const save=JSON.parse(data); coins=save.coins||0; weaponLevel=save.weaponLevel||1; maxHearts=save.maxHearts||5; shieldLevel=save.shieldLevel||0; highestLevel=save.highestLevel||1; premium=save.premium||false; soundOn=save.soundOn??true; achievements=save.achievements||[]; totalKills=save.totalKills||0; currentSkin=save.skin||0; updateSkin(); lastReward=save.lastReward||0; }catch(e){ console.log("Save load error",e); } }

/* ---------- SHOP ---------- */
function buySkin(id){ if(coins<100) return; coins-=100; currentSkin=id; updateSkin(); saveGame(); }
function buyShield(){ if(coins>=50){ coins-=50; weaponLevel++; updateHUD(); saveGame(); } }
function buyWeapon(){ if(coins<150) return; coins-=150; weaponLevel++; if(weaponLevel>5) weaponLevel=5; saveGame(); updateHUD(); }
function buyHearts(){ if(coins>=50){ coins-=50; maxHearts++; updateHUD(); saveGame(); } }

/* ---------- LEVEL ---------- */
function levelComplete(){ gameRunning=false; document.getElementById("levelComplete").style.display="block"; }
function nextLevel(){
    document.getElementById("levelComplete").style.display="none"; gameRunning=true; level++; if(level>highestLevel) highestLevel=level;
    enemySpeed=2+level*0.3; enemyHPBase=2+Math.floor(level/2); maxEnemies=5+level; enemySpawnRate=Math.max(400,1500-level*100); fireRate=Math.max(80,300-level*10);
    enemies=[]; enemyBullets=[]; if(level%5===0) spawnBoss(); gameLoop(); saveGame();
}

/* ---------- GAME OVER ---------- */
function gameOver(){ gameRunning=false; document.getElementById("gameOverScreen").style.display="flex"; }
function restartGame(){ document.getElementById("gameOverScreen").style.display="none"; health=maxHearts; level=1; score=0; enemies=[]; enemyBullets=[]; bullets=[]; gameRunning=true; gameLoop(); }
function resumeGame(){ paused=false; document.getElementById("pauseMenu").style.display="none"; gameLoop(); }
function quitGame(){ saveGame(); music.pause(); paused=false; gameRunning=false; document.getElementById("pauseMenu").style.display="none"; document.getElementById("main-menu").style.display="block"; }

/* ---------- MISC ---------- */
function checkDailyReward(){ const now=Date.now(); const day=24*60*60*1000; if(now-lastReward>day){ coins+=100; lastReward=now; alert("Daily Reward +100 coins"); saveGame(); } }
function toggleSound(){ soundOn=!soundOn; if(!soundOn) music.pause(); else music.play(); saveGame(); }
function resetSave(){ localStorage.removeItem("nebulaSave"); location.reload(); }

/* ---------- PRELOAD SPLASH ---------- */
setTimeout(()=>{ const loading=document.getElementById("loadingText"); if(loading) loading.style.display="none"; },1000);

/* ---------- ON LOAD ---------- */
window.addEventListener("load", ()=>{
    loadGame(); resizeGame(); checkDailyReward();
    const splash=document.getElementById("splashScreen"); const menu=document.getElementById("main-menu");
    if(menu) menu.style.display="block";
    if(splash) setTimeout(()=>{ splash.style.display="none"; },800);
});
