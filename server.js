// ============================================
// GOD VS DEVIL — TikTok Gift Auto-Point Server
// ============================================
// This reads gifts from your TikTok LIVE and
// automatically updates the overlay bar.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

// ── Gift Map: which gift goes to which side and how many points ──
const GIFT_MAP = {
  // GOD SIDE
  'rose':            { side: 'god',   points: 10  },
  'galaxy':          { side: 'god',   points: 50  },
  'tiktok universe': { side: 'god',   points: 100 },
  // DEVIL SIDE
  'bomb':            { side: 'devil', points: 30  },
  'drama queen':     { side: 'devil', points: 50  },
  'fire':            { side: 'devil', points: 40  },
};

// ── Your TikTok username (edit this!) ──
const TIKTOK_USERNAME = 'YOUR_TIKTOK_USERNAME'; // <-- change this

// ── WebSocket server (talks to the overlay) ──
const wss = new WebSocketServer({ port: 8080 });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('✅ Overlay connected!');
  ws.on('close', () => clients.delete(ws));
});

function sendToOverlay(data) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

// ── HTTP server (serves the overlay HTML file) ──
const httpServer = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'overlay.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('overlay.html not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

httpServer.listen(3000, () => {
  console.log('🌐 Overlay running at: http://localhost:3000');
  console.log('   Add this URL as a Browser Source in OBS');
});

// ── TikTok Live Connection ──
async function connectTikTok() {
  let TikTokLiveConnector;
  try {
    TikTokLiveConnector = require('tiktok-live-connector');
  } catch (e) {
    console.error('❌ tiktok-live-connector not installed.');
    console.error('   Run: npm install in this folder');
    return;
  }

  if (TIKTOK_USERNAME === 'YOUR_TIKTOK_USERNAME') {
    console.warn('⚠️  Please edit server.js and set your TikTok username!');
    console.warn('   Find line: const TIKTOK_USERNAME = ...');
    startDemoMode();
    return;
  }

  const tiktok = new TikTokLiveConnector.WebcastPushConnection(TIKTOK_USERNAME);

  tiktok.on('gift', (data) => {
    const giftName = data.giftName.toLowerCase().trim();
    const senderName = data.uniqueId || 'Someone';
    const repeatCount = data.repeatCount || 1;

    console.log(`🎁 Gift received: "${data.giftName}" from @${senderName} x${repeatCount}`);

    const mapped = GIFT_MAP[giftName];
    if (mapped) {
      const totalPoints = mapped.points * repeatCount;
      console.log(`   → ${mapped.side.toUpperCase()} +${totalPoints} points`);
      sendToOverlay({
        type: 'gift',
        giftName: data.giftName,
        side: mapped.side,
        points: totalPoints,
        sender: senderName,
      });
    } else {
      console.log(`   → Gift not mapped (ignored)`);
    }
  });

  tiktok.on('connected', () => {
    console.log(`\n🔴 LIVE! Connected to @${TIKTOK_USERNAME}'s stream`);
    console.log('   Waiting for gifts...\n');
    sendToOverlay({ type: 'status', message: 'connected' });
  });

  tiktok.on('disconnected', () => {
    console.log('🔌 Disconnected. Reconnecting in 5s...');
    setTimeout(connectTikTok, 5000);
  });

  tiktok.on('error', (err) => {
    console.error('❌ TikTok error:', err.message);
  });

  try {
    await tiktok.connect();
  } catch (err) {
    console.error('❌ Could not connect to TikTok LIVE:', err.message);
    console.log('   Make sure you are LIVE on TikTok first!');
    setTimeout(connectTikTok, 10000);
  }
}

// ── Demo mode (when username not set) ──
function startDemoMode() {
  console.log('\n🎮 Running in DEMO MODE — simulating gifts every 4 seconds');
  console.log('   Edit server.js to set your TikTok username for real gifts\n');

  const demoGifts = [
    { giftName: 'Rose',            side: 'god',   points: 10 },
    { giftName: 'Bomb',            side: 'devil', points: 30 },
    { giftName: 'Galaxy',          side: 'god',   points: 50 },
    { giftName: 'Fire',            side: 'devil', points: 40 },
    { giftName: 'Drama Queen',     side: 'devil', points: 50 },
    { giftName: 'TikTok Universe', side: 'god',   points: 100 },
  ];

  let i = 0;
  setInterval(() => {
    const gift = demoGifts[i % demoGifts.length];
    console.log(`🎁 [DEMO] ${gift.giftName} → ${gift.side.toUpperCase()} +${gift.points}`);
    sendToOverlay({ type: 'gift', ...gift, sender: 'DemoViewer' });
    i++;
  }, 4000);
}

connectTikTok();
