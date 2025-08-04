
const express = require('express');
const cheerio = require('cheerio');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

app.use(cors()); 
app.use(express.json());

app.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith('https://www.skillrack.com')) {
    return res.status(400).json({ error: 'A valid SkillRack profile URL is required.' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch the SkillRack page. It may be down or blocking requests.');
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const getStat = (label) => {
      const statElement = $(`.statistic .label:contains('${label}')`).first();
      const valueText = statElement.siblings('.value').text().trim();
      return parseInt(valueText, 10) || 0;
    };

    const name = $('.ui.big.label.black').first().text().trim();
    
    
    if (!name || name === '') {
        return res.status(404).json({ error: 'Could not find profile data. The URL may be incorrect or the profile is private.' });
    }
    
    const department = $('.ui.large.label').first().text().trim() || 'Unknown';
    const rank = $(`.statistic .label:contains('RANK')`).siblings('.value').text().trim() || 'N/A';
    
    const certificates = parseInt($('.ui.black.big.label span').text().trim(), 10) || 0;
    const dc = getStat('DC');
    const dt = getStat('DT');
    const codeTrack = getStat('CODE TRACK');
    const bronze = getStat('BRONZE');

    const totalPoints = (dc * 2) + (dt * 20) + (codeTrack * 2);

    const profileData = {
      name,
      department,
      rank,
      certificates,
      dc,
      dt,
      codeTrack,
      bronze,
      totalPoints,
    };
    
    res.status(200).json(profileData);

  } catch (error) {
    console.error('Scraping failed:', error);
    res.status(500).json({ error: 'Failed to scrape the profile. The website structure might have changed or the service is down.' });
  }
});

module.exports = app;
