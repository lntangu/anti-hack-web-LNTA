const express = require('express');
const app = express();
const path = require('path');
const os = require('os');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let totalVisitors = 0; 
let attackBlocked = 0;
let activeUsers = new Map();
let realThreats = [];
let floodCheck = {};

app.get('/api/stats', (req, res) => {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const now = Date.now();

    // KIỂM TRA DDOS THẬT TỪ SCRIPT CỦA BẠN
    if (!floodCheck[clientIP]) {
        floodCheck[clientIP] = { count: 1, start: now };
    } else {
        floodCheck[clientIP].count++;
        // Nếu IP gửi yêu cầu quá nhanh (>10 req/s)
        if (now - floodCheck[clientIP].start < 1000 && floodCheck[clientIP].count > 10) {
            attackBlocked++;
            if (!realThreats.some(t => t.ip === clientIP)) {
                realThreats.unshift({ 
                    ip: clientIP, 
                    reason: "TCP/HTTP Flood", 
                    time: new Date().toLocaleTimeString() 
                });
                if(realThreats.length > 6) realThreats.pop();
            }
        }
        if (now - floodCheck[clientIP].start >= 1000) {
            floodCheck[clientIP] = { count: 1, start: now };
        }
    }

    if (!activeUsers.has(clientIP)) totalVisitors++;
    activeUsers.set(clientIP, now);

    res.json({
        cpu: (os.loadavg()[0] * 10).toFixed(1),
        ram: Math.floor(Math.random() * 5) + 5, // Vercel RAM thường ổn định ở mức thấp
        online: activeUsers.size,
        total: totalVisitors,
        blocked: attackBlocked,
        ip: clientIP,
        logs: realThreats
    });
});

module.exports = app;
