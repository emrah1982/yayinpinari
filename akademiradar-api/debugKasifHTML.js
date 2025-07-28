// KAŞİF HTML yapısını detaylı analiz eden debug scripti
const axios = require('axios');
const cheerio = require('cheerio');

async function debugKasifHTML() {
    try {
        console.log('🔍 KAŞİF HTML yapısı analiz ediliyor...\n');
        
        // KAŞİF'e doğrudan arama yap
        const searchUrl = 'https://kasif.mkutup.gov.tr/OpacArama.aspx';
        const searchParams = {
            'Ara': 'Atatürk',
            'DtSrc': '0',
            'fld': '-1',
            'NvBar': '0'
        };
        
        console.log('📡 KAŞİF\'e arama isteği gönderiliyor...');
        console.log('URL:', searchUrl);
        console.log('Parametreler:', searchParams);
        
        const response = await axios.get(searchUrl, {
            params: searchParams,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
            },
            timeout: 30000
        });
        
        console.log('✅ Response alındı, Status:', response.status);
        console.log('📄 HTML boyutu:', response.data.length, 'karakter\n');
        
        const $ = cheerio.load(response.data);
        
        // HTML yapısını analiz et
        console.log('🔍 HTML YAPISI ANALİZİ:');
        console.log('='.repeat(50));
        
        // Tüm tabloları bul
        const tables = $('table');
        console.log(`📊 Toplam tablo sayısı: ${tables.length}`);
        
        tables.each((index, table) => {
            const $table = $(table);
            const rows = $table.find('tr');
            console.log(`\nTablo ${index + 1}: ${rows.length} satır`);
            
            if (rows.length > 0) {
                console.log('İlk 3 satır içeriği:');
                rows.slice(0, 3).each((rowIndex, row) => {
                    const $row = $(row);
                    const cells = $row.find('td, th');
                    console.log(`  Satır ${rowIndex + 1}: ${cells.length} hücre`);
                    
                    cells.each((cellIndex, cell) => {
                        const cellText = $(cell).text().trim();
                        if (cellText.length > 0 && cellText.length < 100) {
                            console.log(`    Hücre ${cellIndex + 1}: "${cellText}"`);
                        }
                    });
                });
            }
        });
        
        // Div'leri analiz et
        console.log('\n🔍 DIV ANALİZİ:');
        console.log('='.repeat(50));
        
        const divs = $('div');
        console.log(`📦 Toplam div sayısı: ${divs.length}`);
        
        // Class'ı olan div'leri bul
        const divsWithClass = $('div[class]');
        console.log(`🏷️ Class'ı olan div sayısı: ${divsWithClass.length}`);
        
        const classNames = new Set();
        divsWithClass.each((index, div) => {
            const className = $(div).attr('class');
            if (className) {
                classNames.add(className);
            }
        });
        
        console.log('Bulunan class isimleri:');
        Array.from(classNames).slice(0, 20).forEach(className => {
            console.log(`  - ${className}`);
        });
        
        // Link'leri analiz et
        console.log('\n🔗 LINK ANALİZİ:');
        console.log('='.repeat(50));
        
        const links = $('a[href]');
        console.log(`🔗 Toplam link sayısı: ${links.length}`);
        
        links.slice(0, 10).each((index, link) => {
            const $link = $(link);
            const href = $link.attr('href');
            const text = $link.text().trim();
            
            if (text.length > 5 && text.length < 100 && !text.includes('sırala') && !text.includes('sayfa')) {
                console.log(`Link ${index + 1}: "${text}" -> ${href}`);
            }
        });
        
        // Kitap başlığı olabilecek elementleri ara
        console.log('\n📚 POTANSIYEL KİTAP BAŞLIKLARI:');
        console.log('='.repeat(50));
        
        const potentialTitles = [];
        
        // Farklı selektörlerle ara
        const titleSelectors = [
            'a[href*="detay"]',
            'a[href*="detail"]', 
            'a[href*="Detay"]',
            'strong',
            'b',
            'h1, h2, h3, h4, h5',
            '.title',
            '.book-title'
        ];
        
        titleSelectors.forEach(selector => {
            const elements = $(selector);
            console.log(`\nSelector '${selector}': ${elements.length} element`);
            
            elements.slice(0, 5).each((index, element) => {
                const text = $(element).text().trim();
                if (text.length > 10 && text.length < 200 && 
                    !text.includes('sırala') && 
                    !text.includes('sayfa') &&
                    !text.includes('click') &&
                    !text.includes('function')) {
                    potentialTitles.push(text);
                    console.log(`  ${index + 1}. "${text}"`);
                }
            });
        });
        
        console.log('\n📋 ÖZET:');
        console.log('='.repeat(50));
        console.log(`Potansiyel kitap başlığı: ${potentialTitles.length} adet`);
        
        if (potentialTitles.length > 0) {
            console.log('En umut verici başlıklar:');
            potentialTitles.slice(0, 5).forEach((title, index) => {
                console.log(`${index + 1}. ${title}`);
            });
        } else {
            console.log('❌ Hiç anlamlı kitap başlığı bulunamadı!');
        }
        
    } catch (error) {
        console.error('❌ Debug hatası:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Headers:', error.response.headers);
        }
    }
}

// Debug çalıştır
debugKasifHTML();
