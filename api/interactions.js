import { handleInteraction } from '../src/interactions.js';

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawBody = await readRawBody(req);
  const result = await handleInteraction({ headers: req.headers, rawBody });
  res.status(result.statusCode).json(result.body);
}
