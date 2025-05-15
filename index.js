// Importación de módulos necesarios para el servidor y la base de datos
const express = require('express');    // Framework para construir aplicaciones web y APIs
const mysql = require('mysql');        // Módulo para conectar y manejar bases de datos MySQL
const cors = require('cors');          // Módulo para permitir solicitudes de diferentes orígenes (CORS)

// Inicialización de la aplicación de Express
const app = express();                 // Creamos una instancia de Express para manejar las rutas y la lógica de servidor
const port = 3000;                     // Definimos el puerto en el que se ejecutará el servidor

// Configuración de middlewares para la aplicación
app.use(cors());                       // Habilitamos CORS para permitir peticiones desde otros dominios
app.use(express.json());               // Permitimos que el servidor reciba y procese JSON en el cuerpo de las solicitudes

// Configuración del pool de conexiones para MySQL
const pool = mysql.createPool({
  connectionLimit: 20,                 // Número máximo de conexiones simultáneas permitidas
  host: 'bbdd.ingenix.es',             // Dirección del servidor MySQL
  user: 'ddb250008',                   // Usuario de la base de datos
  password: 'LP%vV7S.%%$4BF',          // Contraseña del usuario
  database: 'ddb250008',               // Nombre de la base de datos a la que conectarse
});

// Prueba de conexión al pool para verificar que funciona correctamente
pool.getConnection((err, connection) => {
  if (err) {
    // Si hay un error en la conexión, lo mostramos en consola
    console.error('❌ Error al conectar al pool de base de datos:', err.message);
  } else {
    // Si la conexión es exitosa, lo mostramos y liberamos la conexión
    console.log('✅ Conectado al pool de base de datos');
    connection.release();  // 🔓 Liberar la conexión una vez realizada la prueba
  }
});

// 📌 Función genérica para ejecutar consultas SQL
const executeQuery = (query, params, res) => {
  // Obtener una conexión del pool
  pool.getConnection((err, connection) => {
    if (err) {
      // Si hay un error al obtener la conexión, devolvemos un error 500
      console.error('❌ Error al obtener conexión:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }

    // Ejecutar la consulta SQL con los parámetros proporcionados
    connection.query(query, params, (error, results) => {
      connection.release();  // 🔓 Liberar la conexión después de la consulta
      if (error) {
        // Si hay un error en la consulta, se muestra en consola y se devuelve un error 500
        console.error('❌ Error en la query:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }
      // Si la consulta es exitosa, se devuelve el resultado en formato JSON
      res.json({ success: true, data: results });
    });
  });
};

// 🔐 Login de usuario
app.post('/login', (req, res) => {
  const { email, password } = req.body; // Extraemos el email y el password del cuerpo de la solicitud
  const query = 'SELECT * FROM Empleados WHERE User = ? AND Password = ?'; // SQL para verificar credenciales
  executeQuery(query, [email, password], res); // Ejecutamos la consulta
});

// 📥 Obtener datos de un usuario
app.post('/usuario', (req, res) => {
  const { email } = req.body;  // Extraemos el email del cuerpo de la solicitud
  const query = 'SELECT Nombre, User, Password, Permisos FROM Empleados WHERE User = ?'; // SQL para obtener datos del usuario
  executeQuery(query, [email], res);   // Ejecutamos la consulta
});

// 🧾 Obtener todos los usuarios
app.get('/usuarios', (req, res) => {
  const query = 'SELECT User, Nombre, Password, Permisos FROM Empleados'; // SQL para obtener todos los usuarios
  executeQuery(query, [], res);   // Ejecutamos la consulta (no necesita parámetros)
});

// 🆕 Crear nuevo usuario
app.post('/nuevo-usuario', (req, res) => {
  const { User, Nombre, Password, Permisos } = req.body;  // Extraemos los datos del cuerpo de la solicitud
  if (!User || !Nombre || !Password) {
    // Si faltan datos requeridos, devolvemos un error 400
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }
  const query = 'INSERT INTO Empleados (User, Nombre, Password, Permisos) VALUES (?, ?, ?, ?)'; // SQL para insertar nuevo usuario
  executeQuery(query, [User, Nombre, Password, Permisos || 0], res); // Ejecutamos la consulta
});

// 🛠️ Actualizar usuario completo (por User)
app.post('/actualizar-usuario-completo', (req, res) => {
  const { User, Nombre, Password, Permisos } = req.body;  // Extraemos los datos del cuerpo de la solicitud
  if (!User) return res.status(400).json({ success: false, error: 'User requerido' });

  const query = 'UPDATE Empleados SET Nombre = ?, Password = ?, Permisos = ? WHERE User = ?'; // SQL para actualizar datos del usuario
  executeQuery(query, [Nombre, Password, Permisos, User], res);  // Ejecutamos la consulta
});

// ❌ Eliminar usuario por User
app.delete('/eliminar-usuario/:user', (req, res) => {
  const { user } = req.params;   // Extraemos el nombre de usuario de los parámetros de la URL
  const query = 'DELETE FROM Empleados WHERE User = ?'; // SQL para eliminar el usuario
  executeQuery(query, [user], res);   // Ejecutamos la consulta
});

// 📌 Obtener proyectos
app.get('/proyectos', (req, res) => {
  const query = 'SELECT Proyecto, Ubi1, Ubi2, Ubi3, Ubi4, HorasVuelos FROM UbicacionesProyectos'; // SQL para obtener proyectos
  executeQuery(query, [], res);   // Ejecutamos la consulta (no necesita parámetros)
});

// ✏️ Actualizar proyecto
app.put('/proyecto', (req, res) => {
  const { proyectoAntiguo, nuevoNombre, ubi1, ubi2, ubi3, ubi4, horasVuelos } = req.body;

  if (!proyectoAntiguo) {
    // Validación de datos
    return res.status(400).json({ success: false, error: 'Falta el nombre actual del proyecto' });
  }

  const query = `
    UPDATE UbicacionesProyectos
    SET Proyecto = ?, Ubi1 = ?, Ubi2 = ?, Ubi3 = ?, Ubi4 = ?, HorasVuelos = ?
    WHERE Proyecto = ?
  `;

  executeQuery(query, [nuevoNombre || proyectoAntiguo, ubi1, ubi2, ubi3, ubi4, horasVuelos || 0, proyectoAntiguo], res);
});

// 🚀 Iniciar servidor en el puerto definido
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
