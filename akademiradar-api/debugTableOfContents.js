const axios = require('axios');

async function debugTableOfContents() {
    console.log('🔍 İçindekiler debug testi başlıyor...\n');
    
    try {
        // Backend API'yi test et
        const response = await axios.post('http://localhost:5000/api/library-search', {
            query: 'yapay zeka',
            limit: 2
        });
        
        console.log('✅ API Response Status:', response.status);
        console.log('✅ API Success:', response.data.success);
        console.log('✅ Total Results:', response.data.totalResults);
        console.log('✅ Results Length:', response.data.results?.length || 0);
        
        if (response.data.success && response.data.results && response.data.results.length > 0) {
            console.log('\n📚 İlk kitap detayları:');
            const firstBook = response.data.results[0];
            
            console.log('📖 Başlık:', firstBook.title);
            console.log('👤 Yazar:', firstBook.authors?.join(', ') || 'Bilinmiyor');
            console.log('🏷️ Tür:', firstBook.type || 'Bilinmiyor');
            
            // İçindekiler kontrolü - RAW data
            console.log('\n🔍 RAW tableOfContents field:');
            console.log('Type:', typeof firstBook.tableOfContents);
            console.log('Value:', firstBook.tableOfContents);
            console.log('Is Array:', Array.isArray(firstBook.tableOfContents));
            console.log('Length:', firstBook.tableOfContents?.length || 0);
            
            if (firstBook.tableOfContents && Array.isArray(firstBook.tableOfContents) && firstBook.tableOfContents.length > 0) {
                console.log('\n✅ İçindekiler bulundu:');
                firstBook.tableOfContents.forEach((item, index) => {
                    console.log(`   ${index + 1}. ${item}`);
                });
            } else {
                console.log('\n❌ İçindekiler bulunamadı veya boş');
            }
            
            // Tüm field'ları listele
            console.log('\n🔍 Tüm kitap field\'ları:');
            Object.keys(firstBook).forEach(key => {
                console.log(`   ${key}: ${typeof firstBook[key]} - ${Array.isArray(firstBook[key]) ? `Array[${firstBook[key].length}]` : firstBook[key]}`);
            });
            
        } else {
            console.log('❌ API\'den sonuç alınamadı');
            console.log('Response:', JSON.stringify(response.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Debug test hatası:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Test çalıştır
debugTableOfContents();
