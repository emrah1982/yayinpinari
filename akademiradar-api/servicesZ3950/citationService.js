const axios = require('axios');
const winston = require('winston');

/**
 * Yayınların atıf sayısını çeşitli akademik kaynaklardan toplayan servis
 * Crossref, Semantic Scholar, OpenAlex, Google Scholar gibi kaynakları kullanır
 */
class CitationService {
    constructor(options = {}) {
        this.timeout = options.timeout || 10000;
        this.maxRetries = options.maxRetries || 2;
        
        // Logger setup
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/citation-service.log' })
            ]
        });

        // API endpoints
        this.apis = {
            crossref: 'https://api.crossref.org/works',
            semanticScholar: 'https://api.semanticscholar.org/graph/v1/paper',
            openAlex: 'https://api.openalex.org/works',
            unpaywall: 'https://api.unpaywall.org/v2'
        };

        // Rate limiting
        this.lastRequestTime = {};
        this.minRequestInterval = 100; // ms between requests
    }

    /**
     * Ana atıf bilgisi toplama metodu
     */
    async getCitationInfo(publication) {
        try {
            this.logger.info(`Atıf bilgisi aranıyor: ${publication.title}`);
            
            const citationData = {
                title: publication.title,
                author: publication.author,
                citationCount: 0,
                hIndex: null,
                sources: [],
                lastUpdated: new Date().toISOString(),
                details: {}
            };

            // Paralel olarak farklı kaynaklardan atıf bilgisi topla
            const searchPromises = [
                this.searchCrossref(publication),
                this.searchSemanticScholar(publication),
                this.searchOpenAlex(publication)
            ];

            const results = await Promise.allSettled(searchPromises);
            
            // Sonuçları birleştir
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    const sourceNames = ['Crossref', 'Semantic Scholar', 'OpenAlex'];
                    const sourceName = sourceNames[index];
                    
                    citationData.sources.push(sourceName);
                    citationData.details[sourceName.toLowerCase().replace(' ', '_')] = result.value;
                    
                    // En yüksek atıf sayısını al
                    if (result.value.citationCount > citationData.citationCount) {
                        citationData.citationCount = result.value.citationCount;
                        citationData.primarySource = sourceName;
                    }
                    
                    // H-index bilgisi varsa ekle
                    if (result.value.hIndex) {
                        citationData.hIndex = result.value.hIndex;
                    }
                }
            });

            this.logger.info(`Atıf bilgisi bulundu: ${citationData.citationCount} atıf`);
            return citationData;
            
        } catch (error) {
            this.logger.error(`Atıf bilgisi hatası: ${error.message}`);
            return this.createEmptyCitationData(publication);
        }
    }

    /**
     * Crossref API'den atıf bilgisi arar
     */
    async searchCrossref(publication) {
        try {
            await this.rateLimitDelay('crossref');
            
            const searchQuery = this.buildSearchQuery(publication);
            const url = `${this.apis.crossref}?query=${encodeURIComponent(searchQuery)}&rows=5`;
            
            const response = await axios.get(url, {
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'AkademikRadar/1.0 (mailto:contact@akademikradar.com)'
                }
            });

            if (response.data && response.data.message && response.data.message.items.length > 0) {
                const item = response.data.message.items[0];
                
                return {
                    citationCount: item['is-referenced-by-count'] || 0,
                    doi: item.DOI,
                    publishedDate: item.published ? item.published['date-parts'][0] : null,
                    journal: item['container-title'] ? item['container-title'][0] : null,
                    publisher: item.publisher,
                    type: item.type,
                    url: item.URL,
                    score: item.score
                };
            }
            
            return null;
        } catch (error) {
            this.logger.error(`Crossref arama hatası: ${error.message}`);
            return null;
        }
    }

    /**
     * Semantic Scholar API'den atıf bilgisi arar
     */
    async searchSemanticScholar(publication) {
        try {
            await this.rateLimitDelay('semanticScholar');
            
            const searchQuery = this.buildSearchQuery(publication);
            const url = `${this.apis.semanticScholar}/search?query=${encodeURIComponent(searchQuery)}&limit=5&fields=citationCount,influentialCitationCount,title,authors,year,venue,externalIds`;
            
            const response = await axios.get(url, {
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'AkademikRadar/1.0'
                }
            });

            if (response.data && response.data.data && response.data.data.length > 0) {
                const paper = response.data.data[0];
                
                return {
                    citationCount: paper.citationCount || 0,
                    influentialCitationCount: paper.influentialCitationCount || 0,
                    paperId: paper.paperId,
                    year: paper.year,
                    venue: paper.venue,
                    authors: paper.authors ? paper.authors.map(a => a.name) : [],
                    externalIds: paper.externalIds
                };
            }
            
            return null;
        } catch (error) {
            this.logger.error(`Semantic Scholar arama hatası: ${error.message}`);
            return null;
        }
    }

    /**
     * OpenAlex API'den atıf bilgisi arar
     */
    async searchOpenAlex(publication) {
        try {
            await this.rateLimitDelay('openAlex');
            
            const searchQuery = this.buildSearchQuery(publication);
            const url = `${this.apis.openAlex}?search=${encodeURIComponent(searchQuery)}&per-page=5`;
            
            const response = await axios.get(url, {
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'AkademikRadar/1.0'
                }
            });

            if (response.data && response.data.results && response.data.results.length > 0) {
                const work = response.data.results[0];
                
                return {
                    citationCount: work.cited_by_count || 0,
                    openAlexId: work.id,
                    publicationYear: work.publication_year,
                    type: work.type,
                    venue: work.primary_location ? work.primary_location.source : null,
                    doi: work.doi,
                    isOa: work.open_access ? work.open_access.is_oa : false,
                    oaStatus: work.open_access ? work.open_access.oa_status : null
                };
            }
            
            return null;
        } catch (error) {
            this.logger.error(`OpenAlex arama hatası: ${error.message}`);
            return null;
        }
    }

    /**
     * Arama sorgusu oluşturur
     */
    buildSearchQuery(publication) {
        let query = '';
        
        if (publication.title) {
            // Başlıktan gereksiz kelimeleri temizle
            const cleanTitle = publication.title
                .replace(/[^\w\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            query += cleanTitle;
        }
        
        if (publication.author) {
            // İlk yazarı ekle
            const firstAuthor = publication.author.split(',')[0].split(';')[0].trim();
            query += ` ${firstAuthor}`;
        }
        
        return query;
    }

    /**
     * Rate limiting için gecikme
     */
    async rateLimitDelay(apiName) {
        const now = Date.now();
        const lastRequest = this.lastRequestTime[apiName] || 0;
        const timeSinceLastRequest = now - lastRequest;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            const delay = this.minRequestInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastRequestTime[apiName] = Date.now();
    }

    /**
     * Boş atıf verisi oluşturur
     */
    createEmptyCitationData(publication) {
        return {
            title: publication.title,
            author: publication.author,
            citationCount: 0,
            hIndex: null,
            sources: [],
            lastUpdated: new Date().toISOString(),
            details: {},
            error: 'Atıf bilgisi bulunamadı'
        };
    }

    /**
     * Birden fazla yayın için atıf bilgilerini toplar
     */
    async getCitationInfoBatch(publications) {
        try {
            this.logger.info(`Toplu atıf bilgisi aranıyor: ${publications.length} yayın`);
            
            const citationPromises = publications.map(pub => this.getCitationInfo(pub));
            const results = await Promise.allSettled(citationPromises);
            
            const citationData = results.map((result, index) => ({
                publication: publications[index],
                citationInfo: result.status === 'fulfilled' ? result.value : this.createEmptyCitationData(publications[index])
            }));
            
            // İstatistikleri hesapla
            const stats = this.calculateCitationStats(citationData);
            
            return {
                success: true,
                results: citationData,
                stats: stats,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            this.logger.error(`Toplu atıf bilgisi hatası: ${error.message}`);
            return {
                success: false,
                error: error.message,
                results: [],
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Atıf istatistiklerini hesaplar
     */
    calculateCitationStats(citationData) {
        const validCitations = citationData.filter(item => item.citationInfo.citationCount > 0);
        const citationCounts = validCitations.map(item => item.citationInfo.citationCount);
        
        if (citationCounts.length === 0) {
            return {
                totalPublications: citationData.length,
                publicationsWithCitations: 0,
                averageCitations: 0,
                maxCitations: 0,
                totalCitations: 0,
                hIndex: 0
            };
        }
        
        const totalCitations = citationCounts.reduce((sum, count) => sum + count, 0);
        const sortedCitations = citationCounts.sort((a, b) => b - a);
        
        // H-index hesapla
        let hIndex = 0;
        for (let i = 0; i < sortedCitations.length; i++) {
            if (sortedCitations[i] >= i + 1) {
                hIndex = i + 1;
            } else {
                break;
            }
        }
        
        return {
            totalPublications: citationData.length,
            publicationsWithCitations: validCitations.length,
            averageCitations: Math.round(totalCitations / validCitations.length * 100) / 100,
            maxCitations: Math.max(...citationCounts),
            totalCitations: totalCitations,
            hIndex: hIndex,
            citationDistribution: {
                '0': citationData.length - validCitations.length,
                '1-10': citationCounts.filter(c => c >= 1 && c <= 10).length,
                '11-50': citationCounts.filter(c => c >= 11 && c <= 50).length,
                '51-100': citationCounts.filter(c => c >= 51 && c <= 100).length,
                '100+': citationCounts.filter(c => c > 100).length
            }
        };
    }

    /**
     * Mock atıf verisi oluşturur (test amaçlı)
     */
    async generateMockCitationData(publication) {
        // Başlık ve yazara göre simüle edilmiş atıf sayısı
        const titleLength = publication.title ? publication.title.length : 0;
        const hasAuthor = publication.author ? 1 : 0;
        const yearFactor = publication.publishYear ? (2024 - parseInt(publication.publishYear)) : 5;
        
        const baseCitations = Math.floor(Math.random() * 50) + titleLength % 20 + hasAuthor * 10;
        const ageFactor = Math.max(1, yearFactor * 2);
        const mockCitationCount = Math.floor(baseCitations * ageFactor / 5);
        
        return {
            title: publication.title,
            author: publication.author,
            citationCount: mockCitationCount,
            hIndex: Math.floor(mockCitationCount / 10),
            sources: ['Mock Academic Database', 'Simulated Scholar'],
            lastUpdated: new Date().toISOString(),
            details: {
                mock_data: {
                    citationCount: mockCitationCount,
                    influentialCitationCount: Math.floor(mockCitationCount * 0.3),
                    recentCitations: Math.floor(mockCitationCount * 0.2),
                    selfCitations: Math.floor(mockCitationCount * 0.1),
                    citationVelocity: Math.floor(mockCitationCount / Math.max(yearFactor, 1))
                }
            },
            isMockData: true
        };
    }
}

module.exports = CitationService;
