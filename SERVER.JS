const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a Base de Datos SQLite
const db = new sqlite3.Database('./almacen.db', (err) => {
  if (err) console.error('Error al conectar a SQLite:', err.message);
  else console.log('Conectado a la base de datos del almacén.');
});

// Crear tabla de productos si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 0,
    precio REAL NOT NULL DEFAULT 0.0
  )
`);

// RUTAS API

// 1. Obtener todos los productos
app.get('/api/productos', (req, res) => {
  db.all('SELECT * FROM productos', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 2. Agregar un nuevo producto
app.post('/api/productos', (req, res) => {
  const { nombre, sku, cantidad, precio } = req.body;
  const sql = 'INSERT INTO productos (nombre, sku, cantidad, precio) VALUES (?, ?, ?, ?)';
  
  db.run(sql, [nombre, sku, cantidad, precio], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, nombre, sku, cantidad, precio });
  });
});

// 3. Actualizar stock de un producto
app.patch('/api/productos/:id', (req, res) => {
  const { cantidad } = req.body;
  const { id } = req.params;
  
  db.run('UPDATE productos SET cantidad = ? WHERE id = ?', [cantidad, id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor de almacén ejecutándose en el puerto ${PORT}`);
});