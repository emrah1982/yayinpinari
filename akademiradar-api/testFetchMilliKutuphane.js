const milliKutuphaneService = require('./services/fetchMilliKutuphane');

async function testMilliKutuphaneService() {
    try {
        console.log('🔍 Milli Kütüphane Servisi Test Başlıyor...');
        console.log('📚 Arama Terimi: "Atatürk"');
        console.log('=' + '='.repeat(50));
        
        const startTime = Date.now();
        
        // Servisi test et
        const results = await milliKutuphaneService.searchArticles('Atatürk', 0, 20, {
            searchType: 'all'
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`⏱️  Arama Süresi: ${duration}ms`);
        console.log(`📊 Toplam Sonuç: ${results.totalResults || 0}`);
        console.log(`📖 Dönen Kayıt: ${results.results?.length || 0}`);
        console.log('=' + '='.repeat(50));
        
        if (results.results && results.results.length > 0) {
            console.log('\n📚 BULUNAN KİTAPLAR:');
            console.log('-'.repeat(60));
            
            results.results.forEach((book, index) => {
                console.log(`\n${index + 1}. 📖 ${book.title || book.baslik || 'Başlık yok'}`);
                console.log(`   👤 Yazar: ${book.authors?.[0] || book.yazarlar?.[0] || 'Bilinmiyor'}`);
                console.log(`   📅 Yıl: ${book.year || book.yayinYili || 'Bilinmiyor'}`);
                console.log(`   🏢 Yayınevi: ${book.publisher || book.yayinevi || 'Bilinmiyor'}`);
                console.log(`   📍 Raf: ${book.shelfLocation || book.yerNumarasi || 'Raf bilgisi yok'}`);
                console.log(`   🖼️  Kapak: ${book.coverImage || book.kapakResmi || 'Kapak yok'}`);
                console.log(`   📚 Kaynak: ${book.source || book.kaynak || 'Bilinmiyor'}`);
                
                if (book.isbn) {
                    console.log(`   📘 ISBN: ${book.isbn}`);
                }
                
                if (book.abstract || book.ozet) {
                    const abstract = (book.abstract || book.ozet).substring(0, 100);
                    console.log(`   📝 Özet: ${abstract}${abstract.length >= 100 ? '...' : ''}`);
                }
            });
            
            console.log('\n' + '='.repeat(60));
            console.log('✅ TEST BAŞARILI!');
            
        } else {
            console.log('❌ Hiç sonuç bulunamadı!');
            
            if (results.error) {
                console.log(`🚨 Hata: ${results.error}`);
            }
        }
        
        // Kaynak bilgileri
        if (results.sources && results.sources.length > 0) {
            console.log('\n📊 KAYNAK BİLGİLERİ:');
            results.sources.forEach(source => {
                console.log(`   • ${source.name}: ${source.count} sonuç`);
            });
        }
        
    } catch (error) {
        console.error('❌ TEST HATASI:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Test çalıştır
console.log('🚀 Milli Kütüphane Servisi Test Başlatılıyor...\n');
testMilliKutuphaneService();
