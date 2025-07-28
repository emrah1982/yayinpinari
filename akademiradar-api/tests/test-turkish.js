require('dotenv').config();
const openLibraryAPI = require('./services/fetchOpenLibrary');

async function testTurkishSupport() {
  console.log('🔍 Türkçe Karakter Desteği Testi\n');

  try {
    // Test 1: Türkçe karakterli kitap araması
    console.log('Test 1: Türkçe Karakterli Kitap Araması');
    const queries = ['güneş', 'Gunes', 'çocuk', 'Cocuk', 'şiir', 'siir'];
    
    for (const query of queries) {
      console.log(`\nArama: "${query}" için kitap aranıyor...`);
      const results = await openLibraryAPI.searchBooks(query);
      console.log(`Bulunan Kitap Sayısı: ${results.total || 0}`);
      
      if (results.results && results.results.length > 0) {
        console.log('\nİlk Kitap:');
        const book = results.results[0];
        console.log('Başlık:', book.title);
        console.log('Yazarlar:', book.authors.join(', '));
      }
      console.log('----------------------------------------');
    }

    // Test 2: Türkçe karakterli yazar araması
    console.log('\nTest 2: Türkçe Karakterli Yazar Araması');
    const authorQueries = ['Yaşar Kemal', 'Yasar Kemal', 'Orhan Pamuk', 'Zülfü Livaneli', 'Zulfu Livaneli'];
    
    for (const query of authorQueries) {
      console.log(`\nArama: "${query}" için yazar aranıyor...`);
      const authors = await openLibraryAPI.searchAuthors(query);
      
      if (authors && authors.length > 0) {
        console.log('Bulunan Yazar:', authors[0].name);
        console.log('Eser Sayısı:', authors[0].workCount);
        console.log('En Önemli Eseri:', authors[0].topWork);
      }
      console.log('----------------------------------------');
    }

    console.log('\n✅ Türkçe karakter testleri tamamlandı!\n');

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

testTurkishSupport();
