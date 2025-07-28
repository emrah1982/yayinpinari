import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API istemcisini oluştur
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// EventSource tipi tanımları
type SearchResult = {
    source: string;
    data?: any;
    error?: string;
};

type SearchCallback = (result: SearchResult) => void;

// Akademik arama servisi
export const academicSearchService = {
    search: (query: string, sources: string[] = [], page: number = 1, limit: number = 10, onResult: SearchCallback, onComplete?: () => void) => {
        const queryParams = new URLSearchParams({
            query,
            sources: sources.join(','),
            page: page.toString(),
            limit: limit.toString()
        });

        const eventSource = new EventSource(`${API_BASE_URL}/search?${queryParams}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // Tüm sonuçlar tamamlandıysa
            if (data.completed) {
                eventSource.close();
                onComplete?.();
                return;
            }

            // Her bir servis sonuçlarını callback ile ilet
            onResult(data);
        };

        eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            eventSource.close();
        };

        // EventSource nesnesini döndür (gerekirse manuel kapatmak için)
        return eventSource;
    },

    getById: async (source: string, id: string) => {
        const response = await apiClient.get(`/search/${source}/${id}`);
        return response.data;
    }
};

// PubChem API servisi
export const pubchemService = {
    searchCompound: async (query: string) => {
        const response = await apiClient.get('/pubchem/compound/search', {
            params: { query }
        });
        return response.data;
    },

    getCompoundById: async (cid: string) => {
        const response = await apiClient.get(`/pubchem/compound/${cid}`);
        return response.data;
    },

    getMolecularStructure: async (cid: string) => {
        const response = await apiClient.get(`/pubchem/compound/${cid}/structure`);
        return response.data;
    }
};

// MedlinePlus API servisi
export const medlinePlusService = {
    search: async (query: string) => {
        const response = await apiClient.get('/medlineplus/search', {
            params: { query }
        });
        return response.data;
    },

    getArticle: async (id: string) => {
        const response = await apiClient.get(`/medlineplus/article/${id}`);
        return response.data;
    }
};

// AI Özet servisi
export const aiSummaryService = {
    generateSummary: async (documentId: string, documentType: string) => {
        const response = await apiClient.post('/ai-summary', {
            documentId,
            documentType
        });
        return response.data;
    }
};

// Atıf bilgisi servisi
export const citationService = {
    // Tek bir yayın için atıf bilgisi al
    getSingle: async (title: string, author?: string, year?: string, doi?: string) => {
        const response = await apiClient.post('/citations/single', {
            title,
            author,
            year,
            doi
        });
        return response.data;
    },

    // Birden fazla yayın için atıf bilgisi al
    getBatch: async (publications: Array<{title: string, author?: string, year?: string, doi?: string}>) => {
        const response = await apiClient.post('/citations/batch', {
            publications
        });
        return response.data;
    },

    // Mevcut arama sonuçlarını atıf bilgisi ile zenginleştir
    enrichResults: async (results: any[]) => {
        const response = await apiClient.post('/citations/enrich', {
            results
        });
        return response.data;
    },

    // Citation service durumu
    getStatus: async () => {
        const response = await apiClient.get('/citations/status');
        return response.data;
    },

    // Citation istatistikleri
    getStats: async () => {
        const response = await apiClient.get('/citations/stats');
        return response.data;
    }
};

// Yazar arama servisi
export const authorSearchService = {
    // Yazar arama (ad-soyad)
    search(firstName: string, lastName: string, rows: number = 20) {
        return apiClient.post('/author-search/search', {
            firstName,
            lastName,
            rows
        });
    },

    // ORCID numarası ile arama
    searchByOrcid(orcidId: string) {
        return apiClient.post('/author-search/search-by-orcid', {
            orcidId
        });
    },

    // Yazar detayları
    getAuthorDetails(orcidId: string) {
        return apiClient.get(`/author-search/author/${orcidId}`);
    },

    // Yazar yayınları
    getAuthorPublications(orcidId: string) {
        return apiClient.get(`/author-search/author/${orcidId}/publications`);
    },

    // Kapsamlı yazar analizi
    getAuthorAnalysis(orcidId: string) {
        return apiClient.get(`/author-search/author/${orcidId}/analysis`);
    },

    // DOI için atıf bilgisi
    getCitationData(doi: string) {
        return apiClient.get(`/author-search/citation/${encodeURIComponent(doi)}`);
    }
};

// Convenience functions for author search
export const searchAuthors = async (firstName: string, lastName: string, rows?: number) => {
    console.log('🔍 API: Searching authors:', firstName, lastName);
    try {
        const response = await authorSearchService.search(firstName, lastName, rows);
        console.log('✅ API: Search response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ API: Search failed:', error);
        throw error;
    }
};

export const getAuthorAnalysis = async (orcidId: string) => {
    console.log('📊 API: Getting author analysis for ORCID:', orcidId);
    try {
        const response = await authorSearchService.getAuthorAnalysis(orcidId);
        console.log('✅ API: Analysis response:', response.data);
        console.log('📚 API: Publications in response:', response.data.publications?.length || 0);
        console.log('📈 API: Metrics in response:', response.data.metrics);
        return response.data;
    } catch (error: any) {
        console.error('❌ API: Analysis failed:', error);
        console.error('❌ API: Error response:', error.response?.data);
        throw error;
    }
};
