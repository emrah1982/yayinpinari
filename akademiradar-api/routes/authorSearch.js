const express = require('express');
const router = express.Router();
const ORCIDService = require('../services/orcidService');
const CitationAnalysisService = require('../services/citationAnalysisService');

const orcidService = new ORCIDService();
const citationService = new CitationAnalysisService();

/**
 * Search authors by name and surname
 * POST /api/author-search/search
 * Body: { firstName: string, lastName: string, rows?: number }
 */
router.post('/search', async (req, res) => {
    try {
        const { firstName, lastName, rows = 20 } = req.body;

        if (!firstName || !lastName) {
            return res.status(400).json({
                error: 'First name and last name are required'
            });
        }

        console.log(`Searching for authors: ${firstName} ${lastName}`);
        
        const authors = await orcidService.searchAuthors(firstName, lastName, rows);
        
        res.json({
            success: true,
            count: authors.length,
            authors: authors
        });

    } catch (error) {
        console.error('Author search error:', error);
        res.status(500).json({
            error: 'Failed to search authors',
            message: error.message
        });
    }
});

/**
 * Search author by ORCID ID
 * POST /api/author-search/search-by-orcid
 * Body: { orcidId: string }
 */
router.post('/search-by-orcid', async (req, res) => {
    try {
        const { orcidId } = req.body;

        if (!orcidId) {
            return res.status(400).json({
                error: 'ORCID ID is required'
            });
        }

        // ORCID ID format validation (basic)
        const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
        if (!orcidPattern.test(orcidId)) {
            return res.status(400).json({
                error: 'Invalid ORCID ID format. Expected format: 0000-0000-0000-0000'
            });
        }

        console.log(`Searching for author by ORCID: ${orcidId}`);
        
        // Get author details directly
        const authorDetails = await orcidService.getAuthorDetails(orcidId);
        
        // Return as array to match search response format
        const authors = [{
            orcidId: authorDetails.orcidId,
            name: authorDetails.name,
            givenNames: authorDetails.givenNames,
            familyName: authorDetails.familyName,
            affiliations: authorDetails.affiliations,
            worksCount: authorDetails.worksCount
        }];
        
        res.json({
            success: true,
            count: authors.length,
            authors: authors,
            searchType: 'orcid'
        });

    } catch (error) {
        console.error('ORCID search error:', error);
        if (error.message.includes('ORCID ID bulunamadı') || error.message.includes('404')) {
            return res.status(404).json({
                error: 'Author not found with this ORCID ID',
                message: error.message
            });
        }
        res.status(500).json({
            error: 'Failed to search author by ORCID',
            message: error.message
        });
    }
});

/**
 * Get author details by ORCID ID
 * GET /api/author-search/author/:orcidId
 */
router.get('/author/:orcidId', async (req, res) => {
    try {
        const { orcidId } = req.params;

        if (!orcidId) {
            return res.status(400).json({
                error: 'ORCID ID is required'
            });
        }

        console.log(`Getting author details for ORCID: ${orcidId}`);
        
        const authorDetails = await orcidService.getAuthorDetails(orcidId);
        
        res.json({
            success: true,
            author: authorDetails
        });

    } catch (error) {
        console.error('Author details error:', error);
        res.status(500).json({
            error: 'Failed to get author details',
            message: error.message
        });
    }
});

/**
 * Get author publications with citation analysis
 * GET /api/author-search/author/:orcidId/publications
 */
router.get('/author/:orcidId/publications', async (req, res) => {
    try {
        const { orcidId } = req.params;

        if (!orcidId) {
            return res.status(400).json({
                error: 'ORCID ID is required'
            });
        }

        console.log(`Getting publications for ORCID: ${orcidId}`);
        
        // Get publications from ORCID
        const publications = await orcidService.getAuthorWorks(orcidId);
        
        // Get citation data for publications with DOIs
        const publicationsWithDOIs = publications.filter(pub => pub.doi);
        const dois = publicationsWithDOIs.map(pub => pub.doi);
        
        console.log(`Found ${publications.length} publications, ${dois.length} with DOIs`);
        
        let citationData = [];
        if (dois.length > 0) {
            citationData = await citationService.getBulkCitationData(dois);
        }

        // Merge publication data with citation data
        const enrichedPublications = publications.map(pub => {
            if (pub.doi) {
                const citation = citationData.find(c => c.doi === pub.doi);
                return {
                    ...pub,
                    citationData: citation || {
                        citedByCount: 0,
                        error: 'Citation data not available'
                    }
                };
            }
            return {
                ...pub,
                citationData: {
                    citedByCount: 0,
                    error: 'No DOI available'
                }
            };
        });

        // Calculate author metrics
        const metrics = citationService.calculateAuthorMetrics(citationData);

        res.json({
            success: true,
            orcidId: orcidId,
            publicationsCount: publications.length,
            publicationsWithDOIs: dois.length,
            publications: enrichedPublications,
            metrics: metrics
        });

    } catch (error) {
        console.error('Publications error:', error);
        res.status(500).json({
            error: 'Failed to get author publications',
            message: error.message
        });
    }
});

/**
 * Get citation data for a specific DOI
 * GET /api/author-search/citation/:doi
 */
router.get('/citation/:doi(*)', async (req, res) => {
    try {
        const doi = req.params.doi;

        if (!doi) {
            return res.status(400).json({
                error: 'DOI is required'
            });
        }

        console.log(`Getting citation data for DOI: ${doi}`);
        
        const citationData = await citationService.getCitationData(doi);
        
        res.json({
            success: true,
            citation: citationData
        });

    } catch (error) {
        console.error('Citation data error:', error);
        res.status(500).json({
            error: 'Failed to get citation data',
            message: error.message
        });
    }
});

/**
 * Get comprehensive author analysis
 * GET /api/author-search/author/:orcidId/analysis
 */
router.get('/author/:orcidId/analysis', async (req, res) => {
    try {
        const { orcidId } = req.params;

        if (!orcidId) {
            return res.status(400).json({
                error: 'ORCID ID is required'
            });
        }

        console.log(`Getting comprehensive analysis for ORCID: ${orcidId}`);
        
        // Get all data in parallel
        const [authorDetails, publications] = await Promise.all([
            orcidService.getAuthorDetails(orcidId),
            orcidService.getAuthorWorks(orcidId)
        ]);

        // Get citation data for publications with DOIs
        const publicationsWithDOIs = publications.filter(pub => pub.doi);
        const dois = publicationsWithDOIs.map(pub => pub.doi);
        
        let citationData = [];
        if (dois.length > 0) {
            citationData = await citationService.getBulkCitationData(dois);
        }

        // Calculate metrics
        const metrics = citationService.calculateAuthorMetrics(citationData);

        // Merge all data
        const enrichedPublications = publications.map(pub => {
            if (pub.doi) {
                const citation = citationData.find(c => c.doi === pub.doi);
                return {
                    ...pub,
                    citationData: citation || {
                        citedByCount: 0,
                        error: 'Citation data not available'
                    }
                };
            }
            return {
                ...pub,
                citationData: {
                    citedByCount: 0,
                    error: 'No DOI available'
                }
            };
        });

        res.json({
            success: true,
            author: authorDetails,
            publications: enrichedPublications,
            metrics: metrics,
            summary: {
                totalPublications: publications.length,
                publicationsWithDOIs: dois.length,
                totalCitations: metrics.totalCitations,
                hIndex: metrics.hIndex,
                averageCitationsPerPaper: metrics.averageCitationsPerPaper
            }
        });

    } catch (error) {
        console.error('Author analysis error:', error);
        res.status(500).json({
            error: 'Failed to get author analysis',
            message: error.message
        });
    }
});

module.exports = router;
