const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  connectionLimit: 10,
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

// Test básico
app.get('/', (req, res) => {
  res.send('✅ Backend funcionando correctamente');
});

// 🔐 Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM Empleados WHERE User = ? AND Password = ?';

  pool.query(query, [email, password], (error, results) => {
    if (error) return res.status(500).json({ success: false, error: error.message });
    if (results.length > 0) {
      res.json({ success: true, user: results[0].Nombre });
    } else {
      res.json({ success: false });
    }
  });
});

// 📥 Obtener datos de un usuario
app.post('/usuario', (req, res) => {
  const { email } = req.body;
  const query = 'SELECT Nombre, User, Password, Permisos FROM Empleados WHERE User = ?';

  pool.query(query, [email], (error, results) => {
    if (error) return res.status(500).json({ success: false, error: error.message });

    if (results.length > 0) {
      const user = results[0];
      res.json({ success: true, data: user });
    } else {
      res.json({ success: false });
    }
  });
});

// 🧾 Obtener todos los usuarios
app.get('/usuarios', (req, res) => {
  const query = 'SELECT User, Nombre, Password, Permisos FROM Empleados';

  pool.query(query, (error, results) => {
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data: results });
  });
});

// 🆕 Crear nuevo usuario
app.post('/nuevo-usuario', (req, res) => {
  const { User, Nombre, Password, Permisos } = req.body;

  if (!User || !Nombre || !Password) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }

  const query = 'INSERT INTO Empleados (User, Nombre, Password, Permisos) VALUES (?, ?, ?, ?)';
  pool.query(query, [User, Nombre, Password, Permisos || 0], (error) => {
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });
});

// 🛠️ Actualizar usuario completo (por User)
app.post('/actualizar-usuario-completo', (req, res) => {
  const { User, Nombre, Password, Permisos } = req.body;

  if (!User) return res.status(400).json({ success: false, error: 'User requerido' });

  const query = 'UPDATE Empleados SET Nombre = ?, Password = ?, Permisos = ? WHERE User = ?';
  pool.query(query, [Nombre, Password, Permisos, User], (error) => {
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });
});

// ❌ Eliminar usuario por User
app.delete('/eliminar-usuario/:user', (req, res) => {
  const { user } = req.params;

  const query = 'DELETE FROM Empleados WHERE User = ?';

  pool.query(query, [user], (error) => {
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });
});

// 📌 Obtener proyectos
app.get('/proyectos', (req, res) => {
  const query = 'SELECT Proyecto, Ubi1, Ubi2, Ubi3, Ubi4, HorasVuelos FROM UbicacionesProyectos';

  pool.query(query, (error, results) => {
    if (error) return res.status(500).json({ success: false, error: error.message });

    res.json({ success: true, data: results });
  });
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

  pool.query(
    query,
    [nuevoNombre || proyectoAntiguo, ubi1, ubi2, ubi3, ubi4, horasVuelos || 0, proyectoAntiguo],
    (error) => {
      if (error) return res.status(500).json({ success: false, error: error.message });

      res.json({ success: true });
    }
  );
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

  pool.query(
    query,
    [proyecto, ubi1 || '', ubi2 || '', ubi3 || '', ubi4 || '', horasVuelos || 0],
    (error) => {
      if (error) return res.status(500).json({ success: false, error: error.message });

      res.json({ success: true });
    }
  );
});

// ❌ Eliminar proyecto
app.delete('/proyecto/:nombre', (req, res) => {
  const nombre = decodeURIComponent(req.params.nombre);

  const query = 'DELETE FROM UbicacionesProyectos WHERE Proyecto = ?';

  pool.query(query, [nombre], (error) => {
    if (error) return res.status(500).json({ success: false, error: error.message });

    res.json({ success: true });
  });
});

// 📍 Registrar fichaje en "RegistroHorario"
app.post('/registro-horario', (req, res) => {
  const { NombreEmpleado, Dia, Proyecto, Entrada1, Salida1, Estado, TipoFichaje } = req.body;

  if (!NombreEmpleado || !Dia || !Proyecto || !Estado || !TipoFichaje) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos para el registro de horario' });
  }

  const query = `
    INSERT INTO RegistroHorario (NombreEmpleado, Dia, Proyecto, Entrada1, Salida1, Estado, TipoFichaje)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(query, [NombreEmpleado, Dia, Proyecto, Entrada1, Salida1, Estado, TipoFichaje], (error) => {
    if (error) return res.status(500).json({ success: false, error: error.message });

    res.json({ success: true });
  });
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

  pool.query(query, [email, tipo, proyecto, fecha], (error) => {
    if (error) return res.status(500).json({ success: false, error: error.message });

    res.json({ success: true });
  });
});

// 📄 Obtener historial de fichajes del usuario
app.post('/historial-usuario', (req, res) => {
  const { email } = req.body;

  const getNombreQuery = 'SELECT Nombre FROM Empleados WHERE User = ?';

  pool.query(getNombreQuery, [email], (err, results) => {
    if (err) {
      console.error('❌ Error al buscar Nombre desde User:', err);
      return res.status(500).json({ success: false, error: err.message });
    }

    if (results.length === 0) {
      console.warn('⚠️ No se encontró ningún Nombre para el email:', email);
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const nombre = results[0].Nombre;
    console.log(`✅ Nombre encontrado: ${nombre}`);

    const historialQuery = `
      SELECT * FROM RegistroHorario
      WHERE NombreEmpleado = ?
      ORDER BY Dia DESC
    `;

    pool.query(historialQuery, [nombre], (err2, resultados) => {
      if (err2) {
        console.error('❌ Error al obtener historial:', err2);
        return res.status(500).json({ success: false, error: err2.message });
      }

      console.log(`📋 Se encontraron ${resultados.length} fichajes para ${nombre}`);
      res.json({ success: true, data: resultados });
    });
  });
});

// 🚀 Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
