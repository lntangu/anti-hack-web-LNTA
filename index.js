const express = require('express');
const app = express();

let blockedCount = 0;

// Bộ lọc bảo vệ tầng 1: Chặn Chaos Engine V22
app.use((req, res, next) => {
    const isAttacker = 
        req.headers['x-payload-data'] || 
        req.headers['user-agent']?.includes('Matrix-Breaker') ||
        req.query.data || req.query.t;

    if (isAttacker) {
        blockedCount++;
        res.setHeader('Connection', 'close');
        return res.status(444).end(); // Ngắt kết nối ngay lập tức
    }
    next();
});

// API trả về thông số cho Dashboard
app.get('/api/stats', (req, res) => {
    res.json({
        online: 1,
        blocked: blockedCount,
        status: blockedCount > 500 ? "UNDER ATTACK" : "STABLE"
    });
});

// Trang chủ trả về HTML trực tiếp (không cần file public cho đỡ lỗi path)
app.get('/', (req, res) => {
    res.send(`
        <html>
            <body style="background:#000;color:#0f0;font-family:monospace;text-align:center;padding-top:50px;">
                <h1>MATRIX DEFENSE ACTIVE</h1>
                <div style="font-size:30px;">BLOCKED: <span id="b">${blockedCount}</span></div>
                <script>
                    setInterval(() => {
                        fetch('/api/stats').then(r => r.json()).then(d => {
                            document.getElementById('b').innerText = d.blocked;
                        });
                    }, 1000);
                </script>
            </body>
        </html>
    `);
});

module.exports = app;
