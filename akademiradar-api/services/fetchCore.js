const axios = require('axios');

class CoreAPIService {
  constructor() {
    this.baseURL = process.env.CORE_API_URL;
    this.apiKey = process.env.CORE_API_KEY;
  }

  async searchArticles(query, page = 1, pageSize = 10) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          q: query,
          page,
          pageSize,
          apiKey: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('CORE API Error:', error.message);
      throw error;
    }
  }

  async getArticleDetails(articleId) {
    try {
      const response = await axios.get(`${this.baseURL}/articles/${articleId}`, {
        params: {
          apiKey: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('CORE API Error:', error.message);
      throw error;
    }
  }
}

module.exports = new CoreAPIService();
