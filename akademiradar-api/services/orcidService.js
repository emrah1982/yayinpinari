const axios = require('axios');

class ORCIDService {
    constructor() {
        this.baseURL = 'https://pub.orcid.org/v3.0';
        this.searchURL = 'https://pub.orcid.org/v3.0/search';
        this.headers = {
            'Accept': 'application/json',
            'User-Agent': 'AkademiRadar/1.0'
        };
        this.timeout = 10000; // 10 seconds timeout
    }

    /**
     * Search for authors by name and surname
     * @param {string} firstName - Author's first name
     * @param {string} lastName - Author's last name
     * @param {number} rows - Number of results to return (default: 20)
     * @returns {Promise<Object>} Search results with ORCID IDs
     */
    async searchAuthors(firstName, lastName, rows = 20) {
        try {
            console.log(`🔍 ORCID: Searching for ${firstName} ${lastName}`);
            const query = `given-names:${firstName}* AND family-name:${lastName}*`;
            
            const response = await axios.get(this.searchURL, {
                headers: this.headers,
                timeout: this.timeout,
                params: {
                    q: query,
                    rows: rows
                }
            });

            console.log(`✅ ORCID: Search successful, found ${response.data.result?.length || 0} results`);
            const results = response.data.result || [];
            
            return results.map(item => ({
                orcidId: item['orcid-identifier']?.path,
                name: `${item['given-names']?.value || ''} ${item['family-names']?.value || ''}`.trim(),
                givenNames: item['given-names']?.value,
                familyName: item['family-names']?.value,
                institutionNames: item['institution-name'] || [],
                score: item.relevancy?.score || 0
            }));
        } catch (error) {
            console.error('❌ ORCID search error:', error.message);
            if (error.code === 'ECONNABORTED') {
                throw new Error('ORCID arama zaman aşımına uğradı');
            }
            if (error.response?.status === 429) {
                throw new Error('ORCID API rate limit aşıldı, lütfen bekleyin');
            }
            throw new Error(`ORCID arama başarısız: ${error.message}`);
        }
    }

    /**
     * Get detailed author information by ORCID ID
     * @param {string} orcidId - ORCID identifier (e.g., "0000-0000-0000-0000")
     * @returns {Promise<Object>} Author details
     */
    async getAuthorDetails(orcidId) {
        try {
            console.log(`👤 ORCID: Getting author details for ${orcidId}`);
            const response = await axios.get(`${this.baseURL}/${orcidId}/record`, {
                headers: this.headers,
                timeout: this.timeout
            });

            console.log(`✅ ORCID: Author details retrieved successfully`);
            
            // Safe data extraction with null checks
            const record = response.data || {};
            const person = record.person || {};
            const activities = record['activities-summary'] || {};
            const personName = person.name || {};
            
            // Safe name extraction
            const givenNames = personName['given-names']?.value || '';
            const familyName = personName['family-name']?.value || '';
            const fullName = `${givenNames} ${familyName}`.trim() || 'Unknown Author';
            
            // Safe email extraction
            let emails = [];
            try {
                if (person.emails && person.emails.email && Array.isArray(person.emails.email)) {
                    emails = person.emails.email.map(e => e?.email).filter(email => email);
                }
            } catch (emailError) {
                console.warn('⚠️ ORCID: Error extracting emails:', emailError.message);
            }
            
            // Safe affiliations extraction
            let affiliations = [];
            try {
                if (activities.employments && activities.employments['employment-summary'] && Array.isArray(activities.employments['employment-summary'])) {
                    affiliations = activities.employments['employment-summary'].map(emp => ({
                        organization: emp?.organization?.name || 'Unknown Organization',
                        department: emp?.['department-name'] || null,
                        role: emp?.['role-title'] || null,
                        startDate: emp?.['start-date'] || null,
                        endDate: emp?.['end-date'] || null
                    })).filter(aff => aff.organization !== 'Unknown Organization');
                }
            } catch (affError) {
                console.warn('⚠️ ORCID: Error extracting affiliations:', affError.message);
            }
            
            // Safe works count extraction
            let worksCount = 0;
            try {
                if (activities.works && activities.works.group && Array.isArray(activities.works.group)) {
                    worksCount = activities.works.group.length;
                }
            } catch (worksError) {
                console.warn('⚠️ ORCID: Error extracting works count:', worksError.message);
            }

            const authorDetails = {
                orcidId,
                name: fullName,
                givenNames: givenNames || null,
                familyName: familyName || null,
                biography: person.biography?.content || null,
                emails: emails,
                affiliations: affiliations,
                worksCount: worksCount
            };
            
            console.log(`📊 ORCID: Author has ${authorDetails.worksCount} works`);
            return authorDetails;
        } catch (error) {
            console.error('❌ ORCID author details error:', error.message);
            if (error.code === 'ECONNABORTED') {
                throw new Error('Yazar detayları zaman aşımına uğradı');
            }
            if (error.response?.status === 404) {
                throw new Error('ORCID ID bulunamadı');
            }
            if (error.response?.status === 429) {
                throw new Error('ORCID API rate limit aşıldı');
            }
            throw new Error(`Yazar detayları alınamadı: ${error.message}`);
        }
    }

    /**
     * Get publications (works) for an ORCID ID
     * @param {string} orcidId - ORCID identifier
     * @returns {Promise<Array>} List of publications with DOIs
     */
    async getAuthorWorks(orcidId) {
        try {
            console.log(`📚 ORCID: Getting works for ${orcidId}`);
            const response = await axios.get(`${this.baseURL}/${orcidId}/works`, {
                headers: this.headers,
                timeout: this.timeout
            });

            // Safe works extraction
            const responseData = response.data || {};
            const works = responseData.group || [];
            console.log(`📊 ORCID: Found ${works.length} work groups`);
            
            if (!Array.isArray(works) || works.length === 0) {
                console.log('⚠️ ORCID: No works found or invalid works data');
                return [];
            }
            
            const publications = [];
            const maxWorks = 20; // Limit to prevent server overload
            const worksToProcess = works.slice(0, maxWorks);
            
            console.log(`⚙️ ORCID: Processing ${worksToProcess.length} works (limited from ${works.length})`);

            for (let i = 0; i < worksToProcess.length; i++) {
                const workGroup = worksToProcess[i];
                
                // Safe work summary extraction
                if (!workGroup || !workGroup['work-summary'] || !Array.isArray(workGroup['work-summary']) || workGroup['work-summary'].length === 0) {
                    console.warn(`⚠️ ORCID: Invalid work group at index ${i}`);
                    continue;
                }
                
                const workSummary = workGroup['work-summary'][0];
                const putCode = workSummary?.['put-code'];
                
                if (!putCode) {
                    console.warn(`⚠️ ORCID: No put-code found for work ${i + 1}`);
                    continue;
                }

                try {
                    console.log(`🔍 ORCID: Getting details for work ${i + 1}/${worksToProcess.length} (put-code: ${putCode})`);
                    
                    // Get detailed work information with timeout
                    const workDetailResponse = await axios.get(`${this.baseURL}/${orcidId}/work/${putCode}`, {
                        headers: this.headers,
                        timeout: this.timeout
                    });

                    const workDetail = workDetailResponse.data || {};
                    
                    // Safe external IDs extraction
                    let externalIds = [];
                    let doi = null;
                    try {
                        if (workDetail['external-ids'] && workDetail['external-ids']['external-id'] && Array.isArray(workDetail['external-ids']['external-id'])) {
                            externalIds = workDetail['external-ids']['external-id'];
                            const doiId = externalIds.find(id => id && id['external-id-type'] === 'doi');
                            doi = doiId ? doiId['external-id-value'] : null;
                        }
                    } catch (extIdError) {
                        console.warn(`⚠️ ORCID: Error extracting external IDs for put-code ${putCode}:`, extIdError.message);
                    }
                    
                    // Safe publication data extraction
                    const title = workDetail.title?.title?.value || 'Untitled';
                    const subtitle = workDetail.title?.subtitle?.value || null;
                    const journal = workDetail['journal-title']?.value || null;
                    const type = workDetail.type || null;
                    const publicationDate = workDetail['publication-date'] || null;
                    const url = workDetail.url?.value || null;
                    
                    // Safe external IDs mapping
                    let mappedExternalIds = [];
                    try {
                        mappedExternalIds = externalIds.map(id => ({
                            type: id?.['external-id-type'] || 'unknown',
                            value: id?.['external-id-value'] || '',
                            url: id?.['external-id-url']?.value || null
                        })).filter(id => id.value);
                    } catch (mapError) {
                        console.warn(`⚠️ ORCID: Error mapping external IDs for put-code ${putCode}:`, mapError.message);
                    }
                    
                    publications.push({
                        putCode,
                        title,
                        subtitle,
                        journal,
                        type,
                        publicationDate,
                        doi,
                        url,
                        externalIds: mappedExternalIds
                    });
                    
                    // Add delay to prevent rate limiting
                    if (i < worksToProcess.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    
                } catch (workError) {
                    console.warn(`⚠️ ORCID: Failed to get work details for put-code ${putCode}:`, workError.message);
                    // Continue with next work instead of failing completely
                }
            }

            console.log(`✅ ORCID: Successfully processed ${publications.length} publications`);
            return publications;
        } catch (error) {
            console.error('❌ ORCID works error:', error.message);
            if (error.code === 'ECONNABORTED') {
                throw new Error('Yayınlar zaman aşımına uğradı');
            }
            if (error.response?.status === 404) {
                throw new Error('ORCID ID için yayın bulunamadı');
            }
            if (error.response?.status === 429) {
                throw new Error('ORCID API rate limit aşıldı');
            }
            throw new Error(`Yayınlar alınamadı: ${error.message}`);
        }
    }
}

module.exports = ORCIDService;
