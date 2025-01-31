const { WebcastPushConnection } = require('tiktok-live-connector');
const axios = require('axios');

// CONFIG
const TIKTOK_USERNAME = 'makimachankawai'; // Ganti dengan username TikTok
const SERVER_URL = 'http://localhost:3000/webhook';

// Init client
const tiktokClient = new WebcastPushConnection(TIKTOK_USERNAME, {
  enableExtendedGiftInfo: true,
  processInitialData: false,
  clientParams: {
    app_language: 'en-US'
  }
});

// Handle koneksi
tiktokClient.connect()
  .then(state => {
    console.log(`✅ Terhubung ke live @${TIKTOK_USERNAME}`);
    console.log('Room ID:', state.roomId);
    console.log('Viewer Count:', state.viewerCount);
  })
  .catch(err => {
    console.error('❌ Error Detail:');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Stack:', err.stack);
    process.exit(1);
  });

// Handle event gift
tiktokClient.on('gift', async (data) => {
  try {
    console.log(`🎁 Gift ID: ${data.giftId}`);
    console.log('Repeat Count:', data.repeatCount);
    console.log('Extended Info:', data.extendedGiftInfo);
    
    // Kirim ke server
    await axios.post(SERVER_URL, {
      giftId: data.giftId.toString(),
      count: data.repeatCount
    });
    
  } catch (err) {
    console.error('❌ Gift Error:', err.response?.data || err.message);
  }
});

// Handle event error
tiktokClient.on('error', err => {
  console.error('⚠️ Connection Error:', err.message);
});

// Auto-reconnect
tiktokClient.on('disconnected', () => {
  console.log('🔄 Reconnecting in 10 seconds...');
  setTimeout(() => tiktokClient.connect(), 10000);
});
