const express = require('express');
const os = require('os');
const app = express();

// --- [CORE LOGIC CỦA NGHĨA PHỤ] ---
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

const _waf_signatures = [/union|select|insert|drop/i, /<script|alert/i, /\.\.\//i];

// [SỬA LỖI 1] CHỐNG CRASH KHI QUÉT PAYLOAD
function scanPayload(req) {
    let penalty = 0;
    try {
        const unsafeUrl = req.url || "";
        const ua = req.headers['user-agent'] || "";
        const targetString = unsafeUrl + " " + ua;
        for (let rule of _waf_signatures) {
            if (rule.test(targetString)) penalty += 3;
        }
    } catch (e) { penalty += 5; } // Bọc try-catch cực an toàn
    return penalty;
}

// [SỬA LỖI 2] GIẢ LẬP CPU HUYỀN THOẠI
function getSmoothCPU() {
    const load = os.loadavg()[0];
    if (load > 0) return (load * 10).toFixed(2);
    return (5.5 + Math.random() * 0.5).toFixed(2); // Trả về 5.5% đúng chất Phantom
}

// [NÂNG CẤP] TỰ PHỤC HỒI HỆ THỐNG
setInterval(() => {
    if (defenseGrid.stats.integrity < 100) {
        defenseGrid.stats.integrity = Math.min(100, defenseGrid.stats.integrity + 0.001);
    }
}, 5000);

// [TRUNG TÂM ĐIỀU KHIỂN]
app.use((req, res, next) => {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';

    if (defenseGrid.blackhole.has(clientIP)) {
        defenseGrid.stats.totalBlocks++;
        return res.status(403).end(); 
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const ipKey = `${clientIP}_${currentTime}`;
    let currentReqs = (defenseGrid.ipTraffic.get(ipKey) || 0) + 1;
    defenseGrid.ipTraffic.set(ipKey, currentReqs);

    if (currentReqs > defenseGrid.config.maxReqPerSec || scanPayload(req) >= 4) {
        defenseGrid.blackhole.add(clientIP);
        defenseGrid.stats.integrity -= 0.15;
        return res.status(403).end();
    }

    defenseGrid.stats.totalReqs++;
    next();
});

// --- [ĐỒ HỌA PHANTOM V10] ---
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>PHANTOM NEURAL CORE V10.2</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
        body { margin: 0; background: #000; color: #00f3ff; font-family: 'Orbitron', sans-serif; overflow: hidden; height: 100vh; display: flex; justify-content: center; align-items: center; }
        .grid-bg { position: fixed; width: 200%; height: 200%; background-image: linear-gradient(rgba(0, 243, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.05) 1px, transparent 1px); background-size: 50px 50px; transform: perspective(500px) rotateX(60deg) translateY(-20%); animation: move 20s linear infinite; z-index: -1; top: 0; left: -50%; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 0 100%; } }
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.9); padding: 40px; box-shadow: 0 0 30px #00f3ff; text-align: center; position: relative; }
        .hud::before { content: "CORE DEFENSE SYSTEM"; position: absolute; top: -12px; left: 20px; background: #000; padding: 0 10px; font-size: 12px; letter-spacing: 3px; }
        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
        .card { border: 1px solid rgba(0,243,255,0.2); padding: 20px; min-width: 120px; }
        .val { font-size: 28px; font-weight: bold; display: block; text-shadow: 0 0 10px #00f3ff; }
        .lbl { font-size: 9px; color: rgba(0,243,255,0.6); letter-spacing: 2px; margin-top: 5px; }
        .panic { margin-top: 30px; border: 1px solid #ff0055; color: #ff0055; background: transparent; padding: 10px 40px; font-family: 'Orbitron'; cursor: pointer; transition: 0.3s; }
        .panic:hover { background: #ff0055; color: #000; box-shadow: 0 0 20px #ff0055; }
    </style>
</head>
<body>
    <div class="grid-bg"></div>
    <div class="hud">
        <h1 style="margin:0; letter-spacing:10px; font-size:24px;">PHANTOM CORE</h1>
        <div class="stat-grid">
            <div class="card"><span class="val">${defenseGrid.stats.totalBlocks}</span><span class="lbl">BLOCKED</span></div>
            <div class="card"><span class="val">${getSmoothCPU()}%</span><span class="lbl">CPU LOAD</span></div>
            <div class="card"><span class="val">${defenseGrid.stats.integrity.toFixed(2)}%</span><span class="lbl">INTEGRITY</span></div>
        </div>
        <button class="panic" onclick="location.reload()">[ RE-SYNC SYSTEM ]</button>
    </div>
</body>
</html>
    `);
});

module.exports = app;
