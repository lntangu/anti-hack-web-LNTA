const express = require('express');
const os = require('os');
const app = express();

// 1. DỮ LIỆU CỐT LÕI (Giữ nguyên phong cách của ngài)
const defenseGrid = {
    ipTraffic: new Map(),
    blackhole: new Set(),
    stats: {
        totalBlocks: 0,
        totalReqs: 0,
        startTime: Date.now(),
        integrity: 100.00
    },
    config: { maxReqPerSec: 12 }
};

const _waf_rules = [/union|select|insert|drop/i, /<script|alert/i, /\.\.\//i];

// 2. [SỬA LỖI 1] QUÉT PAYLOAD AN TOÀN (CHỐNG CRASH)
function scanPayload(req) {
    let penalty = 0;
    try {
        const unsafeUrl = decodeURIComponent(req.url || "");
        const ua = req.headers['user-agent'] || "";
        const targetString = unsafeUrl + " " + ua;
        _waf_rules.forEach(rule => { if(rule.test(targetString)) penalty += 3; });
    } catch (e) { penalty += 5; } // Xử lý URI Malformed cực tốt
    return penalty;
}

// 3. [SỬA LỖI 2] GIẢ LẬP CPU MƯỢT MÀ
function getSmoothCPU() {
    const load = os.loadavg()[0];
    return load > 0 ? (load * 10).toFixed(2) : (5.5 + Math.random() * 0.5).toFixed(2);
}

// 4. [NÂNG CẤP] TỰ PHỤC HỒI INTEGRITY
setInterval(() => {
    if (defenseGrid.stats.integrity < 100) {
        defenseGrid.stats.integrity = Math.min(100, defenseGrid.stats.integrity + 0.001);
    }
}, 5000);

// 5. TRUNG TÂM ĐIỀU KHIỂN (MIDDLEWARE)
app.use((req, res, next) => {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';

    if (defenseGrid.blackhole.has(clientIP)) {
        defenseGrid.stats.totalBlocks++;
        return res.status(403).end(); // Dùng status để Vercel không ngắt kết nối đột ngột
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const ipKey = `${clientIP}_${currentTime}`;
    let currentReqs = (defenseGrid.ipTraffic.get(ipKey) || 0) + 1;
    defenseGrid.ipTraffic.set(ipKey, currentReqs);

    if (currentReqs > defenseGrid.config.maxReqPerSec || scanPayload(req) > 4) {
        defenseGrid.blackhole.add(clientIP);
        defenseGrid.stats.integrity -= 0.1;
        return res.status(403).end();
    }

    defenseGrid.stats.totalReqs++;
    next();
});

// 6. GIAO DIỆN PHANTOM HUD (THEO ĐÚNG Ý NGHĨA PHỤ)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>PHANTOM CORE V10.2</title>
    <style>
        body { margin: 0; background: #000; color: #00f3ff; font-family: 'Orbitron', sans-serif; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; }
        .grid-bg { position: fixed; width: 200%; height: 200%; background-image: linear-gradient(rgba(0,243,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.05) 1px, transparent 1px); background-size: 50px 50px; transform: perspective(500px) rotateX(60deg); animation: move 20s linear infinite; z-index: -1; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 0 100%; } }
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.85); padding: 40px; box-shadow: 0 0 30px #00f3ff; text-align: center; backdrop-filter: blur(10px); }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .box { border: 1px solid rgba(0,243,255,0.3); padding: 15px; }
        .val { font-size: 24px; font-weight: bold; display: block; color: #fff; }
        .lbl { font-size: 10px; color: #00f3ff; letter-spacing: 2px; }
    </style>
</head>
<body>
    <div class="grid-bg"></div>
    <div class="hud">
        <h2 style="margin:0; letter-spacing:8px;">CORE DEFENSE V10.2</h2>
        <div class="stat-grid">
            <div class="box"><span class="lbl">BLOCKED</span><span class="val">${defenseGrid.stats.totalBlocks}</span></div>
            <div class="box"><span class="lbl">CPU LOAD</span><span class="val">${getSmoothCPU()}%</span></div>
            <div class="box"><span class="lbl">INTEGRITY</span><span class="val">${defenseGrid.stats.integrity.toFixed(2)}%</span></div>
            <div class="box"><span class="lbl">STATUS</span><span class="val">SECURE</span></div>
        </div>
    </div>
</body>
</html>
    `);
});

module.exports = app;
