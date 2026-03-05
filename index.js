const express = require('express');
const app = express();
const path = require('path');

let blockedV = 0;
let reqTracker = {};

app.get('/api/stats', (req, res) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
    const now = Date.now();
    
    // CHIÊU MỚI: Kiểm tra các Header rác bạn vừa khoe
    const hasGarbage = req.headers['x-garbage-header'];
    const isChrome120 = req.headers['user-agent']?.includes('chrome120');

    if (!reqTracker[ip]) {
        reqTracker[ip] = { count: 1, last: now };
    } else {
        reqTracker[ip].count++;
        let speed = now - reqTracker[ip].last;

        // NẾU PHÁT HIỆN HÀNH VI "DỊ" (Header rác hoặc Burst mode)
        if (hasGarbage || (speed < 500 && reqTracker[ip].count > 3)) {
            blockedV++; 
            // TRẢ VỀ LỖI 429 - Khiến script của bạn nhảy số "FAIL" ngay lập tức
            return res.status(429).json({ error: "Chaos Detected. System Lockdown!" });
        }
        
        if (speed >= 1000) reqTracker[ip] = { count: 1, last: now };
    }

    res.json({
        online: 1,
        blocked: blockedV,
        ip: ip,
        cpu: "99.9", // Giả lập server đang gồng mình chống đỡ
        logs: [{ip: ip, type: "CHAOS ENGINE MITIGATED", time: new Date().toLocaleTimeString()}]
    });
});

module.exports = app;
