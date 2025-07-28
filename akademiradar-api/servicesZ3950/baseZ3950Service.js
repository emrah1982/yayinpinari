const axios = require('axios');
const marc4js = require('marc4js');
const winston = require('winston');
const xml2js = require('xml2js');
const PDFAccessService = require('./pdfAccessService');
const CitationService = require('./citationService');

/**
 * Z3950 protokolü için temel servis sınıfı
 * Bu sınıf, farklı kütüphane kataloglarına Z3950 protokolü ile bağlanmak için temel altyapıyı sağlar
 */
class BaseZ3950Service {
    constructor(config, options = {}) {
        this.host = config.host;
        this.port = config.port || 210;
        this.database = config.database;
        this.username = config.username || '';
        this.password = config.password || '';
        this.timeout = config.timeout || 30000;
        this.maxRecords = config.maxRecords || 50;
        
        // PDF erişim servisi
        this.pdfAccessService = new PDFAccessService();
        
        // Citation Service entegrasyonu
        this.citationService = new CitationService();
        this.enableCitationTracking = options.enableCitationTracking !== false; // Varsayılan olarak aktif
        
        // Logger yapılandırması
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/z3950.log' })
            ]
        });
    }

    /**
     * HTTP tabanlı kütüphane API'sine bağlantı kurar
     * @returns {Promise<Object>} HTTP client konfigürasyonu
     */
    async connect() {
        try {
            const httpClient = axios.create({
                baseURL: `http://${this.host}`,
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'AkademikRadar-Z3950-Client/1.0',
                    'Accept': 'application/xml, text/xml, application/json'
                }
            });

            this.logger.info(`HTTP bağlantısı hazır: ${this.host}`);
            return httpClient;
        } catch (error) {
            this.logger.error(`HTTP bağlantı hatası: ${error.message}`);
            throw new Error(`HTTP bağlantısı kurulamadı: ${error.message}`);
        }
    }

    /**
     * HTTP tabanlı arama sorgusu gerçekleştirir
     * @param {string} query - Arama sorgusu
     * @param {Object} options - Arama seçenekleri
     * @returns {Promise<Array>} Arama sonuçları
     */
    async search(query, options = {}) {
        let httpClient = null;
        try {
            httpClient = await this.connect();
            
            const searchParams = this.buildSearchParams(query, options);
            
            this.logger.info(`HTTP arama başlatılıyor: ${query}`);
            const response = await httpClient.get(this.buildSearchUrl(searchParams));
            
            if (response.data) {
                const processedResults = await this.processHttpResponse(response.data, options);
                this.logger.info(`${processedResults.length} kayıt bulundu`);
                return processedResults;
            }
            
            return [];
        } catch (error) {
            this.logger.error(`HTTP arama hatası: ${error.message}`);
            throw new Error(`Arama gerçekleştirilemedi: ${error.message}`);
        }
    }

    /**
     * Arama parametrelerini oluşturur (alt sınıflarda override edilmeli)
     * @param {string} query - Arama sorgusu
     * @param {Object} options - Arama seçenekleri
     * @returns {Object} Arama parametreleri
     */
    buildSearchParams(query, options = {}) {
        return {
            q: query,
            start: options.start || 1,
            count: Math.min(options.count || 10, this.maxRecords),
            format: options.format || 'json'
        };
    }

    /**
     * Arama URL'sini oluşturur (alt sınıflarda override edilmeli)
     * @param {Object} params - Arama parametreleri
     * @returns {string} Arama URL'si
     */
    buildSearchUrl(params) {
        const queryString = new URLSearchParams(params).toString();
        return `/search?${queryString}`;
    }

    /**
     * HTTP yanıtını işler
     * @param {Object} data - HTTP yanıt verisi
     * @param {Object} options - İşleme seçenekleri
     * @returns {Promise<Array>} İşlenmiş kayıtlar
     */
    async processHttpResponse(data, options = {}) {
        try {
            // XML yanıtı JSON'a dönüştür
            if (typeof data === 'string' && data.includes('<?xml')) {
                const parser = new xml2js.Parser({ explicitArray: false });
                data = await parser.parseStringPromise(data);
            }
            
            // Veri yapısına göre kayıtları çıkar
            const records = this.extractRecordsFromResponse(data);
            return await this.processRecords(records);
        } catch (error) {
            this.logger.error(`HTTP yanıt işleme hatası: ${error.message}`);
            return [];
        }
    }

    /**
     * HTTP yanıtından kayıtları çıkarır (alt sınıflarda override edilmeli)
     * @param {Object} data - HTTP yanıt verisi
     * @returns {Array} Ham kayıtlar
     */
    extractRecordsFromResponse(data) {
        // Varsayılan implementasyon - alt sınıflarda override edilmeli
        if (Array.isArray(data)) {
            return data;
        }
        if (data.records && Array.isArray(data.records)) {
            return data.records;
        }
        if (data.items && Array.isArray(data.items)) {
            return data.items;
        }
        return [];
    }

    /**
     * MARC21 kayıtlarını işler ve anlamlı veri yapısına dönüştürür
     * @param {Array} records - Ham MARC21 kayıtları
     * @returns {Promise<Array>} İşlenmiş kayıtlar
     */
    async processRecords(records) {
        const processedRecords = [];
        
        for (const record of records) {
            try {
                const processedRecord = await this.parseMarcRecord(record);
                if (processedRecord) {
                    // PDF erişim bilgilerini ekle
                    processedRecord.pdfAccess = await this.addPDFAccessInfo(processedRecord);
                    
                    // Atıf bilgilerini ekle (eğer aktifse)
                    if (this.enableCitationTracking) {
                        processedRecord.citationInfo = await this.citationService.generateMockCitationData(processedRecord);
                    }
                    
                    processedRecords.push(processedRecord);
                }
            } catch (error) {
                this.logger.warn(`Kayıt işleme hatası: ${error.message}`);
            }
        }
        
        return processedRecords;
    }

    /**
     * Tek bir MARC21 kaydını ayrıştırır
     * @param {Object} marcRecord - Ham MARC21 kaydı
     * @returns {Promise<Object>} İşlenmiş kayıt
     */
    async parseMarcRecord(marcRecord) {
        return new Promise((resolve, reject) => {
            try {
                const transformer = marc4js.transform({
                    fromFormat: 'iso2709',
                    toFormat: 'json'
                });

                let jsonRecord = null;
                transformer.on('data', (record) => {
                    jsonRecord = record;
                });

                transformer.on('end', () => {
                    if (jsonRecord) {
                        const processedRecord = this.extractBookInfo(jsonRecord);
                        resolve(processedRecord);
                    } else {
                        resolve(null);
                    }
                });

                transformer.on('error', (error) => {
                    reject(error);
                });

                transformer.write(marcRecord);
                transformer.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * MARC21 JSON kaydından kitap bilgilerini çıkarır
     * @param {Object} jsonRecord - JSON formatındaki MARC21 kaydı
     * @returns {Object} Kitap bilgileri
     */
    extractBookInfo(jsonRecord) {
        const bookInfo = {
            id: this.extractField(jsonRecord, '001'),
            isbn: this.extractField(jsonRecord, '020', 'a'),
            title: this.extractField(jsonRecord, '245', 'a'),
            subtitle: this.extractField(jsonRecord, '245', 'b'),
            author: this.extractField(jsonRecord, '100', 'a') || this.extractField(jsonRecord, '110', 'a'),
            publisher: this.extractField(jsonRecord, '260', 'b') || this.extractField(jsonRecord, '264', 'b'),
            publishYear: this.extractField(jsonRecord, '260', 'c') || this.extractField(jsonRecord, '264', 'c'),
            language: this.extractField(jsonRecord, '041', 'a'),
            subject: this.extractAllFields(jsonRecord, '650', 'a'),
            description: this.extractField(jsonRecord, '520', 'a'),
            pages: this.extractField(jsonRecord, '300', 'a'),
            series: this.extractField(jsonRecord, '490', 'a'),
            notes: this.extractField(jsonRecord, '500', 'a'),
            libraryInfo: this.extractLibraryInfo(jsonRecord),
            callNumber: this.extractField(jsonRecord, '050', 'a') || this.extractField(jsonRecord, '090', 'a'),
            deweyNumber: this.extractField(jsonRecord, '082', 'a'),
            format: this.determineFormat(jsonRecord),
            availability: this.extractAvailabilityInfo(jsonRecord)
        };

        // Boş alanları temizle
        Object.keys(bookInfo).forEach(key => {
            if (!bookInfo[key] || (Array.isArray(bookInfo[key]) && bookInfo[key].length === 0)) {
                delete bookInfo[key];
            }
        });

        return bookInfo;
    }

    /**
     * Kitap için PDF erişim bilgilerini ekler
     * @param {Object} bookInfo - Kitap bilgileri
     * @returns {Promise<Object>} PDF erişim bilgileri
     */
    async addPDFAccessInfo(bookInfo) {
        try {
            // PDF erişim aramasını asenkron olarak başlat
            const pdfAccessInfo = await this.pdfAccessService.findPDFLinks(bookInfo);
            
            // Ek PDF bilgilerini ekle
            if (pdfAccessInfo.hasPDF) {
                this.logger.info(`PDF bulundu: ${bookInfo.title} - ${pdfAccessInfo.pdfLinks.length} link`);
            }
            
            return pdfAccessInfo;
        } catch (error) {
            this.logger.warn(`PDF erişim bilgisi eklenirken hata: ${error.message}`);
            return {
                hasPDF: false,
                pdfLinks: [],
                accessType: 'none',
                sources: [],
                error: error.message,
                lastChecked: new Date().toISOString()
            };
        }
    }

    /**
     * Kitap sonuçlarına PDF erişim istatistiklerini ekler
     * @param {Array} results - Kitap sonuçları
     * @returns {Object} PDF istatistikleri ile birlikte sonuçlar
     */
    async addPDFStats(results) {
        try {
            const pdfStats = this.pdfAccessService.getPDFAccessStats(results);
            return {
                results: results,
                pdfStats: pdfStats
            };
        } catch (error) {
            this.logger.warn(`PDF istatistikleri eklenirken hata: ${error.message}`);
            return {
                results: results,
                pdfStats: {
                    totalBooks: results.length,
                    booksWithPDF: 0,
                    accessRate: 0,
                    error: error.message
                }
            };
        }
    }

    /**
     * MARC21 kaydından belirli bir alanı çıkarır
     * @param {Object} record - MARC21 JSON kaydı
     * @param {string} tag - Alan etiketi
     * @param {string} subfield - Alt alan kodu (opsiyonel)
     * @returns {string|null} Alan değeri
     */
    extractField(record, tag, subfield = null) {
        if (!record.fields) return null;
        
        const field = record.fields.find(f => f[tag]);
        if (!field || !field[tag]) return null;
        
        if (subfield && field[tag].subfields) {
            const sub = field[tag].subfields.find(s => s[subfield]);
            return sub ? sub[subfield].trim() : null;
        }
        
        return field[tag].trim ? field[tag].trim() : field[tag];
    }

    /**
     * MARC21 kaydından belirli bir alanın tüm değerlerini çıkarır
     * @param {Object} record - MARC21 JSON kaydı
     * @param {string} tag - Alan etiketi
     * @param {string} subfield - Alt alan kodu
     * @returns {Array} Alan değerleri
     */
    extractAllFields(record, tag, subfield) {
        if (!record.fields) return [];
        
        const fields = record.fields.filter(f => f[tag]);
        const values = [];
        
        fields.forEach(field => {
            if (field[tag].subfields) {
                const subs = field[tag].subfields.filter(s => s[subfield]);
                subs.forEach(sub => {
                    if (sub[subfield]) {
                        values.push(sub[subfield].trim());
                    }
                });
            }
        });
        
        return values;
    }

    /**
     * Kütüphane bilgilerini çıkarır
     * @param {Object} record - MARC21 JSON kaydı
     * @returns {Object} Kütüphane bilgileri
     */
    extractLibraryInfo(record) {
        return {
            institution: this.extractField(record, '040', 'a'),
            country: this.extractField(record, '044', 'a'),
            location: this.extractField(record, '852', 'a'),
            collection: this.extractField(record, '852', 'b'),
            shelfLocation: this.extractField(record, '852', 'h')
        };
    }

    /**
     * Erişilebilirlik bilgilerini çıkarır
     * @param {Object} record - MARC21 JSON kaydı
     * @returns {Object} Erişilebilirlik bilgileri
     */
    extractAvailabilityInfo(record) {
        return {
            status: this.extractField(record, '852', 'z'),
            circulation: this.extractField(record, '852', 'n'),
            restrictions: this.extractField(record, '506', 'a')
        };
    }

    /**
     * Kaynak formatını belirler
     * @param {Object} record - MARC21 JSON kaydı
     * @returns {string} Format türü
     */
    determineFormat(record) {
        const leader = record.leader;
        if (!leader) return 'unknown';
        
        const typeOfRecord = leader.charAt(6);
        const bibliographicLevel = leader.charAt(7);
        
        switch (typeOfRecord) {
            case 'a': return 'book';
            case 'c': return 'music_score';
            case 'e': return 'map';
            case 'g': return 'video';
            case 'i': return 'audio';
            case 'j': return 'music_recording';
            case 'm': return 'computer_file';
            case 'p': return 'mixed_material';
            case 't': return 'manuscript';
            default: return 'other';
        }
    }

    /**
     * Asenkron arama işlemi
     * @param {string} query - Arama sorgusu
     * @param {Object} options - Arama seçenekleri
     * @returns {Promise<Object>} Arama sonuçları ve metadata
     */
    async searchAsync(query, options = {}) {
        const startTime = Date.now();
        
        try {
            const results = await this.search(query, options);
            const endTime = Date.now();
            
            return {
                success: true,
                results: results,
                metadata: {
                    query: query,
                    totalResults: results.length,
                    searchTime: endTime - startTime,
                    timestamp: new Date().toISOString(),
                    source: this.host
                }
            };
        } catch (error) {
            const endTime = Date.now();
            
            return {
                success: false,
                error: error.message,
                results: [],
                metadata: {
                    query: query,
                    totalResults: 0,
                    searchTime: endTime - startTime,
                    timestamp: new Date().toISOString(),
                    source: this.host
                }
            };
        }
    }
}

module.exports = BaseZ3950Service;