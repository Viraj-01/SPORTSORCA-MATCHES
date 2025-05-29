const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  const { date } = req.query;
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const queryDate = date && date.match(/^\d{4}-\d{2}-\d{2}$/) ? date : today;

  // Validate that the query date is not in the past
  if (new Date(queryDate) < new Date(today)) {
    return res.status(400).json({ error: 'Selected date cannot be in the past' });
  }

  try {
    const baseURL = 'https://v3.football.api-sports.io/fixtures';
    const url = `${baseURL}?date=${queryDate}`;

    const response = await axios.get(url, {
      headers: {
        'x-apisports-key': process.env.API_FOOTBALL_KEY,
      },
    });

    const matches = response.data.response
      .filter(match => {
        const matchDateTime = new Date(match.fixture.date);
        return matchDateTime >= now; // Only include upcoming matches
      })
      .map(match => ({
        fixture_id: match.fixture.id,
        referee: match.fixture.referee,
        timezone: match.fixture.timezone,
        date: match.fixture.date,
        venue: match.fixture.venue.name,
        city: match.fixture.venue.city,
        status: match.fixture.status,
        league: {
          id: match.league.id,
          name: match.league.name,
          country: match.league.country,
          season: match.league.season,
          round: match.league.round,
        },
        teams: {
          home: {
            id: match.teams.home.id,
            name: match.teams.home.name,
            logo: match.teams.home.logo,
            winner: match.teams.home.winner,
          },
          away: {
            id: match.teams.away.id,
            name: match.teams.away.name,
            logo: match.teams.away.logo,
            winner: match.teams.away.winner,
          },
        },
        goals: match.goals,
        score: match.score,
      }));

    // Sort matches by date
    matches.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(matches);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching match data' });
  }
});

module.exports = router;