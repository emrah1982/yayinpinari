// Debug test to find exact location of this.log error
const LiteratureGapService = require('./services/literatureGapService');

console.log('🔍 Debug Test - Literatür Servisi');

try {
    console.log('1. Servis oluşturuluyor...');
    const gapService = new LiteratureGapService();
    console.log('✅ Servis oluşturuldu');
    
    console.log('2. Mock analiz testi...');
    const mockResult = gapService.getMockGapAnalysis('test topic');
    console.log('✅ Mock analiz çalışıyor:', mockResult);
    
    console.log('3. Gerçek analiz testi...');
    gapService.analyzeLiteratureGaps('test topic', {
        yearRange: { start: 2023, end: 2024 },
        maxResults: 10
    }).then(result => {
        console.log('✅ Analiz sonucu:', result);
    }).catch(error => {
        console.error('❌ Analiz hatası:', error.message);
        console.error('Stack trace:', error.stack);
    });
    
} catch (error) {
    console.error('❌ Servis oluşturma hatası:', error.message);
    console.error('Stack trace:', error.stack);
}
