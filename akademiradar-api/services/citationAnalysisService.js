const axios = require('axios');

class CitationAnalysisService {
    constructor() {
        this.crossrefBaseURL = 'https://api.crossref.org/works';
        this.lensBaseURL = 'https://api.lens.org/scholarly/search';
        this.headers = {
            'User-Agent': 'AkademiRadar/1.0 (mailto:contact@akademiradar.com)',
            'Accept': 'application/json'
        };
        this.timeout = 8000; // 8 seconds timeout
    }

    /**
     * Get citation data for a DOI using Crossref
     * @param {string} doi - DOI of the publication
     * @returns {Promise<Object>} Citation data
     */
    async getCitationDataFromCrossref(doi) {
        try {
            console.log(`🔍 Crossref: Getting citation data for DOI: ${doi}`);
            const response = await axios.get(`${this.crossrefBaseURL}/${doi}`, {
                headers: this.headers,
                timeout: this.timeout
            });

            const work = response.data.message;
            const citationData = {
                doi: work.DOI,
                title: work.title?.[0],
                authors: work.author?.map(author => ({
                    given: author.given,
                    family: author.family,
                    orcid: author.ORCID
                })) || [],
                journal: work['container-title']?.[0],
                publishedDate: work.published?.['date-parts']?.[0],
                citedByCount: work['is-referenced-by-count'] || 0,
                referencesCount: work['references-count'] || 0,
                type: work.type,
                publisher: work.publisher,
                url: work.URL,
                source: 'crossref'
            };
            
            console.log(`✅ Crossref: Found ${citationData.citedByCount} citations for DOI`);
            return citationData;
        } catch (error) {
            console.error('❌ Crossref citation error:', error.message);
            if (error.code === 'ECONNABORTED') {
                console.log('⏰ Crossref: Timeout occurred');
            }
            return null;
        }
    }

    /**
     * Get citation data using Lens.org API (free alternative)
     * @param {string} doi - DOI of the publication
     * @returns {Promise<Object>} Citation data
     */
    async getCitationDataFromLens(doi) {
        try {
            const requestBody = {
                query: {
                    bool: {
                        must: [
                            {
                                term: {
                                    "external_ids.type": "doi"
                                }
                            },
                            {
                                term: {
                                    "external_ids.value": doi
                                }
                            }
                        ]
                    }
                },
                size: 1,
                include: [
                    "lens_id",
                    "title",
                    "authors",
                    "source",
                    "date_published",
                    "references_count",
                    "scholarly_citations_count",
                    "external_ids"
                ]
            };

            const response = await axios.post(this.lensBaseURL, requestBody, {
                headers: {
                    ...this.headers,
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data.data;
            if (data && data.length > 0) {
                const work = data[0];
                return {
                    doi: doi,
                    lensId: work.lens_id,
                    title: work.title,
                    authors: work.authors?.map(author => ({
                        given: author.first_name,
                        family: author.last_name,
                        displayName: author.display_name
                    })) || [],
                    journal: work.source?.title,
                    publishedDate: work.date_published,
                    citedByCount: work.scholarly_citations_count || 0,
                    referencesCount: work.references_count || 0,
                    source: 'lens'
                };
            }
            return null;
        } catch (error) {
            console.error('Lens.org citation error:', error.message);
            return null;
        }
    }

    /**
     * Get comprehensive citation data for a DOI
     * @param {string} doi - DOI of the publication
     * @returns {Promise<Object>} Combined citation data
     */
    async getCitationData(doi) {
        if (!doi) {
            return {
                doi: null,
                title: 'No DOI available',
                citedByCount: 0,
                error: 'No DOI provided'
            };
        }

        // Try Crossref first, then Lens.org as fallback
        let citationData = await this.getCitationDataFromCrossref(doi);
        
        if (!citationData) {
            citationData = await this.getCitationDataFromLens(doi);
        }

        if (!citationData) {
            return {
                doi: doi,
                title: 'Citation data not available',
                citedByCount: 0,
                error: 'No citation data found'
            };
        }

        return citationData;
    }

    /**
     * Get citation data for multiple DOIs
     * @param {Array<string>} dois - Array of DOIs
     * @returns {Promise<Array>} Array of citation data
     */
    async getBulkCitationData(dois) {
        const results = [];
        
        for (const doi of dois) {
            try {
                const citationData = await this.getCitationData(doi);
                results.push(citationData);
                
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.error(`Error getting citation data for DOI ${doi}:`, error.message);
                results.push({
                    doi: doi,
                    title: 'Error retrieving data',
                    citedByCount: 0,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Calculate author metrics from citation data
     * @param {Array} citationDataArray - Array of citation data objects
     * @returns {Object} Author metrics
     */
    calculateAuthorMetrics(citationDataArray) {
        const validCitations = citationDataArray.filter(item => !item.error && item.citedByCount >= 0);
        
        if (validCitations.length === 0) {
            return {
                totalPublications: 0,
                totalCitations: 0,
                hIndex: 0,
                averageCitationsPerPaper: 0,
                mostCitedPaper: null
            };
        }

        const totalCitations = validCitations.reduce((sum, item) => sum + (item.citedByCount || 0), 0);
        const citationCounts = validCitations.map(item => item.citedByCount || 0).sort((a, b) => b - a);
        
        // Calculate h-index
        let hIndex = 0;
        for (let i = 0; i < citationCounts.length; i++) {
            if (citationCounts[i] >= i + 1) {
                hIndex = i + 1;
            } else {
                break;
            }
        }

        const mostCitedPaper = validCitations.reduce((max, current) => 
            (current.citedByCount || 0) > (max.citedByCount || 0) ? current : max
        );

        return {
            totalPublications: validCitations.length,
            totalCitations: totalCitations,
            hIndex: hIndex,
            averageCitationsPerPaper: Math.round((totalCitations / validCitations.length) * 100) / 100,
            mostCitedPaper: {
                title: mostCitedPaper.title,
                citations: mostCitedPaper.citedByCount,
                doi: mostCitedPaper.doi
            }
        };
    }
}

module.exports = CitationAnalysisService;
