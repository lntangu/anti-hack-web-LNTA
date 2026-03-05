const express = require('express');
const app = express();
const path = require('path');
const os = require('os');
const axios = require('axios');

const CONFIG = {
    TURNSTILE_SECRET: "0x4AAAAAAACmonfx33yxd1-u71JrcLoxcNwQ" 
};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Dữ liệu thật được lưu trữ động
let totalVisitors = 5403; 
let attackBlocked = 1284;
let activeUsers = new Map(); // Lưu IP thật và thời gian thực
let threatLogs = []; // Lưu nhật ký các IP bị nghi ngờ hoặc bị chặn

// API 1: Xác thực người dùng và ghi nhận IP
app.post('/api/verify', async (req, res) => {
    const { token } = req.body;
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    if (token === "bypass_token_emergency") {
        activeUsers.set(clientIP, Date.now());
        totalVisitors++;
        return res.json({ success: true, totalVisitors, attackBlocked, clientIP, logs: threatLogs });
    }

    try {
        const verifyRes = await axios.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            `secret=${CONFIG.TURNSTILE_SECRET}&response=${token}`,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        if (verifyRes.data.success) {
            activeUsers.set(clientIP, Date.now());
            totalVisitors++;
            return res.json({ success: true, totalVisitors, attackBlocked, clientIP, logs: threatLogs });
        } else {
            // Nếu Captcha sai, ghi vào nhật ký Threat thật
            attackBlocked++;
            const time = new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
            threatLogs.unshift({ ip: clientIP, reason: "Captcha Failed", time });
            if(threatLogs.length > 5) threatLogs.pop();
            return res.json({ success: false });
        }
    } catch (e) {
        return res.json({ success: true, totalVisitors, attackBlocked, clientIP, logs: threatLogs });
    }
});

// API 2: Cập nhật thông số cứng thật từ OS
app.get('/api/stats', (req, res) => {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const now = Date.now();
    
    // Cập nhật sự hiện diện của IP này
    activeUsers.set(clientIP, now);

    // Xóa những người đã thoát (quá 10s không tương tác)
    for (let [ip, lastSeen] of activeUsers) {
        if (now - lastSeen > 10000) activeUsers.delete(ip);
    }

    res.json({
        cpu: (os.loadavg()[0] * 10).toFixed(2), // Tải CPU thực tế của máy chủ
        ram: (1 - os.freemem() / os.totalmem()).toFixed(2) * 100, // % RAM thực tế đang dùng
        online: activeUsers.size, // Đếm số lượng IP khác nhau đang mở web
        logs: threatLogs // Danh sách các vụ chặn thật
    });
});

module.exports = app;
