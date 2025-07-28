const axios = require('axios');
const BaseService = require('./baseService');

// Türkçe karakter normalizasyon fonksiyonları
function normalizeForSearch(text) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/İ/g, 'I')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C');
}

function denormalizeText(text) {
  if (!text) return '';
  
  // Yaygın Türkçe kelime düzeltmeleri
  const turkishWords = {
    'gunes': 'güneş',
    'turkiye': 'türkiye',
    'istanbul': 'istanbul',
    'izmir': 'izmir',
    'ankara': 'ankara',
    'cocuk': 'çocuk',
    'kitap': 'kitap',
    'egitim': 'eğitim',
    'ogretim': 'öğretim',
    'kultur': 'kültür',
    'sanat': 'sanat',
    'tarih': 'tarih',
    'dil': 'dil',
    'edebiyat': 'edebiyat',
    'bilim': 'bilim',
    'arastirma': 'araştırma',
    'yasam': 'yaşam',
    'ogrenme': 'öğrenme',
    'universite': 'üniversite',
    'yayinlari': 'yayınları',
    'basim': 'basım',
    'yayin': 'yayın'
  };

  // Metni küçük harfe çevir
  let normalized = text.toLowerCase();

  // Türkçe kelimeleri düzelt
  Object.entries(turkishWords).forEach(([plain, turkish]) => {
    const regex = new RegExp(`\\b${plain}\\b`, 'gi');
    normalized = normalized.replace(regex, turkish);
  });

  // İlk harfleri büyük yap
  normalized = normalized
    .split(' ')
    .map(word => {
      // Özel isim veya başlık kelimesi ise ilk harfi büyüt
      if (word.length > 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');

  // Bazı yaygın kısaltmaları düzelt
  normalized = normalized
    .replace(/\bTr\b/gi, 'TR')
    .replace(/\bTc\b/gi, 'TC')
    .replace(/\bTdk\b/gi, 'TDK')
    .replace(/\bTubitak\b/gi, 'TÜBİTAK');

  return normalized;
}

class OpenLibraryService extends BaseService {
  constructor() {
    super('OpenLibrary', 2); // 2 requests per second rate limit
    this.baseURL = 'https://openlibrary.org/api';
    this.searchURL = 'https://openlibrary.org/search.json';
  }

  async searchBooks(query, page = 1, limit = 10, filters = {}) {
    const normalizedQuery = this.normalizeText(query);
    
    return this.makeRequest(async () => {
      const offset = (page - 1) * limit;
      const response = await axios.get(this.searchURL, {
        params: {
          q: normalizedQuery,
          offset,
          limit,
          fields: 'key,title,author_name,first_publish_year,publisher,isbn,language,subject,language,first_sentence'
        }
      });

      const { docs, numFound } = response.data;
      
      let results = docs.map(book => ({
          id: book.key,
          title: denormalizeText(book.title),
          originalTitle: book.title,
          authors: book.author_name || [],
          firstSentence: book.first_sentence,
          language: book.language || [],
          publishYear: book.first_publish_year,
          publishers: book.publisher || [],
          isbn: book.isbn ? book.isbn[0] : null,
          languages: book.language || [],
          subjects: book.subject || [],
          coverImage: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : null
        }));

      // Filtreleri uygula
      if (Object.keys(filters).length > 0) {
        results = this.applyFilters(results, filters);
      }

      return {
        total: results.length,
        page,
        limit,
        results
      };
    }, 'Kitap araması başarısız oldu');
  }

  async getBookDetails(bookId) {
    return this.makeRequest(async () => {
      // Remove '/works/' prefix if present
      const cleanId = bookId.replace('/works/', '');
      const response = await axios.get(`https://openlibrary.org/works/${cleanId}.json`);
      
      const book = response.data;
      
      // Fetch edition details if available
      let edition = null;
      if (book.first_publish_year) {
        const editionResponse = await axios.get(`https://openlibrary.org/works/${cleanId}/editions.json`);
        edition = editionResponse.data.entries[0];
      }

      const details = {
        id: book.key,
        title: book.title,
        description: book.description?.value || book.description || '',
        subjects: book.subjects || [],
        firstPublishYear: book.first_publish_year,
        coverImage: edition?.covers ? 
          `https://covers.openlibrary.org/b/id/${edition.covers[0]}-L.jpg` : 
          null,
        authors: book.authors?.map(author => ({
          id: author.author.key,
          name: author.author.name
        })) || [],
        links: {
          openLibrary: `https://openlibrary.org${book.key}`
        }
      };

      // Benzer kitapları getir
      details.similarBooks = await this.findSimilarBooks(book.subjects, details.id);

      return details;
    }, 'Kitap detayları getirilemedi');
  }

  async findSimilarBooks(subjects, excludeId, limit = 5) {
    if (!subjects || subjects.length === 0) return [];

    return this.makeRequest(async () => {
      // Konulara göre benzer kitapları ara
      const query = subjects.slice(0, 2).join(' '); // İlk 2 konuyu kullan
      const response = await axios.get(this.searchURL, {
        params: {
          q: query,
          limit: limit + 1 // Exclude için +1
        }
      });

      return response.data.docs
        .filter(book => book.key !== excludeId)
        .slice(0, limit)
        .map(book => ({
          id: book.key,
          title: book.title,
          author: book.author_name ? book.author_name[0] : null,
          year: book.first_publish_year,
          coverImage: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null
        }));
    }, 'Benzer kitaplar getirilemedi');
  }

  async searchAuthors(query) {
    return this.makeRequest(async () => {
      // Yazar aramasında Türkçe karakterleri normalize et
      const normalizedQuery = normalizeForSearch(query);
      const response = await axios.get('https://openlibrary.org/search/authors.json', {
        params: {
          q: normalizedQuery
        }
      });

      const authors = response.data.docs.map(author => ({
        id: author.key,
        name: denormalizeText(author.name),
        birthDate: author.birth_date,
        topWork: author.top_work,
        workCount: author.work_count,
        topSubjects: author.top_subjects || [],
        // Yazar fotoğrafı varsa ekle
        photo: author.photos ? `https://covers.openlibrary.org/a/id/${author.photos[0]}-L.jpg` : null
      }));

      // Her yazar için en popüler kitaplarını getir
      for (let author of authors) {
        author.popularBooks = await this.getAuthorPopularBooks(author.id);
      }

      return authors;
    }, 'Yazar araması başarısız oldu');
  }

  async getAuthorPopularBooks(authorId, limit = 3) {
    return this.makeRequest(async () => {
      const cleanId = authorId.replace('/authors/', '');
      const response = await axios.get(`https://openlibrary.org/authors/${cleanId}/works.json`);
      
      return response.data.entries
        .slice(0, limit)
        .map(work => ({
          id: work.key,
          title: work.title,
          coverImage: work.covers ? `https://covers.openlibrary.org/b/id/${work.covers[0]}-M.jpg` : null,
          year: work.first_publish_date
        }));
    }, 'Yazarın popüler kitapları getirilemedi');
  }
}

module.exports = new OpenLibraryService();
