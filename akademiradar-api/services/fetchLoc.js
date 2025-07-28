const axios = require('axios');

class LibraryOfCongressService {
  constructor() {
    this.baseURL = 'https://www.loc.gov';
  }

  async searchCatalog(query, page = 1, limit = 10, format = 'all') {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          q: query,
          fo: 'json',
          at: format !== 'all' ? format : undefined,
          sp: (page - 1) * limit,
          c: limit
        }
      });

      const { results, pagination } = response.data;

      return {
        total: pagination.total,
        page,
        limit,
        results: results.map(item => ({
          id: item.id,
          title: item.title,
          creator: item.creator,
          date: item.date,
          subject: item.subject,
          format: item.format,
          contributor: item.contributor,
          language: item.language,
          location: item.location,
          url: item.url,
          thumbnail: item.image_url
        }))
      };
    } catch (error) {
      console.error('Library of Congress Search Error:', error.message);
      throw error;
    }
  }

  async getItemDetails(itemId) {
    try {
      const response = await axios.get(`${this.baseURL}/item/${itemId}`, {
        params: {
          fo: 'json'
        }
      });

      const item = response.data;
      return {
        id: item.id,
        title: item.title,
        creator: item.creator,
        contributors: item.contributor || [],
        date: item.date,
        subjects: item.subject || [],
        description: item.description,
        format: item.format,
        genre: item.genre,
        language: item.language,
        location: item.location,
        publisher: item.publisher,
        notes: item.notes,
        rights: item.rights,
        classification: item.classification,
        digitalContent: item.resources || [],
        url: item.url,
        thumbnail: item.image_url
      };
    } catch (error) {
      console.error('Library of Congress Item Details Error:', error.message);
      throw error;
    }
  }

  async searchDigitalCollections(query, page = 1, limit = 10) {
    try {
      const response = await axios.get(`${this.baseURL}/photos`, {
        params: {
          q: query,
          fo: 'json',
          sp: (page - 1) * limit,
          c: limit
        }
      });

      const { results, pagination } = response.data;

      return {
        total: pagination.total,
        page,
        limit,
        results: results.map(item => ({
          id: item.id,
          title: item.title,
          creator: item.creator,
          date: item.date,
          subject: item.subject,
          format: item.format,
          repository: item.repository,
          collection: item.partOf,
          rights: item.rights,
          url: item.url,
          thumbnail: item.image_url,
          mediumUrl: item.image_url?.replace('thumbnail', 'medium'),
          highResUrl: item.image_url?.replace('thumbnail', 'high-res')
        }))
      };
    } catch (error) {
      console.error('Library of Congress Digital Collections Error:', error.message);
      throw error;
    }
  }

  async searchManuscripts(query, page = 1, limit = 10) {
    try {
      const response = await axios.get(`${this.baseURL}/manuscripts`, {
        params: {
          q: query,
          fo: 'json',
          sp: (page - 1) * limit,
          c: limit
        }
      });

      const { results, pagination } = response.data;

      return {
        total: pagination.total,
        page,
        limit,
        results: results.map(item => ({
          id: item.id,
          title: item.title,
          creator: item.creator,
          date: item.date,
          collection: item.partOf,
          format: item.format,
          extent: item.extent,
          repository: item.repository,
          findingAid: item.findingAid,
          url: item.url,
          thumbnail: item.image_url
        }))
      };
    } catch (error) {
      console.error('Library of Congress Manuscripts Error:', error.message);
      throw error;
    }
  }
}

module.exports = new LibraryOfCongressService();
