const express = require('express');
const app = express();
const path = require('path');
const crypto = require('crypto');

// Cấu hình thông số bảo mật cao
const CONFIG = {
    MAX_HEADER_SIZE: 1024, // Chống Payload Bloating 2KB của bạn
    BURST_LIMIT: 5,        // Giới hạn Burst Request
    WINDOW_MS: 1000        // Cửa sổ thời gian kiểm tra (1s)
};

let stats = { blocked: 0, online: new Set(), lastAttacker: 'None' };
const rateLimiter = new Map();

// 1. TẦNG 1: LỌC VÂN TAY (Fingerprint Filtering)
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || '';
    const heavyHeader = req.headers['x-payload-data']; // Bắt thóp script

    // Nhận diện hành vi bất thường từ script V22.0
    const isSuspicious = 
        ua.includes('Matrix-Breaker') || 
        (heavyHeader && heavyHeader.length > CONFIG.MAX_HEADER_SIZE) ||
        req.query.data?.length > 100 ||
        req.query.t && (Date.now() - parseInt(req.query.t) > 60000);

    if (isSuspicious) {
        stats.blocked++;
        stats.lastAttacker = ip;
        // Phản hồi giả lập lỗi server để script của bạn tưởng đã thành công nhưng thực tế là bị ngắt kết nối
        res.setHeader('X-Defense-Logic', 'Active');
        return res.status(403).end(); 
    }
    next();
});

// 2. TẦNG 2: THUẬT TOÁN TOKEN BUCKET (Chống Burst Mode)
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const now = Date.now();
    
    if (!rateLimiter.has(ip)) {
        rateLimiter.set(ip, { tokens: CONFIG.BURST_LIMIT, last: now });
    }

    const userData = rateLimiter.get(ip);
    const delta = (now - userData.last) / CONFIG.WINDOW_MS;
    userData.tokens = Math.min(CONFIG.BURST_LIMIT, userData.tokens + delta * CONFIG.BURST_LIMIT);
    userData.last = now;

    if (userData.tokens < 1) {
        stats.blocked++;
        return res.status(429).json({ error: "System Integrity Protected" });
    }

    userData.tokens -= 1;
    stats.online.add(ip);
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/stats', (req, res) => {
    res.json({
        online: stats.online.size,
        blocked: stats.blocked,
        lastThreat: stats.lastAttacker,
        integrity: crypto.randomBytes(4).toString('hex').toUpperCase(),
        load: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + "MB"
    });
});

module.exports = app;
