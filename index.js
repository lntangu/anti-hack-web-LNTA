const express = require('express');
const app = express();
const path = require('path');

let blockedCount = 0;

app.use((req, res, next) => {
    // Chặn đứng Chaos Engine V22 qua Header và Query
    const isBot = req.headers['x-payload-data'] || req.headers['user-agent']?.includes('Matrix-Breaker');
    if (isBot || req.query.data) {
        blockedCount++;
        res.setHeader('Connection', 'close');
        return res.status(444).end(); 
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/stats', (req, res) => {
    res.json({
        online: 1,
        blocked: blockedCount,
        cpu: blockedCount > 0 ? (Math.random() * 90 + 5).toFixed(1) : "5.5",
        ram: 12
    });
});

module.exports = app;
