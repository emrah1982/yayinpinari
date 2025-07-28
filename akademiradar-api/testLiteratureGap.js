const axios = require('axios');

async function testLiteratureGapAPI() {
    const baseURL = 'http://localhost:5000/api/literature-gap';
    
    console.log('🧪 Literatür Boşluğu API Test Başlatılıyor...\n');

    try {
        // 1. Health Check
        console.log('1️⃣ Health Check...');
        const healthResponse = await axios.get(`${baseURL}/health`);
        console.log('✅ Health Check:', healthResponse.data);
        console.log('');

        // 2. Gap Types
        console.log('2️⃣ Boşluk Türleri...');
        const gapTypesResponse = await axios.get(`${baseURL}/gap-types`);
        console.log('✅ Boşluk Türleri:', Object.keys(gapTypesResponse.data.gapTypes).length, 'tür');
        console.log('');

        // 3. Literatür Boşluğu Analizi
        console.log('3️⃣ Literatür Boşluğu Analizi...');
        const gapAnalysisResponse = await axios.post(`${baseURL}/analyze`, {
            topic: 'yapay zeka etiği',
            options: {
                yearRange: { start: 2020, end: 2024 },
                includePatents: false,
                maxResults: 100
            }
        });
        
        if (gapAnalysisResponse.data.success) {
            console.log('✅ Boşluk Analizi Başarılı!');
            console.log(`📊 Tespit Edilen Boşluk: ${gapAnalysisResponse.data.totalGapsFound}`);
            console.log(`🎯 Genel Skor: ${Math.round(gapAnalysisResponse.data.gapAnalysis.overallScore * 100)}%`);
            console.log(`🔍 Öncelikli Alanlar: ${gapAnalysisResponse.data.gapAnalysis.priorityAreas.length}`);
        } else {
            console.log('⚠️ Boşluk Analizi Fallback Data Kullanıyor');
            console.log('📊 Fallback Sonuç:', gapAnalysisResponse.data.fallbackData);
        }
        console.log('');

        // 4. Trend Analizi
        console.log('4️⃣ Trend Analizi...');
        const trendResponse = await axios.post(`${baseURL}/trends`, {
            topic: 'makine öğrenmesi',
            options: {
                yearRange: { start: 2019, end: 2024 },
                includePreprints: true
            }
        });
        
        if (trendResponse.data.success) {
            console.log('✅ Trend Analizi Başarılı!');
            console.log(`📈 Büyüme Oranı: ${trendResponse.data.trendAnalysis.publicationTrends?.growthRate?.toFixed(1) || 'N/A'}%`);
            console.log(`🚀 Gelişen Alanlar: ${trendResponse.data.trendAnalysis.emergingAreas?.length || 0}`);
            console.log(`🔥 Sıcak Konular: ${trendResponse.data.trendAnalysis.hotTopics?.length || 0}`);
        } else {
            console.log('⚠️ Trend Analizi Fallback Data Kullanıyor');
        }
        console.log('');

        // 5. Konu Karşılaştırması
        console.log('5️⃣ Konu Karşılaştırması...');
        const comparisonResponse = await axios.post(`${baseURL}/compare-topics`, {
            topics: ['yapay zeka', 'makine öğrenmesi', 'derin öğrenme'],
            options: {
                yearRange: { start: 2020, end: 2024 },
                metrics: ['publications', 'citations', 'authors']
            }
        });
        
        if (comparisonResponse.data.success) {
            console.log('✅ Karşılaştırma Başarılı!');
            console.log(`🏆 En Aktif Alan: ${comparisonResponse.data.comparison.publicationComparison?.insights?.mostActive || 'N/A'}`);
            console.log(`📊 En Yüksek Etki: ${comparisonResponse.data.comparison.citationComparison?.insights?.highestImpact || 'N/A'}`);
        } else {
            console.log('⚠️ Karşılaştırma Fallback Data Kullanıyor');
        }
        console.log('');

        console.log('🎉 Tüm API testleri tamamlandı!');
        console.log('✅ Sistem hazır ve çalışıyor.');

    } catch (error) {
        console.error('❌ API Test Hatası:', error.message);
        if (error.response) {
            console.error('📄 Hata Detayı:', error.response.data);
        }
    }
}

// Test'i çalıştır
testLiteratureGapAPI();
