require('dotenv').config();
const openLibraryAPI = require('./services/fetchOpenLibrary');

async function testTitleNormalization() {
  console.log('📚 Başlık Normalizasyon Testi\n');

  const testQueries = [
    'egitim',
    'cocuk kitaplari',
    'turkiye tarihi',
    'kultur ve sanat',
    'bilim arastirma',
    'universite yayinlari'
  ];

  try {
    for (const query of testQueries) {
      console.log(`\nTest Sorgusu: "${query}"`);
      const results = await openLibraryAPI.searchBooks(query);

      if (results.results && results.results.length > 0) {
        console.log('\nİlk 3 Sonuç:');
        results.results.slice(0, 3).forEach((book, index) => {
          console.log(`\n${index + 1}. Kitap:`);
          console.log('Normalize Edilmiş Başlık:', book.title);
          console.log('Orijinal Başlık:', book.originalTitle);
          console.log('Yazarlar:', book.authors.join(', ') || 'Belirtilmemiş');
          console.log('Dil:', book.language.join(', ') || 'Belirtilmemiş');
          if (book.firstSentence) {
            console.log('İlk Cümle:', book.firstSentence);
          }
          console.log('----------------------------------------');
        });
      } else {
        console.log('Bu sorgu için sonuç bulunamadı.');
      }
    }

    console.log('\n✅ Başlık normalizasyon testleri tamamlandı!\n');

  } catch (error) {
    console.error('❌ Test sırasında hata:', error.message);
    if (error.response) {
      console.error('Hata Detayları:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
  }
}

testTitleNormalization();
