const { Router } = require('express');
const { sql, getPool } = require('./db');

const router = Router();

const PRIORIDADES = ['Alta', 'Media', 'Baja'];
const ESTADOS = ['Pendiente', 'En proceso', 'Resuelta'];

const SELECT_COLUMNS = `
  Id AS id, Codigo AS codigo, Titulo AS titulo, Descripcion AS descripcion,
  Responsable AS responsable, Prioridad AS prioridad, Estado AS estado,
  CONVERT(VARCHAR(10), Fecha, 23) AS fecha, CAST(Activo AS BIT) AS activo`;

/** Valida el cuerpo de la petición; devuelve una lista de errores (vacía si es válido). */
function validar(body) {
  const errores = [];
  const texto = (v) => (typeof v === 'string' ? v.trim() : '');

  if (texto(body.titulo).length < 5 || texto(body.titulo).length > 100)
    errores.push('El título debe tener entre 5 y 100 caracteres.');
  if (texto(body.descripcion).length < 10 || texto(body.descripcion).length > 500)
    errores.push('La descripción debe tener entre 10 y 500 caracteres.');
  if (texto(body.responsable).length < 3 || texto(body.responsable).length > 80)
    errores.push('El responsable debe tener entre 3 y 80 caracteres.');
  if (!PRIORIDADES.includes(body.prioridad)) errores.push('Prioridad inválida.');
  if (!ESTADOS.includes(body.estado)) errores.push('Estado inválido.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.fecha || '')) errores.push('Fecha inválida (YYYY-MM-DD).');

  return errores;
}

function bindInputs(request, body) {
  return request
    .input('titulo', sql.NVarChar(100), body.titulo.trim())
    .input('descripcion', sql.NVarChar(500), body.descripcion.trim())
    .input('responsable', sql.NVarChar(80), body.responsable.trim())
    .input('prioridad', sql.NVarChar(10), body.prioridad)
    .input('estado', sql.NVarChar(15), body.estado)
    .input('fecha', sql.Date, body.fecha);
}

// GET /api/incidencias  -> listar (filtros opcionales: ?q=&prioridad=&estado=&activo=1|0|todos)
router.get('/', async (req, res, next) => {
  try {
    const { q, prioridad, estado, activo = '1' } = req.query;
    const pool = await getPool();
    const request = pool.request();
    const where = [];

    if (activo === '1' || activo === '0') {
      request.input('activo', sql.Bit, activo === '1');
      where.push('Activo = @activo');
    }

    if (q) {
      request.input('q', sql.NVarChar, `%${q}%`);
      where.push('(Titulo LIKE @q OR Codigo LIKE @q)');
    }
    if (prioridad) {
      request.input('prioridad', sql.NVarChar, prioridad);
      where.push('Prioridad = @prioridad');
    }
    if (estado) {
      request.input('estado', sql.NVarChar, estado);
      where.push('Estado = @estado');
    }

    const result = await request.query(
      `SELECT ${SELECT_COLUMNS} FROM dbo.Incidencias
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY Id DESC`
    );
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
});

// GET /api/incidencias/:id  -> visualizar
router.get('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .query(`SELECT ${SELECT_COLUMNS} FROM dbo.Incidencias WHERE Id = @id`);

    if (!result.recordset.length) return res.status(404).json({ mensaje: 'Incidencia no encontrada' });
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/incidencias  -> registrar
router.post('/', async (req, res, next) => {
  try {
    const errores = validar(req.body);
    if (errores.length) return res.status(400).json({ mensaje: 'Datos inválidos', errores });

    const pool = await getPool();
    const result = await bindInputs(pool.request(), req.body).query(
      `INSERT INTO dbo.Incidencias (Titulo, Descripcion, Responsable, Prioridad, Estado, Fecha)
       OUTPUT INSERTED.Id
       VALUES (@titulo, @descripcion, @responsable, @prioridad, @estado, @fecha);`
    );
    const id = result.recordset[0].Id;
    const creado = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`SELECT ${SELECT_COLUMNS} FROM dbo.Incidencias WHERE Id = @id`);
    res.status(201).json(creado.recordset[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/incidencias/:id  -> actualizar
router.put('/:id', async (req, res, next) => {
  try {
    const errores = validar(req.body);
    if (errores.length) return res.status(400).json({ mensaje: 'Datos inválidos', errores });

    const pool = await getPool();
    const result = await bindInputs(pool.request(), req.body)
      .input('id', sql.Int, Number(req.params.id))
      .query(
        `UPDATE dbo.Incidencias
         SET Titulo = @titulo, Descripcion = @descripcion, Responsable = @responsable,
             Prioridad = @prioridad, Estado = @estado, Fecha = @fecha, ActualizadoEn = SYSDATETIME()
         WHERE Id = @id;
         SELECT ${SELECT_COLUMNS} FROM dbo.Incidencias WHERE Id = @id;`
      );

    if (!result.rowsAffected[0]) return res.status(404).json({ mensaje: 'Incidencia no encontrada' });
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

/** Cambia el campo Activo (borrado lógico / restauración). */
function cambiarActivo(valor) {
  return async (req, res, next) => {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('id', sql.Int, Number(req.params.id))
        .input('activo', sql.Bit, valor)
        .query(
          `UPDATE dbo.Incidencias SET Activo = @activo, ActualizadoEn = SYSDATETIME() WHERE Id = @id;
           SELECT ${SELECT_COLUMNS} FROM dbo.Incidencias WHERE Id = @id;`
        );

      if (!result.rowsAffected[0]) return res.status(404).json({ mensaje: 'Incidencia no encontrada' });
      res.json(result.recordset[0]);
    } catch (err) {
      next(err);
    }
  };
}

// DELETE /api/incidencias/:id  -> eliminar (lógico): pasa a Inactivo
router.delete('/:id', cambiarActivo(false));

// PATCH /api/incidencias/:id/restaurar  -> vuelve a Activo
router.patch('/:id/restaurar', cambiarActivo(true));

// DELETE /api/incidencias/:id/definitivo  -> elimina la fila de la base de datos
router.delete('/:id/definitivo', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .query('DELETE FROM dbo.Incidencias WHERE Id = @id AND Activo = 0');

    if (!result.rowsAffected[0])
      return res.status(404).json({ mensaje: 'Incidencia no encontrada o aún activa' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
