const express = require('express');
const app = express();

// --- [PHẦN 1: LÕI THÉP AN TOÀN] ---
const defenseGrid = {
    jail: new Map(),
    ipTraffic: new Map(),
    stats: { totalBlocks: 0, integrity: 100 },
    config: { 
        maxReqPerSec: 6, // Bot chạy 37 RPS sẽ bị xích ngay
        banDuration: 60000 
    }
};

app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const now = Date.now();

    // 1. HỐ ĐEN IM LẶNG - KHÔNG REDIRECT, KHÔNG TẤN CÔNG AI
    if (defenseGrid.jail.has(ip)) {
        if (now < defenseGrid.jail.get(ip)) {
            defenseGrid.stats.totalBlocks++;
            // Trả về lỗi 444 (No Response) - Cực kỳ an toàn và tiết kiệm CPU
            return res.status(444).end(); 
        } else {
            defenseGrid.jail.delete(ip);
        }
    }

    // 2. VÁ LƯỚI TỰ ĐỘNG (FLOOD PROTECTION)
    const secKey = `${ip}_${Math.floor(now / 1000)}`;
    let reqCount = (defenseGrid.ipTraffic.get(secKey) || 0) + 1;
    defenseGrid.ipTraffic.set(secKey, reqCount);

    if (reqCount > defenseGrid.config.maxReqPerSec) {
        defenseGrid.jail.set(ip, now + defenseGrid.config.banDuration);
        defenseGrid.stats.integrity -= 1.0;
        return res.status(403).end();
    }

    next();
});

// --- [PHẦN 2: GIAO DIỆN PHANTOM V10.7] ---
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>PHANTOM CORE V10.7</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');
        body { margin: 0; background: #000; color: #00f3ff; font-family: 'Orbitron', sans-serif; overflow: hidden; height: 100vh; display: flex; align-items: center; justify-content: center; }
        .grid { position: fixed; width: 200%; height: 200%; background-image: linear-gradient(rgba(0,243,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.05) 1px, transparent 1px); background-size: 40px 40px; transform: perspective(500px) rotateX(60deg) translateY(-20%); animation: move 8s linear infinite; z-index: -1; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 0 40px; } }
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.9); padding: 40px; box-shadow: 0 0 30px #00f3ff; text-align: center; }
        .radar { width: 100px; height: 100px; border: 1px solid #00f3ff; border-radius: 50%; margin: 0 auto 20px; position: relative; overflow: hidden; }
        .sweep { position: absolute; width: 100%; height: 100%; background: conic-gradient(from 0deg, rgba(0,243,255,0.4) 0%, transparent 40%); animation: sweep 2s linear infinite; }
        @keyframes sweep { to { transform: rotate(360deg); } }
    </style>
</head>
<body oncontextmenu="return false;">
    <div class="grid"></div>
    <div class="hud">
        <div class="radar"><div class="sweep"></div></div>
        <h1 style="letter-spacing: 10px;">CORE V10.7</h1>
        <div style="font-size: 14px;">BLOCKED: ${defenseGrid.stats.totalBlocks} | INTEGRITY: ${defenseGrid.stats.integrity.toFixed(2)}%</div>
        <p style="font-size: 10px; color: #ff0055; margin-top:20px;">[ STATUS: SILENT DEFENSE ACTIVE ]</p>
    </div>
    <script>
        // ANTI-F12 CHẶN SOI CODE
        document.onkeydown = (e) => { if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && e.keyCode == 73)) return false; };
        setInterval(() => { debugger; console.clear(); }, 100);
    </script>
</body>
</html>
    `);
});

module.exports = app;
