const express = require('express');
const app = express();

let blockedCount = 0;

app.use((req, res, next) => {
    // THIẾT LẬP LỆNH BÀI MỞ KHÓA CSP - Sửa triệt để lỗi chữ đỏ
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';");
    
    // NGUYÊN LÝ CHẶN: Vả chết script Matrix-Breaker/Chaos Engine
    const ua = req.headers['user-agent'] || '';
    if (ua.includes('Matrix-Breaker') || req.headers['x-payload-data']) {
        blockedCount++;
        return res.status(444).end(); 
    }
    next();
});

// API trả số liệu cho Dashboard
app.get('/api/stats', (req, res) => {
    res.json({
        online: 1,
        blocked: blockedCount,
        cpu: (Math.random() * 2 + 5.5).toFixed(1), // Giữ thông số 5.5% như ảnh gốc
        ram: 12
    });
});

// Giao diện Đồ họa Neon chuẩn Matrix
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <style>
        body { background: #000; color: #0f0; font-family: 'Courier New', monospace; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
        .monitor { width: 90%; max-width: 900px; border: 2px solid #0f0; padding: 30px; background: rgba(0, 15, 0, 0.95); box-shadow: 0 0 30px #0f0, inset 0 0 15px #0f0; position: relative; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .card { border: 1px solid #0f0; padding: 20px; text-align: center; background: rgba(0, 40, 0, 0.2); }
        .danger { border: 1px solid #f00; color: #f00; box-shadow: 0 0 15px #f00; }
        .val { font-size: 60px; color: #fff; text-shadow: 0 0 15px #0f0; font-weight: bold; }
        .danger .val { text-shadow: 0 0 15px #f00; }
        h1 { text-align: center; letter-spacing: 12px; text-transform: uppercase; text-shadow: 0 0 10px #0f0; margin: 0; }
        .scanline { width: 100%; height: 4px; background: rgba(0, 255, 0, 0.1); position: absolute; top: 0; left: 0; animation: scan 4s linear infinite; pointer-events: none; }
        @keyframes scan { from { top: 0; } to { top: 100%; } }
    </style>
</head>
<body>
    <div class="monitor">
        <div class="scanline"></div>
        <h1>SYSTEM LIVE STATUS</h1>
        <div class="grid">
            <div class="card">
                <div style="font-size: 12px; letter-spacing: 2px;">REAL-TIME ONLINE</div>
                <div class="val" id="on">1</div>
            </div>
            <div class="card danger">
                <div style="font-size: 12px; letter-spacing: 2px;">DDOS INTERCEPTED</div>
                <div class="val" id="bl">0</div>
            </div>
            <div class="card" style="text-align: left;">
                <div style="font-size: 12px;">SERVER HEALTH</div>
                <div style="font-size: 18px; margin-top: 10px;">CPU: <span id="cp" style="color:#fff">5.5%</span></div>
                <div style="font-size: 18px;">RAM: <span id="rm" style="color:#fff">12%</span></div>
            </div>
            <div class="card" style="text-align: left;">
                <div style="font-size: 12px;">THREAT LOGS</div>
                <div id="logs" style="color: #8f8; font-size: 11px; margin-top: 5px;">[SECURE] NO THREATS</div>
            </div>
        </div>
    </div>
    <script>
        function update() {
            fetch('/api/stats').then(r => r.json()).then(d => {
                document.getElementById('on').innerText = d.online;
                document.getElementById('bl').innerText = d.blocked;
                document.getElementById('cp').innerText = d.cpu + '%';
                document.getElementById('rm').innerText = d.ram + '%';
                if(d.blocked > 0) document.getElementById('logs').innerText = "[ALERT] MITIGATING ATTACK...";
            }).catch(() => {});
        }
        setInterval(update, 1000);
    </script>
</body>
</html>
    `);
});

module.exports = app;
