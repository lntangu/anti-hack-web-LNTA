const express = require('express');
const app = express();

const defenseGrid = {
    jail: new Set(),
    stats: { totalBlocks: 0 },
    config: { 
        whitelist: ["::1", "127.0.0.1", "172.17.96.1", "fe80::fdb8:ef32:9ff0"], 
        maxHeaderLimit: 750 // Ngưỡng an toàn chống lỗi 500
    }
};

// --- [ LỚP GIÁP BẢO VỆ ] ---
app.use((req, res, next) => {
    try {
        const realIP = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

        if (defenseGrid.config.whitelist.includes(realIP)) return next();

        const rawHeaderSize = req.rawHeaders.join('').length;
        const ua = req.headers['user-agent'] || "";

        // Kiểm tra bot bằng Header rác hoặc User-Agent
        if (defenseGrid.jail.has(realIP) || rawHeaderSize > defenseGrid.config.maxHeaderLimit || ua.includes("Matrix-Breaker")) {
            defenseGrid.jail.add(realIP);
            defenseGrid.stats.totalBlocks++;

            // TRẢ VỀ FAKE SUCCESS (200 OK) ĐỂ BOT KHÔNG BÁO LỖI
            res.writeHead(200, { 'Content-Length': '0', 'Connection': 'close' });
            return res.end();
        }
        next();
    } catch (err) {
        res.writeHead(200).end(); 
    }
});

// --- [ GIAO DIỆN RADAR CHÍNH CHỦ ] ---
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>PHANTOM CORE V15</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');
        body { margin: 0; background: #000; color: #00f3ff; font-family: 'Orbitron', sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .grid { position: fixed; width: 200%; height: 200%; background-image: linear-gradient(rgba(0,243,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.05) 1px, transparent 1px); background-size: 50px 50px; transform: perspective(500px) rotateX(60deg); animation: move 10s linear infinite; z-index: -1; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 0 50px; } }
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.9); padding: 50px; box-shadow: 0 0 30px #00f3ff; text-align: center; border-radius: 5px; }
        .radar { width: 100px; height: 100px; border: 2px solid #00f3ff; border-radius: 50%; margin: 0 auto 20px; position: relative; overflow: hidden; }
        .sweep { position: absolute; width: 100%; height: 100%; background: conic-gradient(from 0deg, rgba(0,243,255,0.4) 0%, transparent 40%); animation: sweep 2s linear infinite; }
        @keyframes sweep { to { transform: rotate(360deg); } }
        .stat-count { font-size: 40px; color: #ff0055; text-shadow: 0 0 15px #ff0055; margin: 10px 0; }
        .status-text { font-size: 12px; color: #00ff00; letter-spacing: 3px; }
    </style>
</head>
<body>
    <div class="grid"></div>
    <div class="hud">
        <div class="radar"><div class="sweep"></div></div>
        <div class="status-text">SYSTEM STABILIZED</div>
        <div class="stat-count" id="blockCount">${defenseGrid.stats.totalBlocks}</div>
        <p style="font-size: 10px; opacity: 0.6;">[ GHOST PROTOCOL ACTIVE ]</p>
    </div>
    <script>
        setInterval(async () => {
            try {
                const r = await fetch('/api/stats');
                const d = await r.json();
                document.getElementById('blockCount').innerText = d.blocked;
            } catch(e) {}
        }, 1500);
    </script>
</body>
</html>
    `);
});

app.get('/api/stats', (req, res) => res.json({ blocked: defenseGrid.stats.totalBlocks }));

module.exports = app;
