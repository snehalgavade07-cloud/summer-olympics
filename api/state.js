import { kv } from '@vercel/kv'

const PLAYER_EMOJIS = ['😎','🔥','⚡','🌟','💪','🎯','🏆','🦁','🐉']

const INITIAL_STATE = {
  players: Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    photoUrl: null,
    nickname: '',
    facts: [],
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

  if (req.method === 'GET') {
    const state = await kv.get('olympics:state')
    return res.status(200).json(state ?? INITIAL_STATE)
  }

  if (req.method === 'POST') {
    await kv.set('olympics:state', req.body)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
