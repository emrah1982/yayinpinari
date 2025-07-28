require('dotenv').config();
const medlinePlusAPI = require('./services/fetchMedlinePlus');

async function testImprovedMedlinePlus() {
  console.log('📚 Geliştirilmiş MedlinePlus Servisi Testi\n');

  try {
    // Test 1: Sağlık Konusu Araması ve Filtreleme
    console.log('Test 1: Sağlık Konusu Araması ve Filtreleme');
    const filters = {
      language: 'Turkish',
      yearRange: [2020, 2023]
    };

    console.log('Arama: "diyabet tedavisi" (filtreli)');
    console.log('Filtreler:', JSON.stringify(filters, null, 2));
    
    const results = await medlinePlusAPI.searchHealth('diyabet tedavisi', 1, 10, filters);
    console.log(`\nBulunan Konu Sayısı: ${results.total}`);
    
    if (results.results.length > 0) {
      console.log('\nİlk Konu:');
      const topic = results.results[0];
      console.log('Başlık:', topic.title);
      console.log('Özet:', topic.snippet);
      console.log('URL:', topic.url);
      console.log('Konular:', topic.topics.join(', '));
      console.log('Son Güncelleme:', topic.lastUpdated);
      console.log('Dil:', topic.language);
      
      if (topic.imageUrl) {
        console.log('Görsel:', topic.imageUrl);
      }
      
      if (topic.translations.length > 0) {
        console.log('\nDiğer Dil Seçenekleri:');
        topic.translations.forEach(t => {
          console.log(`- ${t.language}: ${t.url}`);
        });
      }
      
      if (topic.resources.length > 0) {
        console.log('\nİlgili Kaynaklar:');
        topic.resources.forEach(r => {
          console.log(`- ${r.title}: ${r.url}`);
        });
      }
    }
    console.log('\n----------------------------------------\n');

    // Test 2: Sağlık Konusu Detayları ve Benzer Konular
    if (results.results.length > 0) {
      console.log('Test 2: Sağlık Konusu Detayları ve Benzer Konular');
      const topicId = results.results[0].id;
      console.log(`İlk konunun (${topicId}) detayları ve benzer konuları getiriliyor...`);
      
      const details = await medlinePlusAPI.getHealthTopicDetails(topicId);
      console.log('\nKonu Detayları:');
      console.log('Başlık:', details.title);
      console.log('Özet:', details.summary);
      
      if (details.sections.length > 0) {
        console.log('\nBölümler:');
        details.sections.forEach(section => {
          console.log(`- ${section.title}`);
        });
      }
      
      if (details.media.length > 0) {
        console.log('\nGörsel ve Video Kaynakları:');
        details.media.forEach(m => {
          console.log(`- ${m.type}: ${m.url}`);
        });
      }
      
      if (details.statistics) {
        console.log('\nİstatistikler:');
        Object.entries(details.statistics).forEach(([key, value]) => {
          console.log(`- ${key}: ${value}`);
        });
      }
      
      if (details.similarTopics.length > 0) {
        console.log('\nBenzer Konular:');
        details.similarTopics.forEach((topic, index) => {
          console.log(`\n${index + 1}. ${topic.title}`);
          console.log('   Özet:', topic.snippet);
          console.log('   URL:', topic.url);
          if (topic.imageUrl) {
            console.log('   Görsel:', topic.imageUrl);
          }
        });
      }
    }
    console.log('\n----------------------------------------\n');

    // Test 3: İlaç Araması ve Filtreleme
    console.log('Test 3: İlaç Araması ve Filtreleme');
    const drugFilters = {
      yearRange: [2020, 2023]
    };

    console.log('Arama: "insülin" (filtreli)');
    console.log('Filtreler:', JSON.stringify(drugFilters, null, 2));
    
    const drugResults = await medlinePlusAPI.searchDrugs('insülin', drugFilters);
    console.log(`\nBulunan İlaç Sayısı: ${drugResults.total}`);
    
    if (drugResults.results.length > 0) {
      console.log('\nİlk İlaç:');
      const drug = drugResults.results[0];
      console.log('İsim:', drug.name);
      console.log('Marka İsimleri:', drug.brandNames.join(', '));
      console.log('Kullanım:', drug.usage);
      console.log('Yan Etkiler:', drug.sideEffects);
      console.log('URL:', drug.url);
      
      if (drug.imageUrl) {
        console.log('Görsel:', drug.imageUrl);
      }
      
      if (drug.interactions.length > 0) {
        console.log('\nİlaç Etkileşimleri:');
        drug.interactions.forEach(i => {
          console.log(`- ${i.drug} (${i.severity}): ${i.description}`);
        });
      }
      
      if (drug.forms.length > 0) {
        console.log('\nİlaç Formları:');
        drug.forms.forEach(f => {
          console.log(`- ${f.type} ${f.strength} (${f.route})`);
        });
      }
      
      if (drug.warnings.length > 0) {
        console.log('\nFDA Uyarıları:');
        drug.warnings.forEach(w => {
          console.log(`- ${w}`);
        });
      }
      
      console.log('Son Güncelleme:', drug.lastUpdated);
    }

    console.log('\n✅ Geliştirilmiş MedlinePlus testleri tamamlandı!\n');

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

testImprovedMedlinePlus();
