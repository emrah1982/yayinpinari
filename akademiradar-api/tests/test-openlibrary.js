require('dotenv').config();
const openLibraryAPI = require('./services/fetchOpenLibrary');

async function testOpenLibrary() {
  console.log('📚 OpenLibrary Servisini Detaylı Test Ediyorum...\n');

  try {
    // Test 1: Kitap Araması
    console.log('Test 1: Kitap Araması');
    console.log('Arama: "yapay zeka" için kitap aranıyor...');
    const bookResults = await openLibraryAPI.searchBooks('yapay zeka');
    console.log(`Toplam Bulunan Kitap: ${bookResults.total || 0}`);
    if (bookResults.results && bookResults.results.length > 0) {
      console.log('\nİlk 3 Kitap:');
      bookResults.results.slice(0, 3).forEach((book, index) => {
        console.log(`\n${index + 1}. Kitap:`);
        console.log('Başlık:', book.title);
        console.log('Yazarlar:', book.authors.join(', ') || 'Belirtilmemiş');
        console.log('Yayın Yılı:', book.publishYear || 'Belirtilmemiş');
        console.log('Yayıncılar:', book.publishers.join(', ') || 'Belirtilmemiş');
        console.log('ISBN:', book.isbn || 'Belirtilmemiş');
        console.log('Diller:', book.languages.join(', ') || 'Belirtilmemiş');
      });
    }
    console.log('\n----------------------------------------\n');

    // Test 2: Yazar Araması
    console.log('Test 2: Yazar Araması');
    console.log('Arama: "Yaşar Kemal" için yazar aranıyor...');
    const authorResults = await openLibraryAPI.searchAuthors('Yasar Kemal');
    if (authorResults && authorResults.length > 0) {
      console.log(`Bulunan Yazar Sayısı: ${authorResults.length}`);
      console.log('\nİlk yazar detayları:');
      const author = authorResults[0];
      console.log('İsim:', author.name);
      console.log('Doğum Tarihi:', author.birthDate || 'Belirtilmemiş');
      console.log('En Önemli Eseri:', author.topWork || 'Belirtilmemiş');
      console.log('Eser Sayısı:', author.workCount || 0);
      console.log('Başlıca Konuları:', author.topSubjects.join(', ') || 'Belirtilmemiş');
    }
    console.log('\n----------------------------------------\n');

    // Test 3: Kitap Detayları
    if (bookResults.results && bookResults.results.length > 0) {
      console.log('Test 3: Kitap Detayları');
      const bookId = bookResults.results[0].id;
      console.log(`İlk kitabın (${bookId}) detayları getiriliyor...`);
      
      const bookDetails = await openLibraryAPI.getBookDetails(bookId);
      console.log('\nKitap Detayları:');
      console.log('Başlık:', bookDetails.title);
      console.log('Açıklama:', bookDetails.description || 'Açıklama bulunmuyor');
      console.log('Konular:', bookDetails.subjects.join(', ') || 'Belirtilmemiş');
      console.log('İlk Yayın Yılı:', bookDetails.firstPublishYear || 'Belirtilmemiş');
      if (bookDetails.coverImage) {
        console.log('Kapak Resmi:', bookDetails.coverImage);
      }
      console.log('Yazarlar:', bookDetails.authors.map(a => a.name).join(', ') || 'Belirtilmemiş');
      console.log('OpenLibrary Linki:', bookDetails.links.openLibrary);
    }
    console.log('\n----------------------------------------\n');

    // Test 4: Sayfalama Testi
    console.log('Test 4: Sayfalama Testi');
    console.log('Arama: "python" için ikinci sayfa (10 sonuç) getiriliyor...');
    const page2Results = await openLibraryAPI.searchBooks('python', 2, 10);
    console.log(`Toplam Sonuç: ${page2Results.total || 0}`);
    console.log(`Sayfa: ${page2Results.page}`);
    console.log(`Sayfa Başına Sonuç: ${page2Results.limit}`);
    if (page2Results.results && page2Results.results.length > 0) {
      console.log('\nİkinci Sayfadaki İlk Kitap:');
      const firstBook = page2Results.results[0];
      console.log('Başlık:', firstBook.title);
      console.log('Yazarlar:', firstBook.authors.join(', ') || 'Belirtilmemiş');
    }

    console.log('\n✅ Tüm testler tamamlandı!\n');

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

testOpenLibrary();
