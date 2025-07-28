require('dotenv').config();
const openLibraryAPI = require('./services/fetchOpenLibrary');

async function testImprovedOpenLibrary() {
  console.log('📚 Geliştirilmiş OpenLibrary Servisi Testi\n');

  try {
    // Test 1: Filtreleme ve Türkçe karakter desteği
    console.log('Test 1: Filtreleme ve Türkçe Karakter Desteği');
    const filters = {
      language: 'tur',
      yearRange: [2010, 2023],
      publisher: 'yayınları'
    };

    console.log('Arama: "eğitim" (filtreli)');
    console.log('Filtreler:', JSON.stringify(filters, null, 2));
    
    const results = await openLibraryAPI.searchBooks('eğitim', 1, 10, filters);
    console.log(`\nBulunan Kitap Sayısı: ${results.total}`);
    
    if (results.results.length > 0) {
      console.log('\nİlk Kitap:');
      const book = results.results[0];
      console.log('Başlık:', book.title);
      console.log('Yayıncı:', book.publishers.join(', '));
      console.log('Yıl:', book.publishYear);
      console.log('Dil:', book.languages.join(', '));
      if (book.coverImage) {
        console.log('Kapak Resmi:', book.coverImage);
      }
    }
    console.log('\n----------------------------------------\n');

    // Test 2: Rate Limit ve Hata Yönetimi
    console.log('Test 2: Rate Limit ve Hata Yönetimi');
    console.log('Hızlı ardışık istekler yapılıyor...');
    
    const queries = ['python', 'javascript', 'java', 'c++', 'ruby'];
    const results2 = await Promise.all(
      queries.map(q => openLibraryAPI.searchBooks(q, 1, 5))
    );
    
    console.log(`${queries.length} istek başarıyla tamamlandı.`);
    results2.forEach((result, index) => {
      console.log(`\n"${queries[index]}" için ${result.total} sonuç bulundu`);
    });
    console.log('\n----------------------------------------\n');

    // Test 3: Detaylı Kitap Bilgisi ve Benzer Kitaplar
    console.log('Test 3: Detaylı Kitap Bilgisi ve Benzer Kitaplar');
    if (results.results.length > 0) {
      const bookId = results.results[0].id;
      console.log(`İlk kitabın (${bookId}) detayları ve benzer kitapları getiriliyor...`);
      
      const details = await openLibraryAPI.getBookDetails(bookId);
      console.log('\nKitap Detayları:');
      console.log('Başlık:', details.title);
      console.log('Açıklama:', details.description);
      console.log('Yazarlar:', details.authors.map(a => a.name).join(', '));
      
      if (details.similarBooks && details.similarBooks.length > 0) {
        console.log('\nBenzer Kitaplar:');
        details.similarBooks.forEach((book, index) => {
          console.log(`\n${index + 1}. ${book.title}`);
          console.log('   Yazar:', book.author || 'Belirtilmemiş');
          console.log('   Yıl:', book.year || 'Belirtilmemiş');
          if (book.coverImage) {
            console.log('   Kapak:', book.coverImage);
          }
        });
      }
    }
    console.log('\n----------------------------------------\n');

    // Test 4: Yazar Araması ve Popüler Kitapları
    console.log('Test 4: Yazar Araması ve Popüler Kitapları');
    const authorResults = await openLibraryAPI.searchAuthors('Orhan Pamuk');
    
    if (authorResults.length > 0) {
      const author = authorResults[0];
      console.log('\nYazar Bilgileri:');
      console.log('İsim:', author.name);
      console.log('Doğum Tarihi:', author.birthDate || 'Belirtilmemiş');
      console.log('Eser Sayısı:', author.workCount);
      console.log('En Önemli Eseri:', author.topWork);
      
      if (author.photo) {
        console.log('Fotoğraf:', author.photo);
      }
      
      if (author.popularBooks && author.popularBooks.length > 0) {
        console.log('\nPopüler Kitapları:');
        author.popularBooks.forEach((book, index) => {
          console.log(`\n${index + 1}. ${book.title}`);
          console.log('   Yıl:', book.year || 'Belirtilmemiş');
          if (book.coverImage) {
            console.log('   Kapak:', book.coverImage);
          }
        });
      }
    }

    console.log('\n✅ Geliştirilmiş OpenLibrary testleri tamamlandı!\n');

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

testImprovedOpenLibrary();
