/* =========================
        NEBULA STRIKE
   ========================= */

let canvas, ctx;
let score = 0;
let coins = 0;
let running = false;
let playerX = 0;
let bullets = [], enemies = [], explosions = [];
let stars = [], stars2 = [], stars3 = [];
let boss = null;
let shake = 0;
let particles = [];
let bossBullets = [];
let level = 1;
let combo = 0, comboTimer = 0;

const SAVE_KEY = "nebula_save";

/* ---------- IMAGES ---------- */
const playerImg = new Image(); playerImg.src = "./assets/player.png";
const enemyImg = new Image(); enemyImg.src = "./assets/enemy.png";
const bossImg = new Image(); bossImg.src = "./assets/boss.png";
const explosionImg = new Image(); explosionImg.src = "./assets/explosion.png";
const starImg = new Image(); starImg.src = "./assets/star.png";

/* ---------- UI ASSETS ---------- */
const coinIcon = new Image(); coinIcon.src = "./assets/ui/coin-icon.png";
const lockedLevel = new Image(); lockedLevel.src = "./assets/ui/locked-level.png";
const premiumBadge = new Image(); premiumBadge.src = "./assets/ui/premium-badge.png";
const premiumScreen = new Image(); premiumScreen.src = "./assets/ui/premium-screen.png";
const shopPremium = new Image(); shopPremium.src = "./assets/ui/shop-premium.png";
const upgradeButton = new Image(); upgradeButton.src = "./assets/ui/upgrade-button.png";

/* ---------- SOUND ---------- */
const boomSound = new Audio("./assets/sounds/explosion.wav");
const shootSound = new Audio("./assets/sounds/shoot.wav");

/* ---------- SPLASH ---------- */
window.onload = function() {
    setTimeout(() => {
        let splash = document.getElementById("splash");
        if(splash) splash.style.display = "none";
    }, 1000);
};

document.addEventListener("touchstart", () => {}, { passive: true });

/* ---------- SAVE ---------- */
function loadSave() {
    let s = localStorage.getItem(SAVE_KEY);
    if(!s) return { coins: 0, upgrades: {} };
    return JSON.parse(s);
}
function saveGame(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}
let SAVE = loadSave();
coins = SAVE.coins || 0;
SAVE.upgrades = SAVE.upgrades || { laser: false, shield: false, skin: false };

/* ---------- START ---------- */
function startGame() {
    document.getElementById("main-menu").style.display = "none";
    running = true;
    init();
}

function openAchievements() { window.location.href = "./achievements.html"; }
function screenShake(power) { shake = power; }

/* ---------- SHOOT ---------- */
function shoot() {
    if(!running) return;
    bullets.push({ x: playerX, y: canvas.height - 80 });
    playSound(shootSound);
}

function playSound(s) {
    if(!s) return;
    s.currentTime = 0;
    s.play().catch(() => {});
}

/* ---------- INIT ---------- */
function init() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    resize();
    requestAnimationFrame(loop);

    for(let i=0;i<40;i++) stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height });
    for(let i=0;i<30;i++) stars2.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height });
    for(let i=0;i<20;i++) stars3.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height });

    setupRewardedAd();

    // Canvas click for upgrade button
    canvas.addEventListener('click', handleCanvasClick);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
window.addEventListener("mousemove", e => playerX = e.clientX);
window.addEventListener("touchmove", e => playerX = e.touches[0].clientX);

/* ---------- LOOP ---------- */
function loop() {
    if(!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
}

/* ---------- UPDATE ---------- */
function update() {
    score++;
    coins += 0.1;
    SAVE.coins = Math.floor(coins);
    saveGame(SAVE);

    if(shake>0) shake--;

    // bullets
    bullets.forEach(b=>{b.y-=10;});
    bullets = bullets.filter(b=>b.y>0);

    // spawn enemies
    if(Math.random() < 0.02 + level*0.002) {
        enemies.push({ x: Math.random()*canvas.width, y:-20, type: Math.floor(Math.random()*3) });
    }

    enemies.forEach(e=>{
        if(e.type===0) e.y+=3;
        if(e.type===1){ e.y+=2; e.x+=Math.sin(e.y*0.05)*2; }
        if(e.type===2) e.y+=4;
    });

    // bullet hit
    bullets.forEach(b=>{
        enemies.forEach(e=>{
            if(Math.abs(b.x-e.x)<20 && Math.abs(b.y-e.y)<20){
                explosions.push({ x:e.x, y:e.y, frame:0 });
                screenShake(10);
                for(let i=0;i<5;i++) particles.push({ x:e.x, y:e.y, vx:Math.random()*4-2, vy:Math.random()*4-2, life:20 });
                playSound(boomSound);
                score+=10; coins+=1;
                e.y=9999;
            }
        });
    });

    // boss spawn
    if(score>500 && !boss) boss={x:canvas.width/2, y:50, hp:30};
    if(boss){
        bullets.forEach(b=>{if(Math.abs(b.x-boss.x)<50 && Math.abs(b.y-boss.y)<50) boss.hp--;});
        if(boss.hp<=0){
            explosions.push({x:boss.x, y:boss.y, frame:0});
            screenShake(20);
            boss=null;
            score+=200; coins+=50;
        }
        if(Math.random()<0.05) bossBullets.push({x:boss.x, y:boss.y, vy:5});
    }

    bossBullets.forEach(b=>{b.y+=b.vy;});
    bossBullets=bossBullets.filter(b=>b.y<canvas.height);

    // explosions
    explosions.forEach(ex=>{ex.frame++;});
    explosions = explosions.filter(ex=>ex.frame<20);

    // stars
    stars.forEach(s=>{s.y+=1;if(s.y>canvas.height)s.y=0;});
    stars2.forEach(s=>{s.y+=2;if(s.y>canvas.height)s.y=0;});
    stars3.forEach(s=>{s.y+=3;if(s.y>canvas.height)s.y=0;});

    // particles
    particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life--;});
    particles = particles.filter(p=>p.life>0);

    if(score>level*500) level++;
}

/* ---------- SHOP / UPGRADES ---------- */
function handleCanvasClick(e){
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Upgrade button area (bottom-right)
    if(clickX >= canvas.width-130 && clickX <= canvas.width-10 &&
       clickY >= canvas.height-60 && clickY <= canvas.height-10){
        buyItem('laser', 50);
    }
}

function buyItem(item, price){
    if(SAVE.upgrades[item]){
        alert(item + " already purchased");
        return;
    }
    if(coins>=price){
        coins-=price;
        SAVE.coins = Math.floor(coins);
        SAVE.upgrades[item]=true;
        saveGame(SAVE);
        alert("Purchased " + item + "!");
    } else {
        alert("Not enough coins");
    }
}

/* ---------- REWARD PLAYER ---------- */
function rewardPlayer(coinsEarned=100){
    coins+=coinsEarned;
    SAVE.coins=Math.floor(coins);
    saveGame(SAVE);
    const coinDisplay = document.getElementById("coin-display");
    if(coinDisplay){
        coinDisplay.innerText = Math.floor(coins);
        coinDisplay.style.transform='scale(1.2)';
        setTimeout(()=>{coinDisplay.style.transform='scale(1)';},200);
    }
}

/* ---------- REWARDED AD SETUP ---------- */
function setupRewardedAd(){
    const watchBtn = document.getElementById('watch-ad-btn');
    const adContainer = document.getElementById('rewarded-ad');
    if(!watchBtn || !adContainer) return;
    watchBtn.addEventListener('click', ()=>{
        adContainer.style.display='block';
        setTimeout(()=>{
            adContainer.style.display='none';
            rewardPlayer(100);
            alert('You earned +100 Coins!');
        }, 3000);
    });
}

/* ---------- DRAW HUD & UI ---------- */
function draw() {
    if(!ctx) return;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Stars background
    stars.forEach(s=>{ctx.fillStyle='white'; ctx.fillRect(s.x,s.y,2,2);});
    stars2.forEach(s=>{ctx.fillStyle='lightblue'; ctx.fillRect(s.x,s.y,2,2);});
    stars3.forEach(s=>{ctx.fillStyle='cyan'; ctx.fillRect(s.x,s.y,2,2);});

    // Player
    ctx.drawImage(playerImg, playerX-25, canvas.height-80, 50, 50);

    // Bullets
    bullets.forEach(b=>{ctx.fillStyle='yellow'; ctx.fillRect(b.x-2,b.y-10,4,10);});

    // Enemies
    enemies.forEach(e=>{ctx.drawImage(enemyImg,e.x-20,e.y-20,40,40);});

    // Boss
    if(boss) ctx.drawImage(bossImg,boss.x-50,boss.y-50,100,100);

    // Explosions
    explosions.forEach(ex=>{ctx.drawImage(explosionImg, ex.x-25, ex.y-25, 50, 50);});

    // Particles
    particles.forEach(p=>{ctx.fillStyle='orange'; ctx.fillRect(p.x,p.y,2,2);});

    // Boss bullets
    bossBullets.forEach(b=>{ctx.fillStyle='red'; ctx.fillRect(b.x-3,b.y,6,12);});

    // HUD / UI
    // Coins top-left
    ctx.drawImage(coinIcon, 10, 10, 32, 32);
    ctx.fillStyle='gold';
    ctx.font='20px Arial';
    ctx.fillText(Math.floor(coins), 50, 32);

    // Premium badge top-right
    ctx.drawImage(premiumBadge, canvas.width-50, 10, 40, 40);

    // Locked level top-center
    ctx.drawImage(lockedLevel, canvas.width/2-20, 10, 40, 40);

    // Premium screen preview bottom-left
    ctx.drawImage(premiumScreen, 10, canvas.height-150, 120, 120);

    // Shop premium item bottom-center
    ctx.drawImage(shopPremium, canvas.width/2-60, canvas.height-140, 120, 120);

    // Upgrade button bottom-right
    ctx.drawImage(upgradeButton, canvas.width-130, canvas.height-60, 120, 50);
}
