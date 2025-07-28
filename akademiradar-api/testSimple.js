const axios = require('axios');

async function testSimpleAPI() {
    console.log('🔍 Basit API Test...');
    
    try {
        // Sadece health check
        console.log('Health check...');
        const healthResponse = await axios.get('http://127.0.0.1:5000/api/literature-gap/health');
        console.log('✅ Health OK');
        
        // Sadece gap types
        console.log('Gap types...');
        const typesResponse = await axios.get('http://127.0.0.1:5000/api/literature-gap/gap-types');
        console.log('✅ Gap Types OK');
        
        // Minimal gap analysis
        console.log('Minimal gap analysis...');
        const gapResponse = await axios.post('http://127.0.0.1:5000/api/literature-gap/analyze', {
            topic: 'test',
            options: { yearRange: { start: 2023, end: 2024 }, maxResults: 10 }
        });
        
        console.log('Gap Analysis Response:', gapResponse.data);
        
    } catch (error) {
        console.error('❌ Hata:', error.response?.data || error.message);
    }
}

testSimpleAPI();
