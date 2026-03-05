const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// --- BẢO MẬT NÂNG CAO ---
const CONFIG = {
    // Hash của mật khẩu: *Anlo12.com.vn*
    ADMIN_HASH: "15c0e14713c2331613279147814441093557e0344b7f58694060867083a21689",
    BAN_TIME: 60000,
    MAX_MSG_LENGTH: 150
};

// Chống clickjacking và đánh cắp tài liệu
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

let chatHistory = [];
let blacklistedIPs = new Set();

// Hàm lọc mã độc (XSS)
function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// Chống dò mật khẩu bằng thời gian (Constant time comparison)
function checkPass(pass) {
    if (!pass) return false;
    const inputHash = crypto.createHash('sha256').update(pass).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(CONFIG.ADMIN_HASH));
    } catch (e) { return false; }
}

io.on('connection', (socket) => {
    // Lấy IP thật qua Proxy của Vercel
    const clientIP = socket.handshake.headers['x-forwarded-for']?.split(',')[0] || socket.conn.remoteAddress;

    if (blacklistedIPs.has(clientIP)) return socket.disconnect();

    socket.emit('sync_chat', chatHistory);

    socket.on('chat message', (data) => {
        try {
            if (!data || !data.msg) return;
            const rawText = data.msg.trim();
            const name = sanitize(data.name?.substring(0, 15)) || "Anonymous";

            if (rawText.startsWith('/')) {
                const [cmd, pass, target] = rawText.split(' ');
                if (checkPass(pass)) {
                    if (cmd === '/clear') {
                        chatHistory = [{ id: Date.now(), name: "SYSTEM", text: "--- DATA WIPED BY ADMIN ---", time: "NOW" }];
                    } else if (cmd === '/ban' && target) {
                        blacklistedIPs.add(target);
                        setTimeout(() => blacklistedIPs.delete(target), CONFIG.BAN_TIME);
                        chatHistory.unshift({ id: Date.now(), name: "SYSTEM", text: `IP BANNED: ${target}`, time: "ADMIN" });
                    }
                }
            } else {
                const cleanMsg = sanitize(rawText.substring(0, CONFIG.MAX_MSG_LENGTH));
                if (cleanMsg) {
                    chatHistory.unshift({
                        id: Date.now(),
                        name: name,
                        text: cleanMsg,
                        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    });
                }
            }
            if (chatHistory.length > 30) chatHistory.pop();
            io.emit('sync_chat', chatHistory);
        } catch (e) { console.error("Socket Error"); }
    });

    const statsUpdater = setInterval(() => {
        socket.emit('sys_stats', {
            cpu: (os.loadavg()[0]).toFixed(1),
            ram: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
            online: io.engine.clientsCount
        });
    }, 3000);

    socket.on('disconnect', () => clearInterval(statsUpdater));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Matrix Server Active`));