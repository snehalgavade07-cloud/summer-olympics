import { useState, useEffect } from 'react'
import './App.css'

const TOP_N = 6

const INITIAL_PLAYERS = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  name: `Player ${i + 1}`,
}))

const CATEGORIES = [
  { value: 'sports', label: 'Sports', emoji: '🏃' },
  { value: 'games', label: 'Games', emoji: '🧠' },
  { value: 'chaos', label: 'Chaos', emoji: '😂' },
]

const POSITION_OPTIONS = [
  { value: 'absent', label: 'Absent', pts: 0 },
  { value: 'participant', label: 'Participated  (+2 pts)', pts: 2 },
  { value: '3', label: '3rd Place  (+5 pts)', pts: 5 },
  { value: '2', label: '2nd Place  (+7 pts)', pts: 7 },
  { value: '1', label: '1st Place  (+10 pts)', pts: 10 },
]

const RINGS = [
  { color: '#0081C8', cx: 30, cy: 30 },
  { color: '#000000', cx: 72, cy: 30 },
  { color: '#EE334E', cx: 114, cy: 30 },
  { color: '#FCB131', cx: 51, cy: 52 },
  { color: '#00A651', cx: 93, cy: 52 },
]

function getPoints(position) {
  if (position === 1 || position === '1') return 10
  if (position === 2 || position === '2') return 7
  if (position === 3 || position === '3') return 5
  if (position === 'participant') return 2
  return 0
}

function calcLeaderboard(players, events) {
  return players
    .map(player => {
      const allPoints = events
        .map(event => {
          const result = event.results.find(r => r.playerId === player.id)
          return result ? getPoints(result.position) : 0
        })
        .filter(p => p > 0)
        .sort((a, b) => b - a)

      const topPoints = allPoints.slice(0, TOP_N)
      const total = topPoints.reduce((sum, p) => sum + p, 0)

      return { ...player, total, eventsPlayed: allPoints.length, topPoints }
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function App() {
  const [players, setPlayers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('olympics-players')) || INITIAL_PLAYERS }
    catch { return INITIAL_PLAYERS }
  })
  const [events, setEvents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('olympics-events')) || [] }
    catch { return [] }
  })
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [editingPlayerId, setEditingPlayerId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [form, setForm] = useState(() => ({
    name: '',
    date: new Date().toISOString().split('T')[0],
    category: 'sports',
    results: Object.fromEntries(INITIAL_PLAYERS.map(p => [p.id, 'absent'])),
  }))

  useEffect(() => {
    localStorage.setItem('olympics-players', JSON.stringify(players))
  }, [players])

  useEffect(() => {
    localStorage.setItem('olympics-events', JSON.stringify(events))
  }, [events])

  const leaderboard = calcLeaderboard(players, events)

  function resetForm() {
    setForm({
      name: '',
      date: new Date().toISOString().split('T')[0],
      category: 'sports',
      results: Object.fromEntries(players.map(p => [p.id, 'absent'])),
    })
  }

  function startEditPlayer(player) {
    setEditingPlayerId(player.id)
    setEditingName(player.name)
  }

  function savePlayerName(id) {
    if (editingName.trim()) {
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, name: editingName.trim() } : p))
    }
    setEditingPlayerId(null)
  }

  function handleResultChange(playerId, value) {
    setForm(prev => ({ ...prev, results: { ...prev.results, [playerId]: value } }))
  }

  function handleAddEvent(e) {
    e.preventDefault()
    if (!form.name.trim()) return

    const taken = {}
    for (const [, pos] of Object.entries(form.results)) {
      if (['1', '2', '3'].includes(pos)) {
        if (taken[pos]) {
          alert(`Two players can't both finish ${pos === '1' ? '1st' : pos === '2' ? '2nd' : '3rd'}!`)
          return
        }
        taken[pos] = true
      }
    }

    const results = Object.entries(form.results)
      .filter(([, pos]) => pos !== 'absent')
      .map(([playerId, position]) => ({
        playerId: Number(playerId),
        position: ['1', '2', '3'].includes(position) ? Number(position) : position,
      }))

    const newEvent = {
      id: Date.now(),
      name: form.name.trim(),
      date: form.date,
      category: form.category,
      results,
    }

    setEvents(prev => [...prev, newEvent])
    resetForm()
    setActiveTab('events')
    setSelectedEventId(newEvent.id)
  }

  function deleteEvent(id) {
    if (!window.confirm('Delete this event? This cannot be undone.')) return
    setEvents(prev => prev.filter(e => e.id !== id))
    if (selectedEventId === id) setSelectedEventId(null)
  }

  function getCatInfo(cat) {
    return CATEGORIES.find(c => c.value === cat) || CATEGORIES[0]
  }

  function getPlayerName(id) {
    return players.find(p => p.id === id)?.name || `Player ${id}`
  }

  // Podium order: 2nd (left), 1st (centre), 3rd (right)
  const top3 = [leaderboard[1], leaderboard[0], leaderboard[2]]
  const podiumMedals = ['🥈', '🥇', '🥉']
  const podiumRanks = [2, 1, 3]

  return (
    <div className="app">

      {/* ── HEADER ── */}
      <header className="hero">
        <svg viewBox="0 0 144 80" className="rings-svg" aria-label="Olympic rings">
          {RINGS.map((r, i) => (
            <circle key={i} cx={r.cx} cy={r.cy} r="18" fill="none" stroke={r.color} strokeWidth="4.5" />
          ))}
        </svg>
        <h1>Summer Olympics 2026</h1>
        <p className="tagline">Friends Edition 🏅</p>
        <div className="hero-chips">
          <span className="chip">📅 Apr – Sep</span>
          <span className="chip">👥 9 Players</span>
          <span className="chip">⭐ Top {TOP_N} events count</span>
          <span className="chip">🎯 2–3 events/month</span>
        </div>
      </header>

      {/* ── NAV TABS ── */}
      <nav className="tabs">
        {[
          { id: 'leaderboard', label: '🏆 Leaderboard' },
          { id: 'events', label: `🎮 Events${events.length ? ` (${events.length})` : ''}` },
          { id: 'add', label: '➕ Add Event' },
          { id: 'players', label: '👥 Players' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ══════════════════════════════════════════
          TAB: LEADERBOARD
      ══════════════════════════════════════════ */}
      {activeTab === 'leaderboard' && (
        <section className="section">
          {events.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏅</span>
              <p>No events yet — scores will appear here once you add your first event.</p>
              <button className="btn btn--primary" onClick={() => setActiveTab('add')}>
                Add First Event
              </button>
            </div>
          ) : (
            <>
              {/* Podium */}
              <div className="podium">
                {top3.map((player, idx) => {
                  if (!player) return <div key={idx} className="podium-slot" />
                  return (
                    <div key={player.id} className={`podium-slot podium-slot--${podiumRanks[idx]}`}>
                      <div className="podium-medal">{podiumMedals[idx]}</div>
                      <div className="podium-name">{player.name}</div>
                      <div className="podium-pts">{player.total} pts</div>
                      <div className={`podium-block podium-block--${podiumRanks[idx]}`}>
                        <span className="podium-num">{podiumRanks[idx]}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Full table */}
              <div className="table-wrap">
                <table className="score-table">
                  <thead>
                    <tr>
                      <th style={{ width: '3rem' }}>#</th>
                      <th>Player</th>
                      <th>Total</th>
                      <th>Events</th>
                      <th>Top Scores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((player, idx) => (
                      <tr key={player.id} className={idx < 3 ? 'row--podium' : ''}>
                        <td className="cell--rank">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td className="cell--name">{player.name}</td>
                        <td className="cell--pts">{player.total}</td>
                        <td className="cell--events">
                          {player.eventsPlayed}
                          {player.eventsPlayed > TOP_N && (
                            <span className="muted"> (best {TOP_N})</span>
                          )}
                        </td>
                        <td className="cell--scores">
                          {player.topPoints.length === 0
                            ? <span className="muted">–</span>
                            : player.topPoints.map((p, i) => (
                                <span key={i} className={`pts-badge pts-${p}`}>{p}</span>
                              ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="table-note">⭐ Only your best {TOP_N} event scores count towards your total.</p>
            </>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════
          TAB: EVENTS
      ══════════════════════════════════════════ */}
      {activeTab === 'events' && (
        <section className="section">
          <div className="section-header">
            <h2>All Events</h2>
            <button className="btn btn--primary btn--sm" onClick={() => setActiveTab('add')}>
              ➕ Add Event
            </button>
          </div>
          {events.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎮</span>
              <p>No events recorded yet. Add your first one!</p>
              <button className="btn btn--primary" onClick={() => setActiveTab('add')}>
                Add First Event
              </button>
            </div>
          ) : (
            <div className="events-list">
              {[...events].reverse().map(event => {
                const cat = getCatInfo(event.category)
                const isOpen = selectedEventId === event.id
                const sortedResults = [...event.results].sort(
                  (a, b) => getPoints(b.position) - getPoints(a.position)
                )
                return (
                  <div key={event.id} className={`event-card ${isOpen ? 'event-card--open' : ''}`}>
                    <button
                      className="event-card-header"
                      onClick={() => setSelectedEventId(isOpen ? null : event.id)}
                    >
                      <div className="event-left">
                        <span className="event-cat-emoji">{cat.emoji}</span>
                        <div>
                          <div className="event-title">{event.name}</div>
                          <div className="event-sub">
                            <span className="event-date">{formatDate(event.date)}</span>
                            <span className={`cat-badge cat-badge--${event.category}`}>{cat.label}</span>
                            <span className="event-count">{event.results.length} players</span>
                          </div>
                        </div>
                      </div>
                      <span className="chevron">{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {isOpen && (
                      <div className="event-detail">
                        <table className="results-table">
                          <thead>
                            <tr>
                              <th>Player</th>
                              <th>Result</th>
                              <th>Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedResults.map(r => (
                              <tr key={r.playerId}>
                                <td>{getPlayerName(r.playerId)}</td>
                                <td>
                                  {r.position === 1 ? '🥇 1st Place'
                                    : r.position === 2 ? '🥈 2nd Place'
                                    : r.position === 3 ? '🥉 3rd Place'
                                    : '✅ Participated'}
                                </td>
                                <td className="cell--pts">+{getPoints(r.position)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="event-detail-footer">
                          <button
                            className="btn btn--danger btn--sm"
                            onClick={() => deleteEvent(event.id)}
                          >
                            🗑 Delete Event
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════
          TAB: ADD EVENT
      ══════════════════════════════════════════ */}
      {activeTab === 'add' && (
        <section className="section">
          <h2>Add New Event</h2>
          <form className="event-form" onSubmit={handleAddEvent}>

            <div className="form-group">
              <label htmlFor="event-name">Event Name</label>
              <input
                id="event-name"
                type="text"
                placeholder="e.g. Football, Quiz Night, Card Game…"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="event-date">Date</label>
                <input
                  id="event-date"
                  type="date"
                  value={form.date}
                  onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <div className="cat-pills">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      className={`cat-pill ${form.category === cat.value ? 'cat-pill--active' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, category: cat.value }))}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Player Results</label>
              <p className="form-hint">Only 1 player per place. Leave as Absent if they didn't attend.</p>
              <div className="player-results-list">
                {players.map(player => (
                  <div key={player.id} className="player-result-row">
                    <span className="player-result-name">{player.name}</span>
                    <select
                      value={form.results[player.id] ?? 'absent'}
                      onChange={e => handleResultChange(player.id, e.target.value)}
                      className={`result-select result-select--${form.results[player.id] ?? 'absent'}`}
                    >
                      {POSITION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={resetForm}>
                Reset
              </button>
              <button type="submit" className="btn btn--primary btn--lg">
                🏅 Save Event
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ══════════════════════════════════════════
          TAB: PLAYERS
      ══════════════════════════════════════════ */}
      {activeTab === 'players' && (
        <section className="section">
          <h2>Players</h2>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>
            Click a name to rename it. Names save automatically.
          </p>
          <div className="players-grid">
            {players.map(player => {
              const lb = leaderboard.find(l => l.id === player.id)
              const rank = leaderboard.findIndex(l => l.id === player.id) + 1
              return (
                <div key={player.id} className="player-card">
                  <div className="player-rank">
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </div>
                  {editingPlayerId === player.id ? (
                    <input
                      className="player-name-input"
                      value={editingName}
                      autoFocus
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => savePlayerName(player.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') savePlayerName(player.id)
                        if (e.key === 'Escape') setEditingPlayerId(null)
                      }}
                    />
                  ) : (
                    <div className="player-name-btn" onClick={() => startEditPlayer(player)}>
                      {player.name} <span className="edit-hint">✏️</span>
                    </div>
                  )}
                  <div className="player-stats">
                    <span className="stat-val">{lb?.total ?? 0}</span>
                    <span className="stat-lbl">pts</span>
                    <span className="stat-sep">·</span>
                    <span className="stat-val">{lb?.eventsPlayed ?? 0}</span>
                    <span className="stat-lbl">events</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <footer className="footer">
        <small>🏅 Summer Olympics 2026 – Friends Edition · Built with React + Vite</small>
      </footer>
    </div>
  )
}
