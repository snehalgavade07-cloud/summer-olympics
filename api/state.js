import Redis from 'ioredis'

// Module-level client — reused across warm Vercel invocations
let redis
function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    })
  }
  return redis
}

const PLAYER_EMOJIS = ['😎','🔥','⚡','🌟','💪','🎯','🏆','🦁','🐉']

const INITIAL_STATE = {
  players: Array.from({ length: 9 }, (_, i) => ({
    id: i + 1, name: `Player ${i + 1}`,
    photoUrl: null, nickname: '', facts: [],
    emoji: PLAYER_EMOJIS[i],
  })),
  events: [],
  adminPin: '2026',
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const r = getRedis()

    if (req.method === 'GET') {
      const raw = await r.get('olympics:state')
      return res.status(200).json(raw ? JSON.parse(raw) : INITIAL_STATE)
    }

    if (req.method === 'POST') {
      await r.set('olympics:state', JSON.stringify(req.body))
      return res.status(200).json({ ok: true })
    }

    return res.status(405).end()

  } catch (err) {
    console.error('[api/state]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
