import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  var adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  var body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  var category = body.category || 'hero';
  var prompt = body.prompt || '';
  var count = Math.min(body.count || 5, 10);

  var categoryDescriptions = {
    hero: 'Hero headline (bold, short, uppercase, 2-6 words — displayed huge on the homepage)',
    sub: 'Sub-headline (1-2 sentences expanding on the hero — conversational but punchy)',
    tagline: 'Brand tagline (single memorable phrase, 4-8 words)',
    product: 'Product descriptor (1-2 sentences describing what GLYDR is)',
    cta_primary: 'Primary CTA button text (3-5 words with price $299 if appropriate)',
    cta_secondary: 'Secondary CTA button text (2-4 words, softer action like Watch/Learn/Join)',
    ticker: 'Ticker/marquee item (2-5 words, punchy claim or spec highlight)'
  };

  var systemPrompt = `You are a copywriter for GLYDR, a gaming hardware brand. GLYDR makes the world's first analog dual foot controller for PC gaming and VR.

Key facts:
- 16 mappable actions
- 12ms latency
- USB-C wired connection
- Assembled in Texas
- $299 USD
- For PC gamers, VR users, and creators

Brand voice: Confident (not cocky), technical (not alienating), inclusive (not preachy), playful (not silly). Think Corsair meets Valorant — esports aesthetic, dark and cinematic.

Never mention Bluetooth. Never use emojis. Never use generic SaaS language.`;

  var userPrompt = `Generate ${count} options for: ${categoryDescriptions[category] || category}

${prompt ? 'Additional direction: ' + prompt : ''}

Return ONLY a JSON array of strings, no explanation. Example: ["Option one", "Option two"]`;

  try {
    var client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    var message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    var text = message.content[0].text.trim();
    // Extract JSON array from response
    var match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return res.status(500).json({ error: 'Failed to parse response', raw: text });
    }
    var suggestions = JSON.parse(match[0]);
    return res.status(200).json({ suggestions: suggestions });
  } catch (err) {
    return res.status(500).json({ error: 'Generation failed', detail: err.message });
  }
}
