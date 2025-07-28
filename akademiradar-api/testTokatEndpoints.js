const axios = require('axios');

/**
 * TOKAT API Endpoint Test Dosyası
 * Doğru SRU endpoint'ini bulmak için farklı endpoint'leri test eder
 */

async function testTokatEndpoints() {
    console.log('🔍 TOKAT SRU ENDPOINT TEST\n');
    console.log('=' .repeat(60));
    
    const baseUrl = 'http://tokat.ulakbim.gov.tr';
    
    // Test edilecek endpoint'ler
    const endpoints = [
        '/sru',
        '/SRU',
        '/sru.php',
        '/sru/search',
        '/search/sru',
        '/catalog/sru',
        '/opac/sru',
        '/z3950/sru',
        '/webservices/sru',
        '/api/sru',
        '/services/sru',
        '/cgi-bin/sru',
        '/cgi-bin/sru.pl',
        '/cgi-bin/sru.php'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\n🔗 Test ediliyor: ${baseUrl}${endpoint}`);
            
            const response = await axios.get(`${baseUrl}${endpoint}`, {
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
            
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📄 Content-Type: ${response.headers['content-type'] || 'Belirtilmemiş'}`);
            console.log(`   📊 Response boyutu: ${response.data.length} karakter`);
            
            // XML içeriğini kontrol et
            const responseText = response.data.toString();
            
            if (responseText.includes('searchRetrieveResponse')) {
                console.log('   🎉 BAŞARILI! Geçerli SRU XML response bulundu!');
                console.log(`   📋 İlk 200 karakter: ${responseText.substring(0, 200)}...`);
                return endpoint; // Başarılı endpoint'i döndür
            } else if (responseText.includes('<!DOCTYPE html') || responseText.includes('<html')) {
                console.log('   ⚠️  HTML sayfası döndü (SRU değil)');
            } else if (responseText.includes('<?xml')) {
                console.log('   🔍 XML response var, içeriği kontrol ediliyor...');
                console.log(`   📋 İlk 200 karakter: ${responseText.substring(0, 200)}...`);
                
                if (responseText.includes('diagnostic') || responseText.includes('error')) {
                    console.log('   ⚠️  XML hata mesajı içeriyor');
                } else {
                    console.log('   ✅ Potansiyel SRU XML response');
                }
            } else {
                console.log('   ❓ Bilinmeyen response formatı');
                console.log(`   📋 İlk 100 karakter: ${responseText.substring(0, 100)}...`);
            }
            
        } catch (error) {
            if (error.response) {
                console.log(`   ❌ HTTP ${error.response.status}: ${error.response.statusText}`);
            } else if (error.code === 'ECONNREFUSED') {
                console.log('   ❌ Bağlantı reddedildi');
            } else if (error.code === 'ENOTFOUND') {
                console.log('   ❌ Host bulunamadı');
            } else if (error.code === 'ETIMEDOUT') {
                console.log('   ❌ Zaman aşımı');
            } else {
                console.log(`   ❌ Hata: ${error.message}`);
            }
        }
        
        // API'yi yormamak için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n❌ Hiçbir endpoint SRU formatında response vermedi');
    return null;
}

// Z39.50 protokolü test et
async function testZ3950Protocol() {
    console.log('\n🔍 Z39.50 PROTOKOL TEST\n');
    console.log('=' .repeat(40));
    
    // Z39.50 genellikle farklı port kullanır (210, 7090, vb.)
    const z3950Endpoints = [
        'http://tokat.ulakbim.gov.tr:210',
        'http://tokat.ulakbim.gov.tr:7090',
        'http://tokat.ulakbim.gov.tr:9999',
        'http://tokat.ulakbim.gov.tr/z3950'
    ];
    
    for (const endpoint of z3950Endpoints) {
        try {
            console.log(`\n🔗 Test ediliyor: ${endpoint}`);
            
            const response = await axios.get(endpoint, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'TOKAT-Client/1.0'
                }
            });
            
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📄 Content-Type: ${response.headers['content-type'] || 'Belirtilmemiş'}`);
            
        } catch (error) {
            if (error.response) {
                console.log(`   ❌ HTTP ${error.response.status}: ${error.response.statusText}`);
            } else {
                console.log(`   ❌ ${error.message}`);
            }
        }
    }
}

// OPAC arayüzü test et
async function testOPACInterface() {
    console.log('\n🔍 OPAC ARAYÜZ TEST\n');
    console.log('=' .repeat(40));
    
    const opacEndpoints = [
        '/opac',
        '/catalog',
        '/search',
        '/webopac',
        '/public'
    ];
    
    const baseUrl = 'http://tokat.ulakbim.gov.tr';
    
    for (const endpoint of opacEndpoints) {
        try {
            console.log(`\n🔗 Test ediliyor: ${baseUrl}${endpoint}`);
            
            const response = await axios.get(`${baseUrl}${endpoint}`, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            console.log(`   ✅ Status: ${response.status}`);
            
            const responseText = response.data.toString();
            if (responseText.includes('search') || responseText.includes('catalog') || responseText.includes('opac')) {
                console.log('   🎯 Potansiyel katalog arayüzü bulundu');
                console.log(`   📋 İlk 150 karakter: ${responseText.substring(0, 150)}...`);
            }
            
        } catch (error) {
            console.log(`   ❌ ${error.message}`);
        }
    }
}

async function runAllEndpointTests() {
    console.log('🚀 TOKAT API ENDPOINT KEŞİF TESTİ BAŞLATILIYOR...\n');
    
    try {
        // 1. SRU endpoint'leri test et
        const workingSRU = await testTokatEndpoints();
        
        // 2. Z39.50 protokolü test et
        await testZ3950Protocol();
        
        // 3. OPAC arayüzü test et
        await testOPACInterface();
        
        console.log('\n' + '=' .repeat(60));
        
        if (workingSRU) {
            console.log(`🎉 BAŞARILI SRU ENDPOINT BULUNDU: ${workingSRU}`);
            console.log('Bu endpoint TOKAT servisinde kullanılabilir.');
        } else {
            console.log('❌ Çalışan SRU endpoint bulunamadı.');
            console.log('TOKAT API\'si farklı bir protokol kullanıyor olabilir.');
        }
        
        console.log('\n🏁 Endpoint keşif testi tamamlandı!');
        
    } catch (error) {
        console.error('\n❌ Test sırasında beklenmeyen hata:');
        console.error(error);
    }
}

// Test'i çalıştır
if (require.main === module) {
    runAllEndpointTests();
}

module.exports = {
    testTokatEndpoints,
    testZ3950Protocol,
    testOPACInterface,
    runAllEndpointTests
};
