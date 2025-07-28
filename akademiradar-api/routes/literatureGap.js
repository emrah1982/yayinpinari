const express = require('express');
const router = express.Router();
const LiteratureGapService = require('../services/literatureGapServiceAdvanced');
const LiteratureTrendService = require('../services/literatureTrendService');
const LiteratureComparisonService = require('../services/literatureComparisonService');

// Servis örnekleri
const gapService = new LiteratureGapService();
const trendService = new LiteratureTrendService();
const comparisonService = new LiteratureComparisonService();

/**
 * POST /api/literature-gap/analyze
 * Literatür boşluğu analizi yapar
 */
router.post('/analyze', async (req, res) => {
    try {
        const { topic, options = {} } = req.body;
        
        if (!topic) {
            return res.status(400).json({
                success: false,
                error: 'Konu (topic) parametresi gereklidir'
            });
        }

        console.log(`Literatür boşluğu analizi başlatılıyor: ${topic}`);
        
        const result = await gapService.analyzeLiteratureGaps(topic, options);
        
        res.json(result);
    } catch (error) {
        console.error('Literatür boşluğu analizi hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Literatür boşluğu analizi sırasında hata oluştu',
            details: error.message
        });
    }
});

/**
 * POST /api/literature-gap/trends
 * Literatür trend analizi yapar
 */
router.post('/trends', async (req, res) => {
    try {
        const { topic, options = {} } = req.body;
        
        if (!topic) {
            return res.status(400).json({
                success: false,
                error: 'Konu (topic) parametresi gereklidir'
            });
        }

        console.log(`Literatür trend analizi başlatılıyor: ${topic}`);
        
        const result = await trendService.analyzeLiteratureTrends(topic, options);
        
        res.json(result);
    } catch (error) {
        console.error('Literatür trend analizi hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Literatür trend analizi sırasında hata oluştu',
            details: error.message
        });
    }
});

/**
 * POST /api/literature-gap/compare-topics
 * Konular arası karşılaştırma yapar
 */
router.post('/compare-topics', async (req, res) => {
    try {
        const { topics, options = {} } = req.body;
        
        if (!topics || !Array.isArray(topics) || topics.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'En az 2 konu gereklidir (topics array)'
            });
        }

        console.log(`Konu karşılaştırması başlatılıyor: ${topics.join(' vs ')}`);
        
        const result = await comparisonService.compareTopics(topics, options);
        
        res.json(result);
    } catch (error) {
        console.error('Konu karşılaştırma hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Konu karşılaştırması sırasında hata oluştu',
            details: error.message
        });
    }
});

/**
 * POST /api/literature-gap/compare-temporal
 * Zamansal karşılaştırma yapar
 */
router.post('/compare-temporal', async (req, res) => {
    try {
        const { topic, periods, options = {} } = req.body;
        
        if (!topic || !periods || !Array.isArray(periods) || periods.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Konu ve en az 2 dönem gereklidir'
            });
        }

        console.log(`Zamansal karşılaştırma başlatılıyor: ${topic}`);
        
        const result = await comparisonService.compareTemporalPeriods(topic, periods, options);
        
        res.json(result);
    } catch (error) {
        console.error('Zamansal karşılaştırma hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Zamansal karşılaştırma sırasında hata oluştu',
            details: error.message
        });
    }
});

/**
 * POST /api/literature-gap/compare-methods
 * Metodolojik karşılaştırma yapar
 */
router.post('/compare-methods', async (req, res) => {
    try {
        const { topic, methods, options = {} } = req.body;
        
        if (!topic || !methods || !Array.isArray(methods) || methods.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Konu ve en az 2 yöntem gereklidir'
            });
        }

        console.log(`Metodolojik karşılaştırma başlatılıyor: ${topic} - ${methods.join(' vs ')}`);
        
        const result = await comparisonService.compareMethods(topic, methods, options);
        
        res.json(result);
    } catch (error) {
        console.error('Metodolojik karşılaştırma hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Metodolojik karşılaştırma sırasında hata oluştu',
            details: error.message
        });
    }
});

/**
 * POST /api/literature-gap/compare-geographic
 * Coğrafi karşılaştırma yapar
 */
router.post('/compare-geographic', async (req, res) => {
    try {
        const { topic, regions, options = {} } = req.body;
        
        if (!topic || !regions || !Array.isArray(regions) || regions.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Konu ve en az 2 bölge gereklidir'
            });
        }

        console.log(`Coğrafi karşılaştırma başlatılıyor: ${topic} - ${regions.join(' vs ')}`);
        
        const result = await comparisonService.compareGeographic(topic, regions, options);
        
        res.json(result);
    } catch (error) {
        console.error('Coğrafi karşılaştırma hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Coğrafi karşılaştırma sırasında hata oluştu',
            details: error.message
        });
    }
});

/**
 * GET /api/literature-gap/gap-types
 * Mevcut boşluk türlerini listeler
 */
router.get('/gap-types', (req, res) => {
    try {
        const gapTypes = {
            theoretical: {
                name: 'Teorik Boşluk',
                description: 'Var olan teori yetersiz veya hiç yok',
                examples: ['Yeni kavramsal çerçeveler', 'Teorik modeller', 'Hipotez geliştirme']
            },
            methodological: {
                name: 'Metodolojik Boşluk',
                description: 'Kullanılan yöntemler dar veya sınırlı',
                examples: ['Yeni araştırma yöntemleri', 'Analiz teknikleri', 'Veri toplama yöntemleri']
            },
            regional: {
                name: 'Bölgesel/Bağlamsal Boşluk',
                description: 'Belirli ülke/sektör gruplarında hiç çalışılmamış',
                examples: ['Coğrafi bölgeler', 'Kültürel bağlamlar', 'Sektörel uygulamalar']
            },
            temporal: {
                name: 'Zamansal Boşluk',
                description: 'Eski çalışmalar yapılmış ama güncel değil',
                examples: ['Güncel veriler', 'Yeni dönem analizleri', 'Trend güncellemeleri']
            },
            data: {
                name: 'Veri Boşluğu',
                description: 'Veri yok, eksik veya eski',
                examples: ['Yeni veri setleri', 'Büyük veri analizleri', 'Gerçek zamanlı veriler']
            },
            interdisciplinary: {
                name: 'Disiplinlerarası Boşluk',
                description: 'Disiplinlerin birleştirilmediği alanlar',
                examples: ['Çok disiplinli yaklaşımlar', 'Hibrit metodolojiler', 'Sektörler arası işbirliği']
            }
        };

        res.json({
            success: true,
            gapTypes,
            totalTypes: Object.keys(gapTypes).length
        });
    } catch (error) {
        console.error('Boşluk türleri listeleme hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Boşluk türleri listelenemedi'
        });
    }
});

/**
 * GET /api/literature-gap/health
 * Servis sağlık kontrolü
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Literatür Boşluğu Analiz servisleri çalışıyor',
        timestamp: new Date().toISOString(),
        services: {
            gapAnalysis: 'active',
            trendAnalysis: 'active',
            comparison: 'active'
        }
    });
});

module.exports = router;
