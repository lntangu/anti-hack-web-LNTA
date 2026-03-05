const express = require('express');
const app = express();

let blockedCount = 0;
let totalRequests = 0;
let isPanicMode = false; // Trạng thái tự hủy tạm thời
const startTime = Date.now();

app.use((req, res, next) => {
    // Nếu đang trong chế độ tự hủy, giả vờ trả về lỗi hệ thống nghiêm trọng
    if (isPanicMode) {
        return res.status(500).send("CRITICAL_SYSTEM_FAILURE: DATA_CORRUPTED");
    }

    totalRequests++;
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';");
    
    const ua = req.headers['user-agent'] || '';
    if (ua.includes('Matrix-Breaker') || ua.includes('python') || req.headers['x-payload-data']) {
        blockedCount++;
        return res.status(444).end(); 
    }
    next();
});

// Điều khiển chế độ tự hủy
app.post('/api/panic', (req, res) => {
    isPanicMode = true;
    setTimeout(() => { isPanicMode = false; }, 30000); // Tự hồi sinh sau 30 giây
    res.json({ status: "destructing" });
});

app.get('/api/stats', (req, res) => {
    res.json({
        online: 1,
        blocked: blockedCount,
        requests: totalRequests,
        uptime: Math.floor((Date.now() - startTime) / 1000) + 's',
        cpu: isPanicMode ? "0.0" : (Math.random() * 1 + 5.5).toFixed(1),
        ram: isPanicMode ? "0.0" : "12",
        target: "113.191.190.65" // IP mô phỏng kẻ tấn công
    });
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>NEON DEFENSE HUB V5</title>
    <style>
        body { background: #000; color: #0f0; font-family: 'Courier New', monospace; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; transition: 0.5s; }
        .monitor { width: 95%; max-width: 1000px; border: 2px solid #0f0; padding: 30px; background: rgba(0, 15, 0, 0.9); box-shadow: 0 0 30px #0f0, inset 0 0 15px #0f0; position: relative; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; }
        .card { border: 1px solid #0f0; padding: 15px; text-align: center; background: rgba(0, 40, 0, 0.2); }
        .danger { border: 1px solid #f00; color: #f00; box-shadow: 0 0 15px #f00; }
        .val { font-size: 35px; color: #fff; text-shadow: 0 0 10px #0f0; font-weight: bold; }
        .panic-btn { grid-column: span 3; background: #300; color: #f00; border: 2px dashed #f00; padding: 15px; cursor: pointer; font-weight: bold; letter-spacing: 5px; margin-top: 15px; transition: 0.3s; }
        .panic-btn:hover { background: #f00; color: #000; box-shadow: 0 0 20px #f00; }
        .panic-active { filter: invert(1) hue-rotate(180deg) blur(5px); pointer-events: none; }
    </style>
</head>
<body id="b">
    <div class="monitor" id="m">
        <h1>CORE DEFENSE SYSTEM</h1>
        <div class="grid">
            <div class="card"><div style="font-size:10px;">OPERATOR</div><div class="val">1</div></div>
            <div class="card danger"><div style="font-size:10px;">BLOCKED</div><div class="val" id="bl">0</div></div>
            <div class="card"><div style="font-size:10px;">TARGET IP</div><div class="val" id="tip" style="font-size:18px;margin-top:10px;">---</div></div>
            <div class="card"><div>CPU</div><div class="val" id="cp">5.5%</div></div>
            <div class="card"><div>RAM</div><div class="val" id="rm">12%</div></div>
            <div class="card"><div>UPTIME</div><div class="val" id="up">0s</div></div>
            <button class="panic-btn" onclick="panic()">[ SELF-DESTRUCT PROTOCOL ]</button>
        </div>
    </div>
    <script>
        function panic() {
            if(confirm("XÁC NHẬN TỰ HỦY HỆ THỐNG?")) {
                fetch('/api/panic', {method: 'POST'});
                document.getElementById('b').classList.add('panic-active');
                setTimeout(() => { location.reload(); }, 30000);
            }
        }
        setInterval(() => {
            fetch('/api/stats').then(r => r.json()).then(d => {
                document.getElementById('bl').innerText = d.blocked;
                document.getElementById('cp').innerText = d.cpu + '%';
                document.getElementById('rm').innerText = d.ram + '%';
                document.getElementById('up').innerText = d.uptime;
                document.getElementById('tip').innerText = d.target;
            });
        }, 1000);
    </script>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Phantom Protocol Online'));
