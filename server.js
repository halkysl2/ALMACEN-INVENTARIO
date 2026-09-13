const express = require('express');
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app = express();
const adapter = new FileSync('inventario.json');
const db = low(adapter);

// Configurar base de datos inicial con familias por defecto si no existen
db.defaults({ 
  inventario: [],
  familias: [
    { id: 1, nombre: 'General' },
    { id: 2, nombre: 'Herramientas' },
    { id: 3, nombre: 'Materiales' }
  ] 
}).write();

app.use(cors());
app.use(express.json());

// --- ENDPOINTS FAMILIAS ---

// Obtener Familias
app.get('/api/familias', (req, res) => {
  const familias = db.get('familias').value();
  res.json(familias);
});

// Crear Familia
app.post('/api/familias', (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

  const existe = db.get('familias').find({ nombre: nombre.trim() }).value();
  if (existe) return res.status(400).json({ error: 'La familia ya existe' });

  const nuevaFamilia = { id: Date.now(), nombre: nombre.trim() };
  db.get('familias').push(nuevaFamilia).write();
  res.status(201).json(nuevaFamilia);
});

// Borrar Familia
app.delete('/api/familias/:id', (req, res) => {
  const { id } = req.params;
  db.get('familias').remove({ id: Number(id) }).write();
  res.json({ mensaje: 'Familia eliminada' });
});

// --- ENDPOINTS INVENTARIO ---

// Obtener Productos
app.get('/api/inventario', (req, res) => {
  const productos = db.get('inventario').value();
  res.json(productos);
});

// Crear Producto
app.post('/api/inventario', (req, res) => {
  const { codigo, nombre, familia, proveedor, ubicacion, stock_actual, stock_minimo, precio_costo } = req.body;
  
  const nuevoProducto = {
    id: Date.now(),
    codigo: codigo || '',
    nombre: nombre || '',
    familia: familia || 'General',
    proveedor: proveedor || 'Sin Asignar',
    ubicacion: ubicacion || 'Sin Asignar',
    stock_actual: Number(stock_actual) || 0,
    stock_minimo: Number(stock_minimo) || 0,
    precio_costo: Number(precio_costo) || 0
  };

  db.get('inventario').push(nuevoProducto).write();
  res.status(201).json(nuevoProducto);
});

// Editar Producto
app.put('/api/inventario/:id', (req, res) => {
  const { id } = req.params;
  const { codigo, nombre, familia, proveedor, ubicacion, stock_actual, stock_minimo, precio_costo } = req.body;

  const productoActualizado = db.get('inventario')
    .find({ id: Number(id) })
    .assign({
      codigo,
      nombre,
      familia,
      proveedor: proveedor || 'Sin Asignar',
      ubicacion,
      stock_actual: Number(stock_actual),
      stock_minimo: Number(stock_minimo),
      precio_costo: Number(precio_costo)
    })
    .write();

  res.json(productoActualizado);
});

// Movimiento de Stock (+ / -)
app.patch('/api/inventario/:id/movimiento', (req, res) => {
  const { id } = req.params;
  const { tipo, cantidad } = req.body;

  const producto = db.get('inventario').find({ id: Number(id) }).value();
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  let nuevoStock = Number(producto.stock_actual || 0);
  const cant = Number(cantidad) || 0;

  if (tipo === 'ENTRADA') nuevoStock += cant;
  else if (tipo === 'SALIDA') nuevoStock = Math.max(0, nuevoStock - cant);

  db.get('inventario')
    .find({ id: Number(id) })
    .assign({ stock_actual: nuevoStock })
    .write();

  res.json({ mensaje: 'Stock actualizado', nuevoStock });
});

// Eliminar Producto
app.delete('/api/inventario/:id', (req, res) => {
  const { id } = req.params;
  db.get('inventario').remove({ id: Number(id) }).write();
  res.json({ mensaje: 'Producto eliminado' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de inventario corriendo en el puerto ${PORT}`);
});
