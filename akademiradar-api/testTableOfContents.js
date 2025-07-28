const axios = require('axios');

async function testTableOfContents() {
    console.log('🧪 İçindekiler özelliği test ediliyor...\n');
    
    try {
        // Backend API'yi test et
        const response = await axios.post('http://localhost:5000/api/library-search', {
            query: 'yapay zeka',
            limit: 3
        });
        
        if (response.data.success && response.data.results.length > 0) {
            console.log('✅ API başarıyla çalışıyor');
            console.log(`📚 ${response.data.results.length} kitap bulundu\n`);
            
            // Her kitap için içindekiler kontrolü
            response.data.results.forEach((kitap, index) => {
                console.log(`--- KİTAP ${index + 1} ---`);
                console.log(`📖 Başlık: ${kitap.title}`);
                console.log(`👤 Yazar: ${kitap.authors?.join(', ') || 'Bilinmiyor'}`);
                console.log(`📅 Yıl: ${kitap.year || 'Bilinmiyor'}`);
                console.log(`🏷️ Tür: ${kitap.type || 'Bilinmiyor'}`);
                
                // İçindekiler kontrolü
                if (kitap.tableOfContents && kitap.tableOfContents.length > 0) {
                    console.log('📚 İçindekiler:');
                    kitap.tableOfContents.forEach((baslik, i) => {
                        console.log(`   ${i + 1}. ${baslik}`);
                    });
                } else {
                    console.log('❌ İçindekiler bulunamadı');
                }
                
                console.log(''); // Boş satır
            });
            
        } else {
            console.log('❌ API\'den sonuç alınamadı');
            console.log('Response:', response.data);
        }
        
    } catch (error) {
        console.error('❌ Test hatası:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Test çalıştır
testTableOfContents();
