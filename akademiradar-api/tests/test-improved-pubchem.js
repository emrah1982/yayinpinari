require('dotenv').config();
const axios = require('axios');

// PubChem API temel URL'i
const PUBCHEM_BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

// Element adları ve sembolleri
const ELEMENT_MAP = {
    1: 'H (Hidrojen)',
    6: 'C (Karbon)',
    7: 'N (Azot)',
    8: 'O (Oksijen)',
    15: 'P (Fosfor)',
    16: 'S (Kükürt)'
};

// Bağ tipleri
const BOND_TYPES = {
    1: 'Tekli Bağ',
    2: 'İkili Bağ',
    3: 'Üçlü Bağ',
    4: 'Aromatik Bağ'
};

// PubChem API işlevleri
const pubchemAPI = {
    async getCompoundByName(name) {
        const response = await axios.get(`${PUBCHEM_BASE_URL}/compound/name/${name}/JSON`);
        return response.data;
    },

    async getCompoundByCID(cid) {
        const response = await axios.get(`${PUBCHEM_BASE_URL}/compound/cid/${cid}/JSON`);
        return response.data;
    },

    async getCompoundProperties(cid) {
        const response = await axios.get(`${PUBCHEM_BASE_URL}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`);
        return response.data;
    },

    async getCompoundSynonyms(cid) {
        const response = await axios.get(`${PUBCHEM_BASE_URL}/compound/cid/${cid}/synonyms/JSON`);
        return response.data;
    },

    async getMolecularStructure(cid) {
        try {
            // Önce SMILES yapısını ve formülü al
            const smilesResponse = await axios.get(`${PUBCHEM_BASE_URL}/compound/cid/${cid}/property/IsomericSMILES,MolecularFormula/JSON`);
            const properties = smilesResponse.data.PropertyTable.Properties[0];

            // Sonra tam moleküler yapıyı al
            const structureResponse = await axios.get(`${PUBCHEM_BASE_URL}/compound/cid/${cid}/JSON`);
            const structure = structureResponse.data;

            return {
                smiles: properties.IsomericSMILES,
                formula: properties.MolecularFormula,
                structure: structure
            };
        } catch (error) {
            console.error('Moleküler yapı verisi alınırken hata:', error.message);
            throw error;
        }
    }
};

async function testImprovedPubChem() {
    console.log('🧪 Geliştirilmiş PubChem Servisi Testi\n');

    try {
        // Test 1: İsimden Bileşik Arama ve Temel Bilgiler
        console.log('Test 1: İsimden Bileşik Arama ve Temel Bilgiler');
        const aspirinData = await pubchemAPI.getCompoundByName('aspirin');
        const cid = aspirinData.PC_Compounds[0].id.id.cid;
        console.log(`Aspirin CID: ${cid}`);

        // Test 2: Bileşik Özellikleri
        console.log('\nTest 2: Bileşik Özellikleri');
        const properties = await pubchemAPI.getCompoundProperties(cid);
        const prop = properties.PropertyTable.Properties[0];
        console.log('Moleküler Formül:', prop.MolecularFormula);
        console.log('Moleküler Ağırlık:', prop.MolecularWeight);
        console.log('IUPAC Adı:', prop.IUPACName);

        // Test 3: Sinonimler
        console.log('\nTest 3: Sinonimler');
        const synonyms = await pubchemAPI.getCompoundSynonyms(cid);
        const synonymList = synonyms.InformationList.Information[0].Synonym.slice(0, 5);
        console.log('İlk 5 Sinonim:');
        synonymList.forEach((syn, index) => console.log(`${index + 1}. ${syn}`));

        // Test 4: Moleküler Yapı Analizi
        console.log('\nTest 4: Moleküler Yapı Analizi');
        try {
            process.stdout.write('Moleküler yapı verisi alınıyor... ');
            const { smiles, formula, structure } = await pubchemAPI.getMolecularStructure(cid);
            console.log('✅');
            
            if (!structure?.PC_Compounds?.[0]) {
                throw new Error('Moleküler yapı verisi alınamadı');
            }
            
            const compound = structure.PC_Compounds[0];
            
            // SMILES ve Moleküler Yapı bilgilerini göster
            console.log('\nKimyasal Yapı Bilgileri:');
            console.log('----------------------');
            console.log('SMILES Yapısı:', smiles);
            console.log('Molekül Formülü:', formula);
            
            console.log('\nMoleküler Yapı Bilgileri:');
            console.log('-----------------------');
            console.log(`Toplam Atom Sayısı: ${compound.atoms.aid.length}`);
            console.log(`Toplam Bağ Sayısı: ${compound.bonds.aid1.length}`);
            
            // Element dağılımını göster
            console.log('\nElement Dağılımı:');
            console.log('-----------------');
            const elementCounts = {};
            compound.atoms.element.forEach(e => {
                const elementName = ELEMENT_MAP[e] || `Element-${e}`;
                elementCounts[elementName] = (elementCounts[elementName] || 0) + 1;
            });

            Object.entries(elementCounts)
                .sort((a, b) => b[1] - a[1])
                .forEach(([element, count]) => {
                    console.log(`${element}: ${count} atom`);
                });
            
            // Bağ tiplerini göster
            console.log('\nBağ Tipleri:');
            console.log('------------');
            const bondCounts = {};
            compound.bonds.order.forEach(order => {
                bondCounts[order] = (bondCounts[order] || 0) + 1;
            });
            
            Object.entries(bondCounts)
                .sort((a, b) => b[1] - a[1])
                .forEach(([type, count]) => {
                    console.log(`${BOND_TYPES[type] || `Tip-${type}`}: ${count} adet`);
                });
            
            console.log('\n✅ Moleküler yapı analizi başarıyla tamamlandı!');
            
        } catch (error) {
            console.error('❌ Moleküler yapı analizi sırasında hata:', error.message);
            throw error;
        }

        // Test 5: Hata Yönetimi
        console.log('\nTest 5: Hata Yönetimi');
        try {
            console.log('Geçersiz bileşik ismi ile arama yapılıyor...');
            await pubchemAPI.getCompoundByName('invalid_compound_xyz123');
        } catch (error) {
            console.log('✅ Beklenen hata alındı:', error.message);
        }

        console.log('\n✅ Geliştirilmiş PubChem testleri başarıyla tamamlandı!\n');

    } catch (error) {
        console.error('❌ Test sırasında hata:', error.message);
        if (error.response) {
            console.error('Hata Detayları:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
    }
}

testImprovedPubChem();
