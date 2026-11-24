const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: Number(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Incidencias#2026',
  database: process.env.DB_NAME || 'IncidenciasDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let poolPromise;

/** Devuelve un pool de conexiones reutilizable (se crea una sola vez). */
function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect().catch((err) => {
      poolPromise = undefined; // permite reintentar en la próxima petición
      throw err;
    });
  }
  return poolPromise;
}

module.exports = { sql, getPool };
