const axios = require('axios');
const BaseService = require('./baseService');

class PubchemService extends BaseService {
  constructor() {
    super('PubChem', 5);
    this.baseURL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
    this.imageBaseURL = 'https://pubchem.ncbi.nlm.nih.gov/image/imagefly.cgi';
    this.defaultFilters = {
      yearRange: [1800, new Date().getFullYear()],
      language: 'all'
    };
    
    // Debug log için
    console.log('PubchemService başlatıldı:');
    console.log(`baseURL: ${this.baseURL}`);
    console.log(`imageBaseURL: ${this.imageBaseURL}`);
  }

  async searchCompounds(query, page = 1, limit = 10, filters = {}) {
    const normalizedQuery = this.normalizeText(query);
    
    return this.makeRequest(async () => {
      // First search for compounds using name/keyword search
      const searchResponse = await axios.get(`${this.baseURL}/compound/name/${encodeURIComponent(normalizedQuery)}/cids/JSON`);
      
      if (!searchResponse.data?.IdentifierList?.CID) {
        return {
          total: 0,
          page,
          limit,
          results: []
        };
      }
      
      const cids = searchResponse.data.IdentifierList.CID.slice((page - 1) * limit, page * limit);

      if (!cids.length) {
        return {
          total: 0,
          page,
          limit,
          results: []
        };
      }

      // Get detailed information for each compound
      const detailsResponse = await axios.get(`${this.baseURL}/compound/cid/${cids.join(',')}/property/MolecularFormula,IUPACName,MolecularWeight,CanonicalSMILES,InChIKey/JSON`);
      const compounds = detailsResponse.data?.PropertyTable?.Properties || [];

      const mappedResults = compounds.map(compound => {
        const cid = compound.CID || '';
        return {
          cid,
          molecularFormula: compound.MolecularFormula || '',
          molecularWeight: compound.MolecularWeight || '',
          iupacName: compound.IUPACName || '',
          canonicalSmiles: compound.CanonicalSMILES || '',
          inchiKey: compound.InChIKey || '',
          url: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
          imageUrl: `${this.imageBaseURL}?cid=${cid}&width=300`,
          properties: Object.entries(compound)
            .filter(([key, value]) => value && !['CID'].includes(key))
            .map(([key, value]) => ({
              name: key,
              value: value
            }))
        };
      });

      // Filtreleri uygula
      const filteredResults = this.applyFilters(mappedResults, filters);

      return {
        total: searchResponse.data.IdentifierList.CID.length,
        page,
        limit,
        results: filteredResults
      };
    }, 'PubChem bileşik araması başarısız oldu');
  }

  async getCompoundDetails(cid) {
    return this.makeRequest(async () => {
      // Temel bileşik özelliklerini getir
      const detailsResponse = await axios.get(`${this.baseURL}/compound/cid/${cid}/property/MolecularFormula,IUPACName,MolecularWeight,CanonicalSMILES,InChIKey/JSON`);
      const compound = detailsResponse.data?.PropertyTable?.Properties?.[0] || {};

      // Eş anlamlıları getir
      const synonymsResponse = await axios.get(`${this.baseURL}/compound/cid/${cid}/synonyms/JSON`);
      const synonyms = synonymsResponse.data?.InformationList?.Information?.[0]?.Synonym || [];

      // Biyoaktivite bilgilerini getir
      const bioactivityResponse = await axios.get(`${this.baseURL}/compound/cid/${cid}/assaysummary/JSON`);
      const bioassays = bioactivityResponse.data?.AssaySummaries || [];

      const result = {
        cid,
        molecularFormula: compound.MolecularFormula || '',
        iupacName: compound.IUPACName || '',
        molecularWeight: compound.MolecularWeight || '',
        canonicalSmiles: compound.CanonicalSMILES || '',
        inchiKey: compound.InChIKey || '',
        synonyms: synonyms.slice(0, 5), // İlk 5 eş anlamlı
        bioactivity: bioassays.map(assay => ({
          aid: assay.AID || '',
          name: assay.AssayName || '',
          activeCount: assay.ActiveCount || 0,
          totalCount: assay.TotalCount || 0
        })).slice(0, 5), // İlk 5 biyoanaliz
        url: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
        images: {
          structure2d: `${this.imageBaseURL}?cid=${cid}&width=300`,
          structure3d: `${this.imageBaseURL}?cid=${cid}&width=300&3d=true`
        }
      };

      // Benzer bileşikleri getir
      result.similarCompounds = await this.findSimilarCompounds(cid);

      return result;
    }, 'PubChem bileşik detayları getirilemedi');
  }

  async searchBioassays(query, page = 1, limit = 10, filters = {}) {
    const normalizedQuery = this.normalizeText(query);
    
    return this.makeRequest(async () => {
      // Önce bileşik araması yap
      const compoundResponse = await axios.get(`${this.baseURL}/compound/name/${encodeURIComponent(normalizedQuery)}/cids/JSON`);
      
      if (!compoundResponse.data?.IdentifierList?.CID) {
        return {
          total: 0,
          page,
          limit,
          results: []
        };
      }
      
      // Bulunan bileşiklerin biyoanalizlerini ara
      const cid = compoundResponse.data.IdentifierList.CID[0];
      const response = await axios.get(`${this.baseURL}/compound/cid/${cid}/assaysummary/JSON`);
      
      if (!response.data?.InformationList?.Information) {
        return {
          total: 0,
          page,
          limit,
          results: []
        };
      }

      const assays = response.data.InformationList.Information;
      const startIdx = (page - 1) * limit;
      const endIdx = startIdx + limit;
      const paginatedAssays = assays.slice(startIdx, endIdx);

      const mappedResults = paginatedAssays.map(assay => {
        return {
          aid: assay.AID || '',
          name: assay.Name || '',
          description: assay.Description || '',
          protocol: assay.Protocol || '',
          comments: assay.Comments || '',
          targetType: assay.TargetType || '',
          targetName: assay.Target?.Name || '',
          url: `https://pubchem.ncbi.nlm.nih.gov/bioassay/${assay.AID || ''}`,
          statistics: {
            activeCount: assay.ActiveCount || 0,
            totalCount: assay.TotalCount || 0
          },
          testDate: assay.ModifiedDate || '',
          references: (assay.References || []).map(ref => ({
            type: ref.Type || '',
            title: ref.Title || '',
            authors: ref.Authors || [],
            journal: ref.Journal || '',
            year: ref.Year || ''
          }))
        };
      });

      // Filtreleri uygula
      const filteredResults = this.applyFilters(mappedResults, filters);

      return {
        total: assays.length,
        page,
        limit,
        results: filteredResults
      };
    }, 'PubChem biyoanaliz araması başarısız oldu');
  }

  async findSimilarCompounds(cid = '', limit = 5) {
    if (!cid) return [];
    
    return this.makeRequest(async () => {
      try {
        // Önce yapısal benzerlik araması yap
        const response = await axios.get(`${this.baseURL}/compound/fastsimilarity_2d/cid/${cid}/property/MolecularFormula,IUPACName,MolecularWeight/JSON?Threshold=90&MaxResults=${limit}`);
        const compounds = response.data?.PropertyTable?.Properties || [];

        return compounds.map(compound => {
          return {
            cid: compound.CID,
            molecularFormula: compound.MolecularFormula || '',
            iupacName: compound.IUPACName || '',
            molecularWeight: compound.MolecularWeight || '',
            url: `https://pubchem.ncbi.nlm.nih.gov/compound/${compound.CID}`,
            imageUrl: `${this.imageBaseURL}?cid=${compound.CID}&width=300`
          };
        });
      } catch (error) {
        console.error('Benzer bileşikler aranırken hata:', error.message);
        return [];
      }
    }, 'Benzer bileşikler getirilemedi');
  }
}

module.exports = { PubchemService };
