console.log('Starting server...');

try {
    const express = require('express');
    console.log('Express loaded');

    const cors = require('cors');
    console.log('CORS loaded');

    const dotenv = require('dotenv');
    console.log('dotenv loaded');

    const logger = require('./utils/logger');
    console.log('Logger loaded');

    // Load environment variables
    dotenv.config();
    console.log('Environment variables loaded');

    // Import routes
    const searchRouter = require('./routes/search');
    console.log('Search router loaded');

    const aiSummaryRouter = require('./routes/ai-summary');
    console.log('AI Summary router loaded');

    const z3950Router = require('./servicesZ3950/z3950Controller');
    console.log('Z3950 router loaded');

    const citationRouter = require('./routes/citations');
    console.log('Citation router loaded');

    const trendAnalysisRouter = require('./routes/trendAnalysis');
    console.log('Trend Analysis router loaded');

    const authorSearchRouter = require('./routes/authorSearch');
    console.log('Author Search router loaded');

    const literatureGapRouter = require('./routes/literatureGap');
    console.log('Literature Gap router loaded');

    const librarySearchRouter = require('./routes/librarySearch');
    console.log('Library Search router loaded');

    // Import additional services from simpleServer.js
    const milliKutuphaneService = require('./services/fetchMilliKutuphane');
    console.log('Milli Kütüphane service loaded');

    const app = express();
    console.log('Express app created');

    // Middleware
    app.use(cors());
    app.use(express.json());
    console.log('Middleware configured');

    // Routes
    app.use('/api/search', searchRouter);
    app.use('/api/ai-summary', aiSummaryRouter);
    app.use('/api/z3950', z3950Router);
    app.use('/api/citations', citationRouter);
    app.use('/api/trend-analysis', trendAnalysisRouter);
    app.use('/api/author-search', authorSearchRouter);
    app.use('/api/literature-gap', literatureGapRouter);
    app.use('/api/library-search', librarySearchRouter);
    console.log('Routes configured');

    // Additional endpoints from simpleServer.js
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
                topic: topic,
                gaps: [
                    {
                        id: 1,
                        title: `${topic} alanında metodolojik boşluk`,
                        description: `${topic} konusunda yeterli ampirik çalışma bulunmamaktadır`,
                        severity: 'high',
                        recommendations: [
                            'Daha fazla ampirik çalışma yapılmalı',
                            'Farklı metodolojiler denenmelidir'
                        ]
                    },
                    {
                        id: 2,
                        title: `${topic} alanında teorik boşluk`,
                        description: `${topic} konusunda teorik çerçeve eksikliği`,
                        severity: 'medium',
                        recommendations: [
                            'Teorik modeller geliştirilmelidir',
                            'Kavramsal çerçeveler oluşturulmalıdır'
                        ]
                    }
                ],
                trends: {
                    increasing: ['Dijital dönüşüm', 'Yapay zeka uygulamaları'],
                    decreasing: ['Geleneksel yöntemler'],
                    emerging: ['Hibrit yaklaşımlar', 'Disiplinlerarası çalışmalar']
                },
                analysisDate: new Date().toISOString(),
                confidence: 0.85
            };

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

    // Milli Kütüphane arama endpoint'i (ek)
    app.post('/api/milli-kutuphane/search', async (req, res) => {
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
    app.get('/api/milli-kutuphane/health', (req, res) => {
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

    console.log('Additional endpoints from simpleServer.js configured');

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error('API Error:', err);
        logger.logServiceError('API', err);
        res.status(500).json({ error: 'Something went wrong!', details: err.message });
    });

    const PORT = process.env.PORT || 3000; // Unified server port
    console.log(`Attempting to start server on port ${PORT}...`);

    const server = app.listen(PORT, () => {
        console.log(`🚀 Unified server is running on port ${PORT}`);
        console.log(`📍 Test URL: http://localhost:${PORT}/api/test`);
        console.log(`📊 Literature Gap URL: http://localhost:${PORT}/api/literature-gap/health`);
        console.log(`📚 Library Search URL: http://localhost:${PORT}/api/library-search`);
        console.log(`📖 Milli Kütüphane URL: http://localhost:${PORT}/api/milli-kutuphane/health`);
        logger.logServiceInfo('API', { message: `Unified server is running on port ${PORT}` });
    });

    server.on('error', (err) => {
        console.error('Server error:', err);
        logger.logServiceError('API', err);
        process.exit(1);
    });

    // Handle process termination
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM signal. Shutting down gracefully...');
        server.close(() => {
            console.log('Server closed');
            logger.logServiceInfo('API', { message: 'Server closed gracefully via SIGTERM' });
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('Received SIGINT signal. Shutting down gracefully...');
        server.close(() => {
            console.log('Server closed');
            logger.logServiceInfo('API', { message: 'Server closed gracefully via SIGINT' });
            process.exit(0);
        });
    });

} catch (err) {
    console.error('Fatal error during server startup:', err);
    // Logger tanımlı değilse sadece console.error kullan
    try {
        const logger = require('./utils/logger');
        logger.logServiceError('API', err);
    } catch (loggerError) {
        console.error('Logger error:', loggerError.message);
    }
    process.exit(1);
}
