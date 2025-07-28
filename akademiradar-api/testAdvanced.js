const LiteratureGapServiceAdvanced = require('./services/literatureGapServiceAdvanced');

async function testAdvancedService() {
    console.log('🚀 Gelişmiş Literatür Boşluğu Servisi Testi\n');
    
    try {
        const service = new LiteratureGapServiceAdvanced();
        
        // Test 1: Tarım konusu
        console.log('🌾 Test 1: Tarım konusunda analiz...');
        const agricultureResult = await service.analyzeLiteratureGaps('tarımda yapay zeka kullanımı', {
            yearRange: { start: 2020, end: 2024 },
            maxResults: 50,
            includeContentAnalysis: true,
            includeCitationAnalysis: true
        });
        
        if (agricultureResult.success) {
            console.log('✅ Tarım analizi başarılı!');
            console.log(`📊 Tespit edilen boşluk sayısı: ${agricultureResult.totalGapsFound}`);
            console.log(`📚 Toplam analiz edilen yayın: ${agricultureResult.totalAnalyzedPublications}`);
            
            // Yayın dağılımını göster
            if (agricultureResult.publicationBreakdown) {
                console.log('📈 Yayın Dağılımı:');
                const breakdown = agricultureResult.publicationBreakdown;
                console.log(`   - Konuya Özgü: ${breakdown.topicSpecific} makale`);
                console.log(`   - İçerik Analizi: ${breakdown.contentAnalysis} makale`);
                console.log(`   - Benzersiz Kaynak: ${breakdown.uniqueSources} makale`);
                console.log(`   - Kullanılan Veritabanları: ${breakdown.databases.join(', ')}`);
            }
            
            console.log('🎯 Tespit edilen boşluklar:');
            agricultureResult.gapAnalysis.identifiedGaps.forEach((gap, index) => {
                console.log(`   ${index + 1}. ${gap.title} (${gap.severity})`);
                console.log(`      - ${gap.description}`);
                console.log(`      - Kanıt: ${gap.evidence}`);
                
                // Kanıt makalelerini göster
                if (gap.evidencePapers && gap.evidencePapers.length > 0) {
                    console.log(`      📚 Kanıt Makaleleri:`);
                    gap.evidencePapers.forEach((paper, pIndex) => {
                        console.log(`         ${pIndex + 1}. ${paper.title} (${paper.year})`);
                        console.log(`            Yazarlar: ${paper.authors}`);
                        if (paper.doi) console.log(`            DOI: ${paper.doi}`);
                        if (paper.url) console.log(`            URL: ${paper.url}`);
                    });
                }
                
                // Kaynak linklerini göster
                if (gap.sourceLinks && gap.sourceLinks.length > 0) {
                    console.log(`      🔗 Kaynak Linkleri:`);
                    gap.sourceLinks.slice(0, 3).forEach((link, lIndex) => {
                        console.log(`         ${lIndex + 1}. ${link.title}`);
                        if (link.doiUrl) console.log(`            DOI Link: ${link.doiUrl}`);
                        if (link.url) console.log(`            Makale URL: ${link.url}`);
                        if (link.googleScholarUrl) console.log(`            Google Scholar: ${link.googleScholarUrl}`);
                    });
                }
                
                // Yazar önerilerini göster
                if (gap.authorSuggestions && gap.authorSuggestions.length > 0) {
                    console.log(`      💡 Yazar Önerileri:`);
                    gap.authorSuggestions.slice(0, 2).forEach((suggestion, sIndex) => {
                        console.log(`         ${sIndex + 1}. ${suggestion.suggestion}`);
                        console.log(`            Kaynak: ${suggestion.source} (${suggestion.year})`);
                    });
                }
            });
        } else {
            console.log('❌ Tarım analizi başarısız:', agricultureResult.error);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 2: Sağlık konusu
        console.log('🏥 Test 2: Sağlık konusunda analiz...');
        const healthResult = await service.analyzeLiteratureGaps('telemedicine', {
            yearRange: { start: 2020, end: 2024 },
            maxResults: 50,
            includeContentAnalysis: true,
            includeCitationAnalysis: false
        });
        
        if (healthResult.success) {
            console.log('✅ Sağlık analizi başarılı!');
            console.log(`📊 Tespit edilen boşluk sayısı: ${healthResult.totalGapsFound}`);
            console.log(`📚 Toplam analiz edilen yayın: ${healthResult.totalAnalyzedPublications}`);
            
            // Yayın dağılımını göster
            if (healthResult.publicationBreakdown) {
                console.log('📈 Yayın Dağılımı:');
                const breakdown = healthResult.publicationBreakdown;
                console.log(`   - İçerik Analizi: ${breakdown.contentAnalysis} makale`);
                console.log(`   - Benzersiz Kaynak: ${breakdown.uniqueSources} makale`);
                console.log(`   - Analiz Türleri: ${breakdown.analysisTypes.length} farklı analiz`);
            }
            
            console.log('🎯 Tespit edilen boşluklar:');
            healthResult.gapAnalysis.identifiedGaps.forEach((gap, index) => {
                console.log(`   ${index + 1}. ${gap.title} (${gap.severity})`);
                console.log(`      - ${gap.description}`);
                console.log(`      - Kanıt: ${gap.evidence}`);
                
                // Kanıt makalelerini göster
                if (gap.evidencePapers && gap.evidencePapers.length > 0) {
                    console.log(`      📚 Kanıt Makaleleri (${gap.evidencePapers.length} adet):`);
                    gap.evidencePapers.slice(0, 2).forEach((paper, pIndex) => {
                        console.log(`         ${pIndex + 1}. ${paper.title}`);
                        if (paper.doi) console.log(`            DOI: https://doi.org/${paper.doi}`);
                        if (paper.url) console.log(`            URL: ${paper.url}`);
                    });
                }
                
                // Kaynak linklerini göster
                if (gap.sourceLinks && gap.sourceLinks.length > 0) {
                    console.log(`      🔗 Erişilebilir Linkler (${gap.sourceLinks.length} adet):`);
                    gap.sourceLinks.slice(0, 2).forEach((link, lIndex) => {
                        console.log(`         ${lIndex + 1}. ${link.title}`);
                        if (link.doiUrl) console.log(`            📄 DOI: ${link.doiUrl}`);
                        if (link.googleScholarUrl) console.log(`            🔍 Scholar: ${link.googleScholarUrl}`);
                    });
                }
            });
        } else {
            console.log('❌ Sağlık analizi başarısız:', healthResult.error);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 3: Teknoloji konusu
        console.log('💻 Test 3: Teknoloji konusunda analiz...');
        const techResult = await service.analyzeLiteratureGaps('blockchain technology', {
            yearRange: { start: 2021, end: 2024 },
            maxResults: 30,
            includeContentAnalysis: true,
            includeCitationAnalysis: true
        });
        
        if (techResult.success) {
            console.log('✅ Teknoloji analizi başarılı!');
            console.log(`📊 Tespit edilen boşluk sayısı: ${techResult.totalGapsFound}`);
            console.log('🎯 Tespit edilen boşluklar:');
            techResult.gapAnalysis.identifiedGaps.forEach((gap, index) => {
                console.log(`   ${index + 1}. ${gap.title} (${gap.severity})`);
                console.log(`      - ${gap.opportunity}`);
            });
        } else {
            console.log('❌ Teknoloji analizi başarısız:', techResult.error);
        }
        
        console.log('\n🎉 Tüm testler tamamlandı!');
        
    } catch (error) {
        console.error('❌ Test hatası:', error.message);
    }
}

testAdvancedService();
