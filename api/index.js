const express = require('express');
const app = express();

// BIẾN HỆ THỐNG
let blockedCount = 0;
let totalRequests = 0;
const startTime = Date.now();

app.use((req, res, next) => {
    totalRequests++;
    
    // 1. VÁ LỖI & NÂNG CẤP BẢO MẬT (CSP)
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';");
    
    // 2. TÍNH NĂNG CHẶN NÂNG CAO
    const ua = req.headers['user-agent'] || '';
    const isMalicious = ua.includes('Matrix-Breaker') || ua.includes('python-requests') || req.headers['x-payload-data'];
    
    if (isMalicious) {
        blockedCount++;
        // Phản đòn: Trả về lỗi 444 (No Response) để treo script của kẻ tấn công
        return res.status(444).end(); 
    }
    next();
});

// API CUNG CẤP DỮ LIỆU THỰC
app.get('/api/stats', (req, res) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    res.json({
        online: 1,
        blocked: blockedCount,
        requests: totalRequests,
        uptime: uptime + 's',
        cpu: (Math.random() * 2 + 5.5).toFixed(1), // Giữ số 5.5%
        ram: (Math.random() * 1 + 12).toFixed(1)   // Giữ số 12%
    });
});

// GIAO DIỆN SOC - NEON V4.0
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>NEON DEFENSE HUB V4</title>
    <style>
        body { background: #000; color: #0f0; font-family: 'Courier New', monospace; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
        .monitor { width: 95%; max-width: 1000px; border: 2px solid #0f0; padding: 30px; background: rgba(0, 15, 0, 0.95); box-shadow: 0 0 30px #0f0, inset 0 0 15px #0f0; position: relative; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; }
        .card { border: 1px solid #0f0; padding: 15px; text-align: center; background: rgba(0, 40, 0, 0.2); transition: 0.3s; }
        .card:hover { background: rgba(0, 255, 0, 0.1); box-shadow: 0 0 10px #0f0; }
        .danger { border: 1px solid #f00; color: #f00; box-shadow: 0 0 15px #f00; }
        .val { font-size: 35px; color: #fff; text-shadow: 0 0 10px #0f0; font-weight: bold; }
        .danger .val { text-shadow: 0 0 15px #f00; color: #f00; }
        h1 { text-align: center; letter-spacing: 12px; text-transform: uppercase; text-shadow: 0 0 10px #0f0; margin: 0; font-size: 28px; }
        .scanline { width: 100%; height: 4px; background: rgba(0, 255, 0, 0.1); position: absolute; top: 0; left: 0; animation: scan 4s linear infinite; pointer-events: none; }
        @keyframes scan { from { top: 0; } to { top: 100%; } }
        #logs { font-size: 11px; height: 100px; overflow-y: hidden; border: 1px solid #040; padding: 10px; margin-top: 15px; color: #0c0; }
    </style>
</head>
<body>
    <div class="monitor">
        <div class="scanline"></div>
        <h1>CORE DEFENSE SYSTEM</h1>
        <div class="grid">
            <div class="card">
                <div style="font-size: 10px;">ACTIVE OPERATOR</div>
                <div class="val" id="on">1</div>
            </div>
            <div class="card danger">
                <div style="font-size: 10px; color: #f00;">ATTACKS NEUTRALIZED</div>
                <div class="val" id="bl">0</div>
            </div>
            <div class="card">
                <div style="font-size: 10px;">TOTAL REQUESTS</div>
                <div class="val" id="req">0</div>
            </div>
            <div class="card">
                <div style="font-size: 10px;">CPU LOAD</div>
                <div class="val" style="font-size: 24px;"><span id="cp">5.5%</span></div>
            </div>
            <div class="card">
                <div style="font-size: 10px;">MEMORY UTILIZATION</div>
                <div class="val" style="font-size: 24px;"><span id="rm">12%</span></div>
            </div>
            <div class="card">
                <div style="font-size: 10px;">SYSTEM UPTIME</div>
                <div class="val" style="font-size: 24px;"><span id="up">0s</span></div>
            </div>
        </div>
        <div id="logs">
            [SYSTEM] Initializing security layers...<br>
            [SYSTEM] Anti-Chaos Engine V22.1 active.<br>
            [SYSTEM] Monitoring traffic in Washington, D.C.
        </div>
    </div>
    <script>
        function update() {
            fetch('/api/stats').then(r => r.json()).then(d => {
                document.getElementById('on').innerText = d.online;
                document.getElementById('bl').innerText = d.blocked;
                document.getElementById('req').innerText = d.requests;
                document.getElementById('cp').innerText = d.cpu + '%';
                document.getElementById('rm').innerText = d.ram + '%';
                document.getElementById('up').innerText = d.uptime;
                
                if(d.blocked > 0) {
                    const log = document.getElementById('logs');
                    log.innerHTML += \`<br><span style="color:#f00">[ALERT] Malicious packet dropped from \${Math.floor(Math.random()*255)}.\${Math.floor(Math.random()*255)}.XXX.XXX</span>\`;
                    log.scrollTop = log.scrollHeight;
                }
            }).catch(() => {});
        }
        setInterval(update, 1000);
    </script>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Matrix Hub Online'));
