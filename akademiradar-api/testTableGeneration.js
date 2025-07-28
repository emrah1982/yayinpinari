// Basit içindekiler test scripti
const MilliKutuphaneService = require('./services/fetchMilliKutuphane');

console.log('🧪 İçindekiler üretim testi...\n');

// Test verileri
const testCases = [
    {
        title: 'Yapay zekâ transhümanizm ve din',
        subjects: [],
        type: 'book'
    },
    {
        title: 'Artificial Intelligence: A Modern Approach',
        subjects: ['artificial intelligence', 'computer science'],
        type: 'textbook'
    },
    {
        title: 'Osmanlı Tarihi',
        subjects: ['history', 'ottoman'],
        type: 'book'
    }
];

testCases.forEach((testCase, index) => {
    console.log(`--- TEST ${index + 1} ---`);
    console.log(`Başlık: ${testCase.title}`);
    console.log(`Konular: [${testCase.subjects.join(', ')}]`);
    console.log(`Tür: ${testCase.type}`);
    
    const tableOfContents = MilliKutuphaneService.generateTableOfContents(
        testCase.subjects, 
        testCase.title, 
        testCase.type
    );
    
    console.log('İçindekiler:');
    if (Array.isArray(tableOfContents) && tableOfContents.length > 0) {
        tableOfContents.forEach((item, i) => {
            console.log(`  ${i + 1}. ${item}`);
        });
        console.log('✅ İçindekiler başarıyla oluşturuldu\n');
    } else {
        console.log('❌ İçindekiler oluşturulamadı\n');
    }
});
