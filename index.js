const express = require('express');
const app = express();

// --- [PHẦN 1: HỆ THỐNG PHÒNG THỦ ĐA TẦNG] ---
const defenseGrid = {
    jail: new Map(),
    stats: { totalBlocks: 0, integrity: 100 },
    // Cấu hình siết chặt để trị "Memory Hammer"
    config: { 
        maxHeaderSize: 1000, // Chặn ngay Header > 1KB (Bot đang gửi 2KB)
        banDuration: 60000 
    }
};

app.use((req, res, next) => {
    // 1. LẤY IP THẬT (Tránh bị qua mặt bởi X-Forwarded-For giả của bot)
    const realIP = req.socket.remoteAddress; 
    const spoofedIP = req.headers['x-forwarded-for']?.split(',')[0];
    const now = Date.now();

    // 2. PHÁT HIỆN "MÙI" BOT QUA HEADER RÁC
    // Nếu Header quá dài hoặc chứa chuỗi rác "Matrix-Breaker"
    const ua = req.headers['user-agent'] || "";
    const payloadSize = JSON.stringify(req.headers).length;

    if (defenseGrid.jail.has(realIP)) {
        defenseGrid.stats.totalBlocks++;
        return res.status(444).destroy(); // Ngắt kết nối vật lý để cứu RAM
    }

    // CHIẾN THUẬT VÁ LƯỚI: Chặn dấu hiệu đặc trưng của bot này
    if (payloadSize > defenseGrid.config.maxHeaderSize || ua.includes("Matrix-Breaker")) {
        defenseGrid.jail.set(realIP, now + defenseGrid.config.banDuration);
        defenseGrid.stats.integrity -= 2.0;
        return res.status(403).end();
    }

    next();
});

// --- [PHẦN 2: ĐỒ HỌA HUD V10.8] ---
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>PHANTOM CORE V10.8</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');
        body { margin: 0; background: #000; color: #00f3ff; font-family: 'Orbitron', sans-serif; overflow: hidden; height: 100vh; display: flex; align-items: center; justify-content: center; }
        .grid { position: fixed; width: 200%; height: 200%; background-image: linear-gradient(rgba(0,243,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.1) 1px, transparent 1px); background-size: 50px 50px; transform: perspective(500px) rotateX(60deg); animation: move 5s linear infinite; z-index: -1; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 0 50px; } }
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.9); padding: 50px; box-shadow: 0 0 50px #00f3ff; text-align: center; position: relative; }
        .radar { width: 120px; height: 120px; border: 2px solid #00f3ff; border-radius: 50%; margin: 0 auto 30px; position: relative; overflow: hidden; }
        .sweep { position: absolute; width: 100%; height: 100%; background: conic-gradient(from 0deg, rgba(0,243,255,0.5) 0%, transparent 50%); animation: sweep 1s linear infinite; }
        @keyframes sweep { to { transform: rotate(360deg); } }
        .pulse { animation: pulse 1s infinite; color: #ff0055; font-weight: bold; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.2; } }
    </style>
</head>
<body oncontextmenu="return false;">
    <div class="grid"></div>
    <div class="hud">
        <div class="radar"><div class="sweep"></div></div>
        <h1 style="letter-spacing: 10px;">PHANTOM CORE V10.8</h1>
        <div class="pulse">${defenseGrid.stats.integrity < 90 ? '⚠️ NEURAL OVERLOAD DETECTED ⚠️' : ''}</div>
        <div style="font-size: 18px; margin: 20px 0;">PURGED: ${defenseGrid.stats.totalBlocks} | SYNC: ${defenseGrid.stats.integrity.toFixed(2)}%</div>
        <div style="font-size: 10px; opacity: 0.5;">[ ANTI-SPOOFING & HEADER-SHIELD ACTIVE ]</div>
    </div>
    <script>
        // TRAP MỞ CONSOLE
        setInterval(() => { if(window.outerWidth - window.innerWidth > 100) window.location.reload(); }, 500);
        document.onkeydown = (e) => { if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && e.keyCode == 73)) return false; };
    </script>
</body>
</html>
    `);
});

module.exports = app;
