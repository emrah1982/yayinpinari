const express = require('express');
const Z3950Manager = require('../servicesZ3950/z3950Manager');
const WorldCatService = require('../servicesZ3950/worldcatService');
const TurkishNationalService = require('../servicesZ3950/turkishNationalService');
const LOCService = require('../servicesZ3950/locService');
const LibraryFindService = require('../services/libraryFindService');

const router = express.Router();

// Servisleri başlat
const libraryFindService = LibraryFindService.getInstance();

// Z3950 servislerini başlat
const z3950Manager = new Z3950Manager();
const worldcatService = new WorldCatService();
const turkishService = new TurkishNationalService();
const locService = new LOCService();

/**
 * Yayın hangi kütüphanelerde bulunuyor - Ana arama endpoint'i
 * POST /api/library-search/find-publication
 */
router.post('/find-publication', async (req, res) => {
    try {
        const { 
            title, 
            author, 
            isbn, 
            year, 
            searchType = 'comprehensive' 
        } = req.body;

        if (!title && !author && !isbn) {
            return res.status(400).json({
                success: false,
                error: 'En az bir arama kriteri gerekli (başlık, yazar veya ISBN)'
            });
        }

        console.log(`[LibrarySearch] Kütüphane arama başlatılıyor:`, { title, author, isbn, year });

        // Paralel arama yapılacak servisler
        const searchPromises = [];

        // Her servis için asenkron arama fonksiyonu
        const searchInService = async (service, searchParams, serviceName) => {
            return new Promise(async (resolve) => {
                // 10 saniye timeout
                const timeoutId = setTimeout(() => {
                    console.warn(`[LibrarySearch] ${serviceName} timeout`);
                    resolve({ success: false, libraries: [], error: 'Timeout' });
                }, 10000);
                
                try {
                    console.log(`[LibrarySearch] ${serviceName} servisinde arama yapılıyor...`);
                    
                    // Servis bağlantısını kur
                    if (typeof service.connect === 'function') {
                        await service.connect();
                    }
                    
                    let searchResults = [];
                    console.log(`[LibrarySearch] ${serviceName} - Arama parametreleri:`, searchParams);
                    
                    // Arama parametrelerine göre uygun method'u çağır
                    if (searchParams.isbn && searchParams.isbn.trim()) {
                        if (typeof service.searchBooks === 'function') {
                            console.log(`[LibrarySearch] ${serviceName} - ISBN ile arama: ${searchParams.isbn.trim()}`);
                            const result = await service.searchBooks(searchParams.isbn.trim(), { searchType: 'isbn', count: 100 });
                            console.log(`[LibrarySearch] ${serviceName} - ISBN sonuç:`, result);
                            searchResults = result?.results || result?.books || result || [];
                        }
                    } else if (searchParams.title && searchParams.title.trim()) {
                        if (typeof service.searchBooks === 'function') {
                            console.log(`[LibrarySearch] ${serviceName} - Başlık ile arama: ${searchParams.title.trim()}`);
                            const result = await service.searchBooks(searchParams.title.trim(), { searchType: 'title', count: 100 });
                            console.log(`[LibrarySearch] ${serviceName} - Başlık sonuç:`, JSON.stringify(result, null, 2));
                            searchResults = result?.results || result?.books || result || [];
                        }
                    } else if (searchParams.author && searchParams.author.trim()) {
                        if (typeof service.searchBooks === 'function') {
                            console.log(`[LibrarySearch] ${serviceName} - Yazar ile arama: ${searchParams.author.trim()}`);
                            const result = await service.searchBooks(searchParams.author.trim(), { searchType: 'author', count: 100 });
                            console.log(`[LibrarySearch] ${serviceName} - Yazar sonuç:`, result);
                            searchResults = result?.results || result?.books || result || [];
                        }
                    }
                    
                    // Sonuçları kütüphane formatına dönüştür
                    const libraries = [];
                    const resultsArray = Array.isArray(searchResults) ? searchResults : [];
                    
                    console.log(`[LibrarySearch] ${serviceName} - Dönüştürülecek sonuç sayısı:`, resultsArray.length);
                    
                    resultsArray.forEach((record, index) => {
                        try {
                            console.log(`[LibrarySearch] ${serviceName} - Record ${index}:`, record);
                            
                            // Veri zaten doğru formatta geliyorsa dogrudan kullan
                            if (record.libraryName && record.country) {
                                libraries.push({
                                    libraryName: record.libraryName,
                                    country: record.country,
                                    city: record.city,
                                    institution: record.institution,
                                    callNumber: record.callNumber || '',
                                    format: record.format || 'book',
                                    availability: record.availability || 'available',
                                    url: record.url || '',
                                    catalogUrl: record.catalogUrl || record.url || '',
                                    serviceName: record.serviceName || serviceName,
                                    title: record.title || '',
                                    author: record.author || '',
                                    isbn: record.isbn || '',
                                    year: record.year || ''
                                });
                            } else {
                                // Eski format için fallback
                                const availableLibraries = record.libraryInfo?.availableLibraries || [serviceName];
                                
                                availableLibraries.forEach(libraryName => {
                                    libraries.push({
                                        libraryName: libraryName || serviceName,
                                        country: record.libraryInfo?.country || record.source?.country || getServiceCountry(serviceName),
                                        city: record.libraryInfo?.city || record.source?.city || getServiceCity(serviceName),
                                        institution: record.libraryInfo?.institution || record.source?.institution || serviceName,
                                        callNumber: record.callNumber || record.classification || '',
                                        format: record.format || record.materialType || 'book',
                                        availability: record.availability?.status || record.availability || 'available',
                                        url: record.source?.url || record.libraryInfo?.url || '',
                                        catalogUrl: record.catalogUrl || record.worldcatUrl || '',
                                        serviceName: serviceName,
                                        title: record.title || '',
                                        author: record.author || (Array.isArray(record.authors) ? record.authors.join(', ') : ''),
                                        isbn: record.isbn || '',
                                        year: record.year || record.publishYear || record.publicationYear || ''
                                    });
                                });
                            }
                        } catch (recordError) {
                            console.warn(`[LibrarySearch] Kayıt işleme hatası (${serviceName}):`, recordError.message);
                        }
                    });
                    
                    console.log(`[LibrarySearch] ${serviceName} - Dönüştürülen kütüphane sayısı:`, libraries.length);
                    
                    clearTimeout(timeoutId);
                    resolve({ success: true, libraries, serviceName });
                    
                } catch (error) {
                    clearTimeout(timeoutId);
                    console.error(`[LibrarySearch] ${serviceName} hata:`, error.message);
                    resolve({ success: false, libraries: [], error: error.message });
                }
            });
        };

        // WorldCat arama (Global)
        if (worldcatService) {
            searchPromises.push(
                searchInService(worldcatService, { title, author, isbn, year }, 'WorldCat (Global)')
            );
        }

        // Türkiye Milli Kütüphanesi
        if (turkishService) {
            searchPromises.push(
                searchInService(turkishService, { title, author, isbn, year }, 'Türkiye Milli Kütüphanesi')
            );
        }

        // Library of Congress
        if (locService) {
            searchPromises.push(
                searchInService(locService, { title, author, isbn, year }, 'Library of Congress')
            );
        }

        // Tüm aramaları paralel çalıştır
        const results = await Promise.allSettled(searchPromises);
        
        // Sonuçları işle
        const libraryResults = [];
        const errors = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                libraryResults.push(...result.value.libraries);
            } else {
                errors.push({
                    service: getServiceName(index),
                    error: result.reason?.message || 'Bilinmeyen hata'
                });
            }
        });

        // Gerçek Z3950 API verilerini kullan - mock veri yok

        // Sonuçları grupla ve sırala
        const groupedResults = groupLibrariesByCountry(libraryResults);
        const statistics = calculateStatistics(libraryResults);

        res.json({
            success: true,
            searchQuery: { title, author, isbn, year },
            totalLibrariesFound: libraryResults.length,
            librariesByCountry: groupedResults,
            statistics,
            availableFormats: extractFormats(libraryResults),
            searchTimestamp: new Date().toISOString(),
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('[LibrarySearch] Arama hatası:', error.message);
        res.status(500).json({
            success: false,
            error: 'Kütüphane arama işlemi başarısız',
            message: error.message
        });
    }
});

/**
 * Servis durumu kontrol et
 * GET /api/library-search/status
 */

/**
 * Kütüphaneleri ülkeye göre grupla
 */
function groupLibrariesByCountry(libraries) {
    const grouped = {};
    
    libraries.forEach(lib => {
        const country = lib.country || 'Bilinmeyen';
        if (!grouped[country]) {
            grouped[country] = [];
        }
        grouped[country].push(lib);
    });

    return grouped;
}

/**
 * İstatistikleri hesapla
 */
function calculateStatistics(libraries) {
    const stats = {
        totalLibraries: libraries.length,
        countriesCount: new Set(libraries.map(lib => lib.country)).size,
        formatsCount: new Set(libraries.map(lib => lib.format)).size,
        availableCount: libraries.filter(lib => lib.availability === 'Mevcut').length
    };

    stats.availabilityRate = stats.totalLibraries > 0 
        ? Math.round((stats.availableCount / stats.totalLibraries) * 100) 
        : 0;

    return stats;
}

/**
 * Mevcut formatları çıkar
 */
function extractFormats(libraries) {
    const formats = new Set(libraries.map(lib => lib.format));
    return Array.from(formats);
}

/**
 * Servis adından ülke bilgisi al
 */
function getServiceCountry(serviceName) {
    const countryMap = {
        'WorldCat (Global)': 'Global',
        'Türkiye Milli Kütüphanesi': 'Türkiye',
        'Library of Congress': 'ABD'
    };
    return countryMap[serviceName] || 'Bilinmeyen';
}

/**
 * Servis adından şehir bilgisi al
 */
function getServiceCity(serviceName) {
    const cityMap = {
        'WorldCat (Global)': 'Worldwide',
        'Türkiye Milli Kütüphanesi': 'Ankara',
        'Library of Congress': 'Washington DC'
    };
    return cityMap[serviceName] || 'Bilinmeyen';
}

/**
 * Index'ten servis adı al
 */
function getServiceName(index) {
    const services = ['WorldCat (Global)', 'Türkiye Milli Kütüphanesi', 'Library of Congress'];
    return services[index] || 'Bilinmeyen Servis';
}

/**
 * Kütüphane servisleri durumunu kontrol et
 * GET /api/library-search/status
 */
router.get('/status', async (req, res) => {
    try {
        const services = [
            { name: 'WorldCat', service: worldcatService },
            { name: 'Türkiye Milli Kütüphanesi', service: turkishService },
            { name: 'Library of Congress', service: locService }
        ];

        const statusChecks = services.map(async ({ name, service }) => {
            try {
                await service.connect();
                return { name, status: 'active', message: 'Bağlantı başarılı' };
            } catch (error) {
                return { name, status: 'error', message: error.message };
            }
        });

        const results = await Promise.allSettled(statusChecks);
        const serviceStatus = results.map(result => 
            result.status === 'fulfilled' ? result.value : { status: 'error' }
        );

        res.json({
            success: true,
            services: serviceStatus,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Servis durumu kontrol edilemedi',
            message: error.message
        });
    }
});

/**
 * Popüler kütüphaneleri listele
 * GET /api/library-search/popular-libraries
 */
router.get('/popular-libraries', async (req, res) => {
    try {
        const popularLibraries = [
            {
                name: 'WorldCat (OCLC)',
                country: 'Global',
                description: 'Dünya çapında 17,000+ kütüphaneden 2 milyar+ kayıt',
                coverage: 'Global',
                languages: ['Tüm diller'],
                specialties: ['Genel koleksiyon', 'Akademik kaynaklar']
            },
            {
                name: 'Türkiye Milli Kütüphanesi',
                country: 'Türkiye',
                description: 'Türkiye\'nin en kapsamlı kütüphane katalogu',
                coverage: 'Türkiye',
                languages: ['Türkçe', 'İngilizce', 'Arapça'],
                specialties: ['Türk edebiyatı', 'Tarih', 'Akademik yayınlar']
            },
            {
                name: 'Library of Congress',
                country: 'ABD',
                description: 'Dünyanın en büyük kütüphane koleksiyonu',
                coverage: 'ABD ve Uluslararası',
                languages: ['İngilizce', '470+ dil'],
                specialties: ['Araştırma kaynakları', 'Nadir kitaplar', 'Dijital koleksiyonlar']
            }
        ];

        res.json({
            success: true,
            libraries: popularLibraries,
            totalCount: popularLibraries.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Popüler kütüphaneler listelenemedi',
            message: error.message
        });
    }
});

/**
 * Mock kütüphane sonuçları oluştur (test amaçlı)
 */
function generateMockLibraryResults(searchTerm) {
    return [
        {
            libraryName: 'Harvard University Library',
            country: 'ABD',
            city: 'Cambridge',
            institution: 'Harvard University',
            callNumber: 'QA76.73.P98 H56 2023',
            format: 'Kitap',
            availability: 'Mevcut',
            url: 'https://library.harvard.edu',
            catalogUrl: 'https://hollis.harvard.edu',
            serviceName: 'WorldCat (Global)',
            title: `${searchTerm} - Advanced Studies`,
            author: 'Academic Author',
            isbn: '978-0123456789',
            year: '2023'
        },
        {
            libraryName: 'Türkiye Milli Kütüphanesi',
            country: 'Türkiye',
            city: 'Ankara',
            institution: 'Kültür ve Turizm Bakanlığı',
            callNumber: 'T.K. 2023/1234',
            format: 'E-Kitap',
            availability: 'Mevcut',
            url: 'https://www.mkutup.gov.tr',
            catalogUrl: 'https://katalog.mkutup.gov.tr',
            serviceName: 'Türkiye Milli Kütüphanesi',
            title: `${searchTerm} Üzerine Araştırmalar`,
            author: 'Türk Akademisyen',
            isbn: '978-9876543210',
            year: '2022'
        },
        {
            libraryName: 'Library of Congress',
            country: 'ABD',
            city: 'Washington DC',
            institution: 'U.S. Congress',
            callNumber: 'Z695.1.A3 L52 2023',
            format: 'Dijital Koleksiyon',
            availability: 'Mevcut',
            url: 'https://www.loc.gov',
            catalogUrl: 'https://catalog.loc.gov',
            serviceName: 'Library of Congress',
            title: `${searchTerm}: A Comprehensive Guide`,
            author: 'Research Team',
            isbn: '978-1234567890',
            year: '2023'
        },
        {
            libraryName: 'British Library',
            country: 'İngiltere',
            city: 'London',
            institution: 'British Library',
            callNumber: 'BL.2023.456',
            format: 'Kitap',
            availability: 'Mevcut',
            url: 'https://www.bl.uk',
            catalogUrl: 'https://explore.bl.uk',
            serviceName: 'WorldCat (Global)',
            title: `${searchTerm} in Modern Context`,
            author: 'British Scholar',
            isbn: '978-5432109876',
            year: '2022'
        },
        {
            libraryName: 'İstanbul Üniversitesi Kütüphanesi',
            country: 'Türkiye',
            city: 'İstanbul',
            institution: 'İstanbul Üniversitesi',
            callNumber: 'İÜ.2023.789',
            format: 'Tez',
            availability: 'Mevcut',
            url: 'https://kutuphane.istanbul.edu.tr',
            catalogUrl: 'https://katalog.istanbul.edu.tr',
            serviceName: 'Türkiye Milli Kütüphanesi',
            title: `${searchTerm} Konusunda Doktora Tezi`,
            author: 'Doktora Öğrencisi',
            isbn: '',
            year: '2023'
        }
    ];
}

/**
 * Kütüphane arama servisi ile kitap arama
 * GET /api/library-search/search-books
 */
router.get('/search-books', async (req, res) => {
    try {
        const { query, author } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Arama sorgusu gerekli (query parametresi)'
            });
        }

        console.log(`[LibrarySearch] Kitap araması başlatılıyor - Tüm sonuçlar:`, { query, author });

        const searchParams = {
            query,
            author
            // limit ve page parametreleri kaldırıldı - tüm sonuçlar döndürülüyor
        };

        const results = await libraryFindService.searchBooks(searchParams);
        
        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('[LibrarySearch] Kitap arama hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Kitap aranırken bir hata oluştu',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Kitap arama - POST endpoint (Frontend uyumluluğu için)
 * POST /api/library-search
 */
router.post('/', async (req, res) => {
    try {
        const { query, author, searchType } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Arama sorgusu gerekli (query parametresi)'
            });
        }

        console.log(`[LibrarySearch] POST Kitap araması başlatılıyor - Tüm sonuçlar:`, { query, author, searchType });

        const searchParams = {
            query,
            author
            // limit ve page parametreleri yok - tüm sonuçlar döndürülüyor
        };

        const results = await libraryFindService.searchBooks(searchParams);
        
        res.json({
            success: results.success,
            totalResults: results.totalResults,
            results: results.results,
            searchTime: results.searchTime,
            sources: results.sources,
            message: results.message,
            error: results.error
        });

    } catch (error) {
        console.error('[LibrarySearch] POST Kitap arama hatası:', error);
        res.status(500).json({
            success: false,
            totalResults: 0,
            results: [],
            error: 'Kitap aranırken bir hata oluştu',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
