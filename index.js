const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const os = require('os');
const axios = require('axios');

const CONFIG = {
    // KHÓA BÍ MẬT CLOUDFLARE (Secret Key) lấy từ hình ảnh của bạn
    TURNSTILE_SECRET: "0x4AAAAAAACmonfx33yxd1-u71JrcLoxcNwQ" 
};

app.use(express.static(path.join(__dirname, 'public')));

// Dữ liệu mô phỏng để trang web trông chuyên nghiệp
let totalVisitors = 5402; 
let attackBlocked = 1284;
let banHistory = [
    { ip: "103.21.x.x", reason: "DDoS Attempt", time: "05/03 14:10" },
    { ip: "45.77.x.x", reason: "SQL Injection", time: "05/03 13:55" },
    { ip: "1.55.x.x", reason: "Brute Force", time: "05/03 13:20" }
];

io.on('connection', (socket) => {
    // Lấy IP của người truy cập thông qua Proxy của Vercel
    const clientIP = socket.handshake.headers['x-forwarded-for']?.split(',')[0] || socket.conn.remoteAddress;

    // Lắng nghe tín hiệu xác thực Captcha từ phía Client
    socket.on('auth_verify', async (token) => {
        try {
            // Gửi Token lên Cloudflare để kiểm tra thật hay giả
            const verifyRes = await axios.post(
                'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                `secret=${CONFIG.TURNSTILE_SECRET}&response=${token}`,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            if (verifyRes.data.success) {
                totalVisitors++;
                // Gửi dữ liệu khởi tạo khi xác thực thành công
                socket.emit('init_data', { totalVisitors, attackBlocked, banHistory, clientIP });

                // Cập nhật thông số CPU/RAM mỗi 2 giây
                const statsTimer = setInterval(() => {
                    socket.emit('sys_update', {
                        cpu: (os.loadavg()[0] * 10).toFixed(2),
                        ram: (1 - os.freemem() / os.totalmem()).toFixed(2) * 100,
                        online: io.engine.clientsCount
                    });
                }, 2000);

                socket.on('disconnect', () => clearInterval(statsTimer));
            } else {
                // Nếu token giả, tăng số lần chặn và ngắt kết nối
                attackBlocked++;
                socket.disconnect();
            }
        } catch (e) { 
            socket.disconnect(); 
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Server Matrix đang chạy...'));
