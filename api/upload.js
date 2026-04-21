import { put } from '@vercel/blob'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { playerId } = req.query
  const { data, type } = req.body   // base64 data URL + mime type

  // Strip the data URL prefix and decode to a Buffer
  const base64 = data.replace(/^data:.+;base64,/, '')
  const buffer = Buffer.from(base64, 'base64')

  const ext  = type.split('/')[1] || 'jpg'
  const blob = await put(`photos/player-${playerId}.${ext}`, buffer, {
    access: 'public',
    contentType: type,
  })

  return res.status(200).json({ url: blob.url })
}
