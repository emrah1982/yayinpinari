const axios = require('axios');
const xml2js = require('xml2js');
const BaseService = require('./baseService');

class ArxivService extends BaseService {
  constructor(options = {}) {
    super('arXiv', 1, options); // arXiv API rate limit: 1 request per second
    this.baseURL = 'http://export.arxiv.org/api/query';
    this.parser = new xml2js.Parser();
  }

  async searchArticles(query, start = 0, maxResults = 10, filters = {}) {
    const normalizedQuery = this.normalizeText(query);
    
    return this.makeRequest(async () => {
      // Gelişmiş arama sorgusu oluştur
      let searchQuery = `all:${normalizedQuery}`;
      
      // Yıl filtresi
      if (filters.yearRange) {
        const [startYear, endYear] = filters.yearRange;
        searchQuery += ` AND submittedDate:[${startYear} TO ${endYear}]`;
      }

      // Kategori filtresi
      if (filters.category) {
        searchQuery += ` AND cat:${filters.category}`;
      }

      const response = await axios.get(this.baseURL, {
        params: {
          search_query: searchQuery,
          start,
          max_results: maxResults
        }
      });

      // Parse XML response
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);

      // Transform the response to a more usable format
      const entries = result.feed.entry || [];
      const articles = entries.map(entry => ({
        id: entry.id[0],
        title: entry.title[0],
        summary: entry.summary[0],
        authors: entry.author.map(author => author.name[0]),
        published: entry.published[0],
        updated: entry.updated[0],
        link: entry.link.find(link => link.$.title === 'pdf')?.$.href || entry.id[0],
        categories: entry.category?.map(cat => cat.$.term) || [],
        doi: entry.link.find(link => link.$.title === 'doi')?.$.href,
        abstract: entry.summary[0],
        // PDF önizleme için arXiv thumbnail servisi
        previewImage: `https://arxiv.org/pdf/${entry.id[0].split('/').pop()}#page=1&zoom=50`,
        citations: null // arXiv API'si atıf sayısını doğrudan sağlamıyor
      }));

      // Filtreleri uygula
      const filteredArticles = this.applyFilters(articles, filters);
      
      // Opsiyonel olarak atıf bilgisi ile zenginleştir
      const enrichedArticles = await this.enrichWithCitations(filteredArticles);

      return {
        total: enrichedArticles.length,
        start,
        maxResults,
        articles: enrichedArticles
      };
    }, 'arXiv makale araması başarısız oldu');
  }

  async getArticleDetails(articleId) {
    return this.makeRequest(async () => {
      const response = await axios.get(this.baseURL, {
        params: {
          id_list: articleId
        }
      });

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);

      const entry = result.feed.entry[0];
      return {
        id: entry.id[0],
        title: entry.title[0],
        summary: entry.summary[0],
        authors: entry.author.map(author => author.name[0]),
        published: entry.published[0],
        updated: entry.updated[0],
        link: entry.link.find(link => link.$.title === 'pdf')?.$.href || entry.id[0],
        categories: entry.category.map(cat => cat.$.term),
        doi: entry.link.find(link => link.$.title === 'doi')?.$.href,
        previewImage: `https://arxiv.org/pdf/${articleId.split('/').pop()}#page=1&zoom=50`,
        citations: null, // arXiv API'si atıf sayısını doğrudan sağlamıyor
        // Benzer makaleleri getir
        similarArticles: await this.findSimilarArticles(entry.category.map(cat => cat.$.term), articleId)
      };
    }, 'arXiv makale detayları getirilemedi');
  }

  async findSimilarArticles(categories, excludeId, limit = 5) {
    if (!categories || categories.length === 0) return [];
    
    return this.makeRequest(async () => {
      // Kategorilere göre benzer makaleleri ara
      const searchQuery = `cat:${categories[0]}`; // İlk kategoriyi kullan
      
      const response = await axios.get(this.baseURL, {
        params: {
          search_query: searchQuery,
          max_results: limit + 1 // excludeId için +1
        }
      });

      const result = await this.parser.parseStringPromise(response.data);
      const entries = result.feed.entry || [];

      return entries
        .filter(entry => entry.id[0] !== excludeId)
        .slice(0, limit)
        .map(entry => ({
          id: entry.id[0],
          title: entry.title[0],
          authors: entry.author.map(author => author.name[0]),
          published: entry.published[0],
          previewImage: `https://arxiv.org/pdf/${entry.id[0].split('/').pop()}#page=1&zoom=50`,
          link: entry.link.find(link => link.$.title === 'pdf')?.$.href || entry.id[0]
        }));
    }, 'Benzer makaleler getirilemedi');
  }
}

// Normal kullanım (atıf bilgisi olmadan)
module.exports = new ArxivService();

// Atıf bilgisi ile kullanım için
// module.exports = new ArxivService({ enableCitations: true });
