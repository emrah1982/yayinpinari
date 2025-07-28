const axios = require('axios');

const API_BASE = 'http://127.0.0.1:5000/api/author-search';
const ORCID_ID = '0009-0000-5837-7300';

// Configure axios with timeout
axios.defaults.timeout = 30000; // 30 seconds timeout
axios.defaults.headers.common['User-Agent'] = 'AkademiRadar-Test/1.0';

async function testSpecificORCID() {
    console.log(`🔬 Testing specific ORCID ID: ${ORCID_ID}`);
    console.log('=' .repeat(60));

    try {
        // Test 1: Get author details
        console.log('\n1. 👤 Testing author details...');
        const detailsResponse = await axios.get(`${API_BASE}/author/${ORCID_ID}`);
        
        if (detailsResponse.data.success) {
            const author = detailsResponse.data.author;
            console.log('✅ Author details successful!');
            console.log(`   Name: ${author.name}`);
            console.log(`   ORCID: ${author.orcidId}`);
            console.log(`   Works count: ${author.worksCount}`);
            console.log(`   Affiliations: ${author.affiliations.length}`);
            if (author.biography) {
                console.log(`   Biography: ${author.biography.substring(0, 100)}...`);
            }
        } else {
            console.log('❌ Author details failed');
        }

        // Test 2: Get publications with citation analysis
        console.log('\n2. 📚 Testing publications with citations...');
        const publicationsResponse = await axios.get(`${API_BASE}/author/${ORCID_ID}/publications`);
        
        if (publicationsResponse.data.success) {
            console.log('✅ Publications successful!');
            console.log(`   Total publications: ${publicationsResponse.data.publicationsCount}`);
            console.log(`   Publications with DOIs: ${publicationsResponse.data.publicationsWithDOIs}`);
            console.log(`   Total citations: ${publicationsResponse.data.metrics.totalCitations}`);
            console.log(`   H-Index: ${publicationsResponse.data.metrics.hIndex}`);
            console.log(`   Average citations per paper: ${publicationsResponse.data.metrics.averageCitationsPerPaper}`);

            // Show first 5 publications
            console.log('\n📄 First 5 publications:');
            publicationsResponse.data.publications.slice(0, 5).forEach((pub, idx) => {
                console.log(`\n${idx + 1}. ${pub.title || 'No title'}`);
                console.log(`   Journal: ${pub.journal || 'No journal'}`);
                console.log(`   DOI: ${pub.doi || 'No DOI'}`);
                console.log(`   Citations: ${pub.citationData.citedByCount}`);
                if (pub.citationData.error) {
                    console.log(`   ⚠️  Citation error: ${pub.citationData.error}`);
                }
                if (pub.publicationDate) {
                    const year = pub.publicationDate.year || 'Unknown';
                    console.log(`   Year: ${year}`);
                }
            });

            // Show most cited paper if available
            if (publicationsResponse.data.metrics.mostCitedPaper) {
                const mostCited = publicationsResponse.data.metrics.mostCitedPaper;
                console.log(`\n🏆 Most cited paper:`);
                console.log(`   Title: ${mostCited.title}`);
                console.log(`   Citations: ${mostCited.citations}`);
                console.log(`   DOI: ${mostCited.doi}`);
            }

        } else {
            console.log('❌ Publications failed');
        }

        // Test 3: Get comprehensive analysis
        console.log('\n3. 📊 Testing comprehensive analysis...');
        const analysisResponse = await axios.get(`${API_BASE}/author/${ORCID_ID}/analysis`);
        
        if (analysisResponse.data.success) {
            console.log('✅ Comprehensive analysis successful!');
            const summary = analysisResponse.data.summary;
            console.log('\n📈 Summary:');
            console.log(`   Total publications: ${summary.totalPublications}`);
            console.log(`   Publications with DOIs: ${summary.publicationsWithDOIs}`);
            console.log(`   Total citations: ${summary.totalCitations}`);
            console.log(`   H-Index: ${summary.hIndex}`);
            console.log(`   Average citations per paper: ${summary.averageCitationsPerPaper}`);

            // Test data for React frontend
            console.log('\n🎯 Data ready for React frontend:');
            console.log(`   Author data: ✅ Available`);
            console.log(`   Publications data: ✅ Available (${analysisResponse.data.publications.length} items)`);
            console.log(`   Metrics data: ✅ Available`);
            console.log(`   Citation data: ✅ Available for ${analysisResponse.data.publications.filter(p => p.citationData && !p.citationData.error).length} publications`);

        } else {
            console.log('❌ Comprehensive analysis failed');
        }

    } catch (error) {
        console.error('💥 Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🏁 Test completed!');
}

// Run the test
testSpecificORCID().catch(console.error);
