const axios = require('axios');

async function testCompleteAPI() {
    console.log('🧪 Kapsamlı API Test Başlatılıyor...\n');
    
    try {
        // 1. Health Check
        console.log('1️⃣ Health Check...');
        const healthResponse = await axios.get('http://127.0.0.1:5000/api/literature-gap/health');
        console.log('✅ Health Check Başarılı:', healthResponse.data.message);
        console.log('📊 Servis Durumları:', healthResponse.data.services);
        
        // 2. Gap Types
        console.log('\n2️⃣ Boşluk Türleri...');
        const typesResponse = await axios.get('http://127.0.0.1:5000/api/literature-gap/gap-types');
        console.log('✅ Boşluk Türleri:', typesResponse.data.gapTypes.length, 'tür mevcut');
        
        // 3. Literature Gap Analysis
        console.log('\n3️⃣ Literatür Boşluğu Analizi...');
        const gapResponse = await axios.post('http://127.0.0.1:5000/api/literature-gap/analyze', {
            topic: 'artificial intelligence',
            options: { 
                yearRange: { start: 2020, end: 2024 }, 
                maxResults: 100,
                languages: ['en', 'tr']
            }
        });
        
        if (gapResponse.data.success) {
            console.log('✅ Literatür Boşluğu Analizi Başarılı!');
            console.log('📈 Tespit Edilen Boşluk Sayısı:', gapResponse.data.totalGapsFound);
            console.log('🎯 Konu:', gapResponse.data.topic);
            console.log('📅 Analiz Tarihi:', gapResponse.data.analysisDate);
            
            if (gapResponse.data.gapAnalysis && gapResponse.data.gapAnalysis.identifiedGaps) {
                console.log('\n📋 Tespit Edilen Boşluklar:');
                gapResponse.data.gapAnalysis.identifiedGaps.forEach((gap, index) => {
                    console.log(`   ${index + 1}. ${gap.title} (${gap.type}) - Önem: ${gap.severity}`);
                });
            }
            
            if (gapResponse.data.recommendations) {
                console.log('\n💡 Öneriler:', gapResponse.data.recommendations.length, 'öneri mevcut');
            }
        } else {
            console.log('❌ Literatür Boşluğu Analizi Başarısız:', gapResponse.data.error);
        }
        
        // 4. Trend Analysis Test
        console.log('\n4️⃣ Trend Analizi...');
        const trendResponse = await axios.post('http://127.0.0.1:5000/api/literature-gap/trends', {
            topic: 'machine learning',
            options: { yearRange: { start: 2020, end: 2024 } }
        });
        
        if (trendResponse.data.success) {
            console.log('✅ Trend Analizi Başarılı!');
            console.log('📊 Trend Verileri Mevcut');
        } else {
            console.log('❌ Trend Analizi Hatası:', trendResponse.data.error);
        }
        
        console.log('\n🎉 Tüm API Testleri Tamamlandı!');
        
    } catch (error) {
        console.error('\n❌ API Test Hatası:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('📄 HTTP Status:', error.response.status);
        }
    }
}

testCompleteAPI();
