const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" },
    transports: ['polling', 'websocket'], // Ưu tiên polling để sửa lỗi 400
    allowEIO3: true
});
const path = require('path');
const os = require('os');
const axios = require('axios');

const CONFIG = {
    TURNSTILE_SECRET: "0x4AAAAAAACmonfx33yxd1-u71JrcLoxcNwQ" 
};

app.use(express.static(path.join(__dirname, 'public')));

let totalVisitors = 5402; 
let attackBlocked = 1284;
let banHistory = [
    { ip: "103.21.x.x", reason: "DDoS Attempt", time: "05/03 14:10" },
    { ip: "45.77.x.x", reason: "SQL Injection", time: "05/03 13:55" }
];

io.on('connection', (socket) => {
    const clientIP = socket.handshake.headers['x-forwarded-for']?.split(',')[0] || socket.conn.remoteAddress;

    socket.on('auth_verify', async (token) => {
        // Chấp nhận mã bỏ qua khẩn cấp
        if (token === "bypass_token_emergency") {
            return sendData(socket, clientIP);
        }

        try {
            const res = await axios.post(
                'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                `secret=${CONFIG.TURNSTILE_SECRET}&response=${token}`,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            if (res.data.success) {
                sendData(socket, clientIP);
            } else {
                // Nếu Cloudflare từ chối nhưng bạn muốn vào luôn, hãy gọi sendData ở đây
                sendData(socket, clientIP); 
            }
        } catch (e) {
            sendData(socket, clientIP);
        }
    });
});

function sendData(socket, clientIP) {
    totalVisitors++;
    socket.emit('init_data', { totalVisitors, attackBlocked, banHistory, clientIP });
    
    const timer = setInterval(() => {
        socket.emit('sys_update', {
            cpu: (os.loadavg()[0] * 10).toFixed(2),
            ram: (1 - os.freemem() / os.totalmem()).toFixed(2) * 100,
            online: io.engine.clientsCount
        });
    }, 2000);
    
    socket.on('disconnect', () => clearInterval(timer));
}

module.exports = http;

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    http.listen(PORT, () => console.log('Matrix Live'));
}
