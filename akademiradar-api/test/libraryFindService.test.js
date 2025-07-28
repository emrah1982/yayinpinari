const libraryFindService = require('../services/libraryFindService');

/**
 * LibraryFindService Test Suite
 * Mevcut proje yapısına uygun hale getirilmiş kütüphane bulma servisi testleri
 */

async function testOpenLibrarySearch() {
    console.log('🧪 Open Library Arama Testi Başlıyor...\n');
    
    try {
        // Test 1: Başlık araması
        console.log('📚 Test 1: Başlık Araması - "Node.js"');
        const titleResults = await libraryFindService.openLibraryArama('Node.js', 'title');
        console.log(`✅ Sonuç: ${titleResults.length} kitap bulundu`);
        
        if (titleResults.length > 0) {
            const firstBook = titleResults[0];
            console.log(`   📖 İlk Kitap: ${firstBook.baslik}`);
            console.log(`   👤 Yazar: ${firstBook.yazar}`);
            console.log(`   📅 Yıl: ${firstBook.yayinYili}`);
            console.log(`   🖼️ Kapak: ${firstBook.kapakResimleri.orta ? 'Var' : 'Yok'}`);
        }
        
        console.log('\n' + '-'.repeat(50) + '\n');
        
        // Test 2: Yazar araması
        console.log('👤 Test 2: Yazar Araması - "Orhan Pamuk"');
        const authorResults = await libraryFindService.openLibraryArama('Orhan Pamuk', 'author');
        console.log(`✅ Sonuç: ${authorResults.length} kitap bulundu`);
        
        if (authorResults.length > 0) {
            const firstBook = authorResults[0];
            console.log(`   📖 İlk Kitap: ${firstBook.baslik}`);
            console.log(`   👤 Yazar: ${firstBook.yazar}`);
            console.log(`   📅 Yıl: ${firstBook.yayinYili}`);
        }
        
        console.log('\n' + '-'.repeat(50) + '\n');
        
        // Test 3: ISBN araması
        console.log('🔢 Test 3: ISBN Araması - "9780141439518"');
        const isbnResults = await libraryFindService.openLibraryArama('9780141439518', 'isbn');
        console.log(`✅ Sonuç: ${isbnResults.length} kitap bulundu`);
        
        if (isbnResults.length > 0) {
            const firstBook = isbnResults[0];
            console.log(`   📖 Kitap: ${firstBook.baslik}`);
            console.log(`   👤 Yazar: ${firstBook.yazar}`);
            console.log(`   📘 ISBN: ${firstBook.isbn}`);
            console.log(`   🖼️ Kapak: ${firstBook.kapakResimleri.buyuk ? 'Var' : 'Yok'}`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Open Library Test Hatası:', error.message);
        return false;
    }
}

async function testGoogleBooksSearch() {
    console.log('\n🧪 Google Books Arama Testi Başlıyor...\n');
    
    try {
        // Test 1: Başlık araması
        console.log('📚 Test 1: Başlık Araması - "JavaScript"');
        const titleResults = await libraryFindService.googleBooksArama('JavaScript', 'title');
        console.log(`✅ Sonuç: ${titleResults.length} kitap bulundu`);
        
        if (titleResults.length > 0) {
            const firstBook = titleResults[0];
            console.log(`   📖 İlk Kitap: ${firstBook.baslik}`);
            console.log(`   👤 Yazar: ${firstBook.yazar}`);
            console.log(`   🏢 Yayınevi: ${firstBook.yayinevi}`);
            console.log(`   📄 Sayfa: ${firstBook.sayfaSayisi}`);
            console.log(`   🖼️ Kapak: ${firstBook.kapakResimleri.orta ? 'Var' : 'Yok'}`);
        }
        
        console.log('\n' + '-'.repeat(50) + '\n');
        
        // Test 2: Yazar araması
        console.log('👤 Test 2: Yazar Araması - "Douglas Crockford"');
        const authorResults = await libraryFindService.googleBooksArama('Douglas Crockford', 'author');
        console.log(`✅ Sonuç: ${authorResults.length} kitap bulundu`);
        
        if (authorResults.length > 0) {
            const firstBook = authorResults[0];
            console.log(`   📖 İlk Kitap: ${firstBook.baslik}`);
            console.log(`   👤 Yazar: ${firstBook.yazar}`);
            console.log(`   🌐 Dil: ${firstBook.dil}`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Google Books Test Hatası:', error.message);
        return false;
    }
}

async function testAuthorFormatting() {
    console.log('\n🧪 Yazar Adı Formatlama Testi Başlıyor...\n');
    
    try {
        // Test farklı yazar adı formatları
        const testCases = [
            'Orhan Pamuk',
            'Pamuk, Orhan',
            'J.R.R. Tolkien',
            'Tolkien, J.R.R.',
            'Agatha Christie'
        ];
        
        testCases.forEach(authorName => {
            const formatted = libraryFindService.yazarAdiFormatla(authorName);
            const variants = libraryFindService.yazarVaryantlariUret(authorName);
            
            console.log(`📝 Orijinal: "${authorName}"`);
            console.log(`✨ Formatlanmış: "${formatted}"`);
            console.log(`🔄 Varyantlar: ${variants.map(v => `"${v}"`).join(', ')}`);
            console.log('-'.repeat(30));
        });
        
        return true;
    } catch (error) {
        console.error('❌ Yazar Formatlama Test Hatası:', error.message);
        return false;
    }
}

async function testParallelSearch() {
    console.log('\n🧪 Paralel Arama Testi Başlıyor...\n');
    
    try {
        console.log('🔍 "Artificial Intelligence" için paralel arama yapılıyor...');
        const startTime = Date.now();
        
        const results = await libraryFindService.parallelArama('Artificial Intelligence', 'title');
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        console.log(`⏱️ Arama Süresi: ${duration} saniye`);
        console.log(`📊 Toplam Sonuç: ${results.toplamSonuc} kitap`);
        console.log(`🔍 Servis Dağılımı:`);
        console.log(`   📚 Open Library: ${results.openLibrary.length} sonuç`);
        console.log(`   📖 Google Books: ${results.googleBooks.length} sonuç`);
        console.log(`   🏛️ OCLC Classify: ${results.oclcClassify ? '1' : '0'} sonuç`);
        console.log(`   🌐 Internet Archive: ${results.internetArchive.length} sonuç`);
        
        if (results.hatalar.length > 0) {
            console.log(`⚠️ Hatalar: ${results.hatalar.join(', ')}`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Paralel Arama Test Hatası:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 LibraryFindService Test Suite Başlıyor...\n');
    console.log('=' .repeat(60));
    
    const testResults = [];
    
    // Test 1: Open Library
    testResults.push({
        name: 'Open Library Arama',
        result: await testOpenLibrarySearch()
    });
    
    // Test 2: Google Books
    testResults.push({
        name: 'Google Books Arama',
        result: await testGoogleBooksSearch()
    });
    
    // Test 3: Yazar Formatlama
    testResults.push({
        name: 'Yazar Adı Formatlama',
        result: await testAuthorFormatting()
    });
    
    // Test 4: Paralel Arama
    testResults.push({
        name: 'Paralel Arama',
        result: await testParallelSearch()
    });
    
    // Test sonuçlarını özetle
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SONUÇLARI ÖZETI');
    console.log('='.repeat(60));
    
    let passedTests = 0;
    testResults.forEach(test => {
        const status = test.result ? '✅ BAŞARILI' : '❌ BAŞARISIZ';
        console.log(`${status} - ${test.name}`);
        if (test.result) passedTests++;
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 Toplam: ${testResults.length} test, ${passedTests} başarılı, ${testResults.length - passedTests} başarısız`);
    
    if (passedTests === testResults.length) {
        console.log('🎉 Tüm testler başarıyla tamamlandı!');
    } else {
        console.log('⚠️ Bazı testler başarısız oldu. Lütfen hataları kontrol edin.');
    }
}

// Test suite'i çalıştır
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('💥 Test Suite Hatası:', error);
        process.exit(1);
    });
}

module.exports = {
    testOpenLibrarySearch,
    testGoogleBooksSearch,
    testAuthorFormatting,
    testParallelSearch,
    runAllTests
};
