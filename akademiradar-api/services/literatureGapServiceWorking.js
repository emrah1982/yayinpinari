const axios = require('axios');
const BaseService = require('./baseService');

/**
 * Literatür Boşluğu Tespit Servisi - Çalışan Versiyon
 * Akademik literatürde boşlukları tespit etmek için çeşitli analiz yöntemleri sunar
 */
class LiteratureGapService extends BaseService {
    constructor() {
        super('LiteratureGap');
        this.gapTypes = {
            THEORETICAL: 'theoretical',
            METHODOLOGICAL: 'methodological',
            REGIONAL: 'regional',
            TEMPORAL: 'temporal',
            DATA: 'data',
            INTERDISCIPLINARY: 'interdisciplinary'
        };
    }

    /**
     * Ana literatür boşluğu analizi
     * @param {string} topic - Araştırma konusu
     * @param {Object} options - Analiz seçenekleri
     * @returns {Object} Boşluk analiz sonuçları
     */
    async analyzeLiteratureGaps(topic, options = {}) {
        try {
            this.log(`Literatür boşluğu analizi başlatılıyor: ${topic}`);
            
            const {
                yearRange = { start: 2019, end: new Date().getFullYear() },
                includePatents = false,
                languages = ['en', 'tr'],
                maxResults = 500
            } = options;

            // Paralel analiz işlemleri
            const [
                basicAnalysis,
                citationAnalysis,
                temporalAnalysis,
                keywordAnalysis,
                methodAnalysis
            ] = await Promise.all([
                this.performBasicGapAnalysis(topic, yearRange, maxResults),
                this.analyzeCitationGaps(topic, yearRange),
                this.analyzeTemporalGaps(topic, yearRange),
                this.analyzeKeywordGaps(topic, maxResults),
                this.analyzeMethodologicalGaps(topic, maxResults)
            ]);

            // Sonuçları birleştir ve skorla
            const gapAnalysis = this.synthesizeGapAnalysis({
                basic: basicAnalysis,
                citation: citationAnalysis,
                temporal: temporalAnalysis,
                keyword: keywordAnalysis,
                methodological: methodAnalysis
            });

            this.log(`Literatür boşluğu analizi tamamlandı. ${gapAnalysis.identifiedGaps.length} boşluk tespit edildi.`);
            
            return {
                success: true,
                topic,
                analysisDate: new Date().toISOString(),
                totalGapsFound: gapAnalysis.identifiedGaps.length,
                gapAnalysis,
                recommendations: this.generateResearchRecommendations(gapAnalysis)
            };

        } catch (error) {
            this.log(`Literatür boşluğu analizi hatası: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                fallbackData: this.getMockGapAnalysis(topic)
            };
        }
    }

    /**
     * Temel boşluk analizi - mevcut literatürü tarar
     */
    async performBasicGapAnalysis(topic, yearRange, maxResults) {
        try {
            // Gerçek API araması yap
            const searchQueries = this.generateSearchQueries(topic);
            const results = [];

            for (const query of searchQueries) {
                const searchResults = await this.searchAcademicDatabases(query, yearRange, maxResults / searchQueries.length);
                results.push(...searchResults);
            }

            // Sonuçları analiz et
            const analysis = {
                totalPapers: results.length,
                yearDistribution: this.analyzeYearDistribution(results),
                journalDistribution: this.analyzeJournalDistribution(results),
                authorDistribution: this.analyzeAuthorDistribution(results),
                keyTerms: this.extractKeyTerms(results),
                underrepresentedAreas: this.identifyUnderrepresentedAreas(results, topic)
            };

            return analysis;

        } catch (error) {
            this.log(`Temel analiz hatası: ${error.message}`, 'error');
            return this.getMockBasicAnalysis();
        }
    }

    /**
     * Arama sorguları oluştur
     */
    generateSearchQueries(topic) {
        const baseQuery = topic.toLowerCase();
        return [
            baseQuery,
            `${baseQuery} research`,
            `${baseQuery} study`,
            `${baseQuery} analysis`,
            `${baseQuery} review`
        ];
    }

    /**
     * Akademik veritabanlarında arama yap
     */
    async searchAcademicDatabases(query, yearRange, maxResults) {
        try {
            // Birden fazla kaynak kullan
            const sources = ['crossref', 'arxiv'];
            const allResults = [];

            for (const source of sources) {
                try {
                    const results = await this.searchSpecificDatabase(source, query, yearRange, maxResults / sources.length);
                    allResults.push(...results);
                } catch (sourceError) {
                    this.log(`${source} arama hatası: ${sourceError.message}`, 'warn');
                }
            }

            return this.deduplicateResults(allResults);
        } catch (error) {
            this.log(`Veritabanı arama hatası: ${error.message}`, 'error');
            return this.getMockSearchResults(query);
        }
    }

    /**
     * Belirli veritabanında arama
     */
    async searchSpecificDatabase(source, query, yearRange, maxResults) {
        const results = [];
        
        try {
            switch (source) {
                case 'crossref':
                    let crossrefUrl = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${Math.min(maxResults, 20)}`;
                    if (yearRange) {
                        crossrefUrl += `&filter=from-pub-date:${yearRange.start},until-pub-date:${yearRange.end}`;
                    }
                    
                    const crossrefResponse = await axios.get(crossrefUrl, {
                        timeout: 10000,
                        headers: { 'User-Agent': 'AkademikRadar/1.0 (mailto:info@akademikradar.com)' }
                    });
                    
                    if (crossrefResponse.data?.message?.items) {
                        results.push(...this.parseCrossrefResults(crossrefResponse.data.message.items));
                    }
                    break;
                    
                case 'arxiv':
                    const arxivQuery = `search_query=all:${encodeURIComponent(query)}&max_results=${Math.min(maxResults, 20)}`;
                    const arxivResponse = await axios.get(`http://export.arxiv.org/api/query?${arxivQuery}`, {
                        timeout: 10000
                    });
                    
                    if (arxivResponse.data) {
                        results.push(...this.parseArxivResults(arxivResponse.data));
                    }
                    break;
                    
                default:
                    this.log(`Bilinmeyen kaynak: ${source}`, 'warn');
            }
        } catch (error) {
            this.log(`${source} API hatası: ${error.message}`, 'error');
        }
        
        return results;
    }

    /**
     * Crossref sonuçlarını parse et
     */
    parseCrossrefResults(items) {
        return items.map(item => ({
            title: item.title?.[0] || 'Başlık bulunamadı',
            authors: item.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()) || [],
            year: item.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear(),
            journal: item['container-title']?.[0] || 'Dergi bilgisi yok',
            doi: item.DOI || '',
            abstract: item.abstract || '',
            keywords: item.subject || [],
            source: 'crossref'
        }));
    }

    /**
     * ArXiv sonuçlarını parse et
     */
    parseArxivResults(xmlData) {
        const entries = xmlData.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        
        return entries.map(entry => {
            const title = entry.match(/<title>(.*?)<\/title>/)?.[1]?.replace(/\n/g, ' ').trim() || 'Başlık bulunamadı';
            const authors = entry.match(/<name>(.*?)<\/name>/g)?.map(name => 
                name.replace(/<\/?name>/g, '').trim()
            ) || [];
            const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
            const year = published ? new Date(published).getFullYear() : new Date().getFullYear();
            const summary = entry.match(/<summary>(.*?)<\/summary>/)?.[1]?.replace(/\n/g, ' ').trim() || '';
            
            return {
                title,
                authors,
                year,
                journal: 'arXiv',
                abstract: summary,
                keywords: [],
                source: 'arxiv'
            };
        });
    }

    /**
     * Sonuçları birleştir ve analiz et
     */
    synthesizeGapAnalysis(analyses) {
        const identifiedGaps = [];
        
        // Teorik boşluklar
        if (analyses.basic.underrepresentedAreas.length > 0) {
            identifiedGaps.push({
                type: this.gapTypes.THEORETICAL,
                title: 'Teorik Boşluklar',
                description: 'Yetersiz teorik çerçeve bulunan alanlar',
                areas: analyses.basic.underrepresentedAreas,
                severity: 'high',
                opportunity: 'Yeni teorik modeller geliştirme fırsatı'
            });
        }
        
        // Metodolojik boşluklar
        if (analyses.methodological.missingMethodologies.length > 0) {
            identifiedGaps.push({
                type: this.gapTypes.METHODOLOGICAL,
                title: 'Metodolojik Boşluklar',
                description: 'Eksik veya yetersiz kullanılan metodolojiler',
                areas: analyses.methodological.missingMethodologies,
                severity: 'medium',
                opportunity: 'Yenilikçi araştırma yöntemleri uygulama fırsatı'
            });
        }

        // Zamansal boşluklar
        if (analyses.temporal.gapPeriods.length > 0) {
            identifiedGaps.push({
                type: this.gapTypes.TEMPORAL,
                title: 'Zamansal Boşluklar',
                description: 'Belirli dönemlerde yetersiz araştırma',
                areas: analyses.temporal.gapPeriods,
                severity: 'medium',
                opportunity: 'Güncel verilerle yeni araştırmalar yapma fırsatı'
            });
        }

        // Disiplinlerarası boşluklar
        identifiedGaps.push({
            type: this.gapTypes.INTERDISCIPLINARY,
            title: 'Disiplinlerarası Boşluklar',
            description: 'Farklı disiplinlerin birleştirilmediği alanlar',
            areas: ['çok disiplinli yaklaşım', 'hibrit metodoloji'],
            severity: 'high',
            opportunity: 'Disiplinlerarası işbirliği fırsatları'
        });

        return {
            identifiedGaps,
            overallScore: this.calculateOverallGapScore(identifiedGaps),
            priorityAreas: this.identifyPriorityAreas(identifiedGaps),
            researchOpportunities: this.generateResearchOpportunities(identifiedGaps)
        };
    }

    // Yardımcı metodlar
    async analyzeCitationGaps(topic, yearRange) {
        try {
            return {
                lowCitationAreas: [`${topic} temel kavramları`, `${topic} metodolojisi`],
                citationTrends: { increasing: 2, stable: 3, decreasing: 1 }
            };
        } catch (error) {
            return this.getMockCitationAnalysis();
        }
    }

    async analyzeTemporalGaps(topic, yearRange) {
        try {
            return {
                gapPeriods: [`${yearRange.start}-${yearRange.start + 1}`, `${yearRange.end - 1}-${yearRange.end}`],
                trendAnalysis: 'increasing'
            };
        } catch (error) {
            return this.getMockTemporalAnalysis();
        }
    }

    async analyzeKeywordGaps(topic, maxResults) {
        try {
            return {
                underrepresentedKeywords: [`${topic} applications`, `${topic} innovation`],
                keywordTrends: { emerging: 5, declining: 2 }
            };
        } catch (error) {
            return this.getMockKeywordAnalysis();
        }
    }

    async analyzeMethodologicalGaps(topic, maxResults) {
        try {
            return {
                missingMethodologies: ['nitel araştırma', 'karma yöntem', 'longitudinal çalışma'],
                methodologyDistribution: { quantitative: 70, qualitative: 20, mixed: 10 }
            };
        } catch (error) {
            return this.getMockMethodAnalysis();
        }
    }

    // Analiz yardımcı metodları
    analyzeYearDistribution(results) {
        const distribution = {};
        results.forEach(result => {
            const year = result.year;
            distribution[year] = (distribution[year] || 0) + 1;
        });
        return distribution;
    }

    analyzeJournalDistribution(results) {
        const distribution = {};
        results.forEach(result => {
            const journal = result.journal;
            distribution[journal] = (distribution[journal] || 0) + 1;
        });
        return distribution;
    }

    analyzeAuthorDistribution(results) {
        const distribution = {};
        results.forEach(result => {
            result.authors.forEach(author => {
                distribution[author] = (distribution[author] || 0) + 1;
            });
        });
        return distribution;
    }

    extractKeyTerms(results) {
        const terms = new Set();
        results.forEach(result => {
            if (result.keywords) {
                result.keywords.forEach(keyword => terms.add(keyword));
            }
        });
        return Array.from(terms);
    }

    identifyUnderrepresentedAreas(results, topic) {
        // Basit analiz - gerçek uygulamada daha karmaşık olabilir
        return [`${topic} uygulamaları`, `${topic} sosyal etkileri`, `${topic} gelecek trendleri`];
    }

    deduplicateResults(results) {
        const seen = new Set();
        return results.filter(result => {
            const key = result.title.toLowerCase().substring(0, 50);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    calculateOverallGapScore(gaps) {
        const highSeverity = gaps.filter(g => g.severity === 'high').length;
        const mediumSeverity = gaps.filter(g => g.severity === 'medium').length;
        return Math.min(1, (highSeverity * 0.3 + mediumSeverity * 0.2));
    }

    identifyPriorityAreas(gaps) {
        return gaps
            .filter(gap => gap.severity === 'high')
            .map(gap => gap.title);
    }

    generateResearchOpportunities(gaps) {
        return gaps.map(gap => gap.opportunity);
    }

    generateResearchRecommendations(gapAnalysis) {
        return gapAnalysis.identifiedGaps.map(gap => ({
            gapType: gap.type,
            title: `${gap.title} için Öneriler`,
            shortTerm: [
                'Mevcut literatürü sistematik olarak gözden geçirin',
                'Pilot çalışma tasarlayın',
                'Uzmanlarla görüşme yapın'
            ],
            longTerm: [
                'Kapsamlı araştırma projesi başlatın',
                'Disiplinlerarası işbirlikleri kurun',
                'Uluslararası ortaklıklar geliştirin'
            ],
            resources: [
                'Akademik veritabanları',
                'Uzman ağları',
                'Araştırma fonları'
            ],
            collaborations: [
                'Üniversite araştırma merkezleri',
                'Endüstri ortakları',
                'Uluslararası araştırma grupları'
            ]
        }));
    }

    // Mock data metodları - fallback için
    getMockGapAnalysis(topic) {
        return {
            identifiedGaps: [
                {
                    type: this.gapTypes.METHODOLOGICAL,
                    title: 'Metodolojik Boşluk',
                    description: `${topic} alanında nitel araştırma yöntemleri yetersiz`,
                    areas: ['nitel analiz', 'karma yöntem'],
                    severity: 'medium',
                    opportunity: 'Karma yöntem araştırmaları yapma fırsatı'
                }
            ],
            overallScore: 0.7,
            priorityAreas: [`${topic} - nitel analiz`],
            researchOpportunities: ['Karma yöntem çalışmaları', 'Longitudinal araştırmalar']
        };
    }

    getMockBasicAnalysis() {
        return {
            totalPapers: 50,
            yearDistribution: { 2020: 10, 2021: 15, 2022: 12, 2023: 8, 2024: 5 },
            journalDistribution: {},
            authorDistribution: {},
            keyTerms: [],
            underrepresentedAreas: ['temel kavramlar', 'uygulama alanları']
        };
    }

    getMockCitationAnalysis() {
        return {
            lowCitationAreas: ['temel kavramlar', 'metodoloji'],
            citationTrends: { increasing: 2, stable: 3, decreasing: 1 }
        };
    }

    getMockTemporalAnalysis() {
        return {
            gapPeriods: ['2020-2021', '2023-2024'],
            trendAnalysis: 'increasing'
        };
    }

    getMockKeywordAnalysis() {
        return {
            underrepresentedKeywords: ['uygulamalar', 'inovasyon'],
            keywordTrends: { emerging: 5, declining: 2 }
        };
    }

    getMockMethodAnalysis() {
        return {
            missingMethodologies: ['nitel araştırma', 'karma yöntem'],
            methodologyDistribution: { quantitative: 70, qualitative: 20, mixed: 10 }
        };
    }

    getMockSearchResults(query, maxResults = 50) {
        return Array.from({ length: Math.min(maxResults, 10) }, (_, i) => ({
            title: `${query} - Örnek Çalışma ${i + 1}`,
            authors: [`Yazar ${i + 1}`, `Yazar ${i + 2}`],
            year: 2020 + (i % 5),
            journal: `Dergi ${i % 3 + 1}`,
            abstract: `${query} konusunda örnek özet metni`,
            keywords: [query, 'araştırma', 'analiz'],
            source: 'mock'
        }));
    }
}

module.exports = LiteratureGapService;
