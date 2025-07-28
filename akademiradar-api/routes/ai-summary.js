const express = require('express');
const router = express.Router();
const gptService = require('../services/summarizeWithGPT');

router.post('/summarize', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const summary = await gptService.summarizeText(text);
    res.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ error: 'An error occurred during summarization' });
  }
});

router.post('/insights', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const insights = await gptService.generateKeyInsights(text);
    res.json({ insights });
  } catch (error) {
    console.error('Key insights error:', error);
    res.status(500).json({ error: 'An error occurred while generating insights' });
  }
});

module.exports = router;
