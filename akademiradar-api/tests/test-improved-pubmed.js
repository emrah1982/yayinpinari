require('dotenv').config();
const pubmedAPI = require('./services/fetchPubMed');

async function testImprovedPubMed() {
  console.log('📚 Geliştirilmiş PubMed Servisi Testi\n');

  try {
    // Test 1: Filtreleme ve Türkçe karakter desteği
    console.log('Test 1: Filtreleme ve Türkçe Karakter Desteği');
    const filters = {
      yearRange: [2020, 2023],
      language: 'Turkish',
      publicationType: 'Journal Article'
    };

    console.log('Arama: "kanser tedavisi" (filtreli)');
    console.log('Filtreler:', JSON.stringify(filters, null, 2));
    
    const results = await pubmedAPI.searchArticles('kanser tedavisi', 0, 10, filters);
    console.log(`\nBulunan Makale Sayısı: ${results.total}`);
    
    if (results.articles.length > 0) {
      console.log('\nİlk Makale:');
      const article = results.articles[0];
      console.log('Başlık:', article.title);
      console.log('Yazarlar:', article.authors.join(', '));
      console.log('Dergi:', article.journal);
      console.log('Yayın Tarihi:', article.publicationDate);
      console.log('Dil:', article.language);
      console.log('Atıf Sayısı:', article.citationCount);
      console.log('DOI:', article.doi || 'Belirtilmemiş');
      if (article.previewImage) {
        console.log('Önizleme:', article.previewImage);
      }
      if (article.keywords.length > 0) {
        console.log('Anahtar Kelimeler:', article.keywords.join(', '));
      }
      if (article.meshTerms.length > 0) {
        console.log('MeSH Terimleri:', article.meshTerms.join(', '));
      }
    }
    console.log('\n----------------------------------------\n');

    // Test 2: Rate Limit ve Hata Yönetimi
    console.log('Test 2: Rate Limit ve Hata Yönetimi');
    console.log('Hızlı ardışık istekler yapılıyor...');
    
    const queries = ['cancer therapy', 'diabetes treatment', 'heart disease', 'covid-19', 'obesity'];
    const results2 = await Promise.all(
      queries.map(q => pubmedAPI.searchArticles(q, 0, 5))
    );
    
    console.log(`${queries.length} istek başarıyla tamamlandı.`);
    results2.forEach((result, index) => {
      console.log(`\n"${queries[index]}" için ${result.total} sonuç bulundu`);
    });
    console.log('\n----------------------------------------\n');

    // Test 3: Detaylı Makale Bilgisi ve Benzer Makaleler
    console.log('Test 3: Detaylı Makale Bilgisi ve Benzer Makaleler');
    if (results.articles.length > 0) {
      const articleId = results.articles[0].id;
      console.log(`İlk makalenin (${articleId}) detayları ve benzer makaleleri getiriliyor...`);
      
      const details = await pubmedAPI.getArticleDetails(articleId);
      console.log('\nMakale Detayları:');
      console.log('Başlık:', details.title);
      console.log('Özet:', details.abstract);
      console.log('Yazarlar:', details.authors.join(', '));
      console.log('Dergi:', details.journal);
      console.log('Yayın Tarihi:', details.publicationDate);
      console.log('Atıf Sayısı:', details.citationCount);
      console.log('DOI:', details.doi || 'Belirtilmemiş');
      
      if (details.keywords.length > 0) {
        console.log('\nAnahtar Kelimeler:', details.keywords.join(', '));
      }
      
      if (details.meshTerms.length > 0) {
        console.log('MeSH Terimleri:', details.meshTerms.join(', '));
      }
      
      if (details.similarArticles && details.similarArticles.length > 0) {
        console.log('\nBenzer Makaleler:');
        details.similarArticles.forEach((article, index) => {
          console.log(`\n${index + 1}. ${article.title}`);
          console.log('   Yazarlar:', article.authors.join(', '));
          console.log('   Dergi:', article.journal);
          console.log('   Yayın Tarihi:', article.publicationDate);
          console.log('   Atıf Sayısı:', article.citationCount);
          if (article.previewImage) {
            console.log('   Önizleme:', article.previewImage);
          }
        });
      }
    }

    console.log('\n✅ Geliştirilmiş PubMed testleri tamamlandı!\n');

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

testImprovedPubMed();
