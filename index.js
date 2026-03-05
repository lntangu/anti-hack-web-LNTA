const express = require('express');
const app = express();
const path = require('path');
const os = require('os');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let totalVisitors = 0; 
let attackBlocked = 0; // Số vụ tấn công thật
let activeUsers = new Map();
let threatLogs = [];
let ipRequestCount = {}; // Theo dõi tần suất yêu cầu của mỗi IP

app.get('/api/stats', (req, res) => {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const now = Date.now();

    // --- CƠ CHẾ NHẬN DIỆN DDOS THẬT ---
    if (!ipRequestCount[clientIP]) {
        ipRequestCount[clientIP] = { count: 1, lastTime: now };
    } else {
        ipRequestCount[clientIP].count++;
        
        // Nếu IP gửi > 5 yêu cầu trong vòng 1 giây -> Tính là DDoS
        if (now - ipRequestCount[clientIP].lastTime < 1000 && ipRequestCount[clientIP].count > 5) {
            attackBlocked++; // Tăng số lượng vụ chặn thật
            
            // Ghi nhật ký IP đang tấn công bạn
            if (!threatLogs.some(log => log.ip === clientIP)) {
                const time = new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                threatLogs.unshift({ ip: clientIP, reason: "DDoS Flood Detected", time });
                if(threatLogs.length > 5) threatLogs.pop();
            }
            
            // Reset bộ đếm sau khi ghi nhận
            ipRequestCount[clientIP].count = 0;
            ipRequestCount[clientIP].lastTime = now;
        }
    }

    // Ghi nhận người dùng bình thường
    if (!activeUsers.has(clientIP)) totalVisitors++;
    activeUsers.set(clientIP, now);

    // Dọn dẹp người offline
    for (let [ip, lastSeen] of activeUsers) {
        if (now - lastSeen > 10000) activeUsers.delete(ip);
    }

    res.json({
        cpu: (os.loadavg()[0] * 10).toFixed(2),
        ram: (1 - os.freemem() / os.totalmem()).toFixed(2) * 100,
        online: activeUsers.size,
        totalVisitors,
        attackBlocked, // Bây giờ con số này sẽ nhảy khi bạn chạy hack.py
        clientIP,
        logs: threatLogs
    });
});

module.exports = app;
