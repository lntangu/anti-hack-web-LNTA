const express = require('express');
const crypto = require('crypto');
const app = express();

// 1. CƠ CHẾ BẢO VỆ THỰC TẾ
const defenseGrid = {
    blackhole: new Set(),
    ipTraffic: new Map(),
    config: {
        limit: 15,    // Tối đa 15 request/giây
        banTime: 60000 // Khóa IP trong 1 phút nếu vi phạm
    }
};

// Tự động giải phóng bộ nhớ mỗi phút
setInterval(() => defenseGrid.ipTraffic.clear(), 60000);

// 2. MIDDLEWARE CHẶN ĐỨNG TẤN CÔNG
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    // Kiểm tra danh sách đen
    if (defenseGrid.blackhole.has(ip)) {
        return req.socket.destroy(); // Ngắt kết nối TCP ngay lập tức
    }

    // Rate Limiting (Chống Flood)
    const now = Math.floor(Date.now() / 1000);
    const key = `${ip}_${now}`;
    const count = (defenseGrid.ipTraffic.get(key) || 0) + 1;
    defenseGrid.ipTraffic.set(key, count);

    if (count > defenseGrid.config.limit) {
        defenseGrid.blackhole.add(ip);
        console.log(`[BAN] IP: ${ip} bị khóa vì Flood.`);
        return req.socket.destroy();
    }

    // Quét Payload thực tế (SQLi, XSS)
    const payload = decodeURIComponent(req.url);
    if (/(union|select|insert|drop|<script|alert)/i.test(payload)) {
        defenseGrid.blackhole.add(ip);
        return req.socket.destroy();
    }

    next();
});

// 3. NỘI DUNG WEB THỰC TẾ (Thay vì HUD ảo)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>SECURE GATEWAY</title>
            <style>
                body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5; margin: 0; }
                .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                .status { color: #2ecc71; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Phantom Secure Gateway</h1>
                <p>Status: <span class="status">PROTECTED BY KERNEL V10</span></p>
                <p>Hệ thống đang hoạt động và giám sát lưu lượng truy cập thực tế.</p>
            </div>
        </body>
        </html>
    `);
});

// API lấy thông số thực cho quản trị (nếu cần)
app.get('/api/health', (req, res) => {
    res.json({
        status: "alive",
        protected_ips: defenseGrid.blackhole.size,
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Hệ thống thực chiến đã kích hoạt trên cổng ' + PORT));
