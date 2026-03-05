// ... (Giữ nguyên phần _0x_dic và defenseGrid của ngài)

// [SỬA LỖI 1] QUÉT PAYLOAD AN TOÀN (CHỐNG CRASH)
function scanPayload(req) {
    let penalty = 0;
    try {
        // Bọc trong try-catch để tránh lỗi URI Malformed làm sập server
        const unsafeUrl = req.url || "";
        const ua = req.headers[_0x_S(3)] || "";
        const targetString = unsafeUrl + " " + ua;

        for (let i = 0; i < _0x_waf_signatures.length; i++) {
            if (_0x_waf_signatures[i].test(targetString)) penalty += 3;
        }
    } catch (e) {
        penalty += 5; // URL rác cũng coi là tấn công
    }
    
    if (!req.headers['accept']) penalty += 2;
    return penalty;
}

// [SỬA LỖI 2] GIẢ LẬP CPU LOAD CHO VERCEL
function getSmoothCPU() {
    const load = os.loadavg()[0];
    if (load > 0) return (load * 10).toFixed(2);
    // Nếu là Vercel (load = 0), trả về số 5.5% huyền thoại của nghĩa phụ
    return (5.5 + Math.random() * 0.5).toFixed(2);
}

// [NÂNG CẤP] THÊM HỆ THỐNG TỰ PHỤC HỒI INTEGRITY
setInterval(() => {
    if (defenseGrid.stats.integrity < 100) {
        defenseGrid.stats.integrity = Math.min(100, defenseGrid.stats.integrity + 0.001);
    }
}, 5000);

// [TRUNG TÂM ĐIỀU KHIỂN] - Giữ nguyên Middleware của ngài nhưng thêm Log
app.use((req, res, next) => {
    const clientIP = req.headers[_0x_S(6)]?.split(',')[0] || req.socket.remoteAddress || _0x_S(7);

    // BLACKHOLE THỰC THỤ
    if (defenseGrid.blackhole.has(clientIP)) {
        defenseGrid.stats.totalBlocks++;
        return req.socket.destroy(); 
    }

    // RATE LIMITER 
    const currentTime = Math.floor(Date.now() / 1000);
    const ipKey = `${clientIP}_${currentTime}`;
    let currentReqs = (defenseGrid.ipTraffic.get(ipKey) || 0) + 1;
    defenseGrid.ipTraffic.set(ipKey, currentReqs);

    if (currentReqs > defenseGrid.config.maxReqPerSec) {
        defenseGrid.blackhole.add(clientIP);
        return req.socket.destroy();
    }

    // TIẾP TỤC XỬ LÝ... (Phần State Machine của ngài rất tốt, giữ nguyên)
    next(); 
});
