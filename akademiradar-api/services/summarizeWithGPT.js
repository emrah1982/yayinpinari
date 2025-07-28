const { OpenAI } = require('openai');

class GPTService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async summarizeText(text, maxTokens = 250) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Sen bir akademik özetleyicisin. Akademik yayınları anlaşılır ve öz bir şekilde Türkçe olarak özetliyorsun. Akademik terminolojiyi koruyarak ama genel okuyucunun da anlayabileceği bir dil kullanıyorsun. Özetlerin yapılandırılmış ve organize edilmiş olmasına özen gösteriyorsun."
          },
          {
            role: "user",
            content: `Lütfen şu akademik yayını Türkçe olarak özetle. Önemli bulguları, metodolojileri ve sonuçları vurgula:

${text}`
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.5
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error.message);
      throw error;
    }
  }

  async generateKeyInsights(text, maxTokens = 150) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Sen bir akademik analiz uzmanısın. Akademik yayınlardan önemli bulguları ve içgörüleri Türkçe olarak çıkarıyorsun. Madde madde, net ve anlaşılır bir şekilde sunuyorsun. Her bir madde anlamlı ve bağımsız olarak anlaşılabilir olmalı."
          },
          {
            role: "user",
            content: `Lütfen bu akademik metinden önemli bulguları ve ana noktaları Türkçe olarak madde madde çıkar:

${text}`
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.3
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error.message);
      throw error;
    }
  }
}

module.exports = new GPTService();
