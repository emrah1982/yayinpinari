const Z3950Manager = require('./z3950Manager');
const LOCService = require('./locService');
const Marc21Utils = require('./marc21Utils');
const PDFAccessService = require('./pdfAccessService');
const TurkishNationalService = require('./turkishNationalService');
const CitationService = require('./citationService');

/**
 * Z3950 servislerini test etmek için örnek kullanım senaryoları
 */
class Z3950Tester {
    constructor() {
        this.manager = new Z3950Manager();
        this.marc21Utils = new Marc21Utils();
        this.pdfAccessService = new PDFAccessService();
        this.citationService = new CitationService();
    }

    /**
     * Temel arama testini çalıştırır
     */
    async testBasicSearch() {
        console.log('\n=== Temel Arama Testi ===');
        try {
            const results = await this.manager.searchAllServices('artificial intelligence', {
                searchType: 'title',
                count: 5
            });

            console.log(`Arama başarılı: ${results.success}`);
            console.log(`Toplam sonuç: ${results.metadata.totalResults}`);
            console.log(`Arama süresi: ${results.metadata.searchTime}ms`);
            
            if (results.results.length > 0) {
                console.log('\nİlk sonuç:');
                console.log(`Başlık: ${results.results[0].title}`);
                console.log(`Yazar: ${results.results[0].author}`);
                console.log(`Yayıncı: ${results.results[0].publisher}`);
                console.log(`Kütüphane: ${results.results[0].source?.institution}`);
            }

            return results;
        } catch (error) {
            console.error('Temel arama testi hatası:', error.message);
            return null;
        }
    }

    /**
     * ISBN arama testini çalıştırır
     */
    async testISBNSearch() {
        console.log('\n=== ISBN Arama Testi ===');
        try {
            // Örnek ISBN (The Art of Computer Programming)
            const isbn = '9780201896831';
            const results = await this.manager.searchAllServices(isbn, {
                searchType: 'isbn',
                count: 3
            });

            console.log(`ISBN arama başarılı: ${results.success}`);
            console.log(`Bulunan sonuç: ${results.metadata.totalResults}`);
            
            if (results.results.length > 0) {
                console.log('\nISBN sonucu:');
                console.log(`Başlık: ${results.results[0].title}`);
                console.log(`ISBN: ${results.results[0].isbn}`);
                console.log(`Yazar: ${results.results[0].author}`);
            }

            return results;
        } catch (error) {
            console.error('ISBN arama testi hatası:', error.message);
            return null;
        }
    }

    /**
     * Yazar arama testini çalıştırır
     */
    async testAuthorSearch() {
        console.log('\n=== Yazar Arama Testi ===');
        try {
            const results = await this.manager.searchAllServices('Donald Knuth', {
                searchType: 'author',
                count: 5
            });

            console.log(`Yazar arama başarılı: ${results.success}`);
            console.log(`Bulunan sonuç: ${results.metadata.totalResults}`);
            
            if (results.results.length > 0) {
                console.log('\nYazar sonuçları:');
                results.results.slice(0, 3).forEach((result, index) => {
                    console.log(`${index + 1}. ${result.title} - ${result.author}`);
                });
            }

            return results;
        } catch (error) {
            console.error('Yazar arama testi hatası:', error.message);
            return null;
        }
    }

    /**
     * Belirli bir serviste arama testini çalıştırır
     */
    async testSpecificServiceSearch() {
        console.log('\n=== LOC Servis Testi ===');
        try {
            const results = await this.manager.searchInService('loc', 'machine learning', {
                searchType: 'subject',
                count: 3
            });

            console.log(`LOC arama başarılı: ${results.success}`);
            console.log(`Bulunan sonuç: ${results.metadata.totalResults}`);
            
            if (results.results.length > 0) {
                console.log('\nLOC sonuçları:');
                results.results.forEach((result, index) => {
                    console.log(`${index + 1}. ${result.title}`);
                    console.log(`   Kütüphane: ${result.libraryInfo?.institution}`);
                    console.log(`   Ülke: ${result.libraryInfo?.country}`);
                    console.log(`   Şehir: ${result.libraryInfo?.city}`);
                });
            }

            return results;
        } catch (error) {
            console.error('LOC servis testi hatası:', error.message);
            return null;
        }
    }

    /**
     * WorldCat servis testini çalıştırır
     */
    async testWorldCatService() {
        console.log('\n=== WorldCat Servis Testi ===');
        try {
            const results = await this.manager.searchInService('worldcat', 'artificial intelligence', {
                searchType: 'title',
                count: 3
            });

            console.log(`WorldCat arama başarılı: ${results.success}`);
            console.log(`Bulunan sonuç: ${results.metadata.totalResults}`);
            
            if (results.results.length > 0) {
                console.log('\nWorldCat sonuçları:');
                results.results.forEach((result, index) => {
                    console.log(`${index + 1}. ${result.title}`);
                    console.log(`   Yazar: ${result.author}`);
                    console.log(`   OCLC: ${result.oclcNumber}`);
                    console.log(`   Mevcut kütüphaneler: ${result.libraryInfo?.totalLibraries}`);
                    console.log(`   Format: ${result.format}`);
                    if (result.libraryInfo?.availableLibraries) {
                        console.log(`   Örnek kütüphaneler: ${result.libraryInfo.availableLibraries.slice(0, 2).join(', ')}`);
                    }
                });
            }

            return results;
        } catch (error) {
            console.error('WorldCat servis testi hatası:', error.message);
            return null;
        }
    }

    /**
     * Servis durumu testini çalıştırır
     */
    async testServiceStatus() {
        console.log('\n=== Servis Durumu Testi ===');
        try {
            const status = await this.manager.checkAllServicesStatus();
            
            console.log('Servis durumları:');
            status.services.forEach(service => {
                console.log(`${service.name}: ${service.status}`);
                if (service.error) {
                    console.log(`  Hata: ${service.error}`);
                }
                if (service.responseTime) {
                    console.log(`  Yanıt süresi: ${service.responseTime}ms`);
                }
            });

            return status;
        } catch (error) {
            console.error('Servis durumu testi hatası:', error.message);
            return null;
        }
    }

    /**
     * MARC21 dönüştürme testini çalıştırır
     */
    async testMarc21Conversion() {
        console.log('\n=== MARC21 Dönüştürme Testi ===');
        try {
            // Önce bir arama yap ve sonucu al
            const searchResults = await this.manager.searchAllServices('programming', {
                searchType: 'title',
                count: 1
            });

            if (searchResults.results.length > 0) {
                const book = searchResults.results[0];
                console.log('Kitap bilgileri:');
                console.log(`Başlık: ${book.title}`);
                console.log(`Yazar: ${book.author}`);
                console.log(`Format: ${book.format}`);
                
                // Anahtar kelimeler çıkar (simüle edilmiş MARC21 kaydı ile)
                const mockMarcRecord = {
                    fields: [
                        { '245': { subfields: [{ a: book.title }] } },
                        { '100': { subfields: [{ a: book.author }] } },
                        { '650': { subfields: [{ a: 'Computer programming' }] } }
                    ]
                };

                const keywords = this.marc21Utils.extractKeywords(mockMarcRecord);
                console.log(`Anahtar kelimeler: ${keywords.join(', ')}`);
                
                const validation = this.marc21Utils.validateRecord(mockMarcRecord);
                console.log(`Kayıt geçerliliği: ${validation.isValid}`);
                if (validation.warnings.length > 0) {
                    console.log(`Uyarılar: ${validation.warnings.join(', ')}`);
                }
            }

            return true;
        } catch (error) {
            console.error('MARC21 dönüştürme testi hatası:', error.message);
            return false;
        }
    }

    /**
     * Türk Ulusal Katalog testini çalıştırır
     */
    async testTurkishNationalService() {
        console.log('\n=== Türk Ulusal Katalog Testi ===');
        try {
            const turkishService = new TurkishNationalService();
            
            // Türkçe arama testi
            console.log('Türkçe arama testi başlatılıyor...');
            const turkishResults = await turkishService.searchTurkishBooks('yapay zeka', {
                searchType: 'title',
                count: 3
            });
            
            console.log(`Türkçe arama başarılı: ${turkishResults.success}`);
            console.log(`Bulunan sonuç: ${turkishResults.results.length}`);
            
            if (turkishResults.results.length > 0) {
                console.log('\nTürk Katalog sonuçları:');
                turkishResults.results.forEach((book, index) => {
                    console.log(`${index + 1}. ${book.title}`);
                    console.log(`   Yazar: ${book.author}`);
                    console.log(`   Yayıncı: ${book.publisher}`);
                    console.log(`   Yıl: ${book.publishYear}`);
                    console.log(`   Dil: ${book.language}`);
                    console.log(`   Kütüphane: ${book.libraryInfo.institution}`);
                    console.log(`   Ülke: ${book.libraryInfo.country}`);
                    console.log(`   Mevcut kopya: ${book.availability.availableCopies}/${book.availability.totalCopies}`);
                    console.log(`   Konum: ${book.availability.location}`);
                    
                    // PDF erişim bilgisi varsa göster
                    if (book.pdfAccess) {
                        console.log(`   PDF erişim: ${book.pdfAccess.hasPDF ? 'Mevcut' : 'Yok'}`);
                        if (book.pdfAccess.hasPDF) {
                            console.log(`   PDF türü: ${book.pdfAccess.accessType}`);
                        }
                    }
                    console.log('');
                });
            }
            
            // Yazar arama testi
            console.log('Yazar arama testi...');
            const authorResults = await turkishService.searchTurkishBooks('Mehmet Özkan', {
                searchType: 'author',
                count: 2
            });
            console.log(`Yazar arama sonuç: ${authorResults.results.length} kitap`);
            
            // Servis durumu kontrolü
            console.log('Servis durumu kontrol ediliyor...');
            const serviceStatus = await turkishService.checkServiceStatus();
            console.log(`Servis durumu: ${serviceStatus.status}`);
            console.log(`Yanıt süresi: ${serviceStatus.responseTime}ms`);
            console.log(`Türkçe karakter desteği: ${serviceStatus.features.turkishCharacterSupport}`);
            console.log(`PDF erişim desteği: ${serviceStatus.features.pdfAccessSupport}`);
            
            // Manager üzerinden test
            console.log('\nManager üzerinden Türk katalog testi...');
            const managerResults = await this.manager.searchInService('turkish_national', 'bilgisayar', {
                searchType: 'title',
                count: 2
            });
            console.log(`Manager arama başarılı: ${managerResults.success}`);
            console.log(`Manager sonuç: ${managerResults.results.length} kitap`);
            
            return turkishResults.success && authorResults.success && serviceStatus.status === 'online';
        } catch (error) {
            console.error('Türk Ulusal Katalog testi hatası:', error.message);
            return false;
        }
    }

    /**
     * Atıf bilgisi testini çalıştırır
     */
    async testCitationTracking() {
        console.log('\n=== Atıf Bilgisi Testi ===');
        try {
            // Test için örnek yayınlar
            const testPublications = [
                {
                    title: 'Machine Learning: A Probabilistic Perspective',
                    author: 'Kevin P. Murphy',
                    publishYear: '2012',
                    publisher: 'MIT Press',
                    subject: ['machine learning', 'artificial intelligence']
                },
                {
                    title: 'Deep Learning',
                    author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
                    publishYear: '2016',
                    publisher: 'MIT Press',
                    subject: ['deep learning', 'neural networks']
                },
                {
                    title: 'Yapay Zeka ve Makine Öğrenmesi',
                    author: 'Prof. Dr. Mehmet Özkan',
                    publishYear: '2020',
                    publisher: 'Türkiye İş Bankası Yayınları',
                    subject: ['yapay zeka', 'makine öğrenmesi']
                }
            ];

            console.log(`${testPublications.length} yayın için atıf bilgisi aranacak...`);
            
            // Tek tek atıf bilgisi test et
            for (const pub of testPublications) {
                console.log(`\n"${pub.title}" için atıf aranyor...`);
                const citationInfo = await this.citationService.generateMockCitationData(pub);
                
                console.log(`Atıf sayısı: ${citationInfo.citationCount}`);
                console.log(`H-Index: ${citationInfo.hIndex}`);
                console.log(`Kaynaklar: ${citationInfo.sources.join(', ')}`);
                console.log(`Son güncelleme: ${citationInfo.lastUpdated}`);
                
                if (citationInfo.details.mock_data) {
                    const details = citationInfo.details.mock_data;
                    console.log(`Etkili atıf: ${details.influentialCitationCount}`);
                    console.log(`Son atıflar: ${details.recentCitations}`);
                    console.log(`Öz atıf: ${details.selfCitations}`);
                    console.log(`Atıf hızı: ${details.citationVelocity}/yıl`);
                }
            }

            // Toplu atıf bilgisi testi
            console.log('\nToplu atıf bilgisi testi...');
            const batchResult = await this.citationService.getCitationInfoBatch(testPublications);
            
            console.log(`Toplu test başarılı: ${batchResult.success}`);
            if (batchResult.success) {
                console.log('\nAtıf İstatistikleri:');
                const stats = batchResult.stats;
                console.log(`Toplam yayın: ${stats.totalPublications}`);
                console.log(`Atıf alan yayın: ${stats.publicationsWithCitations}`);
                console.log(`Ortalama atıf: ${stats.averageCitations}`);
                console.log(`En yüksek atıf: ${stats.maxCitations}`);
                console.log(`Toplam atıf: ${stats.totalCitations}`);
                console.log(`H-Index: ${stats.hIndex}`);
                
                console.log('Atıf dağılımı:');
                Object.entries(stats.citationDistribution).forEach(([range, count]) => {
                    console.log(`  ${range}: ${count} yayın`);
                });
            }

            // Z3950 sonuçlarında atıf bilgisi testi
            console.log('\nZ3950 sonuçlarında atıf bilgisi testi...');
            const searchResults = await this.manager.searchAllServices('artificial intelligence', {
                searchType: 'title',
                count: 3
            });
            
            if (searchResults.success && searchResults.results.length > 0) {
                console.log('Atıf bilgili sonuçlar:');
                searchResults.results.forEach((result, index) => {
                    console.log(`${index + 1}. ${result.title}`);
                    if (result.citationInfo) {
                        console.log(`   Atıf: ${result.citationInfo.citationCount}`);
                        console.log(`   H-Index: ${result.citationInfo.hIndex}`);
                        console.log(`   Kaynak: ${result.citationInfo.sources.join(', ')}`);
                    } else {
                        console.log('   Atıf bilgisi yok');
                    }
                });
            }

            return batchResult.success;
        } catch (error) {
            console.error('Atıf bilgisi testi hatası:', error.message);
            return false;
        }
    }

    /**
     * PDF erişim testini çalıştırır
     */
    async testPDFAccess() {
        console.log('\n=== PDF Erişim Testi ===');
        try {
            // Test için örnek kitap bilgileri
            const testBooks = [
                {
                    title: 'Artificial Intelligence: A Modern Approach',
                    author: 'Stuart Russell, Peter Norvig',
                    publishYear: '2020',
                    subject: ['artificial intelligence', 'machine learning']
                },
                {
                    title: 'Deep Learning',
                    author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
                    publishYear: '2016',
                    subject: ['deep learning', 'neural networks']
                }
            ];

            console.log(`${testBooks.length} kitap için PDF erişim aranacak...`);
            
            const pdfResults = [];
            for (const book of testBooks) {
                console.log(`\n"${book.title}" için PDF aranyor...`);
                const pdfAccess = await this.pdfAccessService.findPDFLinks(book);
                
                console.log(`PDF bulundu: ${pdfAccess.hasPDF}`);
                if (pdfAccess.hasPDF) {
                    console.log(`Erişim türü: ${pdfAccess.accessType}`);
                    console.log(`PDF linkleri: ${pdfAccess.pdfLinks.length}`);
                    console.log(`Kaynaklar: ${pdfAccess.sources.join(', ')}`);
                    
                    // İlk PDF linkini göster
                    if (pdfAccess.pdfLinks.length > 0) {
                        const firstLink = pdfAccess.pdfLinks[0];
                        console.log(`Örnek link: ${firstLink.url}`);
                        console.log(`Kaynak: ${firstLink.source} (${firstLink.type})`);
                    }
                }
                
                pdfResults.push({ book, pdfAccess });
            }

            // PDF istatistiklerini hesapla
            const pdfStats = this.pdfAccessService.getPDFAccessStats(
                pdfResults.map(r => ({ pdfAccess: r.pdfAccess }))
            );
            
            console.log('\nPDF Erişim İstatistikleri:');
            console.log(`Toplam kitap: ${pdfStats.totalBooks}`);
            console.log(`PDF bulunan: ${pdfStats.booksWithPDF}`);
            console.log(`Ücretsiz erişim: ${pdfStats.freeAccess}`);
            console.log(`Abonelik gerekli: ${pdfStats.subscriptionAccess}`);
            console.log(`Erişim oranı: ${pdfStats.accessRate}%`);
            
            if (Object.keys(pdfStats.sources).length > 0) {
                console.log('Kaynak dağılımı:');
                Object.entries(pdfStats.sources).forEach(([source, count]) => {
                    console.log(`  ${source}: ${count}`);
                });
            }

            return pdfResults.length > 0;
        } catch (error) {
            console.error('PDF erişim testi hatası:', error.message);
            return false;
        }
    }

    /**
     * Tüm testleri çalıştırır
     */
    async runAllTests() {
        console.log('Z3950 Servis Testleri Başlatılıyor...\n');
        
        const testResults = {
            basicSearch: false,
            isbnSearch: false,
            authorSearch: false,
            specificService: false,
            worldcatService: false,
            turkishNationalService: false,
            serviceStatus: false,
            marc21Conversion: false,
            citationTracking: false,
            pdfAccess: false
        };

        // Servis durumu kontrolü
        testResults.serviceStatus = await this.testServiceStatus() !== null;

        // Temel arama testi
        testResults.basicSearch = await this.testBasicSearch() !== null;

        // ISBN arama testi
        testResults.isbnSearch = await this.testISBNSearch() !== null;

        // Yazar arama testi
        testResults.authorSearch = await this.testAuthorSearch() !== null;

        // Belirli servis testi
        testResults.specificService = await this.testSpecificServiceSearch() !== null;

        // WorldCat servis testi
        testResults.worldcatService = await this.testWorldCatService();

        // Türk Ulusal Katalog testi
        testResults.turkishNationalService = await this.testTurkishNationalService();

        // MARC21 dönüştürme testi
        testResults.marc21Conversion = await this.testMarc21Conversion();

        // Atıf bilgisi testi
        testResults.citationTracking = await this.testCitationTracking();

        // PDF erişim testi
        testResults.pdfAccess = await this.testPDFAccess();

        // Sonuçları özetle
        console.log('\n=== Test Sonuçları ===');
        Object.keys(testResults).forEach(testName => {
            const status = testResults[testName] ? '✅ BAŞARILI' : '❌ BAŞARISIZ';
            console.log(`${testName}: ${status}`);
        });

        const successCount = Object.values(testResults).filter(result => result).length;
        const totalTests = Object.keys(testResults).length;
        
        console.log(`\nToplam: ${successCount}/${totalTests} test başarılı`);
        
        return testResults;
    }

    /**
     * Manager'ı kapatır
     */
    async cleanup() {
        await this.manager.shutdown();
    }
}

// Test çalıştırma fonksiyonu
async function runTests() {
    const tester = new Z3950Tester();
    
    try {
        await tester.runAllTests();
    } catch (error) {
        console.error('Test çalıştırma hatası:', error);
    } finally {
        await tester.cleanup();
    }
}

// Eğer bu dosya doğrudan çalıştırılıyorsa testleri başlat
if (require.main === module) {
    runTests().then(() => {
        console.log('\nTestler tamamlandı.');
        process.exit(0);
    }).catch(error => {
        console.error('Test hatası:', error);
        process.exit(1);
    });
}

module.exports = Z3950Tester;
