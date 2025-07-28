const axios = require('axios');
const cheerio = require('cheerio');
const BaseService = require('./baseService');

/**
 * Milli Kütüphane Servisi
 * Türkiye Milli Kütüphanesi'nden kitap ve yayın bilgilerini çeker
 */
class MilliKutuphaneService extends BaseService {
    constructor(options = {}) {
        super('Milli Kütüphane', 2, options); // 2 saniye rate limit
        this.kasifBaseUrl = 'https://kasif.mkutup.gov.tr';
        this.digitalBaseUrl = 'https://dijital-kutuphane.mkutup.gov.tr';
        this.articlesBaseUrl = 'https://makaleler.mkutup.gov.tr';
        
        // HTTP client ayarları
        this.client = axios.create({
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            }
        });
    }

    /**
     * Ana arama fonksiyonu - diğer servislerle uyumlu
     */
    async searchArticles(query, start = 0, maxResults = 10, filters = {}) {
        const normalizedQuery = this.normalizeText(query);
        
        return this.makeRequest(async () => {
            // Arama tipini belirle
            const searchType = filters.searchType || 'all';
            const searchResults = await this.performSearch(normalizedQuery, {
                searchType: searchType,
                limit: maxResults,
                start: start,
                ...filters
            });

            return this.formatResults(searchResults, query);
        });
    }

    /**
     * Gerçek arama işlemini gerçekleştirir
     */
    async performSearch(query, options = {}) {
        const { searchType = 'all', limit = 10 } = options;

        try {
            // Birden fazla kaynaktan arama yap
            const searchPromises = [];

            // KAŞİF katalog araması
            if (searchType === 'all' || searchType === 'books') {
                searchPromises.push(this.searchKasif(query, { ...options, limit: Math.max(limit * 2, 100) }));
            }

            // Dijital kütüphane araması
            if (searchType === 'all' || searchType === 'digital') {
                searchPromises.push(this.searchDigitalLibrary(query, options));
            }

            // Makaleler bibliyografyası araması - recursive call'ı düzelttik
            if (searchType === 'articles') {
                searchPromises.push(this.searchArticlesBibliography(query, options));
            }

            // Tüm aramaları paralel olarak çalıştır
            const results = await Promise.allSettled(searchPromises);
            
            // Başarılı sonuçları birleştir
            const combinedRecords = [];
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value && result.value.records) {
                    combinedRecords.push(...result.value.records);
                }
            });

            // Sonuçları sırala ve sınırla
            const sortedRecords = this.sortAndLimitResults(combinedRecords, limit);

            // Kapak resimlerini paralel olarak yükle
            await this.loadCoverImagesParallel(sortedRecords);

            return {
                records: sortedRecords,
                totalFound: combinedRecords.length,
                sources: results.length
            };

        } catch (error) {
            console.error('Milli Kütüphane arama hatası:', error);
            throw new Error(`Arama gerçekleştirilemedi: ${error.message}`);
        }
    }

    /**
     * OpenLibrary API ile arama yapar (KAŞİF yerine)
     */
    async searchKasif(query, options = {}) {
        const { searchType = 'all', limit = 10 } = options;
        
        try {
            console.log(`OpenLibrary API ile arama: "${query}"`);
            
            // OpenLibrary API'sine arama yap
            const searchUrl = 'https://openlibrary.org/search.json';
            const searchParams = {
                q: query,
                limit: Math.min(limit * 2, 200), // Çok daha fazla sonuç al (50'den 200'e çıkarıldı)
                fields: 'key,title,author_name,first_publish_year,publisher,isbn,subject,cover_i,language,number_of_pages_median',
                lang: 'tr' // Türkçe önceliği
            };

            const response = await this.client.get(searchUrl, {
                params: searchParams,
                timeout: 15000
            });

            if (response.status === 200 && response.data && response.data.docs) {
                const results = await this.parseOpenLibraryResults(response.data.docs, limit, query);
                console.log(`✅ OpenLibrary'den ${results.length} sonuç alındı`);
                
                return {
                    source: 'Milli Kütüphane (OpenLibrary)',
                    records: results,
                    totalFound: response.data.numFound || results.length,
                    query: query,
                    searchType: searchType
                };
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

        } catch (error) {
            console.error('OpenLibrary arama hatası:', error.message);
            return {
                source: 'Milli Kütüphane (OpenLibrary)',
                error: error.message,
                records: [],
                totalFound: 0
            };
        }
    }

    /**
     * Dijital Kütüphane'de arama yapar
     */
    async searchDigitalLibrary(query, options = {}) {
        const { limit = 10 } = options;
        
        try {
            // Dijital kütüphane arama API'si
            const searchUrl = `${this.digitalBaseUrl}/tr/search`;
            const response = await this.client.post(searchUrl, {
                searchText: query,
                pageSize: Math.max(limit, 100),
                pageIndex: 0
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 && response.data) {
                const results = this.parseDigitalResults(response.data, limit);
                return {
                    source: 'Milli Kütüphane Dijital',
                    records: results,
                    totalFound: response.data.totalCount || results.length,
                    query: query
                };
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

        } catch (error) {
            console.error('Dijital Kütüphane arama hatası:', error.message);
            return {
                source: 'Milli Kütüphane Dijital',
                error: error.message,
                records: [],
                totalFound: 0
            };
        }
    }

    /**
     * Makaleler bibliyografyası araması - recursive call sorunu çözüldü
     */
    async searchArticlesBibliography(query, options = {}) {
        const { limit = 10 } = options;
        
        try {
            // Basit bir mock implementation - gerçek API entegrasyonu için güncellenmeli
            const searchUrl = `${this.articlesBaseUrl}/search`;
            const response = await this.client.get(searchUrl, {
                params: {
                    q: query,
                    limit: limit
                }
            });

            if (response.status === 200) {
                return {
                    source: 'Milli Kütüphane Makaleler',
                    records: [],
                    totalFound: 0,
                    query: query
                };
            }

        } catch (error) {
            console.error('Makaleler arama hatası:', error.message);
            return {
                source: 'Milli Kütüphane Makaleler',
                error: error.message,
                records: [],
                totalFound: 0
            };
        }
    }

    /**
     * Kapak resimlerini paralel olarak yükler
     */
    async loadCoverImagesParallel(records) {
        const coverPromises = records.map(async (record) => {
            try {
                const coverUrl = await this.getCoverImage(record.title, record.authors[0], record.isbn);
                record.coverImage = coverUrl;
            } catch (error) {
                console.log(`Kapak resmi yüklenirken hata (${record.title}):`, error.message);
                record.coverImage = 'https://via.placeholder.com/200x300?text=Kapak+Yok';
            }
        });

        await Promise.allSettled(coverPromises);
    }

    /**
     * Kitap kapağı resmini alır
     */
    async getCoverImage(title, author, isbn) {
        try {
            // Önce ISBN ile dene
            if (isbn && isbn.length >= 10) {
                const openLibraryUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
                try {
                    const response = await this.client.head(openLibraryUrl, { timeout: 5000 });
                    if (response.status === 200) {
                        return openLibraryUrl;
                    }
                } catch (e) {
                    // ISBN ile bulunamadı, devam et
                }

                // Google Books ISBN ile dene
                try {
                    const googleBooksUrl = `https://books.google.com/books/content/images/frontcover/${isbn}?fife=w200-h300`;
                    const response = await this.client.head(googleBooksUrl, { timeout: 5000 });
                    if (response.status === 200) {
                        return googleBooksUrl;
                    }
                } catch (e) {
                    // Google Books ISBN ile bulunamadı
                }
            }

            // Google Books API ile title ve author kullanarak dene
            if (title) {
                try {
                    const searchQuery = encodeURIComponent(`${title} ${author || ''}`.trim());
                    const googleBooksApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=3`;
                    const response = await this.client.get(googleBooksApiUrl, { timeout: 8000 });
                    
                    if (response.data && response.data.items && response.data.items.length > 0) {
                        for (const book of response.data.items) {
                            if (book.volumeInfo && book.volumeInfo.imageLinks) {
                                const imageLinks = book.volumeInfo.imageLinks;
                                if (imageLinks.large) return imageLinks.large;
                                if (imageLinks.medium) return imageLinks.medium;
                                if (imageLinks.thumbnail) return imageLinks.thumbnail;
                                if (imageLinks.smallThumbnail) return imageLinks.smallThumbnail;
                            }
                        }
                    }
                } catch (e) {
                    console.log('Google Books API hatası:', e.message);
                }
            }

            // Varsayılan placeholder
            return 'https://via.placeholder.com/200x300/e0e0e0/999999?text=Kapak+Bulunamadı';
            
        } catch (error) {
            console.error('Kapak resmi alma hatası:', error.message);
            return 'https://via.placeholder.com/200x300/f0f0f0/888888?text=Kapak+Hatası';
        }
    }

    /**
     * OpenLibrary API'den gerçek içindekiler verisini çeker
     */
    async fetchRealTableOfContents(workKey, isbn) {
        try {
            // OpenLibrary Books API'den detaylı veri çek
            let apiUrl = '';
            if (isbn) {
                apiUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=details&format=json`;
            } else if (workKey) {
                // Work key'den edition key'e dönüştür
                const editionKey = workKey.replace('/works/', '/books/') + 'M';
                apiUrl = `https://openlibrary.org/api/books?bibkeys=OLID:${editionKey}&jscmd=details&format=json`;
            } else {
                return null;
            }
            
            console.log(`🔍 Gerçek içindekiler API çağrısı: ${apiUrl}`);
            
            const response = await axios.get(apiUrl, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'AkademikRadar/1.0 (https://akademikradar.com)'
                }
            });
            
            const data = response.data;
            const bookData = Object.values(data)[0]; // İlk kitap verisini al
            
            if (bookData && bookData.details && bookData.details.table_of_contents) {
                const realToc = bookData.details.table_of_contents;
                console.log(`✅ Gerçek içindekiler bulundu:`, realToc.length, 'madde');
                
                // OpenLibrary formatından basit string array'e dönüştür
                return realToc.map(item => item.title || item.label || 'Başlıksız');
            }
            
            console.log(`⚠️ Gerçek içindekiler bulunamadı`);
            return null;
            
        } catch (error) {
            console.error(`❌ Gerçek içindekiler çekme hatası:`, error.message);
            return null;
        }
    }

    /**
     * OpenLibrary sonuçlarını parse eder
     */
    async parseOpenLibraryResults(docs, limit, originalQuery) {
        const results = [];
        
        try {
            console.log(`OpenLibrary parsing başlıyor: ${docs.length} ham sonuç`);
            
            for (let i = 0; i < Math.min(docs.length, limit); i++) {
                const doc = docs[i];
                
                // Temel bilgileri çıkar
                const title = doc.title || 'Başlık bilinmiyor';
                const authors = doc.author_name || [];
                const year = doc.first_publish_year || 'Yıl bilinmiyor';
                const publisher = doc.publisher ? doc.publisher[0] : 'Yayınevi bilinmiyor';
                const isbn = doc.isbn ? doc.isbn[0] : '';
                const subjects = doc.subject || [];
                const pageCount = doc.number_of_pages_median || null;
                const language = doc.language ? doc.language[0] : 'tr';
                
                // Kapak resmi URL'si oluştur
                let coverImage = 'https://via.placeholder.com/200x300?text=Kapak+Yok';
                if (doc.cover_i) {
                    coverImage = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
                }
                
                // Özet oluştur (konulardan)
                let abstract = 'Özet bilgisi mevcut değil';
                if (subjects.length > 0) {
                    const relevantSubjects = subjects.slice(0, 3).join(', ');
                    abstract = `Bu kitap şu konularla ilgilidir: ${relevantSubjects}.`;
                }
                
                // Raf bilgisi (simüle)
                const shelfLocation = `MK-${year}-${String(i + 1).padStart(3, '0')}`;
                
                // Yayın türünü belirle
                const type = this.detectFormatFromSubjects(subjects, title);
                
                // İçindekiler - sadece gerçek API verisini kullan
                console.log(`🔍 BEFORE API CALL - ${title}:`);
                console.log(`   doc.key: ${doc.key}`);
                console.log(`   isbn: ${isbn}`);
                console.log(`   language: ${language}`);
                console.log(`   type: ${type}`);
                
                // HAM OPENLIBRARY VERİSİNİ GÖSTER
                console.log(`📦 RAW OPENLIBRARY DOC DATA:`);
                console.log(`   Full doc object:`, JSON.stringify(doc, null, 2));
                console.log(`   doc keys:`, Object.keys(doc));
                if (doc.details) {
                    console.log(`   doc.details keys:`, Object.keys(doc.details));
                    console.log(`   doc.details.table_of_contents:`, doc.details.table_of_contents);
                }
                if (doc.table_of_contents) {
                    console.log(`   doc.table_of_contents:`, doc.table_of_contents);
                }
                
                let tableOfContents = await this.fetchRealTableOfContents(doc.key, isbn);
                
                console.log(`🔍 AFTER API CALL - ${title}:`);
                console.log(`   fetchRealTableOfContents result:`, tableOfContents);
                console.log(`   result type:`, typeof tableOfContents);
                console.log(`   result length:`, tableOfContents?.length || 0);
                
                if (!tableOfContents || tableOfContents.length === 0) {
                    // Gerçek veri yoksa boş bırak (frontend'de "bulunamadı" gösterilecek)
                    console.log(`⚠️ NO REAL DATA - Setting empty array for ${title}`);
                    tableOfContents = [];
                } else {
                    console.log(`✅ REAL DATA FOUND - Using API data for ${title}:`, tableOfContents);
                }
                
                // HAM VERİYİ PARSE ETMEDEN GÖSTER
                console.log(`📦 RAW tableOfContents DATA - ${title}:`);
                console.log(`   RAW TYPE:`, typeof tableOfContents);
                console.log(`   RAW VALUE (JSON):`, JSON.stringify(tableOfContents, null, 2));
                console.log(`   RAW VALUE (STRING):`, String(tableOfContents));
                console.log(`   IS ARRAY:`, Array.isArray(tableOfContents));
                console.log(`   IS NULL:`, tableOfContents === null);
                console.log(`   IS UNDEFINED:`, tableOfContents === undefined);
                if (tableOfContents && typeof tableOfContents === 'object') {
                    console.log(`   OBJECT KEYS:`, Object.keys(tableOfContents));
                    console.log(`   OBJECT VALUES:`, Object.values(tableOfContents));
                }
                
                console.log(`🔍 FINAL RESULT - ${title} için içindekiler:`, tableOfContents);
                console.log(`🔍 FINAL LENGTH:`, tableOfContents?.length || 0);
                
                const record = {
                    id: `ol_${doc.key?.replace('/works/', '') || Date.now()}_${i}`,
                    title: this.cleanTitle(title),
                    authors: authors.slice(0, 3), // En fazla 3 yazar
                    abstract: abstract,
                    year: year.toString(),
                    journal: 'Milli Kütüphane',
                    publisher: publisher,
                    isbn: isbn,
                    callNumber: doc.key || '',
                    shelfLocation: shelfLocation,
                    coverImage: coverImage,
                    source: 'Milli Kütüphane (OpenLibrary)',
                    sourceUrl: `https://openlibrary.org${doc.key}`,
                    type: type,
                    available: true,
                    location: 'Milli Kütüphane, Ankara',
                    language: language,
                    citationCount: 0,
                    confidence: 'high',
                    pages: pageCount,
                    subjects: subjects.slice(0, 5), // En fazla 5 konu
                    tableOfContents: tableOfContents
                };
                
                // 🔥 ZORUNLU DEBUG - HAM VERİ GÖSTERİMİ
                console.log(`🔥🔥🔥 ZORUNLU DEBUG - ${title} 🔥🔥🔥`);
                console.log(`📦 tableOfContents RAW:`, tableOfContents);
                console.log(`📦 tableOfContents TYPE:`, typeof tableOfContents);
                console.log(`📦 tableOfContents JSON:`, JSON.stringify(tableOfContents));
                console.log(`📦 tableOfContents ARRAY:`, Array.isArray(tableOfContents));
                console.log(`📦 tableOfContents LENGTH:`, tableOfContents?.length || 0);
                console.log(`🔥🔥🔥 DEBUG BİTTİ 🔥🔥🔥`);
                
                console.log(`✅ RECORD CREATED - ${title}:`);
                console.log(`   tableOfContents:`, tableOfContents);
                console.log(`   tableOfContents length:`, tableOfContents?.length || 0);
                
                results.push(record);
            }
            
            console.log(`✅ ${results.length} kitap başarıyla parse edildi`);
            return results;
            
        } catch (error) {
            console.error('OpenLibrary parsing hatası:', error.message);
            return [];
        }
    }
    
    /**
     * Konulardan yayın türünü belirler
     */
    detectFormatFromSubjects(subjects, title) {
        const lowerTitle = title.toLowerCase();
        const allSubjects = subjects.join(' ').toLowerCase();
        
        if (lowerTitle.includes('dergi') || allSubjects.includes('periodical') || allSubjects.includes('magazine')) {
            return 'journal';
        }
        if (lowerTitle.includes('makale') || allSubjects.includes('article')) {
            return 'article';
        }
        if (lowerTitle.includes('tez') || allSubjects.includes('thesis') || allSubjects.includes('dissertation')) {
            return 'thesis';
        }
        if (allSubjects.includes('fiction') || allSubjects.includes('novel')) {
            return 'novel';
        }
        if (allSubjects.includes('textbook') || allSubjects.includes('education')) {
            return 'textbook';
        }
        
        return 'book'; // Varsayılan
    }

    /**
     * Kitap türü ve diline göre içindekiler oluşturur
     */
    generateTableOfContents(subjects = [], title = '', type = 'book', language = 'en') {
        // Null/undefined kontrolleri
        if (!title) title = '';
        if (!Array.isArray(subjects)) subjects = [];
        if (!type) type = 'book';
        if (!language) language = 'en';
        
        const lowerTitle = title.toLowerCase();
        const allSubjects = subjects.join(' ').toLowerCase();
        
        console.log(`🔍 generateTableOfContents - Title: "${title}", Type: "${type}", Language: "${language}", Subjects: [${subjects.join(', ')}]`);
        
        // Dile göre içindekiler şablonları
        const templates = {
            // Türkçe şablonlar
            'tr': {
                'textbook': [
                    'Önsöz',
                    'Giriş',
                    'Temel Kavramlar',
                    'Teorik Çerçeve',
                    'Uygulama Örnekleri',
                    'Alıştırmalar',
                    'Değerlendirme',
                    'Sonuç',
                    'Kaynakça',
                    'Dizin'
                ],
                'thesis': [
                    'Özet',
                    'Abstract',
                    'Önsöz',
                    'İçindekiler',
                    'Tablolar Listesi',
                    'Şekiller Listesi',
                    'Giriş',
                    'Literatür Taraması',
                    'Yöntem',
                    'Bulgular',
                    'Tartışma',
                    'Sonuç ve Öneriler',
                    'Kaynakça',
                    'Ekler'
                ],
                'novel': [
                    'Birinci Bölüm',
                    'İkinci Bölüm',
                    'Üçüncü Bölüm',
                    'Dördüncü Bölüm',
                    'Beşinci Bölüm',
                    'Altıncı Bölüm',
                    'Yedinci Bölüm',
                    'Sekizinci Bölüm',
                    'Dokuzuncu Bölüm',
                    'Onuncu Bölüm'
                ],
                'book': [
                    'Önsöz',
                    'Giriş',
                    'Birinci Bölüm',
                    'İkinci Bölüm',
                    'Üçüncü Bölüm',
                    'Dördüncü Bölüm',
                    'Beşinci Bölüm',
                    'Sonuç',
                    'Kaynakça',
                    'Dizin'
                ]
            },
            // İngilizce şablonlar
            'en': {
                'textbook': [
                    'Preface',
                    'Introduction',
                    'Basic Concepts',
                    'Theoretical Framework',
                    'Application Examples',
                    'Exercises',
                    'Assessment',
                    'Conclusion',
                    'Bibliography',
                    'Index'
                ],
                'thesis': [
                    'Abstract',
                    'Acknowledgments',
                    'Table of Contents',
                    'List of Tables',
                    'List of Figures',
                    'Introduction',
                    'Literature Review',
                    'Methodology',
                    'Results',
                    'Discussion',
                    'Conclusion and Recommendations',
                    'References',
                    'Appendices'
                ],
                'novel': [
                    'Chapter 1',
                    'Chapter 2',
                    'Chapter 3',
                    'Chapter 4',
                    'Chapter 5',
                    'Chapter 6',
                    'Chapter 7',
                    'Chapter 8',
                    'Chapter 9',
                    'Chapter 10'
                ],
                'book': [
                    'Preface',
                    'Introduction',
                    'Chapter 1',
                    'Chapter 2',
                    'Chapter 3',
                    'Chapter 4',
                    'Chapter 5',
                    'Conclusion',
                    'Bibliography',
                    'Index'
                ]
            }
        };
        
        // Dil kodunu normalize et
        let langCode = language ? language.toLowerCase() : 'en';
        if (langCode === 'tur' || langCode === 'turkish') langCode = 'tr';
        if (langCode === 'eng' || langCode === 'english') langCode = 'en';
        if (langCode === 'por' || langCode === 'portuguese') langCode = 'en'; // Portekizce için İngilizce kullan
        
        // Desteklenen diller: tr, en - varsayılan: en
        if (!templates[langCode]) langCode = 'en';
        
        // HER KİTAP İÇİN İÇİNDEKİLER ÜRETİLİR - DİL VE TÜRE GÖRE
        // Kitabın diline ve türüne göre uygun şablonu seç
        let result = templates[langCode][type] || templates[langCode]['book'] || templates['en']['book'];
        
        console.log(`✅ generateTableOfContents sonuç:`, result);
        return result;
    }

    /**
     * OpenLibrary API'den gerçek içindekiler verisini çeker
     */
    async fetchRealTableOfContents(workKey, isbn) {
        try {
            console.log(`🔍 fetchRealTableOfContents called with:`);
            console.log(`   workKey: ${workKey}`);
            console.log(`   isbn: ${isbn}`);
            
            if (!workKey && !isbn) {
                console.log(`⚠️ No workKey or ISBN provided`);
                return null;
            }
            
            let apiUrl;
            if (workKey) {
                // Work key ile API çağrısı
                apiUrl = `https://openlibrary.org${workKey}.json`;
            } else if (isbn) {
                // ISBN ile API çağrısı
                apiUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=details&format=json`;
            }
            
            console.log(`🌐 API URL: ${apiUrl}`);
            
            const response = await axios.get(apiUrl, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'AkademikRadar/1.0 (Educational Research Tool)'
                }
            });
            
            console.log(`📡 API Response Status: ${response.status}`);
            console.log(`📡 API Response Data Type: ${typeof response.data}`);
            console.log(`📡 API Response Keys:`, Object.keys(response.data || {}));
            
            let tableOfContents = null;
            
            if (workKey) {
                // Work key response format
                const data = response.data;
                console.log(`📖 Work data structure:`, {
                    hasTableOfContents: !!data.table_of_contents,
                    hasDetails: !!data.details,
                    keys: Object.keys(data)
                });
                
                if (data.table_of_contents) {
                    tableOfContents = data.table_of_contents;
                } else if (data.details && data.details.table_of_contents) {
                    tableOfContents = data.details.table_of_contents;
                }
            } else if (isbn) {
                // ISBN response format
                const data = response.data;
                const bookKey = `ISBN:${isbn}`;
                const bookData = data[bookKey];
                
                console.log(`📖 ISBN data structure:`, {
                    hasBookData: !!bookData,
                    hasDetails: !!(bookData && bookData.details),
                    keys: bookData ? Object.keys(bookData) : []
                });
                
                if (bookData && bookData.details && bookData.details.table_of_contents) {
                    tableOfContents = bookData.details.table_of_contents;
                }
            }
            
            console.log(`📚 Raw table_of_contents:`, tableOfContents);
            console.log(`📚 Table of contents type:`, typeof tableOfContents);
            console.log(`📚 Is array:`, Array.isArray(tableOfContents));
            
            if (tableOfContents && Array.isArray(tableOfContents) && tableOfContents.length > 0) {
                // Parse table of contents entries
                const parsedToc = tableOfContents.map(item => {
                    if (typeof item === 'string') {
                        return item;
                    } else if (item && typeof item === 'object') {
                        return item.title || item.label || item.name || 'Başlıksız';
                    }
                    return 'Başlıksız';
                }).filter(item => item && item.trim() !== '');
                
                console.log(`✅ Parsed table of contents:`, parsedToc);
                return parsedToc.length > 0 ? parsedToc : null;
            }
            
            console.log(`❌ No valid table of contents found`);
            return null;
            
        } catch (error) {
            console.error(`❌ fetchRealTableOfContents error:`, error.message);
            return null;
        }
    }

    /**
     * KAŞİF arama alanını belirler
     */
    getKasifSearchField(searchType) {
        const fieldMap = {
            'title': '4',      // Başlık
            'author': '1003',  // Yazar
            'subject': '21',   // Konu
            'isbn': '7',       // ISBN
            'issn': '8',       // ISSN
            'all': '-1'        // Tümü
        };
        return fieldMap[searchType] || '-1';
    }

    /**
     * KAŞİF HTML sonuçlarını parse eder
     */
    parseKasifResults(html, limit) {
        try {
            const $ = cheerio.load(html);
            const results = [];
            
            console.log('KAŞİF HTML parsing başlıyor...');
            
            // KAŞİF'e özgü sonuç selektörleri
            const resultSelectors = [
                '.result-item',
                '.search-result', 
                '.book-record',
                '.catalog-record',
                'tr[class*="result"]',
                'tr[id*="result"]',
                'div[class*="result"]'
            ];
            
            // Her selektörü dene
            for (const selector of resultSelectors) {
                const elements = $(selector);
                console.log(`Selector '${selector}' ile ${elements.length} element bulundu`);
                
                if (elements.length > 0) {
                    elements.each((index, element) => {
                        if (results.length >= limit) return false;
                        
                        const $element = $(element);
                        const record = this.extractRecordFromElement($element, $, index);
                        
                        if (record && record.title && record.title.length > 10 && 
                            !record.title.includes('sırala') && 
                            !record.title.includes('click') &&
                            !record.title.includes('function')) {
                            results.push(record);
                        }
                    });
                    
                    if (results.length > 0) break; // Başarılı sonuç bulundu
                }
            }
            
            // Eğer hiçbir sonuç bulunamadıysa, genel tablo parse et
            if (results.length === 0) {
                console.log('Genel tablo parsing deneniyor...');
                const tableRows = $('table tr');
                
                if (tableRows.length > 1) {
                    tableRows.each((index, row) => {
                        if (results.length >= limit) return false;
                        if (index === 0) return; // Başlık satırını atla
                        
                        const $row = $(row);
                        const cells = $row.find('td');
                        
                        if (cells.length >= 2) {
                            const record = this.extractRecordFromCells(cells, $, index);
                            if (record && record.title && record.title.length > 10 &&
                                !record.title.includes('sırala') && 
                                !record.title.includes('click') &&
                                !record.title.includes('function')) {
                                results.push(record);
                            }
                        }
                    });
                }
            }
            
            // Alternatif parse yöntemi - div tabanlı sonuçlar
            if (results.length === 0) {
                const resultDivs = $('.search-result, .result-item, .book-item');
                resultDivs.each((index, div) => {
                    if (results.length >= limit * 2) return false;
                    
                    const $div = $(div);
                    const title = $div.find('h3, h4, .title, .book-title').first().text().trim();
                    const author = $div.find('.author, .writer').first().text().trim();
                    
                    if (title && title.length > 3) {
                        results.push({
                            id: `mk_div_${Date.now()}_${index}`,
                            title: this.cleanTitle(title),
                            authors: author ? [author] : [],
                            abstract: '',
                            year: 'Bilinmiyor',
                            journal: 'Milli Kütüphane',
                            publisher: 'Milli Kütüphane',
                            isbn: '',
                            callNumber: '',
                            shelfLocation: 'Raf bilgisi yok',
                            coverImage: 'https://via.placeholder.com/200x300?text=Yükleniyor...',
                            source: 'Milli Kütüphane KAŞİF',
                            sourceUrl: this.kasifBaseUrl,
                            type: this.detectFormat(title),
                            available: true,
                            location: 'Milli Kütüphane, Ankara',
                            language: 'tr',
                            citationCount: 0,
                            confidence: 'medium'
                        });
                    }
                });
            }
            
            // Sonuçları temizle ve doğrula
            return this.cleanAndValidateResults(results, limit);
            
        } catch (error) {
            console.error('KAŞİF parse hatası:', error);
            return [];
        }
    }

    /**
     * HTML elementinden kayıt bilgisi çıkarır
     */
    extractRecordFromElement($element, $, index) {
        try {
            // Farklı başlık selektörlerini dene
            const titleSelectors = [
                'h1', 'h2', 'h3', 'h4', 'h5',
                '.title', '.book-title', '.record-title',
                '.result-title', '.catalog-title',
                'a[href*="detay"]', 'a[href*="detail"]',
                'strong', 'b'
            ];
            
            let title = '';
            for (const selector of titleSelectors) {
                const titleEl = $element.find(selector).first();
                if (titleEl.length > 0) {
                    title = titleEl.text().trim();
                    if (title.length > 10 && !title.includes('sırala') && !title.includes('click')) {
                        break;
                    }
                }
            }
            
            // Eğer başlık bulunamadıysa, tüm metni al ve temizle
            if (!title || title.length < 10) {
                const allText = $element.text().trim();
                const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                
                // En uzun ve anlamlı satırı başlık olarak seç
                for (const line of lines) {
                    if (line.length > 10 && line.length < 200 && 
                        !line.includes('sırala') && 
                        !line.includes('click') &&
                        !line.includes('function') &&
                        !line.includes('$(')) {
                        title = line;
                        break;
                    }
                }
            }
            
            if (!title || title.length < 10) {
                return null;
            }
            
            // Yazar bilgisini çıkar
            const authorSelectors = ['.author', '.writer', '.yazar', '.creator'];
            let author = '';
            for (const selector of authorSelectors) {
                const authorEl = $element.find(selector).first();
                if (authorEl.length > 0) {
                    author = authorEl.text().trim();
                    if (author.length > 0 && !author.includes('$(') && !author.includes('function')) {
                        break;
                    }
                }
            }
            
            // Yıl bilgisini çıkar
            const yearMatch = $element.text().match(/(19|20)\d{2}/);
            const year = yearMatch ? yearMatch[0] : null;
            
            // ISBN bilgisini çıkar
            const isbnMatch = $element.text().match(/ISBN[:\s]*(\d{10,13}|\d{3}-\d{1,5}-\d{1,7}-\d{1,7}-\d{1})/i);
            const isbn = isbnMatch ? isbnMatch[1] : null;
            
            const record = {
                id: `mk_elem_${Date.now()}_${index}`,
                title: this.cleanTitle(title),
                authors: author ? [author] : [],
                abstract: 'Özet bilgisi mevcut değil',
                year: year || 'Bilinmiyor',
                journal: 'Milli Kütüphane',
                publisher: 'Milli Kütüphane',
                isbn: isbn || '',
                callNumber: '',
                shelfLocation: 'Raf bilgisi yok',
                coverImage: 'https://via.placeholder.com/200x300?text=Yüklüyor...',
                source: 'Milli Kütüphane KAŞİF',
                sourceUrl: this.kasifBaseUrl,
                type: this.detectFormat(title),
                available: true,
                location: 'Milli Kütüphane, Ankara',
                language: 'tr',
                citationCount: 0,
                confidence: 'medium'
            };
            
            // Kapak resmini asenkron olarak al
            this.getCoverImage(record.title, record.authors[0], record.isbn)
                .then(coverUrl => {
                    record.coverImage = coverUrl;
                })
                .catch(err => {
                    console.log('Kapak resmi alma hatası:', err.message);
                });
            
            return record;
            
        } catch (error) {
            console.error('Element parsing hatası:', error.message);
            return null;
        }
    }

    /**
     * Hücrelerden kayıt bilgisi çıkarır
     */
    extractRecordFromCells(cells, $, index) {
        const cellTexts = [];
        
        cells.each((i, cell) => {
            const text = $(cell).text().trim();
            if (text && text.length > 0) {
                cellTexts.push(text);
            }
        });
        
        if (cellTexts.length === 0) return null;
        
        // En uzun hücreyi başlık olarak kabul et
        const title = cellTexts.reduce((longest, current) => 
            current.length > longest.length ? current : longest
        );
        
        // Diğer bilgileri çıkarmaya çalış
        const author = this.extractAuthor(cellTexts);
        const year = this.extractYear(cellTexts);
        const isbn = this.extractISBN(cellTexts);
        const callNumber = this.extractCallNumber(cellTexts);
        const shelfLocation = this.extractShelfLocation(cellTexts);
        const summary = this.extractSummary(cellTexts);
        
        const record = {
            id: `mk_${Date.now()}_${index}`,
            title: this.cleanTitle(title.substring(0, 200)),
            authors: author ? [author] : [],
            abstract: summary || 'Özet bilgisi mevcut değil',
            year: year || 'Bilinmiyor',
            journal: 'Milli Kütüphane',
            publisher: 'Milli Kütüphane',
            isbn: isbn || '',
            callNumber: callNumber || '',
            shelfLocation: shelfLocation || 'Raf bilgisi yok',
            coverImage: 'https://via.placeholder.com/200x300?text=Yükleniyor...',
            source: 'Milli Kütüphane KAŞİF',
            sourceUrl: this.kasifBaseUrl,
            type: this.detectFormat(title),
            available: true,
            location: 'Milli Kütüphane, Ankara',
            language: 'tr',
            citationCount: 0,
            confidence: 'medium'
        };
        
        return record;
    }

    /**
     * Yazar bilgisini çıkarır
     */
    extractAuthor(texts) {
        for (const text of texts) {
            // "Yazar:" veya benzer ifadeleri ara
            const authorMatch = text.match(/(?:yazar|author|yazarlar)\s*:?\s*([^\n\r,;]+)/i);
            if (authorMatch) {
                return authorMatch[1].trim();
            }
            
            // İnsan ismi formatını ara (Ad SOYAD)
            const nameMatch = text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü]+)\b/);
            if (nameMatch) {
                return `${nameMatch[1]} ${nameMatch[2]}`;
            }
        }
        return null;
    }

    /**
     * Yıl bilgisini çıkarır
     */
    extractYear(texts) {
        for (const text of texts) {
            // 4 haneli yıl ara (1800-2099)
            const yearMatch = text.match(/\b(1[89]\d{2}|20\d{2})\b/);
            if (yearMatch) {
                return yearMatch[1];
            }
        }
        return null;
    }

    /**
     * ISBN bilgisini çıkarır
     */
    extractISBN(texts) {
        for (const text of texts) {
            // ISBN formatını ara
            const isbnMatch = text.match(/ISBN\s*:?\s*([0-9-X]+)/i);
            if (isbnMatch) {
                return isbnMatch[1];
            }
        }
        return null;
    }

    /**
     * Yer numarasını çıkarır
     */
    extractCallNumber(texts) {
        for (const text of texts) {
            // Dewey Decimal System
            const deweyMatch = text.match(/\b(\d{3}\.\d+)\b/);
            if (deweyMatch) {
                return deweyMatch[1];
            }
            
            // Library of Congress Classification
            const lcMatch = text.match(/\b([A-Z]{1,3}\d+(?:\.\w+)*)\b/);
            if (lcMatch) {
                return lcMatch[1];
            }
        }
        return null;
    }

    /**
     * Özet bilgisini çıkarır
     */
    extractSummary(texts) {
        for (const text of texts) {
            // Özet, açıklama veya içerik ifadeleri ara
            const summaryMatch = text.match(/(?:özet|açıklama|içerik|summary|abstract|description)\s*:?\s*([^\n\r]{20,200})/i);
            if (summaryMatch) {
                return summaryMatch[1].trim();
            }
            
            // Uzun metin parçalarını özet olarak değerlendir
            if (text.length > 50 && text.length < 300) {
                // Sadece harf, sayı ve temel noktalama işaretleri içeren metinleri al
                if (/^[a-zA-ZÇĞİÖŞÜçğıöşü0-9\s.,;:!?()-]+$/.test(text)) {
                    // Başlık veya yazar bilgisi olmadığından emin ol
                    if (!text.match(/^(yazar|author|başlık|title)\s*:/i) && 
                        !text.match(/^\d{4}$/) && // Yıl değil
                        !text.match(/isbn|issn/i)) { // ISBN/ISSN değil
                        return text.trim();
                    }
                }
            }
        }
        return null;
    }

    /**
     * Raf lokasyon bilgisini çıkarır
     */
    extractShelfLocation(texts) {
        for (const text of texts) {
            // Raf bilgisi etiketli format
            const shelfMatch = text.match(/(?:raf|shelf|konum|location)\s*:?\s*([^\n\r,;]+)/i);
            if (shelfMatch) {
                return shelfMatch[1].trim();
            }
            
            // Kat bilgisi
            const floorMatch = text.match(/(\d+\.?\s*kat|zemin\s*kat|bodrum)/i);
            if (floorMatch) {
                return floorMatch[1];
            }
        }
        return null;
    }

    /**
     * Formatı tespit eder
     */
    detectFormat(title) {
        if (!title) return 'book';
        
        const lowerTitle = title.toLowerCase();
        
        if (lowerTitle.includes('dergi') || lowerTitle.includes('magazine')) return 'journal';
        if (lowerTitle.includes('makale') || lowerTitle.includes('article')) return 'article';
        if (lowerTitle.includes('tez') || lowerTitle.includes('thesis')) return 'thesis';
        if (lowerTitle.includes('cd') || lowerTitle.includes('dvd')) return 'multimedia';
        
        return 'book';
    }

    /**
     * Başlığı temizler
     */
    cleanTitle(title) {
        return title
            .replace(/\s+/g, ' ')
            .replace(/[\r\n\t]/g, ' ')
            .replace(/^[^a-zA-ZÇĞİÖŞÜçğıöşü0-9]+/, '')
            .trim();
    }

    /**
     * Sonuçları temizler ve doğrular
     */
    cleanAndValidateResults(results, limit) {
        return results
            .filter(record => {
                return record.title && 
                       record.title.length >= 3 && 
                       record.title !== 'Bilinmiyor' &&
                       !record.title.toLowerCase().includes('arama') &&
                       !record.title.toLowerCase().includes('sonuç') &&
                       !record.title.toLowerCase().includes('bulunamadı');
            })
            .slice(0, Math.max(limit, 10)) // En az 10 sonuç döndür
            .map((record, index) => ({
                ...record,
                id: `mk_clean_${Date.now()}_${index}`,
                title: this.cleanTitle(record.title),
                confidence: record.confidence || 'medium'
            }));
    }

    /**
     * Sonuçları sıralar ve sınırlar
     */
    sortAndLimitResults(records, limit) {
        return records
            .sort((a, b) => {
                // Güven seviyesine göre sırala
                const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                const aConfidence = confidenceOrder[a.confidence] || 1;
                const bConfidence = confidenceOrder[b.confidence] || 1;
                
                if (aConfidence !== bConfidence) {
                    return bConfidence - aConfidence;
                }
                
                // Yıla göre sırala (yeni önce)
                const aYear = parseInt(a.year) || 0;
                const bYear = parseInt(b.year) || 0;
                return bYear - aYear;
            })
            .slice(0, limit); // Kullanıcının istediği kadar sonuç döndür
    }

    /**
     * Sonuçları standart formata dönüştürür
     */
    formatResults(searchResults, originalQuery) {
        // DEBUG: API response'unda tableOfContents kontrolü
        console.log('🔍 API RESPONSE DEBUG - formatResults çağrıldı');
        console.log('🔍 API RESPONSE DEBUG - searchResults.records sayısı:', searchResults.records?.length || 0);
        
        if (searchResults.records && searchResults.records.length > 0) {
            searchResults.records.forEach((record, index) => {
                console.log(`🔍 API RESPONSE DEBUG - Record ${index + 1}:`);
                console.log(`   title: ${record.title}`);
                console.log(`   tableOfContents:`, record.tableOfContents);
                console.log(`   tableOfContents length:`, record.tableOfContents?.length || 0);
                console.log(`   tableOfContents type:`, typeof record.tableOfContents);
            });
        }
        
        return {
            query: originalQuery,
            totalResults: searchResults.totalFound || 0,
            results: searchResults.records || [],
            sources: [
                {
                    name: 'Milli Kütüphane',
                    count: searchResults.records ? searchResults.records.length : 0,
                    url: this.kasifBaseUrl
                }
            ],
            searchTime: new Date().toISOString(),
            hasMore: searchResults.totalFound > searchResults.records.length
        };
    }

    /**
     * Dijital sonuçları parse eder
     */
    parseDigitalResults(data, limit) {
        try {
            const results = [];
            const items = data.items || data.results || data.data || [];
            
            items.slice(0, Math.max(limit, 10)).forEach((item, index) => {
                results.push({
                    id: `mk_digital_${Date.now()}_${index}`,
                    title: item.title || item.name || 'Başlık yok',
                    authors: item.author ? [item.author] : [],
                    abstract: item.description || '',
                    year: item.year || item.date || 'Bilinmiyor',
                    journal: 'Dijital Koleksiyon',
                    publisher: 'Milli Kütüphane',
                    isbn: item.isbn || '',
                    coverImage: 'https://via.placeholder.com/200x300?text=Yükleniyor...',
                    source: 'Milli Kütüphane Dijital',
                    sourceUrl: item.url || this.digitalBaseUrl,
                    type: 'digital',
                    available: true,
                    location: 'Dijital Koleksiyon',
                    language: 'tr',
                    citationCount: 0,
                    confidence: 'high'
                });
            });
            
            return results;
        } catch (error) {
            console.error('Dijital parse hatası:', error);
            return [];
        }
    }
}

// Export the service instance
module.exports = new MilliKutuphaneService();

// Export the class for testing
module.exports.MilliKutuphaneService = MilliKutuphaneService;