const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/author-search';

async function testAuthorSearch() {
    console.log('🔍 Testing Author Search API...\n');

    try {
        // Test 1: Search for authors
        console.log('1. Testing author search...');
        const searchResponse = await axios.post(`${API_BASE}/search`, {
            firstName: 'John',
            lastName: 'Smith',
            rows: 3
        });

        console.log('✅ Search successful!');
        console.log(`Found ${searchResponse.data.authors.length} authors`);
        
        if (searchResponse.data.authors.length > 0) {
            const firstAuthor = searchResponse.data.authors[0];
            console.log(`First author: ${firstAuthor.name} (ORCID: ${firstAuthor.orcidId})`);

            // Test 2: Get author details
            console.log('\n2. Testing author details...');
            try {
                const detailsResponse = await axios.get(`${API_BASE}/author/${firstAuthor.orcidId}`);
                console.log('✅ Author details successful!');
                console.log(`Author: ${detailsResponse.data.author.name}`);
                console.log(`Works count: ${detailsResponse.data.author.worksCount}`);
            } catch (detailsError) {
                console.log('❌ Author details failed:', detailsError.message);
            }

            // Test 3: Get author publications with citations
            console.log('\n3. Testing author publications...');
            try {
                const publicationsResponse = await axios.get(`${API_BASE}/author/${firstAuthor.orcidId}/publications`);
                console.log('✅ Publications successful!');
                console.log(`Publications count: ${publicationsResponse.data.publicationsCount}`);
                console.log(`Publications with DOIs: ${publicationsResponse.data.publicationsWithDOIs}`);
                console.log(`Total citations: ${publicationsResponse.data.metrics.totalCitations}`);
                console.log(`H-Index: ${publicationsResponse.data.metrics.hIndex}`);

                // Show first few publications
                if (publicationsResponse.data.publications.length > 0) {
                    console.log('\nFirst 3 publications:');
                    publicationsResponse.data.publications.slice(0, 3).forEach((pub, idx) => {
                        console.log(`${idx + 1}. ${pub.title || 'No title'}`);
                        console.log(`   DOI: ${pub.doi || 'No DOI'}`);
                        console.log(`   Citations: ${pub.citationData.citedByCount}`);
                        if (pub.citationData.error) {
                            console.log(`   Error: ${pub.citationData.error}`);
                        }
                        console.log('');
                    });
                }
            } catch (pubError) {
                console.log('❌ Publications failed:', pubError.message);
                console.log('Error details:', pubError.response?.data);
            }

            // Test 4: Get comprehensive analysis
            console.log('\n4. Testing comprehensive analysis...');
            try {
                const analysisResponse = await axios.get(`${API_BASE}/author/${firstAuthor.orcidId}/analysis`);
                console.log('✅ Analysis successful!');
                console.log('Summary:', analysisResponse.data.summary);
            } catch (analysisError) {
                console.log('❌ Analysis failed:', analysisError.message);
            }
        }

    } catch (error) {
        console.log('❌ Search failed:', error.message);
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response data:', error.response.data);
        }
    }
}

// Test with a different author if John Smith doesn't work
async function testSpecificAuthor() {
    console.log('\n🔬 Testing with a specific well-known researcher...\n');
    
    try {
        // Try with a researcher who likely has publications
        const searchResponse = await axios.post(`${API_BASE}/search`, {
            firstName: 'Geoffrey',
            lastName: 'Hinton',
            rows: 1
        });

        if (searchResponse.data.authors.length > 0) {
            const author = searchResponse.data.authors[0];
            console.log(`Found: ${author.name} (ORCID: ${author.orcidId})`);
            
            const analysisResponse = await axios.get(`${API_BASE}/author/${author.orcidId}/analysis`);
            console.log('Analysis result:', {
                totalPublications: analysisResponse.data.summary.totalPublications,
                totalCitations: analysisResponse.data.summary.totalCitations,
                hIndex: analysisResponse.data.summary.hIndex
            });
        }
    } catch (error) {
        console.log('❌ Specific author test failed:', error.message);
    }
}

// Run tests
async function runAllTests() {
    await testAuthorSearch();
    await testSpecificAuthor();
}

runAllTests().catch(console.error);
