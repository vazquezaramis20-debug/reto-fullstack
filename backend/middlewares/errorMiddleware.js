// Middleware para rutas no encontradas (404)
const notFoundHandler = (req, res, next) => {
  res.status(404).json({ error: `Ruta no encontrada (404): ${req.originalUrl}` });
};

// Middleware global de manejo de errores
const errorHandler = (err, req, res, next) => {
  console.error('[Error Stack]:', err.stack);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Error interno del servidor'
  });
};

module.exports = { notFoundHandler, errorHandler };