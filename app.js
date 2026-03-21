/* =========================
        NEBULA STRIKE
   ========================= */
document.addEventListener("DOMContentLoaded", () => {

    let canvas = document.getElementById("gameCanvas");
    if(!canvas) return;
    let ctx = canvas.getContext("2d");
    if(!ctx) return;

    let score = 0;
    let coins = parseInt(localStorage.getItem("coins") || "0");
    let running = false;
    let playerX = window.innerWidth/2;

    let bullets=[], enemies=[], explosions=[], bossBullets=[];
    let stars=[], stars2=[], stars3=[];
    let boss=null, bossActive=false, bossLevel=0;

    const LOW_MODE=true;

    // --- Boss Warning ---
    let bossWarningActive=false;
    let bossWarningText="";
    let bossWarningTimer=0;

    // --- Assets ---
    let assetsLoaded=0, assetsToLoad=0;
    function assetLoaded(){ assetsLoaded++; if(assetsLoaded>=assetsToLoad){ fadeSplashToMenu(); } }

    const playerImg=new Image(); playerImg.src="assets/player.png"; playerImg.onload=assetLoaded; playerImg.onerror=assetLoaded; assetsToLoad++;
    const enemyImg=new Image(); enemyImg.src="assets/enemy.png"; enemyImg.onload=assetLoaded; enemyImg.onerror=assetLoaded; assetsToLoad++;
    const explosionImg=new Image(); explosionImg.src="assets/explosion.png"; explosionImg.onload=assetLoaded; explosionImg.onerror=assetLoaded; assetsToLoad++;
    const starImg=new Image(); starImg.src="assets/star.png"; starImg.onload=assetLoaded; starImg.onerror=assetLoaded; assetsToLoad++;
    const bossImg=new Image(); bossImg.src="assets/boss.png"; bossImg.onload=assetLoaded; bossImg.onerror=assetLoaded; assetsToLoad++;

    const coinIcon=new Image(); coinIcon.src="assets/ui/coin-icon.png";
    const boomSound=new Audio("assets/sounds/explosion.wav");
    const shootSound=new Audio("assets/sounds/shoot.wav");
    function playSound(s){ if(!s) return; s.currentTime=0; s.play().catch(()=>{}); }

    // --- Splash to Menu Fade ---
    function fadeSplashToMenu(){
        const splash=document.getElementById("splash");
        const menu=document.getElementById("main-menu");
        splash.style.opacity="1";
        menu.style.opacity="0";
        menu.style.display="flex";
        let fadeOut=setInterval(()=>{
            let o=parseFloat(splash.style.opacity);
            if(o>0){ splash.style.opacity=(o-0.05).toString(); }
            else{
                clearInterval(fadeOut); splash.style.display="none";
                let opacityMenu=0;
                let fadeIn=setInterval(()=>{
                    if(opacityMenu<1){ opacityMenu+=0.05; menu.style.opacity=opacityMenu.toString(); }
                    else clearInterval(fadeIn);
                },20);
            }
        },20);
    }

    document.getElementById("startBtn").onclick=startGame;
    function startGame(){
        document.getElementById("main-menu").style.display="none";
        running=true;

        for(let i=0;i<(LOW_MODE?15:40);i++) stars.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height});
        for(let i=0;i<(LOW_MODE?10:30);i++) stars2.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height});
        for(let i=0;i<(LOW_MODE?5:20);i++) stars3.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height});

        requestAnimationFrame(loop);
    }

    function resize(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
    window.addEventListener("resize", resize);

    // --- Player Movement ---
    let dragging=false;
    canvas.addEventListener("mousedown", e=>{ dragging=true; playerX=e.clientX; });
    canvas.addEventListener("mousemove", e=>{ if(dragging) playerX=e.clientX; });
    canvas.addEventListener("mouseup", ()=>{ dragging=false; });
    canvas.addEventListener("touchstart", e=>{ playerX=e.touches[0].clientX; }, {passive:false});
    canvas.addEventListener("touchmove", e=>{ e.preventDefault(); playerX=e.touches[0].clientX; }, {passive:false});
    canvas.addEventListener("click", shoot);

    function shoot(){ if(!running) return; bullets.push({x:playerX,y:canvas.height-80}); playSound(shootSound); }

    function loop(){ if(!ctx) return; if(running){ update(); draw(); } requestAnimationFrame(loop); }

    // --- Update ---
    function update(){
        score++; coins+=0.05; localStorage.setItem("coins", Math.floor(coins));

        if(Math.random()<0.02) enemies.push({x:Math.random()*canvas.width, y:-20});
        enemies.forEach(e=>e.y+=3);

        bullets.forEach(b=>{ enemies.forEach(e=>{ if(Math.abs(b.x-e.x)<20 && Math.abs(b.y-e.y)<20){ explosions.push({x:e.x,y:e.y,frame:0}); playSound(boomSound); coins+=1; e.y=9999; } }); });
        bullets = bullets.filter(b=>b.y>0);
        explosions.forEach(ex=>ex.frame++); explosions=explosions.filter(ex=>ex.frame<20);

        stars.forEach(s=>{ s.y+=1;if(s.y>canvas.height)s.y=0; });
        stars2.forEach(s=>{ s.y+=2;if(s.y>canvas.height)s.y=0; });
        stars3.forEach(s=>{ s.y+=3;if(s.y>canvas.height)s.y=0; });

        // --- Boss Spawn ---
        if(!bossActive){
            if(score>=500 && bossLevel<1) spawnBoss(1,50,2,0.02,50);
            else if(score>=1500 && bossLevel<2) spawnBoss(2,80,3,0.03,100);
            else if(score>=3000 && bossLevel<3) spawnBoss(3,120,4,0.04,200);
        }

        // --- Boss Logic ---
        if(bossActive && boss){
            boss.x += boss.direction * boss.speed;
            if(boss.x<50 || boss.x>canvas.width-100) boss.direction*=-1;

            if(Math.random()<boss.fireRate) bossBullets.push({x:boss.x+50, y:boss.y+50});

            bullets.forEach((b,i)=>{
                if(Math.abs(b.x-(boss.x+50))<40 && Math.abs(b.y-(boss.y+50))<40){
                    boss.hp-=1; bullets.splice(i,1);
                    if(boss.hp<=0){
                        explosions.push({x:boss.x+50,y:boss.y+50,frame:0});
                        coins+=boss.reward;
                        bossActive=false; boss=null; bossLevel++;
                    }
                }
            });

            bossBullets.forEach(bb=>bb.y+=boss.speed+3);
            bossBullets=bossBullets.filter(bb=>bb.y<canvas.height);
        }

        // --- Boss Warning Countdown ---
        if(bossWarningActive && bossWarningTimer>0){
            bossWarningTimer--;
            if(bossWarningTimer<=0) bossWarningActive=false;
        }

        document.getElementById("coin-display").innerText=Math.floor(coins);
        document.getElementById("score-display").innerText=score;
    }

    function spawnBoss(level,hp,speed,fireRate,reward){
        bossWarningActive=true;
        bossWarningText="BOSS INCOMING!";
        bossWarningTimer=60; // 60 frames (~1 second)

        setTimeout(()=>{
            boss={x:canvas.width/2-50,y:50,hp:hp,direction:1,speed:speed,fireRate:fireRate,reward:reward};
            bossActive=true;
        },1000);
    }

    function draw(){
        ctx.clearRect(0,0,canvas.width,canvas.height);

        stars.forEach(s=>{ ctx.fillStyle="white"; ctx.fillRect(s.x,s.y,2,2); });
        stars2.forEach(s=>{ ctx.fillStyle="lightblue"; ctx.fillRect(s.x,s.y,2,2); });
        stars3.forEach(s=>{ ctx.fillStyle="cyan"; ctx.fillRect(s.x,s.y,2,2); });

        ctx.drawImage(playerImg,playerX-25,canvas.height-80,50,50);
        bullets.forEach(b=>{ ctx.fillStyle="yellow"; ctx.fillRect(b.x-2,b.y,4,10); });
        enemies.forEach(e=>ctx.drawImage(enemyImg,e.x-20,e.y-20,40,40));
        explosions.forEach(ex=>ctx.drawImage(explosionImg,ex.x-25,ex.y-25,50,50));

        if(bossWarningActive){
            ctx.save();
            ctx.font="bold 48px Arial";
            ctx.fillStyle="red";
            ctx.textAlign="center";
            ctx.shadowColor="yellow";
            ctx.shadowBlur=20;
            ctx.fillText(bossWarningText, canvas.width/2, 100);
            ctx.restore();
        }

        if(bossActive && boss){
            ctx.drawImage(bossImg,boss.x,boss.y,100,100);
            ctx.fillStyle="red"; ctx.fillRect(boss.x,boss.y-10,100,10);
            ctx.fillStyle="green"; ctx.fillRect(boss.x,boss.y-10,(boss.hp/boss.hp)*100,10);
        }

        bossBullets.forEach(bb=>{ ctx.fillStyle="orange"; ctx.fillRect(bb.x-3,bb.y,6,12); });
    }

});
