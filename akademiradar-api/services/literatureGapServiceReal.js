const axios = require('axios');
const BaseService = require('./baseService');

/**
 * Literatür Boşluğu Tespit Servisi - Gerçek Veri Entegrasyonu
 * Akademik literatürde boşlukları tespit etmek için gerçek API'ler kullanır
 */
class LiteratureGapServiceReal extends BaseService {
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
     */
    async analyzeLiteratureGaps(topic, options = {}) {
        try {
            this.log(`Literatür boşluğu analizi başlatılıyor: ${topic}`);
            
            const {
                yearRange = { start: 2019, end: new Date().getFullYear() },
                maxResults = 100
            } = options;

            // Gerçek API'lerden veri topla
            const searchResults = await this.searchRealAcademicDatabases(topic, yearRange, maxResults);
            
            // Boşluk analizi yap
            const gapAnalysis = this.analyzeGapsFromRealData(searchResults, topic);

            this.log(`Literatür boşluğu analizi tamamlandı. ${gapAnalysis.identifiedGaps.length} boşluk tespit edildi.`);
            
            return {
                success: true,
                topic,
                analysisDate: new Date().toISOString(),
                totalGapsFound: gapAnalysis.identifiedGaps.length,
                gapAnalysis,
                recommendations: this.generateRecommendations(gapAnalysis)
            };

        } catch (error) {
            this.log(`Literatür boşluğu analizi hatası: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Gerçek akademik veritabanlarında arama
     */
    async searchRealAcademicDatabases(topic, yearRange, maxResults) {
        const allResults = [];
        const sources = ['crossref', 'arxiv'];
        const resultsPerSource = Math.floor(maxResults / sources.length);

        for (const source of sources) {
            try {
                const results = await this.searchSpecificDatabase(source, topic, yearRange, resultsPerSource);
                allResults.push(...results);
                this.log(`${source} kaynağından ${results.length} sonuç alındı`);
            } catch (error) {
                this.log(`${source} arama hatası: ${error.message}`, 'warn');
            }
        }

        return this.deduplicateResults(allResults);
    }

    /**
     * Belirli veritabanında arama
     */
    async searchSpecificDatabase(source, query, yearRange, maxResults) {
        const results = [];
        
        try {
            switch (source) {
                case 'crossref':
                    let crossrefUrl = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${maxResults}`;
                    if (yearRange) {
                        crossrefUrl += `&filter=from-pub-date:${yearRange.start},until-pub-date:${yearRange.end}`;
                    }
                    
                    const crossrefResponse = await axios.get(crossrefUrl, {
                        timeout: 15000,
                        headers: { 'User-Agent': 'AkademikRadar/1.0 (mailto:info@akademikradar.com)' }
                    });
                    
                    if (crossrefResponse.data?.message?.items) {
                        results.push(...this.parseCrossrefResults(crossrefResponse.data.message.items));
                    }
                    break;
                    
                case 'arxiv':
                    const arxivQuery = `search_query=all:${encodeURIComponent(query)}&max_results=${maxResults}`;
                    const arxivResponse = await axios.get(`http://export.arxiv.org/api/query?${arxivQuery}`, {
                        timeout: 15000
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
     * Gerçek verilerden boşluk analizi
     */
    analyzeGapsFromRealData(searchResults, topic) {
        const identifiedGaps = [];
        
        // Yıl dağılımı analizi
        const yearDistribution = this.analyzeYearDistribution(searchResults);
        const recentYears = Object.keys(yearDistribution).filter(year => year >= 2022).length;
        
        if (recentYears < 2) {
            identifiedGaps.push({
                type: this.gapTypes.TEMPORAL,
                title: 'Zamansal Boşluk',
                description: `${topic} alanında son yıllarda yeterli çalışma bulunmuyor`,
                areas: ['güncel araştırmalar', 'son gelişmeler'],
                severity: 'high',
                opportunity: 'Güncel verilerle yeni araştırmalar yapma fırsatı'
            });
        }

        // Metodoloji analizi
        const methodologies = this.extractMethodologies(searchResults);
        if (methodologies.length < 3) {
            identifiedGaps.push({
                type: this.gapTypes.METHODOLOGICAL,
                title: 'Metodolojik Boşluk',
                description: `${topic} alanında metodoloji çeşitliliği yetersiz`,
                areas: ['nitel yöntemler', 'karma yaklaşım', 'deneysel tasarım'],
                severity: 'medium',
                opportunity: 'Yenilikçi araştırma yöntemleri uygulama fırsatı'
            });
        }

        // Anahtar kelime analizi
        const keywords = this.extractKeywords(searchResults);
        const uniqueKeywords = [...new Set(keywords)];
        
        if (uniqueKeywords.length < 10) {
            identifiedGaps.push({
                type: this.gapTypes.THEORETICAL,
                title: 'Teorik Boşluk',
                description: `${topic} alanında teorik çeşitlilik yetersiz`,
                areas: ['kavramsal çerçeveler', 'teorik modeller'],
                severity: 'high',
                opportunity: 'Yeni teorik yaklaşımlar geliştirme fırsatı'
            });
        }

        // Disiplinlerarası analiz
        const disciplines = this.extractDisciplines(searchResults);
        if (disciplines.length < 2) {
            identifiedGaps.push({
                type: this.gapTypes.INTERDISCIPLINARY,
                title: 'Disiplinlerarası Boşluk',
                description: `${topic} alanında disiplinler arası çalışmalar yetersiz`,
                areas: ['çok disiplinli yaklaşım', 'hibrit metodoloji'],
                severity: 'high',
                opportunity: 'Disiplinlerarası işbirliği fırsatları'
            });
        }

        return {
            identifiedGaps,
            overallScore: this.calculateGapScore(identifiedGaps),
            priorityAreas: this.identifyPriorityAreas(identifiedGaps, topic),
            researchOpportunities: this.generateResearchOpportunities(identifiedGaps)
        };
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
        // XML parsing için basit regex kullanımı
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
     * Yardımcı metodlar
     */
    analyzeYearDistribution(results) {
        const distribution = {};
        results.forEach(result => {
            const year = result.year;
            distribution[year] = (distribution[year] || 0) + 1;
        });
        return distribution;
    }

    extractMethodologies(results) {
        const methodologies = new Set();
        results.forEach(result => {
            const text = `${result.title} ${result.abstract}`.toLowerCase();
            if (text.includes('survey') || text.includes('anket')) methodologies.add('survey');
            if (text.includes('experiment') || text.includes('deney')) methodologies.add('experimental');
            if (text.includes('case study') || text.includes('vaka')) methodologies.add('case_study');
            if (text.includes('qualitative') || text.includes('nitel')) methodologies.add('qualitative');
            if (text.includes('quantitative') || text.includes('nicel')) methodologies.add('quantitative');
        });
        return Array.from(methodologies);
    }

    extractKeywords(results) {
        const keywords = [];
        results.forEach(result => {
            if (result.keywords) {
                keywords.push(...result.keywords);
            }
        });
        return keywords;
    }

    extractDisciplines(results) {
        const disciplines = new Set();
        results.forEach(result => {
            const text = `${result.title} ${result.abstract} ${result.journal}`.toLowerCase();
            if (text.includes('computer') || text.includes('bilgisayar')) disciplines.add('computer_science');
            if (text.includes('engineering') || text.includes('mühendislik')) disciplines.add('engineering');
            if (text.includes('medicine') || text.includes('tıp')) disciplines.add('medicine');
            if (text.includes('psychology') || text.includes('psikoloji')) disciplines.add('psychology');
            if (text.includes('agriculture') || text.includes('tarım')) disciplines.add('agriculture');
        });
        return Array.from(disciplines);
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

    calculateGapScore(gaps) {
        const highSeverity = gaps.filter(g => g.severity === 'high').length;
        const mediumSeverity = gaps.filter(g => g.severity === 'medium').length;
        return Math.min(1, (highSeverity * 0.3 + mediumSeverity * 0.2) / gaps.length);
    }

    identifyPriorityAreas(gaps, topic) {
        return gaps
            .filter(gap => gap.severity === 'high')
            .map(gap => `${topic} - ${gap.title.toLowerCase()}`);
    }

    generateResearchOpportunities(gaps) {
        return gaps.map(gap => gap.opportunity);
    }

    generateRecommendations(gapAnalysis) {
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
            ]
        }));
    }
}

module.exports = LiteratureGapServiceReal;
