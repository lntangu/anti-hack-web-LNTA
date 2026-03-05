const express = require('express');
const app = express();
const path = require('path');

let blockedCount = 0;

app.use((req, res, next) => {
    // Mở khóa chặn đồ họa từ Vercel
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';");
    
    // Chặn script Matrix-Breaker
    if (req.headers['user-agent']?.includes('Matrix-Breaker')) {
        blockedCount++;
        return res.status(444).end(); 
    }
    next();
});

app.get('/api/stats', (req, res) => {
    res.json({ online: 1, blocked: blockedCount, cpu: 5.5, ram: 12 });
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html style="background:#000; color:#0f0; font-family:monospace; display:flex; justify-content:center; align-items:center; height:100vh; overflow:hidden;">
    <div style="border:2px solid #0f0; padding:40px; box-shadow:0 0 25px #0f0, inset 0 0 10px #0f0; text-align:center; position:relative;">
        <h1 style="text-shadow:0 0 10px #0f0; letter-spacing:10px;">SYSTEM LIVE STATUS</h1>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px;">
            <div style="border:1px solid #0f0; padding:20px;">
                <div style="font-size:12px;">ONLINE</div>
                <div style="font-size:40px; color:#fff; text-shadow:0 0 10px #0f0;">1</div>
            </div>
            <div style="border:1px solid #f00; padding:20px; color:#f00; box-shadow:0 0 15px #f00;">
                <div style="font-size:12px;">BLOCKED</div>
                <div id="bl" style="font-size:40px; text-shadow:0 0 10px #f00;">0</div>
            </div>
        </div>
    </div>
    <script>
        setInterval(() => {
            fetch('/api/stats').then(r => r.json()).then(d => {
                document.getElementById('bl').innerText = d.blocked;
            });
        }, 1000);
    </script>
</html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server is running...'));
