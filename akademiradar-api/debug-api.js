// Backend API route'unda neden 500 hatası aldığımızı tespit etmek için debug scripti
const express = require('express');

console.log('🔍 Backend API Debug Başlatılıyor...\n');

// API route'unda kullanılan servisleri aynı şekilde import edelim
try {
    console.log('📦 Servisleri import ediliyor...');
    
    const coreAPI = require('./services/fetchCore');
    console.log('✅ CORE API import edildi');
    
    const arxivAPI = require('./services/fetchArxiv');
    console.log('✅ ArXiv API import edildi');
    
    const pubmedAPI = require('./services/fetchPubMed');
    console.log('✅ PubMed API import edildi');
    
    const openLibraryAPI = require('./services/fetchOpenLibrary');
    console.log('✅ OpenLibrary API import edildi');
    
    const medlinePlusAPI = require('./services/fetchMedlinePlus');
    console.log('✅ MedlinePlus API import edildi');
    
    // PubChem için düzeltilmiş import
    const { PubchemService } = require('./services/fetchPubchem');
    const pubchemAPI = new PubchemService();
    console.log('✅ PubChem API import edildi');
    
    const pubmedCentralAPI = require('./services/fetchPubmedCentral');
    console.log('✅ PubMed Central API import edildi');
    
    const locAPI = require('./services/fetchLoc');
    console.log('✅ LOC API import edildi');
    
    console.log('\n🎯 Tüm servisler başarıyla import edildi!');
    
    // Şimdi API route'unda yapılan işlemleri simüle edelim
    console.log('\n🔄 API route mantığını test ediliyor...');
    
    const query = 'yapay zeka';
    const page = 1;
    const limit = 3;
    const sources = ['core,arxiv,pubmed,openlibrary,medlineplus,pubchem,pmc,loc'];
    const sourceList = sources.toString().toLowerCase().split(',');
    
    console.log('📋 Query:', query);
    console.log('📋 Sources:', sourceList);
    
    const results = {
        core: [],
        arxiv: [],
        pubmed: [],
        openlibrary: [],
        medlineplus: [],
        pubchem: [],
        pmc: [],
        loc: []
    };
    
    console.log('📋 Results object oluşturuldu');
    
    // Promise'ları oluşturalım (API route'unda olduğu gibi)
    const promises = [];
    
    if (sourceList.includes('core')) {
        console.log('🔄 CORE promise ekleniyor...');
        promises.push(
            coreAPI.search(query, page, limit)
                .then(data => {
                    console.log('✅ CORE başarılı');
                    results.core = data;
                    return { success: true, data };
                })
                .catch(err => {
                    console.log('❌ CORE hata:', err.message);
                    results.core = { error: err.message };
                    return { success: false, error: err };
                })
        );
    }
    
    if (sourceList.includes('arxiv')) {
        console.log('🔄 ArXiv promise ekleniyor...');
        promises.push(
            arxivAPI.searchArticles(query, 0, limit)
                .then(data => {
                    console.log('✅ ArXiv başarılı');
                    results.arxiv = data;
                    return { success: true, data };
                })
                .catch(err => {
                    console.log('❌ ArXiv hata:', err.message);
                    results.arxiv = { error: err.message };
                    return { success: false, error: err };
                })
        );
    }
    
    console.log(`\n📊 Toplam ${promises.length} promise oluşturuldu`);
    
    // Promise.allSettled ile test edelim
    console.log('\n🚀 Promise.allSettled çalıştırılıyor...');
    
    Promise.allSettled(promises)
        .then(promiseResults => {
            console.log('\n✅ Promise.allSettled tamamlandı!');
            console.log('📊 Sonuç sayısı:', promiseResults.length);
            
            for (let i = 0; i < promiseResults.length; i++) {
                const promiseResult = promiseResults[i];
                const sourceName = Object.keys(results)[i];
                
                console.log(`\n📋 ${sourceName}:`);
                console.log('   Status:', promiseResult.status);
                
                if (promiseResult.status === 'fulfilled') {
                    console.log('   ✅ Başarılı');
                } else {
                    console.log('   ❌ Hata:', promiseResult.reason?.message);
                }
            }
            
            console.log('\n🎉 Debug tamamlandı - API route mantığı çalışıyor!');
        })
        .catch(error => {
            console.error('\n💥 Promise.allSettled hatası:', error);
        });
    
} catch (error) {
    console.error('💥 Import hatası:', error);
    console.error('Stack:', error.stack);
}
