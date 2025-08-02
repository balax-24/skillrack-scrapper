const express = require('express');
const cheerio = require('cheerio');
const cors = require('cors');
const fetch = require('node-fetch'); // Make sure to use a version of node-fetch compatible with CommonJS if needed, or use an alternative like axios

const app = express();

// Use CORS to allow your app to make requests to this function
app.use(cors({ origin: true }));
app.use(express.json()); // To parse JSON request bodies

// This is the main endpoint the app will call
app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith('https://www.skillrack.com')) {
    return res.status(400).json({ error: 'A valid SkillRack profile URL is required.' });
  }

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Helper function to extract a statistic value by its label
    const getStat = (label) => {
      const statElement = $(`.statistic .label:contains('${label}')`).first();
      const valueText = statElement.siblings('.value').text().trim();
      return parseInt(valueText, 10) || 0;
    };

    // Scrape all the required data
    const name = $('.ui.big.label.black').first().text().trim() || 'Unknown';
    const department = $('.ui.large.label').first().text().trim() || 'Unknown';
    const rank = $(`.statistic .label:contains('RANK')`).siblings('.value').text().trim() || 'N/A';
    
    const certificates = parseInt($('.ui.black.big.label span').text().trim(), 10) || 0;
    const dc = getStat('DC');
    const dt = getStat('DT');
    const codeTrack = getStat('CODE TRACK');
    const bronze = getStat('BRONZE');

    const totalPoints = (dc * 2) + (dt * 20) + (codeTrack * 2);

    // Construct the profile object to send back to the app
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
    
    // Send the successful response
    res.status(200).json(profileData);

  } catch (error) {
    console.error('Scraping failed:', error);
    res.status(500).json({ error: 'Failed to scrape the profile. The website structure might have changed.' });
  }
});

// This makes the function ready for deployment on services like Vercel or Firebase
// For Vercel, you would export the app: `module.exports = app;`
// For Firebase Cloud Functions, you would wrap it: 
// const functions = require('firebase-functions');
// exports.scraper = functions.https.onRequest(app);

// To run locally for testing:
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Scraper function listening on port ${PORT}`);
});