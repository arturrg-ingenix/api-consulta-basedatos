const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  connectionLimit: 20, // 🔄 Aumentado el límite de conexiones para evitar bloqueos
  host: 'bbdd.ingenix.es',
  user: 'ddb250008',
  password: 'LP%vV7S.%%$4BF',
  database: 'ddb250008',
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error al conectar al pool de base de datos:', err.message);
  } else {
    console.log('✅ Conectado al pool de base de datos');
    connection.release();
  }
});

// 📌 Función para ejecutar querys con liberación de conexión
const executeQuery = (query, params, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('❌ Error al obtener conexión:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }

    connection.query(query, params, (error, results) => {
      connection.release(); // ✅ Liberar conexión
      if (error) {
        console.error('❌ Error en la query:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }
      res.json({ success: true, data: results });
    });
  });
};

// 🔐 Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM Empleados WHERE User = ? AND Password = ?';
  executeQuery(query, [email, password], res);
});

// 📥 Obtener datos de un usuario
app.post('/usuario', (req, res) => {
  const { email } = req.body;
  const query = 'SELECT Nombre, User, Password, Permisos FROM Empleados WHERE User = ?';
  executeQuery(query, [email], res);
});

// 🧾 Obtener todos los usuarios
app.get('/usuarios', (req, res) => {
  const query = 'SELECT User, Nombre, Password, Permisos FROM Empleados';
  executeQuery(query, [], res);
});

// 🆕 Crear nuevo usuario
app.post('/nuevo-usuario', (req, res) => {
  const { User, Nombre, Password, Permisos } = req.body;
  if (!User || !Nombre || !Password) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }
  const query = 'INSERT INTO Empleados (User, Nombre, Password, Permisos) VALUES (?, ?, ?, ?)';
  executeQuery(query, [User, Nombre, Password, Permisos || 0], res);
});

// 🛠️ Actualizar usuario completo (por User)
app.post('/actualizar-usuario-completo', (req, res) => {
  const { User, Nombre, Password, Permisos } = req.body;
  if (!User) return res.status(400).json({ success: false, error: 'User requerido' });

  const query = 'UPDATE Empleados SET Nombre = ?, Password = ?, Permisos = ? WHERE User = ?';
  executeQuery(query, [Nombre, Password, Permisos, User], res);
});

// ❌ Eliminar usuario por User
app.delete('/eliminar-usuario/:user', (req, res) => {
  const { user } = req.params;
  const query = 'DELETE FROM Empleados WHERE User = ?';
  executeQuery(query, [user], res);
});

// 📌 Obtener proyectos
app.get('/proyectos', (req, res) => {
  const query = 'SELECT Proyecto, Ubi1, Ubi2, Ubi3, Ubi4, HorasVuelos FROM UbicacionesProyectos';
  executeQuery(query, [], res);
});

// ✏️ Actualizar proyecto
app.put('/proyecto', (req, res) => {
  const {
    proyectoAntiguo,
    nuevoNombre,
    ubi1,
    ubi2,
    ubi3,
    ubi4,
    horasVuelos,
  } = req.body;

  if (!proyectoAntiguo) {
    return res.status(400).json({ success: false, error: 'Falta el nombre actual del proyecto' });
  }

  const query = `
    UPDATE UbicacionesProyectos
    SET Proyecto = ?, Ubi1 = ?, Ubi2 = ?, Ubi3 = ?, Ubi4 = ?, HorasVuelos = ?
    WHERE Proyecto = ?
  `;
  executeQuery(query, [nuevoNombre || proyectoAntiguo, ubi1, ubi2, ubi3, ubi4, horasVuelos || 0, proyectoAntiguo], res);
});

// ➕ Insertar nuevo proyecto
app.post('/proyecto', (req, res) => {
  const { proyecto, ubi1, ubi2, ubi3, ubi4, horasVuelos } = req.body;
  if (!proyecto) {
    return res.status(400).json({ success: false, error: 'Falta el nombre del proyecto' });
  }
  const query = `
    INSERT INTO UbicacionesProyectos (Proyecto, Ubi1, Ubi2, Ubi3, Ubi4, HorasVuelos)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  executeQuery(query, [proyecto, ubi1 || '', ubi2 || '', ubi3 || '', ubi4 || '', horasVuelos || 0], res);
});

// ❌ Eliminar proyecto
app.delete('/proyecto/:nombre', (req, res) => {
  const nombre = decodeURIComponent(req.params.nombre);
  const query = 'DELETE FROM UbicacionesProyectos WHERE Proyecto = ?';
  executeQuery(query, [nombre], res);
});

// 📍 Registrar fichaje
app.post('/fichaje', (req, res) => {
  const { email, tipo, proyecto, fecha } = req.body;
  if (!email || !tipo || !proyecto || !fecha) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos para el fichaje' });
  }
  const query = `
    INSERT INTO Fichajes (Email, Tipo, Proyecto, FechaHora)
    VALUES (?, ?, ?, ?)
  `;
  executeQuery(query, [email, tipo, proyecto, fecha], res);
});

// 🚀 Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
