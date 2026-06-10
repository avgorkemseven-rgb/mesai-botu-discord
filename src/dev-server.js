import express from 'express';
import { config } from './config.js';
import { handleInteraction } from './interactions.js';

const app = express();

app.post('/api/interactions', express.raw({ type: '*/*' }), async (req, res) => {
  const result = await handleInteraction({
    headers: req.headers,
    rawBody: req.body.toString('utf8'),
  });
  res.status(result.statusCode).json(result.body);
});

app.get('/', (_req, res) => {
  res.send('Mesai botu calisiyor. Discord endpoint: /api/interactions');
});

app.listen(config.port, () => {
  console.log(`Mesai botu local server: http://localhost:${config.port}`);
});
