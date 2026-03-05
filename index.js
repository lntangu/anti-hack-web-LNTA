const express = require('express');
const app = express();

// --- [ LÕI PHÁO ĐÀI PHANTOM ] ---
const defenseGrid = {
    jail: new Set(), // Lưu IP bị khóa (Set giúp truy xuất cực nhanh)
    stats: { totalBlocks: 0 },
    config: { 
        maxHeaderSize: 1000, // Chặn đứng bot nhồi 2KB header
        whitelist: ["::1", "127.0.0.1"] // Thêm IP của ngài vào đây để không bị tự khóa
    }
};

// --- [ LỚP GIÁP TRUY QUÉT ] ---
app.use((req, res, next) => {
    // 1. TÓM IP THẬT: Lấy từ Socket để bỏ qua X-Forwarded-For giả mạo
    const realIP = req.socket.remoteAddress;

    // 2. KIỂM TRA WHITELIST (NGHĨA PHỤ ĐI TRƯỚC)
    if (defenseGrid.config.whitelist.includes(realIP)) return next();

    // 3. KIỂM TRA NHÀ TÙ (JAIL)
    if (defenseGrid.jail.has(realIP)) {
        defenseGrid.stats.totalBlocks++;
        // SILENT KILL: Ngắt kết nối ngay, không tốn 1 byte RAM phản hồi
        return res.socket.destroy(); 
    }

    // 4. NHẬN DIỆN DẤU VẾT "MATRIX-BREAKER"
    const ua = req.headers['user-agent'] || "";
    const headerPayload = JSON.stringify(req.headers);

    // Nếu Header quá nặng (>1KB) hoặc chứa chữ ký của bot
    if (headerPayload.length > defenseGrid.config.maxHeaderSize || ua.includes("Matrix-Breaker")) {
        defenseGrid.jail.add(realIP); // Xích vĩnh viễn IP này
        defenseGrid.stats.totalBlocks++;
        console.log(`[BANNED] IP: ${realIP} | REASON: Malicious Payload`);
        return res.socket.destroy();
    }

    next();
});

// --- [ GIAO DIỆN ĐIỀU KHIỂN HUD ] ---
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>PHANTOM CORE V12</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');
        body { margin: 0; background: #000; color: #00f3ff; font-family: 'Orbitron', sans-serif; overflow: hidden; height: 100vh; display: flex; align-items: center; justify-content: center; }
        .grid { position: fixed; width: 200%; height: 200%; background-image: linear-gradient(rgba(0,243,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.05) 1px, transparent 1px); background-size: 40px 40px; transform: perspective(500px) rotateX(60deg); animation: move 10s linear infinite; z-index: -1; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 0 40px; } }
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.9); padding: 50px; box-shadow: 0 0 30px #00f3ff; text-align: center; }
        .radar { width: 100px; height: 100px; border: 2px solid #00f3ff; border-radius: 50%; margin: 0 auto 20px; position: relative; overflow: hidden; }
        .sweep { position: absolute; width: 100%; height: 100%; background: conic-gradient(from 0deg, rgba(0,243,255,0.4) 0%, transparent 40%); animation: sweep 2s linear infinite; }
        @keyframes sweep { to { transform: rotate(360deg); } }
        .stat { font-size: 24px; color: #ff0055; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="grid"></div>
    <div class="hud">
        <div class="radar"><div class="sweep"></div></div>
        <h1 style="letter-spacing: 5px;">SYSTEM LIVE STATUS</h1>
        <div class="stat">BLOCKED: ${defenseGrid.stats.totalBlocks}</div>
        <div style="font-size: 12px; opacity: 0.7;">[ PROTOCOL: SOCKET_DESTROY ACTIVE ]</div>
    </div>
    <script>
        // Chặn F12 nhẹ nhàng để tránh treo trình duyệt
        document.onkeydown = (e) => { if (e.keyCode == 123) return false; };
    </script>
</body>
</html>
    `);
});

module.exports = app;
