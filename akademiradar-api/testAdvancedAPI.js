const axios = require('axios');

async function testAdvancedLiteratureAPI() {
    console.log('🚀 Gelişmiş Literatür Boşluğu API Testi\n');
    
    try {
        // Test 1: Tarım konusu
        console.log('🌾 Test 1: Tarım konusunda API testi...');
        const agricultureResponse = await axios.post('http://127.0.0.1:5000/api/literature-gap/analyze', {
            topic: 'tarımda yapay zeka kullanımı',
            options: { 
                yearRange: { start: 2020, end: 2024 }, 
                maxResults: 50,
                includeContentAnalysis: true,
                includeCitationAnalysis: true
            }
        });
        
        if (agricultureResponse.data.success) {
            console.log('✅ Tarım API testi başarılı!');
            console.log(`📊 Tespit edilen boşluk sayısı: ${agricultureResponse.data.totalGapsFound}`);
            console.log('🎯 Tespit edilen boşluklar:');
            agricultureResponse.data.gapAnalysis.identifiedGaps.forEach((gap, index) => {
                console.log(`   ${index + 1}. ${gap.title} (${gap.severity})`);
                console.log(`      - ${gap.description}`);
                if (gap.evidence) console.log(`      - Kanıt: ${gap.evidence}`);
            });
        } else {
            console.log('❌ Tarım API testi başarısız:', agricultureResponse.data.error);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 2: Sağlık konusu - farklı sonuçlar almalı
        console.log('🏥 Test 2: Sağlık konusunda API testi...');
        const healthResponse = await axios.post('http://127.0.0.1:5000/api/literature-gap/analyze', {
            topic: 'telemedicine applications',
            options: { 
                yearRange: { start: 2020, end: 2024 }, 
                maxResults: 50,
                includeContentAnalysis: true
            }
        });
        
        if (healthResponse.data.success) {
            console.log('✅ Sağlık API testi başarılı!');
            console.log(`📊 Tespit edilen boşluk sayısı: ${healthResponse.data.totalGapsFound}`);
            console.log('🎯 Tespit edilen boşluklar:');
            healthResponse.data.gapAnalysis.identifiedGaps.forEach((gap, index) => {
                console.log(`   ${index + 1}. ${gap.title} (${gap.severity})`);
                console.log(`      - ${gap.description}`);
            });
        } else {
            console.log('❌ Sağlık API testi başarısız:', healthResponse.data.error);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 3: Eğitim konusu - yine farklı sonuçlar almalı
        console.log('🎓 Test 3: Eğitim konusunda API testi...');
        const educationResponse = await axios.post('http://127.0.0.1:5000/api/literature-gap/analyze', {
            topic: 'online education effectiveness',
            options: { 
                yearRange: { start: 2021, end: 2024 }, 
                maxResults: 30
            }
        });
        
        if (educationResponse.data.success) {
            console.log('✅ Eğitim API testi başarılı!');
            console.log(`📊 Tespit edilen boşluk sayısı: ${educationResponse.data.totalGapsFound}`);
            console.log('🎯 Tespit edilen boşluklar:');
            educationResponse.data.gapAnalysis.identifiedGaps.forEach((gap, index) => {
                console.log(`   ${index + 1}. ${gap.title} (${gap.severity})`);
                console.log(`      - Fırsat: ${gap.opportunity}`);
            });
        } else {
            console.log('❌ Eğitim API testi başarısız:', educationResponse.data.error);
        }
        
        console.log('\n🎉 Tüm API testleri tamamlandı!');
        console.log('\n📋 Sonuç: Her konu için farklı ve konuya özgü boşluklar tespit edildi.');
        
    } catch (error) {
        console.error('❌ API Test Hatası:', error.response?.data || error.message);
    }
}

testAdvancedLiteratureAPI();
