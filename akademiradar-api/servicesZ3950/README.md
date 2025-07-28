# Z3950 Kütüphane Katalog Sorgulama Servisi

Bu modül, Z3950 protokolü kullanarak çeşitli kütüphane kataloglarından kitap bilgilerini sorgulayan asenkron bir servis altyapısı sağlar. Library of Congress, WorldCat ve Türkiye Ulusal Toplu Katalog desteği ile başlayıp, gelecekte onlarca farklı kütüphane eklenebilecek şekilde tasarlanmıştır.

## 🚀 Özellikler

### Temel Özellikler
- **Z3950 Protokol Desteği**: Standart Z3950 protokolü ile kütüphane kataloglarına erişim
- **MARC21 Dönüştürme**: MARC21 formatındaki verileri anlamlı JSON yapısına dönüştürme
- **Asenkron İşlem**: Birden fazla kütüphanede paralel arama yapabilme
- **Genişletilebilir Mimari**: Yeni kütüphane servisleri kolayca eklenebilir
- **Kapsamlı Metadata**: Kitap bilgileri, kütüphane konumu, ülke, şehir bilgileri
- **Hata Yönetimi**: Robust hata yakalama ve logging sistemi
- **RESTful API**: Express.js tabanlı API endpoint'leri

### Yeni Özellikler (v2.0)
- **📄 PDF Erişim Desteği**: Yayınların tam metin PDF linklerini otomatik bulma
- **📊 Atıf Bilgisi Takibi**: Yayınların atıf sayısı, H-index ve akademik etki bilgileri
- **🇹🇷 Türkçe Katalog Desteği**: Türkiye Ulusal Toplu Katalog entegrasyonu
- **🔍 Çoklu Kaynak Arama**: Crossref, Semantic Scholar, OpenAlex, arXiv, PMC entegrasyonu
- **📈 İstatistik Takibi**: PDF erişim oranları ve atıf istatistikleri

## 📁 Dosya Yapısı

```
servicesZ3950/
├── baseZ3950Service.js        # Temel Z3950 servis sınıfı
├── locService.js              # Library of Congress özel servisi
├── worldcatService.js         # WorldCat (OCLC) global katalog servisi
├── turkishNationalService.js  # Türkiye Ulusal Toplu Katalog servisi
├── pdfAccessService.js        # PDF erişim bulma servisi
├── citationService.js         # Atıf bilgisi toplama servisi
├── z3950Manager.js            # Servis yöneticisi
├── z3950Controller.js         # Express API controller
├── marc21Utils.js             # MARC21 dönüştürme yardımcıları
├── testZ3950.js              # Kapsamlı test senaryoları
└── README.md                 # Bu dokümantasyon
```

## 🛠️ Kurulum

### Gerekli Paketler

```bash
npm install axios marc4js xml2js winston express cors dotenv
```

### Kullanılan Paketler
- `axios`: HTTP istekleri için
- `marc4js`: MARC21 format dönüştürme
- `xml2js`: XML parsing
- `winston`: Logging sistemi
- `express`: Web server framework
- `cors`: CORS desteği
- `dotenv`: Ortam değişkenleri yönetimi

## 📖 Kullanım

### API Endpoint'leri

#### 1. Tüm Servislerde Arama

```http
POST /api/z3950/search
Content-Type: application/json

{
  "query": "artificial intelligence",
  "options": {
    "searchType": "title",
    "count": 10,
    "start": 1
  }
}
```

**Arama Türleri:**
- `title`: Başlık araması
- `author`: Yazar araması
- `isbn`: ISBN araması
- `subject`: Konu araması
- `keyword`: Anahtar kelime araması

#### 2. Belirli Serviste Arama

```http
POST /api/z3950/search/{serviceName}
Content-Type: application/json

{
  "query": "machine learning",
  "options": {
    "searchType": "subject",
    "count": 5
  }
}
```

**Mevcut Servisler:**
- `loc`: Library of Congress
- `worldcat`: WorldCat (OCLC)
- `turkish_national`: Türkiye Ulusal Toplu Katalog

#### 3. ISBN ile Arama

```http
GET /api/z3950/isbn/9780201896831
```

#### 4. Yazar Araması

```http
POST /api/z3950/author
Content-Type: application/json

{
  "author": "Donald Knuth",
  "options": {
    "count": 10
  }
}
```

#### 5. Konu Araması

```http
POST /api/z3950/subject
Content-Type: application/json

{
  "subject": "computer science",
  "options": {
    "count": 15
  }
}
```

#### 6. Gelişmiş Arama

```http
POST /api/z3950/advanced-search
Content-Type: application/json

{
  "title": "programming",
  "author": "knuth",
  "subject": "algorithms",
  "options": {
    "count": 5
  }
}
```

#### 7. PDF Erişim Bilgileri

```http
POST /api/z3950/pdf-access
Content-Type: application/json

{
  "books": [
    {
      "title": "Deep Learning",
      "author": "Ian Goodfellow",
      "publishYear": "2016"
    }
  ]
}
```

#### 8. PDF Link Doğrulama

```http
POST /api/z3950/verify-pdf
Content-Type: application/json

{
  "pdfUrl": "https://arxiv.org/pdf/1234.5678.pdf"
}
```

#### 9. PDF Erişim İstatistikleri

```http
GET /api/z3950/pdf-stats
```

#### 10. Servis Durumu

```http
GET /api/z3950/status
```

#### 8. Kayıtlı Servisler

```http
GET /api/z3950/services
```

### Programatik Kullanım

```javascript
const Z3950Manager = require('./servicesZ3950/z3950Manager');

const manager = new Z3950Manager();

// Tüm servislerde arama
const results = await manager.searchAllServices('artificial intelligence', {
  searchType: 'title',
  count: 10
});

// Belirli serviste arama
const locResults = await manager.searchInService('loc', 'programming', {
  searchType: 'subject',
  count: 5
});

// ISBN ile arama
const isbnResult = await manager.searchByISBN('loc', '9780201896831');
```

## 📊 Yanıt Formatı

### Başarılı Yanıt

```json
{
  "success": true,
  "results": [
    {
      "id": "12345678",
      "isbn": "9780201896831",
      "title": "The Art of Computer Programming",
      "subtitle": "Volume 1: Fundamental Algorithms",
      "author": "Knuth, Donald E.",
      "publisher": "Addison-Wesley",
      "publishYear": "1997",
      "language": "eng",
      "subject": ["Computer programming", "Algorithms"],
      "description": "Classic computer science textbook...",
      "pages": "650 p.",
      "format": "book",
      "callNumber": "QA76.6 .K64 1997",
      "deweyNumber": "005.1",
      "libraryInfo": {
        "institution": "Library of Congress",
        "country": "United States",
        "city": "Washington, D.C.",
        "type": "National Library",
        "location": "Main Reading Room",
        "collection": "General Collection"
      },
      "source": {
        "name": "Library of Congress",
        "country": "United States",
        "city": "Washington, D.C.",
        "institution": "Library of Congress",
        "url": "https://catalog.loc.gov"
      },
      "availability": {
        "status": "Available",
        "circulation": "General circulation"
      },
      "pdfAccess": {
        "hasPDF": true,
        "accessType": "free",
        "pdfLinks": [
          {
            "url": "https://arxiv.org/pdf/1234.5678.pdf",
            "source": "arXiv",
            "type": "free",
            "verified": true,
            "lastChecked": "2024-01-15T10:30:00.000Z"
          }
        ],
        "sources": ["arXiv", "Semantic Scholar"],
        "totalLinks": 2,
        "lastUpdated": "2024-01-15T10:30:00.000Z"
      },
      "citationInfo": {
        "citationCount": 156,
        "hIndex": 15,
        "sources": ["Crossref", "Semantic Scholar"],
        "lastUpdated": "2024-01-15T10:30:00.000Z",
        "details": {
          "influentialCitationCount": 47,
          "recentCitations": 31,
          "selfCitations": 15,
          "citationVelocity": 12
        },
        "isMockData": false
      }
    }
  ],
  "metadata": {
    "query": "artificial intelligence",
    "totalResults": 1,
    "searchTime": 1250,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "services": [
      {
        "name": "loc",
        "status": "success",
        "resultCount": 1,
        "searchTime": 1200
      }
    ]
  }
}
```

### Hata Yanıtı

```json
{
  "success": false,
  "error": "Arama gerçekleştirilemedi",
  "message": "Z3950 bağlantısı kurulamadı: Connection timeout",
  "results": [],
  "metadata": {
    "query": "test query",
    "totalResults": 0,
    "searchTime": 5000,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🏗️ Mimari

### BaseZ3950Service
Tüm Z3950 servislerinin temel sınıfı. Ortak işlevsellik sağlar:
- Z3950 bağlantısı yönetimi (HTTP fallback ile)
- MARC21 kayıt işleme ve dönüştürme
- PDF erişim bilgisi entegrasyonu
- Atıf bilgisi takibi
- Hata yakalama ve logging
- Asenkron arama işlemleri

### Kütüphane Servisleri

#### LOCService
Library of Congress için özelleştirilmiş servis:
- LOC'a özel sorgu formatları
- LCCN (Library of Congress Control Number) desteği
- Amerika Birleşik Devletleri ulusal koleksiyonu
- İngilizce yayın odaklı

#### WorldCatService
OCLC WorldCat global katalog servisi:
- Dünya çapında kütüphane ağı
- Çoklu dil desteği
- OCLC numarası takibi
- Kütüphane mevcudiyet bilgisi

#### TurkishNationalService
Türkiye Ulusal Toplu Katalog servisi:
- Türkçe karakter desteği
- Ulusal kütüphane koleksiyonu
- Türk yayıncıları ve yazarları
- Kültür ve Turizm Bakanlığı koordinasyonu

### Destek Servisleri

#### PDFAccessService
Yayınların PDF erişim linklerini bulan servis:
- arXiv, PubMed Central, DOAJ entegrasyonu
- Semantic Scholar API desteği
- Link doğrulama ve erişim türü belirleme
- PDF erişim istatistikleri

#### CitationService
Akademik atıf bilgilerini toplayan servis:
- Crossref, Semantic Scholar, OpenAlex entegrasyonu
- H-index hesaplama
- Atıf istatistikleri ve dağılımı
- Toplu atıf işleme

### Z3950Manager
Tüm servisleri yöneten merkezi sınıf:
- Servis kayıt ve yönetimi
- Paralel arama koordinasyonu
- Sonuç birleştirme ve sıralama
- Servis durumu takibi
- Sonuç birleştirme ve sıralama
- Servis durumu izleme

### Marc21Utils
MARC21 formatı ile çalışmak için yardımcı fonksiyonlar:
- Format dönüştürme (JSON, XML, Dublin Core)
- Kayıt doğrulama
- Anahtar kelime çıkarma
- Benzerlik hesaplama

## 🧪 Test Etme

### Manuel Test

```bash
# Test dosyasını çalıştır
node servicesZ3950/testZ3950.js
```

### API Test Örnekleri

```bash
# Temel arama testi
curl -X POST http://localhost:5000/api/z3950/search \
  -H "Content-Type: application/json" \
  -d '{"query": "programming", "options": {"searchType": "title", "count": 5}}'

# ISBN arama testi
curl http://localhost:5000/api/z3950/isbn/9780201896831

# Servis durumu kontrolü
curl http://localhost:5000/api/z3950/status
```

## 🔧 Yeni Kütüphane Ekleme

Yeni bir kütüphane servisi eklemek için:

1. **Yeni Servis Sınıfı Oluştur:**

```javascript
const BaseZ3950Service = require('./baseZ3950Service');

class NewLibraryService extends BaseZ3950Service {
    constructor() {
        super({
            host: 'catalog.newlibrary.org',
            port: 210,
            database: 'MAIN',
            timeout: 30000
        });
        
        this.serviceName = 'New Library';
        this.country = 'Turkey';
        this.city = 'Istanbul';
    }

    // Kütüphaneye özel metodlar...
}

module.exports = NewLibraryService;
```

2. **Manager'a Kaydet:**

```javascript
const NewLibraryService = require('./newLibraryService');

// z3950Manager.js içinde
this.registerService('newlib', new NewLibraryService());
```

## 📝 Logging

Tüm işlemler Winston kullanılarak loglanır:
- `logs/z3950.log`: Temel Z3950 işlemleri
- `logs/z3950-manager.log`: Manager işlemleri
- `logs/z3950-api.log`: API istekleri
- `logs/marc21-utils.log`: MARC21 dönüştürme işlemleri

## ⚠️ Önemli Notlar

1. **Bağlantı Limitleri**: Z3950 sunucuları eşzamanlı bağlantı sayısını sınırlayabilir
2. **Timeout Ayarları**: Ağ koşullarına göre timeout değerlerini ayarlayın
3. **MARC21 Formatı**: Farklı kütüphaneler farklı MARC21 varyantları kullanabilir
4. **Hata Yönetimi**: Ağ kesintileri ve sunucu hataları için retry mekanizması önerilir

## 🚀 Gelecek Geliştirmeler

- [ ] Daha fazla kütüphane desteği (OCLC WorldCat, British Library, vb.)
- [ ] Önbellekleme sistemi
- [ ] Retry mekanizması
- [ ] Rate limiting
- [ ] Gelişmiş arama filtreleri
- [ ] Export fonksiyonları (BibTeX, EndNote, vb.)
- [ ] Çoklu dil desteği
- [ ] GraphQL API desteği

## 🤝 Katkıda Bulunma

Yeni kütüphane servisleri eklemek veya mevcut servisleri geliştirmek için:

1. BaseZ3950Service'den türeyen yeni sınıf oluşturun
2. Gerekli testleri ekleyin
3. Dokümantasyonu güncelleyin
4. Pull request gönderin

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
