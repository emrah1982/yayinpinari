const express = require('express');
const Z3950Manager = require('./z3950Manager');
const winston = require('winston');

const router = express.Router();

// Z3950Manager instance'ı oluştur
const z3950Manager = new Z3950Manager();

// Logger yapılandırması
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/z3950-api.log' })
    ]
});

/**
 * Tüm kayıtlı Z3950 servislerini listeler
 * GET /api/z3950/services
 */
router.get('/services', async (req, res) => {
    try {
        const services = z3950Manager.getRegisteredServices();
        const statusInfo = await z3950Manager.checkAllServicesStatus();
        
        res.json({
            success: true,
            services: services,
            status: statusInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Servis listesi hatası: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Servis listesi alınamadı',
            message: error.message
        });
    }
});

/**
 * Tüm servislerde kitap arama yapar
 * POST /api/z3950/search
 * Body: { query: "arama terimi", options: { searchType: "title", count: 10, start: 1 } }
 */
router.post('/search', async (req, res) => {
    try {
        const { query, options = {} } = req.body;
        
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir arama terimi giriniz'
            });
        }

        logger.info(`Z3950 arama isteği: ${query}`);
        
        const results = await z3950Manager.searchAllServices(query.trim(), {
            searchType: options.searchType || 'title',
            count: Math.min(options.count || 10, 50),
            start: options.start || 1
        });

        // PDF istatistiklerini ekle
        if (results.success && results.results.length > 0) {
            const firstService = z3950Manager.services.values().next().value;
            if (firstService) {
                const enhancedResults = await firstService.addPDFStats(results.results);
                results.pdfStats = enhancedResults.pdfStats;
            }
        }

        res.json(results);
    } catch (error) {
        logger.error(`Arama hatası: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Arama gerçekleştirilemedi',
            message: error.message
        });
    }
});

/**
 * Belirli bir serviste kitap arama yapar
 * POST /api/z3950/search/:serviceName
 * Body: { query: "arama terimi", options: { searchType: "title", count: 10, start: 1 } }
 */
router.post('/search/:serviceName', async (req, res) => {
    try {
        const { serviceName } = req.params;
        const { query, options = {} } = req.body;
        
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir arama terimi giriniz'
            });
        }

        const registeredServices = z3950Manager.getRegisteredServices();
        if (!registeredServices.includes(serviceName)) {
            return res.status(404).json({
                success: false,
                error: `Servis bulunamadı: ${serviceName}`,
                availableServices: registeredServices
            });
        }

        logger.info(`${serviceName} servisinde arama: ${query}`);
        
        const results = await z3950Manager.searchInService(serviceName, query.trim(), {
            searchType: options.searchType || 'title',
            count: Math.min(options.count || 10, 50),
            start: options.start || 1
        });

        // PDF istatistiklerini ekle
        if (results.success && results.results.length > 0) {
            const service = z3950Manager.services.get(serviceName);
            if (service) {
                const enhancedResults = await service.addPDFStats(results.results);
                results.pdfStats = enhancedResults.pdfStats;
            }
        }

        res.json(results);
    } catch (error) {
        logger.error(`${req.params.serviceName} servisinde arama hatası: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Arama gerçekleştirilemedi',
            message: error.message
        });
    }
});

/**
 * ISBN ile kitap arama (tüm servislerde)
 * GET /api/z3950/isbn/:isbn
 */
router.get('/isbn/:isbn', async (req, res) => {
    try {
        const { isbn } = req.params;
        
        // ISBN formatını kontrol et (basit kontrol)
        const cleanISBN = isbn.replace(/[-\s]/g, '');
        if (!/^\d{10}(\d{3})?$/.test(cleanISBN)) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir ISBN numarası giriniz (10 veya 13 haneli)'
            });
        }

        logger.info(`ISBN araması: ${isbn}`);
        
        const results = await z3950Manager.searchAllServices(isbn, {
            searchType: 'isbn',
            count: 10
        });

        res.json(results);
    } catch (error) {
        logger.error(`ISBN arama hatası: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'ISBN araması gerçekleştirilemedi',
            message: error.message
        });
    }
});

/**
 * Belirli bir serviste ISBN ile arama
 * GET /api/z3950/:serviceName/isbn/:isbn
 */
router.get('/:serviceName/isbn/:isbn', async (req, res) => {
    try {
        const { serviceName, isbn } = req.params;
        
        const registeredServices = z3950Manager.getRegisteredServices();
        if (!registeredServices.includes(serviceName)) {
            return res.status(404).json({
                success: false,
                error: `Servis bulunamadı: ${serviceName}`,
                availableServices: registeredServices
            });
        }

        // ISBN formatını kontrol et
        const cleanISBN = isbn.replace(/[-\s]/g, '');
        if (!/^\d{10}(\d{3})?$/.test(cleanISBN)) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir ISBN numarası giriniz (10 veya 13 haneli)'
            });
        }

        logger.info(`${serviceName} servisinde ISBN araması: ${isbn}`);
        
        const results = await z3950Manager.searchByISBN(serviceName, isbn);
        res.json(results);
    } catch (error) {
        logger.error(`${req.params.serviceName} servisinde ISBN arama hatası: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'ISBN araması gerçekleştirilemedi',
            message: error.message
        });
    }
});

/**
 * Yazar adı ile arama (tüm servislerde)
 * POST /api/z3950/author
 * Body: { author: "yazar adı", options: { count: 10, start: 1 } }
 */
router.post('/author', async (req, res) => {
    try {
        const { author, options = {} } = req.body;
        
        if (!author || typeof author !== 'string' || author.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir yazar adı giriniz'
            });
        }

        logger.info(`Yazar araması: ${author}`);
        
        const results = await z3950Manager.searchAllServices(author.trim(), {
            searchType: 'author',
            count: Math.min(options.count || 10, 50),
            start: options.start || 1
        });

        res.json(results);
    } catch (error) {
        logger.error(`Yazar arama hatası: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Yazar araması gerçekleştirilemedi',
            message: error.message
        });
    }
});

/**
 * Konu ile arama (tüm servislerde)
 * POST /api/z3950/subject
 * Body: { subject: "konu", options: { count: 10, start: 1 } }
 */
router.post('/subject', async (req, res) => {
    try {
        const { subject, options = {} } = req.body;
        
        if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir konu giriniz'
            });
        }

        logger.info(`Konu araması: ${subject}`);
        
        const results = await z3950Manager.searchAllServices(subject.trim(), {
            searchType: 'subject',
            count: Math.min(options.count || 10, 50),
            start: options.start || 1
        });

        res.json(results);
    } catch (error) {
        logger.error(`Konu arama hatası: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Konu araması gerçekleştirilemedi',
            message: error.message
        });
    }
});

/**
 * Servis durumlarını kontrol eder
 * GET /api/z3950/status
 */
router.get('/status', async (req, res) => {
    try {
        const status = await z3950Manager.checkAllServicesStatus();
        res.json({
            success: true,
            ...status
        });
    } catch (error) {
        logger.error(`Durum kontrolü hatası: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Servis durumu kontrol edilemedi',
            message: error.message
        });
    }
});

/**
 * Gelişmiş arama (birden fazla kritere göre)
 * POST /api/z3950/advanced-search
 * Body: { 
 *   title: "başlık", 
 *   author: "yazar", 
 *   subject: "konu", 
 *   isbn: "isbn",
 *   options: { count: 10, start: 1 }
 * }
 */
router.post('/advanced-search', async (req, res) => {
    try {
        const { title, author, subject, isbn, options = {} } = req.body;
        
        // En az bir arama kriteri olmalı
        if (!title && !author && !subject && !isbn) {
            return res.status(400).json({
                success: false,
                error: 'En az bir arama kriteri giriniz (başlık, yazar, konu veya ISBN)'
            });
        }

        // Arama terimlerini birleştir
        const searchTerms = [];
        if (title) searchTerms.push(`title:"${title}"`);
        if (author) searchTerms.push(`author:"${author}"`);
        if (subject) searchTerms.push(`subject:"${subject}"`);
        if (isbn) searchTerms.push(`isbn:"${isbn}"`);
        
        const combinedQuery = searchTerms.join(' AND ');
        
        logger.info(`Gelişmiş arama: ${combinedQuery}`);
        
        const results = await z3950Manager.searchAllServices(combinedQuery, {
            searchType: 'keyword',
            count: Math.min(options.count || 10, 50),
            start: options.start || 1
        });

        res.json(results);
    } catch (error) {
        logger.error(`Gelişmiş arama hatası: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Gelişmiş arama gerçekleştirilemedi',
            message: error.message
        });
    }
});

/**
 * PDF erişim bilgilerini getirir
 * POST /api/z3950/pdf-access
 * Body: { books: [{ title: "...", author: "...", ... }] }
 */
router.post('/pdf-access', async (req, res) => {
    try {
        const { books } = req.body;
        
        if (!books || !Array.isArray(books) || books.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir kitap listesi giriniz'
            });
        }

        logger.info(`PDF erişim sorgusu: ${books.length} kitap`);
        
        const PDFAccessService = require('./pdfAccessService');
        const pdfService = new PDFAccessService();
        
        const pdfResults = [];
        for (const book of books) {
            const pdfAccess = await pdfService.findPDFLinks(book);
            pdfResults.push({
                book: book,
                pdfAccess: pdfAccess
            });
        }
        
        const pdfStats = pdfService.getPDFAccessStats(pdfResults.map(r => ({ pdfAccess: r.pdfAccess })));
        
        res.json({
            success: true,
            results: pdfResults,
            pdfStats: pdfStats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`PDF erişim hatası: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'PDF erişim bilgileri alınamadı',
            message: error.message
        });
    }
});

/**
 * PDF linkinin geçerliliğini kontrol eder
 * POST /api/z3950/verify-pdf
 * Body: { pdfUrl: "https://example.com/paper.pdf" }
 */
router.post('/verify-pdf', async (req, res) => {
    try {
        const { pdfUrl } = req.body;
        
        if (!pdfUrl || typeof pdfUrl !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir PDF URL\'si giriniz'
            });
        }

        logger.info(`PDF link doğrulama: ${pdfUrl}`);
        
        const PDFAccessService = require('./pdfAccessService');
        const pdfService = new PDFAccessService();
        
        const isValid = await pdfService.verifyPDFLink(pdfUrl);
        
        res.json({
            success: true,
            pdfUrl: pdfUrl,
            isValid: isValid,
            checkedAt: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`PDF doğrulama hatası: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'PDF linki doğrulanamadı',
            message: error.message
        });
    }
});

/**
 * PDF erişim istatistiklerini getirir
 * GET /api/z3950/pdf-stats
 */
router.get('/pdf-stats', async (req, res) => {
    try {
        // Son aramalardan PDF istatistiklerini topla (simüle edilmiş)
        const mockStats = {
            totalSearches: 150,
            booksWithPDF: 89,
            freeAccess: 45,
            subscriptionAccess: 32,
            purchaseAccess: 12,
            accessRate: 59.3,
            topSources: {
                'arXiv': 28,
                'PubMed Central': 22,
                'Semantic Scholar': 18,
                'DOAJ': 15,
                'Other': 6
            },
            lastUpdated: new Date().toISOString()
        };
        
        res.json({
            success: true,
            pdfStats: mockStats
        });
    } catch (error) {
        logger.error(`PDF istatistik hatası: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'PDF istatistikleri alınamadı',
            message: error.message
        });
    }
});

/**
 * Hata yakalama middleware'i
 */
router.use((error, req, res, next) => {
    logger.error(`Z3950 API hatası: ${error.message}`);
    res.status(500).json({
        success: false,
        error: 'Sunucu hatası',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Bir hata oluştu'
    });
});

module.exports = router;
