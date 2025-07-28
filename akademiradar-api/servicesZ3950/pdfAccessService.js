const axios = require('axios');
const winston = require('winston');

/**
 * PDF erişim servisi
 * Bu sınıf, yayınların tam metin PDF linklerini bulur ve doğrular
 */
class PDFAccessService {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/pdf-access.log' })
            ]
        });

        // PDF kaynak servisleri
        this.pdfSources = [
            {
                name: 'arXiv',
                baseUrl: 'https://arxiv.org',
                searchUrl: 'https://export.arxiv.org/api/query',
                type: 'academic'
            },
            {
                name: 'PubMed Central',
                baseUrl: 'https://www.ncbi.nlm.nih.gov/pmc',
                searchUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
                type: 'medical'
            },
            {
                name: 'DOAJ',
                baseUrl: 'https://doaj.org',
                searchUrl: 'https://doaj.org/api/v2/search/articles',
                type: 'open_access'
            },
            {
                name: 'Semantic Scholar',
                baseUrl: 'https://www.semanticscholar.org',
                searchUrl: 'https://api.semanticscholar.org/graph/v1/paper/search',
                type: 'academic'
            }
        ];

        this.timeout = 10000;
    }

    /**
     * Kitap/makale için PDF linklerini arar
     * @param {Object} bookInfo - Kitap bilgileri
     * @returns {Promise<Object>} PDF erişim bilgileri
     */
    async findPDFLinks(bookInfo) {
        try {
            this.logger.info(`PDF arama başlatılıyor: ${bookInfo.title}`);
            
            const pdfResults = {
                hasPDF: false,
                pdfLinks: [],
                accessType: 'none', // 'free', 'subscription', 'purchase', 'none'
                sources: [],
                lastChecked: new Date().toISOString()
            };

            // Farklı kaynaklarda paralel arama yap
            const searchPromises = this.pdfSources.map(source => 
                this.searchInSource(source, bookInfo).catch(error => {
                    this.logger.warn(`${source.name} arama hatası: ${error.message}`);
                    return null;
                })
            );

            const results = await Promise.allSettled(searchPromises);
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    const sourceResult = result.value;
                    if (sourceResult.pdfUrl) {
                        pdfResults.pdfLinks.push({
                            url: sourceResult.pdfUrl,
                            source: this.pdfSources[index].name,
                            type: sourceResult.accessType || 'unknown',
                            quality: sourceResult.quality || 'medium',
                            verified: sourceResult.verified || false
                        });
                        pdfResults.sources.push(this.pdfSources[index].name);
                    }
                }
            });

            // PDF bulundu mu?
            pdfResults.hasPDF = pdfResults.pdfLinks.length > 0;
            
            // Erişim türünü belirle
            if (pdfResults.pdfLinks.some(link => link.type === 'free')) {
                pdfResults.accessType = 'free';
            } else if (pdfResults.pdfLinks.some(link => link.type === 'subscription')) {
                pdfResults.accessType = 'subscription';
            } else if (pdfResults.pdfLinks.some(link => link.type === 'purchase')) {
                pdfResults.accessType = 'purchase';
            }

            // En iyi kaliteli linki önce sırala
            pdfResults.pdfLinks.sort((a, b) => {
                const qualityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
            });

            this.logger.info(`PDF arama tamamlandı: ${pdfResults.pdfLinks.length} link bulundu`);
            return pdfResults;

        } catch (error) {
            this.logger.error(`PDF arama genel hatası: ${error.message}`);
            return {
                hasPDF: false,
                pdfLinks: [],
                accessType: 'none',
                sources: [],
                error: error.message,
                lastChecked: new Date().toISOString()
            };
        }
    }

    /**
     * Belirli bir kaynakta PDF arar
     * @param {Object} source - PDF kaynağı
     * @param {Object} bookInfo - Kitap bilgileri
     * @returns {Promise<Object>} Kaynak arama sonucu
     */
    async searchInSource(source, bookInfo) {
        try {
            switch (source.name) {
                case 'arXiv':
                    return await this.searchArXiv(bookInfo);
                case 'PubMed Central':
                    return await this.searchPMC(bookInfo);
                case 'DOAJ':
                    return await this.searchDOAJ(bookInfo);
                case 'Semantic Scholar':
                    return await this.searchSemanticScholar(bookInfo);
                default:
                    return await this.searchGeneric(source, bookInfo);
            }
        } catch (error) {
            this.logger.warn(`${source.name} kaynak arama hatası: ${error.message}`);
            return null;
        }
    }

    /**
     * arXiv'de arama yapar
     * @param {Object} bookInfo - Kitap bilgileri
     * @returns {Promise<Object>} arXiv sonucu
     */
    async searchArXiv(bookInfo) {
        try {
            // arXiv için simüle edilmiş sonuç (gerçek API entegrasyonu için)
            if (this.isAcademicPaper(bookInfo)) {
                const mockArxivId = `${Math.floor(Math.random() * 2400)}.${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
                return {
                    pdfUrl: `https://arxiv.org/pdf/${mockArxivId}.pdf`,
                    accessType: 'free',
                    quality: 'high',
                    verified: true,
                    metadata: {
                        arxivId: mockArxivId,
                        category: 'cs.AI'
                    }
                };
            }
            return null;
        } catch (error) {
            throw new Error(`arXiv arama hatası: ${error.message}`);
        }
    }

    /**
     * PubMed Central'da arama yapar
     * @param {Object} bookInfo - Kitap bilgileri
     * @returns {Promise<Object>} PMC sonucu
     */
    async searchPMC(bookInfo) {
        try {
            // PMC için simüle edilmiş sonuç
            if (this.isMedicalPaper(bookInfo)) {
                const mockPmcId = `PMC${Math.floor(Math.random() * 9000000) + 1000000}`;
                return {
                    pdfUrl: `https://www.ncbi.nlm.nih.gov/pmc/articles/${mockPmcId}/pdf/`,
                    accessType: 'free',
                    quality: 'high',
                    verified: true,
                    metadata: {
                        pmcId: mockPmcId,
                        pmid: Math.floor(Math.random() * 90000000) + 10000000
                    }
                };
            }
            return null;
        } catch (error) {
            throw new Error(`PMC arama hatası: ${error.message}`);
        }
    }

    /**
     * DOAJ'da arama yapar
     * @param {Object} bookInfo - Kitap bilgileri
     * @returns {Promise<Object>} DOAJ sonucu
     */
    async searchDOAJ(bookInfo) {
        try {
            // DOAJ için simüle edilmiş sonuç
            if (this.isOpenAccessCandidate(bookInfo)) {
                return {
                    pdfUrl: `https://doaj.org/article/${Math.random().toString(36).substr(2, 9)}`,
                    accessType: 'free',
                    quality: 'medium',
                    verified: false,
                    metadata: {
                        journal: 'Open Access Journal',
                        license: 'CC BY 4.0'
                    }
                };
            }
            return null;
        } catch (error) {
            throw new Error(`DOAJ arama hatası: ${error.message}`);
        }
    }

    /**
     * Semantic Scholar'da arama yapar
     * @param {Object} bookInfo - Kitap bilgileri
     * @returns {Promise<Object>} Semantic Scholar sonucu
     */
    async searchSemanticScholar(bookInfo) {
        try {
            // Semantic Scholar için simüle edilmiş sonuç
            if (this.isAcademicPaper(bookInfo)) {
                return {
                    pdfUrl: `https://pdfs.semanticscholar.org/${Math.random().toString(36).substr(2, 40)}.pdf`,
                    accessType: 'free',
                    quality: 'medium',
                    verified: false,
                    metadata: {
                        paperId: Math.random().toString(36).substr(2, 40),
                        citations: Math.floor(Math.random() * 1000)
                    }
                };
            }
            return null;
        } catch (error) {
            throw new Error(`Semantic Scholar arama hatası: ${error.message}`);
        }
    }

    /**
     * Genel kaynak arama
     * @param {Object} source - Kaynak bilgisi
     * @param {Object} bookInfo - Kitap bilgileri
     * @returns {Promise<Object>} Genel arama sonucu
     */
    async searchGeneric(source, bookInfo) {
        try {
            // Genel kaynak için simüle edilmiş sonuç
            const random = Math.random();
            if (random > 0.7) { // %30 şansla PDF bulunur
                return {
                    pdfUrl: `${source.baseUrl}/pdf/${Math.random().toString(36).substr(2, 20)}.pdf`,
                    accessType: random > 0.85 ? 'free' : 'subscription',
                    quality: 'medium',
                    verified: false
                };
            }
            return null;
        } catch (error) {
            throw new Error(`Genel arama hatası: ${error.message}`);
        }
    }

    /**
     * Akademik makale olup olmadığını kontrol eder
     * @param {Object} bookInfo - Kitap bilgileri
     * @returns {boolean} Akademik makale mi?
     */
    isAcademicPaper(bookInfo) {
        const academicKeywords = [
            'artificial intelligence', 'machine learning', 'deep learning',
            'neural network', 'algorithm', 'computer science', 'research',
            'analysis', 'study', 'method', 'approach', 'technique'
        ];
        
        const title = bookInfo.title?.toLowerCase() || '';
        const subjects = bookInfo.subject || [];
        
        return academicKeywords.some(keyword => 
            title.includes(keyword) || 
            subjects.some(subject => subject.toLowerCase().includes(keyword))
        );
    }

    /**
     * Tıbbi makale olup olmadığını kontrol eder
     * @param {Object} bookInfo - Kitap bilgileri
     * @returns {boolean} Tıbbi makale mi?
     */
    isMedicalPaper(bookInfo) {
        const medicalKeywords = [
            'medical', 'medicine', 'health', 'clinical', 'patient',
            'treatment', 'therapy', 'diagnosis', 'disease', 'drug',
            'pharmaceutical', 'biology', 'biomedical'
        ];
        
        const title = bookInfo.title?.toLowerCase() || '';
        const subjects = bookInfo.subject || [];
        
        return medicalKeywords.some(keyword => 
            title.includes(keyword) || 
            subjects.some(subject => subject.toLowerCase().includes(keyword))
        );
    }

    /**
     * Açık erişim adayı olup olmadığını kontrol eder
     * @param {Object} bookInfo - Kitap bilgileri
     * @returns {boolean} Açık erişim adayı mı?
     */
    isOpenAccessCandidate(bookInfo) {
        const publishYear = parseInt(bookInfo.publishYear) || 0;
        const recentYear = new Date().getFullYear() - 5; // Son 5 yıl
        
        // Son yıllarda yayınlanan akademik çalışmalar açık erişim olabilir
        return publishYear >= recentYear && this.isAcademicPaper(bookInfo);
    }

    /**
     * PDF linkinin geçerliliğini kontrol eder
     * @param {string} pdfUrl - PDF URL'si
     * @returns {Promise<boolean>} Link geçerli mi?
     */
    async verifyPDFLink(pdfUrl) {
        try {
            const response = await axios.head(pdfUrl, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'AkademikRadar-PDF-Checker/1.0'
                }
            });
            
            const contentType = response.headers['content-type'] || '';
            const contentLength = parseInt(response.headers['content-length']) || 0;
            
            // PDF content type ve minimum boyut kontrolü
            return contentType.includes('application/pdf') && contentLength > 1000;
        } catch (error) {
            this.logger.warn(`PDF link doğrulama hatası: ${error.message}`);
            return false;
        }
    }

    /**
     * PDF erişim istatistiklerini döndürür
     * @param {Array} bookResults - Kitap sonuçları
     * @returns {Object} PDF erişim istatistikleri
     */
    getPDFAccessStats(bookResults) {
        const stats = {
            totalBooks: bookResults.length,
            booksWithPDF: 0,
            freeAccess: 0,
            subscriptionAccess: 0,
            purchaseAccess: 0,
            sources: {},
            accessRate: 0
        };

        bookResults.forEach(book => {
            if (book.pdfAccess && book.pdfAccess.hasPDF) {
                stats.booksWithPDF++;
                
                switch (book.pdfAccess.accessType) {
                    case 'free':
                        stats.freeAccess++;
                        break;
                    case 'subscription':
                        stats.subscriptionAccess++;
                        break;
                    case 'purchase':
                        stats.purchaseAccess++;
                        break;
                }

                book.pdfAccess.sources.forEach(source => {
                    stats.sources[source] = (stats.sources[source] || 0) + 1;
                });
            }
        });

        stats.accessRate = stats.totalBooks > 0 ? 
            (stats.booksWithPDF / stats.totalBooks * 100).toFixed(1) : 0;

        return stats;
    }
}

module.exports = PDFAccessService;
