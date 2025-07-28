// Hızlı API test scripti
const fetch = require('node-fetch');

async function quickTest() {
    console.log('🧪 Hızlı API Test - Yıllık Yayın Trendi Kontrolü\n');
    
    try {
        console.log('📊 Comprehensive Analysis testi...');
        const response = await fetch('http://localhost:5000/api/trend-analysis/comprehensive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: 'yapay zeka',
                startYear: 2019,
                endYear: 2024,
                includeProjects: true,
                includeFunding: true,
                includeCitations: true
            })
        });

        if (!response.ok) {
            console.error('❌ API hatası:', response.status, response.statusText);
            return;
        }

        const result = await response.json();
        console.log('✅ API yanıtı alındı');
        
        if (result.success && result.data) {
            console.log('\n📈 Yıllık Veri Kontrolü:');
            console.log('- yearlyData mevcut mu?', !!result.data.yearlyData);
            console.log('- yearlyData yıl sayısı:', Object.keys(result.data.yearlyData || {}).length);
            
            if (result.data.yearlyData) {
                console.log('- Yıllar:', Object.keys(result.data.yearlyData));
                const firstYear = Object.keys(result.data.yearlyData)[0];
                if (firstYear) {
                    console.log(`- ${firstYear} verisi:`, result.data.yearlyData[firstYear]);
                }
            }
            
            console.log('\n📊 Özet Bilgiler:');
            console.log('- Toplam yayın:', result.data.summary?.totalPublications || 0);
            console.log('- Trend tipi:', result.data.summary?.trendType || 'bilinmiyor');
            console.log('- Kaynaklar:', result.data.sources || []);
            
        } else {
            console.log('❌ API yanıtında veri yok');
        }

    } catch (error) {
        console.error('❌ Test hatası:', error.message);
    }
}

quickTest();
