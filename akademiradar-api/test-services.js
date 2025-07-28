// Servisler instance olarak export edildiği için doğrudan kullanıyoruz
const arxivService = require('./services/fetchArxiv');
const openLibraryService = require('./services/fetchOpenLibrary');
const { PubchemService } = require('./services/fetchPubchem');
const pubchemService = new PubchemService();
const locService = require('./services/fetchLoc');

// API anahtarı gerektiren servisler (hata bekleniyor)
const coreService = require('./services/fetchCore');
const medlinePlusService = require('./services/fetchMedlinePlus');
const pubmedService = require('./services/fetchPubMed');
const pmcService = require('./services/fetchPubmedCentral');

async function testService(serviceName, testFunction) {
    console.log(`\n=== ${serviceName} Testi ===`);
    try {
        const result = await testFunction();
        console.log(`✅ ${serviceName} başarılı:`, result ? `${Array.isArray(result) ? result.length : Object.keys(result).length} sonuç` : 'Veri döndü');
        if (result && Array.isArray(result) && result.length > 0) {
            console.log(`   İlk sonuç: ${result[0].title || result[0].name || 'Başlık yok'}`);
        }
        return { service: serviceName, success: true, data: result };
    } catch (error) {
        console.log(`❌ ${serviceName} hata:`, error.message);
        return { service: serviceName, success: false, error: error.message };
    }
}

async function runAllTests() {
    console.log('🚀 API Servis Testleri Başlatılıyor...\n');
    
    const results = [];
    
    // API anahtarı gerektirmeyen servisler
    console.log('📋 API Anahtarı Gerektirmeyen Servisler:');
    
    results.push(await testService('ArXiv', async () => {
        return await arxivService.searchArticles('machine learning', 0, 3);
    }));
    
    results.push(await testService('OpenLibrary', async () => {
        return await openLibraryService.searchBooks('artificial intelligence', 1, 3);
    }));
    
    results.push(await testService('PubChem', async () => {
        return await pubchemService.searchCompounds('caffeine', 1, 3);
    }));
    
    results.push(await testService('Library of Congress', async () => {
        return await locService.searchCatalog('computer science', 1, 3);
    }));
    
    // API anahtarı gerektiren servisler (hata bekleniyor)
    console.log('\n📋 API Anahtarı Gerektiren Servisler (Hata Bekleniyor):');
    
    results.push(await testService('CORE API', async () => {
        return await coreService.search('machine learning', 1, 3);
    }));
    
    results.push(await testService('MedlinePlus', async () => {
        return await medlinePlusService.searchHealthTopics('diabetes', 1, 3);
    }));
    
    results.push(await testService('PubMed', async () => {
        return await pubmedService.search('covid-19', 1, 3);
    }));
    
    results.push(await testService('PubMed Central', async () => {
        return await pmcService.search('coronavirus', 1, 3);
    }));
    
    // Özet
    console.log('\n📊 TEST SONUÇLARI:');
    console.log('==================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Başarılı: ${successful.length}`);
    successful.forEach(r => console.log(`   - ${r.service}`));
    
    console.log(`❌ Başarısız: ${failed.length}`);
    failed.forEach(r => console.log(`   - ${r.service}: ${r.error}`));
    
    console.log('\n🎯 Beklenen Sonuç:');
    console.log('- ArXiv, OpenLibrary, PubChem, LOC: Başarılı olmalı');
    console.log('- CORE, MedlinePlus, PubMed, PMC: API key hatası vermeli');
    
    return results;
}

// Test çalıştır
if (require.main === module) {
    runAllTests()
        .then(() => {
            console.log('\n✨ Tüm testler tamamlandı!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Test hatası:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests, testService };
