const axios = require('axios');
const xml2js = require('xml2js');
const BaseService = require('./baseService');

class MedlinePlusService extends BaseService {
  constructor() {
    super('MedlinePlus', 3); // MedlinePlus API allows 3 requests per second
    this.baseURL = 'https://wsearch.nlm.nih.gov/ws/query';
    this.apiKey = process.env.MEDLINEPLUS_API_KEY;
    this.parser = new xml2js.Parser();
  }

  async searchHealth(query, page = 1, limit = 10, filters = {}) {
    const normalizedQuery = this.normalizeText(query);
    
    return this.makeRequest(async () => {
      console.log('Sending request to:', this.baseURL);
      console.log('Query parameters:', {
        mainSearchCriteria: normalizedQuery,
        informationRecipient: { languageCode: { value: filters.language || 'en' } },
        knowledgeResponseType: 'text/xml',
        start: (page - 1) * limit,
        maxResults: limit
      });

      const response = await axios.get(this.baseURL, {
        params: {
          db: 'healthTopics',
          term: normalizedQuery,
          retstart: (page - 1) * limit,
          retmax: limit,
          lang: filters.language || 'en',
          format: 'json'
        },
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Raw response data:', response.data);

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Raw response data:', response.data);

      const result = await this.parser.parseStringPromise(response.data);
      const documents = result?.feed?.entry || [];

      console.log('Documents:', JSON.stringify(documents, null, 2));
      console.log('Documents:', JSON.stringify(documents, null, 2));
      const topics = (Array.isArray(documents) ? documents : []).map(doc => ({
        id: doc.rank || '',
        title: doc.title || '',
        snippet: doc.FullSummary || doc.snippet || '',
        url: doc.url || '',
        topics: doc.mesh || [],
        lastUpdated: doc.lastUpdate || '',
        language: doc.lang || 'en',
        imageUrl: doc.imageUrl || '',
        translations: [],
        resources: []
      }));

      // Filtreleri uygula
      const filteredTopics = this.applyFilters(topics, filters);

      return {
        total: result.count || result.total || documents.length,
        page,
        limit,
        results: filteredTopics
      };
    }, 'MedlinePlus sağlık konusu araması başarısız oldu');
  }

  async getHealthTopicDetails(topicId) {
    return this.makeRequest(async () => {
      const response = await axios.get(`${this.baseURL}/topic/${topicId}`, {
        params: {
          knowledgeResponseType: 'application/json',
          api_key: this.apiKey
        }
      });
      
      return {
        id: topicId,
        title: response.data.title,
        summary: response.data.summary,
        sections: response.data.sections || [],
        relatedTopics: response.data.related || [],
        references: response.data.references || [],
        lastReviewed: response.data.lastReviewed,
        languages: response.data.languages || [],
        // Resimler ve videolar
        media: response.data.media || [],
        // Konuyla ilgili istatistikler
        statistics: response.data.statistics || {},
        // Benzer konuları getir
        similarTopics: await this.findSimilarTopics(response.data.title, topicId)
      };
    }, 'MedlinePlus sağlık konusu detayları getirilemedi');
  }

  async searchDrugs(query, filters = {}) {
    const normalizedQuery = this.normalizeText(query);
    
    return this.makeRequest(async () => {
      console.log('Sending drug search request to:', this.baseURL);
      console.log('Drug search parameters:', {
        mainSearchCriteria: normalizedQuery,
        informationRecipient: { languageCode: { value: filters.language || 'en' } },
        knowledgeResponseType: 'text/xml',
        db: 'drugs',
        maxResults: 10
      });

      const response = await axios.get(this.baseURL, {
        params: {
          db: 'drugs',
          term: normalizedQuery,
          retmax: 10,
          lang: filters.language || 'en',
          format: 'json'
        },
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('Drug search response status:', response.status);
      console.log('Drug search response headers:', response.headers);
      console.log('Raw drug search response:', response.data);

      console.log('Drug search response status:', response.status);
      console.log('Drug search response headers:', response.headers);
      console.log('Raw drug search response:', response.data);

      const result = response.data;
      console.log('MedlinePlus API Response:', JSON.stringify(result, null, 2));
      const documents = result?.nlmSearchResult?.documentList?.document || [];

      console.log('Drug Documents:', JSON.stringify(documents, null, 2));
      const drugs = (Array.isArray(documents) ? documents : []).map(doc => ({
        id: doc.rank || '',
        name: doc.title || '',
        brandNames: (doc.drugBrandNames || '').split(',').filter(Boolean),
        usage: doc.indication || '',
        sideEffects: doc.adverseEffects || '',
        url: doc.url || '',
        imageUrl: doc.imageUrl || '',
        interactions: (doc.drugInteractions || '').split('|').filter(Boolean),
        forms: (doc.drugForms || '').split('|').filter(Boolean),
        warnings: (doc.warnings || '').split('|').filter(Boolean),
        lastUpdated: doc.lastUpdate || ''
      }));

      // Filtreleri uygula
      const filteredDrugs = this.applyFilters(drugs, filters);

      return {
        total: result.count || result.total || documents.length,
        results: filteredDrugs
      };
    }, 'MedlinePlus ilaç araması başarısız oldu');
  }

  async findSimilarTopics(title, excludeId, limit = 5) {
    return this.makeRequest(async () => {
      // Başlıktaki ana kelimeleri kullanarak benzer konuları ara
      const keywords = title.split(' ')
        .filter(word => word.length > 3)
        .slice(0, 2)
        .join(' AND ');

      const response = await axios.get(this.baseURL, {
        params: {
          db: 'healthTopics',
          term: keywords,
          retmax: limit + 1,
          format: 'json'
        },
        headers: {
          'Accept': 'application/json',
          'API-Key': this.apiKey
        }
      });

      const result = await this.parser.parseStringPromise(response.data);
      const documents = result?.feed?.entry || [];

      // Benzer konuları dönüştür

      return documents
        .filter(doc => doc.$.id !== excludeId)
        .slice(0, limit)
        .map(doc => ({
          id: doc.$.id,
          title: doc.content.find(c => c.$.name === 'title')?._,
          snippet: doc.content.find(c => c.$.name === 'FullSummary')?._,
          url: doc.content.find(c => c.$.name === 'url')?._,
          imageUrl: doc.content.find(c => c.$.name === 'imageUrl')?._
        }));
    }, 'Benzer sağlık konuları getirilemedi');
  }
}

module.exports = new MedlinePlusService();
