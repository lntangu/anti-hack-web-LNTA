const express = require('express');
const app = express();

const defenseGrid = {
    jail: new Set(),
    stats: { totalBlocks: 0 },
    config: { 
        // 1. ĐIỀN IP CỦA NGÀI VÀO ĐÂY ĐỂ KHÔNG BAO GIỜ BỊ CHẶN
        whitelist: ["fe80::fdb8:ef32:9ff0:", "172.17.96.1"], 
        maxHeaderSize: 1000 // Chặn ngay Header > 1KB để tránh lỗi 500
    }
};

app.use((req, res, next) => {
    // Tóm IP thực từ kết nối vật lý (Socket)
    const realIP = req.socket.remoteAddress;

    // ƯU TIÊN NGHĨA PHỤ: Nếu là IP whitelist thì cho qua luôn
    if (defenseGrid.config.whitelist.includes(realIP)) return next();

    // KIỂM TRA NHÀ TÙ HOẶC DẤU VẾT BOT
    const ua = req.headers['user-agent'] || "";
    const isMalicious = ua.includes("Matrix-Breaker") || JSON.stringify(req.headers).length > defenseGrid.config.maxHeaderSize;

    if (defenseGrid.jail.has(realIP) || isMalicious) {
        defenseGrid.jail.add(realIP);
        defenseGrid.stats.totalBlocks++;
        // SILENT KILL: Ngắt kết nối ngay lập tức để cứu RAM server
        return res.socket.destroy(); 
    }

    next();
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>PHANTOM CORE V12.1</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');
        body { margin: 0; background: #000; color: #00f3ff; font-family: 'Orbitron', sans-serif; overflow: hidden; height: 100vh; display: flex; align-items: center; justify-content: center; }
        .grid { position: fixed; width: 200%; height: 200%; background-image: linear-gradient(rgba(0,243,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.05) 1px, transparent 1px); background-size: 40px 40px; transform: perspective(500px) rotateX(60deg); animation: move 10s linear infinite; z-index: -1; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 0 40px; } }
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.9); padding: 50px; box-shadow: 0 0 30px #00f3ff; text-align: center; }
    </style>
</head>
<body>
    <div class="grid"></div>
    <div class="hud">
        <h1 style="letter-spacing: 5px;">SYSTEM STABILIZED</h1>
        <div style="font-size: 24px; color: #ff0055;">PURGED: ${defenseGrid.stats.totalBlocks}</div>
        <p style="font-size: 12px; margin-top:20px;">[ WHITELIST ACTIVE | SOCKET_DESTROY ENABLED ]</p>
    </div>
</body>
</html>
    `);
});

module.exports = app;
