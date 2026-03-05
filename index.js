const express = require('express');
const app = express();
const path = require('path');
const os = require('os');

app.use(express.static(path.join(__dirname, 'public')));

let totalV = 0;
let blockedV = 0;
let users = new Map();
let logs = [];
let reqTracker = {};

app.get('/api/stats', (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const now = Date.now();

    // Đếm DDoS thật từ script của bạn
    if (!reqTracker[ip]) {
        reqTracker[ip] = { count: 1, last: now };
    } else {
        reqTracker[ip].count++;
        // Nếu IP của bạn gửi > 10 req/giây -> Đếm là chặn DDoS
        if (now - reqTracker[ip].last < 1000 && reqTracker[ip].count > 10) {
            blockedV++;
            if (!logs.some(l => l.ip === ip)) {
                logs.unshift({ ip: ip, type: "HTTP FLOOD", time: new Date().toLocaleTimeString() });
                if(logs.length > 5) logs.pop();
            }
        }
        if (now - reqTracker[ip].last >= 1000) {
            reqTracker[ip] = { count: 1, last: now };
        }
    }

    if (!users.has(ip)) {
        totalV++;
        users.set(ip, now);
    }
    users.set(ip, now);

    res.json({
        online: users.size,
        total: totalV,
        blocked: blockedV,
        ip: ip,
        cpu: (os.loadavg()[0] * 10).toFixed(1),
        ram: Math.floor(Math.random() * 10) + 5,
        logs: logs
    });
});

module.exports = app;
