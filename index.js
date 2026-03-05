const express = require('express');
const app = express();
const path = require('path');
const os = require('os');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let totalVisitors = 5403; // Giữ lại số liệu từ ảnh
let attackBlocked = 1284;
let activeUsers = new Map();
let threatLogs = [
    { ip: "103.21.x.x", reason: "DDoS Attempt", time: "14:10" },
    { ip: "45.77.x.x", reason: "SQL Injection", time: "13:55" }
];

app.get('/api/stats', (req, res) => {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const now = Date.now();
    
    // Ghi nhận IP đang truy cập
    if (!activeUsers.has(clientIP)) {
        totalVisitors++;
    }
    activeUsers.set(clientIP, now);

    // Xoá IP offline sau 10s
    for (let [ip, lastSeen] of activeUsers) {
        if (now - lastSeen > 10000) activeUsers.delete(ip);
    }

    res.json({
        cpu: (os.loadavg()[0] * 10).toFixed(2),
        ram: (1 - os.freemem() / os.totalmem()).toFixed(2) * 100,
        online: activeUsers.size,
        totalVisitors,
        attackBlocked,
        clientIP,
        logs: threatLogs
    });
});

module.exports = app;
