const http = require('http');

console.log('🚀 Backend API Test Başlatılıyor...\n');

// Test API endpoint
const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/search?query=yapay%20zeka&limit=3',
  method: 'GET',
  headers: {
    'Accept': 'text/event-stream'
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ Backend API Yanıt Durumu: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
    console.log(`📦 Veri Alındı: ${chunk.length} bytes`);
    console.log(`📄 İçerik: ${chunk.toString().substring(0, 200)}...`);
  });
  
  res.on('end', () => {
    console.log('\n🎯 API Test Tamamlandı!');
    console.log(`📊 Toplam Veri: ${data.length} bytes`);
    
    if (data.includes('data:')) {
      console.log('✅ SSE formatında veri alındı!');
    }
    
    if (data.includes('arxiv') || data.includes('openlibrary') || data.includes('pubchem')) {
      console.log('✅ Servis sonuçları alındı!');
    }
    
    if (data.includes('error')) {
      console.log('⚠️ Hata mesajları da var (beklenen - API key eksikliği)');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ API Test Hatası: ${e.message}`);
});

req.setTimeout(10000, () => {
  console.log('⏰ Timeout - API yanıt vermedi');
  req.destroy();
});

req.end();
