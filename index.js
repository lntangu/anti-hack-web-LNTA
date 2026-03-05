/**
 * MATRIX OS | PHANTOM NEURAL CORE V10.1 - PERFECTED
 * SECURITY LEVEL: OMEGA-PREDATOR
 */

const express = require('express');
const crypto = require('crypto');
const os = require('os');
const app = express();

const _0x_core = [
    '\x4e\x65\x75\x72\x61\x6c\x2d\x43\x6f\x72\x65\x2d\x56\x31\x30', 
    '\x58\x2d\x50\x68\x61\x6e\x74\x6f\x6d\x2d\x53\x68\x69\x65\x6c\x64', 
    '\x64\x65\x66\x61\x75\x6c\x74\x2d\x73\x72\x63\x20\x27\x6e\x6f\x6e\x65\x27\x3b\x20\x73\x63\x72\x69\x70\x74\x2d\x73\x72\x63\x20\x27\x75\x6e\x73\x61\x66\x65\x2d\x69\x6e\x6c\x69\x6e\x65\x27\x3b\x20\x73\x74\x79\x6c\x65\x2d\x73\x72\x63\x20\x27\x75\x6e\x73\x61\x66\x65\x2d\x69\x6e\x6c\x69\x6e\x65\x27\x3b', 
    '\x78\x2d\x66\x6f\x72\x77\x61\x72\x64\x65\x64\x2d\x66\x6f\x72'
];
const _0x_v = (i) => _0x_core[i];

const defenseGrid = {
    ipTraffic: new Map(),
    blackhole: new Set(),
    stats: {
        totalBlocks: 0,
        totalReqs: 0,
        startTime: Date.now(),
        isPanic: false,
        integrity: 100.00
    },
    config: {
        maxReqPerSec: 12,
        penaltyThreshold: 4
    }
};

const _waf_rules = [/union|select|insert|drop/i, /<script|alert/i, /\.\.\//i, /python|curl|bot|nikto|nmap/i];

function checkThreat(req) {
    let score = 0;
    try {
        const payload = (req.url || "") + " " + (req.headers['user-agent'] || "");
        _waf_rules.forEach(rule => { if(rule.test(payload)) score += 3; });
    } catch(e) { score += 5; }
    return score;
}

// Garbage Collection tối ưu
setInterval(() => { if(defenseGrid.ipTraffic.size > 1000) defenseGrid.ipTraffic.clear(); }, 10000);
// Tự phục hồi Integrity
setInterval(() => { 
    if(defenseGrid.stats.integrity < 100) defenseGrid.stats.integrity = Math.min(100, defenseGrid.stats.integrity + 0.005); 
}, 2000);

app.use((req, res, next) => {
    const ip = req.headers[_0x_v(3)]?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    if (defenseGrid.blackhole.has(ip) || defenseGrid.stats.isPanic) return req.socket.destroy();

    const now = Math.floor(Date.now() / 1000);
    const key = `${ip}_${now}`;
    const rCount = (defenseGrid.ipTraffic.get(key) || 0) + 1;
    defenseGrid.ipTraffic.set(key, rCount);

    if (rCount > defenseGrid.config.maxReqPerSec || checkThreat(req) >= defenseGrid.config.penaltyThreshold) {
        defenseGrid.blackhole.add(ip);
        defenseGrid.stats.totalBlocks++;
        defenseGrid.stats.integrity = Math.max(0, defenseGrid.stats.integrity - 0.15);
        return req.socket.destroy();
    }

    res.setHeader('Content-Security-Policy', _0x_v(2));
    res.setHeader(_0x_v(1), _0x_v(0));
    defenseGrid.stats.totalReqs++;
    next();
});

app.get('/api/v10/core/sync', (req, res) => {
    res.json({
        blocks: defenseGrid.stats.totalBlocks,
        traffic: defenseGrid.stats.totalReqs,
        uptime: Math.floor((Date.now() - startTime) / 1000), // Fixed: startTime
        integrity: defenseGrid.stats.integrity.toFixed(2),
        cpu: (3.5 + Math.random() * 2).toFixed(1), // Giả lập CPU load mượt hơn cho Vercel
        mem: (Math.random() * 5 + 12).toFixed(1), // RAM giả lập 12-17%
        status: defenseGrid.stats.isPanic ? "LOCKED" : "OPTIMAL"
    });
});

const startTime = defenseGrid.stats.startTime;

app.post('/api/v10/core/panic', (req, res) => {
    defenseGrid.stats.isPanic = true;
    setTimeout(() => { defenseGrid.stats.isPanic = false; }, 8000);
    res.end();
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>PHANTOM NEURAL CORE V10.1</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
        :root { --neon: #00f3ff; --alert: #ff0055; --bg: #010105; }
        body { margin: 0; background: var(--bg); color: var(--neon); font-family: 'Orbitron', sans-serif; overflow: hidden; height: 100vh; transition: 0.5s; }
        .grid-bg { position: fixed; width: 200%; height: 200%; background-image: linear-gradient(rgba(0, 243, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.05) 1px, transparent 1px); background-size: 50px 50px; transform: perspective(500px) rotateX(60deg) translateY(-20%); animation: move 20s linear infinite; z-index: -1; top: 0; left: -50%; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 0 100%; } }
        .container { display: flex; flex-direction: column; height: 100vh; padding: 20px; box-sizing: border-box; }
        .header { border-bottom: 2px solid var(--neon); display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; text-shadow: 0 0 10px var(--neon); }
        .system-status { font-size: 12px; border: 1px solid var(--neon); padding: 5px 15px; border-radius: 20px; animation: pulse 2s infinite; font-weight: bold; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .main-hud { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
        .card { background: rgba(0, 243, 255, 0.03); border: 1px solid rgba(0, 243, 255, 0.2); padding: 20px; position: relative; overflow: hidden; backdrop-filter: blur(5px); transition: 0.5s; }
        .card::before { content: ""; position: absolute; top: 0; left: 0; width: 10px; height: 10px; border-top: 2px solid var(--neon); border-left: 2px solid var(--neon); }
        .card::after { content: ""; position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; border-bottom: 2px solid var(--neon); border-right: 2px solid var(--neon); }
        .val { font-size: 48px; font-weight: bold; margin: 10px 0; }
        .unit { font-size: 12px; color: rgba(0, 243, 255, 0.5); letter-spacing: 2px; }
        .visualizer { grid-column: span 2; display: flex; align-items: center; justify-content: center; }
        .radar { width: 180px; height: 180px; border: 2px solid var(--neon); border-radius: 50%; position: relative; box-shadow: 0 0 20px rgba(0, 243, 255, 0.2); }
        .radar-sweep { position: absolute; width: 50%; height: 50%; background: linear-gradient(45deg, var(--neon), transparent); border-radius: 100% 0 0 0; transform-origin: bottom right; animation: sweep 2s linear infinite; opacity: 0.6; }
        @keyframes sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .terminal { grid-column: span 3; background: rgba(0,0,0,0.8); border: 1px solid #003333; font-family: 'Courier New', monospace; font-size: 11px; padding: 10px; color: #00aa00; height: 100px; overflow-y: hidden; }
        .panic-btn { grid-column: span 3; background: transparent; border: 1px solid var(--alert); color: var(--alert); padding: 15px; font-family: 'Orbitron'; font-weight: bold; letter-spacing: 5px; cursor: pointer; transition: 0.3s; margin-top: 10px; }
        .panic-btn:hover { background: var(--alert); color: #000; box-shadow: 0 0 30px var(--alert); }
        .alert-ui { --neon: #ff0055 !important; border-color: #ff0055 !important; }
        .panic-active { animation: shake 0.2s infinite; filter: hue-rotate(280deg); }
        @keyframes shake { 0% { transform: translate(2px, 2px); } 50% { transform: translate(-2px, -2px); } 100% { transform: translate(0,0); } }
    </style>
</head>
<body id="b">
    <div class="grid-bg"></div>
    <div class="container">
        <div class="header">
            <div>PHANTOM NEURAL CORE v10.1</div>
            <div class="system-status" id="st">OPTIMAL</div>
        </div>
        <div class="main-hud">
            <div class="card">
                <div class="unit">THREATS PURGED</div>
                <div class="val" id="blk">000</div>
                <div class="unit">NEURAL NODES DISCONNECTED</div>
            </div>
            <div class="visualizer">
                <div class="radar" id="rd"><div class="radar-sweep"></div></div>
            </div>
            <div class="card">
                <div class="unit">INTEGRITY</div>
                <div class="val" id="int">100</div>
                <div class="unit">CORE STABILITY %</div>
            </div>
            <div class="card">
                <div class="unit">TRAFFIC</div>
                <div class="val" id="req">0</div>
                <div class="unit">PACKETS ANALYZED</div>
            </div>
            <div class="card">
                <div class="unit">CPU LOAD</div>
                <div class="val" id="cpu">0.0</div>
                <div class="unit">SYNAPTIC COMPUTATION</div>
            </div>
            <div class="card">
                <div class="unit">MEMORY USAGE</div>
                <div class="val" id="mem">0</div>
                <div class="unit">VIRTUAL BUFFER USAGE</div>
            </div>
            <div class="terminal" id="term">> SYSTEM INITIALIZED...<br>> FIREWALL V10.1 READY.</div>
            <button class="panic-btn" onclick="p()">[ EXECUTE LOCKDOWN PROTOCOL ]</button>
        </div>
    </div>
    <script>
        function p() {
            if(confirm("XÁC NHẬN KÍCH HOẠT OMEGA LOCKDOWN?")) {
                fetch('/api/v10/core/panic', {method:'POST'});
                document.getElementById('b').classList.add('panic-active');
                setTimeout(() => location.reload(), 8000);
            }
        }
        const term = document.getElementById('term');
        function addLog(msg) {
            const line = document.createElement('div');
            line.innerText = "> " + msg;
            term.appendChild(line);
            if(term.childNodes.length > 6) term.removeChild(term.firstChild);
        }
        setInterval(() => {
            fetch('/api/v10/core/sync').then(r => r.json()).then(d => {
                document.getElementById('blk').innerText = d.blocks.toString().padStart(3, '0');
                document.getElementById('req').innerText = d.traffic;
                document.getElementById('int').innerText = d.integrity;
                document.getElementById('cpu').innerText = d.cpu + "%";
                document.getElementById('mem').innerText = d.mem + "%";
                document.getElementById('st').innerText = d.status;
                if(parseFloat(d.integrity) < 98) {
                    document.body.classList.add('alert-ui');
                    addLog("CRITICAL: THREAT DETECTED!");
                } else {
                    document.body.classList.remove('alert-ui');
                }
                addLog("SYNC: " + Math.random().toString(16).slice(2,8).toUpperCase() + " OK");
            });
        }, 1000);
    </script>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log('V10.1 Ready'));
server.keepAliveTimeout = 3000;
server.headersTimeout = 4000;
