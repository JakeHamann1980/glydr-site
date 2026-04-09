import { Redis } from '@upstash/redis';

const KV_KEY = 'glydr:config';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  // GET — public read
  if (req.method === 'GET') {
    try {
      const data = await redis.get(KV_KEY);
      if (!data) {
        return res.status(404).json({ error: 'Config not found. Run /api/seed first.' });
      }
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read config', detail: err.message });
    }
  }

  // POST — authenticated write
  if (req.method === 'POST') {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      await redis.set(KV_KEY, body);
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to write config', detail: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
