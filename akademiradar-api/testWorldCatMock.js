// WorldCat servisi için mock data ile test

class MockWorldCatArayici {
    constructor(apiKey) {
        this.apiKey = apiKey;
        console.log('Mock WorldCat servisi başlatıldı (API key gerekmez)');
    }

    // Mock kitap arama
    async yayinAra(baslik, yazar = '', isbn = '') {
        console.log(`Mock arama: "${baslik}" - "${yazar}" - "${isbn}"`);
        
        // Simüle edilmiş gecikme
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock veri döndür
        const mockKitaplar = [
            {
                baslik: 'Artificial Intelligence: A Modern Approach',
                yazar: 'Stuart Russell, Peter Norvig',
                yayinYili: '2020',
                isbn: '9780134610993',
                oclcNumarasi: '1303890190',
                yayinevi: 'Pearson'
            },
            {
                baslik: 'Machine Learning',
                yazar: 'Tom Mitchell',
                yayinYili: '1997',
                isbn: '9780070428072',
                oclcNumarasi: '36417892',
                yayinevi: 'McGraw-Hill'
            },
            {
                baslik: 'Deep Learning',
                yazar: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
                yayinYili: '2016',
                isbn: '9780262035613',
                oclcNumarasi: '951383149',
                yayinevi: 'MIT Press'
            }
        ];

        // Arama terimine göre filtreleme
        const filtreliSonuclar = mockKitaplar.filter(kitap => {
            const baslikMatch = !baslik || kitap.baslik.toLowerCase().includes(baslik.toLowerCase());
            const yazarMatch = !yazar || kitap.yazar.toLowerCase().includes(yazar.toLowerCase());
            const isbnMatch = !isbn || kitap.isbn.includes(isbn);
            
            return baslikMatch && yazarMatch && isbnMatch;
        });

        console.log(`${filtreliSonuclar.length} mock sonuç bulundu`);
        return filtreliSonuclar;
    }

    // Mock kütüphane arama
    async kutuphaneleriAra(oclcNumarasi, ulke = 'TR', maksimumSonuc = 20) {
        console.log(`Mock kütüphane arama: OCLC ${oclcNumarasi}, Ülke: ${ulke}`);
        
        // Simüle edilmiş gecikme
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock kütüphane verileri
        const mockKutuphaneler = [
            {
                ad: 'Milli Kütüphane',
                sehir: 'Ankara',
                ulke: 'Turkey',
                oclcSembol: 'TUR',
                url: 'https://www.mkutup.gov.tr'
            },
            {
                ad: 'İstanbul Üniversitesi Merkez Kütüphanesi',
                sehir: 'İstanbul',
                ulke: 'Turkey',
                oclcSembol: 'IUL',
                url: 'https://kutuphane.istanbul.edu.tr'
            },
            {
                ad: 'ODTÜ Kütüphanesi',
                sehir: 'Ankara',
                ulke: 'Turkey',
                oclcSembol: 'ODT',
                url: 'https://lib.metu.edu.tr'
            },
            {
                ad: 'Boğaziçi Üniversitesi Kütüphanesi',
                sehir: 'İstanbul',
                ulke: 'Turkey',
                oclcSembol: 'BOU',
                url: 'https://library.boun.edu.tr'
            },
            {
                ad: 'Hacettepe Üniversitesi Kütüphanesi',
                sehir: 'Ankara',
                ulke: 'Turkey',
                oclcSembol: 'HUN',
                url: 'https://kutuphane.hacettepe.edu.tr'
            }
        ];

        console.log(`${mockKutuphaneler.length} mock kütüphane bulundu`);
        return mockKutuphaneler;
    }

    // Mock tam arama
    async tamArama(baslik, yazar = '', isbn = '', ulke = 'TR') {
        console.log('=== Mock WorldCat Tam Arama Başlıyor ===\n');
        
        // Önce kitabı ara
        const kitaplar = await this.yayinAra(baslik, yazar, isbn);
        
        if (kitaplar.length === 0) {
            console.log('Mock veri: Aradığınız kriterlere uygun kitap bulunamadı.');
            return;
        }

        console.log(`${kitaplar.length} mock kitap bulundu:\n`);
        
        // Her kitap için kütüphaneleri ara
        for (let i = 0; i < Math.min(kitaplar.length, 3); i++) {
            const kitap = kitaplar[i];
            console.log(`--- Mock Kitap ${i + 1} ---`);
            console.log(`Başlık: ${kitap.baslik}`);
            console.log(`Yazar: ${kitap.yazar}`);
            console.log(`Yayın Yılı: ${kitap.yayinYili}`);
            console.log(`ISBN: ${kitap.isbn}`);
            console.log(`OCLC: ${kitap.oclcNumarasi}\n`);

            if (kitap.oclcNumarasi) {
                const kutuphaneler = await this.kutuphaneleriAra(kitap.oclcNumarasi, ulke);
                
                if (kutuphaneler.length > 0) {
                    console.log(`Bu kitaba sahip ${kutuphaneler.length} mock kütüphane bulundu:`);
                    kutuphaneler.forEach((kutuphane, index) => {
                        console.log(`${index + 1}. ${kutuphane.ad} - ${kutuphane.sehir}, ${kutuphane.ulke}`);
                        console.log(`   Katalog: ${kutuphane.url}`);
                    });
                } else {
                    console.log('Mock veri: Bu kitaba sahip kütüphane bulunamadı.');
                }
            }
            
            console.log('\n' + '='.repeat(50) + '\n');
        }
    }
}

// Test fonksiyonu
async function testMockWorldCat() {
    console.log('=== Mock WorldCat Servisi Test Başlıyor ===\n');
    
    const mockArayici = new MockWorldCatArayici('mock-api-key');
    
    try {
        console.log('1. Mock Kitap Arama Testi...');
        const sonuclar = await mockArayici.yayinAra('artificial intelligence', 'Russell');
        
        console.log(`\n✅ Mock Sonuç: ${sonuclar.length} kitap bulundu`);
        
        if (sonuclar.length > 0) {
            console.log('\n📚 Mock Bulunan kitaplar:');
            sonuclar.forEach((kitap, index) => {
                console.log(`\n${index + 1}. Kitap:`);
                console.log(`   Başlık: ${kitap.baslik}`);
                console.log(`   Yazar: ${kitap.yazar}`);
                console.log(`   Yayın Yılı: ${kitap.yayinYili}`);
                console.log(`   ISBN: ${kitap.isbn}`);
                console.log(`   OCLC: ${kitap.oclcNumarasi}`);
            });
            
            // İlk kitap için kütüphane arama testi
            console.log('\n2. Mock Kütüphane Arama Testi...');
            const kutuphaneler = await mockArayici.kutuphaneleriAra(sonuclar[0].oclcNumarasi, 'TR');
            
            console.log(`\n✅ Mock Sonuç: ${kutuphaneler.length} kütüphane bulundu`);
            
            if (kutuphaneler.length > 0) {
                console.log('\n🏛️ Mock Bulunan kütüphaneler:');
                kutuphaneler.forEach((kutuphane, index) => {
                    console.log(`\n${index + 1}. Kütüphane:`);
                    console.log(`   Ad: ${kutuphane.ad}`);
                    console.log(`   Şehir: ${kutuphane.sehir}`);
                    console.log(`   URL: ${kutuphane.url}`);
                });
            }
        }
        
        console.log('\n3. Mock Tam Arama Testi...');
        await mockArayici.tamArama('machine learning');
        
    } catch (error) {
        console.error('\n❌ Mock Test Hatası:', error.message);
    }
    
    console.log('\n=== Mock Test Tamamlandı ===');
    console.log('\n💡 Not: Bu test mock veri kullanıyor. Gerçek WorldCat API için:');
    console.log('   1. https://www.oclc.org/developer/home.en.html adresinden kayıt olun');
    console.log('   2. WorldCat Search API erişimi isteyin');
    console.log('   3. API anahtarınızı worldcatService.js dosyasına ekleyin');
}

// Test çalıştır
if (require.main === module) {
    testMockWorldCat();
}

module.exports = { MockWorldCatArayici, testMockWorldCat };
