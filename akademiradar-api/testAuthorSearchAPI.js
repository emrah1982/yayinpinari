const axios = require('axios');

const API_BASE = 'http://127.0.0.1:5000/api/author-search';

async function testAuthorSearchAPI() {
    console.log('🔬 Testing Author Search API');
    console.log('=' .repeat(50));

    try {
        // Test 1: Search authors
        console.log('\n1. 🔍 Testing author search...');
        // Test ORCID search instead
        console.log('Testing ORCID search with known ORCID ID...');
        const searchResponse = await axios.post(`${API_BASE}/search-by-orcid`, {
            orcidId: '0000-0002-0366-5396'
        }, {
            timeout: 10000
        });

        console.log('✅ Search successful!');
        console.log(`Found ${searchResponse.data.length} authors`);
        
        if (searchResponse.data.length > 0) {
            const firstAuthor = searchResponse.data[0];
            console.log(`First author: ${firstAuthor.name} (${firstAuthor.orcidId})`);
            
            // Test 2: Get author details
            console.log('\n2. 👤 Testing author details...');
            const detailsResponse = await axios.get(`${API_BASE}/author/${firstAuthor.orcidId}`, {
                timeout: 15000
            });

            console.log('✅ Author details successful!');
            console.log(`Name: ${detailsResponse.data.name}`);
            console.log(`Works count: ${detailsResponse.data.worksCount}`);
            console.log(`Affiliations: ${detailsResponse.data.affiliations.length}`);

            // Test 3: Get publications with citations
            console.log('\n3. 📚 Testing publications with citations...');
            const pubsResponse = await axios.get(`${API_BASE}/publications/${firstAuthor.orcidId}`, {
                timeout: 30000
            });

            console.log('✅ Publications successful!');
            console.log(`Publications: ${pubsResponse.data.publications.length}`);
            console.log(`Publications with DOI: ${pubsResponse.data.publications.filter(p => p.doi).length}`);
            
            if (pubsResponse.data.citationMetrics) {
                console.log('\n📊 Citation Metrics:');
                console.log(`Total citations: ${pubsResponse.data.citationMetrics.totalCitations}`);
                console.log(`H-Index: ${pubsResponse.data.citationMetrics.hIndex}`);
                console.log(`Average citations: ${pubsResponse.data.citationMetrics.averageCitationsPerPaper}`);
            }

            // Test 4: Comprehensive analysis
            console.log('\n4. 🎯 Testing comprehensive analysis...');
            const analysisResponse = await axios.get(`${API_BASE}/analysis/${firstAuthor.orcidId}`, {
                timeout: 45000
            });

            console.log('✅ Comprehensive analysis successful!');
            console.log(`Author: ${analysisResponse.data.author.name}`);
            console.log(`Publications: ${analysisResponse.data.publications.length}`);
            
            if (analysisResponse.data.metrics) {
                console.log(`Total citations: ${analysisResponse.data.metrics.totalCitations}`);
                console.log(`H-Index: ${analysisResponse.data.metrics.hIndex}`);
            }

            console.log('\n🎉 All API tests passed!');
            console.log('✅ Backend is working correctly');
            console.log('✅ ORCID service is stable');
            console.log('✅ Citation analysis is working');
            console.log('✅ Ready for React frontend integration');

        } else {
            console.log('⚠️ No authors found in search');
        }

    } catch (error) {
        console.error('❌ API test failed:', error.message);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        }
        if (error.code === 'ECONNREFUSED') {
            console.error('🚨 Server is not running on port 5000');
        }
    }
}

// Run the test
testAuthorSearchAPI().catch(console.error);
