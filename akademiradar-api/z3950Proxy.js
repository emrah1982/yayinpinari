const express = require('express');
const { Client } = require('node-z3950');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Z39.50 bağlantı ayarları
const Z3950_CONFIG = {
    host: 'z3950.mkutup.gov.tr',
    port: 2100,
    database: 'default',
    preferredRecordSyntax: 'usmarc',
    charset: 'marc8',
    preferredMessageSize: 1000000,
    timeout: 30000
};

// Arama endpoint'i
app.post('/api/search', async (req, res) => {
    const { query, searchType = 'title', limit = 5 } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'Arama sorgusu gereklidir' });
    }

    // Z39.50 sorgusunu oluştur
    let z3950Query = '';
    switch (searchType) {
        case 'title':
            z3950Query = `@attr 1=4 ${query}`; // Başlık
            break;
        case 'author':
            z3950Query = `@attr 1=1003 ${query}`; // Yazar
            break;
        case 'isbn':
            z3950Query = `@attr 1=7 ${query}`; // ISBN
            break;
        default:
            z3950Query = `@attr 1=1016 ${query}`; // Anahtar kelime
    }

    const client = new Client(Z3950_CONFIG);
    
    try {
        // Z39.50 sunucusuna bağlan
        await new Promise((resolve, reject) => {
            client.on('connect', resolve);
            client.on('error', reject);
            client.connect();
        });

        // Arama yap
        const results = await new Promise((resolve, reject) => {
            const searchResults = [];
            
            client.search(z3950Query, {
                resultSetName: 'default',
                numberOfRecords: limit
            }, (err, records) => {
                if (err) {
                    return reject(err);
                }
                
                // Sonuçları işle
                const processedResults = records.map(record => {
                    const marcRecord = record.toObject();
                    
                    // MARC kaydından gerekli alanları çıkar
                    const extractField = (tag, subfieldCode) => {
                        const field = marcRecord.fields.find(f => f.tag === tag);
                        if (!field || !field.subfields) return null;
                        const subfield = field.subfields.find(sf => sf.code === subfieldCode);
                        return subfield ? subfield.value : null;
                    };
                    
                    return {
                        id: extractField('001', 'a') || '',
                        title: extractField('245', 'a') || 'Başlık yok',
                        author: extractField('100', 'a') || 'Yazar yok',
                        publisher: extractField('260', 'b') || 'Yayıncı yok',
                        year: extractField('260', 'c') || 'Tarih yok',
                        isbn: extractField('020', 'a') || '',
                        callNumber: extractField('090', 'a') || '',
                        source: 'Milli Kütüphane Z39.50',
                        rawData: marcRecord
                    };
                });
                
                resolve(processedResults);
            });
        });
        
        res.json({
            success: true,
            count: results.length,
            results: results
        });
        
    } catch (error) {
        console.error('Z39.50 hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Z39.50 sunucusuna bağlanırken bir hata oluştu',
            details: error.message
        });
    } finally {
        // Bağlantıyı kapat
        if (client && typeof client.close === 'function') {
            client.close();
        }
    }
});

// Ana sayfa
app.get('/', (req, res) => {
    res.send('Milli Kütüphane Z39.50 Proxy Servisi Çalışıyor');
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Z39.50 Proxy Servisi http://localhost:${PORT} adresinde çalışıyor`);
});

// Hata yönetimi
process.on('unhandledRejection', (reason, promise) => {
    console.error('İşlenmeyen Promise reddi:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Yakalanmayan hata:', error);
    process.exit(1);
});
