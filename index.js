const express = require('express');
const app = express();
const path = require('path');
const os = require('os');

// Cấu hình bộ nhớ đệm phòng thủ
let blockedCount = 0;
const ipTracker = new Map();
const blacklistedIps = new Set();

// 1. MIDDLEWARE SÁT THỦ - Chặn ngay tại cửa (Gatekeeper)
app.use((req, res, next) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
    const now = Date.now();

    // CHẶN HEADER RÁC: Nếu thấy "x-garbage-header" từ script của bạn, đá văng ngay
    if (req.headers['x-garbage-header'] || req.query.cache) {
        blockedCount++;
        res.setHeader('Connection', 'close');
        return res.status(444).end(); // Mã lỗi 444: Ngắt kết nối không trả dữ liệu để bảo vệ RAM
    }

    // THUẬT TOÁN CHẶN TẦN SUẤT (Rate Limiting)
    if (!ipTracker.has(ip)) {
        ipTracker.set(ip, { count: 1, last: now });
    } else {
        const data = ipTracker.get(ip);
        data.count++;
        
        // Nếu IP gửi > 3 yêu cầu/giây (Script của bạn đang là 36 RPS)
        if (now - data.last < 1000 && data.count > 3) {
            blockedCount++;
            return res.status(429).json({ error: "Slow down, Chaos Engine!" });
        }
        
        if (now - data.last >= 1000) {
            ipTracker.set(ip, { count: 1, last: now });
        }
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// 2. API CẤP DỮ LIỆU CHO DASHBOARD
app.get('/api/stats', (req, res) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;

    res.json({
        online: ipTracker.size,
        blocked: blockedCount,
        ip: clientIp,
        cpu: (os.loadavg()[0] * 10).toFixed(1),
        ram: Math.floor(Math.random() * 10) + 15,
        status: blockedCount > 100 ? "UNDER ATTACK" : "STABLE",
        logs: [{
            ip: clientIp,
            type: "MITIGATING CHAOS V22",
            time: new Date().toLocaleTimeString('vi-VN')
        }]
    });
});

module.exports = app;
