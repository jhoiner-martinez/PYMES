import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { apiRouter } from './server/api.js';
import { initStorage } from './server/storage.js';
import { getDb } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize SQLite database and base NAS storage structure
  console.log('Initializing SQLite Database and NAS Storage...');
  await getDb();
  await initStorage();
  console.log('NAS storage initialized.');

  // Parse JSON and form bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount NAS API router
  app.use('/api', apiRouter);

  // In production or development with Vite middleware mode
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Mount Vite dev middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MiniNAS Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
