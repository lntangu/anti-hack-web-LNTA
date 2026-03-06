const express = require('express');
const app = express();

// --- [ PHẦN 1: CẤU HÌNH HỆ THỐNG PHÒNG THỦ ] ---
const defenseGrid = {
    jail: new Set(),
    stats: { totalBlocks: 0 },
    config: { 
        // 🛑 ĐIỀN IP CỦA NGÀI VÀO ĐÂY (Lấy từ "What is my IP" trên Google)
        whitelist: ["::1", "127.0.0.1", "fe80::fdb8:ef32:9ff0", "172.17.96.1"], 
        maxHeaderSize: 1000 // Chặn ngay Header > 1KB để tránh lỗi 500
    }
};

// --- [ PHẦN 2: MIDDLEWARE VÁ LƯỚI ] ---
app.use((req, res, next) => {
    // Tóm IP thực: Ưu tiên X-Forwarded-For của Vercel, nếu không có thì lấy từ Socket
    const realIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    // 1. ƯU TIÊN NGHĨA PHỤ: Nếu IP nằm trong Whitelist thì cho qua luôn
    if (defenseGrid.config.whitelist.includes(realIP)) return next();

    // 2. NHẬN DIỆN DẤU VẾT BOT ĐA HÌNH
    const ua = req.headers['user-agent'] || "";
    const headerPayload = JSON.stringify(req.headers);
    const isMalicious = ua.includes("Matrix-Breaker") || headerPayload.length > defenseGrid.config.maxHeaderSize;

    // 3. THỰC THI LỆNH TRUY QUÉT
    if (defenseGrid.jail.has(realIP) || isMalicious) {
        if (!defenseGrid.jail.has(realIP)) {
            defenseGrid.jail.add(realIP);
            console.log(`[BANNED] IP: ${realIP} | Reason: Malicious Activity`);
        }
        defenseGrid.stats.totalBlocks++;
        
        // SILENT KILL: Ngắt kết nối vật lý ngay để cứu RAM, tránh lỗi 500
        if (res.socket) {
            res.socket.destroy();
        }
        return;
    }

    next();
});

// --- [ PHẦN 3: GIAO DIỆN ĐIỀU KHIỂN ] ---
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
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.9); padding: 50px; box-shadow: 0 0 30px #00f3ff; text-align: center; border-radius: 10px; }
        .radar { width: 100px; height: 100px; border: 2px solid #00f3ff; border-radius: 50%; margin: 0 auto 20px; position: relative; overflow: hidden; }
        .sweep { position: absolute; width: 100%; height: 100%; background: conic-gradient(from 0deg, rgba(0,243,255,0.4) 0%, transparent 40%); animation: sweep 2s linear infinite; }
        @keyframes sweep { to { transform: rotate(360deg); } }
        .stat-val { font-size: 32px; color: #ff0055; text-shadow: 0 0 10px #ff0055; }
    </style>
</head>
<body>
    <div class="grid"></div>
    <div class="hud">
        <div class="radar"><div class="sweep"></div></div>
        <h1 style="letter-spacing: 5px; font-size: 18px;">SYSTEM STABILIZED</h1>
        <div class="stat-val" id="blockCount">${defenseGrid.stats.totalBlocks}</div>
        <p style="font-size: 10px; margin-top:15px; color: #00ff00;">[ WHITELIST & SOCKET_KILL ACTIVE ]</p>
    </div>
    <script>
        // Tự động cập nhật số lượng Blocked sau mỗi 2 giây
        setInterval(async () => {
            try {
                const r = await fetch('/api/stats');
                const d = await r.json();
                document.getElementById('blockCount').innerText = d.blocked;
            } catch(e) {}
        }, 2000);
        // Chặn F12 để bot khó soi code
        document.onkeydown = (e) => { if (e.keyCode == 123) return false; };
    </script>
</body>
</html>
    `);
});

// API lấy thông số thời gian thực
app.get('/api/stats', (req, res) => {
    res.json({ blocked: defenseGrid.stats.totalBlocks });
});

module.exports = app;
