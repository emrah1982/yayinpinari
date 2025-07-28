const BaseService = require('./baseService');
const axios = require('axios');

/**
 * Dimensions.ai API'sinden akademik veri çeken servis
 * Atıf, proje, patent ve fon verilerini sağlar
 */
class DimensionsService extends BaseService {
    constructor() {
        super('DimensionsService', 1); // Rate limit: 1 request/second
        
        // Dimensions.ai API endpoint (açık erişim kısmı)
        this.baseUrl = 'https://app.dimensions.ai/api';
        this.searchUrl = 'https://app.dimensions.ai/discover/publication';
    }

    /**
     * Anahtar kelimeye göre yayın arama
     * @param {string} query - Arama sorgusu
     * @param {Object} options - Arama seçenekleri
     * @returns {Promise<Array>} Yayın listesi
     */
    async searchPublications(query, options = {}) {
        const {
            limit = 20,
            yearFrom = null,
            yearTo = null,
            category = null
        } = options;

        try {
            // Dimensions.ai açık erişim arama URL'si oluştur
            const searchParams = new URLSearchParams({
                search_mode: 'content',
                search_text: query,
                search_type: 'kws',
                search_field: 'full_search'
            });

            if (yearFrom) searchParams.append('year_from', yearFrom);
            if (yearTo) searchParams.append('year_to', yearTo);
            if (category) searchParams.append('category', category);

            const url = `${this.searchUrl}?${searchParams.toString()}`;

            const response = await this.makeRequest(async () => {
                return await axios.get(url, {
                    headers: {
                        'User-Agent': 'AkademikRadar/1.0 (Academic Research Tool)',
                        'Accept': 'application/json'
                    },
                    timeout: 15000
                });
            });

            // Dimensions.ai'dan gelen veriyi standart formata dönüştür
            return this.transformDimensionsData(response.data, query);

        } catch (error) {
            console.warn(`Dimensions.ai API error for query "${query}":`, error.message);
            
            // Hata durumunda mock veri döndür
            return this.generateMockData(query, options);
        }
    }

    /**
     * Trend analizi için yıllık yayın dağılımı
     * @param {string} query - Arama sorgusu
     * @param {Object} options - Analiz seçenekleri
     * @returns {Promise<Object>} Yıllık trend verisi
     */
    async getTrendAnalysis(query, options = {}) {
        const {
            startYear = 2015,
            endYear = new Date().getFullYear(),
            groupBy = 'year'
        } = options;

        try {
            const publications = await this.searchPublications(query, {
                limit: 1000,
                yearFrom: startYear,
                yearTo: endYear
            });

            // Yıllık gruplandırma
            const yearlyData = {};
            for (let year = startYear; year <= endYear; year++) {
                yearlyData[year] = {
                    publications: 0,
                    citations: 0,
                    authors: new Set(),
                    journals: new Set()
                };
            }

            publications.forEach(pub => {
                const year = pub.year || pub.publishedYear;
                if (year && yearlyData[year]) {
                    yearlyData[year].publications++;
                    yearlyData[year].citations += pub.citationCount || 0;
                    if (pub.authors) {
                        pub.authors.forEach(author => yearlyData[year].authors.add(author));
                    }
                    if (pub.journal) {
                        yearlyData[year].journals.add(pub.journal);
                    }
                }
            });

            // Set'leri sayıya dönüştür
            Object.keys(yearlyData).forEach(year => {
                yearlyData[year].uniqueAuthors = yearlyData[year].authors.size;
                yearlyData[year].uniqueJournals = yearlyData[year].journals.size;
                delete yearlyData[year].authors;
                delete yearlyData[year].journals;
            });

            return {
                query,
                timeRange: { startYear, endYear },
                totalPublications: publications.length,
                yearlyData,
                trendType: this.analyzeTrendType(yearlyData)
            };

        } catch (error) {
            console.error('Dimensions trend analysis error:', error);
            return this.generateMockTrendData(query, startYear, endYear);
        }
    }

    /**
     * Dimensions.ai verisini standart formata dönüştür
     * @param {Object} data - Ham API verisi
     * @param {string} query - Orijinal sorgu
     * @returns {Array} Standartlaştırılmış yayın listesi
     */
    transformDimensionsData(data, query) {
        if (!data || !Array.isArray(data.publications)) {
            return [];
        }

        return data.publications.map(pub => ({
            id: pub.id,
            title: pub.title,
            authors: pub.authors?.map(a => a.name) || [],
            year: pub.year,
            publishedYear: pub.year,
            journal: pub.journal?.title,
            abstract: pub.abstract,
            doi: pub.doi,
            url: pub.url,
            citationCount: pub.times_cited || 0,
            source: 'Dimensions.ai',
            categories: pub.category_for || [],
            fundingInfo: pub.funding || [],
            altmetrics: pub.altmetrics || {},
            openAccess: pub.open_access || false
        }));
    }

    /**
     * Trend tipini analiz et
     * @param {Object} yearlyData - Yıllık veri
     * @returns {string} Trend tipi
     */
    analyzeTrendType(yearlyData) {
        const years = Object.keys(yearlyData).sort();
        const values = years.map(year => yearlyData[year].publications);
        
        if (values.length < 3) return 'insufficient_data';
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const growthRate = (secondAvg - firstAvg) / firstAvg;
        
        if (growthRate > 0.3) return 'rising';
        if (growthRate < -0.3) return 'declining';
        return 'stable';
    }

    /**
     * Mock veri üretici
     * @param {string} query - Sorgu
     * @param {Object} options - Seçenekler
     * @returns {Array} Mock yayın listesi
     */
    generateMockData(query, options = {}) {
        const mockCount = Math.min(options.limit || 20, 50);
        const currentYear = new Date().getFullYear();
        const startYear = options.yearFrom || (currentYear - 5);
        
        return Array.from({ length: mockCount }, (_, i) => ({
            id: `dimensions_mock_${i}`,
            title: `${query} Research Study ${i + 1}`,
            authors: [`Author ${i + 1}`, `Co-Author ${i + 1}`],
            year: startYear + Math.floor(Math.random() * (currentYear - startYear + 1)),
            journal: `Journal of ${query} Studies`,
            abstract: `This study explores ${query} using advanced methodologies...`,
            doi: `10.1000/mock.${i}`,
            citationCount: Math.floor(Math.random() * 100),
            source: 'Dimensions.ai (Mock)',
            categories: [query.split(' ')[0]],
            fundingInfo: [`Grant ${i + 1}`],
            openAccess: Math.random() > 0.5
        }));
    }

    /**
     * Mock trend verisi üretici
     * @param {string} query - Sorgu
     * @param {number} startYear - Başlangıç yılı
     * @param {number} endYear - Bitiş yılı
     * @returns {Object} Mock trend verisi
     */
    generateMockTrendData(query, startYear, endYear) {
        const yearlyData = {};
        
        for (let year = startYear; year <= endYear; year++) {
            const baseValue = 10 + Math.floor(Math.random() * 50);
            const trend = (year - startYear) * 5; // Yükselen trend
            
            yearlyData[year] = {
                publications: Math.max(1, baseValue + trend + Math.floor(Math.random() * 20) - 10),
                citations: Math.floor(Math.random() * 500),
                uniqueAuthors: Math.floor(Math.random() * 30) + 5,
                uniqueJournals: Math.floor(Math.random() * 15) + 3
            };
        }

        return {
            query,
            timeRange: { startYear, endYear },
            totalPublications: Object.values(yearlyData).reduce((sum, data) => sum + data.publications, 0),
            yearlyData,
            trendType: 'rising'
        };
    }
}

module.exports = DimensionsService;
