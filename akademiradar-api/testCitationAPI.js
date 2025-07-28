const axios = require('axios');

/**
 * Citation API Test Script
 * Backend'deki citation API'sinin gerçek veriler döndürüp döndürmediğini test eder
 */

const API_BASE_URL = 'http://127.0.0.1:5000/api';

async function testCitationAPI() {
    console.log('🧪 Citation API Test Başlıyor...\n');

    // Test verisi - gerçek bir akademik yayın
    const testPublication = {
        title: "Deep Learning",
        author: "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
        year: "2016",
        doi: "10.1007/978-3-319-76887-8"
    };

    try {
        console.log('📊 Test Yayını:', testPublication);
        console.log('🌐 API URL:', `${API_BASE_URL}/citations/single`);
        
        // Single citation API test
        const response = await axios.post(`${API_BASE_URL}/citations/single`, testPublication, {
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('\n✅ API Response Status:', response.status);
        console.log('📋 Response Data:');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.success && response.data.citationInfo) {
            const citation = response.data.citationInfo;
            console.log('\n🎯 Atıf Bilgileri:');
            console.log(`📈 Toplam Atıf: ${citation.citationCount}`);
            console.log(`🎓 H-Index: ${citation.hIndex}`);
            console.log(`🔍 Kaynaklar: ${citation.sources.join(', ')}`);
            console.log(`⚠️ Mock Data: ${citation.isMockData ? 'Evet' : 'Hayır'}`);
            
            if (citation.details) {
                console.log(`💡 Etkili Atıf: ${citation.details.influentialCitationCount}`);
                console.log(`📅 Son Atıflar: ${citation.details.recentCitations}`);
            }
        }

    } catch (error) {
        console.error('❌ API Test Hatası:', error.message);
        if (error.response) {
            console.error('📋 Response Status:', error.response.status);
            console.error('📋 Response Data:', error.response.data);
        }
    }
}

// Batch test
async function testBatchCitationAPI() {
    console.log('\n🔄 Batch Citation API Test...\n');

    const testPublications = [
        {
            title: "Attention Is All You Need",
            author: "Ashish Vaswani",
            year: "2017"
        },
        {
            title: "BERT: Pre-training of Deep Bidirectional Transformers",
            author: "Jacob Devlin",
            year: "2018"
        }
    ];

    try {
        const response = await axios.post(`${API_BASE_URL}/citations/batch`, testPublications, {
            timeout: 20000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Batch API Response Status:', response.status);
        console.log('📊 Batch Results Count:', response.data.results?.length || 0);
        
        if (response.data.results) {
            response.data.results.forEach((result, index) => {
                console.log(`\n📄 Yayın ${index + 1}:`);
                console.log(`📈 Atıf: ${result.citationInfo?.citationCount || 'N/A'}`);
                console.log(`⚠️ Mock: ${result.citationInfo?.isMockData ? 'Evet' : 'Hayır'}`);
            });
        }

    } catch (error) {
        console.error('❌ Batch API Test Hatası:', error.message);
    }
}

// Ana test fonksiyonu
async function runTests() {
    await testCitationAPI();
    await testBatchCitationAPI();
    
    console.log('\n🏁 Test Tamamlandı!');
}

// Test'i çalıştır
runTests();
