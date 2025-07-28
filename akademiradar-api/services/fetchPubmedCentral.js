const axios = require('axios');
const xml2js = require('xml2js');

class PubmedCentralService {
  constructor() {
    this.baseURL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    this.apiKey = process.env.PUBMED_API_KEY; // Same API key as PubMed
  }

  async searchArticles(query, page = 1, limit = 10) {
    try {
      // First search for PMC IDs
      const searchResponse = await axios.get(`${this.baseURL}/esearch.fcgi`, {
        params: {
          db: 'pmc',
          term: query,
          retstart: (page - 1) * limit,
          retmax: limit,
          api_key: this.apiKey,
          retmode: 'json'
        }
      });

      const ids = searchResponse.data.esearchresult.idlist;
      
      if (!ids || ids.length === 0) {
        return {
          total: 0,
          page,
          limit,
          results: []
        };
      }

      // Then fetch details for those IDs
      const detailsResponse = await axios.get(`${this.baseURL}/efetch.fcgi`, {
        params: {
          db: 'pmc',
          id: ids.join(','),
          api_key: this.apiKey,
          retmode: 'xml'
        }
      });

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(detailsResponse.data);
      const articles = result.pmc_articleset.article || [];

      return {
        total: parseInt(searchResponse.data.esearchresult.count),
        page,
        limit,
        results: articles.map(article => {
          const front = article.front[0];
          const meta = front['article-meta'][0];
          
          return {
            pmcid: meta['article-id'].find(id => id.$['pub-id-type'] === 'pmc')?._,
            doi: meta['article-id'].find(id => id.$['pub-id-type'] === 'doi')?._,
            title: this._extractTextFromArray(meta['title-group'][0]['article-title']),
            abstract: this._extractAbstract(meta.abstract?.[0]),
            authors: this._extractAuthors(meta['contrib-group']?.[0]?.contrib),
            journal: this._extractJournalInfo(front['journal-meta']?.[0]),
            publicationDate: this._extractPublicationDate(meta['pub-date']?.[0]),
            keywords: meta.kwd_group?.[0]?.kwd?.map(k => k._) || [],
            url: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${meta['article-id'].find(id => id.$['pub-id-type'] === 'pmc')?._}`
          };
        })
      };
    } catch (error) {
      console.error('PMC Search Error:', error.message);
      throw error;
    }
  }

  async getArticleDetails(pmcid) {
    try {
      const response = await axios.get(`${this.baseURL}/efetch.fcgi`, {
        params: {
          db: 'pmc',
          id: pmcid,
          api_key: this.apiKey,
          retmode: 'xml'
        }
      });

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      const article = result.pmc_articleset.article[0];
      const front = article.front[0];
      const meta = front['article-meta'][0];
      const body = article.body?.[0];

      return {
        pmcid,
        doi: meta['article-id'].find(id => id.$['pub-id-type'] === 'doi')?._,
        title: this._extractTextFromArray(meta['title-group'][0]['article-title']),
        abstract: this._extractAbstract(meta.abstract?.[0]),
        authors: this._extractAuthors(meta['contrib-group']?.[0]?.contrib),
        journal: this._extractJournalInfo(front['journal-meta']?.[0]),
        publicationDate: this._extractPublicationDate(meta['pub-date']?.[0]),
        keywords: meta.kwd_group?.[0]?.kwd?.map(k => k._) || [],
        sections: this._extractSections(body),
        references: this._extractReferences(article.back?.[0]?.['ref-list']?.[0]?.ref),
        url: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcid}`
      };
    } catch (error) {
      console.error('PMC Article Details Error:', error.message);
      throw error;
    }
  }

  _extractTextFromArray(arr) {
    if (!arr) return '';
    return Array.isArray(arr) ? arr.map(item => item._ || item).join(' ') : arr._ || arr;
  }

  _extractAbstract(abstract) {
    if (!abstract) return '';
    if (abstract.p) {
      return abstract.p.map(p => this._extractTextFromArray(p)).join('\\n');
    }
    return this._extractTextFromArray(abstract);
  }

  _extractAuthors(contribs) {
    if (!contribs) return [];
    return contribs
      .filter(contrib => contrib.$['contrib-type'] === 'author')
      .map(author => ({
        surname: author.name?.[0]?.surname?.[0],
        givenNames: author.name?.[0]?.['given-names']?.[0],
        affiliation: author.aff?.[0]?._ || author.aff?.[0],
        email: author.email?.[0]
      }));
  }

  _extractJournalInfo(journalMeta) {
    if (!journalMeta) return {};
    return {
      title: journalMeta['journal-title']?.[0],
      issn: journalMeta.issn?.[0]?._,
      publisher: journalMeta.publisher?.[0]?.['publisher-name']?.[0]
    };
  }

  _extractPublicationDate(pubDate) {
    if (!pubDate) return null;
    return {
      year: pubDate.year?.[0],
      month: pubDate.month?.[0],
      day: pubDate.day?.[0]
    };
  }

  _extractSections(body) {
    if (!body) return [];
    const sections = [];
    
    const processSection = (section) => {
      if (!section) return null;
      return {
        title: section.title?.[0] ? this._extractTextFromArray(section.title[0]) : '',
        content: section.p?.map(p => this._extractTextFromArray(p)).join('\\n') || '',
        subsections: section.sec?.map(processSection).filter(Boolean) || []
      };
    };

    if (body.sec) {
      sections.push(...body.sec.map(processSection).filter(Boolean));
    }

    return sections;
  }

  _extractReferences(refs) {
    if (!refs) return [];
    return refs.map(ref => {
      const citation = ref.citation?.[0] || ref.element_citation?.[0];
      if (!citation) return null;

      return {
        id: ref.$['id'],
        title: citation['article-title']?.[0] ? this._extractTextFromArray(citation['article-title'][0]) : '',
        authors: citation.person_group?.[0]?.name?.map(name => ({
          surname: name.surname?.[0],
          givenNames: name['given-names']?.[0]
        })) || [],
        source: citation.source?.[0],
        year: citation.year?.[0],
        volume: citation.volume?.[0],
        issue: citation.issue?.[0],
        pages: citation.fpage && citation.lpage ? `${citation.fpage[0]}-${citation.lpage[0]}` : '',
        doi: citation.pub_id?.find(id => id.$['pub-id-type'] === 'doi')?._
      };
    }).filter(Boolean);
  }
}

module.exports = new PubmedCentralService();
