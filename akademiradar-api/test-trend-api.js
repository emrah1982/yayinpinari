const fetch = require('node-fetch');

/**
 * Test script to debug trend analysis API responses
 */
async function testTrendAnalysisAPI() {
    console.log('🧪 Testing Trend Analysis API...\n');

    // Test comprehensive analysis
    console.log('📊 Testing Comprehensive Analysis...');
    try {
        const response = await fetch('http://localhost:5000/api/trend-analysis/comprehensive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: 'artificial intelligence',
                startYear: 2019,
                endYear: 2024,
                includeProjects: true,
                includeFunding: true,
                includeCitations: true
            })
        });

        if (!response.ok) {
            console.error('❌ API request failed:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return;
        }

        const result = await response.json();
        console.log('✅ API Response received');
        console.log('📋 Response structure:');
        console.log('- success:', result.success);
        console.log('- data exists:', !!result.data);
        
        if (result.data) {
            console.log('\n📈 Data structure analysis:');
            console.log('- query:', result.data.query);
            console.log('- sources:', result.data.sources);
            console.log('- status:', result.data.status);
            
            console.log('\n📊 Summary data:');
            if (result.data.summary) {
                console.log('- totalPublications:', result.data.summary.totalPublications);
                console.log('- totalProjects:', result.data.summary.totalProjects);
                console.log('- trendType:', result.data.summary.trendType);
                console.log('- growthRate:', result.data.summary.growthRate);
            }
            
            console.log('\n📅 Yearly data:');
            if (result.data.yearlyData) {
                console.log('- yearlyData keys:', Object.keys(result.data.yearlyData));
                console.log('- yearlyData structure:');
                const firstYear = Object.keys(result.data.yearlyData)[0];
                if (firstYear) {
                    console.log(`  ${firstYear}:`, result.data.yearlyData[firstYear]);
                }
            } else {
                console.log('❌ No yearlyData found in response!');
            }
            
            console.log('\n💡 Insights:');
            console.log('- insights count:', result.data.insights?.length || 0);
            
            console.log('\n🎯 Recommendations:');
            console.log('- recommendations count:', result.data.recommendations?.length || 0);
            
            // Full data dump for debugging
            console.log('\n🔍 Full API Response:');
            console.log(JSON.stringify(result, null, 2));
        }

    } catch (error) {
        console.error('❌ Error testing comprehensive analysis:', error.message);
    }

    console.log('\n' + '='.repeat(50));

    // Test quick summary
    console.log('\n⚡ Testing Quick Summary...');
    try {
        const response = await fetch('http://localhost:5000/api/trend-analysis/quick-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: 'machine learning',
                years: 5,
                includeKeywords: true
            })
        });

        if (!response.ok) {
            console.error('❌ Quick summary API request failed:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return;
        }

        const result = await response.json();
        console.log('✅ Quick Summary API Response received');
        console.log('📋 Response structure:');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('❌ Error testing quick summary:', error.message);
    }
}

// Run the test
if (require.main === module) {
    testTrendAnalysisAPI().catch(console.error);
}

module.exports = { testTrendAnalysisAPI };
