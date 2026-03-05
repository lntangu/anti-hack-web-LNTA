const express = require('express');
const app = express();

// --- [PHẦN 1: LOGIC NHÀ TÙ 1 PHÚT] ---
const defenseGrid = {
    jail: new Map(), 
    stats: { totalBlocks: 0, integrity: 100 },
    config: { maxReqPerSec: 15, banDuration: 60000 } // Khóa 60s
};

const _waf_signatures = [/union|select|insert|drop/i, /<script|alert/i, /\.\.\//i];

app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    // KIỂM TRA GIAM GIỮ TẠM THỜI
    if (defenseGrid.jail.has(ip)) {
        const expiry = defenseGrid.jail.get(ip);
        if (now < expiry) {
            defenseGrid.stats.totalBlocks++;
            return res.status(403).send(`
                <body style="background:#000;color:#ff0055;font-family:monospace;text-align:center;padding-top:100px;">
                    <h1 style="letter-spacing:5px;">[ IP QUARANTINED ]</h1>
                    <p>Hệ thống phát hiện hành vi bất thường.</p>
                    <p>Tự động giải phóng sau: <span id="sec">${Math.ceil((expiry - now) / 1000)}</span> giây.</p>
                    <script>
                        let s = ${Math.ceil((expiry - now) / 1000)};
                        setInterval(() => { if(s>0) document.getElementById('sec').innerText = --s; else location.reload(); }, 1000);
                    </script>
                </body>
            `);
        } else {
            defenseGrid.jail.delete(ip); // Tự động thả sau 1 phút
        }
    }

    // QUÉT PAYLOAD (SỬA LỖI CHỐNG CRASH)
    try {
        const target = (req.url || "") + " " + (req.headers['user-agent'] || "");
        for (let rule of _waf_signatures) {
            if (rule.test(target)) {
                defenseGrid.jail.set(ip, now + defenseGrid.config.banDuration);
                return res.status(403).end();
            }
        }
    } catch (e) {}

    next();
});

// --- [PHẦN 2: GIAO DIỆN MATRIX & ANTI-F12] ---
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>PHANTOM CORE V10.4</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');
        body { margin: 0; background: #000; color: #00f3ff; font-family: 'Orbitron', sans-serif; overflow: hidden; height: 100vh; display: flex; align-items: center; justify-content: center; }
        .grid { position: fixed; width: 200%; height: 200%; background-image: linear-gradient(rgba(0,243,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.05) 1px, transparent 1px); background-size: 40px 40px; transform: perspective(500px) rotateX(60deg) translateY(-20%); animation: move 20s linear infinite; z-index: -1; top: 0; left: -50%; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 0 100%; } }
        .hud { border: 2px solid #00f3ff; background: rgba(0,0,0,0.9); padding: 40px; box-shadow: 0 0 30px #00f3ff; text-align: center; }
        .radar { width: 100px; height: 100px; border: 1px solid #00f3ff; border-radius: 50%; margin: 0 auto 20px; position: relative; overflow: hidden; }
        .sweep { position: absolute; width: 100%; height: 100%; background: conic-gradient(from 0deg, rgba(0,243,255,0.4) 0%, transparent 40%); animation: sweep 2s linear infinite; }
        @keyframes sweep { to { transform: rotate(360deg); } }
    </style>
</head>
<body oncontextmenu="return false;"> <div class="grid"></div>
    <div class="hud">
        <div class="radar"><div class="sweep"></div></div>
        <h1 style="letter-spacing: 10px;">PHANTOM CORE</h1>
        <div style="font-size: 12px; color: #fff;">CPU: 5.5% | BLOCKED: ${defenseGrid.stats.totalBlocks}</div>
        <p style="font-size: 9px; margin-top: 20px; color: rgba(0,243,255,0.5);">[ STEALTH MODE ACTIVE: ANTI-CONSOLE ENABLED ]</p>
    </div>

    <script>
        // --- [ANTI-F12 & DEBUGGER TRAP] ---
        // 1. Chặn phím tắt F12, Ctrl+Shift+I, Ctrl+U
        document.onkeydown = function(e) {
            if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) || (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0))) {
                alert("PHANTOM: ACCESS DENIED.");
                return false;
            }
        };

        // 2. Debugger Trap: Nếu mở Console, web sẽ bị treo (vòng lặp vô tận)
        setInterval(function() {
            debugger; 
        }, 100);

        // 3. Xóa Console liên tục
        setInterval(() => { console.clear(); console.log("%cPHANTOM CORE V10.4\\nBẢN QUYỀN CỦA NGHĨA PHỤ", "color:red; font-size:20px; font-weight:bold;"); }, 1000);
    </script>
</body>
</html>
    `);
});

module.exports = app;
