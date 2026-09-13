const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Crear o abrir la base de datos
const db = new Database('inventario.db');

// Crear tabla si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS inventario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    ubicacion TEXT NOT NULL DEFAULT 'Sin Asignar',
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    precio_costo REAL DEFAULT 0.0
  )
`);

// GET: Obtener todo el inventario
app.get('/api/inventario', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM inventario ORDER BY nombre ASC');
    const rows = stmt.all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Registrar nuevo producto
app.post('/api/inventario', (req, res) => {
  const { codigo, nombre, ubicacion, stock_actual, stock_minimo, precio_costo } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO inventario (codigo, nombre, ubicacion, stock_actual, stock_minimo, precio_costo) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(codigo, nombre, ubicacion, stock_actual, stock_minimo, precio_costo);
    res.json({ id: info.lastInsertRowid, mensaje: 'Producto registrado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH: Entrada (+) o Salida (-) de Stock
app.patch('/api/inventario/:id/movimiento', (req, res) => {
  const { tipo, cantidad } = req.body;
  const { id } = req.params;
  const operador = tipo === 'ENTRADA' ? '+' : '-';

  try {
    const stmt = db.prepare(`UPDATE inventario SET stock_actual = stock_actual ${operador} ? WHERE id = ?`);
    stmt.run(cantidad, id);
    res.json({ mensaje: 'Stock actualizado con éxito' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Servidor de inventario listo en puerto ${PORT}`));
