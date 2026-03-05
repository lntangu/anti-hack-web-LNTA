const express = require('express');
const app = express();
const path = require('path');
const os = require('os');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// DỮ LIỆU THẬT - BẮT ĐẦU TỪ 0
let totalVisitors = 0; 
let attackBlocked = 0;
let activeUsers = new Map();
let realThreatLogs = []; 

app.get('/api/stats', (req, res) => {
    // Lấy IP thật của người truy cập
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const now = Date.now();
    
    // Đếm tổng số lượt truy cập thật (chỉ đếm khi IP mới xuất hiện)
    if (!activeUsers.has(clientIP)) {
        totalVisitors++;
    }
    
    // Ghi nhận sự hiện diện
    activeUsers.set(clientIP, now);

    // Tự động dọn dẹp người offline sau 10 giây
    for (let [ip, lastSeen] of activeUsers) {
        if (now - lastSeen > 10000) activeUsers.delete(ip);
    }

    // Gửi dữ liệu thật về trình duyệt
    res.json({
        cpu: (os.loadavg()[0] * 10).toFixed(2),
        ram: (1 - os.freemem() / os.totalmem()).toFixed(2) * 100,
        online: activeUsers.size,
        totalVisitors: totalVisitors,
        attackBlocked: attackBlocked,
        clientIP: clientIP,
        logs: realThreatLogs // Hiện tại sẽ trống vì chưa có ai tấn công thật
    });
});

module.exports = app;
