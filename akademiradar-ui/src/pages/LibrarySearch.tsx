import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Paper,
    IconButton,
    Tooltip,
    Badge,
    LinearProgress,
    Tabs,
    Tab,
    CardMedia,
    CardActions,
    Pagination,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Search as SearchIcon,
    MenuBook as LibraryIcon,
    Public as PublicIcon,
    LocationOn as LocationIcon,
    Book as BookIcon,
    Link as LinkIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    School as SchoolIcon,
    Language as LanguageIcon,
    Search as SearchIconMUI,
    CollectionsBookmark as CollectionsBookmarkIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
    OpenInNew as OpenInNewIcon,
    Person as PersonIcon,
    AutoStories as AutoStoriesIcon,
    Favorite as FavoriteIcon,
    Share as ShareIcon
} from '@mui/icons-material';

interface Kitap {
    id?: string;
    baslik: string;
    yazarlar?: string[];
    yayinYili?: string;
    yayinevi?: string;
    isbn?: string[];
    kapakResimleri?: {
        kucuk?: string;
        orta?: string;
        buyuk?: string;
    };
    ozet?: string;
    abstract?: string;  // Milli Kütüphane API'sinden gelen özet
    icindekiler?: string[]; // İçindekiler sayfası
    konular?: string[];
    dil?: string;
    sayfaSayisi?: number;
    baski?: string;
    kaynak?: string;
    type?: string;      // Yayın türü (book, journal, article, thesis, vb.)
    yayinTuru?: string; // Türkçe yayın türü
    oclcNumarasi?: string;
    openLibraryKey?: string;
    googleBooksId?: string;
    internetArchiveId?: string;
    erisimLinki?: string;
    onizlemeVarMi?: boolean;
}

interface KitapAramaSonucu {
    basarili: boolean;
    toplam: number;
    sayfa: number;
    limit: number;
    toplamSayfa: number;
    veriler: Kitap[];
    hata?: string;
    detaylar?: string;
    aramaSuresi?: number;
    kaynaklar?: {
        openLibrary: number;
        googleBooks: number;
        internetArchive: number;
        oclcClassify: number;
    };
}

interface KutuphaneSonucu {
    kutuphanAdi: string;
    ulke: string;
    sehir: string;
    kurum: string;
    yerNumarasi: string;
    format: string;
    musaitlik: string;
    url: string;
    katalogUrl: string;
    servisAdi: string;
}

interface AramaIstatistikleri {
    toplamKutuphane: number;
    ulkeSayisi: number;
    formatSayisi: number;
    musaitSayisi: number;
    musaitlikOrani: number;
}

interface AramaSonucu {
    basarili: boolean;
    aramaSorgusu: {
        baslik?: string;
        yazar?: string;
        isbn?: string;
        yil?: string;
    };
    bulunanToplamKutuphane: number;
    ulkeyeGoreKutuphaneler: { [ulke: string]: KutuphaneSonucu[] };
    istatistikler: AramaIstatistikleri;
    mevcutFormatlar: string[];
    aramaZamani: string;
    hatalar?: Array<{ servis: string; hata: string }>;
}

const KutuphanveArama: React.FC = () => {
    // Tab durumu
    const [aktifTab, setAktifTab] = useState(0);
    
    // Kütüphane arama durumu
    const [aramaParametreleri, setAramaParametreleri] = useState({
        baslik: '',
        yazar: '',
        isbn: '',
        yil: ''
    });
    
    // Kitap arama durumu - Sayfalama kaldırıldı
    const [kitapAramaParametreleri, setKitapAramaParametreleri] = useState({
        sorgu: '',
        yazar: ''
        // sayfa ve limit parametreleri kaldırıldı - tüm veriler tek sayfada gösteriliyor
    });
    
    const [aramaSonucu, setAramaSonucu] = useState<AramaSonucu | null>(null);
    const [kitapAramaSonucu, setKitapAramaSonucu] = useState<KitapAramaSonucu | null>(null);
    const [yukleniyor, setYukleniyor] = useState(false);
    const [kitapYukleniyor, setKitapYukleniyor] = useState(false);
    const [hata, setHata] = useState<string | null>(null);
    const [kitapHatasi, setKitapHatasi] = useState<string | null>(null);
    const [populerKutuphaneler, setPopulerKutuphaneler] = useState<any[]>([]);
    const [sonAramalar, setSonAramalar] = useState<string[]>([]);
    const [favoriKitaplar, setFavoriKitaplar] = useState<string[]>([]);
    
    // Modal state'leri
    const [detaylarModalAcik, setDetaylarModalAcik] = useState(false);
    const [seciliKitap, setSeciliKitap] = useState<Kitap | null>(null);
    const [kapakModalAcik, setKapakModalAcik] = useState(false);
    const [seciliKapakResmi, setSeciliKapakResmi] = useState<string>('');

    // Popüler kütüphaneleri yükle
    useEffect(() => {
        populerKutuphaneleriYukle();
        sonAramalariYukle();
        favoriKitaplariYukle();
    }, []);

    const populerKutuphaneleriYukle = async () => {
        try {
            // Örnek popüler kütüphaneler - gerçek API çağrısı yapılabilir
            const ornekKutuphaneler = [
                {
                    ad: 'Milli Kütüphane',
                    aciklama: 'Türkiye Cumhuriyeti Milli Kütüphanesi',
                    kapsam: 'Ulusal',
                    diller: ['Türkçe', 'İngilizce', 'Arapça'],
                    uzmanliklar: ['Tarih', 'Edebiyat', 'Bilim']
                },
                {
                    ad: 'İstanbul Üniversitesi Kütüphanesi', 
                    aciklama: 'Tarihi akademik kütüphane',
                    kapsam: 'Akademik',
                    diller: ['Türkçe', 'İngilizce'],
                    uzmanliklar: ['Araştırma', 'Akademik Yayınlar']
                },
                {
                    ad: 'ODTÜ Kütüphanesi',
                    aciklama: 'Teknik ve mühendislik odaklı kütüphane',
                    kapsam: 'Teknik',
                    diller: ['İngilizce', 'Türkçe'],
                    uzmanliklar: ['Mühendislik', 'Bilgisayar', 'Fen Bilimleri']
                }
            ];
            setPopulerKutuphaneler(ornekKutuphaneler);
        } catch (hata) {
            console.warn('Popüler kütüphaneler yüklenemedi:', hata);
        }
    };

    const sonAramalariYukle = () => {
        const kaydedilmisAramalar = localStorage.getItem('sonAramalar');
        if (kaydedilmisAramalar) {
            setSonAramalar(JSON.parse(kaydedilmisAramalar));
        }
    };

    const favoriKitaplariYukle = () => {
        const kaydedilmisFavoriler = localStorage.getItem('favoriKitaplar');
        if (kaydedilmisFavoriler) {
            setFavoriKitaplar(JSON.parse(kaydedilmisFavoriler));
        }
    };

    const girisDegisikligiIshle = (alan: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setAramaParametreleri(onceki => ({
            ...onceki,
            [alan]: event.target.value
        }));
    };

    const kitapAramaGirisDegisikligiIshle = (alan: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setKitapAramaParametreleri(onceki => ({
            ...onceki,
            [alan]: event.target.value
        }));
    };

    const aramaYap = async () => {
        if (aktifTab === 0) {
            // Kütüphane araması
            if (!aramaParametreleri.baslik && !aramaParametreleri.yazar && !aramaParametreleri.isbn) {
                setHata('En az bir arama kriteri giriniz (başlık, yazar veya ISBN)');
                return;
            }

            setYukleniyor(true);
            setHata(null);
            setAramaSonucu(null);

            try {
                // Örnek API çağrısı - gerçek backend ile değiştirilecek
                // Örnek API çağrısı - gerçek backend ile değiştirilecek
                const ornekSonuc: AramaSonucu = {
                    basarili: true,
                    aramaSorgusu: aramaParametreleri,
                    bulunanToplamKutuphane: 5,
                    ulkeyeGoreKutuphaneler: {
                        'Türkiye': [
                            {
                                kutuphanAdi: 'Milli Kütüphane',
                                ulke: 'Türkiye',
                                sehir: 'Ankara',
                                kurum: 'T.C. Kültür ve Turizm Bakanlığı',
                                yerNumarasi: 'QA76.73.J39',
                                format: 'Kitap',
                                musaitlik: 'Mevcut',
                                url: 'https://www.mkutup.gov.tr',
                                katalogUrl: 'https://katalog.mkutup.gov.tr',
                                servisAdi: 'Milli Kütüphane Katalog'
                            }
                        ]
                    },
                    istatistikler: {
                        toplamKutuphane: 5,
                        ulkeSayisi: 2,
                        formatSayisi: 3,
                        musaitSayisi: 4,
                        musaitlikOrani: 80
                    },
                    mevcutFormatlar: ['Kitap', 'E-kitap', 'Dergi'],
                    aramaZamani: new Date().toISOString(),
                    hatalar: []
                };
                
                setAramaSonucu(ornekSonuc);
            } catch (hata) {
                console.error('Arama hatası:', hata);
                setHata('Arama işlemi sırasında bir hata oluştu');
            } finally {
                setYukleniyor(false);
            }
        } else {
            // Kitap araması
            if (!kitapAramaParametreleri.sorgu) {
                setKitapHatasi('Lütfen bir arama terimi giriniz');
                return;
            }

            setKitapYukleniyor(true);
            setKitapHatasi(null);
            setKitapAramaSonucu(null);

            try {
                // Milli Kütüphane API'sini çağır - Tüm veriler tek seferde çekiliyor
                const response = await axios.post('http://localhost:5000/api/library-search', {
                    query: kitapAramaParametreleri.sorgu,
                    searchType: 'all',
                    limit: 1000, // Tüm sonuçları almak için yüksek limit
                    start: 0 // Her zaman baştan başla
                });
                
                const aramaSonucu = {
                    basarili: response.data.success,
                    toplam: response.data.totalResults || 0,
                    sayfa: 1, // Her zaman tek sayfa
                    limit: response.data.totalResults || 0, // Tüm sonuçlar
                    toplamSayfa: 1, // Her zaman tek sayfa
                    veriler: response.data.results?.map((item: any) => ({
                        id: item.id || Math.random().toString(),
                        baslik: item.title || item.baslik || 'Başlık bulunamadı',
                        yazarlar: item.authors || item.yazarlar || ['Yazar bilgisi yok'],
                        yayinYili: item.year || item.yayinYili || 'Yıl bilgisi yok',
                        yayinevi: item.publisher || item.yayinevi || 'Yayınevi bilgisi yok',
                        isbn: item.isbn ? [item.isbn] : [],
                        kapakResimleri: {
                            kucuk: item.coverImages?.small || item.kapakResimleri?.kucuk,
                            orta: item.coverImages?.medium || item.coverImage || item.kapakResmi || 'https://via.placeholder.com/200x300?text=Kapak+Yok',
                            buyuk: item.coverImages?.large || item.kapakResimleri?.buyuk
                        },
                        ozet: item.abstract || item.summary || item.ozet || 'Özet bilgisi mevcut değil',
                        icindekiler: item.tableOfContents || item.icindekiler || [], // İçindekiler mapping'i eklendi
                        dil: item.language || item.dil || 'Türkçe',
                        sayfaSayisi: item.pages || item.sayfaSayisi,
                        kaynak: 'Milli Kütüphane',
                        oclcNumarasi: item.oclcNumber || item.oclcNumarasi,
                        yerNumarasi: item.shelfLocation || item.yerNumarasi || 'Raf bilgisi yok',
                        erisimLinki: item.url || item.erisimLinki,
                        type: item.type || item.yayinTuru || 'book', // Yayın türü eklendi
                        yayinTuru: item.type || item.yayinTuru || 'book', // Türkçe yayın türü
                        abstract: item.abstract || item.ozet || 'Özet bilgisi mevcut değil' // Özet alanı eklendi
                    })) || [],
                    hata: response.data.success ? undefined : response.data.error,
                    aramaSuresi: 1000,
                    kaynaklar: {
                        openLibrary: 0,
                        googleBooks: 0,
                        internetArchive: 0,
                        oclcClassify: response.data.results?.length || 0
                    }
                };
                
                if (aramaSonucu.basarili) {
                    setKitapAramaSonucu(aramaSonucu);
                    // Son aramalara ekle
                    const yeniAramalar = [kitapAramaParametreleri.sorgu, ...sonAramalar.filter(s => s !== kitapAramaParametreleri.sorgu)];
                    const guncelAramalar = yeniAramalar.slice(0, 5);
                    setSonAramalar(guncelAramalar);
                    localStorage.setItem('sonAramalar', JSON.stringify(guncelAramalar));
                } else {
                    setKitapHatasi(aramaSonucu.hata || 'Kitap arama işlemi başarısız oldu');
                }
            } catch (hata) {
                console.error('Kitap arama hatası:', hata);
                setKitapHatasi('Kitap arama işlemi sırasında bir hata oluştu');
            } finally {
                setKitapYukleniyor(false);
            }
        }
    };

    // Mock kitap arama fonksiyonu - gerçek API ile değiştirilecek
    const mockKitapAramasi = async (parametreler: any): Promise<KitapAramaSonucu> => {
        // Bu bölüm gerçek backend ile değiştirilecek
        return new Promise((resolve) => {
            setTimeout(() => {
                const ornekKitaplar: Kitap[] = [
                    {
                        id: '1',
                        baslik: 'JavaScript: The Definitive Guide',
                        yazarlar: ['David Flanagan'],
                        yayinYili: '2020',
                        yayinevi: 'O\'Reilly Media',
                        isbn: ['9781491952023'],
                        kapakResimleri: {
                            orta: 'https://covers.openlibrary.org/b/isbn/9781491952023-M.jpg'
                        },
                        ozet: 'JavaScript programlama dili için kapsamlı rehber kitabı.',
                        dil: 'İngilizce',
                        sayfaSayisi: 706,
                        kaynak: 'Open Library',
                        oclcNumarasi: '1234567890'
                    },
                    {
                        id: '2',
                        baslik: 'React: Up & Running',
                        yazarlar: ['Stoyan Stefanov'],
                        yayinYili: '2021',
                        yayinevi: 'O\'Reilly Media',
                        isbn: ['9781492051459'],
                        kapakResimleri: {
                            orta: 'https://covers.openlibrary.org/b/isbn/9781492051459-M.jpg'
                        },
                        ozet: 'React kütüphanesi ile modern web uygulamaları geliştirme.',
                        dil: 'İngilizce',
                        sayfaSayisi: 222,
                        kaynak: 'Google Books'
                    }
                ];

                resolve({
                    basarili: true,
                    toplam: ornekKitaplar.length,
                    sayfa: 1,
                    limit: 12,
                    toplamSayfa: 1,
                    veriler: ornekKitaplar,
                    aramaSuresi: 1.5,
                    kaynaklar: {
                        openLibrary: 1,
                        googleBooks: 1,
                        internetArchive: 0,
                        oclcClassify: 0
                    }
                });
            }, 2000);
        });
    };

    const tusBaskisiIshle = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            aramaYap();
        }
    };

    const kutuphanveUrlAc = (url: string) => {
        if (url) {
            window.open(url, '_blank');
        }
    };

    const favoriyeEkle = (kitapId: string) => {
        const yeniFavoriler = favoriKitaplar.includes(kitapId) 
            ? favoriKitaplar.filter(id => id !== kitapId)
            : [...favoriKitaplar, kitapId];
        
        setFavoriKitaplar(yeniFavoriler);
        localStorage.setItem('favoriKitaplar', JSON.stringify(yeniFavoriler));
    };

    // Modal işleyici fonksiyonları
    const detaylarModalAc = (kitap: Kitap) => {
        setSeciliKitap(kitap);
        setDetaylarModalAcik(true);
    };

    const detaylarModalKapat = () => {
        setDetaylarModalAcik(false);
        setSeciliKitap(null);
    };

    const kapakModalAc = (kapakResmi: string) => {
        setSeciliKapakResmi(kapakResmi);
        setKapakModalAcik(true);
    };

    const kapakModalKapat = () => {
        setKapakModalAcik(false);
        setSeciliKapakResmi('');
    };

    // Yayın türü rengini belirleyen fonksiyon
    const getPublicationTypeColor = (type?: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' => {
        if (!type) return 'primary';
        
        switch (type.toLowerCase()) {
            case 'book':
            case 'kitap':
                return 'primary';
            case 'journal':
            case 'dergi':
                return 'info';
            case 'article':
            case 'makale':
                return 'success';
            case 'thesis':
            case 'tez':
                return 'warning';
            case 'novel':
            case 'roman':
                return 'secondary';
            case 'textbook':
            case 'ders kitabı':
                return 'error';
            default:
                return 'primary';
        }
    };

    const kitapKartiGoster = (kitap: Kitap) => (
        <Card key={kitap.id || kitap.isbn?.[0] || kitap.baslik} 
              sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, shadow 0.2s',
                  '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                  }
              }}>
            <Box sx={{ display: 'flex', flexGrow: 1 }}>
                {kitap.kapakResimleri?.orta && (
                    <Box sx={{ 
                        width: 140,
                        height: '100%', // Kartın tam yüksekliği
                        display: 'flex',
                        flexDirection: 'column', // Dikey sıralama
                        alignItems: 'center', // Yatay ortalama
                        justifyContent: 'center', // Dikey ortalama
                        py: 2, // Üst ve alt eşit padding (16px)
                        borderRadius: '4px 0 0 4px',
                        gap: 1 // Resim ve chip arası boşluk
                    }}>
                        <CardMedia
                            component="img"
                            sx={{ 
                                width: 140,
                                height: 200, // Orijinal boyut korundu
                                objectFit: 'cover', // Orijinal ayar korundu
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'scale(1.02)'
                                }
                            }}
                            image={kitap.kapakResimleri.orta}
                            alt={`${kitap.baslik} kapak resmi`}
                            onClick={() => kapakModalAc(kitap.kapakResimleri?.buyuk || kitap.kapakResimleri?.orta || '')}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        
                        {/* Yayın Türü Chip'i - Kapak Altında */}
                        {(kitap.type || kitap.yayinTuru) && (
                            <Chip 
                                label={kitap.type || kitap.yayinTuru}
                                size="small"
                                variant="filled"
                                color={getPublicationTypeColor(kitap.type || kitap.yayinTuru)}
                                sx={{ 
                                    fontSize: '0.7rem',
                                    height: 20,
                                    fontWeight: 'bold'
                                }}
                            />
                        )}
                    </Box>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div" sx={{ 
                            fontWeight: 'bold',
                            color: 'primary.main',
                            mb: 1,
                            lineHeight: 1.3
                        }}>
                            {kitap.baslik}
                        </Typography>
                        
                        {kitap.yazarlar && kitap.yazarlar.length > 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ 
                                mt: 1, 
                                display: 'flex', 
                                alignItems: 'center',
                                fontWeight: 500
                            }}>
                                <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                {kitap.yazarlar.join(', ')}
                            </Typography>
                        )}
                        
                        {kitap.yayinYili && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                📅 Yayın Yılı: {kitap.yayinYili}
                            </Typography>
                        )}
                        
                        {kitap.yayinevi && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                🏢 Yayınevi: {kitap.yayinevi}
                            </Typography>
                        )}
                        
                        {kitap.isbn && kitap.isbn.length > 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                📘 ISBN: {kitap.isbn[0]}
                            </Typography>
                        )}
                        
                        {kitap.sayfaSayisi && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                📄 Sayfa: {kitap.sayfaSayisi}
                            </Typography>
                        )}
                        
                        {kitap.dil && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                🌐 Dil: {kitap.dil}
                            </Typography>
                        )}
                        

                        
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                                label={kitap.kaynak || 'Bilinmeyen Kaynak'} 
                                size="small" 
                                variant="outlined"
                                color="primary"
                            />
                            {kitap.onizlemeVarMi && (
                                <Chip 
                                    label="Önizleme Mevcut" 
                                    size="small" 
                                    color="success"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                    </CardContent>
                    
                    <CardActions sx={{ 
                        mt: 'auto', 
                        justifyContent: 'space-between', 
                        p: 2,
                        pt: 0
                    }}>
                        <Box>
                            <Tooltip title="Favorilere ekle/çıkar">
                                <IconButton 
                                    onClick={() => favoriyeEkle(kitap.id || kitap.isbn?.[0] || kitap.baslik)}
                                    color={favoriKitaplar.includes(kitap.id || kitap.isbn?.[0] || kitap.baslik) ? 'error' : 'default'}
                                >
                                    {favoriKitaplar.includes(kitap.id || kitap.isbn?.[0] || kitap.baslik) ? 
                                        <FavoriteIcon /> : <StarBorderIcon />
                                    }
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Paylaş">
                                <IconButton 
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: kitap.baslik,
                                                text: `${kitap.baslik} - ${kitap.yazarlar?.join(', ')}`
                                            });
                                        }
                                    }}
                                >
                                    <ShareIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        
                        <Box>
                            {kitap.oclcNumarasi && (
                                <Button 
                                    size="small" 
                                    startIcon={<PublicIcon />}
                                    onClick={() => window.open(`https://worldcat.org/oclc/${kitap.oclcNumarasi}`, '_blank')}
                                    sx={{ mr: 1 }}
                                >
                                    WorldCat
                                </Button>
                            )}
                            <Button 
                                size="small" 
                                startIcon={<InfoIcon />}
                                variant="contained"
                                onClick={() => detaylarModalAc(kitap)}
                            >
                                Detaylar
                            </Button>
                        </Box>
                    </CardActions>
                </Box>
            </Box>
        </Card>
    );

    const sayfaDegisikligiIshle = (event: React.ChangeEvent<unknown>, deger: number) => {
        setKitapAramaParametreleri(onceki => ({
            ...onceki,
            sayfa: deger
        }));
        // Yeni sayfa ile arama yap
        aramaYap();
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Başlık */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ 
                    fontWeight: 'bold', 
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2
                }}>
                    <LibraryIcon sx={{ fontSize: '3rem', mr: 2, verticalAlign: 'middle' }} />
                    Kütüphane ve Kitap Arama
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                    Milyonlarca kitabı ara, hangi kütüphanelerde bulunduğunu keşfet ve kapak resimleriyle birlikte detaylı bilgilere ulaş
                </Typography>
            </Box>
            
            {/* Tablar */}
            <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
                <Tabs 
                    value={aktifTab} 
                    onChange={(_, yeniDeger) => setAktifTab(yeniDeger)}
                    variant="fullWidth"
                    indicatorColor="primary"
                    textColor="primary"
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            py: 2
                        }
                    }}
                >
                    <Tab 
                        label="Kütüphanelerde Ara" 
                        icon={<CollectionsBookmarkIcon />} 
                        iconPosition="start" 
                    />
                    <Tab 
                        label="Kitapları Keşfet" 
                        icon={<AutoStoriesIcon />} 
                        iconPosition="start" 
                    />
                </Tabs>
            </Paper>

            {/* Son Aramalar */}
            {sonAramalar.length > 0 && (
                <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Son Aramalarınız:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {sonAramalar.map((arama, index) => (
                            <Chip
                                key={index}
                                label={arama}
                                size="small"
                                onClick={() => {
                                    setKitapAramaParametreleri(onceki => ({
                                        ...onceki,
                                        sorgu: arama
                                    }));
                                }}
                                sx={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Box>
                </Paper>
            )}

            {/* Arama Formu */}
            <Paper elevation={4} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 3,
                    color: 'primary.main',
                    fontWeight: 600
                }}>
                    <SearchIcon sx={{ mr: 1 }} />
                    {aktifTab === 0 ? 'Kütüphanelerde Yayın Ara' : 'Kitap Koleksiyonunda Ara'}
                </Typography>
                
                {aktifTab === 0 ? (
                    // Kütüphane Arama Formu
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Kitap/Yayın Başlığı"
                                variant="outlined"
                                value={aramaParametreleri.baslik}
                                onChange={girisDegisikligiIshle('baslik')}
                                onKeyPress={tusBaskisiIshle}
                                placeholder="Örn: Yapay Zeka ve Makine Öğrenmesi"
                                InputProps={{
                                    startAdornment: <BookIcon sx={{ color: 'action.active', mr: 1 }} />
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Yazar Adı"
                                variant="outlined"
                                value={aramaParametreleri.yazar}
                                onChange={girisDegisikligiIshle('yazar')}
                                onKeyPress={tusBaskisiIshle}
                                placeholder="Örn: Ahmet Yılmaz"
                                InputProps={{
                                    startAdornment: <PersonIcon sx={{ color: 'action.active', mr: 1 }} />
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="ISBN Numarası"
                                variant="outlined"
                                value={aramaParametreleri.isbn}
                                onChange={girisDegisikligiIshle('isbn')}
                                onKeyPress={tusBaskisiIshle}
                                placeholder="Örn: 978-975-123-456-7"
                                InputProps={{
                                    startAdornment: <span style={{ marginRight: 8 }}>📘</span>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Yayın Yılı"
                                variant="outlined"
                                value={aramaParametreleri.yil}
                                onChange={girisDegisikligiIshle('yil')}
                                onKeyPress={tusBaskisiIshle}
                                placeholder="Örn: 2023"
                                InputProps={{
                                    startAdornment: <span style={{ marginRight: 8 }}>📅</span>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={aramaYap}
                                    disabled={yukleniyor}
                                    startIcon={yukleniyor ? <CircularProgress size={20} /> : <SearchIcon />}
                                    sx={{ 
                                        px: 6, 
                                        py: 1.5,
                                        borderRadius: 3,
                                        fontSize: '1.1rem',
                                        textTransform: 'none'
                                    }}
                                >
                                    {yukleniyor ? 'Dünya Çapında Aranıyor...' : 'Kütüphanelerde Ara'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                ) : (
                    // Kitap Arama Formu
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth
                                label="Aradığınız kitap veya konu"
                                variant="outlined"
                                value={kitapAramaParametreleri.sorgu}
                                onChange={kitapAramaGirisDegisikligiIshle('sorgu')}
                                onKeyPress={tusBaskisiIshle}
                                placeholder="Örn: JavaScript programlama, Orhan Pamuk, tarih kitabı"
                                InputProps={{
                                    startAdornment: <SearchIconMUI sx={{ color: 'action.active', mr: 1 }} />
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Yazar Adı (İsteğe Bağlı)"
                                variant="outlined"
                                value={kitapAramaParametreleri.yazar}
                                onChange={kitapAramaGirisDegisikligiIshle('yazar')}
                                onKeyPress={tusBaskisiIshle}
                                placeholder="Örn: Stephen King"
                                InputProps={{
                                    startAdornment: <PersonIcon sx={{ color: 'action.active', mr: 1 }} />
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                size="large"
                                onClick={aramaYap}
                                disabled={kitapYukleniyor}
                                startIcon={kitapYukleniyor ? <CircularProgress size={20} color="inherit" /> : <SearchIconMUI />}
                                sx={{ 
                                    py: 1.5,
                                    borderRadius: 3,
                                    fontSize: '1.1rem',
                                    textTransform: 'none'
                                }}
                            >
                                {kitapYukleniyor ? 'Milyonlarca Kitap Aranıyor...' : 'Kitapları Keşfet'}
                            </Button>
                        </Grid>
                    </Grid>
                )}

                {hata && (
                    <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                        {hata}
                    </Alert>
                )}

                {kitapHatasi && (
                    <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                        {kitapHatasi}
                    </Alert>
                )}
            </Paper>

            {/* Yükleme Göstergesi */}
            {(yukleniyor || kitapYukleniyor) && (
                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
                    <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                        {yukleniyor ? 'Dünya çapında kütüphanelerde aranıyor...' : 'Kitap koleksiyonunda aranıyor...'}
                    </Typography>
                    <Typography variant="caption" sx={{ textAlign: 'center', display: 'block', mt: 1 }}>
                        {yukleniyor ? 'WorldCat, Google Books, Open Library kontrol ediliyor' : 'Open Library, Google Books, Internet Archive taranıyor'}
                    </Typography>
                </Paper>
            )}

            {/* Kitap Arama Sonuçları */}
            {kitapAramaSonucu && (
                <Box sx={{ mb: 4 }}>
                    {/* Arama İstatistikleri */}
                    <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                        <Typography variant="h5" gutterBottom sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            color: 'primary.main',
                            fontWeight: 600
                        }}>
                            <InfoIcon sx={{ mr: 1 }} />
                            Arama Sonuçları
                        </Typography>
                        
                        <Grid container spacing={3} sx={{ mb: 2 }}>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" sx={{ 
                                        color: 'primary.main', 
                                        fontWeight: 'bold',
                                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}>
                                        {kitapAramaSonucu.toplam}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Bulunan Kitap
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" sx={{ 
                                        color: 'success.main', 
                                        fontWeight: 'bold' 
                                    }}>
                                        {kitapAramaSonucu.kaynaklar ? Object.keys(kitapAramaSonucu.kaynaklar).length : 4}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Farklı Kaynak
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" sx={{ 
                                        color: 'info.main', 
                                        fontWeight: 'bold' 
                                    }}>
                                        {kitapAramaSonucu.aramaSuresi?.toFixed(1) || '0.0'}s
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Arama Süresi
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" sx={{ 
                                        color: 'warning.main', 
                                        fontWeight: 'bold' 
                                    }}>
                                        {kitapAramaSonucu.toplamSayfa}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Sayfa Sayısı
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Kaynak Dağılımı - Dinamik Veriler */}
                        {kitapAramaSonucu.kaynaklar && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Kaynak Dağılımı:
                                </Typography>
                                <Grid container spacing={1}>
                                    {/* Open Library */}
                                    <Grid item>
                                        <Chip
                                            label={`openLibrary: ${kitapAramaSonucu.kaynaklar.openLibrary || 0}`}
                                            size="small"
                                            variant="outlined"
                                            color={kitapAramaSonucu.kaynaklar.openLibrary > 0 ? "success" : "default"}
                                            icon={<LibraryIcon />}
                                        />
                                    </Grid>
                                    {/* Google Books */}
                                    <Grid item>
                                        <Chip
                                            label={`googleBooks: ${kitapAramaSonucu.kaynaklar.googleBooks || 0}`}
                                            size="small"
                                            variant="outlined"
                                            color={kitapAramaSonucu.kaynaklar.googleBooks > 0 ? "info" : "default"}
                                            icon={<PublicIcon />}
                                        />
                                    </Grid>
                                    {/* Internet Archive */}
                                    <Grid item>
                                        <Chip
                                            label={`internetArchive: ${kitapAramaSonucu.kaynaklar.internetArchive || 0}`}
                                            size="small"
                                            variant="outlined"
                                            color={kitapAramaSonucu.kaynaklar.internetArchive > 0 ? "warning" : "default"}
                                            icon={<BookIcon />}
                                        />
                                    </Grid>
                                    {/* OCLC Classify */}
                                    <Grid item>
                                        <Chip
                                            label={`oclcClassify: ${kitapAramaSonucu.kaynaklar.oclcClassify || 0}`}
                                            size="small"
                                            variant="outlined"
                                            color={kitapAramaSonucu.kaynaklar.oclcClassify > 0 ? "secondary" : "error"}
                                            icon={<SchoolIcon />}
                                        />
                                    </Grid>
                                </Grid>
                                
                                {/* Kaynak Durumu Bilgisi */}
                                {kitapAramaSonucu.kaynaklar.oclcClassify === 0 && (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        <Typography variant="body2">
                                            📝 <strong>Not:</strong> OCLC Classify servisi geçici olarak kullanılamıyor. 
                                            Diğer kaynaklardan sonuçlar gösteriliyor.
                                        </Typography>
                                    </Alert>
                                )}
                            </Box>
                        )}
                    </Paper>

                    {/* Kitap Kartları */}
                    <Typography variant="h5" gutterBottom sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 3,
                        color: 'primary.main',
                        fontWeight: 600
                    }}>
                        <AutoStoriesIcon sx={{ mr: 1 }} />
                        Bulunan Kitaplar ({kitapAramaSonucu.veriler.length})
                    </Typography>

                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {kitapAramaSonucu.veriler.map((kitap) => (
                            <Grid item xs={12} md={6} lg={4} key={kitap.id || kitap.isbn?.[0] || kitap.baslik}>
                                {kitapKartiGoster(kitap)}
                            </Grid>
                        ))}
                    </Grid>

                    {/* Sayfalama kaldırıldı - Tüm veriler tek sayfada gösteriliyor */}
                </Box>
            )}

            {/* Kütüphane Arama Sonuçları */}
            {aramaSonucu && (
                <Box sx={{ mb: 4 }}>
                    {/* İstatistikler */}
                    <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                        <Typography variant="h5" gutterBottom sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            color: 'primary.main',
                            fontWeight: 600
                        }}>
                            <InfoIcon sx={{ mr: 1 }} />
                            Kütüphane Arama Sonuçları
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                                        {aramaSonucu.istatistikler.toplamKutuphane}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Toplam Kütüphane
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="success.main" fontWeight="bold">
                                        {aramaSonucu.istatistikler.ulkeSayisi}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Ülke
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="info.main" fontWeight="bold">
                                        {aramaSonucu.istatistikler.musaitlikOrani}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Erişilebilirlik
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                                        {aramaSonucu.mevcutFormatlar.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Format Türü
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Mevcut Formatlar */}
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Mevcut Formatlar:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {aramaSonucu.mevcutFormatlar.map((format, index) => (
                                    <Chip
                                        key={index}
                                        label={format}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Paper>

                    {/* Ülkeye Göre Kütüphaneler */}
                    <Typography variant="h5" gutterBottom sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        color: 'primary.main',
                        fontWeight: 600
                    }}>
                        <PublicIcon sx={{ mr: 1 }} />
                        Kütüphaneler (Ülkeye Göre)
                    </Typography>

                    {Object.entries(aramaSonucu.ulkeyeGoreKutuphaneler).map(([ulke, kutuphaneler]) => (
                        <Accordion key={ulke} sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                                        {ulke}
                                    </Typography>
                                    <Badge badgeContent={kutuphaneler.length} color="primary" sx={{ mr: 2 }} />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List>
                                    {kutuphaneler.map((kutuphane, index) => (
                                        <React.Fragment key={index}>
                                            <ListItem sx={{ px: 0 }}>
                                                <ListItemIcon>
                                                    <LibraryIcon color="primary" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="subtitle1" fontWeight="bold">
                                                                {kutuphane.kutuphanAdi}
                                                            </Typography>
                                                            {kutuphane.musaitlik === 'Mevcut' && (
                                                                <CheckCircleIcon color="success" fontSize="small" />
                                                            )}
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box sx={{ mt: 1 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                📍 {kutuphane.sehir}, {kutuphane.ulke}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                🏛️ {kutuphane.kurum}
                                                            </Typography>
                                                            {kutuphane.yerNumarasi && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    📚 Yer Numarası: {kutuphane.yerNumarasi}
                                                                </Typography>
                                                            )}
                                                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                                                <Chip
                                                                    label={kutuphane.format}
                                                                    size="small"
                                                                    color="info"
                                                                    variant="outlined"
                                                                />
                                                                <Chip
                                                                    label={kutuphane.musaitlik}
                                                                    size="small"
                                                                    color={kutuphane.musaitlik === 'Mevcut' ? 'success' : 'warning'}
                                                                    variant="outlined"
                                                                />
                                                                <Chip
                                                                    label={kutuphane.servisAdi}
                                                                    size="small"
                                                                    color="default"
                                                                    variant="outlined"
                                                                />
                                                            </Box>
                                                            {(kutuphane.url || kutuphane.katalogUrl) && (
                                                                <Box sx={{ mt: 1 }}>
                                                                    {kutuphane.url && (
                                                                        <Tooltip title="Kütüphane web sitesini aç">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => kutuphanveUrlAc(kutuphane.url)}
                                                                                color="primary"
                                                                            >
                                                                                <LinkIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}
                                                                    {kutuphane.katalogUrl && (
                                                                        <Tooltip title="Katalog kaydını aç">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => kutuphanveUrlAc(kutuphane.katalogUrl)}
                                                                                color="secondary"
                                                                            >
                                                                                <BookIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                            {index < kutuphaneler.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    ))}

                    {/* Hata Bildirimleri */}
                    {aramaSonucu.hatalar && aramaSonucu.hatalar.length > 0 && (
                        <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Bazı servislerde sorun yaşandı:
                            </Typography>
                            {aramaSonucu.hatalar.map((hata: any, index: number) => (
                                <Typography key={index} variant="body2">
                                    • {hata.servis}: {hata.hata}
                                </Typography>
                            ))}
                        </Alert>
                    )}
                </Box>
            )}

            {/* Popüler Kütüphaneler */}
            {populerKutuphaneler.length > 0 && !aramaSonucu && !kitapAramaSonucu && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: 'primary.main',
                        fontWeight: 600 
                    }}>
                        <SchoolIcon sx={{ mr: 1 }} />
                        Popüler Kütüphaneler
                    </Typography>
                    <Grid container spacing={3}>
                        {populerKutuphaneler.map((kutuphane, index) => (
                            <Grid item xs={12} md={4} key={index}>
                                <Card elevation={3} sx={{ 
                                    height: '100%',
                                    borderRadius: 3,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 6
                                    }
                                }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
                                            {kutuphane.ad}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            {kutuphane.aciklama}
                                        </Typography>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Kapsam: {kutuphane.kapsam}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Diller: {kutuphane.diller.join(', ')}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {kutuphane.uzmanliklar.map((uzmanlik: string, idx: number) => (
                                                <Chip
                                                    key={idx}
                                                    label={uzmanlik}
                                                    size="small"
                                                    variant="outlined"
                                                    color="secondary"
                                                />
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Yardım ve İpuçları */}
            {!aramaSonucu && !kitapAramaSonucu && (
                <Paper elevation={2} sx={{ p: 3, mt: 4, borderRadius: 3, bgcolor: 'background.default' }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                        💡 Arama İpuçları
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" paragraph>
                                <strong>Kitap Araması İçin:</strong>
                            </Typography>
                            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                                <li>Kitap adını tam olarak yazın</li>
                                <li>Yazar adı ile araştırmayı daraltın</li>
                                <li>Konu bazlı arama yapabilirsiniz</li>
                                <li>İngilizce ve Türkçe kitaplar bulunur</li>
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" paragraph>
                                <strong>Kütüphane Araması İçin:</strong>
                            </Typography>
                            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                                <li>ISBN numarası en kesin sonucu verir</li>
                                <li>Başlık ve yazar birlikte kullanın</li>
                                <li>Yayın yılı ile filtreleme yapın</li>
                                <li>Dünya çapında kütüphaneler taranır</li>
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}
            
            {/* Kitap Detayları Modalı */}
            <Dialog 
                open={detaylarModalAcik} 
                onClose={detaylarModalKapat}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        maxHeight: '90vh'
                    }
                }}
            >
                {seciliKitap && (
                    <>
                        <DialogTitle sx={{ 
                            pb: 1,
                            borderBottom: '1px solid',
                            borderBottomColor: 'divider'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <BookIcon color="primary" />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                                        {seciliKitap.baslik}
                                    </Typography>
                                    {seciliKitap.yazarlar && seciliKitap.yazarlar.length > 0 && (
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {seciliKitap.yazarlar.join(', ')}
                                        </Typography>
                                    )}
                                </Box>
                                {(seciliKitap.type || seciliKitap.yayinTuru) && (
                                    <Chip 
                                        label={seciliKitap.type || seciliKitap.yayinTuru}
                                        size="small"
                                        variant="filled"
                                        color={getPublicationTypeColor(seciliKitap.type || seciliKitap.yayinTuru)}
                                    />
                                )}
                            </Box>
                        </DialogTitle>
                        
                        <DialogContent sx={{ pt: 3 }}>
                            <Grid container spacing={3}>
                                {/* Kapak Resmi */}
                                {seciliKitap.kapakResimleri?.orta && (
                                    <Grid item xs={12} md={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <CardMedia
                                                component="img"
                                                sx={{ 
                                                    width: '100%',
                                                    maxWidth: 200,
                                                    height: 'auto',
                                                    borderRadius: 2,
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s',
                                                    '&:hover': {
                                                        transform: 'scale(1.05)'
                                                    }
                                                }}
                                                image={seciliKitap.kapakResimleri.orta}
                                                alt={`${seciliKitap.baslik} kapak resmi`}
                                                onClick={() => kapakModalAc(seciliKitap.kapakResimleri?.buyuk || seciliKitap.kapakResimleri?.orta || '')}
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                Büyütmek için tıklayın
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                                
                                {/* Kitap Bilgileri */}
                                <Grid item xs={12} md={seciliKitap.kapakResimleri?.orta ? 8 : 12}>
                                    <Stack spacing={2}>
                                        {/* Temel Bilgiler */}
                                        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                                            <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <InfoIcon fontSize="small" />
                                                Temel Bilgiler
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {seciliKitap.yayinYili && (
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">Yayın Yılı</Typography>
                                                        <Typography variant="body1" fontWeight="medium">{seciliKitap.yayinYili}</Typography>
                                                    </Grid>
                                                )}
                                                {seciliKitap.yayinevi && (
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">Yayınevi</Typography>
                                                        <Typography variant="body1" fontWeight="medium">{seciliKitap.yayinevi}</Typography>
                                                    </Grid>
                                                )}
                                                {seciliKitap.isbn && seciliKitap.isbn.length > 0 && (
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">ISBN</Typography>
                                                        <Typography variant="body1" fontWeight="medium">{seciliKitap.isbn[0]}</Typography>
                                                    </Grid>
                                                )}
                                                {seciliKitap.sayfaSayisi && (
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">Sayfa Sayısı</Typography>
                                                        <Typography variant="body1" fontWeight="medium">{seciliKitap.sayfaSayisi}</Typography>
                                                    </Grid>
                                                )}
                                                {seciliKitap.dil && (
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">Dil</Typography>
                                                        <Typography variant="body1" fontWeight="medium">{seciliKitap.dil}</Typography>
                                                    </Grid>
                                                )}
                                                {seciliKitap.kaynak && (
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">Kaynak</Typography>
                                                        <Typography variant="body1" fontWeight="medium">{seciliKitap.kaynak}</Typography>
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </Paper>
                                        
                                        {/* Özet */}
                                        {(seciliKitap.ozet || seciliKitap.abstract) && (
                                            <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                                                <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    📝 Özet
                                                </Typography>
                                                <Typography variant="body1" sx={{ 
                                                    lineHeight: 1.6,
                                                    textAlign: 'justify'
                                                }}>
                                                    {seciliKitap.ozet || seciliKitap.abstract}
                                                </Typography>
                                            </Paper>
                                        )}
                                        
                                        {/* İçindekiler */}
                                        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                                            <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                📚 İçindekiler
                                            </Typography>
                                            {seciliKitap.icindekiler && seciliKitap.icindekiler.length > 0 ? (
                                                <Box sx={{ 
                                                    maxHeight: 300, 
                                                    overflowY: 'auto',
                                                    '&::-webkit-scrollbar': {
                                                        width: '6px'
                                                    },
                                                    '&::-webkit-scrollbar-track': {
                                                        backgroundColor: 'grey.100',
                                                        borderRadius: '3px'
                                                    },
                                                    '&::-webkit-scrollbar-thumb': {
                                                        backgroundColor: 'primary.main',
                                                        borderRadius: '3px'
                                                    }
                                                }}>
                                                    {seciliKitap.icindekiler.map((baslik, index) => (
                                                        <Box 
                                                            key={index}
                                                            sx={{ 
                                                                py: 1,
                                                                px: 1.5,
                                                                borderBottom: index < seciliKitap.icindekiler!.length - 1 ? '1px solid' : 'none',
                                                                borderBottomColor: 'grey.200',
                                                                '&:hover': {
                                                                    backgroundColor: 'grey.50',
                                                                    borderRadius: 1
                                                                },
                                                                transition: 'background-color 0.2s'
                                                            }}
                                                        >
                                                            <Typography variant="body2" sx={{ 
                                                                lineHeight: 1.5,
                                                                color: 'text.primary',
                                                                fontSize: '0.9rem'
                                                            }}>
                                                                <strong>{index + 1}.</strong> {baslik}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            ) : (
                                                <Typography 
                                                    variant="body2" 
                                                    color="text.secondary" 
                                                    sx={{ 
                                                        fontStyle: 'italic',
                                                        textAlign: 'center',
                                                        py: 2,
                                                        backgroundColor: 'grey.50',
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    İçindekiler bilgisi bulunamadı
                                                </Typography>
                                            )}
                                        </Paper>
                                        
                                        {/* Konular */}
                                        {seciliKitap.konular && seciliKitap.konular.length > 0 && (
                                            <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                                                <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    🏷️ Konular
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {seciliKitap.konular.map((konu, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={konu}
                                                            size="small"
                                                            variant="outlined"
                                                            color="secondary"
                                                        />
                                                    ))}
                                                </Box>
                                            </Paper>
                                        )}
                                    </Stack>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        
                        <DialogActions sx={{ p: 3, pt: 2 }}>
                            <Button onClick={detaylarModalKapat} color="primary">
                                Kapat
                            </Button>
                            {seciliKitap.openLibraryKey && (
                                <Button 
                                    startIcon={<OpenInNewIcon />}
                                    onClick={() => window.open(`https://openlibrary.org${seciliKitap.openLibraryKey}`, '_blank')}
                                    variant="outlined"
                                >
                                    OpenLibrary'de Görüntüle
                                </Button>
                            )}
                            {seciliKitap.googleBooksId && (
                                <Button 
                                    startIcon={<OpenInNewIcon />}
                                    onClick={() => window.open(`https://books.google.com/books?id=${seciliKitap.googleBooksId}`, '_blank')}
                                    variant="outlined"
                                >
                                    Google Books'ta Görüntüle
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>
            
            {/* Kapak Resmi Büyütme Modalı */}
            <Dialog 
                open={kapakModalAcik} 
                onClose={kapakModalKapat}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        boxShadow: 'none',
                        margin: 2
                    }
                }}
            >
                <DialogContent sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    backgroundColor: 'transparent',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px'
                }}>
                    {seciliKapakResmi && (
                        <Box sx={{ 
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <CardMedia
                                component="img"
                                sx={{ 
                                    maxWidth: '100%',
                                    maxHeight: '70vh',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain',
                                    borderRadius: 2,
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                                }}
                                image={seciliKapakResmi}
                                alt="Büyütülmüş kapak resmi"
                            />
                            <IconButton
                                onClick={kapakModalKapat}
                                sx={{
                                    position: 'absolute',
                                    top: -10,
                                    right: -10,
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    color: 'black',
                                    width: 32,
                                    height: 32,
                                    fontSize: '16px',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 1)',
                                        transform: 'scale(1.1)'
                                    }
                                }}
                            >
                                ✕
                            </IconButton>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default KutuphanveArama;