import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import './MatchesTable.css';

const MatchesTable = () => {
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [teams, setTeams] = useState([]);

  // Initialize today in IST
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset() + 330); // Adjust for IST (UTC+5:30)
  const todayString = today.toISOString().split('T')[0]; // e.g., 2025-05-30

  const [filters, setFilters] = useState({
    league: '',
    team: '',
    date: todayString, // Default to today in YYYY-MM-DD format
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Log initial date for debugging
  console.log('Initial filters.date:', filters.date);

  // Fetch matches from the backend based on date
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        console.log('Fetching matches for date:', filters.date);
        const response = await axios.get(`http://localhost:5000/api/matches?date=${filters.date}`);
        const matchesData = response.data;

        // Extract unique leagues and teams for filters
        const uniqueLeagues = [...new Set(matchesData.map(match => match.league.name))].map(name => ({
          value: name,
          label: name,
        }));
        const uniqueTeams = [
          ...new Set(matchesData.flatMap(match => [match.teams.home.name, match.teams.away.name])),
        ].map(name => ({ value: name, label: name }));

        setMatches(matchesData);
        setFilteredMatches(matchesData);
        setLeagues(uniqueLeagues);
        setTeams(uniqueTeams);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load matches');
        setLoading(false);
      }
    };

    fetchMatches();
  }, [filters.date]);

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters
  useEffect(() => {
    let filtered = matches;

    if (filters.league) {
      filtered = filtered.filter(match => match.league.name === filters.league);
    }

    if (filters.team) {
      filtered = filtered.filter(
        match => match.teams.home.name === filters.team || match.teams.away.name === filters.team
      );
    }

    setFilteredMatches(filtered);
  }, [filters.league, filters.team, matches]);

  // Format date and time in IST
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const dateOptions = {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
    const timeOptions = {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return {
      date: date.toLocaleDateString('en-IN', dateOptions).split('/').join('/'), // e.g., 30/05/2025
      time: date.toLocaleTimeString('en-IN', timeOptions).toLowerCase(), // e.g., 03:30 am
    };
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      <h1>Upcoming Football Matches</h1>

      {/* Filters */}
      <div className="filters">
        <Select
          name="league"
          options={[{ value: '', label: 'All Leagues' }, ...leagues]}
          value={leagues.find(option => option.value === filters.league) || { value: '', label: 'All Leagues' }}
          onChange={option => handleFilterChange('league', option.value)}
          placeholder="Select or type a league..."
          isSearchable
          className="filter-select"
        />

        <Select
          name="team"
          options={[{ value: '', label: 'All Teams' }, ...teams]}
          value={teams.find(option => option.value === filters.team) || { value: '', label: 'All Teams' }}
          onChange={option => handleFilterChange('team', option.value)}
          placeholder="Select or type a team..."
          isSearchable
          className="filter-select"
        />

        <input
          type="date"
          name="date"
          value={filters.date}
          onChange={e => handleFilterChange('date', e.target.value)}
          min={todayString}
        />

        <button
          onClick={() => setFilters({ league: '', team: '', date: todayString })}
          style={{ padding: '8px', backgroundColor: '#e3342f', color: '#fff', borderRadius: '4px' }}
        >
          Reset Filters
        </button>
      </div>

      {/* Matches Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>League</th>
              <th>Season</th>
              <th>Round</th>
              <th>Home Team</th>
              <th>Away Team</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.map((match, index) => {
              const { date, time } = formatDateTime(match.date);
              return (
                <tr key={match.fixture_id}>
                  <td>{index + 1}</td>
                  <td>{match.league.name}</td>
                  <td>{match.league.season}</td>
                  <td>{match.league.round}</td>
                  <td className="team-cell">
                    <img src={match.teams.home.logo} alt={match.teams.home.name} className="team-logo" />
                    <span>{match.teams.home.name}</span>
                  </td>
                  <td className="team-cell">
                    <img src={match.teams.away.logo} alt={match.teams.away.name} className="team-logo" />
                    <span>{match.teams.away.name}</span>
                  </td>
                  <td>{date}</td>
                  <td>{time}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchesTable;