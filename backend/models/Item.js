const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  categoria: { type: String, required: true, trim: true },
  precio: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 1, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);