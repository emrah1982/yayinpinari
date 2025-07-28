const express = require('express');
const router = express.Router();
const CitationService = require('../services/citationService');
const { logServiceInfo, logServiceError } = require('../utils/logger');

// Citation service instance
const citationService = new CitationService();

/**
 * Tek bir yayın için atıf bilgisi al
 * POST /api/citations/single
 */
router.post('/single', async (req, res) => {
    try {
        const { title, author, year, doi } = req.body;
        
        if (!title) {
            return res.status(400).json({
                success: false,
                error: 'Başlık (title) gerekli'
            });
        }

        logServiceInfo('CitationAPI', {
            action: 'single_citation_request',
            title: title.substring(0, 50) + '...'
        });

        const citationInfo = await citationService.getCitationInfo({
            title,
            author,
            year,
            doi
        });

        res.json({
            success: true,
            result: citationInfo,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logServiceError('CitationAPI', error);
        res.status(500).json({
            success: false,
            error: 'Atıf bilgisi alınamadı',
            message: error.message
        });
    }
});

/**
 * Birden fazla yayın için atıf bilgisi al
 * POST /api/citations/batch
 */
router.post('/batch', async (req, res) => {
    try {
        const { publications } = req.body;
        
        if (!Array.isArray(publications) || publications.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Yayın listesi (publications) gerekli ve boş olmamalı'
            });
        }

        if (publications.length > 20) {
            return res.status(400).json({
                success: false,
                error: 'Maksimum 20 yayın için atıf bilgisi alınabilir'
            });
        }

        logServiceInfo('CitationAPI', {
            action: 'batch_citation_request',
            count: publications.length
        });

        const result = await citationService.getCitationInfoBatch(publications);

        res.json({
            success: true,
            results: result.results,
            metadata: {
                totalRequested: publications.length,
                totalProcessed: result.results.length,
                timestamp: result.timestamp
            }
        });

    } catch (error) {
        logServiceError('CitationAPI', error);
        res.status(500).json({
            success: false,
            error: 'Toplu atıf bilgisi alınamadı',
            message: error.message
        });
    }
});

/**
 * Mevcut arama sonuçlarına atıf bilgisi ekle
 * POST /api/citations/enrich
 */
router.post('/enrich', async (req, res) => {
    try {
        const { results } = req.body;
        
        if (!Array.isArray(results)) {
            return res.status(400).json({
                success: false,
                error: 'Sonuç listesi (results) gerekli'
            });
        }

        logServiceInfo('CitationAPI', {
            action: 'enrich_results',
            count: results.length
        });

        // Her sonuç için atıf bilgisi ekle
        const enrichedResults = await Promise.all(
            results.map(async (item) => {
                try {
                    const citationInfo = await citationService.getCitationInfo({
                        title: item.title,
                        author: item.author || item.authors,
                        year: item.year || item.publishYear,
                        doi: item.doi
                    });
                    
                    return {
                        ...item,
                        citationInfo: citationInfo
                    };
                } catch (error) {
                    // Atıf bilgisi alınamazsa orijinal item'ı döndür
                    return item;
                }
            })
        );

        res.json({
            success: true,
            results: enrichedResults,
            metadata: {
                originalCount: results.length,
                enrichedCount: enrichedResults.filter(r => r.citationInfo).length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logServiceError('CitationAPI', error);
        res.status(500).json({
            success: false,
            error: 'Sonuçlar zenginleştirilemedi',
            message: error.message
        });
    }
});

/**
 * Citation service durumu
 * GET /api/citations/status
 */
router.get('/status', async (req, res) => {
    try {
        res.json({
            success: true,
            service: 'CitationService',
            status: 'active',
            apis: {
                crossref: 'https://api.crossref.org/works',
                semanticScholar: 'https://api.semanticscholar.org/graph/v1/paper',
                openAlex: 'https://api.openalex.org/works'
            },
            features: [
                'Single publication citation lookup',
                'Batch citation processing',
                'Result enrichment',
                'Multiple API sources',
                'Mock data fallback'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logServiceError('CitationAPI', error);
        res.status(500).json({
            success: false,
            error: 'Servis durumu alınamadı'
        });
    }
});

/**
 * Citation istatistikleri
 * GET /api/citations/stats
 */
router.get('/stats', async (req, res) => {
    try {
        // Basit istatistik simülasyonu
        const stats = {
            totalRequests: Math.floor(Math.random() * 1000) + 100,
            successfulRequests: Math.floor(Math.random() * 900) + 80,
            averageCitationCount: Math.floor(Math.random() * 50) + 10,
            topSources: [
                { name: 'Crossref', usage: '45%' },
                { name: 'Semantic Scholar', usage: '35%' },
                { name: 'OpenAlex', usage: '20%' }
            ],
            lastUpdated: new Date().toISOString()
        };

        res.json({
            success: true,
            stats: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logServiceError('CitationAPI', error);
        res.status(500).json({
            success: false,
            error: 'İstatistikler alınamadı'
        });
    }
});

module.exports = router;
