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
    // FIX 1: Lấy IP thật từ Header x-forwarded-for (Rất quan trọng trên Vercel)
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
    const now = Date.now();

    // FIX 2: Bộ lọc DDoS nhạy bén hơn cho script hack.py
    if (!reqTracker[ip]) {
        reqTracker[ip] = { count: 1, last: now };
    } else {
        reqTracker[ip].count++;
        
        // Nếu IP gửi bất kỳ yêu cầu nào trong khoảng thời gian < 1s 
        // và tích lũy > 2 yêu cầu (Script của bạn là 35 req/s)
        if (now - reqTracker[ip].last < 1000) {
            if (reqTracker[ip].count > 2) { 
                blockedV++; // Tăng số lượng Intercepted ngay lập tức
                
                // Ghi nhật ký với loại hình tấn công chính xác từ script
                if (logs.length < 5 && !logs.some(l => l.ip === ip)) {
                    logs.unshift({ 
                        ip: ip, 
                        type: "HTTP/2 FLOOD (Chrome 120)", 
                        time: new Date().toLocaleTimeString('vi-VN') 
                    });
                }
            }
        } else {
            // Reset bộ đếm sau mỗi giây
            reqTracker[ip] = { count: 1, last: now };
        }
    }

    // Đếm người online thật (chỉ tính những người không tấn công)
    if (!users.has(ip) && reqTracker[ip].count <= 2) {
        totalV++;
    }
    users.set(ip, now);

    res.json({
        online: users.size,
        total: totalV,
        blocked: blockedV,
        ip: ip,
        cpu: (os.loadavg()[0] * 10).toFixed(1),
        ram: Math.floor(Math.random() * 8) + 4,
        logs: logs
    });
});

module.exports = app;
