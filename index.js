const express = require('express');
const crypto = require('crypto');
const app = express();

// --- [PHẦN 1: DỮ LIỆU CỐT LÕI - THỰC CHIẾN] ---
const defenseGrid = {
    ipTraffic: new Map(),
    blackhole: new Set(),
    stats: {
        totalBlocks: 0,
        totalReqs: 0,
        startTime: Date.now(),
        integrity: 100.00
    },
    config: { maxReqPerSec: 12 } // Giới hạn thực tế: 12 req/s
};

const _waf_signatures = [/union|select|insert|drop/i, /<script|alert/i, /\.\.\//i, /python|curl|requests|matrix-breaker/i];

// ⚠️ CHỐNG CRASH KHI QUÉT PAYLOAD (SỬA LỖI V10.0)
function scanPayload(req) {
    let penalty = 0;
    try {
        const unsafeUrl = req.url || "";
        const ua = req.headers['user-agent'] || "";
        const targetString = unsafeUrl + " " + ua;
        for (let rule of _waf_signatures) {
            if (rule.test(targetString)) penalty += 3;
        }
    } catch (e) { penalty += 5; } // Bọc try-catch cực an toàn
    return penalty;
}

// ⚠️ GIẢ LẬP CPUload HUYỀN THOẠI
function getSmoothCPU() {
    return (5.5 + Math.random() * 0.5).toFixed(2); // Trả về con số 5.5% đúng chất Phantom
}

// [NÂNG CẤP] TỰ PHỤC HỒI HỆ THỐNG
setInterval(() => {
    if (defenseGrid.stats.integrity < 100) {
        defenseGrid.stats.integrity = Math.min(100, defenseGrid.stats.integrity + 0.001);
    }
}, 5000);

// --- [PHẦN 2: TRUNG TÂM ĐIỀU KHIỂN - CHẶN ĐA TẦNG] ---
app.use((req, res, next) => {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';

    // BLACKHOLE THỰC THỤ
    if (defenseGrid.blackhole.has(clientIP)) {
        defenseGrid.stats.totalBlocks++;
        return res.status(403).end(); 
    }

    // RATE LIMITER & WAF
    const currentTime = Math.floor(Date.now() / 1000);
    const ipKey = `${clientIP}_${currentTime}`;
    let currentReqs = (defenseGrid.ipTraffic.get(ipKey) || 0) + 1;
    defenseGrid.ipTraffic.set(ipKey, currentReqs);

    if (currentReqs > defenseGrid.config.maxReqPerSec || scanPayload(req) >= 4) {
        defenseGrid.blackhole.add(clientIP); // Phát hiện tấn công -> Ban IP vĩnh viễn
        defenseGrid.stats.integrity -= 0.15; // Giảm Integrity
        return res.status(403).end();
    }

    defenseGrid.stats.totalReqs++;
    next();
});

// --- [PHẦN 3: ĐOẠN MÃ ĐỒ HỌA PHANTOM - FULL GRID & RADAR] ---
app.get('/', (req, res) => {
    const integrityColor = defenseGrid.stats.integrity < 95 ? "#ff0055" : "#00f3ff"; // Đổi màu khi Integrity thấp

    res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>PHANTOM NEURAL CORE V10.2</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
        body { margin: 0; background: #000; color: #00f3ff; font-family: 'Orbitron', sans-serif; overflow: hidden; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        
        /* Hiệu ứng GRID 3D Chuyển động */
        .grid-bg { position: fixed; width: 200%; height: 200%; background-image: 
            linear-gradient(rgba(0, 243, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 243, 255, 0.05) 1px, transparent 1px);
            background-size: 50px 50px; transform: perspective(500px) rotateX(60deg) translateY(-20%);
            animation: move 20s linear infinite; z-index: -1; top: 0; left: -50%; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 0 100%; } }

        /* Khung HUD */
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.9); padding: 40px; box-shadow: 0 0 30px #00f3ff; text-align: center; position: relative; backdrop-filter: blur(5px); transition: 0.5s; }
        .hud::before { content: "PHANTOM NEURAL CORE"; position: absolute; top: -12px; left: 20px; background: #000; padding: 0 10px; font-size: 12px; letter-spacing: 3px; font-weight: bold; }
        
        /* RADAR Giả lập */
        .radar-box { grid-column: span 3; position: relative; margin: 20px 0; height: 150px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(0,243,255,0.1) 0%, transparent 70%); }
        .radar { width: 150px; height: 150px; border: 2px solid var(--n-clr, #00f3ff); border-radius: 50%; position: relative; overflow: hidden; }
        .radar-sweep { position: absolute; width: 50%; height: 50%; background: linear-gradient(45deg, var(--n-clr, #00f3ff), transparent); border-radius: 100% 0 0 0; transform-origin: bottom right; animation: sweep 3s linear infinite; opacity: 0.8; }
        @keyframes sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        /* Grid số liệu */
        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
        .card { border: 1px solid rgba(0,243,255,0.2); padding: 20px; min-width: 120px; }
        .val { font-size: 28px; font-weight: bold; display: block; text-shadow: 0 0 10px #00f3ff; }
        .lbl { font-size: 9px; color: rgba(0,243,255,0.6); letter-spacing: 2px; margin-top: 5px; }
        .danger { border-color: #ff0055 !important; color: #ff0055; box-shadow: 0 0 20px #ff0055; }
        .danger .val { color: #ff0055; text-shadow: 0 0 10px #ff0055; }
        .danger .lbl { color: rgba(255,0,85,0.6); }

    </style>
</head>
<body id="b">
    <div class="grid-bg"></div>
    <div class="hud" style="--n-clr: ${integrityColor};">
        <h1 style="margin:0; letter-spacing:10px; font-size:24px;">CORE PROTOCOL</h1>
        
        <div class="radar-box"><div class="radar"><div class="radar-sweep"></div></div></div>

        <div class="stat-grid">
            <div class="card danger"><span class="val">${defenseGrid.stats.totalBlocks}</span><span class="lbl">ATTACKS PURGED</span></div>
            <div class="card"><span class="val">${getSmoothCPU()}%</span><span class="lbl">SYNAPTIC COMPUTATION</span></div>
            <div class="card"><span class="val" id="int" style="color:${integrityColor}; text-shadow:0 0 10px ${integrityColor};">${defenseGrid.stats.integrity.toFixed(2)}%</span><span class="lbl">CORE INTEGRITY</span></div>
        </div>
    </div>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Matrix Hub Online'));
