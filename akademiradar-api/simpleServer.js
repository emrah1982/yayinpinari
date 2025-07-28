const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Import services
const milliKutuphaneService = require('./services/fetchMilliKutuphane');

// Middleware
app.use(cors());
app.use(express.json());

// Basit test endpoint'i
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server çalışıyor!',
        timestamp: new Date().toISOString()
    });
});

// Literature Gap test endpoint'i
app.get('/api/literature-gap/health', (req, res) => {
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

// Düzeltilmiş literatür analizi endpoint'i
app.post('/api/literature-gap/analyze', async (req, res) => {
    try {
        const { topic, options = {} } = req.body;
        
        if (!topic) {
            return res.status(400).json({
                success: false,
                error: 'Topic parametresi gerekli'
            });
        }

        // Mock analiz sonucu
        const result = {
            success: true,
            topic,
            analysisDate: new Date().toISOString(),
            totalGapsFound: 4,
            gapAnalysis: {
                identifiedGaps: [
                    {
                        type: 'theoretical',
                        title: 'Teorik Boşluk',
                        description: `${topic} alanında teorik çerçeve eksikliği`,
                        severity: 'high',
                        opportunity: 'Yeni teorik modeller geliştirme fırsatı'
                    },
                    {
                        type: 'methodological',
                        title: 'Metodolojik Boşluk',
                        description: `${topic} alanında yöntem çeşitliliği yetersiz`,
                        severity: 'medium',
                        opportunity: 'Yenilikçi araştırma yöntemleri uygulama fırsatı'
                    },
                    {
                        type: 'temporal',
                        title: 'Zamansal Boşluk',
                        description: `${topic} alanında güncel çalışmalar yetersiz`,
                        severity: 'medium',
                        opportunity: 'Güncel verilerle yeni araştırmalar yapma fırsatı'
                    },
                    {
                        type: 'interdisciplinary',
                        title: 'Disiplinlerarası Boşluk',
                        description: `${topic} alanında disiplinler arası işbirliği eksik`,
                        severity: 'high',
                        opportunity: 'Disiplinlerarası işbirliği fırsatları'
                    }
                ],
                overallScore: 0.75,
                priorityAreas: [
                    `${topic} teorik geliştirme`,
                    `${topic} metodoloji çeşitliliği`,
                    `${topic} disiplinlerarası yaklaşım`
                ]
            }
        };

        console.log(`✅ Literatür analizi tamamlandı: ${topic}`);
        res.json(result);

    } catch (error) {
        console.error('❌ Analiz hatası:', error.message);
        res.status(500).json({
            success: false,
            error: 'Literatür boşluğu analizi sırasında hata oluştu',
            details: error.message
        });
    }
});

// Milli Kütüphane arama endpoint'i
app.post('/api/library-search', async (req, res) => {
    try {
        const { query, searchType = 'all', limit = 10, start = 0 } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Arama sorgusu gerekli'
            });
        }

        console.log(`📚 Milli Kütüphane araması: "${query}"`);
        
        // Milli Kütüphane servisini çağır
        const results = await milliKutuphaneService.searchArticles(query, start, limit, {
            searchType: searchType
        });
        
        // Sonuçları React frontend'in beklediği formata dönüştür
        const formattedResults = {
            success: true,
            query: query,
            totalResults: results.totalResults || 0,
            results: results.results || [],
            searchType: searchType,
            sources: [
                {
                    name: 'Milli Kütüphane',
                    count: results.results ? results.results.length : 0,
                    url: 'https://kasif.mkutup.gov.tr'
                }
            ],
            searchTime: new Date().toISOString(),
            hasMore: results.hasMore || false
        };
        
        console.log(`✅ ${formattedResults.results.length} sonuç bulundu`);
        res.json(formattedResults);
        
    } catch (error) {
        console.error('❌ Milli Kütüphane arama hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Milli Kütüphane araması sırasında hata oluştu',
            details: error.message
        });
    }
});

// Milli Kütüphane sağlık kontrolü endpoint'i
app.get('/api/library-search/health', (req, res) => {
    res.json({
        success: true,
        message: 'Milli Kütüphane servisi çalışıyor',
        timestamp: new Date().toISOString(),
        services: {
            kasif: 'active',
            digitalLibrary: 'active',
            articlesDatabase: 'active'
        }
    });
});

// Server başlatma
app.listen(PORT, () => {
    console.log(`🚀 Basit server ${PORT} portunda çalışıyor`);
    console.log(`📍 Test URL: http://localhost:${PORT}/api/test`);
    console.log(`📊 Literature Gap URL: http://localhost:${PORT}/api/literature-gap/health`);
    console.log(`📚 Library Search URL: http://localhost:${PORT}/api/library-search`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️  Server kapatılıyor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n⏹️  Server sonlandırılıyor...');
    process.exit(0);
});
