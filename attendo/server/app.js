import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import routes from './routes.js';

export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigin.split(',').map((value) => value.trim()), credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'attendo-api' }));
app.use('/api', routes);
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.status ? error.message : 'Internal server error.' });
});
