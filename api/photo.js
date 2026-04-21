export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url' })

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    })

    if (!response.ok) return res.status(response.status).end()

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    const buffer = await response.arrayBuffer()
    return res.send(Buffer.from(buffer))
  } catch (err) {
    console.error('[api/photo]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
