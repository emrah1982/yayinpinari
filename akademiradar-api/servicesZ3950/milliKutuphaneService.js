const BaseZ3950Service = require('./baseZ3950Service');

/**
 * Türkiye Milli Kütüphane Z3950 Servisi
 * z3950.mkutup.gov.tr adresine erişim sağlar
 */
class MilliKutuphaneService extends BaseZ3950Service {
    constructor(options = {}) {
        super({
            serviceName: 'Türkiye Milli Kütüphane',
            host: 'z3950.mkutup.gov.tr',
            port: options.port || 2100,
            database: options.database || 'default',
            timeout: options.timeout || 30000,
            maxRecords: options.maxRecords || 50,
            ...options
        });

        // Milli Kütüphane'ye özel bilgiler
        this.country = 'Türkiye';
        this.city = 'Ankara';
        this.institution = 'Türkiye Milli Kütüphanesi';
        this.catalogType = 'Milli Kütüphane Kataloğu';
        this.language = 'tr';
        
        // Desteklenen arama türleri
        this.supportedSearchTypes = [
            'title', 'author', 'subject', 'isbn', 'issn', 
            'publisher', 'year', 'keyword', 'callnumber', 'barcode'
        ];

        // Milli Kütüphane'ye özel arama alanları
        this.searchFields = {
            title: '@attr 1=4',           // Başlık
            author: '@attr 1=1003',       // Yazar
            subject: '@attr 1=21',        // Konu
            isbn: '@attr 1=7',            // ISBN
            issn: '@attr 1=8',            // ISSN
            publisher: '@attr 1=1018',    // Yayıncı
            year: '@attr 1=31',           // Yayın yılı
            keyword: '@attr 1=1016',      // Anahtar kelime
            callnumber: '@attr 1=20',     // Yer numarası
            barcode: '@attr 1=1007'       // Barkod numarası
        };
    }

    /**
     * Arama parametrelerini oluşturur
     */
    buildSearchParams(query, options = {}) {
        const searchType = options.searchType || 'title';
        const searchField = this.searchFields[searchType] || this.searchFields.title;
        
        return {
            query: `${searchField} ${this.escapeQuery(query)}`,
            start: options.start || 1,
            limit: options.limit || this.maxRecords,
            format: 'json',
            ...options
        };
    }

    /**
     * Arama sonuçlarını işler ve standart formata dönüştürür
     */
    async processSearchResults(results) {
        if (!results || !Array.isArray(results.records)) {
            return [];
        }

        return results.records.map(record => ({
            id: record.id || '',
            title: record.title || 'Başlık yok',
            author: record.author || 'Yazar yok',
            publisher: record.publisher || 'Yayıncı yok',
            year: record.year || 'Tarih yok',
            isbn: record.isbn || '',
            issn: record.issn || '',
            callNumber: record.callNumber || '',
            location: record.location || 'Milli Kütüphane, Ankara',
            source: this.serviceName,
            rawData: record,
            available: true,
            format: this.detectFormat(record)
        }));
    }

    /**
     * Kaydın formatını belirler
     */
    detectFormat(record) {
        if (record.isbn) return 'Kitap';
        if (record.issn) return 'Dergi';
        return 'Diğer';
    }

    /**
     * Detaylı kayıt bilgisi getirir
     */
    async getRecordDetails(recordId) {
        try {
            const response = await this.search({ query: `@attr 1=12 ${recordId}`, limit: 1 });
            if (response.records && response.records.length > 0) {
                return this.enrichRecord(response.records[0]);
            }
            return null;
        } catch (error) {
            this.logger.error(`Kayıt detayı alınırken hata: ${error.message}`, { recordId });
            throw error;
        }
    }

    /**
     * Kaydı zenginleştirir (ek bilgiler ekler)
     */
    async enrichRecord(record) {
        if (!record) return null;

        // Eğer atıf takibi aktifse, atıf bilgilerini ekle
        if (this.enableCitationTracking) {
            try {
                const citationData = await this.citationService.getCitationInfo({
                    title: record.title,
                    author: record.author,
                    year: record.year,
                    isbn: record.isbn,
                    issn: record.issn
                });
                record.citationInfo = citationData;
            } catch (error) {
                this.logger.warn('Atıf bilgisi alınamadı', { error: error.message });
            }
        }

        return record;
    }

    /**
     * Sorgu ifadesini temizler ve güvenli hale getirir
     */
    escapeQuery(query) {
        if (!query) return '';
        return query
            .replace(/[\\\/\[\]{}()*?~!"^$]/g, '\\$&')
            .trim();
    }
}

module.exports = MilliKutuphaneService;
