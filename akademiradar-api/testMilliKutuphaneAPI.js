// Milli Kütüphane API endpoint test scripti
const axios = require('axios');

async function testMilliKutuphaneAPI() {
    try {
        console.log('🧪 Milli Kütüphane API testi başlıyor...\n');
        
        // Test verisi
        const testQuery = 'yapay zeka';
        const apiUrl = 'http://localhost:5000/api/library-search';
        
        console.log(`📡 API'ye istek gönderiliyor: ${apiUrl}`);
        console.log(`🔍 Arama sorgusu: "${testQuery}"`);
        
        const requestData = {
            query: testQuery,
            searchType: 'all',
            limit: 5,
            start: 0
        };
        
        console.log('📤 Request data:', JSON.stringify(requestData, null, 2));
        
        const startTime = Date.now();
        
        const response = await axios.post(apiUrl, requestData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`\n✅ API Response alındı (${duration}ms)`);
        console.log('📊 Status:', response.status);
        console.log('📄 Response Headers:', response.headers['content-type']);
        
        const data = response.data;
        
        console.log('\n📋 RESPONSE ANALİZİ:');
        console.log('='.repeat(50));
        console.log('✅ Success:', data.success);
        console.log('📚 Total Results:', data.totalResults);
        console.log('🔍 Query:', data.query);
        console.log('⏱️ Search Time:', data.searchTime);
        console.log('📖 Sources:', data.sources);
        
        if (data.results && data.results.length > 0) {
            console.log(`\n📚 İLK ${Math.min(3, data.results.length)} KİTAP:`)
            console.log('='.repeat(60));
            
            data.results.slice(0, 3).forEach((book, index) => {
                console.log(`\n${index + 1}. 📖 ${book.title}`);
                console.log(`   👤 Yazar: ${book.authors ? book.authors.join(', ') : 'Bilinmiyor'}`);
                console.log(`   📅 Yıl: ${book.year}`);
                console.log(`   📖 Tür: ${book.type || book.yayinTuru}`);
                console.log(`   📝 Özet: ${book.abstract ? book.abstract.substring(0, 100) + '...' : 'Yok'}`);
                console.log(`   📍 Raf: ${book.shelfLocation || 'Bilinmiyor'}`);
                console.log(`   🖼️ Kapak: ${book.coverImage ? 'Var' : 'Yok'}`);
                console.log(`   🏢 Kaynak: ${book.source}`);
            });
        } else {
            console.log('\n❌ Hiç kitap sonucu bulunamadı!');
        }
        
        console.log('\n🎉 TEST BAŞARILI!');
        
    } catch (error) {
        console.error('\n❌ API Test Hatası:', error.message);
        
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📄 Response:', error.response.data);
        } else if (error.request) {
            console.error('📡 Request hatası - Server yanıt vermedi');
            console.error('🔗 URL kontrol edin:', error.config?.url);
        } else {
            console.error('⚙️ Genel hata:', error.message);
        }
    }
}

// Test çalıştır
testMilliKutuphaneAPI();
