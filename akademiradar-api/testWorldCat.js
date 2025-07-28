const WorldCatArayici = require('./servicesZ3950/worldcatService.js');

// Test fonksiyonu
async function testWorldCatService() {
    console.log('=== WorldCat Servisi Test Başlıyor ===\n');
    
    // Test için dummy API key (gerçek API key gerekli)
    const API_KEY = 'test-api-key';
    const arayici = new WorldCatArayici(API_KEY);
    
    try {
        console.log('1. Kitap Arama Testi...');
        console.log('Arama terimi: "artificial intelligence"');
        
        // Test arama
        const sonuclar = await arayici.yayinAra('artificial intelligence', 'Stuart Russell');
        
        console.log(`\n✅ Sonuç: ${sonuclar.length} kitap bulundu`);
        
        if (sonuclar.length > 0) {
            console.log('\n📚 Bulunan kitaplar:');
            sonuclar.forEach((kitap, index) => {
                console.log(`\n${index + 1}. Kitap:`);
                console.log(`   Başlık: ${kitap.baslik}`);
                console.log(`   Yazar: ${kitap.yazar}`);
                console.log(`   Yayın Yılı: ${kitap.yayinYili}`);
                console.log(`   ISBN: ${kitap.isbn}`);
                console.log(`   OCLC: ${kitap.oclcNumarasi}`);
                console.log(`   Yayınevi: ${kitap.yayinevi}`);
            });
            
            // İlk kitap için kütüphane arama testi
            if (sonuclar[0].oclcNumarasi) {
                console.log('\n2. Kütüphane Arama Testi...');
                console.log(`OCLC Numarası: ${sonuclar[0].oclcNumarasi}`);
                
                const kutuphaneler = await arayici.kutuphaneleriAra(sonuclar[0].oclcNumarasi, 'TR');
                
                console.log(`\n✅ Sonuç: ${kutuphaneler.length} kütüphane bulundu`);
                
                if (kutuphaneler.length > 0) {
                    console.log('\n🏛️ Bulunan kütüphaneler:');
                    kutuphaneler.slice(0, 5).forEach((kutuphane, index) => {
                        console.log(`\n${index + 1}. Kütüphane:`);
                        console.log(`   Ad: ${kutuphane.ad}`);
                        console.log(`   Şehir: ${kutuphane.sehir}`);
                        console.log(`   Ülke: ${kutuphane.ulke}`);
                        console.log(`   OCLC Sembol: ${kutuphane.oclcSembol}`);
                        console.log(`   URL: ${kutuphane.url}`);
                    });
                }
            }
        }
        
        console.log('\n3. Tam Arama Testi...');
        await arayici.tamArama('machine learning', 'Tom Mitchell');
        
    } catch (error) {
        console.error('\n❌ Test Hatası:', error.message);
        
        if (error.response) {
            console.error('HTTP Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
        
        // API anahtarı hatası kontrolü
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            console.log('\n⚠️  Not: WorldCat API için geçerli bir API anahtarı gerekli.');
            console.log('API anahtarı almak için: https://www.oclc.org/developer/api/oclc-apis/worldcat-search-api.en.html');
        }
        
        // Network hatası kontrolü
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.log('\n⚠️  Not: İnternet bağlantısı veya WorldCat sunucusu erişim sorunu.');
        }
    }
    
    console.log('\n=== Test Tamamlandı ===');
}

// Test çalıştır
if (require.main === module) {
    testWorldCatService();
}

module.exports = testWorldCatService;
