const express = require('express');
const router = express.Router();
const TrendAnalysisService = require('../services/trendAnalysisService');

// Trend analizi servisini başlat
const trendService = new TrendAnalysisService();

/**
 * @route POST /api/trend-analysis/comprehensive
 * @desc Kapsamlı trend analizi
 * @access Public
 */
router.post('/comprehensive', async (req, res) => {
    try {
        const { query, startYear, endYear, includeProjects, includeFunding, includeCitations } = req.body;

        // Input validation
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir arama sorgusu gereklidir'
            });
        }

        const currentYear = new Date().getFullYear();
        const options = {
            startYear: startYear || (currentYear - 5),
            endYear: endYear || currentYear,
            includeProjects: includeProjects !== false,
            includeFunding: includeFunding !== false,
            includeCitations: includeCitations !== false
        };

        // Yıl validasyonu
        if (options.startYear > options.endYear) {
            return res.status(400).json({
                success: false,
                error: 'Başlangıç yılı bitiş yılından büyük olamaz'
            });
        }

        console.log(`📊 Comprehensive trend analysis request: "${query}" (${options.startYear}-${options.endYear})`);

        const analysisResult = await trendService.performComprehensiveTrendAnalysis(query.trim(), options);

        res.json({
            success: true,
            data: analysisResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Comprehensive trend analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Trend analizi sırasında bir hata oluştu',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route POST /api/trend-analysis/quick-summary
 * @desc Hızlı trend özeti
 * @access Public
 */
router.post('/quick-summary', async (req, res) => {
    try {
        const { query, years, includeKeywords } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir arama sorgusu gereklidir'
            });
        }

        const options = {
            years: years || 5,
            includeKeywords: includeKeywords !== false
        };

        console.log(`⚡ Quick trend summary request: "${query}" (last ${options.years} years)`);

        const summaryResult = await trendService.getQuickTrendSummary(query.trim(), options);

        res.json({
            success: true,
            data: summaryResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Quick trend summary error:', error);
        res.status(500).json({
            success: false,
            error: 'Hızlı trend özeti sırasında bir hata oluştu',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route POST /api/trend-analysis/author
 * @desc Yazar bazlı trend analizi
 * @access Public
 */
router.post('/author', async (req, res) => {
    try {
        const { authorName, startYear, endYear } = req.body;

        if (!authorName || typeof authorName !== 'string' || authorName.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir yazar adı gereklidir'
            });
        }

        const currentYear = new Date().getFullYear();
        const options = {
            startYear: startYear || (currentYear - 10),
            endYear: endYear || currentYear
        };

        console.log(`👤 Author trend analysis request: "${authorName}" (${options.startYear}-${options.endYear})`);

        const authorAnalysis = await trendService.getAuthorTrendAnalysis(authorName.trim(), options);

        res.json({
            success: true,
            data: authorAnalysis,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Author trend analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Yazar trend analizi sırasında bir hata oluştu',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route POST /api/trend-analysis/compare-keywords
 * @desc Anahtar kelime trend karşılaştırması
 * @access Public
 */
router.post('/compare-keywords', async (req, res) => {
    try {
        const { keywords, startYear, endYear } = req.body;

        // Keywords validation
        if (!Array.isArray(keywords) || keywords.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'En az bir anahtar kelime gereklidir'
            });
        }

        if (keywords.length > 5) {
            return res.status(400).json({
                success: false,
                error: 'En fazla 5 anahtar kelime karşılaştırılabilir'
            });
        }

        // Her anahtar kelimenin geçerli olduğunu kontrol et
        const validKeywords = keywords.filter(k => 
            k && typeof k === 'string' && k.trim().length > 0
        ).map(k => k.trim());

        if (validKeywords.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli anahtar kelime bulunamadı'
            });
        }

        const currentYear = new Date().getFullYear();
        const options = {
            startYear: startYear || (currentYear - 5),
            endYear: endYear || currentYear
        };

        console.log(`🔄 Keyword comparison request: [${validKeywords.join(', ')}] (${options.startYear}-${options.endYear})`);

        const comparisonResult = await trendService.compareKeywordTrends(validKeywords, options);

        res.json({
            success: true,
            data: comparisonResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Keyword comparison error:', error);
        res.status(500).json({
            success: false,
            error: 'Anahtar kelime karşılaştırması sırasında bir hata oluştu',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route GET /api/trend-analysis/health
 * @desc Trend analizi servis durumu
 * @access Public
 */
router.get('/health', async (req, res) => {
    try {
        const healthStatus = {
            service: 'TrendAnalysisService',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            availableEndpoints: [
                'POST /comprehensive',
                'POST /quick-summary', 
                'POST /author',
                'POST /compare-keywords',
                'GET /health'
            ],
            dataSources: [
                { name: 'Dimensions.ai', status: 'available' },
                { name: 'OpenAIRE', status: 'available' },
                { name: 'Citation Service', status: 'available' }
            ]
        };

        res.json({
            success: true,
            data: healthStatus
        });

    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            success: false,
            error: 'Servis durumu kontrol edilemedi'
        });
    }
});

/**
 * @route POST /api/trend-analysis/batch
 * @desc Toplu trend analizi (birden fazla sorgu)
 * @access Public
 */
router.post('/batch', async (req, res) => {
    try {
        const { queries, startYear, endYear, analysisType } = req.body;

        if (!Array.isArray(queries) || queries.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'En az bir sorgu gereklidir'
            });
        }

        if (queries.length > 10) {
            return res.status(400).json({
                success: false,
                error: 'En fazla 10 sorgu işlenebilir'
            });
        }

        const validQueries = queries.filter(q => 
            q && typeof q === 'string' && q.trim().length > 0
        ).map(q => q.trim());

        if (validQueries.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli sorgu bulunamadı'
            });
        }

        const currentYear = new Date().getFullYear();
        const options = {
            startYear: startYear || (currentYear - 5),
            endYear: endYear || currentYear
        };

        console.log(`📦 Batch trend analysis request: ${validQueries.length} queries`);

        // Analiz tipine göre farklı metodlar kullan
        let batchResults;
        
        if (analysisType === 'quick') {
            // Hızlı analizler paralel olarak çalıştır
            const quickPromises = validQueries.map(query => 
                trendService.getQuickTrendSummary(query, { years: options.endYear - options.startYear })
                    .catch(err => ({
                        query,
                        error: err.message,
                        status: 'failed'
                    }))
            );
            
            batchResults = await Promise.all(quickPromises);
        } else {
            // Kapsamlı analizler sıralı olarak çalıştır (rate limiting için)
            batchResults = [];
            for (const query of validQueries) {
                try {
                    const result = await trendService.performComprehensiveTrendAnalysis(query, options);
                    batchResults.push(result);
                    
                    // Rate limiting için kısa bekleme
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    batchResults.push({
                        query,
                        error: error.message,
                        status: 'failed'
                    });
                }
            }
        }

        res.json({
            success: true,
            data: {
                totalQueries: validQueries.length,
                results: batchResults,
                analysisType: analysisType || 'comprehensive',
                timeRange: options
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Batch trend analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Toplu trend analizi sırasında bir hata oluştu',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
