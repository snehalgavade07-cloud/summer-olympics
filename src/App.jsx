import { useState } from 'react'
import './App.css'

const RINGS = [
  { color: '#0081C8', x: 0, y: 0, label: 'Europe' },
  { color: '#000000', x: 70, y: 0, label: 'Africa' },
  { color: '#EE334E', x: 140, y: 0, label: 'Americas' },
  { color: '#FCB131', x: 35, y: 35, label: 'Asia' },
  { color: '#00A651', x: 105, y: 35, label: 'Oceania' },
]

const UPCOMING = [
  { year: 2028, city: 'Los Angeles', country: 'USA' },
  { year: 2032, city: 'Brisbane', country: 'Australia' },
  { year: 2036, city: 'TBD', country: 'TBD' },
]

const SPORTS = [
  'Athletics', 'Swimming', 'Gymnastics', 'Cycling',
  'Basketball', 'Football', 'Tennis', 'Volleyball',
  'Rowing', 'Sailing', 'Archery', 'Fencing',
]

export default function App() {
  const [hoveredRing, setHoveredRing] = useState(null)

  return (
    <div className="app">
      <header className="hero">
        <svg viewBox="0 0 210 80" className="rings" aria-label="Olympic rings">
          {RINGS.map((r, i) => (
            <circle
              key={i}
              cx={r.x + 35}
              cy={r.y + 35}
              r="28"
              fill="none"
              stroke={r.color}
              strokeWidth="6"
              onMouseEnter={() => setHoveredRing(r.label)}
              onMouseLeave={() => setHoveredRing(null)}
              style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }}
            />
          ))}
        </svg>
        <h1>Summer Olympics</h1>
        <p className="tagline">
          {hoveredRing ? `Continent: ${hoveredRing}` : 'Celebrating the world\u2019s greatest athletes'}
        </p>
      </header>

      <section className="section">
        <h2>Upcoming Games</h2>
        <div className="cards">
          {UPCOMING.map((g) => (
            <div className="card" key={g.year}>
              <div className="year">{g.year}</div>
              <div className="city">{g.city}</div>
              <div className="country">{g.country}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Featured Sports</h2>
        <div className="sports">
          {SPORTS.map((s) => (
            <span className="pill" key={s}>{s}</span>
          ))}
        </div>
      </section>

      <footer className="footer">
        <small>Built with React + Vite</small>
      </footer>
    </div>
  )
}
