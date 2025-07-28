const TOKATClient = require('./services/fetchTokatService.js');
const axios = require('axios');

/**
 * TOKAT Servisi Test Dosyası
 * TOKAT API'sinden verilerin gelip gelmediğini test eder
 */

async function testTokatConnection() {
    console.log('🔍 TOKAT API Bağlantı Testi\n');
    
    // 1. Temel bağlantı testi
    console.log('1. Temel bağlantı kontrolü...');
    try {
        const response = await axios.get('http://to-kat.ulakbim.gov.tr', { 
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        console.log('✅ TOKAT ana sayfasına erişim başarılı');
        console.log(`   Status: ${response.status}`);
    } catch (error) {
        console.log('❌ TOKAT ana sayfasına erişim başarısız');
        console.log(`   Hata: ${error.message}`);
        
        // Alternatif URL'leri dene
        console.log('\n2. Alternatif URL\'leri test ediliyor...');
        const alternativeUrls = [
            'https://to-kat.ulakbim.gov.tr',
            'http://tokat.ulakbim.gov.tr',
            'https://tokat.ulakbim.gov.tr',
            'http://katalog.ulakbim.gov.tr',
            'https://katalog.ulakbim.gov.tr'
        ];
        
        for (const url of alternativeUrls) {
            try {
                console.log(`   Deneniyor: ${url}`);
                const altResponse = await axios.get(url, { 
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                console.log(`   ✅ ${url} - Status: ${altResponse.status}`);
                return url; // Çalışan URL'i döndür
            } catch (altError) {
                console.log(`   ❌ ${url} - ${altError.message}`);
            }
        }
    }
    
    return null;
}

async function testTokatSRU(baseUrl) {
    console.log('\n3. SRU Endpoint Testi...');
    
    if (!baseUrl) {
        console.log('❌ Geçerli base URL bulunamadı, SRU testi atlanıyor');
        return;
    }
    
    try {
        const sruUrl = `${baseUrl}/sru`;
        console.log(`   SRU URL: ${sruUrl}`);
        
        const response = await axios.get(sruUrl, {
            params: {
                version: '1.1',
                operation: 'searchRetrieve',
                query: 'dc.title="test"',
                recordSchema: 'marcxml',
                maximumRecords: 1,
                startRecord: 1
            },
            timeout: 10000,
            headers: {
                'User-Agent': 'TOKAT-Client/1.0',
                'Accept': 'application/xml, text/xml'
            }
        });
        
        console.log('✅ SRU endpoint erişimi başarılı');
        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${response.headers['content-type']}`);
        console.log(`   Response boyutu: ${response.data.length} karakter`);
        
        // XML içeriğini kontrol et
        if (response.data.includes('searchRetrieveResponse')) {
            console.log('✅ Geçerli SRU XML response alındı');
        } else {
            console.log('⚠️  SRU response formatı beklenenden farklı');
        }
        
    } catch (error) {
        console.log('❌ SRU endpoint erişimi başarısız');
        console.log(`   Hata: ${error.message}`);
    }
}

async function testTokatClient() {
    console.log('\n4. TOKAT Client Test...');
    
    const tokat = new TOKATClient();
    
    // Basit testler
    const tests = [
        {
            name: 'ISBN Arama',
            test: () => tokat.searchByISBN('9789750506345')
        },
        {
            name: 'Başlık Arama',
            test: () => tokat.searchByTitle('Tutunamayanlar')
        },
        {
            name: 'Yazar Arama',
            test: () => tokat.searchByAuthor('Oğuz Atay')
        }
    ];
    
    for (const testCase of tests) {
        try {
            console.log(`\n   📚 ${testCase.name} testi...`);
            const result = await testCase.test();
            
            console.log(`   ✅ ${testCase.name} başarılı`);
            console.log(`   📊 Toplam kayıt: ${result.totalRecords}`);
            console.log(`   📄 Dönen kayıt: ${result.records.length}`);
            
            if (result.records.length > 0) {
                const firstRecord = result.records[0];
                console.log(`   📖 İlk kayıt: ${firstRecord.basic_info?.title || 'Başlık bulunamadı'}`);
                console.log(`   👤 Yazar: ${firstRecord.basic_info?.author || 'Yazar bulunamadı'}`);
            }
            
        } catch (error) {
            console.log(`   ❌ ${testCase.name} başarısız`);
            console.log(`   🔍 Hata detayı: ${error.message}`);
        }
    }
}

async function runAllTests() {
    console.log('🚀 TOKAT API Kapsamlı Test Başlatılıyor...\n');
    console.log('=' .repeat(50));
    
    try {
        // 1. Bağlantı testi
        const workingUrl = await testTokatConnection();
        
        // 2. SRU endpoint testi
        await testTokatSRU(workingUrl);
        
        // 3. Client testi
        await testTokatClient();
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 Test süreci tamamlandı!');
        
    } catch (error) {
        console.error('\n❌ Test süreci sırasında beklenmeyen hata:');
        console.error(error);
    }
}

// Test'i çalıştır
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testTokatConnection,
    testTokatSRU,
    testTokatClient,
    runAllTests
};
