// Tüm servislerin doğru fonksiyon adlarını tespit etmek için analiz scripti
console.log('🔍 Servis Fonksiyon Adları Analizi\n');

// Her servisi import edip mevcut fonksiyonlarını listeleyelim
const services = [
    { name: 'CORE', path: './services/fetchCore' },
    { name: 'ArXiv', path: './services/fetchArxiv' },
    { name: 'PubMed', path: './services/fetchPubMed' },
    { name: 'OpenLibrary', path: './services/fetchOpenLibrary' },
    { name: 'MedlinePlus', path: './services/fetchMedlinePlus' },
    { name: 'PubChem', path: './services/fetchPubchem' },
    { name: 'PubMed Central', path: './services/fetchPubmedCentral' },
    { name: 'LOC', path: './services/fetchLoc' }
];

services.forEach(service => {
    try {
        console.log(`\n📋 ${service.name} Servisi:`);
        
        let serviceInstance;
        if (service.name === 'PubChem') {
            const { PubchemService } = require(service.path);
            serviceInstance = new PubchemService();
        } else {
            serviceInstance = require(service.path);
        }
        
        // Servis instance'ının fonksiyonlarını listele
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(serviceInstance))
            .filter(name => typeof serviceInstance[name] === 'function' && name !== 'constructor');
        
        console.log('   Mevcut fonksiyonlar:', methods);
        
        // Arama fonksiyonunu tespit et
        const searchMethods = methods.filter(method => 
            method.toLowerCase().includes('search') || 
            method.toLowerCase().includes('articles') ||
            method.toLowerCase().includes('books') ||
            method.toLowerCase().includes('compounds') ||
            method.toLowerCase().includes('topics') ||
            method.toLowerCase().includes('catalog')
        );
        
        console.log('   🎯 Arama fonksiyonları:', searchMethods);
        
    } catch (error) {
        console.log(`   ❌ Hata: ${error.message}`);
    }
});

console.log('\n🎯 API Route için Doğru Fonksiyon Çağrıları:\n');

// API route'unda kullanılması gereken doğru fonksiyon çağrıları
const correctCalls = {
    'CORE': 'coreAPI.searchArticles(query, page, limit)',
    'ArXiv': 'arxivAPI.searchArticles(query, start, limit)',
    'PubMed': 'pubmedAPI.search(query, page, limit)', // Bu kontrol edilmeli
    'OpenLibrary': 'openLibraryAPI.searchBooks(query, page, limit)',
    'MedlinePlus': 'medlinePlusAPI.searchHealthTopics(query, page, limit)',
    'PubChem': 'pubchemAPI.searchCompounds(query, page, limit)',
    'PubMed Central': 'pubmedCentralAPI.search(query, page, limit)', // Bu kontrol edilmeli
    'LOC': 'locAPI.searchCatalog(query, page, limit)'
};

Object.entries(correctCalls).forEach(([service, call]) => {
    console.log(`${service}: ${call}`);
});
