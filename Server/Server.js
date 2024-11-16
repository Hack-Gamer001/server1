import fs from 'fs';
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your_jwt_secret'; // Cambia esto por una clave segura

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Cargar el certificado CA para la conexión SSL
const caCert = fs.readFileSync('./ca.pem'); // Asegúrate de tener el certificado en esta ruta

// Configuración de la conexión a MySQL con SSL
const db = mysql.createConnection({
  host: 'mysql-4395e4d-adasdd123.h.aivencloud.com',
  user: 'avnadmin',
  password: 'AVNS_vfXW1XilsEjy9sPN9_U',
  database: 'ecommerce',
  port: 14752,
  ssl: { ca: caCert }
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

// Función de utilidad para manejar errores de la base de datos
const handleDbError = (err, res, customMessage) => {
  console.error(customMessage, err.message);
  return res.status(500).json({ error: customMessage, details: err.message });
};

// ==================
//  Rutas de Products
// ==================

// Obtener todos los productos
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) return handleDbError(err, res, 'Error al obtener los productos');
    res.json(results);
  });
});

// Ruta para obtener un producto por su ID
app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'El ID del producto debe ser un número válido.' });
  }

  const query = 'SELECT * FROM products WHERE id = ?';
  db.query(query, [productId], (err, results) => {
    if (err) return handleDbError(err, res, 'Error al obtener el producto');
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Producto no encontrado.' });
    }
  });
});

// Eliminar un producto por ID
app.delete('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'El ID del producto debe ser un número válido.' });
  }

  db.query('DELETE FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) return handleDbError(err, res, 'Error al eliminar el producto');
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado exitosamente' });
  });
});

// Actualizar un producto por ID
app.put('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const updatedData = req.body;

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'El ID del producto debe ser un número válido.' });
  }

  db.query('UPDATE products SET ? WHERE id = ?', [updatedData, productId], (err, results) => {
    if (err) return handleDbError(err, res, 'Error al actualizar el producto');
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto actualizado exitosamente', ...updatedData });
  });
});

// ==================
//  Rutas de Reports
// ==================

// Obtener todos los reportes
app.get('/api/reports', (req, res) => {
  db.query('SELECT * FROM reports', (err, results) => {
    if (err) return handleDbError(err, res, 'Error al obtener los reportes');
    res.json(results);
  });
});

// Eliminar un reporte por ID
app.delete('/api/reports/:id', (req, res) => {
  const reportId = parseInt(req.params.id);

  if (isNaN(reportId)) {
    return res.status(400).json({ message: 'El ID del reporte debe ser un número válido.' });
  }

  db.query('DELETE FROM reports WHERE orden_id = ?', [reportId], (err, results) => {
    if (err) return handleDbError(err, res, 'Error al eliminar el reporte');
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    res.json({ message: 'Reporte eliminado exitosamente' });
  });
});

// Actualizar un reporte por ID
app.put('/api/reports/:id', (req, res) => {
  const reportId = parseInt(req.params.id);
  const updatedData = req.body;

  if (isNaN(reportId)) {
    return res.status(400).json({ message: 'El ID del reporte debe ser un número válido.' });
  }

  db.query('UPDATE reports SET ? WHERE orden_id = ?', [updatedData, reportId], (err, results) => {
    if (err) return handleDbError(err, res, 'Error al actualizar el reporte');
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    res.json({ message: 'Reporte actualizado', ...updatedData });
  });
});

// ==================
//  Rutas de Customers
// ==================

// Obtener todos los clientes
app.get('/api/customers', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return handleDbError(err, res, 'Error al obtener los clientes');
    res.json(results);
  });
});

// Eliminar un cliente y sus registros relacionados en carrito y historial_licencias
app.delete('/api/customers/:id', (req, res) => {
  const customerId = parseInt(req.params.id);

  if (isNaN(customerId)) {
    return res.status(400).json({ message: 'El ID del cliente debe ser un número válido.' });
  }

  db.query('DELETE FROM historial_licencias WHERE usuario_id = ?', [customerId], (err) => {
    if (err) return handleDbError(err, res, 'Error al eliminar historial de licencias');
    db.query('DELETE FROM carrito WHERE usuario_id = ?', [customerId], (err) => {
      if (err) return handleDbError(err, res, 'Error al eliminar el carrito');
      db.query('DELETE FROM users WHERE id = ?', [customerId], (err, results) => {
        if (err) return handleDbError(err, res, 'Error al eliminar el cliente');
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json({ message: 'Cliente y sus registros relacionados eliminados' });
      });
    });
  });
});

// Actualizar un cliente por ID
app.put('/api/customers/:id', (req, res) => {
  const customerId = parseInt(req.params.id);
  const updatedData = req.body;

  if (isNaN(customerId)) {
    return res.status(400).json({ message: 'El ID del cliente debe ser un número válido.' });
  }

  db.query('UPDATE users SET ? WHERE id = ?', [updatedData, customerId], (err, results) => {
    if (err) return handleDbError(err, res, 'Error al actualizar el cliente');
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente actualizado', ...updatedData });
  });
});

// ==================
//  Rutas de Orders
// ==================

// Obtener todas las órdenes
app.get('/api/orders', (req, res) => {
  db.query('SELECT id, total, estado FROM ordenes', (err, results) => {
    if (err) return handleDbError(err, res, 'Error al obtener las órdenes');
    res.json(results);
  });
});

// Eliminar una orden por ID
app.delete('/api/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id);

  if (isNaN(orderId)) {
    return res.status(400).json({ message: 'El ID de la orden debe ser un número válido.' });
  }

  db.query('DELETE FROM ordenes WHERE id = ?', [orderId], (err, results) => {
    if (err) return handleDbError(err, res, 'Error al eliminar la orden');
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.json({ message: 'Orden eliminada exitosamente' });
  });
});

// Actualizar una orden por ID
app.put('/api/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id);
  const updatedData = req.body;

  if (isNaN(orderId)) {
    return res.status(400).json({ message: 'El ID de la orden debe ser un número válido.' });
  }

  db.query('UPDATE ordenes SET ? WHERE id = ?', [updatedData, orderId], (err, results) => {
    if (err) return handleDbError(err, res, 'Error al actualizar la orden');
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.json({ message: 'Orden actualizada exitosamente', ...updatedData });
  });
});

// ==================
//  Ruta de inicio de sesión
// ==================
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error("Error de servidor:", err);
      return res.status(500).json({ error: 'Error de servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas. Por favor, intenta nuevamente.' });
    }

    const user = results[0];

    // Verificar contraseña sin bcrypt (temporalmente)
    if (password === user.contraseña) {
      const token = jwt.sign({ id: user.id, role: user.rol }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, role: user.rol });
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas o no existe en la base de datos. Por favor, intenta nuevamente.' });
    }
  });
});

// Agregar producto al carrito
app.post('/api/cart', (req, res) => {
  const { usuario_id, producto_id, cantidad } = req.body;
  const query = `
    INSERT INTO carrito (usuario_id, producto_id, cantidad) 
    VALUES (?, ?, ?) 
    ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad);
  `;

  db.query(query, [usuario_id, producto_id, cantidad], (err, results) => {
    if (err) return handleDbError(err, res, 'Error al agregar al carrito');
    res.json({ message: 'Producto añadido al carrito' });
  });
});

// Obtener productos en el carrito
app.get('/api/cart', (req, res) => {
  const userId = 1; // Reemplaza con ID del usuario autenticado
  const query = `
    SELECT c.id, p.nombre, p.descripcion, p.precio, c.cantidad, p.imagen_url
    FROM carrito c
    JOIN products p ON c.producto_id = p.id
    WHERE c.usuario_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return handleDbError(err, res, 'Error al obtener el carrito');
    res.json(results);
  });
});


// Agregar nueva ruta para obtener productos con sus categorías
app.get('/api/products', (req, res) => {
  const query = `
    SELECT p.*, c.nombre AS categoria_nombre 
    FROM products p
    LEFT JOIN categorias c ON p.categoria_id = c.id
  `;
  db.query(query, (err, results) => {
    if (err) return handleDbError(err, res, 'Error al obtener los productos');
    
    // Organizar los productos por categorías
    const productsByCategory = results.reduce((acc, product) => {
      const { categoria_nombre, ...productData } = product;
      if (!acc[categoria_nombre]) {
        acc[categoria_nombre] = [];
      }
      acc[categoria_nombre].push(productData);
      return acc;
    }, {});

    res.json(productsByCategory);
  });
});

// Ruta para obtener un producto por su ID con su categoría
app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'El ID del producto debe ser un número válido.' });
  }

  const query = `
    SELECT p.*, c.nombre AS categoria_nombre 
    FROM products p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.id = ?
  `;
  db.query(query, [productId], (err, results) => {
    if (err) return handleDbError(err, res, 'Error al obtener el producto');
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Producto no encontrado.' });
    }
  });
});


// Iniciar el servidor localmente solo si no está en un entorno de servidorless
app.use(cors({ origin: '*', credentials: true }));


// Exportar la aplicación para Vercel
export default app;
