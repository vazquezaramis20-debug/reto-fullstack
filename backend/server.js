require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const User = require('./models/User');
const Item = require('./models/Item');
const verificarToken = require('./middlewares/authMiddleware');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// Configuración de CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado exitosamente a MongoDB'))
  .catch((err) => {
    console.error('❌ Error de conexión a la base de datos:', err.message);
    process.exit(1);
  });

// Validador de campos
const validarCampos = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }
  next();
};

// ================= RUTAS DE AUTENTICACIÓN =================

app.post('/api/auth/register', [
  body('username').notEmpty().withMessage('El usuario es requerido').isLength({ min: 3 }),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener mínimo 6 caracteres'),
  validarCampos
], async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const usuarioExistente = await User.findOne({ username });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nuevoUsuario = new User({ username, password: hashedPassword });
    await nuevoUsuario.save();

    return res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/login', [
  body('username').notEmpty().withMessage('Ingresa tu usuario'),
  body('password').notEmpty().withMessage('Ingresa tu contraseña'),
  validarCampos
], async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const usuario = await User.findOne({ username });
    if (!usuario) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario._id, username: usuario.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    return res.json({ token, username: usuario.username });
  } catch (err) {
    next(err);
  }
});

// ================= RUTAS CRUD (ITEMS) =================

app.get('/api/items', async (req, res, next) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    next(err);
  }
});

app.post('/api/items', verificarToken, [
  body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
  body('categoria').notEmpty().withMessage('La categoría es obligatoria'),
  body('precio').isNumeric().withMessage('El precio debe ser un número válido'),
  body('stock').optional().isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),
  validarCampos
], async (req, res, next) => {
  try {
    const nuevoItem = new Item(req.body);
    const itemGuardado = await nuevoItem.save();
    return res.status(201).json(itemGuardado);
  } catch (err) {
    next(err);
  }
});

app.put('/api/items/:id', verificarToken, [
  body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('precio').optional().isNumeric().withMessage('El precio debe ser numérico'),
  validarCampos
], async (req, res, next) => {
  try {
    const itemActualizado = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!itemActualizado) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }
    return res.json(itemActualizado);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/items/:id', verificarToken, async (req, res, next) => {
  try {
    const itemEliminado = await Item.findByIdAndDelete(req.params.id);
    if (!itemEliminado) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }
    return res.json({ mensaje: 'Elemento eliminado correctamente' });
  } catch (err) {
    next(err);
  }
});

// Middlewares de error
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});