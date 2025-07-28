const axios = require('axios');
const BaseService = require('./baseService');

/**
 * Literatür Karşılaştırma Servisi
 * Farklı konular, dönemler veya yaklaşımlar arasında karşılaştırmalı analiz yapar
 */
class LiteratureComparisonService extends BaseService {
    constructor() {
        super('LiteratureComparison');
        this.comparisonTypes = {
            TOPIC: 'topic',
            TEMPORAL: 'temporal',
            METHODOLOGY: 'methodology',
            GEOGRAPHIC: 'geographic',
            INTERDISCIPLINARY: 'interdisciplinary'
        };
    }

    /**
     * İki veya daha fazla konu arasında karşılaştırma yapar
     * @param {Array} topics - Karşılaştırılacak konular
     * @param {Object} options - Karşılaştırma seçenekleri
     * @returns {Object} Karşılaştırma sonuçları
     */
    async compareTopics(topics, options = {}) {
        try {
            console.log(`[LiteratureComparison] Konu karşılaştırması başlatılıyor: ${topics.join(' vs ')}`);
            
            const {
                yearRange = { start: 2019, end: new Date().getFullYear() },
                metrics = ['publications', 'citations', 'authors', 'keywords'],
                includeVisualization = true
            } = options;

            // Her konu için veri toplama
            const topicData = {};
            for (const topic of topics) {
                topicData[topic] = await this.collectTopicData(topic, yearRange, metrics);
            }

            // Karşılaştırmalı analizler
            const comparison = {
                topicData,
                publicationComparison: this.comparePublications(topicData),
                citationComparison: this.compareCitations(topicData),
                authorComparison: this.compareAuthors(topicData),
                keywordComparison: this.compareKeywords(topicData),
                trendComparison: this.compareTrends(topicData),
                gapAnalysis: this.compareGaps(topicData),
                recommendations: this.generateComparisonRecommendations(topicData)
            };

            if (includeVisualization) {
                comparison.visualizations = this.generateVisualizationData(comparison);
            }

            console.log(`[LiteratureComparison] Konu karşılaştırması tamamlandı. ${topics.length} konu analiz edildi.`);
            
            return {
                success: true,
                topics,
                comparisonDate: new Date().toISOString(),
                yearRange,
                comparison,
                summary: this.generateComparisonSummary(comparison)
            };

        } catch (error) {
            console.error(`[LiteratureComparison] Konu karşılaştırma hatası: ${error.message}`);
            return {
                success: false,
                error: error.message,
                fallbackData: this.getMockComparison(topics)
            };
        }
    }

    /**
     * Zamansal karşılaştırma - aynı konunun farklı dönemlerdeki durumu
     */
    async compareTemporalPeriods(topic, periods, options = {}) {
        try {
            console.log(`[LiteratureComparison] Zamansal karşılaştırma başlatılıyor: ${topic}`);
            
            const periodData = {};
            for (const period of periods) {
                const periodLabel = `${period.start}-${period.end}`;
                periodData[periodLabel] = await this.collectTopicData(topic, period, ['publications', 'citations', 'keywords']);
            }

            const temporalComparison = {
                periodData,
                evolutionAnalysis: this.analyzeEvolution(periodData),
                keywordEvolution: this.analyzeKeywordEvolution(periodData),
                methodologyEvolution: this.analyzeMethodologyEvolution(periodData),
                impactEvolution: this.analyzeImpactEvolution(periodData),
                predictions: this.generateTemporalPredictions(periodData)
            };

            return {
                success: true,
                topic,
                periods,
                temporalComparison,
                summary: this.generateTemporalSummary(temporalComparison)
            };

        } catch (error) {
            console.error(`[LiteratureComparison] Zamansal karşılaştırma hatası: ${error.message}`);
            return {
                success: false,
                error: error.message,
                fallbackData: this.getMockTemporalComparison(topic)
            };
        }
    }

    /**
     * Metodolojik karşılaştırma - farklı araştırma yöntemlerinin karşılaştırılması
     */
    async compareMethods(topic, methods, options = {}) {
        try {
            console.log(`[LiteratureComparison] Metodolojik karşılaştırma başlatılıyor: ${topic} - ${methods.join(' vs ')}`);
            
            const methodData = {};
            for (const method of methods) {
                methodData[method] = await this.collectMethodData(topic, method, options.yearRange);
            }

            const methodComparison = {
                methodData,
                effectivenessComparison: this.compareEffectiveness(methodData),
                adoptionTrends: this.compareAdoptionTrends(methodData),
                citationImpact: this.compareMethodCitationImpact(methodData),
                geographicDistribution: this.compareGeographicDistribution(methodData),
                futureProspects: this.assessMethodFutureProspects(methodData)
            };

            return {
                success: true,
                topic,
                methods,
                methodComparison,
                summary: this.generateMethodSummary(methodComparison)
            };

        } catch (error) {
            console.error(`[LiteratureComparison] Metodolojik karşılaştırma hatası: ${error.message}`);
            return {
                success: false,
                error: error.message,
                fallbackData: this.getMockMethodComparison(topic, methods)
            };
        }
    }

    /**
     * Coğrafi karşılaştırma - farklı bölgelerdeki araştırma durumu
     */
    async compareGeographic(topic, regions, options = {}) {
        try {
            console.log(`[LiteratureComparison] Coğrafi karşılaştırma başlatılıyor: ${topic} - ${regions.join(' vs ')}`);
            
            const regionData = {};
            for (const region of regions) {
                regionData[region] = await this.collectRegionData(topic, region, options.yearRange);
            }

            const geographicComparison = {
                regionData,
                publicationDistribution: this.compareRegionalPublications(regionData),
                collaborationPatterns: this.analyzeRegionalCollaborations(regionData),
                fundingComparison: this.compareRegionalFunding(regionData),
                institutionComparison: this.compareRegionalInstitutions(regionData),
                languageAnalysis: this.analyzeLanguageDistribution(regionData),
                culturalFactors: this.analyzeCulturalFactors(regionData)
            };

            return {
                success: true,
                topic,
                regions,
                geographicComparison,
                summary: this.generateGeographicSummary(geographicComparison)
            };

        } catch (error) {
            console.error(`[LiteratureComparison] Coğrafi karşılaştırma hatası: ${error.message}`);
            return {
                success: false,
                error: error.message,
                fallbackData: this.getMockGeographicComparison(topic, regions)
            };
        }
    }

    // Veri toplama metodları
    async collectTopicData(topic, yearRange, metrics) {
        try {
            const data = {
                topic,
                yearRange,
                publications: [],
                totalPublications: 0,
                citations: 0,
                authors: new Set(),
                keywords: {},
                journals: {},
                institutions: {}
            };

            // Yayınları topla
            for (let year = yearRange.start; year <= yearRange.end; year++) {
                const yearPublications = await this.getPublicationsByYear(topic, year);
                data.publications.push(...yearPublications);
            }

            data.totalPublications = data.publications.length;

            // Metrikleri hesapla
            if (metrics.includes('citations')) {
                data.citations = this.calculateTotalCitations(data.publications);
                data.averageCitations = data.citations / data.totalPublications || 0;
                data.hIndex = this.calculateHIndex(data.publications);
            }

            if (metrics.includes('authors')) {
                data.publications.forEach(pub => {
                    if (pub.authors) {
                        pub.authors.forEach(author => data.authors.add(author));
                    }
                });
                data.uniqueAuthors = data.authors.size;
            }

            if (metrics.includes('keywords')) {
                data.publications.forEach(pub => {
                    if (pub.keywords) {
                        pub.keywords.forEach(keyword => {
                            data.keywords[keyword] = (data.keywords[keyword] || 0) + 1;
                        });
                    }
                });
            }

            return data;
        } catch (error) {
            console.error(`[LiteratureComparison] Konu veri toplama hatası: ${error.message}`);
            return this.getMockTopicData(topic);
        }
    }

    async collectMethodData(topic, method, yearRange) {
        try {
            const searchQuery = `${topic} AND "${method}"`;
            const publications = [];

            for (let year = yearRange.start; year <= yearRange.end; year++) {
                const yearPubs = await this.getPublicationsByYear(searchQuery, year);
                publications.push(...yearPubs);
            }

            return {
                method,
                publications,
                totalPublications: publications.length,
                citations: this.calculateTotalCitations(publications),
                averageCitations: this.calculateAverageCitations(publications),
                adoptionRate: this.calculateAdoptionRate(publications, yearRange),
                effectiveness: this.assessMethodEffectiveness(publications)
            };
        } catch (error) {
            return this.getMockMethodData(method);
        }
    }

    async collectRegionData(topic, region, yearRange) {
        try {
            const searchQuery = `${topic} AND (affiliation:"${region}" OR country:"${region}")`;
            const publications = [];

            for (let year = yearRange.start; year <= yearRange.end; year++) {
                const yearPubs = await this.getPublicationsByYear(searchQuery, year);
                publications.push(...yearPubs);
            }

            return {
                region,
                publications,
                totalPublications: publications.length,
                citations: this.calculateTotalCitations(publications),
                institutions: this.extractInstitutions(publications),
                collaborations: this.analyzeCollaborations(publications),
                funding: this.extractFundingInfo(publications)
            };
        } catch (error) {
            return this.getMockRegionData(region);
        }
    }

    // Karşılaştırma metodları
    comparePublications(topicData) {
        const comparison = {};
        const topics = Object.keys(topicData);

        topics.forEach(topic => {
            comparison[topic] = {
                totalPublications: topicData[topic].totalPublications,
                yearlyAverage: topicData[topic].totalPublications / 
                    (topicData[topic].yearRange.end - topicData[topic].yearRange.start + 1),
                growthRate: this.calculateTopicGrowthRate(topicData[topic])
            };
        });

        // En aktif konu
        const mostActive = topics.reduce((max, topic) => 
            comparison[topic].totalPublications > comparison[max].totalPublications ? topic : max
        );

        // En hızlı büyüyen konu
        const fastestGrowing = topics.reduce((max, topic) => 
            comparison[topic].growthRate > comparison[max].growthRate ? topic : max
        );

        return {
            comparison,
            insights: {
                mostActive,
                fastestGrowing,
                totalPublications: Object.values(comparison).reduce((sum, data) => sum + data.totalPublications, 0)
            }
        };
    }

    compareCitations(topicData) {
        const comparison = {};
        const topics = Object.keys(topicData);

        topics.forEach(topic => {
            const data = topicData[topic];
            comparison[topic] = {
                totalCitations: data.citations || 0,
                averageCitations: data.averageCitations || 0,
                hIndex: data.hIndex || 0,
                citationPerPublication: (data.citations || 0) / (data.totalPublications || 1)
            };
        });

        const mostCited = topics.reduce((max, topic) => 
            comparison[topic].totalCitations > comparison[max].totalCitations ? topic : max
        );

        const highestImpact = topics.reduce((max, topic) => 
            comparison[topic].averageCitations > comparison[max].averageCitations ? topic : max
        );

        return {
            comparison,
            insights: {
                mostCited,
                highestImpact,
                totalCitations: Object.values(comparison).reduce((sum, data) => sum + data.totalCitations, 0)
            }
        };
    }

    compareKeywords(topicData) {
        const allKeywords = new Set();
        const topicKeywords = {};

        // Tüm anahtar kelimeleri topla
        Object.keys(topicData).forEach(topic => {
            topicKeywords[topic] = topicData[topic].keywords || {};
            Object.keys(topicKeywords[topic]).forEach(keyword => allKeywords.add(keyword));
        });

        // Ortak ve benzersiz anahtar kelimeleri bul
        const commonKeywords = [];
        const uniqueKeywords = {};

        allKeywords.forEach(keyword => {
            const topicsWithKeyword = Object.keys(topicKeywords).filter(topic => 
                topicKeywords[topic][keyword]
            );

            if (topicsWithKeyword.length === Object.keys(topicData).length) {
                commonKeywords.push({
                    keyword,
                    frequency: Object.values(topicKeywords).reduce((sum, kws) => sum + (kws[keyword] || 0), 0)
                });
            } else if (topicsWithKeyword.length === 1) {
                const topic = topicsWithKeyword[0];
                if (!uniqueKeywords[topic]) uniqueKeywords[topic] = [];
                uniqueKeywords[topic].push({
                    keyword,
                    frequency: topicKeywords[topic][keyword]
                });
            }
        });

        return {
            commonKeywords: commonKeywords.sort((a, b) => b.frequency - a.frequency).slice(0, 10),
            uniqueKeywords,
            overlapAnalysis: this.calculateKeywordOverlap(topicKeywords),
            semanticDistance: this.calculateSemanticDistance(topicKeywords)
        };
    }

    // Yardımcı metodlar
    async getPublicationsByYear(topic, year) {
        try {
            const url = `https://api.crossref.org/works?query=${encodeURIComponent(topic)}&filter=from-pub-date:${year},until-pub-date:${year}&rows=50`;
            const response = await axios.get(url, {
                timeout: 10000,
                headers: { 'User-Agent': 'AkademikRadar/1.0' }
            });
            
            if (response.data?.message?.items) {
                return this.parseCrossrefResults(response.data.message.items);
            }
        } catch (error) {
            console.warn(`[LiteratureComparison] API hatası: ${error.message}`);
        }
        
        return this.getMockYearlyPublications(topic, year);
    }

    calculateTotalCitations(publications) {
        return publications.reduce((sum, pub) => sum + (pub.citations || 0), 0);
    }

    calculateAverageCitations(publications) {
        if (publications.length === 0) return 0;
        return this.calculateTotalCitations(publications) / publications.length;
    }

    calculateHIndex(publications) {
        const citations = publications.map(pub => pub.citations || 0).sort((a, b) => b - a);
        let hIndex = 0;
        
        for (let i = 0; i < citations.length; i++) {
            if (citations[i] >= i + 1) {
                hIndex = i + 1;
            } else {
                break;
            }
        }
        
        return hIndex;
    }

    // Mock data metodları
    getMockComparison(topics) {
        return {
            topicData: topics.reduce((acc, topic) => {
                acc[topic] = this.getMockTopicData(topic);
                return acc;
            }, {}),
            publicationComparison: {
                insights: {
                    mostActive: topics[0],
                    fastestGrowing: topics[1] || topics[0]
                }
            }
        };
    }

    getMockTopicData(topic) {
        return {
            topic,
            totalPublications: Math.floor(Math.random() * 200) + 50,
            citations: Math.floor(Math.random() * 5000) + 500,
            averageCitations: Math.floor(Math.random() * 25) + 5,
            hIndex: Math.floor(Math.random() * 30) + 10,
            uniqueAuthors: Math.floor(Math.random() * 100) + 20,
            keywords: {
                [topic]: Math.floor(Math.random() * 50) + 10,
                'research': Math.floor(Math.random() * 30) + 5,
                'analysis': Math.floor(Math.random() * 25) + 3
            }
        };
    }

    getMockYearlyPublications(topic, year) {
        const count = Math.floor(Math.random() * 20) + 5;
        const publications = [];
        
        for (let i = 0; i < count; i++) {
            publications.push({
                title: `${topic} Study ${i + 1} (${year})`,
                year: year,
                authors: [`Researcher ${i + 1}`],
                journal: `Journal ${(i % 3) + 1}`,
                citations: Math.floor(Math.random() * 30),
                keywords: [topic, 'research', 'study']
            });
        }
        
        return publications;
    }

    parseCrossrefResults(items) {
        return items.map(item => ({
            title: item.title?.[0] || 'Untitled',
            authors: item.author?.map(a => `${a.given || ''} ${a.family || ''}`).filter(name => name.trim()) || [],
            year: item.published?.['date-parts']?.[0]?.[0] || null,
            journal: item['container-title']?.[0] || 'Unknown',
            doi: item.DOI,
            citations: item['is-referenced-by-count'] || 0,
            keywords: item.subject || []
        }));
    }

    generateComparisonSummary(comparison) {
        const topics = Object.keys(comparison.topicData);
        return {
            totalTopics: topics.length,
            mostActiveField: comparison.publicationComparison?.insights?.mostActive || topics[0],
            highestImpactField: comparison.citationComparison?.insights?.highestImpact || topics[0],
            keyFindings: [
                `${topics.length} konu karşılaştırıldı`,
                `En aktif alan: ${comparison.publicationComparison?.insights?.mostActive || 'belirsiz'}`,
                `En yüksek etkili alan: ${comparison.citationComparison?.insights?.highestImpact || 'belirsiz'}`
            ],
            recommendations: [
                'Aktif alanlarda işbirliği fırsatları araştırın',
                'Düşük aktiviteli alanlarda yenilik fırsatları değerlendirin',
                'Disiplinlerarası yaklaşımları keşfedin'
            ]
        };
    }

    generateVisualizationData(comparison) {
        return {
            publicationChart: {
                type: 'bar',
                data: Object.keys(comparison.topicData).map(topic => ({
                    topic,
                    publications: comparison.topicData[topic].totalPublications
                }))
            },
            citationChart: {
                type: 'scatter',
                data: Object.keys(comparison.topicData).map(topic => ({
                    topic,
                    totalCitations: comparison.topicData[topic].citations,
                    averageCitations: comparison.topicData[topic].averageCitations
                }))
            },
            keywordOverlap: {
                type: 'venn',
                data: comparison.keywordComparison?.overlapAnalysis || {}
            }
        };
    }
}

module.exports = LiteratureComparisonService;
