const axios = require('axios');
const xml2js = require('xml2js');

class LibraryFindService {
    static instance;

    static getInstance() {
        if (!LibraryFindService.instance) {
            LibraryFindService.instance = new LibraryFindService();
        }
        return LibraryFindService.instance;
    }

    constructor() {
        if (LibraryFindService.instance) {
            return LibraryFindService.instance;
        }
        this.userAgent = 'KutuphaneBulucusu/1.0 (egitim-amacli-kullanim)';
        this.timeout = 5000; // 5 saniye timeout (daha hızlı yanıt için)
        LibraryFindService.instance = this;
    }

    // Yazar adını farklı formatlarda destekle
    yazarAdiFormatla(yazarAdi) {
        // Boşlukları temizle
        yazarAdi = yazarAdi.trim();
        
        // Eğer virgül varsa "Soyad, Ad" formatında
        if (yazarAdi.includes(',')) {
            const parcalar = yazarAdi.split(',').map(p => p.trim());
            // "Soyad, Ad" -> "Ad Soyad" formatına çevir
            if (parcalar.length >= 2) {
                return `${parcalar[1]} ${parcalar[0]}`;
            }
        }
        
        // Zaten "Ad Soyad" formatında ise olduğu gibi döndür
        return yazarAdi;
    }

    // Yazar adı varyantları üret (arama başarısını artırmak için)  
    yazarVaryantlariUret(yazarAdi) {
        const varyantlar = [];
        const temizAd = this.yazarAdiFormatla(yazarAdi);
        
        varyantlar.push(temizAd); // "Ad Soyad"
        
        // "Ad Soyad" -> "Soyad, Ad" formatı
        const kelimeler = temizAd.split(' ');
        if (kelimeler.length >= 2) {
            const ad = kelimeler.slice(0, -1).join(' ');
            const soyad = kelimeler[kelimeler.length - 1];
            varyantlar.push(`${soyad}, ${ad}`);
        }
        
        // Sadece soyad
        if (kelimeler.length >= 2) {
            varyantlar.push(kelimeler[kelimeler.length - 1]);
        }
        
        return [...new Set(varyantlar)]; // Tekrarları kaldır
    }

    // 1. OPEN LIBRARY API - Tamamen ücretsiz, kapak resimli
    async openLibraryArama(anahtar, tip = 'title') {
        return new Promise(async (resolve) => {
            try {
                let sorguUrl;
                
                if (tip === 'isbn') {
                    sorguUrl = `https://openlibrary.org/search.json?isbn=${anahtar}&fields=key,title,author_name,first_publish_year,isbn,oclc,publisher,editions,cover_i,cover_edition_key`;
                } else if (tip === 'title') {
                    sorguUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(anahtar)}&fields=key,title,author_name,first_publish_year,isbn,oclc,publisher,editions,cover_i,cover_edition_key&limit=10`;
                } else if (tip === 'author') {
                    // Yazar araması - hem "Ad Soyad" hem "Soyad, Ad" formatlarını destekle
                    const yazarAdi = this.yazarAdiFormatla(anahtar);
                    sorguUrl = `https://openlibrary.org/search.json?author=${encodeURIComponent(yazarAdi)}&fields=key,title,author_name,first_publish_year,isbn,oclc,publisher,editions,cover_i,cover_edition_key&limit=15`;
                } else {
                    sorguUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(anahtar)}&fields=key,title,author_name,first_publish_year,isbn,oclc,publisher,editions,cover_i,cover_edition_key&limit=10`;
                }

                console.log('📚 Open Library araması başladı...');
                const response = await axios.get(sorguUrl, {
                    headers: { 'User-Agent': this.userAgent },
                    timeout: this.timeout
                });

                const sonuclar = this.openLibraryIsle(response.data);
                console.log(`✅ Open Library tamamlandı: ${sonuclar.length} sonuç`);
                resolve(sonuclar);
            } catch (hata) {
                console.error('❌ Open Library hatası:', hata.message);
                resolve([]);
            }
        });
    }

    openLibraryIsle(data) {
        const kitaplar = [];
        
        if (data.docs && data.docs.length > 0) {
            data.docs.forEach(doc => {
                // Kapak resmi URL'lerini oluştur
                const kapakResimleri = this.openLibraryKapakBul(doc);
                
                const kitap = {
                    baslik: doc.title || 'Başlık bulunamadı',
                    yazar: doc.author_name ? doc.author_name.join(', ') : 'Yazar bilinmiyor',
                    yayinYili: doc.first_publish_year || 'Bilinmiyor',
                    isbn: doc.isbn ? doc.isbn[0] : 'ISBN yok',
                    yayinevi: doc.publisher ? doc.publisher[0] : 'Yayınevi bilinmiyor',
                    openLibraryKey: doc.key,
                    oclcNumarasi: doc.oclc ? doc.oclc[0] : null,
                    edisyonSayisi: doc.editions ? doc.editions.numFound : 1,
                    kapakResimleri: kapakResimleri,
                    kaynak: 'Open Library'
                };
                kitaplar.push(kitap);
            });
        }

        return kitaplar;
    }

    openLibraryKapakBul(doc) {
        const kapaklar = {
            kucuk: null,
            orta: null,
            buyuk: null
        };

        // Kapak ID'si varsa kapak URL'lerini oluştur
        if (doc.cover_i) {
            const kapakId = doc.cover_i;
            kapaklar.kucuk = `https://covers.openlibrary.org/b/id/${kapakId}-S.jpg`;
            kapaklar.orta = `https://covers.openlibrary.org/b/id/${kapakId}-M.jpg`;
            kapaklar.buyuk = `https://covers.openlibrary.org/b/id/${kapakId}-L.jpg`;
        } 
        // Kapak edition key varsa onu kullan
        else if (doc.cover_edition_key) {
            const editionKey = doc.cover_edition_key;
            kapaklar.kucuk = `https://covers.openlibrary.org/b/olid/${editionKey}-S.jpg`;
            kapaklar.orta = `https://covers.openlibrary.org/b/olid/${editionKey}-M.jpg`;
            kapaklar.buyuk = `https://covers.openlibrary.org/b/olid/${editionKey}-L.jpg`;
        }
        // ISBN varsa ISBN ile kapak ara
        else if (doc.isbn && doc.isbn.length > 0) {
            const isbn = doc.isbn[0];
            kapaklar.kucuk = `https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg`;
            kapaklar.orta = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
            kapaklar.buyuk = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
        }

        return kapaklar;
    }

    // 2. GOOGLE BOOKS API - Ücretsiz, yüksek kaliteli kapaklar
    async googleBooksArama(anahtar, tip = 'intitle') {
        return new Promise(async (resolve) => {
            try {
                let sorgu;
                if (tip === 'isbn') {
                    sorgu = `isbn:${anahtar}`;
                } else if (tip === 'intitle' || tip === 'title') {
                    sorgu = `intitle:${anahtar}`;
                } else if (tip === 'author') {
                    // Yazar araması - Google Books için inauthor: kullan
                    const yazarAdi = this.yazarAdiFormatla(anahtar);
                    sorgu = `inauthor:"${yazarAdi}"`;
                } else {
                    sorgu = anahtar;
                }

                const sorguUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(sorgu)}&maxResults=10`;
                
                console.log('📖 Google Books araması başladı...');
                const response = await axios.get(sorguUrl, {
                    headers: { 'User-Agent': this.userAgent },
                    timeout: this.timeout
                });

                const sonuclar = this.googleBooksIsle(response.data);
                console.log(`✅ Google Books tamamlandı: ${sonuclar.length} sonuç`);
                resolve(sonuclar);
            } catch (hata) {
                console.error('❌ Google Books hatası:', hata.message);
                resolve([]);
            }
        });
    }

    googleBooksIsle(data) {
        const kitaplar = [];
        
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                const volumeInfo = item.volumeInfo;
                
                // Kapak resimlerini al
                const kapakResimleri = this.googleBooksKapakBul(volumeInfo);
                
                const kitap = {
                    baslik: volumeInfo.title || 'Başlık bulunamadı',
                    yazar: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Yazar bilinmiyor',
                    yayinYili: volumeInfo.publishedDate ? volumeInfo.publishedDate.slice(0, 4) : 'Bilinmiyor',
                    isbn: volumeInfo.industryIdentifiers ? 
                          volumeInfo.industryIdentifiers.find(id => id.type.includes('ISBN'))?.identifier || 'ISBN yok' 
                          : 'ISBN yok',
                    yayinevi: volumeInfo.publisher || 'Yayınevi bilinmiyor',
                    sayfaSayisi: volumeInfo.pageCount || 'Bilinmiyor',
                    dil: volumeInfo.language || 'Bilinmiyor',
                    googleBooksId: item.id,
                    onizlemeVarMi: volumeInfo.previewLink ? 'Evet' : 'Hayır',
                    kapakResimleri: kapakResimleri,
                    kaynak: 'Google Books'
                };
                kitaplar.push(kitap);
            });
        }

        return kitaplar;
    }

    googleBooksKapakBul(volumeInfo) {
        const kapaklar = {
            kucuk: null,
            orta: null,
            buyuk: null
        };

        if (volumeInfo.imageLinks) {
            // Google Books farklı boyutlarda kapaklar sunar
            kapaklar.kucuk = volumeInfo.imageLinks.smallThumbnail || volumeInfo.imageLinks.thumbnail;
            kapaklar.orta = volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.small;
            kapaklar.buyuk = volumeInfo.imageLinks.large || volumeInfo.imageLinks.medium || volumeInfo.imageLinks.thumbnail;
            
            // HTTPS'e çevir (Google Books HTTP döndürebilir)
            Object.keys(kapaklar).forEach(key => {
                if (kapaklar[key]) {
                    kapaklar[key] = kapaklar[key].replace('http://', 'https://');
                }
            });
        }

        return kapaklar;
    }

    // 3. OCLC CLASSIFY API - WorldCat'in ücretsiz versiyonu
    async oclcClassifyArama(isbn) {
        return new Promise(async (resolve) => {
            try {
                const sorguUrl = `http://classify.oclc.org/classify2/Classify?isbn=${isbn}&summary=true`;
                
                console.log('🏛️ OCLC Classify araması başladı...');
                const response = await axios.get(sorguUrl, {
                    headers: { 'User-Agent': this.userAgent },
                    timeout: this.timeout
                });

                const parser = new xml2js.Parser();
                const sonuc = await parser.parseStringPromise(response.data);
                
                const sonuclar = this.oclcClassifyIsle(sonuc, isbn);
                console.log(`✅ OCLC Classify tamamlandı: ${sonuclar ? '1 sonuç' : '0 sonuç'}`);
                resolve(sonuclar);
            } catch (hata) {
                console.error('❌ OCLC Classify hatası:', hata.message);
                resolve(null);
            }
        });
    }

    oclcClassifyIsle(data, isbn) {
        try {
            const yanitKodu = data.classify?.response?.[0]?.$.code;
            
            if (yanitKodu === '0' || yanitKodu === '2') {
                const work = data.classify?.work?.[0];
                
                // OCLC için kapak resimleri (WorldCat üzerinden)
                const kapakResimleri = {
                    kucuk: null,
                    orta: null,
                    buyuk: null
                };

                // ISBN varsa WorldCat kapak servisini kullan
                if (isbn) {
                    kapakResimleri.kucuk = `https://www.worldcat.org/covers/isbn/${isbn}?size=S`;
                    kapakResimleri.orta = `https://www.worldcat.org/covers/isbn/${isbn}?size=M`;
                    kapakResimleri.buyuk = `https://www.worldcat.org/covers/isbn/${isbn}?size=L`;
                }

                const kitap = {
                    baslik: work?.$.title || 'Başlık bulunamadı',
                    yazar: work?.$.author || 'Yazar bilinmiyor',
                    oclcNumarasi: work?.$.oclc,
                    deweyClassNumber: work?.$.sfa || 'Sınıflandırma yok',
                    edisyonSayisi: work?.$.editions || '1',
                    kututphaneVarMi: work?.$.holdings || '0',
                    kapakResimleri: kapakResimleri,
                    kaynak: 'OCLC Classify'
                };

                return kitap;
            } else {
                return null;
            }
        } catch (hata) {
            console.error('OCLC sonuç işleme hatası:', hata.message);
            return null;
        }
    }

    // 4. INTERNET ARCHIVE API - Ücretsiz, tarihsel kitaplar
    async internetArchiveArama(anahtar, tip = 'title') {
        return new Promise(async (resolve) => {
            try {
                let sorguUrl;
                
                if (tip === 'author') {
                    // Yazar araması - creator field'ında ara  
                    const yazarAdi = this.yazarAdiFormatla(anahtar);
                    sorguUrl = `https://archive.org/advancedsearch.php?q=creator:(${encodeURIComponent(yazarAdi)}) AND mediatype:texts&fl=identifier,title,creator,date,publisher&rows=10&output=json`;
                } else {
                    // Başlık araması (varsayılan)
                    sorguUrl = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(anahtar)}) AND mediatype:texts&fl=identifier,title,creator,date,publisher&rows=10&output=json`;
                }
                
                console.log('🌐 Internet Archive araması başladı...');
                const response = await axios.get(sorguUrl, {
                    headers: { 'User-Agent': this.userAgent },
                    timeout: this.timeout
                });

                const sonuclar = this.internetArchiveIsle(response.data);
                console.log(`✅ Internet Archive tamamlandı: ${sonuclar.length} sonuç`);
                resolve(sonuclar);
            } catch (hata) {
                console.error('❌ Internet Archive hatası:', hata.message);
                resolve([]);
            }
        });
    }

    internetArchiveIsle(data) {
        const kitaplar = [];
        
        if (data.response && data.response.docs && data.response.docs.length > 0) {
            data.response.docs.forEach(doc => {
                // Internet Archive kapak resimleri
                const kapakResimleri = {
                    kucuk: `https://archive.org/services/img/${doc.identifier}`,
                    orta: `https://archive.org/services/img/${doc.identifier}`,
                    buyuk: `https://archive.org/services/img/${doc.identifier}`
                };

                const kitap = {
                    baslik: doc.title || 'Başlık bulunamadı',
                    yazar: doc.creator || 'Yazar bilinmiyor',
                    yayinYili: doc.date || 'Bilinmiyor',
                    yayinevi: doc.publisher || 'Yayınevi bilinmiyor',
                    internetArchiveId: doc.identifier,
                    erisimLinki: `https://archive.org/details/${doc.identifier}`,
                    kapakResimleri: kapakResimleri,
                    kaynak: 'Internet Archive'
                };
                kitaplar.push(kitap);
            });
        }

        return kitaplar;
    }

    // PARALEL ASENKRON ARAMA - Tüm servisleri aynı anda çalıştır
    async parallelArama(anahtar, tip = 'title') {
        console.log('🚀 PARALEL ASENKRON ARAMA BAŞLIYOR...\n');
        console.log(`🔍 Arama terimi: "${anahtar}" (${tip})`);
        console.log(`⏱️ Tüm servisler paralel çalışıyor...\n`);

        const baslamaSaati = Date.now();

        // Tüm API'leri paralel çalıştır
        const aramaSozleri = [];

        // 1. Open Library
        aramaSozleri.push(
            this.openLibraryArama(anahtar, tip)
                .then(sonuc => ({ servis: 'openLibrary', sonuc }))
                .catch(hata => ({ servis: 'openLibrary', sonuc: [], hata: hata.message }))
        );

        // 2. Google Books
        aramaSozleri.push(
            this.googleBooksArama(anahtar, tip)
                .then(sonuc => ({ servis: 'googleBooks', sonuc }))
                .catch(hata => ({ servis: 'googleBooks', sonuc: [], hata: hata.message }))
        );

        // 3. OCLC Classify (sadece ISBN için)
        if (tip === 'isbn') {
            aramaSozleri.push(
                this.oclcClassifyArama(anahtar)
                    .then(sonuc => ({ servis: 'oclcClassify', sonuc }))
                    .catch(hata => ({ servis: 'oclcClassify', sonuc: null, hata: hata.message }))
            );
        }

        // 4. Internet Archive
        aramaSozleri.push(
            this.internetArchiveArama(anahtar, tip)
                .then(sonuc => ({ servis: 'internetArchive', sonuc }))
                .catch(hata => ({ servis: 'internetArchive', sonuc: [], hata: hata.message }))
        );

        // Tüm sonuçları bekle
        const tumSonuclar = await Promise.allSettled(aramaSozleri);
        
        const tamamlanmaSaati = Date.now();
        const gecenSure = (tamamlanmaSaati - baslamaSaati) / 1000;

        console.log(`\n⚡ Tüm aramalar ${gecenSure.toFixed(2)} saniyede tamamlandı!\n`);

        // Sonuçları organize et
        const sonuclar = {
            openLibrary: [],
            googleBooks: [],
            oclcClassify: null,
            internetArchive: [],
            aramaSuresi: gecenSure,
            hatalar: []
        };

        tumSonuclar.forEach(sonuc => {
            if (sonuc.status === 'fulfilled') {
                const { servis, sonuc: veri, hata } = sonuc.value;
                
                if (hata) {
                    sonuclar.hatalar.push(`${servis}: ${hata}`);
                } else {
                    sonuclar[servis] = veri;
                }
            } else {
                sonuclar.hatalar.push(`Beklenmeyen hata: ${sonuc.reason}`);
            }
        });

        // Sonuçları göster
        this.kapakliSonuclariGoster(sonuclar);
        
        return sonuclar;
    }

    // YAZAR ADI İLE ÖZEL ARAMA - Tüm varyantları dene
    async yazarAraması(yazarAdi) {
        console.log('👤 YAZAR ARAMASI BAŞLIYOR...\n');
        console.log(`🔍 Aranan Yazar: "${yazarAdi}"`);
        
        // Yazar adı varyantları üret
        const varyantlar = this.yazarVaryantlariUret(yazarAdi);
        console.log(`📝 Deneyecek formatlar: ${varyantlar.join(', ')}\n`);

        const baslamaSaati = Date.now();
        let enIyiSonuclar = {
            openLibrary: [],
            googleBooks: [],
            internetArchive: [],
            toplamSonuc: 0
        };

        // Her varyant için arama yap (en fazla sonuç veren varyantı kullan)
        for (let i = 0; i < varyantlar.length; i++) {
            const varyant = varyantlar[i];
            console.log(`🔄 "${varyant}" formatı deneniyor...`);
            
            try {
                const sonuclar = await this.parallelArama(varyant, 'author');
                const toplamSonuc = sonuclar.openLibrary.length + sonuclar.googleBooks.length + sonuclar.internetArchive.length;
                
                console.log(`   📊 Bu format için ${toplamSonuc} sonuç bulundu`);
                
                // En çok sonuç veren varyantı kaydet
                if (toplamSonuc > enIyiSonuclar.toplamSonuc) {
                    enIyiSonuclar = {
                        openLibrary: sonuclar.openLibrary,
                        googleBooks: sonuclar.googleBooks,
                        internetArchive: sonuclar.internetArchive,
                        toplamSonuc: toplamSonuc,
                        kullanılanFormat: varyant,
                        aramaSuresi: sonuclar.aramaSuresi
                    };
                }
                
                // Eğer yeterli sonuç bulduysak dur
                if (toplamSonuc >= 15) {
                    console.log(`   ✅ Yeterli sonuç bulundu, arama durduruldu`);
                    break;
                }
                
            } catch (hata) {
                console.error(`   ❌ "${varyant}" formatı için hata:`, hata.message);
            }
        }

        const tamamlanmaSaati = Date.now();
        const toplamSure = (tamamlanmaSaati - baslamaSaati) / 1000;

        console.log(`\n🎯 EN İYİ SONUÇLAR "${enIyiSonuclar.kullanılanFormat}" formatından elde edildi`);
        console.log(`⏱️ Toplam arama süresi: ${toplamSure.toFixed(2)} saniye`);
        console.log(`📚 Toplam bulunan kitap: ${enIyiSonuclar.toplamSonuc}\n`);

        // Yazar odaklı sonuç gösterimi
        this.yazarSonuclariniGoster(enIyiSonuclar, yazarAdi);
        
        return enIyiSonuclar;
    }

    // Yazar araması sonuçlarını özel formatla göster
    yazarSonuclariniGoster(sonuclar, aslYazarAdi) {
        console.log(`=== 👤 "${aslYazarAdi.toUpperCase()}" YAZAR ARAMASI SONUÇLARI ===\n`);

        let kitapSayisi = 0;
        const tumKitaplar = [];

        // Tüm sonuçları birleştir
        [...sonuclar.openLibrary, ...sonuclar.googleBooks, ...sonuclar.internetArchive].forEach(kitap => {
            tumKitaplar.push(kitap);
        });

        // Yayın yılına göre sırala (en yeniden eskiye)
        tumKitaplar.sort((a, b) => {
            const yilA = parseInt(a.yayinYili) || 0;
            const yilB = parseInt(b.yayinYili) || 0;
            return yilB - yilA;
        });

        // İlk 10 kitabı göster
        console.log('📚 BULUNAN KITAPLAR (Yayın yılına göre sıralı):');
        tumKitaplar.slice(0, 10).forEach((kitap, index) => {
            console.log(`\n${index + 1}. 📖 ${kitap.baslik}`);
            console.log(`   👤 Yazar: ${kitap.yazar}`);
            console.log(`   📅 Yayın Yılı: ${kitap.yayinYili}`);
            console.log(`   🏢 Yayınevi: ${kitap.yayinevi || 'Bilinmiyor'}`);
            console.log(`   📘 ISBN: ${kitap.isbn || 'ISBN yok'}`);
            console.log(`   🌐 Kaynak: ${kitap.kaynak}`);
            
            // Kapak resmi varsa göster
            if (kitap.kapakResimleri && kitap.kapakResimleri.orta) {
                console.log(`   🖼️ Kapak: ${kitap.kapakResimleri.orta}`);
            }
            
            // WorldCat linki varsa göster
            if (kitap.oclcNumarasi) {
                console.log(`   🌍 WorldCat: https://worldcat.org/oclc/${kitap.oclcNumarasi}`);
            }
            
            kitapSayisi++;
        });

        // İstatistikler
        console.log(`\n=== 📊 YAZAR ARAMASI İSTATİSTİKLERİ ===`);
        console.log(`👤 Aranan Yazar: ${aslYazarAdi}`);
        console.log(`📋 Kullanılan Format: ${sonuclar.kullanılanFormat}`);
        console.log(`📚 Toplam Bulunan Kitap: ${sonuclar.toplamSonuc}`);
        console.log(`⏱️ Arama Süresi: ${sonuclar.aramaSuresi} saniye`);
        console.log(`🔍 Servis Dağılımı:`);
        console.log(`   📚 Open Library: ${sonuclar.openLibrary.length} sonuç`);
        console.log(`   📖 Google Books: ${sonuclar.googleBooks.length} sonuç`);
        console.log(`   🌐 Internet Archive: ${sonuclar.internetArchive.length} sonuç`);

        // Yazar hakkında ek bilgiler
        if (tumKitaplar.length > 0) {
            const enEskiKitap = tumKitaplar.reduce((prev, curr) => {
                const prevYil = parseInt(prev.yayinYili) || 9999;
                const currYil = parseInt(curr.yayinYili) || 9999;
                return currYil < prevYil ? curr : prev;
            });
            
            const enYeniKitap = tumKitaplar.reduce((prev, curr) => {
                const prevYil = parseInt(prev.yayinYili) || 0;
                const currYil = parseInt(curr.yayinYili) || 0;
                return currYil > prevYil ? curr : prev;
            });

            console.log(`\n=== ℹ️ YAZAR HAKKINDA ===`);
            console.log(`📖 En Eski Kitap: ${enEskiKitap.baslik} (${enEskiKitap.yayinYili})`);
            console.log(`📖 En Yeni Kitap: ${enYeniKitap.baslik} (${enYeniKitap.yayinYili})`);
            
            // Yaygın yayınevlerini bul
            const yayinevleri = {};
            tumKitaplar.forEach(kitap => {
                if (kitap.yayinevi && kitap.yayinevi !== 'Bilinmiyor' && kitap.yayinevi !== 'Yayınevi bilinmiyor') {
                    yayinevleri[kitap.yayinevi] = (yayinevleri[kitap.yayinevi] || 0) + 1;
                }
            });
            
            const enCokYayinevi = Object.entries(yayinevleri)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([yayinevi, sayi]) => `${yayinevi} (${sayi} kitap)`)
                .join(', ');
                
            if (enCokYayinevi) {
                console.log(`🏢 Yaygın Yayınevleri: ${enCokYayinevi}`);
            }
        }
    }
    kapakliSonuclariGoster(sonuclar) {
        console.log('=== 📚 KAPAK RESİMLİ ARAMA SONUÇLARI ===\n');

        let toplamSonuc = 0;

        // Open Library sonuçları
        if (sonuclar.openLibrary.length > 0) {
            console.log('📚 OPEN LIBRARY SONUÇLARI:');
            sonuclar.openLibrary.slice(0, 3).forEach((kitap, index) => {
                console.log(`\n${index + 1}. 📖 ${kitap.baslik}`);
                console.log(`   👤 Yazar: ${kitap.yazar}`);
                console.log(`   📅 Yayın Yılı: ${kitap.yayinYili}`);
                console.log(`   📘 ISBN: ${kitap.isbn}`);
                console.log(`   🏢 Yayınevi: ${kitap.yayinevi}`);
                console.log(`   📚 Edisyon Sayısı: ${kitap.edisyonSayisi}`);
                
                // Kapak resimleri
                if (kitap.kapakResimleri.buyuk) {
                    console.log(`   🖼️ Kapak Resmi (Büyük): ${kitap.kapakResimleri.buyuk}`);
                    console.log(`   🖼️ Kapak Resmi (Orta): ${kitap.kapakResimleri.orta}`);
                    console.log(`   🖼️ Kapak Resmi (Küçük): ${kitap.kapakResimleri.kucuk}`);
                } else {
                    console.log(`   🖼️ Kapak Resmi: Bulunamadı`);
                }
                
                console.log(`   🔗 Link: https://openlibrary.org${kitap.openLibraryKey}`);
                if (kitap.oclcNumarasi) {
                    console.log(`   🌍 WorldCat: https://worldcat.org/oclc/${kitap.oclcNumarasi}`);
                }
            });
            toplamSonuc += sonuclar.openLibrary.length;
            console.log(`\n   ✅ Toplam ${sonuclar.openLibrary.length} sonuç\n`);
        }

        // Google Books sonuçları
        if (sonuclar.googleBooks.length > 0) {
            console.log('📖 GOOGLE BOOKS SONUÇLARI:');
            sonuclar.googleBooks.slice(0, 3).forEach((kitap, index) => {
                console.log(`\n${index + 1}. 📘 ${kitap.baslik}`);
                console.log(`   👤 Yazar: ${kitap.yazar}`);
                console.log(`   🏢 Yayınevi: ${kitap.yayinevi}`);
                console.log(`   📄 Sayfa: ${kitap.sayfaSayisi}`);
                console.log(`   🌐 Dil: ${kitap.dil}`);
                console.log(`   👁️ Önizleme: ${kitap.onizlemeVarMi}`);
                
                // Kapak resimleri
                if (kitap.kapakResimleri.buyuk) {
                    console.log(`   🖼️ Kapak Resmi (Büyük): ${kitap.kapakResimleri.buyuk}`);
                    console.log(`   🖼️ Kapak Resmi (Orta): ${kitap.kapakResimleri.orta}`);
                    console.log(`   🖼️ Kapak Resmi (Küçük): ${kitap.kapakResimleri.kucuk}`);
                } else {
                    console.log(`   🖼️ Kapak Resmi: Bulunamadı`);
                }
            });
            toplamSonuc += sonuclar.googleBooks.length;
            console.log(`\n   ✅ Toplam ${sonuclar.googleBooks.length} sonuç\n`);
        }

        // OCLC Classify sonucu
        if (sonuclar.oclcClassify) {
            console.log('🏛️ OCLC CLASSIFY SONUCU:');
            const kitap = sonuclar.oclcClassify;
            console.log(`\n📖 ${kitap.baslik}`);
            console.log(`   👤 Yazar: ${kitap.yazar}`);
            console.log(`   🆔 OCLC No: ${kitap.oclcNumarasi}`);
            console.log(`   📊 Dewey No: ${kitap.deweyClassNumber}`);
            console.log(`   🏛️ Kütüphane Sayısı: ${kitap.kututphaneVarMi}`);
            
            // Kapak resimleri
            if (kitap.kapakResimleri.buyuk) {
                console.log(`   🖼️ WorldCat Kapak (Büyük): ${kitap.kapakResimleri.buyuk}`);
                console.log(`   🖼️ WorldCat Kapak (Orta): ${kitap.kapakResimleri.orta}`);
                console.log(`   🖼️ WorldCat Kapak (Küçük): ${kitap.kapakResimleri.kucuk}`);
            }
            
            if (kitap.oclcNumarasi) {
                console.log(`   🌍 WorldCat: https://worldcat.org/oclc/${kitap.oclcNumarasi}`);
            }
            toplamSonuc += 1;
            console.log();
        }

        // Internet Archive sonuçları
        if (sonuclar.internetArchive.length > 0) {
            console.log('🌐 INTERNET ARCHIVE SONUÇLARI:');
            sonuclar.internetArchive.slice(0, 2).forEach((kitap, index) => {
                console.log(`\n${index + 1}. 📜 ${kitap.baslik}`);
                console.log(`   👤 Yazar: ${kitap.yazar}`);
                console.log(`   📅 Yayın Yılı: ${kitap.yayinYili}`);
                console.log(`   🖼️ Kapak Resmi: ${kitap.kapakResimleri.orta}`);
                console.log(`   📥 Okuma/İndirme: ${kitap.erisimLinki}`);
            });
            toplamSonuc += sonuclar.internetArchive.length;
            console.log(`\n   ✅ Toplam ${sonuclar.internetArchive.length} sonuç\n`);
        }

        // Özet ve istatistikler
        console.log('=== 📊 ARAMA İSTATİSTİKLERİ ===');
        console.log(`⏱️ Arama Süresi: ${sonuclar.aramaSuresi} saniye`);
        console.log(`📊 Toplam Sonuç: ${toplamSonuc} kitap`);
        console.log(`🔍 Kullanılan Servis: ${sonuclar.openLibrary.length > 0 ? '✅' : '❌'} Open Library, ${sonuclar.googleBooks.length > 0 ? '✅' : '❌'} Google Books, ${sonuclar.oclcClassify ? '✅' : '❌'} OCLC, ${sonuclar.internetArchive.length > 0 ? '✅' : '❌'} Internet Archive`);
        
        if (sonuclar.hatalar.length > 0) {
            console.log(`⚠️ Hatalar: ${sonuclar.hatalar.join(', ')}`);
        }

        console.log('\n=== 🏛️ KÜTÜPHANE BULMA İPUCLARI ===');
        console.log('🔍 WorldCat üzerinden kütüphane aramak için:');
        console.log('   1. Yukarıdaki WorldCat linklerini kullanın');
        console.log('   2. worldcat.org sitesinde manuel arama yapın');
        console.log('   3. OCLC numarası varsa, onu WorldCat\'ta arayın');
        console.log('\n📍 Türkiye\'deki kütüphaneler için:');
        console.log('   • YÖK Ulusal Tez Merkezi: tez.yok.gov.tr');
        console.log('   • Milli Kütüphane: mkutup.gov.tr');
        console.log('   • Üniversite kütüphaneleri katalogları');

        console.log('\n=== 🖼️ KAPAK RESİMLERİ HAKKINDA ===');
        console.log('📏 Kapak Boyutları:');
        console.log('   • Küçük (S): ~75x75px - Liste görünümü için');
        console.log('   • Orta (M): ~150x150px - Kart görünümü için');
        console.log('   • Büyük (L): ~300x300px - Detay sayfası için');
        console.log('🔗 Kapak resimleri doğrudan URL\'lerle erişilebilir');
    }

    // Hızlı kapak testi
    async kapakTesti(isbn = '9780141439518') {
        console.log('🖼️ Kapak resmi testi başlıyor...\n');
        
        const testSonuclari = await this.parallelArama(isbn, 'isbn');
        
        console.log('\n🎯 KAPAK RESMİ TEST SONUÇLARI:');
        
        // Her servisten ilk sonucun kapak bilgilerini göster
        if (testSonuclari.openLibrary.length > 0) {
            const ol = testSonuclari.openLibrary[0];
            console.log(`📚 Open Library: ${ol.kapakResimleri.buyuk ? '✅ Var' : '❌ Yok'}`);
        }
        
        if (testSonuclari.googleBooks.length > 0) {
            const gb = testSonuclari.googleBooks[0];
            console.log(`📖 Google Books: ${gb.kapakResimleri.buyuk ? '✅ Var' : '❌ Yok'}`);
        }
        
        if (testSonuclari.oclcClassify) {
            const oclc = testSonuclari.oclcClassify;
            console.log(`🏛️ OCLC Classify: ${oclc.kapakResimleri.buyuk ? '✅ Var' : '❌ Yok'}`);
        }
        
        if (testSonuclari.internetArchive.length > 0) {
            const ia = testSonuclari.internetArchive[0];
            console.log(`🌐 Internet Archive: ${ia.kapakResimleri.orta ? '✅ Var' : '❌ Yok'}`);
        }
    }
}

// Kullanım örnekleri
async function main() {
    const bulucusu = new AsenkronKutuphaneBulucusu();
    
    try {
        // Örnek 1: Yazar araması - En detaylı
        console.log('=== YAZAR ARAMASI ÖRNEĞİ ===');
        await bulucusu.yazarAraması('Agatha Christie');
        
        console.log('\n' + '='.repeat(100) + '\n');
        
        // Örnek 2: Paralel arama - Başlık ile
        console.log('=== PARALEL BAŞLIK ARAMA ÖRNEĞİ ===');
        await bulucusu.parallelArama('Pride and Prejudice', 'title');
        
        console.log('\n' + '='.repeat(100) + '\n');
        
        // Örnek 3: Paralel arama - ISBN ile
        console.log('=== PARALEL ISBN ARAMA ÖRNEĞİ ===');
        await bulucusu.parallelArama('9780141439518', 'isbn');
        
    } catch (hata) {
        console.error('Program hatası:', hata.message);
    }
}

// Hızlı test fonksiyonu
async function hizliTest() {
    const bulucusu = new AsenkronKutuphaneBulucusu();
    
    console.log('🚀 Hızlı asenkron test başlıyor...\n');
    
    try {
        // Sadece Open Library ile hızlı test
        const sonuclar = await bulucusu.openLibraryArama('Node.js', 'title');
        
        if (sonuclar.length > 0) {
            console.log('✅ Test başarılı!');
            console.log(`İlk sonuç: ${sonuclar[0].baslik} - ${sonuclar[0].yazar}`);
            console.log(`Kapak resmi: ${sonuclar[0].kapakResimleri.orta || 'Bulunamadı'}`);
        } else {
            console.log('❌ Test başarısız - sonuç bulunamadı');
        }
    } catch (hata) {
        console.error('Test hatası:', hata.message);
    }
}

// Yazar araması testi
async function yazarTesti() {
    const bulucusu = new AsenkronKutuphaneBulucusu();
    
    console.log('👤 Yazar araması testi başlıyor...\n');
    
    try {
        // Türk yazar örneği
        await bulucusu.yazarAraması('Orhan Pamuk');
        
        console.log('\n' + '='.repeat(80) + '\n');
        
        // Farklı format ile test
        await bulucusu.yazarAraması('Tolkien, J.R.R.');
        
    } catch (hata) {
        console.error('Yazar testi hatası:', hata.message);
    }
}

// Kapak resmi testi
async function kapakTesti() {
    const bulucusu = new AsenkronKutuphaneBulucusu();
    await bulucusu.kapakTesti('9780140328721'); // Pride and Prejudice ISBN
}

// Programı çalıştır
if (require.main === module) {
    // Seçenekler:
    
    // 1. Hızlı test için:
    // hizliTest();
    
    // 2. Yazar araması testi için:
    // yazarTesti();
    
    // 3. Kapak resmi testi için:
    // kapakTesti();
    
    // 4. Tam paralel arama için:
    main();
}

/**
 * Open Library API'sinden kitap arama
 * @param {string} query - Arama sorgusu
 * @param {string} author - Yazar (opsiyonel)
 * @returns {Array} Open Library sonuçları
 */
LibraryFindService.prototype.searchOpenLibrary = async function(query, author = null) {
    try {
        console.log(`[OpenLibrary] Arama başlatılıyor: "${query}"`);
        
        // Open Library Search API endpoint
        let searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
        
        if (author) {
            searchUrl += `&author=${encodeURIComponent(author)}`;
        }
        
        const response = await axios.get(searchUrl, {
            timeout: this.timeout,
            headers: {
                'User-Agent': this.userAgent,
                'Accept': 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300;
            }
        });
        
        if (!response.data || !response.data.docs) {
            console.log('[OpenLibrary] Geçersiz API yanıtı');
            return [];
        }
        
        const books = response.data.docs.slice(0, 20); // İlk 20 sonuç
        const formattedBooks = [];
        
        for (const book of books) {
            try {
                const formattedBook = {
                    openLibraryKey: book.key,
                    baslik: book.title || 'Başlık Bilinmiyor',
                    yazar: book.author_name ? book.author_name[0] : 'Yazar Bilinmiyor',
                    yayinYili: book.first_publish_year || null,
                    yayinevi: book.publisher ? book.publisher[0] : 'Yayınevi Bilinmiyor',
                    isbn: book.isbn ? book.isbn[0] : null,
                    dil: book.language ? (book.language.includes('tur') || book.language.includes('tr') ? 'Türkçe' : book.language[0]) : 'Bilinmiyor',
                    ozet: book.subtitle || 'Özet bilgisi mevcut değil',
                    kapakResimleri: {
                        kucuk: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg` : null,
                        orta: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
                        buyuk: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : null
                    }
                };
                
                formattedBooks.push(formattedBook);
            } catch (bookError) {
                console.error('[OpenLibrary] Kitap formatlanırken hata:', bookError.message);
            }
        }
        
        console.log(`[OpenLibrary] ${formattedBooks.length} kitap bulundu`);
        return formattedBooks;
        
    } catch (error) {
        console.error('[OpenLibrary] API hatası:', error.message);
        return [];
    }
};

/**
 * Google Books API'sinden kitap arama
 * @param {string} query - Arama sorgusu
 * @param {string} author - Yazar (opsiyonel)
 * @returns {Array} Google Books sonuçları
 */
LibraryFindService.prototype.searchGoogleBooks = async function(query, author = null) {
    try {
        console.log(`[GoogleBooks] Arama başlatılıyor: "${query}"`);
        
        let searchQuery = query;
        if (author) {
            searchQuery += `+inauthor:${author}`;
        }
        
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
            params: {
                q: searchQuery,
                maxResults: 20,
                printType: 'books',
                langRestrict: 'tr' // Türkçe kitapları öncelikle getir
            },
            timeout: this.timeout,
            headers: {
                'User-Agent': this.userAgent
            }
        });
        
        if (!response.data || !response.data.items) {
            console.log('[GoogleBooks] Sonuç bulunamadı');
            return [];
        }
        
        const formattedBooks = response.data.items.map(item => {
            const volumeInfo = item.volumeInfo;
            return {
                googleBooksId: item.id,
                baslik: volumeInfo.title || 'Başlık Bilinmiyor',
                yazar: volumeInfo.authors ? volumeInfo.authors[0] : 'Yazar Bilinmiyor',
                yayinYili: volumeInfo.publishedDate ? parseInt(volumeInfo.publishedDate.substring(0, 4)) : null,
                yayinevi: volumeInfo.publisher || 'Yayınevi Bilinmiyor',
                isbn: volumeInfo.industryIdentifiers ? volumeInfo.industryIdentifiers[0].identifier : null,
                dil: volumeInfo.language === 'tr' ? 'Türkçe' : (volumeInfo.language || 'Bilinmiyor'),
                ozet: volumeInfo.description || 'Özet bilgisi mevcut değil',
                kapakResimleri: {
                    kucuk: volumeInfo.imageLinks?.smallThumbnail,
                    orta: volumeInfo.imageLinks?.thumbnail,
                    buyuk: volumeInfo.imageLinks?.large || volumeInfo.imageLinks?.medium
                },
                googleBooksUrl: volumeInfo.infoLink
            };
        });
        
        console.log(`[GoogleBooks] ${formattedBooks.length} kitap bulundu`);
        return formattedBooks;
        
    } catch (error) {
        console.error('[GoogleBooks] API hatası:', error.message);
        return [];
    }
};

/**
 * OCLC Classify API'sinden kitap arama
 * @param {string} query - Arama sorgusu
 * @returns {Object|null} OCLC Classify sonucu
 */
LibraryFindService.prototype.searchOCLCClassify = async function(query) {
    try {
        console.log(`[OCLC] Arama başlatılıyor: "${query}"`);
        
        // OCLC/WorldCat API'leri artık authentication gerektiriyor (401/404 hatası)
        // Bu nedenle servis devre dışı bırakıldı
        console.log('[OCLC] Servis devre dışı (API authentication gerekli)');
        return null;
        
        // WorldCat API kodu - authentication gerektiği için comment'te
        /*
        const response = await axios.get('http://www.worldcat.org/webservices/catalog/search/worldcat/opensearch', {
            params: {
                q: query,
                format: 'atom',
                count: 1 // Sadece 1 sonuç al
            },
            timeout: this.timeout,
            headers: {
                'User-Agent': this.userAgent,
                'Accept': 'application/atom+xml'
            }
        });
        
        if (!response.data) {
            console.log('[WorldCat] Geçersiz yanıt');
            return null;
        }
        
        // Atom XML'i parse et
        const xml2js = require('xml2js');
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        
        if (!result.feed || !result.feed.entry || result.feed.entry.length === 0) {
            console.log('[WorldCat] Sonuç bulunamadı');
            return null;
        }
        
        const entry = result.feed.entry[0];
        const formattedBook = {
            oclcNumarasi: entry.id ? entry.id[0].split('/').pop() : Math.random().toString(),
            baslik: entry.title ? entry.title[0] : 'Başlık Bilinmiyor',
            yazar: entry.author && entry.author[0] && entry.author[0].name ? entry.author[0].name[0] : 'Yazar Bilinmiyor',
            yayinYili: entry.published ? parseInt(entry.published[0].substring(0, 4)) : null,
            yayinevi: 'WorldCat',
            isbn: null,
            dil: 'Bilinmiyor',
            ozet: entry.summary ? entry.summary[0] : 'WorldCat kaynağından',
            kapakResimleri: {
                kucuk: null,
                orta: null,
                buyuk: null
            }
        };
        
        console.log('[WorldCat] 1 kitap bulundu');
        return formattedBook;
        
        // Eski OCLC Classify kodu - API kapalı olduğu için comment'te
        /*
        const response = await axios.get(`http://classify.oclc.org/classify2/Classify`, {
            params: {
                title: query,
                summary: 'true'
            },
            timeout: this.timeout,
            headers: {
                'User-Agent': this.userAgent
            }
        });
        
        if (!response.data) {
            console.log('[OCLCClassify] Geçersiz yanıt');
            return null;
        }
        
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        
        if (!result.classify || !result.classify.work) {
            console.log('[OCLCClassify] Sonuç bulunamadı');
            return null;
        }
        
        const work = result.classify.work[0];
        const formattedBook = {
            oclcNumarasi: work.$.owi,
            baslik: work.$.title || 'Başlık Bilinmiyor',
            yazar: work.$.author || 'Yazar Bilinmiyor',
            yayinYili: work.$.hyr ? parseInt(work.$.hyr) : null,
            yayinevi: 'OCLC Classify',
            isbn: work.$.isbn || null,
            dil: 'Bilinmiyor',
            ozet: 'OCLC Classify kaynağından',
            kapakResimleri: {
                kucuk: null,
                orta: null,
                buyuk: null
            }
        };
        
        console.log('[OCLCClassify] 1 kitap bulundu');
        return formattedBook;
        */
        
    } catch (error) {
        console.error('[OCLCClassify] API hatası:', error.message);
        return null;
    }
};

/**
 * Internet Archive API'sinden kitap arama
 * @param {string} query - Arama sorgusu
 * @returns {Array} Internet Archive sonuçları
 */
LibraryFindService.prototype.searchInternetArchive = async function(query) {
    try {
        console.log(`[InternetArchive] Arama başlatılıyor: "${query}"`);
        
        const response = await axios.get(`https://archive.org/advancedsearch.php`, {
            params: {
                q: `title:(${query}) AND mediatype:texts`,
                fl: 'identifier,title,creator,date,publisher,language,description',
                rows: 10,
                page: 1,
                output: 'json'
            },
            timeout: this.timeout,
            headers: {
                'User-Agent': this.userAgent
            }
        });
        
        if (!response.data || !response.data.response || !response.data.response.docs) {
            console.log('[InternetArchive] Sonuç bulunamadı');
            return [];
        }
        
        const formattedBooks = response.data.response.docs.map(doc => ({
            internetArchiveId: doc.identifier,
            baslik: doc.title || 'Başlık Bilinmiyor',
            yazar: doc.creator || 'Yazar Bilinmiyor',
            yayinYili: doc.date ? parseInt(doc.date.substring(0, 4)) : null,
            yayinevi: doc.publisher || 'Internet Archive',
            isbn: null,
            dil: doc.language === 'Turkish' || doc.language === 'tur' ? 'Türkçe' : (doc.language || 'Bilinmiyor'),
            ozet: doc.description || 'Internet Archive kaynağından',
            kapakResimleri: {
                kucuk: `https://archive.org/services/img/${doc.identifier}`,
                orta: `https://archive.org/services/img/${doc.identifier}`,
                buyuk: `https://archive.org/services/img/${doc.identifier}`
            }
        }));
        
        console.log(`[InternetArchive] ${formattedBooks.length} kitap bulundu`);
        return formattedBooks;
        
    } catch (error) {
        console.error('[InternetArchive] API hatası:', error.message);
        return [];
    }
};

/**
 * Kitap arama metodu - Sayfalama olmadan tüm sonuçları döndürür
 * @param {Object} params - Arama parametreleri
 * @param {string} params.query - Arama sorgusu
 * @param {string} params.author - Yazar (opsiyonel)
 * @returns {Object} Arama sonuçları
 */
LibraryFindService.prototype.searchBooks = async function(params) {
    const { query, author } = params;
    
    console.log(`[LibraryFindService] Kitap araması başlatılıyor: "${query}"`);
    const startTime = Date.now();
    
    try {
        // Paralel arama yap - tüm servisleri kullan
        const [openLibraryResults, googleBooksResults, oclcResult, internetArchiveResults] = await Promise.allSettled([
            this.searchOpenLibrary(query, author),
            this.searchGoogleBooks(query, author),
            this.searchOCLCClassify(query),
            this.searchInternetArchive(query)
        ]);
        
        // Sonuçları işle
        const results = {
            openLibrary: openLibraryResults.status === 'fulfilled' ? openLibraryResults.value : [],
            googleBooks: googleBooksResults.status === 'fulfilled' ? googleBooksResults.value : [],
            oclcClassify: oclcResult.status === 'fulfilled' ? oclcResult.value : null,
            internetArchive: internetArchiveResults.status === 'fulfilled' ? internetArchiveResults.value : []
        };
        
        // Sonuçları birleştir ve formatla
        let allBooks = [];
        
        // Open Library sonuçları
        if (results.openLibrary && results.openLibrary.length > 0) {
            allBooks = allBooks.concat(results.openLibrary.map(book => ({
                id: book.openLibraryKey || Math.random().toString(),
                title: book.baslik,
                authors: [book.yazar],
                year: book.yayinYili,
                publisher: book.yayinevi,
                isbn: book.isbn,
                language: book.dil || 'Bilinmiyor', // Dil bilgisi eklendi
                coverImage: book.kapakResimleri?.orta || 'https://via.placeholder.com/200x300?text=Kapak+Yok',
                coverImages: book.kapakResimleri,
                abstract: book.ozet || 'Özet bilgisi mevcut değil',
                source: 'Open Library',
                url: `https://openlibrary.org${book.openLibraryKey}`
            })));
        }
        
        // Google Books sonuçları
        if (results.googleBooks && results.googleBooks.length > 0) {
            allBooks = allBooks.concat(results.googleBooks.map(book => ({
                id: book.googleBooksId || Math.random().toString(),
                title: book.baslik,
                authors: [book.yazar],
                year: book.yayinYili,
                publisher: book.yayinevi,
                isbn: book.isbn,
                language: book.dil || 'Bilinmiyor', // Dil bilgisi eklendi
                coverImage: book.kapakResimleri?.orta || 'https://via.placeholder.com/200x300?text=Kapak+Yok',
                coverImages: book.kapakResimleri,
                abstract: book.ozet || 'Özet bilgisi mevcut değil',
                source: 'Google Books',
                url: book.googleBooksUrl
            })));
        }
        
        // OCLC Classify sonucu (tek sonuç)
        if (results.oclcClassify) {
            allBooks.push({
                id: results.oclcClassify.oclcNumarasi || Math.random().toString(),
                title: results.oclcClassify.baslik,
                authors: [results.oclcClassify.yazar],
                year: results.oclcClassify.yayinYili,
                publisher: results.oclcClassify.yayinevi,
                isbn: results.oclcClassify.isbn,
                language: results.oclcClassify.dil || 'Bilinmiyor', // Dil bilgisi eklendi
                coverImage: results.oclcClassify.kapakResimleri?.orta || 'https://via.placeholder.com/200x300?text=Kapak+Yok',
                coverImages: results.oclcClassify.kapakResimleri,
                abstract: results.oclcClassify.ozet || 'Özet bilgisi mevcut değil',
                source: 'OCLC Classify',
                url: `https://worldcat.org/oclc/${results.oclcClassify.oclcNumarasi}`
            });
        }
        
        // Internet Archive sonuçları
        if (results.internetArchive && results.internetArchive.length > 0) {
            allBooks = allBooks.concat(results.internetArchive.map(book => ({
                id: book.internetArchiveId || Math.random().toString(),
                title: book.baslik,
                authors: [book.yazar],
                year: book.yayinYili,
                publisher: book.yayinevi || 'Bilinmiyor',
                isbn: book.isbn,
                language: book.dil || 'Bilinmiyor', // Dil bilgisi eklendi
                coverImage: book.kapakResimleri?.orta || 'https://via.placeholder.com/200x300?text=Kapak+Yok',
                coverImages: book.kapakResimleri,
                abstract: book.ozet || 'Özet bilgisi mevcut değil',
                source: 'Internet Archive',
                url: `https://archive.org/details/${book.internetArchiveId}`
            })));
        }
        
        // Türkçe yayınları en üste getirmek için sıralama yap
        allBooks.sort((a, b) => {
            // Dil bilgisini kontrol et
            const aLanguage = (a.language || '').toLowerCase();
            const bLanguage = (b.language || '').toLowerCase();
            
            // Türkçe kontrolü - çeşitli varyasyonları kontrol et
            const aTurkish = aLanguage.includes('türkçe') || aLanguage.includes('turkish') || aLanguage.includes('tr') || aLanguage === 'tur';
            const bTurkish = bLanguage.includes('türkçe') || bLanguage.includes('turkish') || bLanguage.includes('tr') || bLanguage === 'tur';
            
            // Türkçe kitapları en üste getir
            if (aTurkish && !bTurkish) return -1;
            if (!aTurkish && bTurkish) return 1;
            
            // Aynı dildeyse alfabetik sırala
            return (a.title || '').localeCompare(b.title || '', 'tr-TR');
        });
        
        // Gerçek sonuç sayısını hesapla
        const actualCount = allBooks.length;
        const turkishCount = allBooks.filter(book => {
            const language = (book.language || '').toLowerCase();
            return language.includes('türkçe') || language.includes('turkish') || language.includes('tr') || language === 'tur';
        }).length;
        
        // Arama süresini hesapla
        const endTime = Date.now();
        const searchTime = endTime - startTime;
        
        console.log(`[LibraryFindService] Toplam ${actualCount} kitap bulundu (${turkishCount} Türkçe) - ${searchTime}ms:`);
        console.log(`  - Open Library: ${results.openLibrary?.length || 0}`);
        console.log(`  - Google Books: ${results.googleBooks?.length || 0}`);
        console.log(`  - OCLC Classify: ${results.oclcClassify ? 1 : 0}`);
        console.log(`  - Internet Archive: ${results.internetArchive?.length || 0}`);
        console.log(`  - Türkçe yayınlar en üstte sıralandı: ${turkishCount} adet`);
        
        return {
            success: true,
            totalResults: actualCount, // Gerçek sonuç sayısı
            results: allBooks,
            searchTime: searchTime, // Milisaniye cinsinden arama süresi
            sources: {
                openLibrary: results.openLibrary?.length || 0,
                googleBooks: results.googleBooks?.length || 0,
                oclcClassify: results.oclcClassify ? 1 : 0,
                internetArchive: results.internetArchive?.length || 0
            },
            // Sayfalama bilgileri kaldırıldı - tüm sonuçlar tek seferde döndürülüyor
            message: `${actualCount} kitap bulundu - tüm sonuçlar gösteriliyor (${searchTime}ms)`
        };
        
    } catch (error) {
        console.error('[LibraryFindService] Kitap arama hatası:', error);
        return {
            success: false,
            totalResults: 0,
            results: [],
            error: error.message,
            sources: {
                openLibrary: 0,
                googleBooks: 0,
                oclcClassify: 0,
                internetArchive: 0
            }
        };
    }
};

module.exports = LibraryFindService;