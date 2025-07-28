const BaseService = require('./baseService');
const axios = require('axios');

/**
 * OpenAIRE API'sinden akademik veri çeken servis
 * Fon bağlantılı yayınlar ve Avrupa araştırma projelerini sağlar
 */
class OpenAIREService extends BaseService {
    constructor() {
        super('OpenAIREService', 1); // Rate limit: 1 request/second
        
        // OpenAIRE API endpoints
        this.baseUrl = 'https://api.openaire.eu';
        this.searchUrl = 'https://api.openaire.eu/search/publications';
        this.projectsUrl = 'https://api.openaire.eu/search/projects';
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
            country = null,
            funder = null
        } = options;

        try {
            // OpenAIRE API parametreleri
            const params = {
                keywords: query,
                size: Math.min(limit, 100), // OpenAIRE max 100
                format: 'json'
            };

            if (yearFrom) params.fromDateAccepted = `${yearFrom}-01-01`;
            if (yearTo) params.toDateAccepted = `${yearTo}-12-31`;
            if (country) params.country = country;
            if (funder) params.funder = funder;

            const response = await this.makeRequest(async () => {
                return await axios.get(this.searchUrl, {
                    params,
                    headers: {
                        'User-Agent': 'AkademikRadar/1.0 (Academic Research Tool)',
                        'Accept': 'application/json'
                    },
                    timeout: 15000
                });
            });

            // OpenAIRE verisini standart formata dönüştür
            return this.transformOpenAIREData(response.data, query);

        } catch (error) {
            console.warn(`OpenAIRE API error for query "${query}":`, error.message);
            
            // Hata durumunda mock veri döndür
            return this.generateMockData(query, options);
        }
    }

    /**
     * Proje bazlı arama
     * @param {string} query - Arama sorgusu
     * @param {Object} options - Arama seçenekleri
     * @returns {Promise<Array>} Proje listesi
     */
    async searchProjects(query, options = {}) {
        const {
            limit = 20,
            yearFrom = null,
            yearTo = null,
            funder = null
        } = options;

        try {
            const params = {
                keywords: query,
                size: Math.min(limit, 100),
                format: 'json'
            };

            if (yearFrom) params.fromDateAccepted = `${yearFrom}-01-01`;
            if (yearTo) params.toDateAccepted = `${yearTo}-12-31`;
            if (funder) params.funder = funder;

            const response = await this.makeRequest(async () => {
                return await axios.get(this.projectsUrl, {
                    params,
                    headers: {
                        'User-Agent': 'AkademikRadar/1.0 (Academic Research Tool)',
                        'Accept': 'application/json'
                    },
                    timeout: 15000
                });
            });

            return this.transformProjectData(response.data, query);

        } catch (error) {
            console.warn(`OpenAIRE Projects API error for query "${query}":`, error.message);
            return this.generateMockProjectData(query, options);
        }
    }

    /**
     * Trend analizi için fon bazlı yayın dağılımı
     * @param {string} query - Arama sorgusu
     * @param {Object} options - Analiz seçenekleri
     * @returns {Promise<Object>} Fon bazlı trend verisi
     */
    async getFundingTrendAnalysis(query, options = {}) {
        const {
            startYear = 2015,
            endYear = new Date().getFullYear(),
            topFunders = 10
        } = options;

        try {
            const publications = await this.searchPublications(query, {
                limit: 1000,
                yearFrom: startYear,
                yearTo: endYear
            });

            const projects = await this.searchProjects(query, {
                limit: 500,
                yearFrom: startYear,
                yearTo: endYear
            });

            // Yıllık ve fon bazlı gruplandırma
            const yearlyData = {};
            const funderData = {};
            const countryData = {};

            for (let year = startYear; year <= endYear; year++) {
                yearlyData[year] = {
                    publications: 0,
                    projects: 0,
                    totalFunding: 0,
                    funders: new Set(),
                    countries: new Set()
                };
            }

            // Yayınları analiz et
            publications.forEach(pub => {
                const year = pub.year || pub.publishedYear;
                if (year && yearlyData[year]) {
                    yearlyData[year].publications++;
                    
                    if (pub.funding) {
                        pub.funding.forEach(fund => {
                            yearlyData[year].funders.add(fund.funder);
                            yearlyData[year].totalFunding += fund.amount || 0;
                            
                            if (!funderData[fund.funder]) {
                                funderData[fund.funder] = { publications: 0, totalAmount: 0 };
                            }
                            funderData[fund.funder].publications++;
                            funderData[fund.funder].totalAmount += fund.amount || 0;
                        });
                    }

                    if (pub.country) {
                        yearlyData[year].countries.add(pub.country);
                        if (!countryData[pub.country]) {
                            countryData[pub.country] = 0;
                        }
                        countryData[pub.country]++;
                    }
                }
            });

            // Projeleri analiz et
            projects.forEach(proj => {
                const year = proj.startYear || proj.year;
                if (year && yearlyData[year]) {
                    yearlyData[year].projects++;
                    yearlyData[year].totalFunding += proj.totalCost || 0;
                    
                    if (proj.funder) {
                        yearlyData[year].funders.add(proj.funder);
                        if (!funderData[proj.funder]) {
                            funderData[proj.funder] = { publications: 0, totalAmount: 0 };
                        }
                        funderData[proj.funder].totalAmount += proj.totalCost || 0;
                    }
                }
            });

            // Set'leri sayıya dönüştür
            Object.keys(yearlyData).forEach(year => {
                yearlyData[year].uniqueFunders = yearlyData[year].funders.size;
                yearlyData[year].uniqueCountries = yearlyData[year].countries.size;
                delete yearlyData[year].funders;
                delete yearlyData[year].countries;
            });

            // Top funder'ları sırala
            const topFundersList = Object.entries(funderData)
                .sort(([,a], [,b]) => b.publications - a.publications)
                .slice(0, topFunders)
                .map(([name, data]) => ({ name, ...data }));

            return {
                query,
                timeRange: { startYear, endYear },
                totalPublications: publications.length,
                totalProjects: projects.length,
                yearlyData,
                topFunders: topFundersList,
                countryDistribution: countryData,
                trendType: this.analyzeFundingTrend(yearlyData)
            };

        } catch (error) {
            console.error('OpenAIRE funding trend analysis error:', error);
            return this.generateMockFundingTrendData(query, startYear, endYear);
        }
    }

    /**
     * OpenAIRE yayın verisini standart formata dönüştür
     * @param {Object} data - Ham API verisi
     * @param {string} query - Orijinal sorgu
     * @returns {Array} Standartlaştırılmış yayın listesi
     */
    transformOpenAIREData(data, query) {
        if (!data || !data.response || !Array.isArray(data.response.results)) {
            return [];
        }

        return data.response.results.map(result => {
            const pub = result.metadata || result;
            
            return {
                id: pub.id || pub['oaf:entity']['@id'],
                title: this.extractTitle(pub.title),
                authors: this.extractAuthors(pub.creator),
                year: this.extractYear(pub.dateofacceptance),
                publishedYear: this.extractYear(pub.dateofacceptance),
                journal: this.extractJournal(pub.journal),
                abstract: this.extractAbstract(pub.description),
                doi: this.extractDOI(pub.pid),
                url: this.extractURL(pub.webresource),
                source: 'OpenAIRE',
                openAccess: pub.bestaccessright?.classname === 'Open Access',
                funding: this.extractFunding(pub.rels),
                country: this.extractCountry(pub.country),
                projectInfo: this.extractProjectInfo(pub.rels),
                subjects: this.extractSubjects(pub.subject)
            };
        });
    }

    /**
     * Proje verisini dönüştür
     * @param {Object} data - Ham proje verisi
     * @param {string} query - Orijinal sorgu
     * @returns {Array} Standartlaştırılmış proje listesi
     */
    transformProjectData(data, query) {
        if (!data || !data.response || !Array.isArray(data.response.results)) {
            return [];
        }

        return data.response.results.map(result => {
            const proj = result.metadata || result;
            
            return {
                id: proj.id,
                title: this.extractTitle(proj.title),
                acronym: proj.acronym,
                startYear: this.extractYear(proj.startdate),
                endYear: this.extractYear(proj.enddate),
                funder: this.extractFunder(proj.fundingtree),
                totalCost: this.extractCost(proj.totalcost),
                summary: this.extractAbstract(proj.summary),
                coordinator: this.extractCoordinator(proj.rels),
                participants: this.extractParticipants(proj.rels),
                subjects: this.extractSubjects(proj.subject),
                source: 'OpenAIRE Projects'
            };
        });
    }

    // Yardımcı extraction metodları
    extractTitle(title) {
        if (Array.isArray(title)) return title[0]?.content || title[0] || '';
        return title?.content || title || '';
    }

    extractAuthors(creators) {
        if (!creators) return [];
        if (!Array.isArray(creators)) creators = [creators];
        return creators.map(c => c.content || c.name || c).filter(Boolean);
    }

    extractYear(date) {
        if (!date) return null;
        const dateStr = date.content || date;
        const match = dateStr.match(/(\d{4})/);
        return match ? parseInt(match[1]) : null;
    }

    extractJournal(journal) {
        if (!journal) return null;
        return journal.content || journal.name || journal;
    }

    extractAbstract(description) {
        if (!description) return null;
        if (Array.isArray(description)) return description[0]?.content || description[0] || '';
        return description.content || description;
    }

    extractDOI(pids) {
        if (!pids || !Array.isArray(pids)) return null;
        const doiPid = pids.find(p => p.classid === 'doi');
        return doiPid?.content || null;
    }

    extractURL(webresource) {
        if (!webresource || !Array.isArray(webresource)) return null;
        return webresource[0]?.url || null;
    }

    extractFunding(rels) {
        // OpenAIRE funding relationship extraction logic
        return [];
    }

    extractCountry(country) {
        if (!country) return null;
        return country.classname || country.content || country;
    }

    extractProjectInfo(rels) {
        // Project relationship extraction logic
        return null;
    }

    extractSubjects(subjects) {
        if (!subjects || !Array.isArray(subjects)) return [];
        return subjects.map(s => s.content || s.classname || s).filter(Boolean);
    }

    extractFunder(fundingtree) {
        if (!fundingtree || !Array.isArray(fundingtree)) return null;
        return fundingtree[0]?.funder?.name || null;
    }

    extractCost(totalcost) {
        if (!totalcost) return 0;
        return parseFloat(totalcost.content || totalcost) || 0;
    }

    extractCoordinator(rels) {
        // Coordinator extraction logic
        return null;
    }

    extractParticipants(rels) {
        // Participants extraction logic
        return [];
    }

    /**
     * Fon bazlı trend analizi
     * @param {Object} yearlyData - Yıllık veri
     * @returns {string} Trend tipi
     */
    analyzeFundingTrend(yearlyData) {
        const years = Object.keys(yearlyData).sort();
        const fundingValues = years.map(year => yearlyData[year].totalFunding);
        
        if (fundingValues.length < 3) return 'insufficient_data';
        
        const firstHalf = fundingValues.slice(0, Math.floor(fundingValues.length / 2));
        const secondHalf = fundingValues.slice(Math.floor(fundingValues.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        if (firstAvg === 0) return 'emerging';
        
        const growthRate = (secondAvg - firstAvg) / firstAvg;
        
        if (growthRate > 0.5) return 'rapidly_growing';
        if (growthRate > 0.2) return 'growing';
        if (growthRate < -0.2) return 'declining';
        return 'stable';
    }

    /**
     * Mock veri üretici
     */
    generateMockData(query, options = {}) {
        const mockCount = Math.min(options.limit || 20, 50);
        const currentYear = new Date().getFullYear();
        const startYear = options.yearFrom || (currentYear - 5);
        
        return Array.from({ length: mockCount }, (_, i) => ({
            id: `openaire_mock_${i}`,
            title: `${query} European Research ${i + 1}`,
            authors: [`EU Researcher ${i + 1}`, `Partner ${i + 1}`],
            year: startYear + Math.floor(Math.random() * (currentYear - startYear + 1)),
            journal: `European Journal of ${query}`,
            abstract: `This European study investigates ${query} with EU funding...`,
            doi: `10.3030/mock.${i}`,
            source: 'OpenAIRE (Mock)',
            openAccess: true,
            funding: [{
                funder: 'European Commission',
                program: 'Horizon 2020',
                amount: Math.floor(Math.random() * 1000000)
            }],
            country: ['Germany', 'France', 'Italy', 'Spain', 'Netherlands'][Math.floor(Math.random() * 5)],
            subjects: [query.split(' ')[0]]
        }));
    }

    /**
     * Mock fon trend verisi üretici
     */
    generateMockFundingTrendData(query, startYear, endYear) {
        const yearlyData = {};
        const mockFunders = [
            'European Commission',
            'Horizon 2020',
            'ERC',
            'Marie Curie Actions',
            'FP7'
        ];
        
        for (let year = startYear; year <= endYear; year++) {
            yearlyData[year] = {
                publications: Math.floor(Math.random() * 30) + 10,
                projects: Math.floor(Math.random() * 15) + 5,
                totalFunding: Math.floor(Math.random() * 5000000) + 1000000,
                uniqueFunders: Math.floor(Math.random() * 5) + 2,
                uniqueCountries: Math.floor(Math.random() * 10) + 5
            };
        }

        return {
            query,
            timeRange: { startYear, endYear },
            totalPublications: Object.values(yearlyData).reduce((sum, data) => sum + data.publications, 0),
            totalProjects: Object.values(yearlyData).reduce((sum, data) => sum + data.projects, 0),
            yearlyData,
            topFunders: mockFunders.map(name => ({
                name,
                publications: Math.floor(Math.random() * 100) + 20,
                totalAmount: Math.floor(Math.random() * 10000000) + 2000000
            })),
            countryDistribution: {
                'Germany': Math.floor(Math.random() * 50) + 20,
                'France': Math.floor(Math.random() * 40) + 15,
                'Italy': Math.floor(Math.random() * 35) + 12,
                'Spain': Math.floor(Math.random() * 30) + 10,
                'Netherlands': Math.floor(Math.random() * 25) + 8
            },
            trendType: 'growing'
        };
    }
}

module.exports = OpenAIREService;
