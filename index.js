const express = require('express');
const app = express();
const path = require('path');

// Biến đếm nằm ngoài để tránh bị reset khi function nóng máy
let globalBlocked = 0;

// 1. LỰC LƯỢNG PHẢN ỨNG NHANH
app.use((req, res, next) => {
    // Tóm gáy script qua Header Payload 2KB hoặc User-Agent
    const isAttacker = 
        req.headers['x-payload-data'] || 
        req.headers['user-agent']?.includes('Matrix-Breaker') ||
        req.query.data || req.query.t;

    if (isAttacker) {
        globalBlocked++;
        // Phản hồi cực ngắn để giải phóng kết nối ngay lập tức
        res.writeHead(444, { 'Connection': 'close' });
        return res.end();
    }
    next();
});

// Giới hạn cứng để không cho phép nhồi rác vào Body
app.use(express.json({ limit: '512b' })); 
app.use(express.static(path.join(__dirname, 'public')));

// API cực nhẹ, không dùng thêm thư viện hệ thống nào để tiết kiệm CPU
app.get('/api/stats', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
        online: 1,
        blocked: globalBlocked,
        status: globalBlocked > 1000 ? "CRITICAL" : "OPERATIONAL",
        cpu: "DYNAMIC",
        ram: "OPTIMIZED"
    }));
});

module.exports = app;
