const marc4js = require('marc4js');
const winston = require('winston');

/**
 * MARC21 formatı ile çalışmak için yardımcı fonksiyonlar
 * Bu modül, MARC21 kayıtlarını işlemek ve dönüştürmek için gerekli araçları sağlar
 */
class Marc21Utils {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/marc21-utils.log' })
            ]
        });
    }

    /**
     * MARC21 kaydını ISO2709 formatından JSON'a dönüştürür
     * @param {Buffer|string} marcData - MARC21 verisi
     * @returns {Promise<Object>} JSON formatındaki MARC21 kaydı
     */
    async convertToJson(marcData) {
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
                    resolve(jsonRecord);
                });

                transformer.on('error', (error) => {
                    reject(error);
                });

                transformer.write(marcData);
                transformer.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * MARC21 JSON kaydını XML formatına dönüştürür
     * @param {Object} jsonRecord - JSON formatındaki MARC21 kaydı
     * @returns {Promise<string>} XML formatındaki MARC21 kaydı
     */
    async convertToXml(jsonRecord) {
        return new Promise((resolve, reject) => {
            try {
                const transformer = marc4js.transform({
                    fromFormat: 'json',
                    toFormat: 'marcxml'
                });

                let xmlData = '';
                
                transformer.on('data', (data) => {
                    xmlData += data;
                });

                transformer.on('end', () => {
                    resolve(xmlData);
                });

                transformer.on('error', (error) => {
                    reject(error);
                });

                transformer.write(jsonRecord);
                transformer.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * MARC21 kaydından Dublin Core formatına dönüştürür
     * @param {Object} jsonRecord - JSON formatındaki MARC21 kaydı
     * @returns {Object} Dublin Core formatındaki metadata
     */
    convertToDublinCore(jsonRecord) {
        try {
            const dublinCore = {
                title: this.extractField(jsonRecord, '245', 'a'),
                creator: this.extractField(jsonRecord, '100', 'a') || this.extractField(jsonRecord, '110', 'a'),
                subject: this.extractAllFields(jsonRecord, '650', 'a'),
                description: this.extractField(jsonRecord, '520', 'a'),
                publisher: this.extractField(jsonRecord, '260', 'b') || this.extractField(jsonRecord, '264', 'b'),
                contributor: this.extractAllFields(jsonRecord, '700', 'a'),
                date: this.extractField(jsonRecord, '260', 'c') || this.extractField(jsonRecord, '264', 'c'),
                type: this.determineResourceType(jsonRecord),
                format: this.extractField(jsonRecord, '300', 'a'),
                identifier: this.extractField(jsonRecord, '020', 'a') || this.extractField(jsonRecord, '022', 'a'),
                source: this.extractField(jsonRecord, '786', 'a'),
                language: this.extractField(jsonRecord, '041', 'a'),
                relation: this.extractAllFields(jsonRecord, '730', 'a'),
                coverage: this.extractField(jsonRecord, '651', 'a'),
                rights: this.extractField(jsonRecord, '506', 'a')
            };

            // Boş alanları temizle
            Object.keys(dublinCore).forEach(key => {
                if (!dublinCore[key] || (Array.isArray(dublinCore[key]) && dublinCore[key].length === 0)) {
                    delete dublinCore[key];
                }
            });

            return dublinCore;
        } catch (error) {
            this.logger.error(`Dublin Core dönüştürme hatası: ${error.message}`);
            return null;
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
     * MARC21 kaydından kaynak türünü belirler
     * @param {Object} record - MARC21 JSON kaydı
     * @returns {string} Kaynak türü
     */
    determineResourceType(record) {
        const leader = record.leader;
        if (!leader) return 'Text';
        
        const typeOfRecord = leader.charAt(6);
        const bibliographicLevel = leader.charAt(7);
        
        switch (typeOfRecord) {
            case 'a': // Language material
                switch (bibliographicLevel) {
                    case 'm': return 'Text'; // Monograph
                    case 's': return 'Text'; // Serial
                    case 'c': return 'Collection'; // Collection
                    default: return 'Text';
                }
            case 'c': return 'NotatedMusic'; // Notated music
            case 'd': return 'NotatedMusic'; // Manuscript notated music
            case 'e': return 'Image'; // Cartographic material
            case 'f': return 'Image'; // Manuscript cartographic material
            case 'g': return 'MovingImage'; // Projected medium
            case 'i': return 'Sound'; // Nonmusical sound recording
            case 'j': return 'Sound'; // Musical sound recording
            case 'k': return 'Image'; // Two-dimensional nonprojectable graphic
            case 'm': return 'Software'; // Computer file
            case 'o': return 'PhysicalObject'; // Kit
            case 'p': return 'PhysicalObject'; // Mixed materials
            case 'r': return 'PhysicalObject'; // Three-dimensional artifact or naturally occurring object
            case 't': return 'Text'; // Manuscript language material
            default: return 'Text';
        }
    }

    /**
     * MARC21 kaydının geçerliliğini kontrol eder
     * @param {Object} record - MARC21 JSON kaydı
     * @returns {Object} Geçerlilik durumu ve hatalar
     */
    validateRecord(record) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        try {
            // Leader kontrolü
            if (!record.leader || record.leader.length !== 24) {
                validation.errors.push('Leader eksik veya geçersiz uzunlukta');
                validation.isValid = false;
            }

            // Zorunlu alanlar kontrolü
            const requiredFields = ['001', '245']; // Control number ve Title
            requiredFields.forEach(fieldTag => {
                const field = record.fields?.find(f => f[fieldTag]);
                if (!field) {
                    validation.errors.push(`Zorunlu alan eksik: ${fieldTag}`);
                    validation.isValid = false;
                }
            });

            // ISBN formatı kontrolü
            const isbnField = record.fields?.find(f => f['020']);
            if (isbnField && isbnField['020'].subfields) {
                const isbn = isbnField['020'].subfields.find(s => s.a);
                if (isbn && isbn.a) {
                    const cleanISBN = isbn.a.replace(/[-\s]/g, '');
                    if (!/^\d{10}(\d{3})?$/.test(cleanISBN)) {
                        validation.warnings.push('ISBN formatı geçersiz görünüyor');
                    }
                }
            }

            // Yayın tarihi kontrolü
            const dateField = this.extractField(record, '260', 'c') || this.extractField(record, '264', 'c');
            if (dateField) {
                const year = parseInt(dateField.replace(/\D/g, ''));
                const currentYear = new Date().getFullYear();
                if (year > currentYear || year < 1000) {
                    validation.warnings.push('Yayın tarihi şüpheli görünüyor');
                }
            }

        } catch (error) {
            validation.errors.push(`Kayıt doğrulama hatası: ${error.message}`);
            validation.isValid = false;
        }

        return validation;
    }

    /**
     * MARC21 kaydından anahtar kelimeler çıkarır
     * @param {Object} record - MARC21 JSON kaydı
     * @returns {Array} Anahtar kelimeler
     */
    extractKeywords(record) {
        const keywords = new Set();

        try {
            // Başlıktan anahtar kelimeler
            const title = this.extractField(record, '245', 'a');
            if (title) {
                const titleWords = title.toLowerCase()
                    .replace(/[^\w\s]/g, ' ')
                    .split(/\s+/)
                    .filter(word => word.length > 3);
                titleWords.forEach(word => keywords.add(word));
            }

            // Konu başlıklarından
            const subjects = this.extractAllFields(record, '650', 'a');
            subjects.forEach(subject => {
                const subjectWords = subject.toLowerCase()
                    .replace(/[^\w\s]/g, ' ')
                    .split(/\s+/)
                    .filter(word => word.length > 3);
                subjectWords.forEach(word => keywords.add(word));
            });

            // Yazar adından
            const author = this.extractField(record, '100', 'a');
            if (author) {
                const authorWords = author.toLowerCase()
                    .replace(/[^\w\s]/g, ' ')
                    .split(/\s+/)
                    .filter(word => word.length > 2);
                authorWords.forEach(word => keywords.add(word));
            }

        } catch (error) {
            this.logger.warn(`Anahtar kelime çıkarma hatası: ${error.message}`);
        }

        return Array.from(keywords);
    }

    /**
     * İki MARC21 kaydını karşılaştırır ve benzerlik skoru hesaplar
     * @param {Object} record1 - İlk MARC21 kaydı
     * @param {Object} record2 - İkinci MARC21 kaydı
     * @returns {number} Benzerlik skoru (0-1 arası)
     */
    calculateSimilarity(record1, record2) {
        try {
            let score = 0;
            let totalChecks = 0;

            // Başlık benzerliği
            const title1 = this.extractField(record1, '245', 'a')?.toLowerCase();
            const title2 = this.extractField(record2, '245', 'a')?.toLowerCase();
            if (title1 && title2) {
                score += title1 === title2 ? 1 : (this.stringSimilarity(title1, title2) * 0.8);
                totalChecks++;
            }

            // Yazar benzerliği
            const author1 = this.extractField(record1, '100', 'a')?.toLowerCase();
            const author2 = this.extractField(record2, '100', 'a')?.toLowerCase();
            if (author1 && author2) {
                score += author1 === author2 ? 1 : (this.stringSimilarity(author1, author2) * 0.6);
                totalChecks++;
            }

            // ISBN benzerliği
            const isbn1 = this.extractField(record1, '020', 'a');
            const isbn2 = this.extractField(record2, '020', 'a');
            if (isbn1 && isbn2) {
                score += isbn1 === isbn2 ? 1 : 0;
                totalChecks++;
            }

            // Yayın yılı benzerliği
            const year1 = this.extractField(record1, '260', 'c') || this.extractField(record1, '264', 'c');
            const year2 = this.extractField(record2, '260', 'c') || this.extractField(record2, '264', 'c');
            if (year1 && year2) {
                const y1 = parseInt(year1.replace(/\D/g, ''));
                const y2 = parseInt(year2.replace(/\D/g, ''));
                score += Math.abs(y1 - y2) <= 1 ? 1 : 0;
                totalChecks++;
            }

            return totalChecks > 0 ? score / totalChecks : 0;

        } catch (error) {
            this.logger.error(`Benzerlik hesaplama hatası: ${error.message}`);
            return 0;
        }
    }

    /**
     * İki string arasındaki benzerliği hesaplar (Levenshtein distance kullanarak)
     * @param {string} str1 - İlk string
     * @param {string} str2 - İkinci string
     * @returns {number} Benzerlik skoru (0-1 arası)
     */
    stringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    /**
     * Levenshtein distance hesaplar
     * @param {string} str1 - İlk string
     * @param {string} str2 - İkinci string
     * @returns {number} Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
}

module.exports = Marc21Utils;
