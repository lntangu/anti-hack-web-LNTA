const express = require('express');
const app = express();

// Cấu hình lõi bảo mật
const defenseGrid = {
    jail: new Set(),
    stats: { totalBlocks: 0 },
    config: { 
        // 1. IP WHITELIST (Thêm IP của ngài vào đây)
        whitelist: ["::1", "127.0.0.1", "172.17.96.1", "fe80::fdb8:ef32:9ff0"], 
        // 2. GIỚI HẠN HEADER (700 byte là ngưỡng an toàn tuyệt đối cho RAM 2GB)
        maxHeaderLimit: 700 
    }
};

// --- [ LỚP GIÁP ĐÁNH CHẶN SỚM - CHỐNG LỖI 500 ] ---
app.use((req, res, next) => {
    try {
        // Lấy IP thật từ hạ tầng Vercel
        const realIP = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

        // Ưu tiên người nhà
        if (defenseGrid.config.whitelist.includes(realIP)) return next();

        // KIỂM TRA NHANH KHÔNG TỐN RAM (Raw Check)
        const rawHeaderSize = req.rawHeaders.join('').length;
        const ua = req.headers['user-agent'] || "";

        // Nhận diện dấu vân tay bot "Matrix-Breaker" hoặc payload nặng
        if (defenseGrid.jail.has(realIP) || rawHeaderSize > defenseGrid.config.maxHeaderLimit || ua.includes("Matrix-Breaker")) {
            if (!defenseGrid.jail.has(realIP)) defenseGrid.jail.add(realIP);
            defenseGrid.stats.totalBlocks++;

            // [CHIẾN THUẬT FAKE SUCCESS]
            // Trả về 200 OK nhưng 0 byte dữ liệu để bot báo "Lọt" mà RAM server vẫn xanh
            res.writeHead(200, { 
                'Content-Type': 'text/plain',
                'Content-Length': '0',
                'Connection': 'close' 
            });
            return res.end();
        }

        next();
    } catch (err) {
        // Bọc toàn bộ trong try-catch để ngăn lỗi unhandled làm sập function
        console.error("Shield Guard Error:", err);
        res.writeHead(200).end(); 
    }
});

// --- [ GIAO DIỆN ĐIỀU KHIỂN & THỐNG KÊ ] ---
app.get('/api/stats', (req, res) => {
    res.json({ blocked: defenseGrid.stats.totalBlocks });
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>PHANTOM CORE V14.2</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');
        body { margin: 0; background: #000; color: #00f3ff; font-family: 'Orbitron', sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.9); padding: 50px; text-align: center; box-shadow: 0 0 30px #00f3ff; border-radius: 10px; }
        .radar { width: 80px; height: 80px; border: 2px solid #00f3ff; border-radius: 50%; margin: 0 auto 20px; position: relative; overflow: hidden; }
        .sweep { position: absolute; width: 100%; height: 100%; background: conic-gradient(from 0deg, rgba(0,243,255,0.3) 0%, transparent 40%); animation: sweep 2s linear infinite; }
        @keyframes sweep { to { transform: rotate(360deg); } }
        .counter { font-size: 48px; color: #ff0055; text-shadow: 0 0 15px #ff0055; margin: 10px 0; }
        .status { font-size: 12px; color: #00ff00; letter-spacing: 2px; }
    </style>
</head>
<body>
    <div class="hud">
        <div class="radar"><div class="sweep"></div></div>
        <div class="status">SYSTEM STABILIZED</div>
        <div class="counter" id="blockCount">${defenseGrid.stats.totalBlocks}</div>
        <div style="font-size: 10px; opacity: 0.7;">[ FLUID COMPUTE 2GB RAM OPTIMIZED ]</div>
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

module.exports = app;
