const express = require('express');
const app = express();

const defenseGrid = {
    jail: new Set(),
    stats: { totalBlocks: 0 },
    config: { 
        // 🛑 THAY IP CỦA NGÀI VÀO ĐÂY ĐỂ TRÁNH BỊ "SẬP BẪY" CHÍNH MÌNH
        whitelist: ["::1", "127.0.0.1", "172.17.96.1", "fe80::fdb8:ef32:9ff0"], 
        maxHeaderSize: 850 // Chặn đứng bot nhồi header 2KB để cứu RAM
    }
};

app.use((req, res, next) => {
    const realIP = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    if (defenseGrid.config.whitelist.includes(realIP)) return next();

    const ua = req.headers['user-agent'] || "";
    const headerPayload = JSON.stringify(req.headers);
    
    // NHẬN DIỆN BOT MATRIX-BREAKER
    const isBot = ua.includes("Matrix-Breaker") || headerPayload.length > defenseGrid.config.maxHeaderSize;

    if (defenseGrid.jail.has(realIP) || isBot) {
        defenseGrid.jail.add(realIP);
        defenseGrid.stats.totalBlocks++;

        // --- GIAO THỨC BẪY MẬT (HONEYPOT) ---
        // Trả về 200 OK để bot báo "Lọt"
        res.status(200);
        
        // Nhồi thêm các Header giả khiến Bot phải tốn CPU để phân tích
        res.set({
            'Content-Type': 'text/html',
            'X-Honeypot-Status': 'TRAPPED',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Content-Length': '0' // Trả về 0 byte để RAM server không nhúc nhích
        });

        return res.end(); // Ngắt luồng xử lý tại đây
    }

    next();
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>PHANTOM V14 - HONEYPOT</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');
        body { margin: 0; background: #000; color: #00f3ff; font-family: 'Orbitron', sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.95); padding: 50px; text-align: center; box-shadow: 0 0 40px #ff0055; border-radius: 5px; }
        .radar { width: 100px; height: 100px; border: 2px solid #ff0055; border-radius: 50%; margin: 0 auto 20px; position: relative; overflow: hidden; }
        .sweep { position: absolute; width: 100%; height: 100%; background: conic-gradient(from 0deg, rgba(255,0,85,0.4) 0%, transparent 40%); animation: sweep 1.5s linear infinite; }
        @keyframes sweep { to { transform: rotate(360deg); } }
        .stat { font-size: 45px; color: #ff0055; margin: 15px 0; text-shadow: 0 0 15px #ff0055; }
    </style>
</head>
<body>
    <div class="hud">
        <div class="radar"><div class="sweep"></div></div>
        <h1 style="font-size: 18px; letter-spacing: 3px;">HONEYPOT TRAP ACTIVE</h1>
        <div class="stat" id="blockCount">${defenseGrid.stats.totalBlocks}</div>
        <div style="color: #00ff00; font-size: 12px;">BOT STATUS: <span style="animation: blink 1s infinite;">FAKE SUCCESS</span></div>
    </div>
    <script>
        setInterval(async () => {
            try {
                const r = await fetch('/api/stats');
                const d = await r.json();
                document.getElementById('blockCount').innerText = d.blocked;
            } catch(e) {}
        }, 1000);
        @keyframes blink { 50% { opacity: 0; } }
    </script>
</body>
</html>
    `);
});

app.get('/api/stats', (req, res) => res.json({ blocked: defenseGrid.stats.totalBlocks }));

module.exports = app;
