require('dotenv').config();
const arxivAPI = require('./services/fetchArxiv');

async function testImprovedArxiv() {
  console.log('📚 Geliştirilmiş arXiv Servisi Testi\n');

  try {
    // Test 1: Filtreleme ve Türkçe karakter desteği
    console.log('Test 1: Filtreleme ve Türkçe Karakter Desteği');
    const filters = {
      yearRange: [2020, 2023],
      category: 'cs.AI'  // Yapay Zeka kategorisi
    };

    console.log('Arama: "yapay öğrenme" (filtreli)');
    console.log('Filtreler:', JSON.stringify(filters, null, 2));
    
    const results = await arxivAPI.searchArticles('yapay öğrenme', 0, 10, filters);
    console.log(`\nBulunan Makale Sayısı: ${results.total}`);
    
    if (results.articles.length > 0) {
      console.log('\nİlk Makale:');
      const article = results.articles[0];
      console.log('Başlık:', article.title);
      console.log('Yazarlar:', article.authors.join(', '));
      console.log('Yayın Tarihi:', new Date(article.published).toLocaleDateString('tr-TR'));
      console.log('Kategoriler:', article.categories.join(', '));
      console.log('DOI:', article.doi || 'Belirtilmemiş');
      if (article.previewImage) {
        console.log('Önizleme:', article.previewImage);
      }
    }
    console.log('\n----------------------------------------\n');

    // Test 2: Rate Limit ve Hata Yönetimi
    console.log('Test 2: Rate Limit ve Hata Yönetimi');
    console.log('Hızlı ardışık istekler yapılıyor...');
    
    const queries = ['machine learning', 'deep learning', 'neural networks', 'artificial intelligence', 'reinforcement learning'];
    const results2 = await Promise.all(
      queries.map(q => arxivAPI.searchArticles(q, 0, 5))
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
      
      const details = await arxivAPI.getArticleDetails(articleId);
      console.log('\nMakale Detayları:');
      console.log('Başlık:', details.title);
      console.log('Özet:', details.summary);
      console.log('Yazarlar:', details.authors.join(', '));
      console.log('Kategoriler:', details.categories.join(', '));
      console.log('DOI:', details.doi || 'Belirtilmemiş');
      
      if (details.similarArticles && details.similarArticles.length > 0) {
        console.log('\nBenzer Makaleler:');
        details.similarArticles.forEach((article, index) => {
          console.log(`\n${index + 1}. ${article.title}`);
          console.log('   Yazarlar:', article.authors.join(', '));
          console.log('   Yayın Tarihi:', new Date(article.published).toLocaleDateString('tr-TR'));
          if (article.previewImage) {
            console.log('   Önizleme:', article.previewImage);
          }
        });
      }
    }

    console.log('\n✅ Geliştirilmiş arXiv testleri tamamlandı!\n');

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

testImprovedArxiv();
