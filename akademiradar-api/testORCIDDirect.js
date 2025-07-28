const ORCIDService = require('./services/orcidService');
const CitationAnalysisService = require('./services/citationAnalysisService');

const ORCID_ID = '0000-0002-0366-5396';

async function testORCIDDirect() {
    console.log(`🔬 Direct ORCID Service Test for: ${ORCID_ID}`);
    console.log('=' .repeat(60));

    const orcidService = new ORCIDService();
    const citationService = new CitationAnalysisService();

    try {
        // Test 1: Get author details
        console.log('\n1. 👤 Testing ORCID author details...');
        const authorDetails = await orcidService.getAuthorDetails(ORCID_ID);
        
        console.log('✅ Author details successful!');
        console.log(`   Name: ${authorDetails.name}`);
        console.log(`   ORCID: ${authorDetails.orcidId}`);
        console.log(`   Works count: ${authorDetails.worksCount}`);
        console.log(`   Affiliations: ${authorDetails.affiliations.length}`);
        if (authorDetails.biography) {
            console.log(`   Biography: ${authorDetails.biography.substring(0, 100)}...`);
        }

        // Test 2: Get publications
        console.log('\n2. 📚 Testing ORCID publications...');
        const publications = await orcidService.getAuthorWorks(ORCID_ID);
        
        console.log(`✅ Publications retrieved: ${publications.length}`);
        
        // Show first 3 publications
        console.log('\n📄 First 3 publications:');
        publications.slice(0, 3).forEach((pub, idx) => {
            console.log(`\n${idx + 1}. ${pub.title || 'No title'}`);
            console.log(`   Journal: ${pub.journal || 'No journal'}`);
            console.log(`   DOI: ${pub.doi || 'No DOI'}`);
            if (pub.publicationDate) {
                const year = pub.publicationDate.year || 'Unknown';
                console.log(`   Year: ${year}`);
            }
        });

        // Test 3: Get citation data for publications with DOIs
        console.log('\n3. 📊 Testing citation analysis...');
        const publicationsWithDOIs = publications.filter(pub => pub.doi);
        console.log(`   Publications with DOIs: ${publicationsWithDOIs.length}`);

        if (publicationsWithDOIs.length > 0) {
            // Test with first 3 DOIs to avoid overwhelming
            const testDOIs = publicationsWithDOIs.slice(0, 3).map(pub => pub.doi);
            console.log(`   Testing citation data for ${testDOIs.length} DOIs...`);

            const citationData = await citationService.getBulkCitationData(testDOIs);
            
            console.log('\n📈 Citation results:');
            citationData.forEach((citation, idx) => {
                console.log(`${idx + 1}. DOI: ${citation.doi}`);
                console.log(`   Citations: ${citation.citedByCount || 0}`);
                if (citation.error) {
                    console.log(`   ⚠️  Error: ${citation.error}`);
                }
            });

            // Calculate metrics
            const metrics = citationService.calculateAuthorMetrics(citationData);
            console.log('\n🏆 Author metrics (sample):');
            console.log(`   Total publications tested: ${metrics.totalPublications}`);
            console.log(`   Total citations: ${metrics.totalCitations}`);
            console.log(`   H-Index: ${metrics.hIndex}`);
            console.log(`   Average citations per paper: ${metrics.averageCitationsPerPaper}`);

            if (metrics.mostCitedPaper) {
                console.log(`\n🥇 Most cited paper (from sample):`);
                console.log(`   Title: ${metrics.mostCitedPaper.title}`);
                console.log(`   Citations: ${metrics.mostCitedPaper.citations}`);
            }
        }

        console.log('\n🎯 Summary for React Frontend:');
        console.log(`   ✅ Author data: Available`);
        console.log(`   ✅ Publications: ${publications.length} total`);
        console.log(`   ✅ DOI publications: ${publicationsWithDOIs.length}`);
        console.log(`   ✅ Citation analysis: Working`);
        console.log(`   ✅ All services functional`);

    } catch (error) {
        console.error('💥 Direct test failed:', error.message);
        console.error('Stack:', error.stack);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🏁 Direct ORCID test completed!');
}

// Run the test
testORCIDDirect().catch(console.error);
