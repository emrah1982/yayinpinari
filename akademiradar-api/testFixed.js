const LiteratureGapServiceFixed = require('./services/literatureGapServiceFixed');

console.log('🔧 Düzeltilmiş Servis Testi...');

async function testFixedService() {
    try {
        console.log('1. Servis oluşturuluyor...');
        const service = new LiteratureGapServiceFixed();
        console.log('✅ Servis oluşturuldu');
        
        console.log('2. Mock analiz testi...');
        const mockResult = service.getMockGapAnalysis('artificial intelligence');
        console.log('✅ Mock analiz:', mockResult.identifiedGaps.length, 'boşluk');
        
        console.log('3. Tam analiz testi...');
        const result = await service.analyzeLiteratureGaps('machine learning', {
            yearRange: { start: 2020, end: 2024 },
            maxResults: 100
        });
        
        if (result.success) {
            console.log('✅ Tam analiz başarılı:', result.totalGapsFound, 'boşluk tespit edildi');
            console.log('📊 Tespit edilen boşluklar:');
            result.gapAnalysis.identifiedGaps.forEach((gap, index) => {
                console.log(`   ${index + 1}. ${gap.title} (${gap.type})`);
            });
        } else {
            console.log('❌ Analiz başarısız:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Test hatası:', error.message);
    }
}

testFixedService();
