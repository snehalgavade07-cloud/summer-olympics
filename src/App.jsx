import { useState, useEffect, useRef } from 'react'
import './App.css'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TOP_N = 6
const DEFAULT_PIN = '2026'

const PLAYER_EMOJIS = ['😎','🔥','⚡','🌟','💪','🎯','🏆','🦁','🐉']

const INITIAL_PLAYERS = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  name: `Player ${i + 1}`,
  photo: null,
  nickname: '',
  facts: [],
  emoji: PLAYER_EMOJIS[i],
}))

const CATEGORIES = [
  { value: 'sports', label: 'Sports', emoji: '🏃' },
  { value: 'games',  label: 'Games',  emoji: '🧠' },
  { value: 'chaos',  label: 'Chaos',  emoji: '😂' },
]

const POSITION_OPTIONS = [
  { value: 'absent',      label: 'Absent' },
  { value: 'participant', label: 'Participated  (+2 pts)' },
  { value: '3',           label: '3rd Place  (+5 pts)' },
  { value: '2',           label: '2nd Place  (+7 pts)' },
  { value: '1',           label: '1st Place  (+10 pts)' },
]

const RINGS = [
  { color: '#0081C8', cx: 30, cy: 30 },
  { color: '#b0b8c8', cx: 72, cy: 30 },
  { color: '#EE334E', cx: 114, cy: 30 },
  { color: '#FCB131', cx: 51, cy: 52 },
  { color: '#00A651', cx: 93, cy: 52 },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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
      const breakdown = events
        .map(ev => {
          const r = ev.results.find(r => r.playerId === player.id)
          if (!r) return null
          const pts = getPoints(r.position)
          if (!pts) return null
          return { eventId: ev.id, eventName: ev.name, eventDate: ev.date, position: r.position, pts }
        })
        .filter(Boolean)
        .sort((a, b) => b.pts - a.pts)

      const topBreakdown = breakdown.slice(0, TOP_N)
      const total = topBreakdown.reduce((s, g) => s + g.pts, 0)
      return { ...player, total, eventsPlayed: breakdown.length, topBreakdown, allBreakdown: breakdown }
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

function posLabel(pos) {
  if (pos === 1) return '🥇 1st'
  if (pos === 2) return '🥈 2nd'
  if (pos === 3) return '🥉 3rd'
  return '✅ Participated'
}

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {

  // ── State ────────────────────────────────────────────────────────────────
  const [screen, setScreen]         = useState('landing') // 'landing' | 'app'
  const [isAdmin, setIsAdmin]       = useState(false)
  const [adminPin, setAdminPin]     = useState(() => localStorage.getItem('olympics-pin') || DEFAULT_PIN)
  const [showPin, setShowPin]       = useState(false)
  const [pinInput, setPinInput]     = useState('')
  const [pinError, setPinError]     = useState(false)
  const [changingPin, setChangingPin] = useState(false)
  const [newPin, setNewPin]         = useState('')

  const [players, setPlayers] = useState(() => load('olympics-players', INITIAL_PLAYERS))
  const [events,  setEvents]  = useState(() => load('olympics-events',  []))

  const [activeTab,       setActiveTab]       = useState('leaderboard')
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [drillId,         setDrillId]         = useState(null)   // leaderboard drill-down
  const [profileId,       setProfileId]       = useState(null)   // player profile modal
  const [editingPlayerId, setEditingPlayerId] = useState(null)
  const [newFact,         setNewFact]         = useState('')
  const [editNick,        setEditNick]        = useState('')
  const photoInputRef = useRef()

  const [form, setForm] = useState(() => ({
    name: '',
    date: new Date().toISOString().split('T')[0],
    category: 'sports',
    isTeamEvent: false,
    results: Object.fromEntries(INITIAL_PLAYERS.map(p => [p.id, 'absent'])),
  }))

  // ── Persistence ──────────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('olympics-players', JSON.stringify(players)) }, [players])
  useEffect(() => { localStorage.setItem('olympics-events',  JSON.stringify(events))  }, [events])

  const leaderboard = calcLeaderboard(players, events)

  // ── Admin ─────────────────────────────────────────────────────────────────
  function handlePinSubmit(e) {
    e.preventDefault()
    if (pinInput === adminPin) {
      setIsAdmin(true); setShowPin(false); setPinInput(''); setPinError(false)
    } else {
      setPinError(true); setPinInput('')
    }
  }

  function handleChangePin(e) {
    e.preventDefault()
    if (newPin.length < 4) return
    localStorage.setItem('olympics-pin', newPin)
    setAdminPin(newPin); setNewPin(''); setChangingPin(false)
  }

  // ── Players ───────────────────────────────────────────────────────────────
  function updatePlayer(id, changes) {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p))
  }

  function openProfile(player) {
    setProfileId(player.id)
    setEditNick(player.nickname || '')
    setNewFact('')
  }

  function handlePhotoUpload(playerId, e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => updatePlayer(playerId, { photo: ev.target.result })
    reader.readAsDataURL(file)
  }

  // ── Events ────────────────────────────────────────────────────────────────
  function resetForm() {
    setForm({
      name: '', date: new Date().toISOString().split('T')[0],
      category: 'sports', isTeamEvent: false,
      results: Object.fromEntries(players.map(p => [p.id, 'absent'])),
    })
  }

  function handleAddEvent(e) {
    e.preventDefault()
    if (!form.name.trim()) return

    if (!form.isTeamEvent) {
      const taken = {}
      for (const [, pos] of Object.entries(form.results)) {
        if (['1','2','3'].includes(pos)) {
          if (taken[pos]) {
            alert(`Two players can't share ${pos === '1' ? '1st' : pos === '2' ? '2nd' : '3rd'} in a solo event. Enable "Team Event" for group games.`)
            return
          }
          taken[pos] = true
        }
      }
    }

    const results = Object.entries(form.results)
      .filter(([, pos]) => pos !== 'absent')
      .map(([pid, pos]) => ({
        playerId: Number(pid),
        position: ['1','2','3'].includes(pos) ? Number(pos) : pos,
      }))

    const ev = {
      id: Date.now(), name: form.name.trim(),
      date: form.date, category: form.category,
      isTeamEvent: form.isTeamEvent, results,
    }
    setEvents(prev => [...prev, ev])
    resetForm()
    setActiveTab('events')
    setSelectedEventId(ev.id)
  }

  function deleteEvent(id) {
    if (!window.confirm('Delete this event?')) return
    setEvents(prev => prev.filter(e => e.id !== id))
    if (selectedEventId === id) setSelectedEventId(null)
  }

  // ── Share ─────────────────────────────────────────────────────────────────
  function shareWhatsApp() {
    const lines = ['🏅 *Summer Olympics 2026 – Friends Edition*', '━━━━━━━━━━━━━━━━━━━━━━']
    leaderboard.forEach((p, i) => {
      const m = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`
      lines.push(`${m} ${p.name}  –  *${p.total} pts*  (${p.eventsPlayed} events)`)
    })
    lines.push('━━━━━━━━━━━━━━━━━━━━━━')
    lines.push(`📊 ${events.length} events played  ·  ⭐ Best ${TOP_N} count`)
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank')
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCat    = cat => CATEGORIES.find(c => c.value === cat) || CATEGORIES[0]
  const getPlayer = id  => players.find(p => p.id === id)
  const getName   = id  => getPlayer(id)?.name || `Player ${id}`

  const drillPlayer   = drillId   ? leaderboard.find(p => p.id === drillId)   : null
  const profilePlayer = profileId ? players.find(p => p.id === profileId)     : null
  const profileLb     = profileId ? leaderboard.find(p => p.id === profileId) : null
  const profileRank   = profileId ? leaderboard.findIndex(p => p.id === profileId) + 1 : 0

  const podium       = [leaderboard[1], leaderboard[0], leaderboard[2]]
  const podiumMedals = ['🥈','🥇','🥉']
  const podiumRanks  = [2, 1, 3]

  // ══════════════════════════════════════════════════════════════════════════
  // LANDING PAGE
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === 'landing') {
    return (
      <div className="landing" onClick={() => setScreen('app')}>
        <div className="landing-bg" />
        <div className="landing-content">
          <svg viewBox="0 0 144 80" className="landing-rings">
            {RINGS.map((r, i) => (
              <circle key={i} cx={r.cx} cy={r.cy} r="18"
                fill="none" stroke={r.color} strokeWidth="4"
                className="ring-circle" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </svg>
          <h1 className="landing-title">Summer Olympics 2026</h1>
          <p className="landing-sub">Friends Edition</p>
          <div className="landing-enter">Tap anywhere to enter 🏅</div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN APP
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="app">

      {/* ── PIN MODAL ── */}
      {showPin && (
        <div className="overlay" onClick={() => { setShowPin(false); setPinInput(''); setPinError(false) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">🔐 Admin Login</h3>
            <p className="modal-sub">Enter your PIN to unlock editing</p>
            <form onSubmit={handlePinSubmit}>
              <input type="password" className="pin-input" placeholder="PIN"
                value={pinInput} autoFocus maxLength={8}
                onChange={e => { setPinInput(e.target.value); setPinError(false) }} />
              {pinError && <p className="pin-error">Wrong PIN — try again</p>}
              <button type="submit" className="btn btn--primary btn--full mt-1">Unlock</button>
            </form>
          </div>
        </div>
      )}

      {/* ── LEADERBOARD DRILL-DOWN MODAL ── */}
      {drillPlayer && (
        <div className="overlay" onClick={() => setDrillId(null)}>
          <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setDrillId(null)}>✕</button>
            <div className="drill-header">
              <div className="drill-avatar">
                {drillPlayer.photo
                  ? <img src={drillPlayer.photo} alt={drillPlayer.name} />
                  : <span>{drillPlayer.emoji}</span>}
              </div>
              <div>
                <h3>{drillPlayer.name}</h3>
                {drillPlayer.nickname && <p className="drill-nick">"{drillPlayer.nickname}"</p>}
                <p className="drill-meta">
                  {(() => { const r = leaderboard.findIndex(p => p.id === drillId)+1; return r===1?'🥇':r===2?'🥈':r===3?'🥉':`#${r}` })()}
                  &nbsp;·&nbsp;{drillPlayer.total} pts total
                  &nbsp;·&nbsp;{drillPlayer.eventsPlayed} events
                </p>
              </div>
            </div>
            <h4 className="drill-section-title">Score Breakdown</h4>
            {drillPlayer.allBreakdown.length === 0
              ? <p className="muted center">No events played yet.</p>
              : (
                <div className="table-wrap">
                  <table className="results-table">
                    <thead><tr><th>Event</th><th>Date</th><th>Result</th><th>Pts</th><th></th></tr></thead>
                    <tbody>
                      {drillPlayer.allBreakdown.map((g, i) => (
                        <tr key={g.eventId} className={i >= TOP_N ? 'row--dim' : ''}>
                          <td>{g.eventName}</td>
                          <td className="muted">{formatDate(g.eventDate)}</td>
                          <td>{posLabel(g.position)}</td>
                          <td className="cell--pts">+{g.pts}</td>
                          <td>{i < TOP_N ? <span className="star-badge">⭐</span> : <span className="not-counted">excluded</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            <p className="drill-note">⭐ counts · Best {TOP_N} events are used for total</p>
          </div>
        </div>
      )}

      {/* ── PLAYER PROFILE MODAL ── */}
      {profilePlayer && (
        <div className="overlay" onClick={() => setProfileId(null)}>
          <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setProfileId(null)}>✕</button>

            {/* Avatar */}
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">
                {profilePlayer.photo
                  ? <img src={profilePlayer.photo} alt={profilePlayer.name} />
                  : <span>{profilePlayer.emoji}</span>}
              </div>
              {isAdmin && (
                <>
                  <button className="btn btn--ghost btn--sm"
                    onClick={() => photoInputRef.current?.click()}>
                    {profilePlayer.photo ? '📷 Change' : '📷 Add Photo'}
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => handlePhotoUpload(profilePlayer.id, e)} />
                </>
              )}
            </div>

            {/* Name + nickname */}
            <div className="profile-name-block">
              <h3 className="profile-name">{profilePlayer.name}</h3>
              {isAdmin ? (
                <input className="input-inline" placeholder="Add nickname…"
                  value={editNick}
                  onChange={e => setEditNick(e.target.value)}
                  onBlur={() => updatePlayer(profilePlayer.id, { nickname: editNick.trim() })} />
              ) : profilePlayer.nickname ? (
                <p className="profile-nick">"{profilePlayer.nickname}"</p>
              ) : null}
            </div>

            {/* Stats */}
            <div className="profile-stats">
              {[
                { val: profileRank === 1 ? '🥇' : profileRank === 2 ? '🥈' : profileRank === 3 ? '🥉' : `#${profileRank}`, lbl: 'Rank' },
                { val: profileLb?.total ?? 0, lbl: 'Points', gold: true },
                { val: profileLb?.eventsPlayed ?? 0, lbl: 'Events' },
              ].map(s => (
                <div key={s.lbl} className="profile-stat">
                  <span className={`profile-stat-val ${s.gold ? 'gold' : ''}`}>{s.val}</span>
                  <span className="profile-stat-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>

            {/* Fun facts */}
            <div className="profile-facts">
              <h4>⚡ Fun Facts</h4>
              {(profilePlayer.facts || []).length === 0 && !isAdmin && (
                <p className="muted">Nothing added yet.</p>
              )}
              <ul className="facts-list">
                {(profilePlayer.facts || []).map((fact, i) => (
                  <li key={i} className="fact-item">
                    <span>🎯 {fact}</span>
                    {isAdmin && (
                      <button className="fact-del"
                        onClick={() => updatePlayer(profilePlayer.id, {
                          facts: profilePlayer.facts.filter((_, j) => j !== i)
                        })}>✕</button>
                    )}
                  </li>
                ))}
              </ul>
              {isAdmin && (
                <div className="fact-add">
                  <input className="input" placeholder="Add a fun fact and press Enter…"
                    value={newFact}
                    onChange={e => setNewFact(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newFact.trim()) {
                        updatePlayer(profilePlayer.id, { facts: [...(profilePlayer.facts||[]), newFact.trim()] })
                        setNewFact('')
                      }
                    }} />
                  <button className="btn btn--primary btn--sm"
                    onClick={() => {
                      if (newFact.trim()) {
                        updatePlayer(profilePlayer.id, { facts: [...(profilePlayer.facts||[]), newFact.trim()] })
                        setNewFact('')
                      }
                    }}>Add</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════════ */}
      <header className="hero">
        <svg viewBox="0 0 144 80" className="rings-svg">
          {RINGS.map((r, i) => (
            <circle key={i} cx={r.cx} cy={r.cy} r="18" fill="none" stroke={r.color} strokeWidth="4" />
          ))}
        </svg>
        <h1>Summer Olympics 2026</h1>
        <p className="tagline">Friends Edition 🏅</p>
        <div className="hero-chips">
          <span className="chip">📅 Apr – Sep</span>
          <span className="chip">👥 9 Players</span>
          <span className="chip">⭐ Top {TOP_N} count</span>
        </div>
        <div className="admin-row">
          {isAdmin ? (
            <div className="admin-active">
              <span className="admin-badge">🔓 Admin</span>
              {changingPin ? (
                <form className="change-pin-form" onSubmit={handleChangePin}>
                  <input className="pin-mini" type="password" placeholder="New PIN (min 4)"
                    value={newPin} minLength={4} maxLength={8} required autoFocus
                    onChange={e => setNewPin(e.target.value)} />
                  <button type="submit" className="btn btn--primary btn--xs">Save</button>
                  <button type="button" className="btn btn--ghost btn--xs" onClick={() => setChangingPin(false)}>Cancel</button>
                </form>
              ) : (
                <button className="btn btn--ghost btn--xs" onClick={() => setChangingPin(true)}>Change PIN</button>
              )}
              <button className="btn btn--ghost btn--xs" onClick={() => setIsAdmin(false)}>Lock</button>
            </div>
          ) : (
            <button className="admin-lock-btn" onClick={() => setShowPin(true)}>🔒 View Only — tap to edit</button>
          )}
        </div>
      </header>

      {/* ── TABS ── */}
      <nav className="tabs">
        {[
          { id: 'leaderboard', label: '🏆 Standings' },
          { id: 'events',      label: `🎮 Events${events.length ? ` (${events.length})` : ''}` },
          ...(isAdmin ? [{ id: 'add', label: '➕ Add Event' }] : []),
          { id: 'players',     label: '👥 Players' },
        ].map(t => (
          <button key={t.id}
            className={`tab ${activeTab === t.id ? 'tab--active' : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* ══════════════════════════════════════════════════════════════════
          STANDINGS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'leaderboard' && (
        <section className="section">
          <div className="section-hd">
            <h2>Standings</h2>
            <button className="btn btn--wa btn--sm" onClick={shareWhatsApp}>📤 Share</button>
          </div>

          {events.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏅</span>
              <p>No events yet. Scores will appear once you add the first event.</p>
              {isAdmin && <button className="btn btn--primary" onClick={() => setActiveTab('add')}>Add First Event</button>}
            </div>
          ) : (<>
            {/* Podium */}
            <div className="podium">
              {podium.map((player, idx) => {
                if (!player) return <div key={idx} className="podium-slot" />
                return (
                  <div key={player.id}
                    className={`podium-slot podium-slot--${podiumRanks[idx]}`}
                    onClick={() => setDrillId(player.id)}>
                    <div className="podium-avatar">
                      {player.photo
                        ? <img src={player.photo} alt={player.name} />
                        : <span>{player.emoji}</span>}
                    </div>
                    <div className="podium-medal">{podiumMedals[idx]}</div>
                    <div className="podium-name">{player.name}</div>
                    <div className="podium-pts">{player.total} pts</div>
                    <div className={`podium-block podium-block--${podiumRanks[idx]}`}>
                      <span>{podiumRanks[idx]}</span>
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
                    <th>#</th><th>Player</th><th>Total</th><th>Events</th><th>Top Scores</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((p, i) => (
                    <tr key={p.id}
                      className={`row--click ${i < 3 ? 'row--podium' : ''}`}
                      onClick={() => setDrillId(p.id)}>
                      <td className="cell--rank">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="cell--name">
                        <div className="tbl-player">
                          <div className="tbl-avatar">
                            {p.photo ? <img src={p.photo} alt="" /> : <span>{p.emoji}</span>}
                          </div>
                          {p.name}
                        </div>
                      </td>
                      <td className="cell--pts">{p.total}</td>
                      <td className="cell--dim">{p.eventsPlayed}</td>
                      <td className="cell--scores">
                        {p.topBreakdown.length === 0
                          ? <span className="muted">–</span>
                          : p.topBreakdown.map((g, j) => (
                              <span key={j} className={`pts-badge pts-${g.pts}`}>{g.pts}</span>
                            ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="tbl-note">⭐ Best {TOP_N} scores count · Click a player for full breakdown</p>
          </>)}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          EVENTS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'events' && (
        <section className="section">
          <div className="section-hd">
            <h2>Events</h2>
            {isAdmin && (
              <button className="btn btn--primary btn--sm" onClick={() => setActiveTab('add')}>➕ Add</button>
            )}
          </div>
          {events.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎮</span>
              <p>No events recorded yet.</p>
              {isAdmin && <button className="btn btn--primary" onClick={() => setActiveTab('add')}>Add First Event</button>}
            </div>
          ) : (
            <div className="events-list">
              {[...events].reverse().map(ev => {
                const cat    = getCat(ev.category)
                const isOpen = selectedEventId === ev.id
                const sorted = [...ev.results].sort((a, b) => getPoints(b.position) - getPoints(a.position))
                return (
                  <div key={ev.id} className={`event-card ${isOpen ? 'event-card--open' : ''}`}>
                    <button className="event-hd" onClick={() => setSelectedEventId(isOpen ? null : ev.id)}>
                      <div className="event-left">
                        <span className="event-emoji">{cat.emoji}</span>
                        <div>
                          <div className="event-title">
                            {ev.name}
                            {ev.isTeamEvent && <span className="team-tag">👥 Team</span>}
                          </div>
                          <div className="event-meta">
                            <span className="event-date">{formatDate(ev.date)}</span>
                            <span className={`cat-tag cat-tag--${ev.category}`}>{cat.label}</span>
                            <span className="event-count">{ev.results.length} players</span>
                          </div>
                        </div>
                      </div>
                      <span className="chevron">{isOpen ? '▲' : '▼'}</span>
                    </button>
                    {isOpen && (
                      <div className="event-body">
                        <table className="results-table">
                          <thead><tr><th>Player</th><th>Result</th><th>Points</th></tr></thead>
                          <tbody>
                            {sorted.map(r => (
                              <tr key={r.playerId}>
                                <td>
                                  <div className="tbl-player">
                                    <div className="tbl-avatar sm">
                                      {getPlayer(r.playerId)?.photo
                                        ? <img src={getPlayer(r.playerId).photo} alt="" />
                                        : <span>{getPlayer(r.playerId)?.emoji || '👤'}</span>}
                                    </div>
                                    {getName(r.playerId)}
                                  </div>
                                </td>
                                <td>{posLabel(r.position)}</td>
                                <td className="cell--pts">+{getPoints(r.position)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {isAdmin && (
                          <div className="event-footer">
                            <button className="btn btn--danger btn--sm" onClick={() => deleteEvent(ev.id)}>
                              🗑 Delete Event
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ADD EVENT (admin only)
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'add' && isAdmin && (
        <section className="section">
          <h2>Add New Event</h2>
          <form className="event-form" onSubmit={handleAddEvent}>

            <div className="fg">
              <label htmlFor="ev-name">Event Name</label>
              <input id="ev-name" type="text" className="input"
                placeholder="e.g. Football, Quiz Night, Cards…"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>

            <div className="form-row">
              <div className="fg">
                <label>Date</label>
                <input type="date" className="input" value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="fg">
                <label>Category</label>
                <div className="cat-pills">
                  {CATEGORIES.map(c => (
                    <button key={c.value} type="button"
                      className={`cat-pill ${form.category === c.value ? 'cat-pill--on' : ''}`}
                      onClick={() => setForm(p => ({ ...p, category: c.value }))}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Team toggle */}
            <div className="fg">
              <div className="toggle-row" onClick={() => setForm(p => ({ ...p, isTeamEvent: !p.isTeamEvent }))}>
                <div className={`toggle ${form.isTeamEvent ? 'toggle--on' : ''}`}>
                  <div className="toggle-thumb" />
                </div>
                <div>
                  <span className="toggle-label">Team / Group Event</span>
                  <span className="toggle-hint">
                    {form.isTeamEvent ? 'Multiple players can share a position' : 'One player per position'}
                  </span>
                </div>
              </div>
            </div>

            {/* Player results */}
            <div className="fg">
              <label>Player Results</label>
              <p className="form-hint">
                {form.isTeamEvent
                  ? 'Assign positions to whole teams — multiple players can share a place.'
                  : 'Only 1 player per podium place. Leave absent if they didn\'t attend.'}
              </p>
              <div className="player-results">
                {players.map(p => (
                  <div key={p.id} className="pr-row">
                    <div className="pr-info">
                      <div className="pr-avatar">
                        {p.photo ? <img src={p.photo} alt="" /> : <span>{p.emoji}</span>}
                      </div>
                      <span className="pr-name">{p.name}</span>
                    </div>
                    <select
                      value={form.results[p.id] ?? 'absent'}
                      onChange={e => setForm(prev => ({ ...prev, results: { ...prev.results, [p.id]: e.target.value } }))}
                      className={`result-sel result-sel--${form.results[p.id] ?? 'absent'}`}>
                      {POSITION_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={resetForm}>Reset</button>
              <button type="submit" className="btn btn--primary btn--lg">🏅 Save Event</button>
            </div>
          </form>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PLAYERS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'players' && (
        <section className="section">
          <h2>Players</h2>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>
            Click a card to view profile.{isAdmin ? ' Click the name to rename.' : ''}
          </p>
          <div className="players-grid">
            {players.map(player => {
              const lb   = leaderboard.find(l => l.id === player.id)
              const rank = leaderboard.findIndex(l => l.id === player.id) + 1
              return (
                <div key={player.id} className="player-card" onClick={() => openProfile(player)}>
                  <div className="pc-photo-wrap">
                    {player.photo
                      ? <img src={player.photo} alt={player.name} className="pc-photo" />
                      : <div className="pc-emoji">{player.emoji}</div>}
                  </div>
                  <div className="pc-rank">
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </div>
                  <div className="pc-name"
                    onClick={e => {
                      if (!isAdmin) return
                      e.stopPropagation()
                      setEditingPlayerId(player.id)
                    }}>
                    {editingPlayerId === player.id ? (
                      <input className="player-name-input"
                        defaultValue={player.name} autoFocus
                        onClick={e => e.stopPropagation()}
                        onBlur={e => {
                          if (e.target.value.trim()) updatePlayer(player.id, { name: e.target.value.trim() })
                          setEditingPlayerId(null)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') e.target.blur()
                          if (e.key === 'Escape') setEditingPlayerId(null)
                        }} />
                    ) : (
                      <span>{player.name}{isAdmin ? ' ✏️' : ''}</span>
                    )}
                  </div>
                  {player.nickname && <div className="pc-nick">"{player.nickname}"</div>}
                  <div className="pc-stats">
                    <span className="gold fw">{lb?.total ?? 0}</span> <span className="muted">pts</span>
                    <span className="muted"> · </span>
                    <span className="fw">{lb?.eventsPlayed ?? 0}</span> <span className="muted">events</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <footer className="footer">
        <small>🏅 Summer Olympics 2026 – Friends Edition</small>
      </footer>
    </div>
  )
}
