// Basit debug test scripti
console.log('🔍 Debug test başlıyor...');

try {
    console.log('1. Servisi import etmeye çalışıyor...');
    const milliKutuphaneService = require('./services/fetchMilliKutuphane');
    console.log('✅ Servis başarıyla import edildi');
    
    console.log('2. Servis tipini kontrol ediyor...');
    console.log('Servis tipi:', typeof milliKutuphaneService);
    console.log('Servis metodları:', Object.getOwnPropertyNames(milliKutuphaneService));
    
    if (milliKutuphaneService.searchArticles) {
        console.log('✅ searchArticles metodu mevcut');
        
        console.log('3. Basit arama testi başlıyor...');
        
        // Timeout ile test
        const testPromise = milliKutuphaneService.searchArticles('test', 0, 1, { searchType: 'all' });
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: 10 saniye')), 10000);
        });
        
        Promise.race([testPromise, timeoutPromise])
            .then(result => {
                console.log('✅ Test başarılı!');
                console.log('Sonuç:', result);
            })
            .catch(error => {
                console.error('❌ Test hatası:', error.message);
                console.error('Stack:', error.stack);
            });
            
    } else {
        console.error('❌ searchArticles metodu bulunamadı');
    }
    
} catch (error) {
    console.error('❌ Import hatası:', error.message);
    console.error('Stack:', error.stack);
}
