/* =============================================================
   NEBULA STRIKE — engagement.js
   Daily missions + streak preview + local notifications.
   ============================================================= */
(function () {
'use strict';

const todayStr = () => new Date().toDateString();

/* ───────────── 1. DAILY MISSIONS ───────────── */

// Tune rewards/targets here.
const POOL = {
    kills: [
        { id: 'kills_40',  type: 'kill', target: 40,  reward: 60,  text: 'Destroy 40 enemies' },
        { id: 'kills_70',  type: 'kill', target: 70,  reward: 90,  text: 'Destroy 70 enemies' },
        { id: 'kills_100', type: 'kill', target: 100, reward: 130, text: 'Destroy 100 enemies' }
    ],
    waves: [
        { id: 'waves_3', type: 'wave', target: 3, reward: 60,  text: 'Clear 3 waves' },
        { id: 'waves_6', type: 'wave', target: 6, reward: 100, text: 'Clear 6 waves' }
    ],
    extra: [
        { id: 'power_3', type: 'powerup', target: 3, reward: 60, text: 'Collect 3 power-ups' },
        { id: 'level_1', type: 'level',   target: 1, reward: 80, text: 'Complete a level' },
        { id: 'runs_2',  type: 'run',     target: 2, reward: 50, text: 'Play 2 runs' }
    ]
};
const ALL_DONE_BONUS = 150;
const KEY = 'nebulaMissions';

let state = null;
let pendingMissionIdx = null;

function seed(str) { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
const pick = (arr, s) => arr[s % arr.length];

function generate() {
    const s = seed(todayStr());
    const chosen = [pick(POOL.kills, s), pick(POOL.waves, s >>> 3), pick(POOL.extra, s >>> 6)];
    return {
        date: todayStr(),
        missions: chosen.map(m => ({ ...m, progress: 0, claimed: false })),
        bonusClaimed: false
    };
}

function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

function ensureToday() {
    if (!state) {
        try { const r = localStorage.getItem(KEY); state = r ? JSON.parse(r) : null; } catch (e) { state = null; }
    }
    if (!state || state.date !== todayStr() || !Array.isArray(state.missions)) { state = generate(); save(); }
}

function track(type, n = 1) {
    ensureToday();
    let changed = false;
    state.missions.forEach(m => {
        if (m.type === type && m.progress < m.target) {
            m.progress = Math.min(m.target, m.progress + n);
            changed = true;
            if (m.progress >= m.target) toast('🎯 MISSION COMPLETE: ' + m.text);
        }
    });
    if (changed) { save(); updateDot(); if (panelOpen()) render(); }
}

async function grant(i, mult) {
    ensureToday();
    const m = state.missions[i];
    if (!m || m.claimed || m.progress < m.target) return;
    m.claimed = true; save();
    const amt = m.reward * mult;
    await addCoins(amt);
    showCoinGain(amt); updateHUD(); updateDot(); render(); saveGame();
    scheduleReminders({ ask: true });
}

function claim(i) { grant(i, 1); }

function claimDouble(i) {
    ensureToday();
    const m = state.missions[i];
    if (!m || m.claimed || m.progress < m.target) return;
    if (!noAds && !admobReady) { showCoinWarning('Ads not ready yet...Please wait a moment!'); return; }
    pendingMissionIdx = i;
    pendingRewardAction = 'missionDouble';   // handled in handleReward()
    showRewardAd();
}

function finishDouble() {
    if (pendingMissionIdx === null) return;
    const i = pendingMissionIdx; pendingMissionIdx = null;
    grant(i, 2);
}

async function claimBonus() {
    ensureToday();
    if (state.bonusClaimed || !state.missions.every(m => m.claimed)) return;
    state.bonusClaimed = true; save();
    await addCoins(ALL_DONE_BONUS);
    showCoinGain(ALL_DONE_BONUS); updateHUD(); updateDot(); render(); saveGame();
}

function hasClaimable() {
    ensureToday();
    const anyReady = state.missions.some(m => !m.claimed && m.progress >= m.target);
    const bonusReady = !state.bonusClaimed && state.missions.every(m => m.claimed);
    return anyReady || bonusReady;
}

/* ───────────── UI ───────────── */

function injectStyles() {
    if (document.getElementById('engagementStyles')) return;
    const s = document.createElement('style');
    s.id = 'engagementStyles';
    s.textContent = `
#missionsPanel{position:fixed;inset:0;z-index:8600;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.88);font-family:'Orbitron',sans-serif;}
.mpBox{position:relative;width:92%;max-width:400px;max-height:88vh;overflow-y:auto;background:rgba(10,20,40,.96);border:2px solid #00ffff;border-radius:16px;padding:18px;box-shadow:0 0 25px rgba(0,255,255,.35);color:#fff;}
.mpBox h2{margin:0 0 6px;text-align:center;color:#00ffff;font-size:20px;}
.mpClose{position:absolute;top:8px;right:10px;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;}
.mpStreak{text-align:center;font-size:11px;color:#ffd700;margin-bottom:12px;line-height:1.5;}
.mpRow{background:rgba(255,255,255,.06);border:1px solid #234;border-radius:10px;padding:10px;margin-bottom:10px;}
.mpRow.ready{border-color:#00ff88;box-shadow:0 0 10px rgba(0,255,136,.3);}
.mpRow.claimed{opacity:.5;}
.mpTop{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;}
.mpReward{color:#ffd700;font-size:12px;white-space:nowrap;}
.mpDone{color:#00ff88;font-size:18px;}
.mpBar{height:8px;background:#122;border-radius:6px;overflow:hidden;margin-top:8px;}
.mpBar div{height:100%;background:linear-gradient(90deg,#0066cc,#00ffff);transition:width .3s;}
.mpCount{font-size:10px;color:#9ab;margin-top:4px;text-align:right;}
.mpBtns{display:flex;gap:6px;}
.mpClaim,.mpAd,.mpBonus{border:none;border-radius:8px;font-family:inherit;font-weight:700;font-size:11px;padding:7px 10px;cursor:pointer;}
.mpClaim,.mpBonus{background:#00c853;color:#fff;}
.mpAd{background:#ffb300;color:#000;}
.mpBonus{width:100%;padding:10px;font-size:12px;}
.mpBonusRow{text-align:center;font-size:12px;color:#ffd700;margin-top:4px;}
.mpFoot{text-align:center;font-size:10px;color:#789;margin-top:10px;}
.missionsDot{position:absolute;top:6px;right:8px;width:12px;height:12px;border-radius:50%;background:#ff3b3b;box-shadow:0 0 8px #ff3b3b;display:none;}
.missionToast{position:fixed;top:14%;left:50%;transform:translateX(-50%);z-index:9998;background:rgba(0,255,136,.92);color:#000;font-family:'Orbitron',sans-serif;font-weight:700;font-size:13px;padding:10px 18px;border-radius:10px;pointer-events:none;animation:mToast 2.4s ease forwards;text-align:center;max-width:90%;}
@keyframes mToast{0%{opacity:0;transform:translate(-50%,-10px)}10%,80%{opacity:1;transform:translate(-50%,0)}100%{opacity:0}}
`;
    document.head.appendChild(s);
}

function toast(msg) {
    const t = document.createElement('div');
    t.className = 'missionToast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

function injectUI() {
    injectStyles();
    if (!document.getElementById('missionsPanel')) {
        const p = document.createElement('div');
        p.id = 'missionsPanel';
        p.innerHTML = `<div class="mpBox">
            <button class="mpClose" onclick="Missions.close()">✕</button>
            <h2>🎯 DAILY MISSIONS</h2>
            <div class="mpStreak" id="mpStreak"></div>
            <div id="mpList"></div>
            <div class="mpFoot" id="mpFoot"></div>
        </div>`;
        document.body.appendChild(p);
    }
    const play = document.querySelector('#main-menu .play-btn');
    if (play && !document.getElementById('missionsMenuBtn')) {
        const b = document.createElement('button');
        b.id = 'missionsMenuBtn';
        b.className = 'menu-btn';
        b.style.position = 'relative';
        b.innerHTML = '<span class="shop-icon">🎯</span><span class="btn-text">MISSIONS</span><span id="missionsDot" class="missionsDot"></span><div class="btn-shine"></div>';
        b.onclick = openPanel;
        play.after(b);
    }
    updateDot();
}

function updateDot() {
    const d = document.getElementById('missionsDot');
    if (d) d.style.display = hasClaimable() ? 'block' : 'none';
}

const panelOpen = () => { const p = document.getElementById('missionsPanel'); return p && p.style.display === 'flex'; };

function openPanel() {
    ensureToday(); render();
    document.getElementById('missionsPanel').style.display = 'flex';
}
function closePanel() { document.getElementById('missionsPanel').style.display = 'none'; updateDot(); }

function render() {
    const list = document.getElementById('mpList');
    if (!list) return;
    ensureToday();

    // Streak line
    const claimedToday = dailyData && dailyData.lastLogin === todayStr();
    const st = (dailyData && dailyData.streak) || 1;
    const nextTxt = st === 7 ? 'MEGA CHEST' : getDailyReward(st) + ' 🪙';
    const saveTxt = (dailyData && !dailyData.graceUsed && st > 1) ? ' · 🛡️ 1 streak save ready' : '';
    document.getElementById('mpStreak').innerHTML =
        `🔥 Day ${st} / 7 · ${claimedToday ? 'Tomorrow' : 'Today'}: ${nextTxt}${saveTxt}`;

    let html = state.missions.map((m, i) => {
        const ready = m.progress >= m.target;
        const pct = Math.round(m.progress / m.target * 100);
        let action;
        if (m.claimed) action = '<span class="mpDone">✓</span>';
        else if (ready) action = `<div class="mpBtns"><button class="mpClaim" onclick="Missions.claim(${i})">CLAIM +${m.reward}</button><button class="mpAd" onclick="Missions.claimDouble(${i})">📺 2X</button></div>`;
        else action = `<span class="mpReward">+${m.reward} 🪙</span>`;
        return `<div class="mpRow ${m.claimed ? 'claimed' : ready ? 'ready' : ''}">
            <div class="mpTop"><span>${m.text}</span>${action}</div>
            <div class="mpBar"><div style="width:${pct}%"></div></div>
            <div class="mpCount">${m.progress} / ${m.target}</div></div>`;
    }).join('');

    const allClaimed = state.missions.every(m => m.claimed);
    if (state.bonusClaimed) html += `<div class="mpBonusRow">✓ All missions bonus claimed</div>`;
    else if (allClaimed) html += `<button class="mpBonus" onclick="Missions.claimBonus()">🎁 ALL DONE! CLAIM +${ALL_DONE_BONUS} 🪙</button>`;
    else html += `<div class="mpBonusRow">Finish all 3 for a +${ALL_DONE_BONUS} 🪙 bonus</div>`;
    list.innerHTML = html;

    const now = new Date(), mid = new Date(now); mid.setHours(24, 0, 0, 0);
    const mins = Math.max(0, Math.round((mid - now) / 60000));
    document.getElementById('mpFoot').textContent = `New missions in ${Math.floor(mins / 60)}h ${mins % 60}m`;
}

window.Missions = { track, claim, claimDouble, finishDouble, claimBonus, open: openPanel, close: closePanel };

/* ───────────── 2. HOOKS INTO EXISTING FUNCTIONS ───────────── */

const _startGame = window.startGame;
window.startGame = function () {
    if (imagesLoaded) track('run');          // ignore the internal "images not ready" retries
    return _startGame.apply(this, arguments);
};

const _endWave = window.endWave;
window.endWave = function () {
    if (waveInProgress) track('wave');
    return _endWave.apply(this, arguments);
};

const _levelComplete = window.levelComplete;
window.levelComplete = function () {
    track('level');
    return _levelComplete.apply(this, arguments);
};

const _claimDaily = window.claimDailyReward;
window.claimDailyReward = function (useDouble) {
    const r = _claimDaily.apply(this, arguments);
    if (!useDouble && dailyData.lastLogin === todayStr()) {
        if (dailyData.streak === 1) { dailyData.graceUsed = false; saveDailyData(); }  // new 7-day cycle restores the streak save
        saveGame();
        scheduleReminders({ ask: true });
    }
    return r;
};

/* ───────────── 3. LOCAL NOTIFICATIONS ───────────── */
// Needs:  npm i @capacitor/local-notifications && npx cap sync android

const LN = () => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) || null;
const NOTIF_IDS = [1001, 1002, 1003, 1004];

async function hasPermission(ask) {
    const ln = LN(); if (!ln) return false;
    try {
        let p = await ln.checkPermissions();
        if (p.display === 'granted') return true;
        if (!ask || localStorage.getItem('notifAsked')) return false;
        localStorage.setItem('notifAsked', '1');          // only ever prompt once
        p = await ln.requestPermissions();
        return p.display === 'granted';
    } catch (e) { return false; }
}

async function scheduleReminders(opts) {
    const ln = LN(); if (!ln) return;
    if (!(await hasPermission(opts && opts.ask))) return;
    try {
        await ln.cancel({ notifications: NOTIF_IDS.map(id => ({ id })) });

        const now = new Date();
        const at = (days, h, m = 0) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0); return d; };
        const claimedToday = dailyData && dailyData.lastLogin === todayStr();
        const streak = (dailyData && dailyData.streak) || 1;
        const list = [];

        // Reward + new missions ready (once per day, 9:00)
        list.push({
            id: 1001, title: '🎁 Your daily reward is ready!',
            body: 'New missions and a free reward are waiting, pilot.',
            schedule: { at: claimedToday ? at(1, 9) : new Date(Date.now() + 3 * 3600 * 1000), allowWhileIdle: true }
        });
        // Streak about to end (tomorrow 20:00) — only if they have a streak worth protecting
        if (claimedToday && streak > 1) {
            list.push({
                id: 1002, title: `🔥 ${streak - 1}-day streak at risk!`,
                body: 'Log in today to keep your streak and the MEGA chest on track.',
                schedule: { at: at(1, 20), allowWhileIdle: true }
            });
        }
        // Comeback nudges
        list.push({
            id: 1003, title: '🚀 The galaxy needs you',
            body: 'Your fleet is waiting. Jump back in for free coins.',
            schedule: { at: at(3, 18), allowWhileIdle: true }
        });
        list.push({
            id: 1004, title: '⭐ We saved your rewards',
            body: 'Daily missions are ready. Come back and upgrade your ship!',
            schedule: { at: at(7, 18), allowWhileIdle: true }
        });

        await ln.schedule({ notifications: list });
    } catch (e) { console.log('Reminder scheduling failed:', e); }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { scheduleReminders(); updateDot(); }
});

/* ───────────── HUD "WATCH AD +100" BANNER ───────────── */
const AD_COIN_COOLDOWN_MS = 3 * 60 * 1000;   // wait between ad rewards
const AD_KEY = 'adCoinsReadyAt';

const adReadyAt = () => parseInt(localStorage.getItem(AD_KEY) || '0', 10);

function startAdCooldown() {
    try { localStorage.setItem(AD_KEY, String(Date.now() + AD_COIN_COOLDOWN_MS)); } catch (e) {}
    refreshAdBanner();
}

function refreshAdBanner() {
    const b = document.getElementById('adCoinBanner');
    const t = document.getElementById('acbText');
    if (!b || !t) return;
    const left = adReadyAt() - Date.now();
    if (left > 0) {
        const s = Math.ceil(left / 1000);
        b.classList.add('cooling');
        t.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    } else {
        b.classList.remove('cooling');
        t.textContent = '+100';
    }
}

function injectAdBanner() {
    if (!document.getElementById('adBannerStyles')) {
        const s = document.createElement('style');
        s.id = 'adBannerStyles';
        s.textContent = `
#adCoinBanner{position:absolute;top:100%;right:10px;width:50px;padding:7px 0 13px;margin-top:-2px;
  background:linear-gradient(#ff3b3b,#c40000);color:#fff;font-family:'Orbitron',sans-serif;
  text-align:center;line-height:1.15;cursor:pointer;z-index:5;
  clip-path:polygon(0 0,100% 0,100% 100%,50% 82%,0 100%);
  transform-origin:top center;animation:acbSwing 2.6s ease-in-out infinite;}
#adCoinBanner .acbIcon{display:block;font-size:14px;}
#adCoinBanner .acbText{display:block;font-size:10px;font-weight:700;}
#adCoinBanner.cooling{filter:grayscale(.85) brightness(.7);animation-play-state:paused;cursor:default;}
@keyframes acbSwing{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}`;
        document.head.appendChild(s);
    }
    const host = document.querySelector('#hud .coin-display');
    if (!host || document.getElementById('adCoinBanner')) return;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

    const b = document.createElement('div');
    b.id = 'adCoinBanner';
    b.innerHTML = '<span class="acbIcon">📺</span><span class="acbText" id="acbText">+100</span>';
    b.onclick = e => {
        e.stopPropagation();                       // don't open the shop
        if (Date.now() < adReadyAt()) return;      // still cooling down
        watchAdReward();
    };
    host.appendChild(b);
    refreshAdBanner();
}

// Start the cooldown only when the 100 coins were actually granted
const _handleReward = window.handleReward;
window.handleReward = function (success) {
    const wasFree = pendingRewardAction === 'freeCoins';
    const r = _handleReward.apply(this, arguments);
    if (success && wasFree) startAdCooldown();
    return r;
};

setInterval(refreshAdBanner, 1000);

/* ───────────── INIT ───────────── */
ensureToday();
injectUI();
injectAdBanner(); 
// After logo/splash, quietly refresh reminders (never prompts for permission here)
setTimeout(() => { injectUI(); injectAdBanner(); scheduleReminders(); }, 10000);

})();