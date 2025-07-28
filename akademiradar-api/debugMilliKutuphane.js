// fetchMilliKutuphane servisi debug testi
console.log('🔍 fetchMilliKutuphane servisi debug testi başlıyor...\n');

async function debugTest() {
    try {
        console.log('1️⃣ Servisi import ediliyor...');
        const milliKutuphaneService = require('./services/fetchMilliKutuphane');
        console.log('✅ Servis başarıyla import edildi');
        console.log('Servis tipi:', typeof milliKutuphaneService);
        
        if (milliKutuphaneService && milliKutuphaneService.searchArticles) {
            console.log('✅ searchArticles metodu mevcut\n');
            
            console.log('2️⃣ "Atatürk" ile test araması başlıyor...');
            const startTime = Date.now();
            
            const result = await milliKutuphaneService.searchArticles('Atatürk', 0, 5, {
                searchType: 'all'
            });
            
            const endTime = Date.now();
            console.log(`⏱️ Arama süresi: ${endTime - startTime}ms\n`);
            
            console.log('3️⃣ Sonuçlar analiz ediliyor...');
            console.log('📊 Toplam sonuç:', result.totalResults || 0);
            console.log('📚 Dönen kayıt sayısı:', result.results?.length || 0);
            console.log('✅ Başarılı:', result.success);
            
            if (result.error) {
                console.log('❌ Hata:', result.error);
            }
            
            if (result.results && result.results.length > 0) {
                console.log('\n📖 İLK 3 SONUÇ:');
                console.log('='.repeat(60));
                
                result.results.slice(0, 3).forEach((book, index) => {
                    console.log(`\n${index + 1}. 📚 ${book.title || 'Başlık yok'}`);
                    console.log(`   👤 Yazar: ${book.authors?.[0] || 'Bilinmiyor'}`);
                    console.log(`   📅 Yıl: ${book.year || 'Bilinmiyor'}`);
                    console.log(`   📖 Tür: ${book.type || 'Bilinmiyor'}`);
                    console.log(`   📝 Özet: ${(book.abstract || 'Özet yok').substring(0, 100)}...`);
                    console.log(`   📍 Raf: ${book.shelfLocation || 'Raf bilgisi yok'}`);
                    console.log(`   🖼️ Kapak: ${book.coverImage || 'Kapak yok'}`);
                    console.log(`   🏢 Kaynak: ${book.source || 'Bilinmiyor'}`);
                });
                
                console.log('\n✅ TEST BAŞARILI! Gerçek veriler alındı.');
            } else {
                console.log('\n❌ HİÇ SONUÇ BULUNAMADI!');
                
                // Debug bilgileri
                console.log('\n🔧 DEBUG BİLGİLERİ:');
                console.log('Result object keys:', Object.keys(result));
                console.log('Full result:', JSON.stringify(result, null, 2));
            }
            
        } else {
            console.log('❌ searchArticles metodu bulunamadı');
            console.log('Mevcut metodlar:', Object.getOwnPropertyNames(milliKutuphaneService));
        }
        
    } catch (error) {
        console.error('❌ HATA:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Test çalıştır
debugTest();
