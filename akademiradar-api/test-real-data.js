// Gerçek API verilerinin kullanılıp kullanılmadığını test et
const fetch = require('node-fetch');

async function testRealDataUsage() {
    console.log('🧪 Testing Real API Data Usage - "yapay zeka" query\n');
    
    try {
        console.log('📊 Calling comprehensive analysis...');
        const response = await fetch('http://localhost:5000/api/trend-analysis/comprehensive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: 'yapay zeka',
                startYear: 2019,
                endYear: 2025,
                includeProjects: true,
                includeFunding: true,
                includeCitations: true
            })
        });

        if (!response.ok) {
            console.error('❌ API Error:', response.status, response.statusText);
            return;
        }

        const result = await response.json();
        console.log('✅ API Response received\n');
        
        if (result.success && result.data) {
            console.log('🔍 DATA SOURCE ANALYSIS:');
            console.log('========================');
            
            // Veri kaynakları kontrolü
            console.log('📋 Sources:', result.data.sources);
            const hasRealData = result.data.sources.includes('Real Citation Data');
            const hasMockData = result.data.sources.includes('Mock Data (Demo)');
            
            console.log('\n🎯 REAL DATA STATUS:');
            console.log('- Real Citation Data:', hasRealData ? '✅ ACTIVE' : '❌ NOT FOUND');
            console.log('- Mock Data:', hasMockData ? '⚠️ FALLBACK ACTIVE' : '✅ NOT USED');
            
            // Metrikleri kontrol et
            console.log('\n📊 KEY METRICS:');
            console.log('- Total Publications:', result.data.summary?.totalPublications || 'N/A');
            console.log('- Growth Rate:', result.data.summary?.growthRate || 'N/A', '%');
            console.log('- Total Citations:', result.data.summary?.totalCitations || 'N/A');
            
            // Yıllık veri kontrolü
            if (result.data.yearlyData) {
                const years = Object.keys(result.data.yearlyData);
                console.log('\n📈 YEARLY DATA:');
                console.log('- Years available:', years.length);
                console.log('- Year range:', years);
                
                if (years.length > 0) {
                    const sampleYear = years[0];
                    const sampleData = result.data.yearlyData[sampleYear];
                    console.log(`- Sample (${sampleYear}):`, sampleData);
                }
            }
            
            // Sonuç değerlendirmesi
            console.log('\n🏆 EVALUATION:');
            if (hasRealData && !hasMockData) {
                console.log('✅ SUCCESS: Using REAL API data only!');
            } else if (hasRealData && hasMockData) {
                console.log('⚠️ MIXED: Using both real and mock data');
            } else if (hasMockData) {
                console.log('❌ FALLBACK: Using mock data only');
            } else {
                console.log('❓ UNKNOWN: No clear data source identified');
            }
            
        } else {
            console.log('❌ No data in API response');
            console.log('Full response:', result);
        }

    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testRealDataUsage();
