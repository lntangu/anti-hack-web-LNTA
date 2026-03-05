const express = require('express');
const app = express();

const defenseGrid = {
    // Tạm thời để trống jail để ngài vào được trang
    jail: new Map(),
    stats: { totalBlocks: 0, integrity: 100 },
    config: { 
        maxReqPerSec: 15, // Nới lỏng lên 15 để ngài F5 thoải mái
        banDuration: 30000 // Giảm xuống 30s cho nhẹ nhàng
    }
};

app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    
    // Chỉ chặn nếu thực sự có dấu hiệu bot rõ rệt
    const ua = req.headers['user-agent'] || "";
    if (ua.includes("Matrix-Breaker")) {
        defenseGrid.stats.totalBlocks++;
        return res.status(403).send("PHANTOM: BOT DETECTED");
    }

    next();
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>PHANTOM CORE V11.1</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');
        body { margin: 0; background: #000; color: #00f3ff; font-family: 'Orbitron', sans-serif; overflow: hidden; height: 100vh; display: flex; align-items: center; justify-content: center; }
        .grid { position: fixed; width: 200%; height: 200%; background-image: linear-gradient(rgba(0,243,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.05) 1px, transparent 1px); background-size: 40px 40px; transform: perspective(500px) rotateX(60deg); animation: move 15s linear infinite; z-index: -1; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 0 40px; } }
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.9); padding: 40px; box-shadow: 0 0 20px #00f3ff; text-align: center; }
        .radar { width: 80px; height: 80px; border: 1px solid #00f3ff; border-radius: 50%; margin: 0 auto 20px; position: relative; overflow: hidden; }
        .sweep { position: absolute; width: 100%; height: 100%; background: conic-gradient(from 0deg, rgba(0,243,255,0.3) 0%, transparent 40%); animation: sweep 3s linear infinite; }
        @keyframes sweep { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="grid"></div>
    <div class="hud">
        <div class="radar"><div class="sweep"></div></div>
        <h1>CORE STABILIZED</h1>
        <div style="font-size: 14px;">STATUS: <span style="color:#00ff00;">READY FOR TEST</span></div>
        <p style="font-size: 10px; margin-top:20px; opacity:0.6;">[ ANTIF-F12 DISABLED FOR STABILITY ]</p>
    </div>
</body>
</html>
    `);
});

module.exports = app;
