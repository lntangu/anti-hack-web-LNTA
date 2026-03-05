const express = require('express');
const app = express();

const defenseGrid = {
    jail: new Map(),
    stats: { totalBlocks: 0, integrity: 100 },
    config: { 
        maxHeaderLength: 1024, // Chặn ngay bot nhồi 2KB header
        banDuration: 60000 
    }
};

app.use((req, res, next) => {
    // 1. TÓM ĐẦU SỎ (Lấy IP thực từ Socket, bỏ qua IP giả mạo trong Header)
    const realIP = req.socket.remoteAddress; 
    const now = Date.now();

    // 2. NHẬN DIỆN DẤU VẾT "MATRIX-BREAKER"
    const ua = req.headers['user-agent'] || "";
    const isBot = ua.includes("Matrix-Breaker") || (JSON.stringify(req.headers).length > defenseGrid.config.maxHeaderLength);

    if (defenseGrid.jail.has(realIP) || isBot) {
        if (!defenseGrid.jail.has(realIP)) {
            defenseGrid.jail.set(realIP, now + defenseGrid.config.banDuration);
        }
        defenseGrid.stats.totalBlocks++;
        
        // CHIẾN THUẬT SILENT KILL: Ngắt kết nối vật lý để cứu RAM
        res.socket.destroy(); 
        return;
    }

    next();
});

// GIAO DIỆN PHANTOM V11 CHUẨN MATRIX
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>PHANTOM CORE V11</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');
        body { margin: 0; background: #000; color: #00f3ff; font-family: 'Orbitron', sans-serif; overflow: hidden; height: 100vh; display: flex; align-items: center; justify-content: center; }
        .grid { position: fixed; width: 200%; height: 200%; background-image: linear-gradient(rgba(0,243,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.05) 1px, transparent 1px); background-size: 30px 30px; transform: perspective(500px) rotateX(60deg); animation: move 10s linear infinite; z-index: -1; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 0 30px; } }
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.9); padding: 40px; box-shadow: 0 0 30px #00f3ff; text-align: center; }
        .radar { width: 100px; height: 100px; border: 2px solid #00f3ff; border-radius: 50%; margin: 0 auto 20px; position: relative; overflow: hidden; }
        .sweep { position: absolute; width: 100%; height: 100%; background: conic-gradient(from 0deg, rgba(0,243,255,0.4) 0%, transparent 40%); animation: sweep 1s linear infinite; }
        @keyframes sweep { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="grid"></div>
    <div class="hud">
        <div class="radar"><div class="sweep"></div></div>
        <h1 style="letter-spacing: 5px;">PHANTOM CORE V11</h1>
        <div style="font-size: 20px; color: #ff0055;">PURGED: ${defenseGrid.stats.totalBlocks}</div>
        <p style="font-size: 10px;">[ THREAT LEVEL: CRITICAL | SILENT SHIELD ACTIVE ]</p>
    </div>
</body>
</html>
    `);
});

module.exports = app;
