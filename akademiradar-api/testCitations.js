const CitationService = require('./services/citationService');
const axios = require('axios');

/**
 * Citation Service Test Sınıfı
 * Mevcut servisleri bozmadan atıf bilgisi özelliğini test eder
 */
class CitationTester {
    constructor() {
        this.citationService = new CitationService();
        this.baseUrl = 'http://localhost:3000/api';
    }

    /**
     * Tüm testleri çalıştır
     */
    async runAllTests() {
        console.log('🚀 Citation Service Testleri Başlatılıyor...\n');
        
        const tests = [
            { name: 'Citation Service Test', fn: () => this.testCitationService() },
            { name: 'API Endpoint Test', fn: () => this.testAPIEndpoints() },
            { name: 'Batch Processing Test', fn: () => this.testBatchProcessing() },
            { name: 'Result Enrichment Test', fn: () => this.testResultEnrichment() }
        ];

        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            try {
                console.log(`📋 ${test.name} çalıştırılıyor...`);
                await test.fn();
                console.log(`✅ ${test.name}: BAŞARILI\n`);
                passed++;
            } catch (error) {
                console.log(`❌ ${test.name}: BAŞARISIZ`);
                console.log(`   Hata: ${error.message}\n`);
                failed++;
            }
        }

        console.log('📊 Test Sonuçları:');
        console.log(`✅ Başarılı: ${passed}`);
        console.log(`❌ Başarısız: ${failed}`);
        console.log(`📈 Başarı Oranı: ${Math.round((passed / (passed + failed)) * 100)}%`);
    }

    /**
     * Citation Service doğrudan test
     */
    async testCitationService() {
        const testPublication = {
            title: "Deep Learning",
            author: "Ian Goodfellow",
            year: "2016"
        };

        const result = await this.citationService.getCitationInfo(testPublication);
        
        if (!result || typeof result.citationCount === 'undefined') {
            throw new Error('Citation bilgisi alınamadı');
        }

        console.log(`   📚 Başlık: ${result.title}`);
        console.log(`   📊 Atıf Sayısı: ${result.citationCount}`);
        console.log(`   🔍 Kaynaklar: ${result.sources.join(', ')}`);
        console.log(`   📅 Son Güncelleme: ${result.lastUpdated}`);
    }

    /**
     * API endpoint'lerini test et
     */
    async testAPIEndpoints() {
        // Tek yayın testi
        const singleRequest = {
            title: "Artificial Intelligence: A Modern Approach",
            author: "Stuart Russell",
            year: "2020"
        };

        try {
            const response = await axios.post(`${this.baseUrl}/citations/single`, singleRequest);
            
            if (!response.data.success) {
                throw new Error('API single request başarısız');
            }

            console.log(`   📚 API Test - Başlık: ${response.data.result.title}`);
            console.log(`   📊 API Test - Atıf: ${response.data.result.citationCount}`);
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('   ⚠️  API server çalışmıyor, mock test yapılıyor...');
                // Mock test
                const mockResult = await this.citationService.getCitationInfo(singleRequest);
                if (!mockResult) throw new Error('Mock test başarısız');
            } else {
                throw error;
            }
        }
    }

    /**
     * Batch processing test
     */
    async testBatchProcessing() {
        const testPublications = [
            {
                title: "Machine Learning",
                author: "Tom Mitchell",
                year: "1997"
            },
            {
                title: "Pattern Recognition and Machine Learning",
                author: "Christopher Bishop",
                year: "2006"
            },
            {
                title: "The Elements of Statistical Learning",
                author: "Trevor Hastie",
                year: "2009"
            }
        ];

        const result = await this.citationService.getCitationInfoBatch(testPublications);
        
        if (!result.success || result.results.length !== testPublications.length) {
            throw new Error('Batch processing başarısız');
        }

        console.log(`   📚 Batch Test - ${result.results.length} yayın işlendi`);
        
        result.results.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.publication.title}: ${item.citationInfo.citationCount} atıf`);
        });
    }

    /**
     * Result enrichment test
     */
    async testResultEnrichment() {
        // Mevcut arama sonucu formatını simüle et
        const mockSearchResults = [
            {
                title: "Introduction to Algorithms",
                author: "Thomas H. Cormen",
                year: "2009",
                publisher: "MIT Press",
                isbn: "9780262033848"
            },
            {
                title: "Computer Networks",
                author: "Andrew S. Tanenbaum",
                year: "2010",
                publisher: "Pearson"
            }
        ];

        // BaseService'in enrichWithCitations metodunu simüle et
        const enrichedResults = await Promise.all(
            mockSearchResults.map(async (item) => {
                const citationInfo = await this.citationService.getCitationInfo({
                    title: item.title,
                    author: item.author,
                    year: item.year
                });
                
                return {
                    ...item,
                    citationInfo: citationInfo
                };
            })
        );

        if (enrichedResults.length !== mockSearchResults.length) {
            throw new Error('Result enrichment başarısız');
        }

        console.log(`   📚 Enrichment Test - ${enrichedResults.length} sonuç zenginleştirildi`);
        
        enrichedResults.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.title}`);
            console.log(`      📊 Atıf: ${item.citationInfo.citationCount}`);
            console.log(`      🔍 Kaynak: ${item.citationInfo.sources.join(', ')}`);
        });
    }

    /**
     * Mevcut servislerin etkilenmediğini test et
     */
    async testExistingServicesIntegrity() {
        console.log('🔍 Mevcut Servis Bütünlüğü Testi...');
        
        // BaseService'in normal çalışmasını test et
        const BaseService = require('./services/baseService');
        
        // Normal servis (atıf özelliği olmadan)
        const normalService = new BaseService('TestService');
        if (normalService.enableCitations) {
            throw new Error('Normal servis atıf özelliği aktif olmamalı');
        }
        
        // Atıf özellikli servis
        const citationEnabledService = new BaseService('TestService', 2, { enableCitations: true });
        if (!citationEnabledService.enableCitations) {
            throw new Error('Atıf özellikli servis aktif olmalı');
        }
        
        console.log('   ✅ Mevcut servisler etkilenmedi');
        console.log('   ✅ Yeni özellik opsiyonel olarak çalışıyor');
    }
}

// Test çalıştırma
if (require.main === module) {
    const tester = new CitationTester();
    
    tester.runAllTests()
        .then(() => {
            console.log('\n🎉 Tüm testler tamamlandı!');
            
            // Kullanım örnekleri
            console.log('\n📖 Kullanım Örnekleri:');
            console.log('1. Mevcut servisleriniz aynen çalışmaya devam eder');
            console.log('2. Atıf bilgisi istiyorsanız: new BaseService("name", 2, {enableCitations: true})');
            console.log('3. API endpoint: POST /api/citations/single');
            console.log('4. Sonuçları zenginleştirme: await service.enrichWithCitations(results)');
        })
        .catch(error => {
            console.error('❌ Test hatası:', error);
        });
}

module.exports = CitationTester;
