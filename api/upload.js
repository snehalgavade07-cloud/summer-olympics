import { put } from '@vercel/blob'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { playerId } = req.query
    const { data, type } = req.body

    if (!playerId) return res.status(400).json({ error: 'Missing playerId' })
    if (!data || !type) return res.status(400).json({ error: 'Missing data or type' })
    if (!type.startsWith('image/')) return res.status(400).json({ error: 'File must be an image' })

    const base64 = data.replace(/^data:.+;base64,/, '')
    const buffer = Buffer.from(base64, 'base64')

    if (buffer.length > 3 * 1024 * 1024)
      return res.status(413).json({ error: 'Image must be under 3 MB' })

    const ext = type.split('/')[1] || 'jpg'
    const blob = await put(`photos/player-${playerId}.${ext}`, buffer, {
      access: 'private',
      contentType: type,
      allowOverwrite: true,
    })

    // Return a proxy URL so private blobs can be served without exposing the token
    const proxyUrl = `/api/photo?url=${encodeURIComponent(blob.url)}`
    return res.status(200).json({ url: proxyUrl })
  } catch (err) {
    console.error('[api/upload]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
