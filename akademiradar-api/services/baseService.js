const { RateLimiter } = require('limiter');
const { logServiceError, logServiceInfo } = require('../utils/logger');

class BaseService {
  constructor(name, requestsPerSecond = 2, options = {}) {
    this.name = name;
    this.limiter = new RateLimiter({
      tokensPerInterval: requestsPerSecond,
      interval: 'second'
    });
    this.retryDelay = 1000; // 1 second
    this.maxRetries = 3;
    
    // Opsiyonel atıf bilgisi desteği (mevcut servisleri etkilemez)
    this.enableCitations = options.enableCitations || false;
    if (this.enableCitations) {
      const CitationService = require('./citationService');
      this.citationService = new CitationService();
    }
  }

  /**
   * Basit log metodu - literatür servisleri için
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${this.name}]`;
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  async makeRequest(requestFn, errorMessage = 'API isteği başarısız oldu') {
    let retries = 0;
    
    while (retries <= this.maxRetries) {
      try {
        // Debug log
        logServiceInfo(this.name, {
          action: 'request_start',
          attempt: retries + 1,
          maxAttempts: this.maxRetries + 1
        });
        
        // Rate limit kontrolü
        await this.limiter.removeTokens(1);
        logServiceInfo(this.name, { action: 'rate_limit_check_success' });
        
        const response = await requestFn();
        logServiceInfo(this.name, { action: 'request_success' });
        return response;
      } catch (error) {
        retries++;
        
        // Hata durumlarını kontrol et
        if (error.response) {
          const status = error.response.status;
          
          // Rate limit aşıldı
          if (status === 429) {
            logServiceInfo(this.name, {
              action: 'rate_limit_exceeded',
              retryDelay: this.retryDelay
            });
            await this.sleep(this.retryDelay);
            this.retryDelay *= 2; // Exponential backoff
            continue;
          }
          
          // Yetkilendirme hatası
          if (status === 401 || status === 403) {
            const authError = new Error(`${this.name}: API yetkilendirme hatası. Lütfen API anahtarınızı kontrol edin.`);
            logServiceError(this.name, {
              action: 'auth_error',
              status,
              error: authError
            });
            throw authError;
          }
          
          // Servis kullanılamıyor
          if (status >= 500) {
            if (retries < this.maxRetries) {
              logServiceInfo(this.name, {
                action: 'service_error',
                status,
                retryDelay: this.retryDelay
              });
              await this.sleep(this.retryDelay);
              continue;
            }
          }
        }
        
        // Son deneme başarısız olduysa hatayı fırlat
        if (retries === this.maxRetries) {
          const finalError = new Error(`${this.name}: ${errorMessage} - ${error.message}`);
          logServiceError(this.name, {
            action: 'max_retries_exceeded',
            error: finalError
          });
          throw finalError;
        }
        
        logServiceInfo(this.name, {
          action: 'retry_attempt',
          attempt: retries,
          maxRetries: this.maxRetries,
          error: error.message
        });
        await this.sleep(this.retryDelay);
      }
    }
  }

  // Yardımcı fonksiyonlar
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Türkçe karakter normalizasyonu
  normalizeText(text) {
    if (!text) return '';
    
    const turkishChars = {
      'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c',
      'Ğ': 'G', 'Ü': 'U', 'Ş': 'S', 'İ': 'I', 'Ö': 'O', 'Ç': 'C'
    };
    
    return text.replace(/[ğüşıöçĞÜŞİÖÇ]/g, char => turkishChars[char] || char);
  }

  // Filtreleme yardımcısı
  applyFilters(items, filters) {
    return items.filter(item => {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null) continue;
        
        // Yıl aralığı kontrolü
        if (key === 'yearRange' && item.year) {
          const [start, end] = value;
          if (item.year < start || item.year > end) return false;
          continue;
        }
        
        // Dil kontrolü
        if (key === 'language' && item.language) {
          if (!item.language.includes(value)) return false;
          continue;
        }
        
        // Yayıncı kontrolü
        if (key === 'publisher' && item.publisher) {
          if (!item.publisher.toLowerCase().includes(value.toLowerCase())) return false;
          continue;
        }
      }
      return true;
    });
  }

  // Atıf sayısı formatlaması
  formatCitations(count) {
    if (!count) return 'Atıf bilgisi bulunamadı';
    return `${count} atıf`;
  }

  // Kapak resmi URL oluşturma (servis spesifik override edilebilir)
  getCoverImageUrl(item) {
    return item.coverImage || null;
  }

  // Benzer öğeleri bulma (servis spesifik override edilebilir)
  async findSimilarItems(item) {
    return [];
  }

  /**
   * Opsiyonel atıf bilgisi ekleme metodu
   * Mevcut servislerin sonuçlarına atıf bilgisi ekler (opsiyonel)
   */
  async enrichWithCitations(results) {
    if (!this.enableCitations || !this.citationService || !Array.isArray(results)) {
      return results;
    }

    try {
      // Her sonuç için atıf bilgisi al
      const enrichedResults = await Promise.all(
        results.map(async (item) => {
          try {
            const citationInfo = await this.citationService.getCitationInfo({
              title: item.title,
              author: item.author || item.authors,
              year: item.year || item.publishYear
            });
            
            return {
              ...item,
              citationInfo: citationInfo
            };
          } catch (error) {
            // Atıf bilgisi alınamazsa orijinal item'ı döndür
            return item;
          }
        })
      );
      
      return enrichedResults;
    } catch (error) {
      // Hata durumunda orijinal sonuçları döndür
      return results;
    }
  }
}

module.exports = BaseService;
