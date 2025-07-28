// Trend Analysis API Debug - "Toplam Yayın", "Büyüme Oranı" ve "Yıllık Yayın Trendi" sorunu için
const fetch = require('node-fetch');

async function debugTrendAnalysis() {
    console.log('🔍 Debug: Trend Analysis API - Toplam Yayın ve Büyüme Oranı Sorunu\n');
    
    try {
        console.log('📊 "yapay zeka" sorgusu ile test ediliyor...');
        const response = await fetch('http://localhost:5000/api/trend-analysis/comprehensive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: 'yapay zeka',
                startYear: 2019,
                endYear: 2025,
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
        console.log('✅ API yanıtı alındı\n');
        
        if (result.success && result.data) {
            console.log('📈 SORUN TESPİTİ:');
            console.log('================');
            
            // Toplam Yayın Kontrolü
            console.log('🔍 Toplam Yayın Analizi:');
            console.log('- API totalPublications:', result.data.summary?.totalPublications || 'YOK');
            console.log('- Beklenen: > 0');
            console.log('- Durum:', (result.data.summary?.totalPublications || 0) > 0 ? '✅ OK' : '❌ SORUN');
            
            // Büyüme Oranı Kontrolü
            console.log('\n🔍 Büyüme Oranı Analizi:');
            console.log('- API growthRate:', result.data.summary?.growthRate || 'YOK');
            console.log('- Beklenen: != 0');
            console.log('- Durum:', (result.data.summary?.growthRate || 0) !== 0 ? '✅ OK' : '❌ SORUN');
            
            // Yıllık Veri Kontrolü
            console.log('\n🔍 Yıllık Veri Analizi:');
            if (result.data.yearlyData) {
                const years = Object.keys(result.data.yearlyData);
                console.log('- Yıl sayısı:', years.length);
                console.log('- Yıllar:', years);
                
                if (years.length > 0) {
                    const firstYear = years[0];
                    const yearData = result.data.yearlyData[firstYear];
                    console.log(`- ${firstYear} verisi:`, yearData);
                    console.log('- Publications > 0?', (yearData.publications || 0) > 0 ? '✅ OK' : '❌ SORUN');
                }
                
                // Toplam publications hesapla
                const totalPubs = years.reduce((sum, year) => {
                    return sum + (result.data.yearlyData[year].publications || 0);
                }, 0);
                console.log('- Hesaplanan toplam publications:', totalPubs);
                console.log('- Durum:', totalPubs > 0 ? '✅ OK' : '❌ SORUN');
            } else {
                console.log('❌ yearlyData YOK!');
            }
            
            // Kaynaklar
            console.log('\n🔍 Veri Kaynakları:');
            console.log('- Sources:', result.data.sources || []);
            
            // Tam API yanıtı (debug için)
            console.log('\n🔍 TAM API YANITINI:');
            console.log('===================');
            console.log(JSON.stringify(result, null, 2));
            
        } else {
            console.log('❌ API yanıtında veri yok');
            console.log('Full response:', result);
        }

    } catch (error) {
        console.error('❌ Debug hatası:', error.message);
    }
}

debugTrendAnalysis();
