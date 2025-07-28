const BaseService = require('./baseService');
const axios = require('axios');

/**
 * Yayınların atıf bilgilerini çeşitli akademik kaynaklardan toplayan servis
 * Mevcut servis yapısına uyumlu olarak tasarlandı
 */
class CitationService extends BaseService {
    constructor() {
        super('CitationService', 1); // Rate limit: 1 request/second
        
        // API endpoints
        this.apis = {
            crossref: 'https://api.crossref.org/works',
            semanticScholar: 'https://api.semanticscholar.org/graph/v1/paper',
            openAlex: 'https://api.openalex.org/works'
        };
    }

    /**
     * Ana atıf bilgisi toplama metodu
     * @param {Object} publication - Yayın bilgileri
     * @returns {Promise<Object>} Atıf bilgileri
     */
    async getCitationInfo(publication) {
        try {
            // Input validation
            if (!publication || !publication.title) {
                console.warn('CitationService: Invalid publication data');
                return this.generateMockCitationData(publication || {});
            }
            
            // MOCK MODE - Devre dışı bırakıldı, gerçek API'ler kullanılıyor
            const MOCK_MODE = false; // Gerçek API'ler aktif
            if (MOCK_MODE) {
                console.log('🎭 MOCK MODE ACTIVE - Returning mock citation data for:', publication.title);
                return this.generateMockCitationData(publication);
            }
            
            console.log('🚀 REAL API MODE - Fetching real citation data for:', publication.title);

            // Rate limiting için delay ekle
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            
            // Sıralı API çağrıları (paralel yerine) - Rate limiting'i önlemek için
            const searchResults = [];
            
            try {
                // Crossref API - İlk çağrı
                console.log('📚 Calling Crossref API...');
                const crossrefResult = await this.searchCrossref(publication).catch(err => {
                    console.log('Crossref search failed:', err.message);
                    return null;
                });
                searchResults.push(crossrefResult);
                await delay(2000); // 2 saniye bekle - Rate limiting için
                
                // Semantic Scholar API - İkinci çağrı
                console.log('🧠 Calling Semantic Scholar API...');
                const semanticResult = await this.searchSemanticScholar(publication).catch(err => {
                    console.log('Semantic Scholar search failed:', err.message);
                    return null;
                });
                searchResults.push(semanticResult);
                await delay(2000); // 2 saniye bekle - Rate limiting için
                
                // OpenAlex API - Üçüncü çağrı
                console.log('🔬 Calling OpenAlex API...');
                const openAlexResult = await this.searchOpenAlex(publication).catch(err => {
                    console.log('OpenAlex search failed:', err.message);
                    return null;
                });
                searchResults.push(openAlexResult);
                
            } catch (error) {
                console.error('Error in sequential API calls:', error);
            }
            
            // Sonuçları Promise.allSettled formatına dönüştür
            const results = searchResults.map(result => ({
                status: result ? 'fulfilled' : 'rejected',
                value: result
            }));
            
            const citationData = {
                title: publication.title,
                author: publication.author || publication.authors,
                citationCount: 0,
                hIndex: null,
                sources: [],
                lastUpdated: new Date().toISOString(),
                details: {}
            };

            // Sonuçları birleştir ve tüm metrikleri maksimize et
            let hasValidData = false;
            let allAuthors = new Set();
            let allConcepts = new Set();
            let bestDoi = null;
            let bestJournal = null;
            let bestPublisher = null;
            let bestPublishedDate = null;
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    const sourceNames = ['Crossref', 'Semantic Scholar', 'OpenAlex'];
                    const sourceName = sourceNames[index];
                    
                    citationData.sources.push(sourceName);
                    citationData.details[sourceName.toLowerCase().replace(' ', '_')] = result.value;
                    
                    // En yüksek atıf sayısını al
                    if (result.value.citationCount && result.value.citationCount > citationData.citationCount) {
                        citationData.citationCount = result.value.citationCount;
                        citationData.primarySource = sourceName;
                        hasValidData = true;
                    }
                    
                    // En yüksek H-index'i al (tüm kaynaklardan)
                    if (result.value.hIndex && result.value.hIndex > (citationData.hIndex || 0)) {
                        citationData.hIndex = result.value.hIndex;
                        console.log(`Updated H-Index from ${sourceName}: ${result.value.hIndex}`);
                    }
                    
                    // Diğer metrikleri birleştir
                    if (result.value.influentialCitationCount) {
                        citationData.influentialCitationCount = Math.max(
                            citationData.influentialCitationCount || 0, 
                            result.value.influentialCitationCount
                        );
                    }
                    
                    if (result.value.referenceCount) {
                        citationData.referenceCount = Math.max(
                            citationData.referenceCount || 0, 
                            result.value.referenceCount
                        );
                    }
                    
                    // En iyi DOI, journal, publisher bilgilerini al
                    if (result.value.doi && !bestDoi) bestDoi = result.value.doi;
                    if (result.value.journal && !bestJournal) bestJournal = result.value.journal;
                    if (result.value.publisher && !bestPublisher) bestPublisher = result.value.publisher;
                    if (result.value.publishedDate && !bestPublishedDate) bestPublishedDate = result.value.publishedDate;
                    
                    // Author bilgilerini birleştir
                    if (result.value.authors && Array.isArray(result.value.authors)) {
                        result.value.authors.forEach(author => {
                            if (author && author.trim()) {
                                allAuthors.add(author.trim());
                            }
                        });
                    }
                    
                    // Concept/subject bilgilerini birleştir
                    if (result.value.concepts && Array.isArray(result.value.concepts)) {
                        result.value.concepts.forEach(concept => {
                            if (concept && concept.trim()) {
                                allConcepts.add(concept.trim());
                            }
                        });
                    }
                    
                    if (result.value.subjects && Array.isArray(result.value.subjects)) {
                        result.value.subjects.forEach(subject => {
                            if (subject && subject.trim()) {
                                allConcepts.add(subject.trim());
                            }
                        });
                    }
                    
                    // Open Access bilgisi
                    if (result.value.isOpenAccess) {
                        citationData.isOpenAccess = true;
                    }
                    
                    if (result.value.openAccessStatus && !citationData.openAccessStatus) {
                        citationData.openAccessStatus = result.value.openAccessStatus;
                    }
                    
                    hasValidData = true;
                }
            });
            
            // Birleştirilmiş bilgileri ekle
            if (bestDoi) citationData.doi = bestDoi;
            if (bestJournal) citationData.journal = bestJournal;
            if (bestPublisher) citationData.publisher = bestPublisher;
            if (bestPublishedDate) citationData.publishedDate = bestPublishedDate;
            
            citationData.authors = Array.from(allAuthors).slice(0, 10); // İlk 10 author
            citationData.concepts = Array.from(allConcepts).slice(0, 8); // İlk 8 concept
            
            // Detaylı yayın bilgilerini details objesine ekle
            let allIdentifiers = {};
            let allAuthorDetails = [];
            let publicationInfo = {};
            
            // Tüm kaynaklardan detaylı bilgileri birleştir
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    // Kimlik bilgilerini birleştir
                    if (result.value.identifiers) {
                        Object.assign(allIdentifiers, result.value.identifiers);
                    }
                    if (result.value.doi && !allIdentifiers.doi) allIdentifiers.doi = result.value.doi;
                    if (result.value.issn && !allIdentifiers.issn) allIdentifiers.issn = result.value.issn;
                    if (result.value.isbn && !allIdentifiers.isbn) allIdentifiers.isbn = result.value.isbn;
                    
                    // Yazar detaylarını birleştir
                    if (result.value.authorDetails && Array.isArray(result.value.authorDetails)) {
                        allAuthorDetails = allAuthorDetails.concat(result.value.authorDetails);
                    }
                    
                    // Yayın bilgilerini birleştir
                    if (result.value.publicationInfo) {
                        Object.assign(publicationInfo, result.value.publicationInfo);
                    }
                }
            });
            
            // Detaylı bilgileri citationData.details'e ekle
            citationData.details.identifiers = allIdentifiers;
            citationData.details.authorDetails = allAuthorDetails.slice(0, 10); // İlk 10 yazar detayı
            citationData.details.publicationInfo = publicationInfo;
            citationData.details.doi = bestDoi;
            citationData.details.journal = bestJournal;
            citationData.details.publisher = bestPublisher;
            citationData.details.publishedDate = bestPublishedDate;
            citationData.details.isOpenAccess = citationData.isOpenAccess;
            citationData.details.openAccessStatus = citationData.openAccessStatus;
            citationData.details.concepts = Array.from(allConcepts).slice(0, 8);
            citationData.details.subjects = Array.from(allConcepts).slice(0, 8);
            
            console.log('📊 Detailed metadata added to citation data:');
            console.log('- Identifiers:', Object.keys(allIdentifiers));
            console.log('- Author details count:', allAuthorDetails.length);
            console.log('- Publication info:', Object.keys(publicationInfo));
            console.log('- DOI:', bestDoi ? 'YES' : 'NO');
            console.log('- Open Access:', citationData.isOpenAccess ? 'YES' : 'NO');
            
            console.log(`Final merged citation data - Citations: ${citationData.citationCount}, H-Index: ${citationData.hIndex}, Authors: ${citationData.authors.length}, Concepts: ${citationData.concepts.length}`);
            

            // API başarı durumunu detaylı logla
            console.log('=== API SUCCESS SUMMARY ===');
            console.log('Crossref result:', searchResults[0] ? 'SUCCESS' : 'FAILED');
            console.log('Semantic Scholar result:', searchResults[1] ? 'SUCCESS' : 'FAILED');
            console.log('OpenAlex result:', searchResults[2] ? 'SUCCESS' : 'FAILED');
            console.log('Has valid data:', hasValidData);
            console.log('Final citation count:', citationData.citationCount);
            console.log('Final H-Index:', citationData.hIndex);
            console.log('==========================');
            
            // Eğer hiç gerçek veri yoksa mock data döndür
            if (!hasValidData) {
                console.log('⚠️ NO REAL DATA AVAILABLE - All APIs failed, returning mock data');
                console.log('Reason: Rate limiting, network errors, or empty responses');
                return this.generateMockCitationData(publication);
            }
            
            console.log('✅ REAL DATA SUCCESS - Returning actual citation data');
            console.log('Sources used:', citationData.sources);
            console.log('Primary source:', citationData.primarySource);

            return citationData;
            
        } catch (error) {
            console.error('CitationService error:', error.message);
            // Hata durumunda mock data döndür
            return this.generateMockCitationData(publication || {});
        }
    }

    /**
     * Crossref API'den atıf bilgisi arar
     */
    async searchCrossref(publication) {
        try {
            if (!publication || !publication.title) {
                return null;
            }

            const searchQuery = this.buildSearchQuery(publication);
            if (!searchQuery || searchQuery.trim().length < 3) {
                return null;
            }

            const url = `${this.apis.crossref}?query=${encodeURIComponent(searchQuery)}&rows=5&select=DOI,title,author,published,container-title,publisher,type,URL,score,is-referenced-by-count,reference-count,subject,ISSN,ISBN`;
            
            const response = await axios.get(url, {
                timeout: 15000, // 15 saniye timeout
                headers: {
                    'User-Agent': 'AkademikRadar/1.0 (mailto:contact@akademikradar.com)',
                    'Accept': 'application/json'
                },
                validateStatus: function (status) {
                    return status >= 200 && status < 500; // 2xx ve 4xx kabul et
                }
            });

            if (response.status !== 200) {
                console.log(`Crossref API returned status: ${response.status}`);
                return null;
            }

            if (response.data?.message?.items?.length > 0) {
                const item = response.data.message.items[0];
                
                // Author bilgilerini çıkar (ORCID dahil)
                let authorNames = [];
                let authorDetails = [];
                if (item.author && item.author.length > 0) {
                    item.author.forEach(author => {
                        const fullName = `${author.given || ''} ${author.family || ''}`.trim();
                        if (fullName.length > 0) {
                            authorNames.push(fullName);
                            authorDetails.push({
                                name: fullName,
                                given: author.given,
                                family: author.family,
                                orcid: author.ORCID || null,
                                affiliation: author.affiliation ? author.affiliation.map(aff => aff.name).join(', ') : null
                            });
                        }
                    });
                }
                
                const result = {
                    citationCount: item['is-referenced-by-count'] || 0,
                    referenceCount: item['reference-count'] || 0,
                    doi: item.DOI,
                    publishedDate: item.published ? item.published['date-parts'][0] : null,
                    journal: item['container-title'] ? item['container-title'][0] : null,
                    publisher: item.publisher,
                    type: item.type,
                    url: item.URL,
                    score: item.score,
                    authors: authorNames,
                    authorDetails: authorDetails, // Detaylı yazar bilgileri (ORCID dahil)
                    subjects: item.subject || [],
                    issn: item.ISSN || [],
                    isbn: item.ISBN || [],
                    // Ek kimlik bilgileri
                    identifiers: {
                        doi: item.DOI,
                        issn: item.ISSN || [],
                        isbn: item.ISBN || [],
                        pmid: item.PMID || null,
                        pmcid: item.PMCID || null
                    }
                };
                
                console.log('Crossref found citation count:', result.citationCount);
                return result;
            }
            
            return null;
        } catch (error) {
            console.log('Crossref API error:', error.message);
            return null;
        }
    }

    /**
     * Semantic Scholar API'den atıf bilgisi arar
     */
    async searchSemanticScholar(publication) {
        try {
            if (!publication || !publication.title) {
                return null;
            }

            const searchQuery = this.buildSearchQuery(publication);
            if (!searchQuery || searchQuery.trim().length < 3) {
                return null;
            }

            const url = `${this.apis.semanticScholar}/search?query=${encodeURIComponent(searchQuery)}&limit=5&fields=citationCount,influentialCitationCount,title,authors,year,venue,externalIds,openAccessPdf,publicationDate,publicationTypes,s2FieldsOfStudy,embedding`;
            
            const response = await axios.get(url, {
                timeout: 15000, // 15 saniye timeout
                headers: {
                    'User-Agent': 'AkademikRadar/1.0 (mailto:contact@akademikradar.com)',
                    'Accept': 'application/json'
                },
                validateStatus: function (status) {
                    return status >= 200 && status < 500; // 2xx ve 4xx kabul et
                }
            });

            if (response.status !== 200) {
                console.log(`Semantic Scholar API returned status: ${response.status}`);
                return null;
            }

            if (response.data?.data?.length > 0) {
                const paper = response.data.data[0];
                
                // H-Index ve detaylı yazar bilgilerini çıkar
                let maxHIndex = 0;
                let authorDetails = [];
                let authorNames = [];
                if (paper.authors && paper.authors.length > 0) {
                    paper.authors.forEach(author => {
                        if (author.hIndex && author.hIndex > maxHIndex) {
                            maxHIndex = author.hIndex;
                        }
                        
                        if (author.name) {
                            authorNames.push(author.name);
                            authorDetails.push({
                                name: author.name,
                                authorId: author.authorId,
                                hIndex: author.hIndex || null,
                                paperCount: author.paperCount || null,
                                citationCount: author.citationCount || null,
                                affiliations: author.affiliations || [],
                                homepage: author.homepage || null,
                                externalIds: author.externalIds || {}
                            });
                        }
                    });
                }
                
                const result = {
                    citationCount: paper.citationCount || 0,
                    influentialCitationCount: paper.influentialCitationCount || 0,
                    hIndex: maxHIndex > 0 ? maxHIndex : null,
                    paperId: paper.paperId,
                    year: paper.year,
                    venue: paper.venue,
                    authors: authorNames,
                    authorDetails: authorDetails, // Detaylı yazar bilgileri
                    externalIds: paper.externalIds,
                    openAccessPdf: paper.openAccessPdf,
                    publicationDate: paper.publicationDate,
                    fieldsOfStudy: paper.s2FieldsOfStudy ? paper.s2FieldsOfStudy.map(f => f.category) : [],
                    // Kimlik bilgileri
                    identifiers: {
                        semanticScholarId: paper.paperId,
                        doi: paper.externalIds?.DOI || null,
                        arxivId: paper.externalIds?.ArXiv || null,
                        pubmedId: paper.externalIds?.PubMed || null,
                        dblpId: paper.externalIds?.DBLP || null,
                        corpusId: paper.externalIds?.CorpusId || null
                    }
                };
                
                console.log('Semantic Scholar found H-Index:', maxHIndex);
                return result;
            }
            
            return null;
        } catch (error) {
            console.log('Semantic Scholar API error:', error.message);
            return null;
        }
    }

    /**
     * OpenAlex API'den atıf bilgisi arar
     */
    async searchOpenAlex(publication) {
        try {
            if (!publication || !publication.title) {
                return null;
            }

            const searchQuery = this.buildSearchQuery(publication);
            if (!searchQuery || searchQuery.trim().length < 3) {
                return null;
            }

            const url = `${this.apis.openAlex}?search=${encodeURIComponent(searchQuery)}&per-page=5&select=id,doi,title,display_name,publication_year,publication_date,primary_location,open_access,authorships,cited_by_count,concepts,type,is_retracted,is_paratext`;
            
            const response = await axios.get(url, {
                timeout: 15000, // 15 saniye timeout
                headers: {
                    'User-Agent': 'AkademikRadar/1.0 (mailto:contact@akademikradar.com)',
                    'Accept': 'application/json'
                },
                validateStatus: function (status) {
                    return status >= 200 && status < 500; // 2xx ve 4xx kabul et
                }
            });

            if (response.status !== 200) {
                console.log(`OpenAlex API returned status: ${response.status}`);
                return null;
            }

            if (response.data?.results?.length > 0) {
                const work = response.data.results[0];
                
                // Author bilgilerinden H-Index ve detaylı bilgileri çıkar
                let maxHIndex = 0;
                let authorNames = [];
                let authorDetails = [];
                if (work.authorships && work.authorships.length > 0) {
                    work.authorships.forEach(authorship => {
                        if (authorship.author) {
                            const author = authorship.author;
                            if (author.display_name) {
                                authorNames.push(author.display_name);
                                
                                // Detaylı yazar bilgilerini topla
                                authorDetails.push({
                                    name: author.display_name,
                                    id: author.id,
                                    orcid: author.orcid || null,
                                    hIndex: author.summary_stats?.h_index || null,
                                    citationCount: author.summary_stats?.cited_by_count || null,
                                    worksCount: author.summary_stats?.works_count || null,
                                    affiliations: authorship.institutions ? authorship.institutions.map(inst => ({
                                        name: inst.display_name,
                                        id: inst.id,
                                        country: inst.country_code,
                                        type: inst.type
                                    })) : [],
                                    rawAffiliationString: authorship.raw_affiliation_string || null
                                });
                            }
                            // OpenAlex'te H-Index genellikle author summary_stats'ta bulunur
                            if (author.summary_stats && author.summary_stats.h_index && author.summary_stats.h_index > maxHIndex) {
                                maxHIndex = author.summary_stats.h_index;
                            }
                        }
                    });
                }
                
                const result = {
                    citationCount: work.cited_by_count || 0,
                    hIndex: maxHIndex > 0 ? maxHIndex : null,
                    doi: work.doi,
                    publishedDate: work.publication_date || work.publication_year,
                    journal: work.primary_location?.source?.display_name,
                    type: work.type,
                    openAccessStatus: work.open_access?.oa_type,
                    isOpenAccess: work.open_access?.is_oa || false,
                    concepts: work.concepts ? work.concepts.slice(0, 5).map(c => c.display_name) : [],
                    authors: authorNames,
                    authorDetails: authorDetails, // Detaylı yazar bilgileri (ORCID, affiliation dahil)
                    isRetracted: work.is_retracted || false,
                    // Kimlik bilgileri
                    identifiers: {
                        openAlexId: work.id,
                        doi: work.doi,
                        pmid: work.ids?.pmid || null,
                        pmcid: work.ids?.pmcid || null,
                        mag: work.ids?.mag || null,
                        openalex: work.ids?.openalex || work.id
                    },
                    // Ek yayın bilgileri
                    publicationInfo: {
                        venue: work.primary_location?.source?.display_name,
                        issn: work.primary_location?.source?.issn || [],
                        publisher: work.primary_location?.source?.publisher || null,
                        isInDoaj: work.primary_location?.source?.is_in_doaj || false,
                        license: work.primary_location?.license || null
                    }
                };
                
                console.log('OpenAlex found H-Index:', maxHIndex);
                return result;
            }
            
            return null;
        } catch (error) {
            console.log('OpenAlex API error:', error.message);
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
        
        if (publication.author || publication.authors) {
            // İlk yazarı ekle
            const authorField = publication.author || publication.authors;
            const firstAuthor = authorField.split(',')[0].split(';')[0].trim();
            query += ` ${firstAuthor}`;
        }
        
        return query;
    }

    /**
     * Mock atıf verisi oluşturur (API'ler çalışmazsa)
     */
    generateMockCitationData(publication) {
        // Başlık ve yazara göre simüle edilmiş atıf sayısı
        const titleLength = publication.title ? publication.title.length : 0;
        const hasAuthor = (publication.author || publication.authors) ? 1 : 0;
        const yearFactor = publication.year ? (2024 - parseInt(publication.year)) : 5;
        
        const baseCitations = Math.floor(Math.random() * 50) + titleLength % 20 + hasAuthor * 10;
        const ageFactor = Math.max(1, yearFactor * 2);
        const mockCitationCount = Math.floor(baseCitations * ageFactor / 5);
        
        return {
            title: publication.title,
            author: publication.author || publication.authors,
            citationCount: mockCitationCount,
            hIndex: Math.floor(mockCitationCount / 10),
            sources: ['Mock Academic Database'],
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

    /**
     * Birden fazla yayın için atıf bilgilerini toplar
     */
    async getCitationInfoBatch(publications) {
        try {
            const citationPromises = publications.map(pub => this.getCitationInfo(pub));
            const results = await Promise.allSettled(citationPromises);
            
            const citationData = results.map((result, index) => ({
                publication: publications[index],
                citationInfo: result.status === 'fulfilled' ? result.value : this.generateMockCitationData(publications[index])
            }));
            
            return {
                success: true,
                results: citationData,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                results: [],
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = CitationService;
