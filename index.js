const express = require('express');
const app = express();

// Hệ thống theo dõi thực tế
const stats = { blocks: 0, reqs: 0, startTime: Date.now() };

app.use((req, res, next) => {
    stats.reqs++;
    // Chặn SQLi đơn giản để có số liệu "Blocks" cho ngầu
    if (req.url.includes("select") || req.url.includes("drop")) {
        stats.blocks++;
        return res.status(403).send("BLOCKED BY PHANTOM CORE");
    }
    next();
});

// GIAO DIỆN PHANTOM V10 (Hào nhoáng nhưng thực chất)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>PHANTOM CORE V10</title>
    <style>
        body { background: #000; color: #00f3ff; font-family: 'Courier New', monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; overflow: hidden; }
        .grid { position: absolute; width: 200%; height: 200%; background-image: linear-gradient(rgba(0,243,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.1) 1px, transparent 1px); background-size: 40px 40px; transform: perspective(500px) rotateX(60deg); animation: move 10s linear infinite; z-index: -1; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 0 40px; } }
        .hud { border: 2px solid #00f3ff; padding: 30px; background: rgba(0,0,0,0.9); box-shadow: 0 0 20px #00f3ff; text-align: center; }
        .stat-box { display: inline-block; margin: 10px; padding: 15px; border: 1px solid rgba(0,243,255,0.3); }
        .val { font-size: 30px; font-weight: bold; display: block; }
        .label { font-size: 10px; letter-spacing: 2px; }
        .btn-panic { margin-top: 20px; padding: 10px 40px; background: transparent; border: 1px solid #ff0055; color: #ff0055; cursor: pointer; font-family: inherit; }
    </style>
</head>
<body>
    <div class="grid"></div>
    <div class="hud">
        <h1 style="letter-spacing: 5px;">CORE DEFENSE SYSTEM</h1>
        <div class="stat-box"><span class="label">BLOCKED</span><span class="val" id="b">${stats.blocks}</span></div>
        <div class="stat-box"><span class="label">TRAFFIC</span><span class="val" id="r">${stats.reqs}</span></div>
        <div class="stat-box"><span class="label">UPTIME</span><span class="val" id="u">0s</span></div>
        <br>
        <button class="btn-panic">[ SELF-DESTRUCT PROTOCOL ]</button>
    </div>
    <script>
        setInterval(() => {
            // Tự động cập nhật số giây (giả lập uptime cho giống ảnh ngài gửi)
            const uptime = Math.floor((Date.now() - ${stats.startTime}) / 1000);
            document.getElementById('u').innerText = uptime + "s";
        }, 1000);
    </script>
</body>
</html>
    `);
});

module.exports = app;
