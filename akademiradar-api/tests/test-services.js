require('dotenv').config();
const express = require('express');
const app = express();
const coreAPI = require('./services/fetchCore');
const arxivAPI = require('./services/fetchArxiv');
const pubmedAPI = require('./services/fetchPubMed');
const openLibraryAPI = require('./services/fetchOpenLibrary');
const medlinePlusAPI = require('./services/fetchMedlinePlus');
const pubchemAPI = require('./services/fetchPubchem');
const pubmedCentralAPI = require('./services/fetchPubmedCentral');
const locAPI = require('./services/fetchLoc');
const z3950API = require('./services/fetchZ3950');

async function testServices() {
  console.log('🔍 Servisleri Test Ediyorum...\n');

  try {
    // OpenLibrary Test
    console.log('📚 OpenLibrary Testi:');
    const bookResults = await openLibraryAPI.searchBooks('yapay zeka');
    console.log('Kitap Arama Sonuçları:', JSON.stringify(bookResults, null, 2), '\n');

    // PubMed Test
    console.log('🏥 PubMed Testi:');
    const pubmedResults = await pubmedAPI.searchArticles('artificial intelligence in medicine');
    console.log('Makale Arama Sonuçları:', JSON.stringify(pubmedResults, null, 2), '\n');

    // arXiv Test
    console.log('📖 arXiv Testi:');
    const arxivResults = await arxivAPI.searchArticles('deep learning');
    console.log('Makale Arama Sonuçları:', JSON.stringify(arxivResults, null, 2), '\n');

    // MedlinePlus Test
    console.log('💊 MedlinePlus Testi:');
    const medlineResults = await medlinePlusAPI.searchHealth('diabetes');
    console.log('Sağlık Konusu Arama Sonuçları:', JSON.stringify(medlineResults, null, 2), '\n');

    // PubChem Test
    console.log('🧪 PubChem Testi:');
    const pubchemResults = await pubchemAPI.searchCompounds('aspirin');
    console.log('Bileşik Arama Sonuçları:', JSON.stringify(pubchemResults, null, 2), '\n');

    // PubMed Central Test
    console.log('📚 PubMed Central Testi:');
    const pmcResults = await pubmedCentralAPI.searchArticles('cancer research');
    console.log('Makale Arama Sonuçları:', JSON.stringify(pmcResults, null, 2), '\n');

    // Library of Congress Test
    console.log('📖 Library of Congress Testi:');
    const locResults = await locAPI.searchCatalog('computer science');
    console.log('Katalog Arama Sonuçları:', JSON.stringify(locResults, null, 2), '\n');

    // Z39.50 Test
    console.log('🔍 Z39.50 Testi:');
    const z3950Results = await z3950API.search('programming');
    console.log('Kütüphane Arama Sonuçları:', JSON.stringify(z3950Results, null, 2), '\n');

  } catch (error) {
    console.error('❌ Test sırasında hata:', error);
  }
}

testServices();
