const express = require('express');
const app = express();
const path = require('path');

// Quản lý trạng thái hệ thống
let blockedCount = 0;
let requestLog = [];

// 1. MIDDLEWARE CHẶN TỪ CỬA (GATEKEEPER)
app.use((req, res, next) => {
    const ua = req.headers['user-agent'] || '';
    const payload = req.headers['x-payload-data']; // Bẫy Payload Bloating
    const isChaos = ua.includes('Matrix-Breaker') || req.query.data || req.query.t; // Nhận diện Chaos Mode

    // Nếu phát hiện dấu hiệu của Chaos Engine V22.0
    if (payload || isChaos) {
        blockedCount++;
        // Ngắt kết nối ngay (Mã 444) - Không cho phép script nhồi thêm dữ liệu vào RAM
        res.setHeader('Connection', 'close');
        return res.status(444).end(); 
    }
    next();
});

// Giới hạn dữ liệu đầu vào cực thấp để chống nhồi URL siêu dài
app.use(express.json({ limit: '1kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 2. API CUNG CẤP DỮ LIỆU DASHBOARD
app.get('/api/stats', (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    
    // Chỉ trả về JSON cực nhẹ để tránh lỗi 500
    res.json({
        online: 1,
        blocked: blockedCount,
        cpu: blockedCount > 500 ? "99.9" : "5.5",
        ram: "12",
        status: blockedCount > 1000 ? "CRITICAL ATTACK" : "PROTECTED",
        logs: [`[${new Date().toLocaleTimeString()}] MITIGATED: ${ip}`]
    });
});

module.exports = app;
