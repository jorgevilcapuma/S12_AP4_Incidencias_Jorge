require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getPool } = require('./db');
const incidenciasRoutes = require('./incidencias.routes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4200' }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1');
    res.json({ status: 'ok', database: 'conectada' });
  } catch {
    res.status(503).json({ status: 'error', database: 'desconectada' });
  }
});

app.use('/api/incidencias', incidenciasRoutes);

// Manejador central de errores
app.use((err, _req, res, _next) => {
  console.error('[API]', err.message);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
});

app.listen(PORT, () => console.log(`API de incidencias escuchando en http://localhost:${PORT}`));
