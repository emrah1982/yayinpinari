require('dotenv').config();
const express = require('express');
const app = express();
const openLibraryAPI = require('../services/fetchOpenLibrary');
const pubmedAPI = require('../services/fetchPubMed');
const medlinePlusAPI = require('../services/fetchMedlinePlus');
const pubchemAPI = require('../services/fetchPubchem');
const locAPI = require('../services/fetchLoc');

async function testBasicServices() {
  console.log('🔍 Temel Servisleri Test Ediyorum...\n');

  try {
    // OpenLibrary Test
    console.log('📚 OpenLibrary Testi:');
    console.log('Arama: "yapay zeka" için kitap aranıyor...');
    const bookResults = await openLibraryAPI.searchBooks('yapay zeka');
    console.log(`Bulunan Kitap Sayısı: ${bookResults.total || 0}`);
    if (bookResults.results && bookResults.results.length > 0) {
      console.log('İlk Kitap:', bookResults.results[0].title);
    }
    console.log('----------------------------------------\n');

    // PubMed Test
    console.log('🏥 PubMed Testi:');
    console.log('Arama: "artificial intelligence in medicine" için makale aranıyor...');
    const pubmedResults = await pubmedAPI.searchArticles('artificial intelligence in medicine');
    if (pubmedResults && pubmedResults.length > 0) {
      console.log(`Bulunan Makale Sayısı: ${pubmedResults.length}`);
      console.log('İlk Makale:', pubmedResults[0].title);
    }
    console.log('----------------------------------------\n');

    // MedlinePlus Test
    console.log('💊 MedlinePlus Testi:');
    console.log('Arama: "diabetes" için sağlık bilgisi aranıyor...');
    const medlineResults = await medlinePlusAPI.searchHealth('diabetes');
    if (medlineResults.results && medlineResults.results.length > 0) {
      console.log(`Bulunan Sonuç Sayısı: ${medlineResults.total || 0}`);
      console.log('İlk Sonuç:', medlineResults.results[0].title);
    }
    console.log('----------------------------------------\n');

    // PubChem Test
    console.log('🧪 PubChem Testi:');
    console.log('Arama: "aspirin" için kimyasal bileşik aranıyor...');
    const pubchemResults = await pubchemAPI.searchCompounds('aspirin');
    if (pubchemResults.results && pubchemResults.results.length > 0) {
      console.log(`Bulunan Bileşik Sayısı: ${pubchemResults.total || 0}`);
      console.log('İlk Bileşik:', pubchemResults.results[0].iupacName);
    }
    console.log('----------------------------------------\n');

    // Library of Congress Test
    console.log('📖 Library of Congress Testi:');
    console.log('Arama: "computer science" için katalog taranıyor...');
    const locResults = await locAPI.searchCatalog('computer science');
    if (locResults.results && locResults.results.length > 0) {
      console.log(`Bulunan Kayıt Sayısı: ${locResults.total || 0}`);
      console.log('İlk Kayıt:', locResults.results[0].title);
    }
    console.log('----------------------------------------\n');

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

testBasicServices();
