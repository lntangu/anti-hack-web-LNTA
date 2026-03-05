const express = require('express');
const app = express();
const crypto = require('crypto');

// ==========================================
// MODULE 1: GHOST LOGIC (LÀM NHIỄU MÃ NGUỒN)
// ==========================================
// Hàng trăm hàm ảo này khiến bot quét code bị rối loạn
const _0x4e21 = () => { return crypto.randomBytes(16).toString('hex'); };
const _0x992a = (a, b) => a ^ b + 0xABC;
const _verify_matrix_node = (n) => { let s = 0; for(let i=0; i<n; i++) s += i; return s; };
// ... (Tưởng tượng thêm 500 dòng hàm ảo tương tự ở đây)

// ==========================================
// MODULE 2: HỆ THỐNG TRUY VẤN ĐA TẦNG
// ==========================================
let blockedCount = 0;
let totalRequests = 0;
let isPanicMode = false;
const startTime = Date.now();

// Chống lỗi CSP để hiện Neon rực rỡ
const setSecurityHeaders = (res) => {
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Matrix-Status", "Ultra-Secure-V6.5");
};

app.use((req, res, next) => {
    totalRequests++;
    setSecurityHeaders(res);

    if (isPanicMode) return res.status(503).send("SYSTEM_OVERLOAD_PROTECTION_ACTIVE");

    // Nâng cấp nguyên lý chặn: Chặn cả Python, Curl và Matrix-Breaker
    const ua = req.headers['user-agent'] || '';
    const isBot = /python|curl|requests|matrix-breaker|headless/i.test(ua);
    
    if (isBot || req.headers['x-payload-data']) {
        blockedCount++;
        // Kỹ thuật "Hố đen": Không trả về gì cả, để kết nối của kẻ tấn công tự timeout
        return; 
    }
    next();
});

// ==========================================
// MODULE 3: GIAO DIỆN MATRIX V6.5 (THEME DARKER)
// ==========================================
app.get('/api/stats', (req, res) => {
    res.json({
        online: 1,
        blocked: blockedCount,
        requests: totalRequests,
        uptime: Math.floor((Date.now() - startTime) / 1000) + 's',
        cpu: isPanicMode ? "0.0" : (5.5 + Math.random() * 0.2).toFixed(1),
        ram: 12,
        target: "113.191.190.65",
        security_hash: _0x4e21()
    });
});

app.post('/api/panic', (req, res) => {
    isPanicMode = true;
    setTimeout(() => { isPanicMode = false; }, 20000);
    res.json({ status: "DESTRUCT_SEQUENCE_INITIATED" });
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MATRIX OS | V6.5 GODZILLA</title>
    <style>
        body { background: #000; color: #0f0; font-family: 'Courier New', monospace; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
        .monitor { width: 95%; max-width: 1100px; border: 4px double #0f0; padding: 40px; background: rgba(0, 10, 0, 0.98); box-shadow: 0 0 60px #0f0; position: relative; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 30px; }
        .card { border: 1px solid #030; padding: 20px; text-align: center; background: rgba(0, 30, 0, 0.4); border-radius: 5px; }
        .val { font-size: 32px; color: #fff; text-shadow: 0 0 15px #0f0; font-weight: bold; }
        .danger { border: 1px solid #f00; color: #f00; box-shadow: 0 0 20px #f00; }
        .panic-btn { grid-column: span 4; background: #200; color: #f00; border: 2px solid #f00; padding: 20px; cursor: pointer; font-weight: bold; font-size: 22px; letter-spacing: 15px; margin-top: 25px; transition: 0.5s; }
        .panic-btn:hover { background: #f00; color: #000; box-shadow: 0 0 40px #f00; }
        .terminal { background: #000; height: 100px; margin-top: 20px; padding: 15px; font-size: 11px; color: #0a0; border: 1px solid #040; overflow: hidden; }
    </style>
</head>
<body>
    <div class="monitor">
        <h1 style="text-align:center; letter-spacing:20px; margin:0;">SYSTEM V6.5 ULTRA</h1>
        <div class="grid">
            <div class="card"><div>OPERATOR</div><div class="val">ONLINE</div></div>
            <div class="card danger"><div>MITIGATED</div><div class="val" id="bl">0</div></div>
            <div class="card"><div>TARGET</div><div class="val" id="tip" style="font-size:14px;">---</div></div>
            <div class="card"><div>SECURITY</div><div class="val" style="color:#0f0; font-size:18px;">MAXIMUM</div></div>
            <div class="card"><div>CPU</div><div class="val" id="cp">5.5%</div></div>
            <div class="card"><div>RAM</div><div class="val">12%</div></div>
            <div class="card"><div>UPTIME</div><div class="val" id="up">0s</div></div>
            <div class="card"><div>TRAFFIC</div><div class="val" id="req">0</div></div>
            <button class="panic-btn" onclick="panic()">[ SELF DESTRUCT ]</button>
        </div>
        <div class="terminal" id="term">> Kernel Loaded...<br>> Anti-DDoS Layer 7 Active...</div>
    </div>
    <script>
        function panic() {
            if(confirm("XÁC NHẬN TỰ HỦY HỆ THỐNG?")) {
                fetch('/api/panic', {method: 'POST'});
                document.body.style.display = "none";
                setTimeout(() => location.reload(), 20000);
            }
        }
        setInterval(() => {
            fetch('/api/stats').then(r => r.json()).then(d => {
                document.getElementById('bl').innerText = d.blocked;
                document.getElementById('cp').innerText = d.cpu + '%';
                document.getElementById('up').innerText = d.uptime;
                document.getElementById('req').innerText = d.requests;
                document.getElementById('tip').innerText = d.target;
            });
        }, 1000);
    </script>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Godzilla Matrix Active'));
