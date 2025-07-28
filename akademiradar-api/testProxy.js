const axios = require('axios');

async function testProxy() {
    try {
        console.log('Z39.50 Proxy servisi test ediliyor...');
        
        const response = await axios.post('http://localhost:3001/api/search', {
            query: 'Atatürk',
            searchType: 'title',
            limit: 3
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Başarılı yanıt alındı:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.success && response.data.results && response.data.results.length > 0) {
            console.log('\nİlk sonuç:');
            const firstResult = response.data.results[0];
            console.log(`Başlık: ${firstResult.title}`);
            console.log(`Yazar: ${firstResult.author}`);
            console.log(`Yayın Yılı: ${firstResult.year}`);
        }
        
    } catch (error) {
        console.error('❌ Hata oluştu:');
        if (error.response) {
            // Sunucudan hata yanıtı alındı
            console.error(`Durum Kodu: ${error.response.status}`);
            console.error('Hata Detayı:', error.response.data);
        } else if (error.request) {
            // İstek yapıldı ancak yanıt alınamadı
            console.error('Sunucudan yanıt alınamadı:', error.request);
        } else {
            // İstek oluşturulurken hata oluştu
            console.error('İstek oluşturulurken hata:', error.message);
        }
    }
}

// Testi çalıştır
testProxy();
