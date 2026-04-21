// Diagnostic endpoint — shows which env vars Vercel injected
export default function handler(req, res) {
  const kvVars = Object.keys(process.env).filter(k =>
    k.includes('KV') || k.includes('REDIS') || k.includes('BLOB')
  )

  res.status(200).json({
    ok: true,
    node: process.version,
    storageVars: kvVars,   // names only, no values
  })
}
