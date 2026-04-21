import { createClient } from '@vercel/kv'

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

// @vercel/kv looks for KV_REST_API_URL by default, but if the store was
// created with a custom name Vercel prefixes the vars (e.g. MYSTORE_KV_REST_API_URL).
// This picks whichever variant is present.
function getKv() {
  const url =
    process.env.KV_REST_API_URL ??
    Object.entries(process.env).find(([k]) => k.endsWith('_KV_REST_API_URL'))?.[1]

  const token =
    process.env.KV_REST_API_TOKEN ??
    Object.entries(process.env).find(([k]) => k.endsWith('_KV_REST_API_TOKEN'))?.[1]

  if (!url || !token) {
    const found = Object.keys(process.env).filter(k => k.includes('KV') || k.includes('REDIS'))
    throw new Error(
      `KV env vars not found. Available storage vars: [${found.join(', ') || 'none'}]. ` +
      `Make sure the Redis store is connected to this project in Vercel dashboard and you redeployed.`
    )
  }

  return createClient({ url, token })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const kv = getKv()

    if (req.method === 'GET') {
      const state = await kv.get('olympics:state')
      return res.status(200).json(state ?? INITIAL_STATE)
    }

    if (req.method === 'POST') {
      await kv.set('olympics:state', req.body)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).end()

  } catch (err) {
    console.error('[api/state]', err)
    return res.status(500).json({ error: err.message })
  }
}
