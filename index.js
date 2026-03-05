const express = require('express');
const app = express();
const path = require('path');

let blockedCount = 0;

// MIDDLEWARE BẢO VỆ ĐA TẦNG
app.use((req, res, next) => {
    const ua = req.headers['user-agent'] || '';
    const isBot = req.headers['x-payload-data'] || ua.includes('Matrix-Breaker');
    
    if (isBot) {
        blockedCount++;
        res.setHeader('Connection', 'close');
        return res.status(444).end(); 
    }
    next();
});

// Phục vụ file tĩnh từ thư mục public để giữ đồ họa
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/stats', (req, res) => {
    res.json({
        online: 1,
        blocked: blockedCount,
        cpu: (Math.random() * 5 + 2).toFixed(1),
        ram: (Math.random() * 8 + 4).toFixed(1),
        status: blockedCount > 500 ? "CRITICAL ATTACK" : "SYSTEM SECURE"
    });
});

module.exports = app;
