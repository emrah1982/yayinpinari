const express = require('express');
const { logServiceError, logServiceInfo } = require('../utils/logger');
const router = express.Router();
const coreAPI = require('../services/fetchCore');
const arxivAPI = require('../services/fetchArxiv');
const pubmedAPI = require('../services/fetchPubMed');
const openLibraryAPI = require('../services/fetchOpenLibrary');
const medlinePlusAPI = require('../services/fetchMedlinePlus');
const { PubchemService } = require('../services/fetchPubchem');
const pubchemAPI = new PubchemService();
const pubmedCentralAPI = require('../services/fetchPubmedCentral');
const locAPI = require('../services/fetchLoc');
// const z3950API = require('../services/fetchZ3950'); // Geçici olarak devre dışı bırakıldı

router.get('/', async (req, res) => {
  try {
    const { query, page = 1, limit = 10, sources = ['core,arxiv,pubmed,openlibrary,medlineplus,pubchem,pmc,loc,z3950'] } = req.query;
    const sourceList = sources.toString().toLowerCase().split(',');

    if (!query) {
      return res.status(400).json({ hata: 'Arama sorgusu gerekli' });
    }

    const results = {
      core: [],
      arxiv: [],
      pubmed: [],
      openlibrary: [],
      medlineplus: [],
      pubchem: [],
      pmc: [],
      loc: [],
      z3950: []
    };

    // Parallel API calls for better performance
    const promises = [];
    
    if (sourceList.includes('core')) {
      promises.push(
        coreAPI.searchArticles(query, page, limit)
          .then(data => {
            results.core = data;
            return { success: true, data };
          })
          .catch(err => {
            results.core = { error: err.message };
            return { success: false, error: err };
          })
      );
    }

    if (sourceList.includes('arxiv')) {
      promises.push(
        arxivAPI.searchArticles(query, 0, limit)
          .then(data => {
            results.arxiv = data;
            return { success: true, data };
          })
          .catch(err => {
            results.arxiv = { error: err.message };
            return { success: false, error: err };
          })
      );
    }

    if (sourceList.includes('pubmed')) {
      promises.push(
        pubmedAPI.searchArticles(query, page, limit)
          .then(data => {
            results.pubmed = data;
            return { success: true, data };
          })
          .catch(err => {
            results.pubmed = { error: err.message };
            return { success: false, error: err };
          })
      );
    }

    if (sourceList.includes('openlibrary')) {
      promises.push(
        openLibraryAPI.searchBooks(query, page, limit)
          .then(data => {
            results.openlibrary = data;
            return { success: true, data };
          })
          .catch(err => {
            results.openlibrary = { error: err.message };
            return { success: false, error: err };
          })
      );
    }

    if (sourceList.includes('medlineplus')) {
      promises.push(
        medlinePlusAPI.searchHealth(query, page, limit)
          .then(data => {
            results.medlineplus = data;
            return { success: true, data };
          })
          .catch(err => {
            results.medlineplus = { error: err.message };
            return { success: false, error: err };
          })
      );
    }

    if (sourceList.includes('pubchem')) {
      promises.push(
        pubchemAPI.searchCompounds(query, page, limit)
          .then(data => {
            results.pubchem = data;
            return { success: true, data };
          })
          .catch(err => {
            results.pubchem = { error: err.message };
            return { success: false, error: err };
          })
      );
    }

    if (sourceList.includes('pmc')) {
      promises.push(
        pubmedCentralAPI.searchArticles(query, page, limit)
          .then(data => {
            results.pmc = data;
            return { success: true, data };
          })
          .catch(err => {
            results.pmc = { error: err.message };
            return { success: false, error: err };
          })
      );
    }

    if (sourceList.includes('loc')) {
      promises.push(
        locAPI.searchCatalog(query, page, limit)
          .then(data => {
            results.loc = data;
            return { success: true, data };
          })
          .catch(err => {
            results.loc = { error: err.message };
            return { success: false, error: err };
          })
          .then(data => results.loc = data)
          .catch(err => console.error('Library of Congress API error:', err))
      );
    }

    // Z39.50 servisi geçici olarak devre dışı bırakıldı
    if (sourceList.includes('z3950')) {
      console.log('Z39.50 servisi şu anda kullanılamıyor');
    }

    // SSE başlatma - Hata yönetimi ile
    let sseStarted = false;
    let connectionClosed = false;
    
    try {
      // SSE headers gönder
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      sseStarted = true;

      // Client bağlantı kapanma event'i
      req.on('close', () => {
        console.log('Client closed connection');
        connectionClosed = true;
        logServiceInfo('search', { event: 'connection_closed' });
      });

      // Her servis için ayrı promise oluştur ve sonuçları stream et
      const streamResults = async () => {
        try {
          const promiseResults = await Promise.allSettled(promises);
          
          for (let i = 0; i < promiseResults.length; i++) {
            // Bağlantı kapandıysa stream etmeyi durdur
            if (connectionClosed || res.destroyed) {
              console.log('Connection closed, stopping stream');
              return;
            }
            
            const promiseResult = promiseResults[i];
            const sourceName = Object.keys(results)[i]; // Doğru source adını al
            
            try {
              if (promiseResult.status === 'fulfilled') {
                // Başarılı sonucu stream et
                if (!connectionClosed && !res.destroyed) {
                  res.write(`data: ${JSON.stringify({ source: sourceName, data: promiseResult.value })}\n\n`);
                }
              } else {
                // Hata durumunu stream et
                if (!connectionClosed && !res.destroyed) {
                  res.write(`data: ${JSON.stringify({ source: sourceName, error: promiseResult.reason?.message || 'Bilinmeyen hata' })}\n\n`);
                }
                console.error(`Error in ${sourceName}:`, promiseResult.reason);
                logServiceError(sourceName, promiseResult.reason);
              }
            } catch (writeError) {
              console.error('Error writing to stream:', writeError);
              connectionClosed = true;
              return;
            }
          }

          // Tüm sonuçlar tamamlandığında bildir
          if (!connectionClosed && !res.destroyed) {
            try {
              res.write(`data: ${JSON.stringify({ completed: true })}\n\n`);
              res.end(); // SSE stream'i düzgün şekilde kapat
            } catch (writeError) {
              console.error('Error writing completion signal:', writeError);
            }
          }
        } catch (streamError) {
          console.error('Stream processing error:', streamError);
          if (!connectionClosed && !res.destroyed) {
            try {
              res.write(`data: ${JSON.stringify({ error: 'Stream processing failed' })}\n\n`);
              res.end();
            } catch (endError) {
              console.error('Error ending stream:', endError);
            }
          }
        }
      };

      // Stream başlat
      await streamResults();
      
    } catch (sseError) {
      console.error('SSE setup error:', sseError);
      
      // Eğer SSE başlatılmadıysa normal JSON response gönder
      if (!sseStarted && !res.headersSent) {
        return res.status(500).json({ 
          hata: 'SSE stream başlatılamadı',
          detay: sseError.message 
        });
      }
      
      // SSE başlatıldıysa stream üzerinden hata gönder
      if (!connectionClosed && !res.destroyed) {
        try {
          res.write(`data: ${JSON.stringify({ error: 'SSE stream error: ' + sseError.message })}\n\n`);
          res.end();
        } catch (endError) {
          console.error('Error ending stream after SSE error:', endError);
        }
      }
    }
    
    // Bu noktada response zaten gönderildi, ek işlem yapma
    return;
    
  } catch (error) {
    console.error('Search route error:', error);
    
    // Headers zaten gönderilmişse JSON response gönderme
    if (!res.headersSent) {
      res.status(500).json({ hata: 'Arama sırasında bir hata oluştu' });
    } else {
      console.error('Cannot send error response - headers already sent');
      if (!res.destroyed) {
        try {
          res.end();
        } catch (endError) {
          console.error('Error ending response:', endError);
        }
      }
    }
  }
});

router.get('/:source/:id', async (req, res) => {
  try {
    const { source, id } = req.params;

    let result;
    switch (source.toLowerCase()) {
      case 'core':
        result = await coreAPI.getArticleDetails(id);
        break;
      case 'arxiv':
        result = await arxivAPI.getArticleDetails(id);
        break;
      case 'pubmed':
        result = await pubmedAPI.getArticleDetails(id);
        break;
      case 'openlibrary':
        result = await openLibraryAPI.getBookDetails(id);
        break;
      case 'medlineplus':
        result = await medlinePlusAPI.getHealthTopicDetails(id);
        break;
      case 'pubchem':
        result = await pubchemAPI.getCompoundDetails(id);
        break;
      case 'pmc':
        result = await pubmedCentralAPI.getArticleDetails(id);
        break;
      case 'loc':
        result = await locAPI.getItemDetails(id);
        break;
      case 'z3950':
        // Z39.50 servisi geçici olarak devre dışı bırakıldı
        result = { error: 'Z39.50 servisi şu anda kullanılamıyor' };
        break;
      default:
        return res.status(400).json({ hata: 'Geçersiz kaynak belirtildi' });
    }

    // SSE kullandığımız için burada response göndermeye gerek yok
  } catch (error) {
    console.error('Article details error:', error);
    res.status(500).json({ hata: 'Detaylar alınırken bir hata oluştu' });
  }
});

module.exports = router;
