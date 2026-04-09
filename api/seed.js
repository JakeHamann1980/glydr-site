import { Redis } from '@upstash/redis';
import { readFileSync } from 'fs';
import { join } from 'path';

const KV_KEY = 'glydr:config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  try {
    // Read the local features.json as seed data
    const seedData = JSON.parse(readFileSync(join(process.cwd(), 'features.json'), 'utf-8'));
    await redis.set(KV_KEY, seedData);
    return res.status(200).json({ success: true, message: 'KV seeded from features.json' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to seed', detail: err.message });
  }
}
