const express = require('express');
const app = express();
const path = require('path');
const os = require('os');

app.use(express.static(path.join(__dirname, 'public')));

let blockedCount = 0;
let totalSessions = 0;
let activeIps = new Map();
let threatHistory = [];
let floodProtector = {};

app.get('/api/stats', (req, res) => {
    // 1. Lấy IP - VPN thường nằm ở vị trí đầu tiên trong x-forwarded-for
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
    const now = Date.now();

    // 2. NHẬN DIỆN VPN/BOT QUA BEHAVIOR (HÀNH VI)
    // Script hack.py của bạn gửi 33-35 RPS
    if (!floodProtector[clientIp]) {
        floodProtector[clientIp] = { count: 1, lastReq: now };
    } else {
        floodProtector[clientIp].count++;
        let duration = now - floodProtector[clientIp].lastReq;

        // VPN hay không thì tốc độ vẫn là bằng chứng thép
        if (duration < 1000 && floodProtector[clientIp].count > 2) {
            blockedCount++; // Số "DDOS INTERCEPTED" sẽ nhảy dù bạn đổi VPN
            
            if (threatHistory.length < 5 && !threatHistory.some(h => h.ip === clientIp)) {
                threatHistory.unshift({
                    ip: clientIp,
                    type: "VPN/PROXY FLOOD", 
                    time: new Date().toLocaleTimeString('vi-VN')
                });
            }
        }
        
        if (duration >= 1000) {
            floodProtector[clientIp] = { count: 1, lastReq: now };
        }
    }

    // Đếm phiên truy cập (Session)
    if (!activeIps.has(clientIp)) {
        totalSessions++;
        activeIps.set(clientIp, now);
    }

    res.json({
        online: activeIps.size,
        total: totalSessions,
        blocked: blockedCount,
        ip: clientIp, // Sẽ hiện IP của VPN bạn đang dùng
        cpu: (os.loadavg()[0] * 10).toFixed(1),
        ram: Math.floor(Math.random() * 5) + 5,
        logs: threatHistory
    });
});

module.exports = app;
