/**
 * React Citation Integration Test
 * Bu dosya React arayüzünde atıf bilgisi entegrasyonunu test eder
 */

import { citationService } from './services/api';

class ReactCitationTester {
    constructor() {
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🚀 React Citation Integration Tests Starting...\n');
        
        const tests = [
            { name: 'API Connection Test', fn: () => this.testAPIConnection() },
            { name: 'Single Citation Test', fn: () => this.testSingleCitation() },
            { name: 'Batch Citation Test', fn: () => this.testBatchCitation() },
            { name: 'Citation Service Status', fn: () => this.testServiceStatus() }
        ];

        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            try {
                console.log(`📋 ${test.name} running...`);
                await test.fn();
                console.log(`✅ ${test.name}: SUCCESS\n`);
                passed++;
            } catch (error) {
                console.log(`❌ ${test.name}: FAILED`);
                console.log(`   Error: ${error.message}\n`);
                failed++;
            }
        }

        console.log('📊 Test Results:');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
        
        return { passed, failed, total: passed + failed };
    }

    async testAPIConnection() {
        try {
            const response = await citationService.getStatus();
            
            if (!response.success) {
                throw new Error('API connection failed');
            }

            console.log(`   📡 API Status: ${response.status}`);
            console.log(`   🔧 Service: ${response.service}`);
            console.log(`   📚 Features: ${response.features.length} available`);
            
            return true;
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Backend server is not running. Please start the API server first.');
            }
            throw error;
        }
    }

    async testSingleCitation() {
        const testPublication = {
            title: "Deep Learning",
            author: "Ian Goodfellow",
            year: "2016"
        };

        const response = await citationService.getSingle(
            testPublication.title,
            testPublication.author,
            testPublication.year
        );

        if (!response.success || !response.result) {
            throw new Error('Single citation request failed');
        }

        const citationInfo = response.result;
        console.log(`   📚 Title: ${citationInfo.title}`);
        console.log(`   📊 Citations: ${citationInfo.citationCount}`);
        console.log(`   🔍 Sources: ${citationInfo.sources.join(', ')}`);
        console.log(`   📅 Last Updated: ${new Date(citationInfo.lastUpdated).toLocaleDateString()}`);

        return true;
    }

    async testBatchCitation() {
        const testPublications = [
            {
                title: "Machine Learning",
                author: "Tom Mitchell",
                year: "1997"
            },
            {
                title: "Pattern Recognition and Machine Learning",
                author: "Christopher Bishop",
                year: "2006"
            }
        ];

        const response = await citationService.getBatch(testPublications);

        if (!response.success || !response.results) {
            throw new Error('Batch citation request failed');
        }

        console.log(`   📚 Batch Test - ${response.results.length} publications processed`);
        
        response.results.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.publication.title}: ${item.citationInfo.citationCount} citations`);
        });

        return true;
    }

    async testServiceStatus() {
        const response = await citationService.getStatus();
        
        if (!response.success) {
            throw new Error('Service status check failed');
        }

        console.log(`   🟢 Service Status: ${response.status}`);
        console.log(`   📡 APIs Available: ${Object.keys(response.apis).length}`);
        console.log(`   ⚡ Features: ${response.features.length}`);

        return true;
    }

    // React Component Test Helper
    generateMockSearchResults() {
        return [
            {
                id: "test_1",
                title: "Artificial Intelligence: A Modern Approach",
                authors: ["Stuart Russell", "Peter Norvig"],
                abstract: "This is a comprehensive textbook on artificial intelligence...",
                published: "2020-01-01",
                doi: "10.1000/test.doi.1",
                url: "https://example.com/paper1",
                source: "test"
            },
            {
                id: "test_2", 
                title: "Deep Learning",
                authors: ["Ian Goodfellow", "Yoshua Bengio", "Aaron Courville"],
                abstract: "Deep learning is a form of machine learning...",
                published: "2016-01-01",
                url: "https://example.com/paper2",
                source: "test"
            }
        ];
    }

    // Citation Info Mock Data for Testing
    generateMockCitationInfo(title) {
        const mockData = {
            "Artificial Intelligence: A Modern Approach": {
                citationCount: 15420,
                hIndex: 45,
                sources: ["Crossref", "Semantic Scholar"],
                details: {
                    influentialCitationCount: 4626,
                    recentCitations: 892,
                    selfCitations: 154,
                    citationVelocity: 385
                }
            },
            "Deep Learning": {
                citationCount: 8934,
                hIndex: 38,
                sources: ["Semantic Scholar", "OpenAlex"],
                details: {
                    influentialCitationCount: 2680,
                    recentCitations: 567,
                    selfCitations: 89,
                    citationVelocity: 298
                }
            }
        };

        return mockData[title] || {
            citationCount: Math.floor(Math.random() * 1000) + 50,
            hIndex: Math.floor(Math.random() * 20) + 5,
            sources: ["Mock Academic Database"],
            details: {
                influentialCitationCount: Math.floor(Math.random() * 300) + 20,
                recentCitations: Math.floor(Math.random() * 100) + 10,
                selfCitations: Math.floor(Math.random() * 50) + 5,
                citationVelocity: Math.floor(Math.random() * 50) + 10
            }
        };
    }
}

// Export for use in React components
export default ReactCitationTester;

// Console test runner
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Only run in development
    const tester = new ReactCitationTester();
    
    // Add to window for manual testing
    window.citationTester = tester;
    
    console.log('🧪 Citation Tester available at window.citationTester');
    console.log('Run: await window.citationTester.runAllTests()');
}
