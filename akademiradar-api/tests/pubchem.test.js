const axios = require('axios');

// PubChem API test fonksiyonları
async function testPubChemAPI() {
    try {
        // Test 1: Compound bilgisi alma (Aspirin)
        console.log('\n🧪 Test 1: Aspirin bileşik bilgisi alınıyor...');
        const aspirinResponse = await axios.get('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/aspirin/JSON');
        console.log('✅ Aspirin bilgisi başarıyla alındı.');
        console.log(`CID: ${aspirinResponse.data.PC_Compounds[0].id.id.cid}`);

        // Test 2: CID ile bileşik detayları alma
        console.log('\n🧪 Test 2: CID ile bileşik detayları alınıyor...');
        const cid = aspirinResponse.data.PC_Compounds[0].id.id.cid;
        const compoundDetails = await axios.get(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`);
        console.log('✅ Bileşik detayları başarıyla alındı:');
        console.log(compoundDetails.data.PropertyTable.Properties[0]);

        // Test 3: Bileşik sinonimlerini alma
        console.log('\n🧪 Test 3: Bileşik sinonimlerini alınıyor...');
        const synonymsResponse = await axios.get(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`);
        console.log('✅ Sinonimler başarıyla alındı. İlk 5 sinonim:');
        console.log(synonymsResponse.data.InformationList.Information[0].Synonym.slice(0, 5));

        // Test 4: Bileşik yapısını alma (SMILES formatında)
        console.log('\n🧪 Test 4: SMILES yapısı alınıyor...');
        const smilesResponse = await axios.get(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/CanonicalSMILES/JSON`);
        console.log('✅ SMILES yapısı başarıyla alındı:');
        console.log(smilesResponse.data.PropertyTable.Properties[0].CanonicalSMILES);

    } catch (error) {
        console.error('❌ Test sırasında hata oluştu:', error.message);
        if (error.response) {
            console.error('Hata detayları:', error.response.data);
        }
    }
}

// Test scriptini çalıştır
console.log('🚀 PubChem API Testleri başlatılıyor...');
testPubChemAPI().then(() => {
    console.log('\n✨ Tüm testler tamamlandı!');
});
