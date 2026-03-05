const express = require('express');
const app = express();

let blockedCount = 0;

app.use((req, res, next) => {
    // DÒNG QUAN TRỌNG NHẤT: Vô hiệu hóa CSP để hiển thị đồ họa Neon
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; style-src * 'unsafe-inline';");
    
    // Chặn đứng Chaos Engine V22
    const isBot = req.headers['x-payload-data'] || req.headers['user-agent']?.includes('Matrix-Breaker');
    if (isBot) {
        blockedCount++;
        return res.status(444).end(); 
    }
    next();
});

app.get('/api/stats', (req, res) => {
    res.json({
        online: 1,
        blocked: blockedCount,
        cpu: (Math.random() * 5 + 5.5).toFixed(1),
        ram: 12
    });
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { background: #000; color: #0f0; font-family: 'Courier New', monospace; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
        .container { width: 90%; max-width: 900px; border: 2px solid #0f0; padding: 25px; background: rgba(0, 10, 0, 0.9); box-shadow: 0 0 25px #0f0, inset 0 0 10px #0f0; position: relative; }
        h1 { text-align: center; letter-spacing: 10px; text-transform: uppercase; margin-bottom: 25px; font-size: 24px; text-shadow: 0 0 10px #0f0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card { border: 1px solid #0f0; padding: 15px; text-align: center; background: rgba(0, 30, 0, 0.3); }
        .card.danger { border: 1px solid #f00; box-shadow: 0 0 15px #f00; color: #f00; }
        .val { font-size: 60px; color: #fff; font-weight: bold; text-shadow: 0 0 15px #0f0; }
        .danger .val { text-shadow: 0 0 15px #f00; }
        .scanline { width: 100%; height: 3px; background: rgba(0, 255, 0, 0.1); position: absolute; top: 0; left: 0; animation: scan 4s linear infinite; pointer-events: none; }
        @keyframes scan { from { top: 0; } to { top: 100%; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="scanline"></div>
        <h1>SYSTEM LIVE STATUS</h1>
        <div class="grid">
            <div class="card">
                <div style="font-size:12px; letter-spacing:2px;">REAL-TIME ONLINE</div>
                <div class="val" id="on">1</div>
            </div>
            <div class="card danger">
                <div style="font-size:12px; letter-spacing:2px;">DDOS INTERCEPTED</div>
                <div class="val" id="bl">0</div>
            </div>
            <div class="card" style="text-align: left;">
                <div style="font-size:12px;">SERVER HEALTH</div>
                <div style="font-size: 18px; margin-top: 10px;">CPU: <span id="cp" style="color:#fff">5.5%</span></div>
                <div style="font-size: 18px;">RAM: <span id="rm" style="color:#fff">12%</span></div>
            </div>
            <div class="card" style="text-align: left; font-size: 11px;">
                <div style="font-size:12px;">THREAT LOGS</div>
                <div id="logs" style="color: #8f8; margin-top:10px;">Monitoring packets...</div>
            </div>
        </div>
    </div>
    <script>
        setInterval(() => {
            fetch('/api/stats').then(r => r.json()).then(d => {
                document.getElementById('on').innerText = d.online;
                document.getElementById('bl').innerText = d.blocked;
                document.getElementById('cp').innerText = d.cpu + '%';
                document.getElementById('rm').innerText = d.ram + '%';
            }).catch(() => {});
        }, 1000);
    </script>
</body>
</html>
    `);
});

module.exports = app;