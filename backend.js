const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const port = 3000;

// Config
const giftMap = {
  '5655': { file: 'video_1.mp4', duration: 11000 }, // Rose
  '5333': { file: 'video_2.mp4', duration: 24000 }, // Coffee
  '7974': { file: 'video_3.mp4', duration: 26000 }, // Anemo Slime
  // Tambahkan gift lain di sini
};

const server = app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });
let queue = [];
let isPlaying = false;

// Webhook endpoint
app.post('/webhook', express.json(), (req, res) => {
  const { giftId, count } = req.body;
  
  if(giftMap[giftId]) {
    // Tambahkan 1 entry ke queue dengan jumlah repeatCount
    queue.push({
      ...giftMap[giftId],
      repeatCount: count // Jumlah pengulangan video
    });
    
    if(!isPlaying) playNext();
  }
  
  res.status(200).send('OK');
});

function playNext() {
  if(queue.length === 0) return;
  
  isPlaying = true;
  const current = queue.shift();
  
  // Loop sesuai repeatCount
  for(let i = 0; i < current.repeatCount; i++) {
    wss.clients.forEach(client => {
      if(client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'play',
          video: current.file,
          duration: current.duration,
          instanceId: Date.now() + i // ID unik tiap instance
        }));
      }
    });
  }

  // Atur timeout untuk video berikutnya
  setTimeout(() => {
    isPlaying = false;
    playNext();
  }, (current.duration * current.repeatCount) + 500); // Durasi total + fade
}

// Serve static files
app.use(express.static('public'));

app.get('/:username', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/overlay.html'));
});