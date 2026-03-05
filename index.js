const express = require('express');
const app = express();
const path = require('path');
const os = require('os');

// Biến lưu trữ trạng thái hệ thống
let blockedCount = 0;
let totalRequests = 0;
const ipTracker = new Map();

// 1. TẤM KHIÊN LỌC GÓI TIN (Middleware)
app.use((req, res, next) => {
    totalRequests++;
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
    const now = Date.now();

    // NHẬN DIỆN CHAOS ENGINE V22.0
    const ua = req.headers['user-agent'] || '';
    const hasGarbage = req.headers['x-payload-data']; // Header rác 2KB bạn nhồi vào
    const isMatrixBot = ua.includes('Matrix-Breaker'); // User-Agent đặc trưng của bạn
    const isCacheBust = req.query.t || req.query.data; // Tham số phá cache

    // CHIẾN THUẬT NGẮT KẾT NỐI CỨNG (Hard Drop)
    if (hasGarbage || isMatrixBot || isCacheBust) {
        blockedCount++;
        // Trả về lỗi 431 (Header too large) hoặc 444 để đóng socket ngay lập tức
        res.setHeader('Connection', 'close');
        return res.status(431).send('Payload Too Large - Matrix Detected');
    }

    // CHỐNG SPAM TẦN SUẤT CAO (Rate Limiting)
    if (!ipTracker.has(ip)) {
        ipTracker.set(ip, { count: 1, last: now });
    } else {
        const data = ipTracker.get(ip);
        if (now - data.last < 1000) {
            data.count++;
            if (data.count > 5) { // Quá 5 req/s từ 1 nguồn là chặn
                blockedCount++;
                return res.status(429).end();
            }
        } else {
            ipTracker.set(ip, { count: 1, last: now });
        }
    }
    next();
});

// Giới hạn kích thước Header và Body ở mức tối thiểu để chống treo RAM
app.use(express.json({ limit: '1kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 2. API TRẢ DỮ LIỆU DASHBOARD
app.get('/api/stats', (req, res) => {
    res.json({
        online: ipTracker.size,
        total_req: totalRequests,
        blocked: blockedCount,
        cpu: (os.loadavg()[0] * 10).toFixed(1),
        ram: (1 - os.freemem() / os.totalmem()).toFixed(2) * 100,
        status: blockedCount > 1000 ? "UNDER HEAVY ATTACK" : "PROTECTED",
        logs: [{
            time: new Date().toLocaleTimeString(),
            type: "MITIGATING CHAOS V22",
            threat_level: "HIGH"
        }]
    });
});

module.exports = app;
