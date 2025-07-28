// "yapay zeka" sorgusu ile backend API'yi test etmek için özel script
const http = require('http');

console.log('🔍 "Yapay Zeka" sorgusu ile Backend API Test\n');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/search?query=yapay%20zeka&sources=arxiv,openlibrary,pubchem,loc&page=1&limit=3',
    method: 'GET',
    headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
    }
};

const req = http.request(options, (res) => {
    console.log(`✅ HTTP Status: ${res.statusCode}`);
    console.log('📋 Headers:', res.headers);
    console.log('\n📦 Gelen Veriler:\n');
    
    let dataCount = 0;
    
    res.on('data', (chunk) => {
        dataCount++;
        const data = chunk.toString();
        console.log(`📄 Veri ${dataCount}:`);
        console.log(data);
        console.log('---');
    });
    
    res.on('end', () => {
        console.log(`\n🎯 Test Tamamlandı! Toplam ${dataCount} veri paketi alındı.`);
    });
});

req.on('error', (error) => {
    console.error('❌ API Test Hatası:', error.message);
});

req.setTimeout(30000, () => {
    console.log('⏰ 30 saniye timeout - Test sonlandırılıyor');
    req.destroy();
});

req.end();
