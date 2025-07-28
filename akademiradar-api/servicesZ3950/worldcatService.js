const axios = require('axios');
const xml2js = require('xml2js');

class WorldCatArayici {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'http://www.worldcat.org/webservices/catalog';
    }

    // Kitap/yayın arama
    async yayinAra(baslik, yazar = '', isbn = '') {
        try {
            let sorgu = '';
            if (isbn) {
                sorgu = `srw.bn="${isbn}"`;
            } else {
                if (baslik) sorgu += `srw.ti="${baslik}"`;
                if (yazar) sorgu += ` AND srw.au="${yazar}"`;
            }

            const url = `${this.baseUrl}/search/worldcat/sru`;
            const params = {
                query: sorgu,
                operation: 'searchRetrieve',
                recordSchema: 'info:srw/schema/1/marcxml-v1.1',
                maximumRecords: 10,
                wskey: this.apiKey
            };

            console.log('Arama yapılıyor:', sorgu);
            const response = await axios.get(url, { params });
            
            const parser = new xml2js.Parser();
            const sonuc = await parser.parseStringPromise(response.data);
            
            return this.aramaSonuclariniIsle(sonuc);
        } catch (hata) {
            console.error('Arama hatası:', hata.message);
            return [];
        }
    }

    // Belirli bir OCLC numarasına sahip yayının hangi kütüphanelerde olduğunu bulma
    async kutuphaneleriAra(oclcNumarasi, ulke = 'TR', maksimumSonuc = 20) {
        try {
            const url = `${this.baseUrl}/content/libraries/${oclcNumarasi}`;
            const params = {
                country: ulke,
                maximumLibraries: maksimumSonuc,
                wskey: this.apiKey,
                format: 'json'
            };

            console.log(`OCLC ${oclcNumarasi} için kütüphaneler aranıyor...`);
            const response = await axios.get(url, { params });
            
            return this.kutuphaneSonuclariniIsle(response.data);
        } catch (hata) {
            console.error('Kütüphane arama hatası:', hata.message);
            if (hata.response) {
                console.error('Hata detayı:', hata.response.data);
            }
            return [];
        }
    }

    // Arama sonuçlarını işleme
    aramaSonuclariniIsle(sonuc) {
        const kitaplar = [];
        
        try {
            const kayitlar = sonuc?.['srw:searchRetrieveResponse']?.['srw:records']?.[0]?.['srw:record'];
            
            if (!kayitlar) {
                console.log('Sonuç bulunamadı.');
                return kitaplar;
            }

            kayitlar.forEach(kayit => {
                try {
                    const marcData = kayit['srw:recordData'][0]['record'][0];
                    const kitap = this.marcVerisiniIsle(marcData);
                    if (kitap) kitaplar.push(kitap);
                } catch (e) {
                    console.log('Kayıt işlenirken hata:', e.message);
                }
            });
        } catch (hata) {
            console.error('Sonuç işleme hatası:', hata.message);
        }

        return kitaplar;
    }

    // MARC verisini işleme
    marcVerisiniIsle(marcData) {
        const kitap = {
            baslik: '',
            yazar: '',
            yayinYili: '',
            isbn: '',
            oclcNumarasi: '',
            yayinevi: ''
        };

        try {
            // Control field'lardan OCLC numarasını al
            const controlFields = marcData.controlfield || [];
            controlFields.forEach(field => {
                if (field.$.tag === '001') {
                    kitap.oclcNumarasi = field._;
                }
            });

            // Data field'lardan bilgileri al
            const dataFields = marcData.datafield || [];
            dataFields.forEach(field => {
                const tag = field.$.tag;
                const subfields = field.subfield || [];

                switch (tag) {
                    case '245': // Başlık
                        subfields.forEach(sub => {
                            if (sub.$.code === 'a') kitap.baslik += sub._;
                            if (sub.$.code === 'b') kitap.baslik += ' ' + sub._;
                        });
                        break;
                    case '100': // Ana yazar
                    case '110': // Kurumsal yazar
                        subfields.forEach(sub => {
                            if (sub.$.code === 'a') kitap.yazar = sub._;
                        });
                        break;
                    case '260': // Yayın bilgisi
                    case '264': // Üretim, yayın, dağıtım
                        subfields.forEach(sub => {
                            if (sub.$.code === 'b') kitap.yayinevi = sub._;
                            if (sub.$.code === 'c') kitap.yayinYili = sub._.replace(/[^\d]/g, '');
                        });
                        break;
                    case '020': // ISBN
                        subfields.forEach(sub => {
                            if (sub.$.code === 'a') kitap.isbn = sub._;
                        });
                        break;
                }
            });
        } catch (hata) {
            console.error('MARC verisi işleme hatası:', hata.message);
        }

        return kitap.baslik ? kitap : null;
    }

    // Kütüphane sonuçlarını işleme
    kutuphaneSonuclariniIsle(data) {
        const kutuphaneler = [];
        
        try {
            if (data.library) {
                data.library.forEach(lib => {
                    kutuphaneler.push({
                        ad: lib.institutionName,
                        sehir: lib.city,
                        ulke: lib.country,
                        oclcSembol: lib.oclcSymbol,
                        url: lib.opacUrl || 'URL mevcut değil'
                    });
                });
            }
        } catch (hata) {
            console.error('Kütüphane verisi işleme hatası:', hata.message);
        }

        return kutuphaneler;
    }

    // Tam arama (kitap bulup kütüphanelerini listeleme)
    async tamArama(baslik, yazar = '', isbn = '', ulke = 'TR') {
        console.log('=== WorldCat Tam Arama Başlıyor ===\n');
        
        // Önce kitabı ara
        const kitaplar = await this.yayinAra(baslik, yazar, isbn);
        
        if (kitaplar.length === 0) {
            console.log('Aradığınız kriterlere uygun kitap bulunamadı.');
            return;
        }

        console.log(`${kitaplar.length} kitap bulundu:\n`);
        
        // Her kitap için kütüphaneleri ara
        for (let i = 0; i < Math.min(kitaplar.length, 3); i++) {
            const kitap = kitaplar[i];
            console.log(`--- Kitap ${i + 1} ---`);
            console.log(`Başlık: ${kitap.baslik}`);
            console.log(`Yazar: ${kitap.yazar}`);
            console.log(`Yayın Yılı: ${kitap.yayinYili}`);
            console.log(`ISBN: ${kitap.isbn}`);
            console.log(`OCLC: ${kitap.oclcNumarasi}\n`);

            if (kitap.oclcNumarasi) {
                const kutuphaneler = await this.kutuphaneleriAra(kitap.oclcNumarasi, ulke);
                
                if (kutuphaneler.length > 0) {
                    console.log(`Bu kitaba sahip ${kutuphaneler.length} kütüphane bulundu:`);
                    kutuphaneler.forEach((kutuphane, index) => {
                        console.log(`${index + 1}. ${kutuphane.ad} - ${kutuphane.sehir}, ${kutuphane.ulke}`);
                        if (kutuphane.url !== 'URL mevcut değil') {
                            console.log(`   Katalog: ${kutuphane.url}`);
                        }
                    });
                } else {
                    console.log('Bu kitaba sahip kütüphane bulunamadı.');
                }
            } else {
                console.log('OCLC numarası bulunamadığı için kütüphane araması yapılamadı.');
            }
            
            console.log('\n' + '='.repeat(50) + '\n');
        }
    }
}

// Kullanım örneği
async function main() {
    // WorldCat API anahtarınızı buraya yazın
    const API_KEY = 'YOUR_WORLDCAT_API_KEY';
    
    const arayici = new WorldCatArayici(API_KEY);
    
    try {
        // Örnek 1: Başlık ile arama
        await arayici.tamArama('Pride and Prejudice', 'Jane Austen');
        
        // Örnek 2: ISBN ile arama
        // await arayici.tamArama('', '', '9780141439518');
        
        // Örnek 3: Sadece belirli bir OCLC numarasının kütüphanelerini arama
        // const kutuphaneler = await arayici.kutuphaneleriAra('1007101', 'TR');
        // console.log('Bulunan kütüphaneler:', kutuphaneler);
        
    } catch (hata) {
        console.error('Program hatası:', hata.message);
    }
}

// Programı çalıştır
if (require.main === module) {
    main();
}

module.exports = WorldCatArayici;