const express = require('express');
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Base de datos ligera en archivo JSON
const adapter = new FileSync('inventario.json');
const db = low(adapter);

// Inicializar la estructura
db.defaults({ inventario: [] }).write();

// GET: Obtener todo el inventario
app.get('/api/inventario', (req, res) => {
  const items = db.get('inventario').value();
  res.json(items);
});

// POST: Registrar nuevo producto
app.post('/api/inventario', (req, res) => {
  const { codigo, nombre, ubicacion, stock_actual, stock_minimo, precio_costo } = req.body;
  const nuevoItem = {
    id: Date.now(),
    codigo,
    nombre,
    ubicacion: ubicacion || 'Sin Asignar',
    stock_actual: Number(stock_actual) || 0,
    stock_minimo: Number(stock_minimo) || 5,
    precio_costo: Number(precio_costo) || 0
  };

  db.get('inventario').push(nuevoItem).write();
  res.json({ mensaje: 'Producto registrado', id: nuevoItem.id });
});

// PATCH: Entrada (+) o Salida (-) de Stock
app.patch('/api/inventario/:id/movimiento', (req, res) => {
  const { id } = req.params;
  const { tipo, cantidad } = req.body;
  const cant = Number(cantidad);

  const item = db.get('inventario').find({ id: Number(id) }).value();

  if (!item) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const nuevoStock = tipo === 'ENTRADA' ? item.stock_actual + cant : item.stock_actual - cant;

  db.get('inventario')
    .find({ id: Number(id) })
    .assign({ stock_actual: nuevoStock })
    .write();

  res.json({ mensaje: 'Stock actualizado con éxito' });
});

app.listen(PORT, () => console.log(`Servidor de inventario listo en puerto ${PORT}`));
