const TOKATClient = require('./services/fetchTokatService.js');

/**
 * Orhan Pamuk Kitapları Test Dosyası
 * XML verisini görmek ve Orhan Pamuk kitaplarını getirmek için
 */

async function testOrhanPamukBooks() {
    console.log('🚀 ORHAN PAMUK KİTAPLARI TOKAT API TESTİ\n');
    console.log('=' .repeat(70));
    
    const tokat = new TOKATClient();
    
    try {
        console.log('📚 Orhan Pamuk kitapları aranıyor...\n');
        
        // Orhan Pamuk ile arama yap
        const result = await tokat.searchByAuthor('Orhan Pamuk', {
            maxRecords: 10,
            startRecord: 1
        });
        
        console.log('\n📊 ARAMA SONUÇLARI:');
        console.log('=' .repeat(50));
        console.log(`📖 Toplam kayıt: ${result.totalRecords}`);
        console.log(`📄 Dönen kayıt: ${result.records.length}`);
        
        if (result.error) {
            console.log(`❌ Hata: ${result.error}`);
        }
        
        if (result.records && result.records.length > 0) {
            console.log('\n📚 BULUNAN KİTAPLAR:');
            console.log('-' .repeat(50));
            
            result.records.forEach((book, index) => {
                console.log(`\n${index + 1}. KİTAP:`);
                console.log(`   📖 Başlık: ${book.basic_info?.title || 'Başlık bulunamadı'}`);
                console.log(`   👤 Yazar: ${book.basic_info?.author || 'Yazar bulunamadı'}`);
                console.log(`   🏢 Yayınevi: ${book.basic_info?.publisher || 'Yayınevi bulunamadı'}`);
                console.log(`   📅 Yıl: ${book.basic_info?.publication_year || 'Yıl bulunamadı'}`);
                console.log(`   📄 Sayfa: ${book.basic_info?.pages || 'Sayfa bulunamadı'}`);
                console.log(`   📚 ISBN: ${book.basic_info?.isbn13 || 'ISBN bulunamadı'}`);
                console.log(`   🌍 Dil: ${book.basic_info?.language || 'Dil bulunamadı'}`);
                console.log(`   📋 Kayıt ID: ${book.record_id || 'ID bulunamadı'}`);
                
                if (book.content?.subjects && book.content.subjects.length > 0) {
                    console.log(`   🏷️  Konular: ${book.content.subjects.join(', ')}`);
                }
                
                if (book.content?.summary) {
                    console.log(`   📝 Özet: ${book.content.summary.substring(0, 100)}...`);
                }
            });
        } else {
            console.log('\n⚠️  Orhan Pamuk kitapları bulunamadı.');
            console.log('Bu durum şu nedenlerden kaynaklanabilir:');
            console.log('   • TOKAT veritabanında Orhan Pamuk kitapları yok');
            console.log('   • Arama sorgusu farklı formatta olmalı');
            console.log('   • XML parsing sorunu devam ediyor');
        }
        
        console.log('\n' + '=' .repeat(70));
        console.log('🎉 Test tamamlandı!');
        
    } catch (error) {
        console.error('\n❌ Test sırasında hata oluştu:');
        console.error(`   Hata mesajı: ${error.message}`);
        console.error(`   Stack trace: ${error.stack}`);
    }
}

// Alternatif arama denemeleri
async function tryAlternativeSearches() {
    console.log('\n🔄 ALTERNATİF ARAMA DENEMELERİ\n');
    
    const tokat = new TOKATClient();
    const searchTerms = [
        'Orhan Pamuk',
        'ORHAN PAMUK',
        'Pamuk, Orhan',
        'PAMUK, ORHAN',
        'Orhan',
        'Pamuk'
    ];
    
    for (const term of searchTerms) {
        try {
            console.log(`🔍 "${term}" ile arama yapılıyor...`);
            const result = await tokat.searchByAuthor(term, { maxRecords: 3 });
            console.log(`   📊 Sonuç: ${result.totalRecords} kayıt bulundu`);
            
            if (result.records.length > 0) {
                console.log(`   📖 İlk kitap: ${result.records[0].basic_info?.title || 'Başlık yok'}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Hata: ${error.message}`);
        }
        
        // API'yi yormamak için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Başlık ile arama da dene
async function searchByTitle() {
    console.log('\n📖 BAŞLIK İLE ARAMA DENEMESİ\n');
    
    const tokat = new TOKATClient();
    const titles = [
        'Kar',
        'Masumiyet Müzesi',
        'Benim Adım Kırmızı',
        'Yeni Hayat',
        'Sessiz Ev'
    ];
    
    for (const title of titles) {
        try {
            console.log(`🔍 "${title}" başlığı aranıyor...`);
            const result = await tokat.searchByTitle(title, { maxRecords: 2 });
            console.log(`   📊 Sonuç: ${result.totalRecords} kayıt bulundu`);
            
            if (result.records.length > 0) {
                const book = result.records[0];
                console.log(`   👤 Yazar: ${book.basic_info?.author || 'Yazar yok'}`);
                console.log(`   📅 Yıl: ${book.basic_info?.publication_year || 'Yıl yok'}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Hata: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function runAllTests() {
    await testOrhanPamukBooks();
    await tryAlternativeSearches();
    await searchByTitle();
}

// Test'i çalıştır
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testOrhanPamukBooks,
    tryAlternativeSearches,
    searchByTitle,
    runAllTests
};
