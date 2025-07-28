const LOCService = require('./locService');
const WorldCatService = require('./worldcatService');
const TurkishNationalService = require('./turkishNationalService');
const winston = require('winston');

/**
 * Z3950 servislerini yöneten ana sınıf
 * Bu sınıf, farklı kütüphane kataloglarına asenkron istekler gönderir ve sonuçları birleştirir
 */
class Z3950Manager {
    constructor() {
        this.services = new Map();
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/z3950-manager.log' })
            ]
        });

        // Varsayılan servisleri kaydet
        this.registerService('loc', new LOCService());
        this.registerService('worldcat', new WorldCatService());
        this.registerService('turkish_national', new TurkishNationalService());
        
        this.logger.info('Z3950Manager başlatıldı');
    }

    /**
     * Yeni bir Z3950 servisi kaydeder
     * @param {string} name - Servis adı
     * @param {BaseZ3950Service} service - Servis instance'ı
     */
    registerService(name, service) {
        this.services.set(name, service);
        this.logger.info(`Servis kaydedildi: ${name}`);
    }

    /**
     * Kayıtlı bir servisi kaldırır
     * @param {string} name - Servis adı
     */
    unregisterService(name) {
        if (this.services.has(name)) {
            this.services.delete(name);
            this.logger.info(`Servis kaldırıldı: ${name}`);
        }
    }

    /**
     * Tüm kayıtlı servisleri listeler
     * @returns {Array} Servis listesi
     */
    getRegisteredServices() {
        return Array.from(this.services.keys());
    }

    /**
     * Belirli bir serviste arama yapar
     * @param {string} serviceName - Servis adı
     * @param {string} searchTerm - Arama terimi
     * @param {Object} options - Arama seçenekleri
     * @returns {Promise<Object>} Arama sonuçları
     */
    async searchInService(serviceName, searchTerm, options = {}) {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Servis bulunamadı: ${serviceName}`);
        }

        try {
            this.logger.info(`${serviceName} servisinde arama: ${searchTerm}`);
            const results = await service.searchBooks(searchTerm, options);
            
            // Sonuçlara servis bilgisini ekle
            if (results.success) {
                results.metadata.serviceName = serviceName;
            }
            
            return results;
        } catch (error) {
            this.logger.error(`${serviceName} servisinde arama hatası: ${error.message}`);
            return {
                success: false,
                error: error.message,
                results: [],
                metadata: {
                    serviceName: serviceName,
                    query: searchTerm,
                    totalResults: 0,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    /**
     * Tüm kayıtlı servislerde asenkron arama yapar
     * @param {string} searchTerm - Arama terimi
     * @param {Object} options - Arama seçenekleri
     * @returns {Promise<Object>} Birleştirilmiş arama sonuçları
     */
    async searchAllServices(searchTerm, options = {}) {
        const startTime = Date.now();
        const serviceNames = Array.from(this.services.keys());
        
        if (serviceNames.length === 0) {
            return {
                success: false,
                error: 'Kayıtlı servis bulunamadı',
                results: [],
                metadata: {
                    query: searchTerm,
                    totalResults: 0,
                    searchTime: 0,
                    timestamp: new Date().toISOString(),
                    services: []
                }
            };
        }

        this.logger.info(`Tüm servislerde arama başlatılıyor: ${searchTerm}`);

        // Tüm servislerde paralel arama yap
        const searchPromises = serviceNames.map(serviceName => 
            this.searchInService(serviceName, searchTerm, options)
                .catch(error => ({
                    success: false,
                    error: error.message,
                    results: [],
                    metadata: {
                        serviceName: serviceName,
                        query: searchTerm,
                        totalResults: 0,
                        timestamp: new Date().toISOString()
                    }
                }))
        );

        try {
            const allResults = await Promise.allSettled(searchPromises);
            const endTime = Date.now();

            // Sonuçları birleştir
            const combinedResults = {
                success: true,
                results: [],
                metadata: {
                    query: searchTerm,
                    totalResults: 0,
                    searchTime: endTime - startTime,
                    timestamp: new Date().toISOString(),
                    services: []
                }
            };

            allResults.forEach((result, index) => {
                const serviceName = serviceNames[index];
                
                if (result.status === 'fulfilled' && result.value.success) {
                    combinedResults.results.push(...result.value.results);
                    combinedResults.metadata.totalResults += result.value.results.length;
                    combinedResults.metadata.services.push({
                        name: serviceName,
                        status: 'success',
                        resultCount: result.value.results.length,
                        searchTime: result.value.metadata.searchTime
                    });
                } else {
                    const error = result.status === 'rejected' ? result.reason.message : result.value.error;
                    combinedResults.metadata.services.push({
                        name: serviceName,
                        status: 'error',
                        error: error,
                        resultCount: 0
                    });
                }
            });

            // Sonuçları relevansa göre sırala (basit sıralama)
            combinedResults.results.sort((a, b) => {
                // Başlık benzerliğine göre sırala
                const aScore = this.calculateRelevanceScore(a, searchTerm);
                const bScore = this.calculateRelevanceScore(b, searchTerm);
                return bScore - aScore;
            });

            this.logger.info(`Tüm servislerden toplam ${combinedResults.metadata.totalResults} sonuç bulundu`);
            return combinedResults;

        } catch (error) {
            const endTime = Date.now();
            this.logger.error(`Tüm servislerde arama hatası: ${error.message}`);
            
            return {
                success: false,
                error: error.message,
                results: [],
                metadata: {
                    query: searchTerm,
                    totalResults: 0,
                    searchTime: endTime - startTime,
                    timestamp: new Date().toISOString(),
                    services: serviceNames.map(name => ({
                        name: name,
                        status: 'error',
                        error: 'Genel arama hatası'
                    }))
                }
            };
        }
    }

    /**
     * Arama sonucunun relevans skorunu hesaplar
     * @param {Object} result - Arama sonucu
     * @param {string} searchTerm - Arama terimi
     * @returns {number} Relevans skoru
     */
    calculateRelevanceScore(result, searchTerm) {
        let score = 0;
        const term = searchTerm.toLowerCase();

        // Başlık eşleşmesi
        if (result.title && result.title.toLowerCase().includes(term)) {
            score += 10;
        }

        // Yazar eşleşmesi
        if (result.author && result.author.toLowerCase().includes(term)) {
            score += 8;
        }

        // Konu eşleşmesi
        if (result.subject && Array.isArray(result.subject)) {
            const subjectMatch = result.subject.some(s => s.toLowerCase().includes(term));
            if (subjectMatch) score += 6;
        }

        // Açıklama eşleşmesi
        if (result.description && result.description.toLowerCase().includes(term)) {
            score += 4;
        }

        // ISBN eşleşmesi (tam eşleşme)
        if (result.isbn && result.isbn === searchTerm) {
            score += 15;
        }

        return score;
    }

    /**
     * Belirli bir serviste ISBN ile arama yapar
     * @param {string} serviceName - Servis adı
     * @param {string} isbn - ISBN numarası
     * @returns {Promise<Object>} Arama sonuçları
     */
    async searchByISBN(serviceName, isbn) {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Servis bulunamadı: ${serviceName}`);
        }

        if (typeof service.searchByISBN === 'function') {
            return await service.searchByISBN(isbn);
        } else {
            return await this.searchInService(serviceName, isbn, { searchType: 'isbn' });
        }
    }

    /**
     * Tüm servislerin durumunu kontrol eder
     * @returns {Promise<Object>} Servis durumları
     */
    async checkAllServicesStatus() {
        const serviceNames = Array.from(this.services.keys());
        const statusPromises = serviceNames.map(async (serviceName) => {
            const service = this.services.get(serviceName);
            try {
                if (typeof service.checkServiceStatus === 'function') {
                    return await service.checkServiceStatus();
                } else {
                    // Basit test araması yap
                    const testResult = await this.searchInService(serviceName, 'test', { count: 1 });
                    return {
                        status: testResult.success ? 'online' : 'offline',
                        service: serviceName,
                        lastChecked: new Date().toISOString(),
                        error: testResult.success ? null : testResult.error
                    };
                }
            } catch (error) {
                return {
                    status: 'offline',
                    service: serviceName,
                    lastChecked: new Date().toISOString(),
                    error: error.message
                };
            }
        });

        const statuses = await Promise.allSettled(statusPromises);
        
        return {
            timestamp: new Date().toISOString(),
            services: statuses.map((status, index) => ({
                name: serviceNames[index],
                ...(status.status === 'fulfilled' ? status.value : {
                    status: 'error',
                    error: status.reason.message
                })
            }))
        };
    }

    /**
     * Arama geçmişini temizler (gelecekte implement edilecek)
     */
    clearSearchHistory() {
        this.logger.info('Arama geçmişi temizlendi');
    }

    /**
     * Manager'ı kapatır ve kaynakları temizler
     */
    async shutdown() {
        this.logger.info('Z3950Manager kapatılıyor...');
        this.services.clear();
        this.logger.info('Z3950Manager kapatıldı');
    }
}

module.exports = Z3950Manager;
