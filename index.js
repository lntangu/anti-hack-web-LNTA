const express = require('express');
const app = express();

// --- BỘ LỌC ĐỒ TỂ CHỐNG MEMORY HAMMER ---
app.use((req, res, next) => {
    // 1. CHỐNG FAKE IP TRÊN VERCEL
    // Lấy chuỗi X-Forwarded-For (nếu bot gửi IP ảo, Vercel sẽ nhét IP thật vào cuối cùng)
    const xForwardedFor = req.headers['x-forwarded-for'] || '';
    const ipList = xForwardedFor.split(',');
    const realIP = req.headers['x-vercel-forwarded-for'] || ipList[ipList.length - 1].trim() || req.socket.remoteAddress;

    // (Tùy chọn) Khai báo Whitelist IP của ngài ở đây để không bị tự block
    const whitelist = ['::1', '127.0.0.1'];
    if (whitelist.includes(realIP)) return next();

    // 2. NHẬN DIỆN VŨ KHÍ CỦA BOT
    const ua = req.headers['user-agent'] || '';
    const hasPayloadData = req.headers['x-payload-data'] !== undefined;
    const isHeaderTooLarge = JSON.stringify(req.headers).length > 1500; // Header bình thường hiếm khi vượt quá 1.5KB
    
    // 3. THỰC THI "SILENT KILL" (Ngắt kết nối vật lý)
    if (ua.includes('Matrix-Breaker') || hasPayloadData || isHeaderTooLarge) {
        console.log(`[PURGED] Tóm cổ bot từ IP thật: ${realIP}`);
        
        // Cú chốt: Hủy kết nối TCP ngay lập tức, không thèm trả về mã lỗi 403 để bot bị treo (timeout)
        if (res.socket && !res.socket.destroyed) {
            return res.socket.destroy();
        }
        return res.end();
    }

    // Nếu là người thật (hoặc bot chưa lộ diện), cho đi tiếp
    next();
});

// ... (Các Route giao diện của ngài để ở dưới này)
app.get('/', (req, res) => {
    res.send("Hệ thống đã được bọc thép!");
});

module.exports = app;
