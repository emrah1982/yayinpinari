const axios = require('axios');
const BaseService = require('./baseService');

class PubMedService extends BaseService {
  constructor() {
    super('PubMed', 3); // PubMed API allows 3 requests per second with API key
    this.baseURL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    this.apiKey = process.env.PUBMED_API_KEY;
  }

  async searchArticles(query, retStart = 0, retMax = 10, filters = {}) {
    const normalizedQuery = this.normalizeText(query);
    
    return this.makeRequest(async () => {
      // First, search for IDs
      // Gelişmiş arama sorgusu oluştur
      let searchQuery = normalizedQuery;

      // Yıl filtresi
      if (filters.yearRange) {
        const [startYear, endYear] = filters.yearRange;
        searchQuery += ` AND ("${startYear}"[Date - Publication] : "${endYear}"[Date - Publication])`;      
      }

      // Dil filtresi
      if (filters.language) {
        searchQuery += ` AND ${filters.language}[Language]`;
      }

      // Yayın türü filtresi
      if (filters.publicationType) {
        searchQuery += ` AND ${filters.publicationType}[Publication Type]`;
      }

      const searchResponse = await axios.get(`${this.baseURL}/esearch.fcgi`, {
        params: {
          db: 'pubmed',
          term: searchQuery,
          retstart: retStart,
          retmax: retMax,
          api_key: this.apiKey,
          retmode: 'json'
        }
      });

      const ids = searchResponse.data.esearchresult.idlist;

      if (!ids || ids.length === 0) {
        return [];
      }

      // Then, fetch details for those IDs
      const detailsResponse = await axios.get(`${this.baseURL}/esummary.fcgi`, {
        params: {
          db: 'pubmed',
          id: ids.join(','),
          api_key: this.apiKey,
          retmode: 'json'
        }
      });

      // Transform the response
      const articles = Object.values(detailsResponse.data.result)
        .filter(item => item.uid)
        .map(article => ({
        id: article.uid,
        title: article.title,
        authors: article.authors?.map(author => author.name) || [],
        publicationDate: article.pubdate,
        journal: article.source,
        abstract: article.abstract,
        doi: article.elocationid,
        citationCount: article.pmcrefcount || 0,
        keywords: article.keywords || [],
        meshTerms: article.mesh || [],
        language: article.lang?.[0] || 'eng',
        publicationType: article.pubtype || [],
        // PubMed Central'da PDF varsa önizleme URL'i
        previewImage: article.articleids?.find(id => id.idtype === 'pmcid') ?
          `https://www.ncbi.nlm.nih.gov/pmc/articles/${article.articleids.find(id => id.idtype === 'pmcid').value}/pdf/1.png` :
          null
      }));

      // Filtreleri uygula
      const filteredArticles = this.applyFilters(articles, filters);

      return {
        total: searchResponse.data.esearchresult.count,
        retStart,
        retMax,
        articles: filteredArticles
      };
    }, 'PubMed makale araması başarısız oldu');
  }

  async getArticleDetails(articleId) {
    return this.makeRequest(async () => {
      const response = await axios.get(`${this.baseURL}/efetch.fcgi`, {
        params: {
          db: 'pubmed',
          id: articleId,
          api_key: this.apiKey,
          retmode: 'json'
        }
      });

      const article = response.data;
      const details = {
        id: articleId,
        title: article.title,
        abstract: article.abstract,
        authors: article.authors,
        publicationDate: article.pubdate,
        journal: article.source,
        doi: article.doi,
        citationCount: article.pmcrefcount || 0,
        keywords: article.keywords || [],
        meshTerms: article.mesh || [],
        language: article.lang?.[0] || 'eng',
        publicationType: article.pubtype || [],
        // PubMed Central'da PDF varsa önizleme URL'i
        previewImage: article.articleids?.find(id => id.idtype === 'pmcid') ?
          `https://www.ncbi.nlm.nih.gov/pmc/articles/${article.articleids.find(id => id.idtype === 'pmcid').value}/pdf/1.png` :
          null
      };

      // Benzer makaleleri getir
      details.similarArticles = await this.findSimilarArticles(articleId);

      return details;
    }).catch((error) => {
      console.error('PubMed API Error:', error.message);
      throw error;
    });
  }
}

module.exports = new PubMedService();
